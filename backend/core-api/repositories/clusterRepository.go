// backend/core-api/repositories/clusterRepository.go

package repositories

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type ClusterRepository struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewClusterRepository(db *gorm.DB, redis *redis.Client) interfaces.ClusterRepository {
	return &ClusterRepository{
		db:    db,
		redis: redis,
	}
}

func (r *ClusterRepository) CreateCluster(cluster *models.Cluster) (*models.Cluster, error) {
	cluster.ID = "cluster-" + uuid.NewString()
	cluster.LastChecked = time.Now()
	if err := r.db.Create(cluster).Error; err != nil {
		return nil, err
	}
	return cluster, nil
}

func (r *ClusterRepository) GetCluster(id string) (*models.Cluster, error) {
	// Check cache
	cached, err := r.redis.Get(context.Background(), "cluster:"+id).Result()
	if err == nil {
		var cluster models.Cluster
		if json.Unmarshal([]byte(cached), &cluster) == nil {
			return &cluster, nil
		}
	}

	// From DB
	var cluster models.Cluster
	if err := r.db.First(&cluster, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("cluster not found")
		}
		return nil, err
	}

	// Cache
	data, _ := json.Marshal(cluster)
	r.redis.Set(context.Background(), "cluster:"+id, data, time.Minute*5)

	return &cluster, nil
}

func (r *ClusterRepository) ListClusters() ([]*models.Cluster, error) {
	var clusters []*models.Cluster
	if err := r.db.Find(&clusters).Error; err != nil {
		return nil, err
	}
	return clusters, nil
}

func (r *ClusterRepository) UpdateCluster(id string, updatedCluster *models.Cluster) (*models.Cluster, error) {
	updatedCluster.ID = id
	updatedCluster.LastChecked = time.Now()
	if err := r.db.Save(updatedCluster).Error; err != nil {
		return nil, err
	}
	// Invalidate cache
	r.redis.Del(context.Background(), "cluster:"+id)
	return updatedCluster, nil
}

func (r *ClusterRepository) DeleteCluster(id string) error {
	if err := r.db.Delete(&models.Cluster{}, "id = ?", id).Error; err != nil {
		return err
	}
	r.redis.Del(context.Background(), "cluster:"+id)
	return nil
}
