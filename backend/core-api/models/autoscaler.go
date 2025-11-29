package models

import "time"

// AutoscalePolicy represents an autoscaling policy for a cluster
type AutoscalePolicy struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	ClusterID     string    `json:"cluster_id"`
	Type          string    `json:"type"` // e.g. "metrics", "time_of_day", "cost"
	Enabled       bool      `json:"enabled"`
	MinReplicas   int       `json:"min_replicas"`
	MaxReplicas   int       `json:"max_replicas"`
	MetricType    string    `json:"metric_type"`    // cpu/memory/network
	MetricTrigger float64   `json:"metric_trigger"` // metric threshold (e.g. 0.8 for 80%)
	TimeWindow    string    `json:"time_window"`    // e.g. "09:00-18:00"
	CostLimit     float64   `json:"cost_limit"`     // example cost constraint
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Create/update requests
type CreateAutoscalePolicyRequest struct {
	Name          string  `json:"name"`
	ClusterID     string  `json:"cluster_id"`
	Type          string  `json:"type"`
	Enabled       bool    `json:"enabled"`
	MinReplicas   int     `json:"min_replicas"`
	MaxReplicas   int     `json:"max_replicas"`
	MetricType    string  `json:"metric_type"`
	MetricTrigger float64 `json:"metric_trigger"`
	TimeWindow    string  `json:"time_window"`
	CostLimit     float64 `json:"cost_limit"`
}

type UpdateAutoscalePolicyRequest = CreateAutoscalePolicyRequest
