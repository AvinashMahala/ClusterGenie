// backend/core-api/interfaces/metricRepository.go

package interfaces

import "github.com/AvinashMahala/ClusterGenie/backend/core-api/models"

type MetricRepository interface {
	GetMetrics(req *models.GetMetricsRequest) (*models.GetMetricsResponse, error)
	CreateMetric(metric *models.Metric) error
	ListMetricsByCluster(clusterID string) ([]*models.Metric, error)
	DeleteMetrics(req *models.DeleteMetricsRequest) (*models.DeleteMetricsResponse, error)
	HasRecentMetrics(clusterID string) (bool, error)
}
