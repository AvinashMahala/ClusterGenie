// backend/core-api/models/job.go

package models

import "time"

type Job struct {
	ID          string     `json:"id" gorm:"primaryKey"`
	ClusterID   string     `json:"cluster_id"`
	Type        string     `json:"type"`   // provision, diagnose, scale, monitor
	Status      string     `json:"status"` // pending, running, completed, failed
	CreatedAt   time.Time  `json:"created_at" gorm:"column:created_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty" gorm:"column:completed_at"`
	Result      string     `json:"result,omitempty"`
	Error       string     `json:"error,omitempty"`
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
	Jobs []*Job `json:"jobs"`
}
