package interfaces

import "github.com/AvinashMahala/ClusterGenie/backend/core-api/models"

type ProviderRepository interface {
	Create(p *models.Provider) error
	Update(p *models.Provider) error
	Get(id string) (*models.Provider, error)
	List() ([]*models.Provider, error)
	Delete(id string) error
}
