// backend/core-api/repositories/dropletRepository.go

package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type DropletRepositoryImpl struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewDropletRepository(db *gorm.DB, redis *redis.Client) *DropletRepositoryImpl {
	return &DropletRepositoryImpl{
		db:    db,
		redis: redis,
	}
}

func (r *DropletRepositoryImpl) CreateDroplet(req *models.CreateDropletRequest) (*models.DropletResponse, error) {
	id := "droplet-" + req.Name // simple ID generation
	droplet := &models.Droplet{
		ID:        id,
		ClusterID: req.ClusterID,
		Name:      req.Name,
		Region:    req.Region,
		Size:      req.Size,
		Image:     req.Image,
		Status:    "provisioning",
		CreatedAt: time.Now(),
	}

	// Save to DB
	if err := r.db.Create(droplet).Error; err != nil {
		return nil, err
	}

	// If this droplet belongs to a cluster, try to append its id to the cluster's Droplets list
	if droplet.ClusterID != nil {
		var cluster models.Cluster
		if err := r.db.First(&cluster, "id = ?", droplet.ClusterID).Error; err == nil {
			// append droplet ID if not present
			exists := false
			for _, d := range cluster.Droplets {
				if d == droplet.ID {
					exists = true
					break
				}
			}
			if !exists {
				cluster.Droplets = append(cluster.Droplets, droplet.ID)
				r.db.Save(&cluster)
				if r.redis != nil {
					// Invalidate cluster cache
					r.redis.Del(context.Background(), "cluster:"+cluster.ID)
				}
			}
		}
	}

	// Fetch with cluster relation loaded so the response contains cluster metadata
	if err := r.db.Preload("Cluster").First(droplet, "id = ?", id).Error; err != nil {
		// Not fatal — return what we have
	}

	// Simulate provisioning
	go func() {
		time.Sleep(2 * time.Second)
		droplet.Status = "active"
		ip := "192.168.1.100" // mock IP
		droplet.IPAddress = &ip
		r.db.Save(droplet)
		// Invalidate cache
		if r.redis != nil {
			r.redis.Del(context.Background(), "droplet:"+id)
		}
	}()

	return &models.DropletResponse{
		Droplet: droplet,
		Message: "Droplet creation initiated",
	}, nil
}

func (r *DropletRepositoryImpl) GetDroplet(id string) (*models.Droplet, error) {
	// Check cache first (if redis configured)
	if r.redis != nil {
		cached, err := r.redis.Get(context.Background(), "droplet:"+id).Result()
		if err == nil {
			var droplet models.Droplet
			if json.Unmarshal([]byte(cached), &droplet) == nil {
				return &droplet, nil
			}
		}
	}

	// Not in cache, get from DB
	var droplet models.Droplet
	if err := r.db.Preload("Cluster").First(&droplet, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("droplet not found")
		}
		return nil, err
	}

	// Cache it
	if r.redis != nil {
		data, _ := json.Marshal(droplet)
		r.redis.Set(context.Background(), "droplet:"+id, data, time.Minute*5)
	}

	return &droplet, nil
}

func (r *DropletRepositoryImpl) ListDroplets() ([]*models.Droplet, error) {
	var droplets []*models.Droplet
	if err := r.db.Preload("Cluster").Find(&droplets).Error; err != nil {
		return nil, err
	}
	return droplets, nil
}

func (r *DropletRepositoryImpl) DeleteDroplet(id string) error {
	if err := r.db.Delete(&models.Droplet{}, "id = ?", id).Error; err != nil {
		return err
	}
	// Invalidate cache
	if r.redis != nil {
		r.redis.Del(context.Background(), "droplet:"+id)
	}
	return nil
}
