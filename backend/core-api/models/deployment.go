package models

import "time"

type Deployment struct {
	ID        string    `json:"id"`
	ClusterID string    `json:"cluster_id"`
	Version   string    `json:"version"`
	Strategy  string    `json:"strategy"`       // canary|blue-green|rolling
	Target    int       `json:"target_percent"` // for canary
	Status    string    `json:"status"`         // pending|in-progress|rolled_out|rolled_back|failed
	StartedAt time.Time `json:"started_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Logs      []string  `json:"logs"`
}

type StartDeploymentRequest struct {
	ClusterID     string `json:"cluster_id"`
	Version       string `json:"version"`
	Strategy      string `json:"strategy"`
	TargetPercent int    `json:"target_percent"`
}
