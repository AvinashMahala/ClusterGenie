// backend/core-api/interfaces/dropletRepository.go

package interfaces

import (
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

type DropletRepository interface {
	CreateDroplet(req *models.CreateDropletRequest) (*models.DropletResponse, error)
	GetDroplet(id string) (*models.Droplet, error)
	ListDroplets() ([]*models.Droplet, error)
	DeleteDroplet(id string) error
	UpdateDroplet(d *models.Droplet) error
}
