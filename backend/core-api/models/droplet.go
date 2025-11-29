// backend/core-api/models/droplet.go

package models

import "time"

type Droplet struct {
	ID        string  `json:"id" gorm:"primaryKey"`
	ClusterID *string `json:"cluster_id,omitempty" gorm:"column:cluster_id"`
	// Cluster object (optional) when returning droplet responses
	Cluster   *Cluster  `json:"cluster,omitempty" gorm:"foreignKey:ClusterID;references:ID"`
	Name      string    `json:"name" example:"web-01"`
	Region    string    `json:"region" example:"nyc3"`
	Size      string    `json:"size" example:"s-1vcpu-1gb"`
	Image     string    `json:"image" example:"ubuntu-20-04-x64"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	IPAddress *string   `json:"ip_address,omitempty" gorm:"column:ip_address"`
}

type CreateDropletRequest struct {
	Name string `json:"name" example:"web-01"`
	// Optional cluster ID to assign this droplet to
	ClusterID *string `json:"cluster_id,omitempty"`
	Region    string  `json:"region" example:"nyc3"`
	Size      string  `json:"size" example:"s-1vcpu-1gb"`
	Image     string  `json:"image" example:"ubuntu-20-04-x64"`
}

type DropletResponse struct {
	Droplet *Droplet `json:"droplet"`
	Message string   `json:"message"`
}

type ListDropletsResponse struct {
	Droplets []*Droplet `json:"droplets"`
}

type DeleteDropletResponse struct {
	Message string `json:"message"`
}
