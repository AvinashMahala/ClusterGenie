// backend/core-api/models/job.go

package models

import "time"

type Job struct {
	ID          string     `json:"id" gorm:"primaryKey" example:"job-1234"`
	ClusterID   string     `json:"cluster_id" gorm:"type:varchar(255)" example:"cluster-1"`
	Type        string     `json:"type" example:"provision"` // provision, diagnose, scale, monitor
	Status      string     `json:"status" example:"pending"` // pending, running, completed, failed
	CreatedAt   time.Time  `json:"created_at" gorm:"column:created_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty" gorm:"column:completed_at"`
	Result      string     `json:"result,omitempty" example:"OK"`
	Error       string     `json:"error,omitempty" example:""`
	Progress    int        `json:"progress" gorm:"default:0"`
	TraceID     string     `json:"trace_id,omitempty"`
	Parameters  string     `json:"parameters,omitempty" gorm:"type:text"` // JSON string of parameters
}

type CreateJobRequest struct {
	Type       string            `json:"type"`
	Parameters map[string]string `json:"parameters"`
}

type JobResponse struct {
	Job     *Job   `json:"job"`
	Message string `json:"message"`
}

type ListJobsResponse struct {
	Jobs     []*Job `json:"jobs"`
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
	Total    int64  `json:"total"`
}

type GetJobsRequest struct {
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
	SortBy   string `json:"sort_by"`
	SortDir  string `json:"sort_dir"`
}
