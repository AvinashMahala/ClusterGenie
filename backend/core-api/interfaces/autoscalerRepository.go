package interfaces

import "github.com/AvinashMahala/ClusterGenie/backend/core-api/models"

type AutoscalerRepository interface {
	CreatePolicy(p *models.AutoscalePolicy) error
	UpdatePolicy(p *models.AutoscalePolicy) error
	GetPolicy(id string) (*models.AutoscalePolicy, error)
	ListPolicies(clusterID string) ([]*models.AutoscalePolicy, error)
	DeletePolicy(id string) error
}
