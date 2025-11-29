package interfaces

import "github.com/AvinashMahala/ClusterGenie/backend/core-api/models"

type DeploymentRepository interface {
	Create(d *models.Deployment) error
	Get(id string) (*models.Deployment, error)
	List(clusterID string) ([]*models.Deployment, error)
	Update(d *models.Deployment) error
	Delete(id string) error
}
