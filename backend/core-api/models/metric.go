// backend/core-api/models/metric.go

package models

import "time"

type Metric struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	ClusterID string    `json:"cluster_id" gorm:"type:varchar(255)"`
	Type      string    `json:"type"` // cpu, memory, disk, network
	Value     float64   `json:"value"`
	Timestamp time.Time `json:"timestamp"`
	Unit      string    `json:"unit"`
}

type GetMetricsRequest struct {
	ClusterID string `json:"cluster_id"`
	Type      string `json:"type"`
	Page      int    `json:"page"`
	PageSize  int    `json:"page_size"`
}

type GetMetricsResponse struct {
	Metrics  []Metric `json:"metrics"`
	Period   string   `json:"period"`
	Page     int      `json:"page"`
	PageSize int      `json:"page_size"`
	Total    int64    `json:"total_count"`
}

type DeleteMetricsRequest struct {
	ClusterID       string `json:"cluster_id"`
	Type            string `json:"type"`
	KeepRecentCount int32  `json:"keep_recent_count"` // 0 means delete all
}

type DeleteMetricsResponse struct {
	DeletedCount int32  `json:"deleted_count"`
	Message      string `json:"message"`
}

type HealthCheckResponse struct {
	ClusterID string    `json:"cluster_id"`
	Status    string    `json:"status"` // healthy, warning, critical
	Issues    []string  `json:"issues"`
	Timestamp time.Time `json:"timestamp"`
}
