// backend/core-api/services/monitoringService.go

package services

import (
	"math/rand"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

type MonitoringService struct {
	metricRepo interfaces.MetricRepository
}

func NewMonitoringService(metricRepo interfaces.MetricRepository) *MonitoringService {
	return &MonitoringService{
		metricRepo: metricRepo,
	}
}

func (s *MonitoringService) GetMetrics(req *models.GetMetricsRequest) (*models.GetMetricsResponse, error) {
	// Generate mock metrics if none exist for recent time
	s.generateMockMetricsIfNeeded(req.ClusterID)

	return s.metricRepo.GetMetrics(req)
}

func (s *MonitoringService) DeleteMetrics(req *models.DeleteMetricsRequest) (*models.DeleteMetricsResponse, error) {
	return s.metricRepo.DeleteMetrics(req)
}

func (s *MonitoringService) PerformHealthCheck(clusterID string) (*models.HealthCheckResponse, error) {
	// Get recent metrics
	metricsReq := &models.GetMetricsRequest{
		ClusterID: clusterID,
	}
	metricsResp, err := s.GetMetrics(metricsReq)
	if err != nil {
		return nil, err
	}

	// Analyze metrics for health
	status := "healthy"
	var issues []string

	for _, metric := range metricsResp.Metrics {
		switch metric.Type {
		case "cpu":
			if metric.Value > 80 {
				status = "warning"
				issues = append(issues, "High CPU usage detected")
			}
		case "memory":
			if metric.Value > 85 {
				status = "critical"
				issues = append(issues, "High memory usage detected")
			}
		case "disk":
			if metric.Value > 90 {
				status = "critical"
				issues = append(issues, "Low disk space")
			}
		}
	}

	return &models.HealthCheckResponse{
		ClusterID: clusterID,
		Status:    status,
		Issues:    issues,
		Timestamp: time.Now(),
	}, nil
}

func (s *MonitoringService) generateMockMetricsIfNeeded(clusterID string) {
	// Check if we have recent metrics (last 5 minutes)
	hasRecent, err := s.metricRepo.HasRecentMetrics(clusterID)
	if err != nil {
		// Log error but continue
		return
	}

	if !hasRecent {
		s.generateMockMetrics(clusterID)
	}
}

func (s *MonitoringService) generateMockMetrics(clusterID string) {
	metricTypes := []string{"cpu", "memory", "disk", "network"}

	// Generate metrics for the last hour
	now := time.Now()
	for i := 0; i < 60; i++ { // 60 minutes
		timestamp := now.Add(-time.Duration(i) * time.Minute)

		for _, metricType := range metricTypes {
			metric := &models.Metric{
				ID:        generateMetricID(clusterID, metricType, timestamp),
				ClusterID: clusterID,
				Type:      metricType,
				Timestamp: timestamp,
				Unit:      s.getUnitForType(metricType),
			}

			// Generate realistic values
			switch metricType {
			case "cpu":
				metric.Value = 10 + rand.Float64()*60 // 10-70%
			case "memory":
				metric.Value = 20 + rand.Float64()*60 // 20-80%
			case "disk":
				metric.Value = 5 + rand.Float64()*20 // 5-25%
			case "network":
				metric.Value = rand.Float64() * 100 // 0-100 Mbps
			}

			s.metricRepo.CreateMetric(metric)
		}
	}
}

func (s *MonitoringService) getUnitForType(metricType string) string {
	switch metricType {
	case "cpu":
		return "%"
	case "memory":
		return "%"
	case "disk":
		return "%"
	case "network":
		return "Mbps"
	default:
		return ""
	}
}

func generateMetricID(clusterID, metricType string, timestamp time.Time) string {
	return clusterID + "-" + metricType + "-" + timestamp.Format("20060102150405")
}
