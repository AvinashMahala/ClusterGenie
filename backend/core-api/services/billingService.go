package services

import (
	"fmt"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
)

type BillingService struct {
	dropletRepo  interfaces.DropletRepository
	providerRepo interfaces.ProviderRepository
}

func NewBillingService(d interfaces.DropletRepository, p interfaces.ProviderRepository) *BillingService {
	return &BillingService{dropletRepo: d, providerRepo: p}
}

// EstimateClusterCost computes simple snapshot of cost for a cluster (per hour & month)
func (s *BillingService) EstimateClusterCost(clusterID string) (map[string]interface{}, error) {
	droplets, err := s.dropletRepo.ListDroplets()
	if err != nil {
		return nil, err
	}
	// map providers to prices
	providers, err := s.providerRepo.List()
	if err != nil {
		return nil, err
	}
	priceMap := map[string]float64{}
	for _, p := range providers {
		priceMap[p.Name] = p.PricePerHour
	}

	var count int
	var hourly float64
	for _, d := range droplets {
		if d.ClusterID != nil && *d.ClusterID == clusterID {
			count++
			price := 0.05 // default demo price
			if d.Provider != "" {
				if v, ok := priceMap[d.Provider]; ok {
					price = v
				}
			}
			hourly += price
		}
	}
	monthly := hourly * 24.0 * 30.0
	return map[string]interface{}{
		"cluster_id":    clusterID,
		"droplet_count": count,
		"hourly_cost":   fmt.Sprintf("%.4f", hourly),
		"monthly_cost":  fmt.Sprintf("%.2f", monthly),
	}, nil
}
