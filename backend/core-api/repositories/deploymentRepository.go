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

type DeploymentRepository struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewDeploymentRepository(db *gorm.DB, redis *redis.Client) interfaces.DeploymentRepository {
	return &DeploymentRepository{db: db, redis: redis}
}

func (r *DeploymentRepository) Create(d *models.Deployment) error {
	if r.redis == nil {
		return errors.New("redis not configured")
	}
	if d.ID == "" {
		d.ID = "deploy-" + uuid.NewString()
	}
	now := time.Now()
	d.StartedAt = now
	d.UpdatedAt = now
	key := "deployment:" + d.ID
	data, err := json.Marshal(d)
	if err != nil {
		return err
	}
	if err := r.redis.Set(context.Background(), key, data, 0).Err(); err != nil {
		return err
	}
	idx := "deployments:cluster:" + d.ClusterID
	if err := r.redis.SAdd(context.Background(), idx, d.ID).Err(); err != nil {
		return err
	}
	return nil
}

func (r *DeploymentRepository) Get(id string) (*models.Deployment, error) {
	if r.redis == nil {
		return nil, errors.New("redis not configured")
	}
	key := "deployment:" + id
	str, err := r.redis.Get(context.Background(), key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, errors.New("not found")
		}
		return nil, err
	}
	var d models.Deployment
	if err := json.Unmarshal([]byte(str), &d); err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *DeploymentRepository) List(clusterID string) ([]*models.Deployment, error) {
	if r.redis == nil {
		return nil, errors.New("redis not configured")
	}
	idx := "deployments:cluster:" + clusterID
	ids, err := r.redis.SMembers(context.Background(), idx).Result()
	if err != nil {
		return nil, err
	}
	out := []*models.Deployment{}
	for _, id := range ids {
		d, err := r.Get(id)
		if err != nil {
			continue
		}
		out = append(out, d)
	}
	return out, nil
}

func (r *DeploymentRepository) Update(d *models.Deployment) error {
	if r.redis == nil {
		return errors.New("redis not configured")
	}
	d.UpdatedAt = time.Now()
	key := "deployment:" + d.ID
	data, err := json.Marshal(d)
	if err != nil {
		return err
	}
	return r.redis.Set(context.Background(), key, data, 0).Err()
}

func (r *DeploymentRepository) Delete(id string) error {
	d, err := r.Get(id)
	if err != nil {
		return err
	}
	key := "deployment:" + id
	if err := r.redis.Del(context.Background(), key).Err(); err != nil {
		return err
	}
	idx := "deployments:cluster:" + d.ClusterID
	return r.redis.SRem(context.Background(), idx, id).Err()
}
