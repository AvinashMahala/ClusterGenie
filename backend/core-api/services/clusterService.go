// backend/core-api/services/clusterService.go

package services

import (
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

type ClusterService struct {
	clusterRepo interfaces.ClusterRepository
}

func NewClusterService(clusterRepo interfaces.ClusterRepository) *ClusterService {
	return &ClusterService{
		clusterRepo: clusterRepo,
	}
}

func (s *ClusterService) CreateCluster(req *models.CreateClusterRequest) (*models.ClusterResponse, error) {
	cluster := &models.Cluster{
		Name:     req.Name,
		Region:   req.Region,
		Droplets: models.StringSlice{}, // Start with empty droplets
		Status:   "healthy",
	}

	createdCluster, err := s.clusterRepo.CreateCluster(cluster)
	if err != nil {
		return nil, err
	}

	return &models.ClusterResponse{
		Cluster: createdCluster,
		Message: "Cluster created successfully",
	}, nil
}

func (s *ClusterService) GetCluster(id string) (*models.Cluster, error) {
	cluster, err := s.clusterRepo.GetCluster(id)
	if err != nil {
		return nil, err
	}

	// Ensure droplets is never nil
	if cluster.Droplets == nil {
		cluster.Droplets = models.StringSlice{}
	}

	return cluster, nil
}

func (s *ClusterService) ListClusters() ([]*models.Cluster, error) {
	clusters, err := s.clusterRepo.ListClusters()
	if err != nil {
		return nil, err
	}

	// Ensure droplets is never nil
	for _, cluster := range clusters {
		if cluster.Droplets == nil {
			cluster.Droplets = models.StringSlice{}
		}
	}

	return clusters, nil
}

func (s *ClusterService) UpdateCluster(id string, req *models.UpdateClusterRequest) (*models.ClusterResponse, error) {
	existingCluster, err := s.clusterRepo.GetCluster(id)
	if err != nil {
		return nil, err
	}

	// Update fields
	if req.Name != "" {
		existingCluster.Name = req.Name
	}
	if req.Region != "" {
		existingCluster.Region = req.Region
	}
	if req.Status != "" {
		existingCluster.Status = req.Status
	}

	updatedCluster, err := s.clusterRepo.UpdateCluster(id, existingCluster)
	if err != nil {
		return nil, err
	}

	return &models.ClusterResponse{
		Cluster: updatedCluster,
		Message: "Cluster updated successfully",
	}, nil
}

func (s *ClusterService) DeleteCluster(id string) (*models.DeleteClusterResponse, error) {
	err := s.clusterRepo.DeleteCluster(id)
	if err != nil {
		return nil, err
	}

	return &models.DeleteClusterResponse{
		Message: "Cluster deleted successfully",
	}, nil
}

func (s *ClusterService) AddDropletToCluster(clusterID, dropletID string) error {
	cluster, err := s.clusterRepo.GetCluster(clusterID)
	if err != nil {
		return err
	}

	// Check if droplet is already in cluster
	for _, d := range cluster.Droplets {
		if d == dropletID {
			return nil // Already exists
		}
	}

	cluster.Droplets = append(cluster.Droplets, dropletID)
	_, err = s.clusterRepo.UpdateCluster(clusterID, cluster)
	return err
}

func (s *ClusterService) RemoveDropletFromCluster(clusterID, dropletID string) error {
	cluster, err := s.clusterRepo.GetCluster(clusterID)
	if err != nil {
		return err
	}

	// Remove droplet from slice
	for i, d := range cluster.Droplets {
		if d == dropletID {
			cluster.Droplets = append(cluster.Droplets[:i], cluster.Droplets[i+1:]...)
			break
		}
	}

	_, err = s.clusterRepo.UpdateCluster(clusterID, cluster)
	return err
}
