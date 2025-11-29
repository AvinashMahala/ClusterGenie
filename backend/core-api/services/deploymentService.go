package services

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

type deploymentProducer interface {
	PublishEvent(topic, key string, event interface{}) error
}

type DeploymentService struct {
	repo         interfaces.DeploymentRepository
	provisioning *ProvisioningService
	producer     deploymentProducer
}

func NewDeploymentService(repo interfaces.DeploymentRepository, prov *ProvisioningService, prod deploymentProducer) *DeploymentService {
	return &DeploymentService{repo: repo, provisioning: prov, producer: prod}
}

func (s *DeploymentService) StartDeployment(req *models.StartDeploymentRequest) (*models.Deployment, error) {
	if req.ClusterID == "" || req.Version == "" {
		return nil, fmt.Errorf("cluster_id and version required")
	}
	d := &models.Deployment{ClusterID: req.ClusterID, Version: req.Version, Strategy: req.Strategy, Target: req.TargetPercent, Status: "pending", Logs: []string{}}
	if err := s.repo.Create(d); err != nil {
		return nil, err
	}

	// run simulation in background
	go s.simulateRollout(d.ID)
	return d, nil
}

func (s *DeploymentService) GetDeployment(id string) (*models.Deployment, error) {
	return s.repo.Get(id)
}

func (s *DeploymentService) ListDeployments(clusterID string) ([]*models.Deployment, error) {
	return s.repo.List(clusterID)
}

func (s *DeploymentService) RollbackDeployment(id string) error {
	d, err := s.repo.Get(id)
	if err != nil {
		return err
	}
	d.Status = "rolled_back"
	d.Logs = append(d.Logs, fmt.Sprintf("manual rollback requested at %s", time.Now().Format(time.RFC3339)))
	if err := s.repo.Update(d); err != nil {
		return err
	}
	if s.producer != nil {
		_ = s.producer.PublishEvent("deployments", d.ID, map[string]interface{}{"action": "rollback", "deployment": d})
	}
	return nil
}

// simulateRollout runs a simple algorithm and updates repo logs/status
func (s *DeploymentService) simulateRollout(id string) {
	d, err := s.repo.Get(id)
	if err != nil {
		return
	}
	// move to in-progress
	d.Status = "in-progress"
	d.Logs = append(d.Logs, "Starting rollout")
	_ = s.repo.Update(d)

	// simulate a few steps with random success/failure
	steps := []string{"create canary", "route 10% traffic", "monitor canary", "gradual rollout", "finish"}
	if d.Strategy == "blue-green" {
		steps = []string{"provision green", "switch traffic", "monitor", "finish"}
	}
	if d.Strategy == "rolling" {
		steps = []string{"batch rollout 1/3", "batch rollout 2/3", "batch rollout 3/3", "monitor", "finish"}
	}

	for i, step := range steps {
		// small sleep to simulate time
		time.Sleep(time.Duration(800+rand.Intn(600)) * time.Millisecond)
		// append log
		msg := fmt.Sprintf("%s - step %d/%d", step, i+1, len(steps))
		d.Logs = append(d.Logs, msg)
		_ = s.repo.Update(d)

		// random failure during monitoring
		if step == "monitor canary" || step == "monitor" {
			if rand.Float64() < 0.15 { // simulate an issue
				d.Status = "failed"
				d.Logs = append(d.Logs, "Monitoring detected issues, triggering rollback")
				_ = s.repo.Update(d)
				if s.producer != nil {
					_ = s.producer.PublishEvent("deployments", d.ID, map[string]interface{}{"action": "failed", "deployment": d})
				}
				// automatic rollback simulation
				time.Sleep(200 * time.Millisecond)
				d.Status = "rolled_back"
				d.Logs = append(d.Logs, "Automatic rollback completed")
				_ = s.repo.Update(d)
				return
			}
		}
	}

	// success path
	d.Status = "rolled_out"
	d.Logs = append(d.Logs, "Rollout completed successfully")
	_ = s.repo.Update(d)
	if s.producer != nil {
		_ = s.producer.PublishEvent("deployments", d.ID, map[string]interface{}{"action": "completed", "deployment": d})
	}
}
