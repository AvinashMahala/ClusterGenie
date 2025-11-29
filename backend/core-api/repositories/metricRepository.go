// backend/core-api/repositories/metricRepository.go

package repositories

import (
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type MetricRepository struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewMetricRepository(db *gorm.DB, redis *redis.Client) interfaces.MetricRepository {
	return &MetricRepository{
		db:    db,
		redis: redis,
	}
}

func (r *MetricRepository) GetMetrics(req *models.GetMetricsRequest) (*models.GetMetricsResponse, error) {
	var metrics []models.Metric

	// Pagination defaults
	if req.PageSize <= 0 {
		req.PageSize = 50
	}
	if req.Page <= 0 {
		req.Page = 1
	}

	query := r.db.Where("cluster_id = ?", req.ClusterID)
	if req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}

	var total int64
	if err := query.Model(&models.Metric{}).Count(&total).Error; err != nil {
		return nil, err
	}

	offset := (req.Page - 1) * req.PageSize
	if err := query.Order("timestamp desc").Limit(req.PageSize).Offset(offset).Find(&metrics).Error; err != nil {
		return nil, err
	}

	return &models.GetMetricsResponse{
		Metrics:  metrics,
		Period:   "1h",
		Page:     req.Page,
		PageSize: req.PageSize,
		Total:    total,
	}, nil
}

func (r *MetricRepository) CreateMetric(metric *models.Metric) error {
	if metric.Timestamp.IsZero() {
		metric.Timestamp = time.Now()
	}

	return r.db.Create(metric).Error
}

func (r *MetricRepository) ListMetricsByCluster(clusterID string) ([]*models.Metric, error) {
	var metrics []*models.Metric
	if err := r.db.Where("cluster_id = ?", clusterID).Find(&metrics).Error; err != nil {
		return nil, err
	}
	return metrics, nil
}

func (r *MetricRepository) DeleteMetrics(req *models.DeleteMetricsRequest) (*models.DeleteMetricsResponse, error) {
	query := r.db.Where("cluster_id = ?", req.ClusterID)
	if req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}
	result := query.Delete(&models.Metric{})
	return &models.DeleteMetricsResponse{
		DeletedCount: int32(result.RowsAffected),
		Message:      "Metrics deleted successfully",
	}, nil
}

func (r *MetricRepository) HasRecentMetrics(clusterID string) (bool, error) {
	var count int64
	fiveMinutesAgo := time.Now().Add(-5 * time.Minute)
	err := r.db.Model(&models.Metric{}).Where("cluster_id = ? AND timestamp >= ?", clusterID, fiveMinutesAgo).Count(&count).Error
	return count > 0, err
}
