// backend/core-api/models/cluster.go

package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

type Cluster struct {
	ID          string      `json:"id" gorm:"primaryKey" example:"cluster-1"`
	Name        string      `json:"name" example:"production-cluster"`
	Region      string      `json:"region" example:"nyc3"`
	Droplets    StringSlice `json:"droplets" gorm:"type:text"`
	Status      string      `json:"status" example:"healthy"` // healthy, warning, critical
	LastChecked time.Time   `json:"last_checked" gorm:"column:last_checked"`
}

type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	if len(s) == 0 {
		return []byte("[]"), nil
	}
	return json.Marshal([]string(s))
}

func (s *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*s = []string{}
		return nil
	}
	var raw []byte
	switch v := value.(type) {
	case string:
		raw = []byte(v)
	case []byte:
		raw = v
	default:
		return fmt.Errorf("unsupported value for StringSlice: %T", value)
	}
	if len(raw) == 0 {
		*s = []string{}
		return nil
	}
	return json.Unmarshal(raw, (*[]string)(s))
}

type DiagnoseClusterRequest struct {
	ClusterID string `json:"cluster_id"`
}

type DiagnoseClusterResponse struct {
	Cluster         *Cluster `json:"cluster"`
	Insights        []string `json:"insights"`
	Recommendations []string `json:"recommendations"`
}

type CreateClusterRequest struct {
	Name   string `json:"name"`
	Region string `json:"region"`
}

type UpdateClusterRequest struct {
	Name   string `json:"name,omitempty"`
	Region string `json:"region,omitempty"`
	Status string `json:"status,omitempty"`
}

type ClusterResponse struct {
	Cluster *Cluster `json:"cluster"`
	Message string   `json:"message"`
}

type ListClustersResponse struct {
	Clusters []*Cluster `json:"clusters"`
}

type DeleteClusterResponse struct {
	Message string `json:"message"`
}
