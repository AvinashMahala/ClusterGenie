// backend/core-api/services/provisioningService.go

package services

import (
	"errors"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

type ProvisioningService struct {
	dropletRepo interfaces.DropletRepository
	clusterSvc  *ClusterService
	producer    interface {
		PublishEvent(topic, key string, event interface{}) error
	} // mock interface
}

func NewProvisioningService(dropletRepo interfaces.DropletRepository, producer interface {
	PublishEvent(topic, key string, event interface{}) error
}, clusterSvc *ClusterService) *ProvisioningService {
	return &ProvisioningService{
		dropletRepo: dropletRepo,
		producer:    producer,
		clusterSvc:  clusterSvc,
	}
}

func (s *ProvisioningService) CreateDroplet(req *models.CreateDropletRequest) (*models.DropletResponse, error) {
	// Business logic: validate request
	if req.Name == "" || req.Region == "" {
		return nil, errors.New("name and region are required")
	}
	// If cluster provided, validate it exists
	if req.ClusterID != nil {
		if s.clusterSvc == nil {
			return nil, errors.New("cluster validation unavailable")
		}
		if _, err := s.clusterSvc.GetCluster(*req.ClusterID); err != nil {
			return nil, errors.New("cluster not found")
		}
	}
	resp, err := s.dropletRepo.CreateDroplet(req)
	if err != nil {
		return nil, err
	}

	// Add droplet to cluster's droplet list when applicable
	if req.ClusterID != nil && s.clusterSvc != nil {
		_ = s.clusterSvc.AddDropletToCluster(*req.ClusterID, resp.Droplet.ID)
	}

	// Publish event
	event := map[string]interface{}{
		"type":    "droplet_created",
		"droplet": resp.Droplet,
	}
	if s.producer != nil {
		s.producer.PublishEvent("cluster-events", resp.Droplet.ID, event)
	}

	return resp, nil
}

func (s *ProvisioningService) GetDroplet(id string) (*models.Droplet, error) {
	return s.dropletRepo.GetDroplet(id)
}

func (s *ProvisioningService) ListDroplets() ([]*models.Droplet, error) {
	return s.dropletRepo.ListDroplets()
}

func (s *ProvisioningService) DeleteDroplet(id string) error {
	return s.dropletRepo.DeleteDroplet(id)
}

func (s *ProvisioningService) ScaleCluster(clusterID string, action string) error {
	// Simple scaling logic: add/remove droplets
	if action == "scale_up" {
		// Create a new droplet for the cluster
		cid := clusterID
		req := &models.CreateDropletRequest{
			Name:      "scaled-droplet",
			ClusterID: &cid,
			Region:    "nyc1", // Default region
			Size:      "s-1vcpu-1gb",
			Image:     "ubuntu-22-04-x64",
		}
		_, err := s.CreateDroplet(req)
		return err
	} else if action == "scale_down" {
		// Remove a droplet (simplified - remove the first one)
		droplets, err := s.ListDroplets()
		if err != nil || len(droplets) == 0 {
			return errors.New("no droplets to scale down")
		}
		return s.DeleteDroplet(droplets[0].ID)
	}
	return errors.New("invalid scale action")
}
