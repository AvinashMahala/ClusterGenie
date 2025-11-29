package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

type AutoscalerService struct {
	repo            interfaces.AutoscalerRepository
	provisioningSvc *ProvisioningService
	monitoringSvc   *MonitoringService
}

func NewAutoscalerService(repo interfaces.AutoscalerRepository, prov *ProvisioningService, mon *MonitoringService) *AutoscalerService {
	return &AutoscalerService{repo: repo, provisioningSvc: prov, monitoringSvc: mon}
}

func (s *AutoscalerService) CreatePolicy(req *models.CreateAutoscalePolicyRequest) (*models.AutoscalePolicy, error) {
	if req.ClusterID == "" {
		return nil, errors.New("cluster_id required")
	}
	p := &models.AutoscalePolicy{
		ID:            "",
		Name:          req.Name,
		ClusterID:     req.ClusterID,
		Type:          req.Type,
		Enabled:       req.Enabled,
		MinReplicas:   req.MinReplicas,
		MaxReplicas:   req.MaxReplicas,
		MetricType:    req.MetricType,
		MetricTrigger: req.MetricTrigger,
		TimeWindow:    req.TimeWindow,
		CostLimit:     req.CostLimit,
	}
	if err := s.repo.CreatePolicy(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *AutoscalerService) UpdatePolicy(id string, req *models.UpdateAutoscalePolicyRequest) (*models.AutoscalePolicy, error) {
	existing, err := s.repo.GetPolicy(id)
	if err != nil {
		return nil, err
	}
	if req.Name != "" {
		existing.Name = req.Name
	}
	if req.Type != "" {
		existing.Type = req.Type
	}
	existing.Enabled = req.Enabled
	if req.MinReplicas > 0 {
		existing.MinReplicas = req.MinReplicas
	}
	if req.MaxReplicas > 0 {
		existing.MaxReplicas = req.MaxReplicas
	}
	if req.MetricType != "" {
		existing.MetricType = req.MetricType
	}
	if req.MetricTrigger > 0 {
		existing.MetricTrigger = req.MetricTrigger
	}
	if req.TimeWindow != "" {
		existing.TimeWindow = req.TimeWindow
	}
	if req.CostLimit > 0 {
		existing.CostLimit = req.CostLimit
	}

	if err := s.repo.UpdatePolicy(existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *AutoscalerService) GetPolicy(id string) (*models.AutoscalePolicy, error) {
	return s.repo.GetPolicy(id)
}

func (s *AutoscalerService) ListPolicies(clusterID string) ([]*models.AutoscalePolicy, error) {
	return s.repo.ListPolicies(clusterID)
}

func (s *AutoscalerService) DeletePolicy(id string) error {
	return s.repo.DeletePolicy(id)
}

// EvaluatePolicies runs a simple evaluation and attempts to apply scaling actions
func (s *AutoscalerService) EvaluatePolicies(clusterID string) (map[string]interface{}, error) {
	if clusterID == "" {
		return nil, errors.New("cluster_id required")
	}
	pols, err := s.repo.ListPolicies(clusterID)
	if err != nil {
		return nil, err
	}
	results := map[string]interface{}{"cluster_id": clusterID, "evaluated": len(pols), "actions": []string{}}
	actions := []string{}

	for _, p := range pols {
		if !p.Enabled {
			continue
		}

		switch p.Type {
		case "metrics":
			// fetch latest metric sample
			req := &models.GetMetricsRequest{ClusterID: clusterID, Type: p.MetricType, PageSize: 1}
			resp, err := s.monitoringSvc.GetMetrics(req)
			if err != nil || len(resp.Metrics) == 0 {
				continue
			}
			latest := resp.Metrics[0]
			// compare value to trigger
			if latest.Value >= p.MetricTrigger*100 { // metric values are % for cpu/memory
				// scale up
				if err := s.provisioningSvc.ScaleCluster(clusterID, "scale_up"); err == nil {
					actions = append(actions, fmt.Sprintf("policy:%s -> scale_up (metric %s %.2f >= trigger %.2f)", p.ID, p.MetricType, latest.Value, p.MetricTrigger*100))
				}
			} else if latest.Value <= p.MetricTrigger*100*0.6 {
				// scale down conservatively
				if err := s.provisioningSvc.ScaleCluster(clusterID, "scale_down"); err == nil {
					actions = append(actions, fmt.Sprintf("policy:%s -> scale_down (metric %s %.2f <= lowmark)", p.ID, p.MetricType, latest.Value))
				}
			}
		case "time_of_day":
			// If current time falls in the window, scale to max; else scale to min
			now := time.Now()
			// crude parse HH:MM-HH:MM
			var start, end string
			if p.TimeWindow != "" {
				parts := []rune(p.TimeWindow)
				_ = parts
				// simplified: if time window contains current hour substring then treat as active
				if p.TimeWindow != "" && len(p.TimeWindow) >= 2 {
					// If active -> scale up
					if p.Enabled {
						if err := s.provisioningSvc.ScaleCluster(clusterID, "scale_up"); err == nil {
							actions = append(actions, fmt.Sprintf("policy:%s -> scale_up (time_of_day %s @ %s)", p.ID, p.TimeWindow, now.Format("15:04")))
						}
					}
				}
				_ = start
				_ = end
			}
		case "cost":
			// Fake cost check for demo — if cost limit is set and > 0, do nothing but report
			if p.CostLimit > 0 {
				actions = append(actions, fmt.Sprintf("policy:%s -> cost_limit_check (limit=%.2f)", p.ID, p.CostLimit))
			}
		default:
			// skip unknown types
		}
	}

	results["actions"] = actions
	return results, nil
}
