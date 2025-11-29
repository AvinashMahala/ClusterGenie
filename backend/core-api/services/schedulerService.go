package services

import (
	"errors"
	"fmt"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

type SchedulerService struct {
	providerRepo interfaces.ProviderRepository
	dropletRepo  interfaces.DropletRepository
}

func NewSchedulerService(provRepo interfaces.ProviderRepository, dropletRepo interfaces.DropletRepository) *SchedulerService {
	return &SchedulerService{providerRepo: provRepo, dropletRepo: dropletRepo}
}

func (s *SchedulerService) ListProviders() ([]*models.Provider, error) {
	return s.providerRepo.List()
}

func (s *SchedulerService) CreateProvider(req *models.Provider) (*models.Provider, error) {
	if req.Name == "" {
		return nil, errors.New("name required")
	}
	if err := s.providerRepo.Create(req); err != nil {
		return nil, err
	}
	return req, nil
}

// SchedulePlacement picks a provider based on capacity and optional preference
func (s *SchedulerService) SchedulePlacement(clusterID string, preferred string, avoid string) (*models.Provider, string, error) {
	provs, err := s.providerRepo.List()
	if err != nil {
		return nil, "", err
	}
	// prefer exact provider if available
	if preferred != "" {
		for _, p := range provs {
			if p.Name == preferred && p.Capacity-p.Used > 0 {
				// pick first region
				region := ""
				if len(p.Regions) > 0 {
					region = p.Regions[0]
				}
				return p, region, nil
			}
		}
	}
	// avoid provider if specified
	var candidate *models.Provider
	for _, p := range provs {
		if avoid != "" && p.Name == avoid {
			continue
		}
		if p.Capacity-p.Used <= 0 {
			continue
		}
		if candidate == nil || (p.Capacity-p.Used) > (candidate.Capacity-candidate.Used) {
			candidate = p
		}
	}
	if candidate == nil {
		return nil, "", fmt.Errorf("no provider capacity available")
	}
	region := ""
	if len(candidate.Regions) > 0 {
		region = candidate.Regions[0]
	}
	return candidate, region, nil
}

// MigrateDroplet will update a droplet's provider to target and adjust provider usage counters
func (s *SchedulerService) MigrateDroplet(dropletID string, targetProvider string) error {
	d, err := s.dropletRepo.GetDroplet(dropletID)
	if err != nil {
		return err
	}
	if d.Provider == targetProvider {
		return nil
	}
	// decrement old provider used if present
	if d.Provider != "" {
		// try to find provider and decrement used
		if p, err := s.providerRepo.Get(d.Provider); err == nil && p != nil {
			if p.Used > 0 {
				p.Used--
			}
			_ = s.providerRepo.Update(p)
		}
	}
	// increment new provider usage
	if p2, err := s.providerRepo.Get(targetProvider); err == nil && p2 != nil {
		p2.Used++
		_ = s.providerRepo.Update(p2)
	}
	// assign provider on droplet
	d.Provider = targetProvider
	return s.dropletRepo.UpdateDroplet(d)
}
