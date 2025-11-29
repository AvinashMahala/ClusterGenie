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

type AutoscalerRepository struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewAutoscalerRepository(db *gorm.DB, redis *redis.Client) interfaces.AutoscalerRepository {
	return &AutoscalerRepository{db: db, redis: redis}
}

func (r *AutoscalerRepository) CreatePolicy(p *models.AutoscalePolicy) error {
	if r.redis == nil {
		return errors.New("redis not configured")
	}
	if p.ID == "" {
		p.ID = "policy-" + uuid.NewString()
	}
	now := time.Now()
	p.CreatedAt = now
	p.UpdatedAt = now

	key := "autoscale_policy:" + p.ID
	payload, err := json.Marshal(p)
	if err != nil {
		return err
	}
	if err := r.redis.Set(context.Background(), key, payload, 0).Err(); err != nil {
		return err
	}
	// add to cluster index
	idx := "autoscale_policies:cluster:" + p.ClusterID
	if err := r.redis.SAdd(context.Background(), idx, p.ID).Err(); err != nil {
		return err
	}
	return nil
}

func (r *AutoscalerRepository) UpdatePolicy(p *models.AutoscalePolicy) error {
	if r.redis == nil {
		return errors.New("redis not configured")
	}
	p.UpdatedAt = time.Now()
	key := "autoscale_policy:" + p.ID
	payload, err := json.Marshal(p)
	if err != nil {
		return err
	}
	return r.redis.Set(context.Background(), key, payload, 0).Err()
}

func (r *AutoscalerRepository) GetPolicy(id string) (*models.AutoscalePolicy, error) {
	if r.redis == nil {
		return nil, errors.New("redis not configured")
	}
	key := "autoscale_policy:" + id
	str, err := r.redis.Get(context.Background(), key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, errors.New("policy not found")
		}
		return nil, err
	}
	var p models.AutoscalePolicy
	if err := json.Unmarshal([]byte(str), &p); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *AutoscalerRepository) ListPolicies(clusterID string) ([]*models.AutoscalePolicy, error) {
	if r.redis == nil {
		return nil, errors.New("redis not configured")
	}
	idx := "autoscale_policies:cluster:" + clusterID
	ids, err := r.redis.SMembers(context.Background(), idx).Result()
	if err != nil {
		return nil, err
	}
	out := []*models.AutoscalePolicy{}
	for _, id := range ids {
		p, err := r.GetPolicy(id)
		if err != nil {
			// skip missing/corrupt entries
			continue
		}
		out = append(out, p)
	}
	return out, nil
}

func (r *AutoscalerRepository) DeletePolicy(id string) error {
	if r.redis == nil {
		return errors.New("redis not configured")
	}
	p, err := r.GetPolicy(id)
	if err != nil {
		return err
	}
	key := "autoscale_policy:" + id
	if err := r.redis.Del(context.Background(), key).Err(); err != nil {
		return err
	}
	idx := "autoscale_policies:cluster:" + p.ClusterID
	if err := r.redis.SRem(context.Background(), idx, id).Err(); err != nil {
		return err
	}
	return nil
}
