package repositories

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type ProviderRepository struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewProviderRepository(db *gorm.DB, redis *redis.Client) interfaces.ProviderRepository {
	return &ProviderRepository{db: db, redis: redis}
}

func (r *ProviderRepository) Create(p *models.Provider) error {
	if r.redis == nil {
		return errors.New("redis not configured")
	}
	if p.ID == "" {
		p.ID = "prov-" + uuid.NewString()
	}
	key := "provider:" + p.ID
	data, err := json.Marshal(p)
	if err != nil {
		return err
	}
	if err := r.redis.Set(context.Background(), key, data, 0).Err(); err != nil {
		return err
	}
	// maintain listing set
	if err := r.redis.SAdd(context.Background(), "providers:all", p.ID).Err(); err != nil {
		return err
	}
	return nil
}

func (r *ProviderRepository) Update(p *models.Provider) error {
	if r.redis == nil {
		return errors.New("redis not configured")
	}
	key := "provider:" + p.ID
	data, err := json.Marshal(p)
	if err != nil {
		return err
	}
	return r.redis.Set(context.Background(), key, data, 0).Err()
}

func (r *ProviderRepository) Get(id string) (*models.Provider, error) {
	if r.redis == nil {
		return nil, errors.New("redis not configured")
	}
	key := "provider:" + id
	str, err := r.redis.Get(context.Background(), key).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, errors.New("not found")
		}
		return nil, err
	}
	var p models.Provider
	if err := json.Unmarshal([]byte(str), &p); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *ProviderRepository) List() ([]*models.Provider, error) {
	if r.redis == nil {
		return nil, errors.New("redis not configured")
	}
	ids, err := r.redis.SMembers(context.Background(), "providers:all").Result()
	if err != nil {
		return nil, err
	}
	out := []*models.Provider{}
	for _, id := range ids {
		p, err := r.Get(id)
		if err != nil {
			continue
		}
		out = append(out, p)
	}
	return out, nil
}

func (r *ProviderRepository) Delete(id string) error {
	if r.redis == nil {
		return errors.New("redis not configured")
	}
	key := "provider:" + id
	if err := r.redis.Del(context.Background(), key).Err(); err != nil {
		return err
	}
	return r.redis.SRem(context.Background(), "providers:all", id).Err()
}
