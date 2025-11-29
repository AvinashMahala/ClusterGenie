// backend/core-api/interfaces/clusterRepository.go

package interfaces

import "github.com/AvinashMahala/ClusterGenie/backend/core-api/models"

type ClusterRepository interface {
	CreateCluster(cluster *models.Cluster) (*models.Cluster, error)
	GetCluster(id string) (*models.Cluster, error)
	ListClusters() ([]*models.Cluster, error)
	UpdateCluster(id string, cluster *models.Cluster) (*models.Cluster, error)
	DeleteCluster(id string) error
}
