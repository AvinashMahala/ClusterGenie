// backend/core-api/services/eventHandler.go

package services

import (
	"log"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

type EventHandler struct {
	jobSvc          *JobService
	metricSvc       *MonitoringService
	provisioningSvc *ProvisioningService
}

func NewEventHandler(jobSvc *JobService, metricSvc *MonitoringService, provisioningSvc *ProvisioningService) *EventHandler {
	return &EventHandler{
		jobSvc:          jobSvc,
		metricSvc:       metricSvc,
		provisioningSvc: provisioningSvc,
	}
}

func (h *EventHandler) HandleClusterEvent(event map[string]interface{}) error {
	eventType, ok := event["type"].(string)
	if !ok {
		log.Printf("Invalid event type: %v", event["type"])
		return nil
	}

	switch eventType {
	case "droplet_created":
		return h.handleDropletCreated(event)
	case "job_completed":
		return h.handleJobCompleted(event)
	case "job_requested":
		return h.handleJobRequestedTyped(event)
	case "metric_threshold_exceeded":
		return h.handleMetricThresholdExceeded(event)
	default:
		log.Printf("Unknown event type: %s", eventType)
	}

	return nil
}

func (h *EventHandler) handleDropletCreated(event map[string]interface{}) error {
	log.Printf("Handling droplet created event: %v", event)
	// Could trigger health checks or scaling logic
	return nil
}

func (h *EventHandler) handleJobCompleted(event map[string]interface{}) error {
	log.Printf("Handling job completed event: %v", event)
	// Update job status, trigger next steps
	return nil
}

func (h *EventHandler) handleJobRequested(event map[string]interface{}) error {
	log.Printf("Handling job requested event: %v", event)

	// Extract details
	jobID, _ := event["job_id"].(string)
	jobType, _ := event["job_type"].(string)
	clusterID, _ := event["cluster_id"].(string)

	// mark job running
	if jobID != "" && h.jobSvc != nil {
		_ = h.jobSvc.jobRepo.UpdateJobStatus(jobID, "running")
		if h.provisioningSvc != nil && h.provisioningSvc.producer != nil {
			_ = h.provisioningSvc.producer.PublishEvent("cluster-events", jobID, map[string]interface{}{
				"type":      "job_started",
				"job_id":    jobID,
				"job_type":  jobType,
				"cluster_id": clusterID,
				"progress":  0,
				"message":   "orchestration started",
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
			// set a baseline progress
			_ = h.jobSvc.jobRepo.UpdateJobProgress(jobID, 10, "orchestration started")
	}

	var err error

	switch jobType {
	case "provision":
		// Create droplet for the cluster and simulate progress updates
		if clusterID != "" && h.provisioningSvc != nil {
			req := &models.CreateDropletRequest{
				Name:      "droplet-from-job-" + jobID[len(jobID)-8:],
				Region:    "nyc3",
				Size:      "s-1vcpu-1gb",
				Image:     "ubuntu-20-04-x64",
				ClusterID: &clusterID,
			}
			_, err = h.provisioningSvc.CreateDroplet(req)
		}
	case "scale":
		if clusterID != "" && h.provisioningSvc != nil {
			err = h.provisioningSvc.ScaleCluster(clusterID, "scale_up")
		}
	default:
		log.Printf("Unhandled job type in orchestration: %s", jobType)
	}
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
			_ = h.jobSvc.jobRepo.UpdateJobProgress(jobID, 30, "provision: initializing")
		}

		_, err = h.provisioningSvc.CreateDroplet(req)

		if h.provisioningSvc != nil && h.provisioningSvc.producer != nil {
			_ = h.provisioningSvc.producer.PublishEvent("cluster-events", jobID, map[string]interface{}{
				"type":      "job_progress",
				"job_id":    jobID,
				"job_type":  jobType,
				"cluster_id": clusterID,
				"progress":  75,
				"message":   "provisioning - completing",
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
			_ = h.jobSvc.jobRepo.UpdateJobProgress(jobID, 75, "provision: completing")

	if jobID != "" && h.jobSvc != nil {
		if err != nil {
			_ = h.jobSvc.jobRepo.UpdateJobStatus(jobID, "failed")
		} else {
			_ = h.jobSvc.jobRepo.UpdateJobStatus(jobID, "completed")
		}
	}

	// Publish job_completed event for observability
	if h.provisioningSvc != nil && h.provisioningSvc.producer != nil {
		_ = h.provisioningSvc.producer.PublishEvent("cluster-events", jobID, map[string]interface{}{
			"type":       "job_completed",
			"job_id":     jobID,
			"job_type":   jobType,
			"cluster_id": clusterID,
			"error":      err != nil,
			"progress":   100,
			"timestamp":  time.Now().UTC().Format(time.RFC3339),
		})
	}

	return err
}

// handleJobRequestedTyped converts a raw event into typed events and orchestrates
func (h *EventHandler) handleJobRequestedTyped(event map[string]interface{}) error {
	log.Printf("Handling job requested event (typed): %v", event)
	e := events.FromMap(event)
	jobID := e.JobID
	jobType := e.JobType
	clusterID := e.ClusterID

	if jobID != "" && h.jobSvc != nil {
		_ = h.jobSvc.jobRepo.UpdateJobStatus(jobID, "running")
	}

	// publish job_started
	if jobID != "" && h.provisioningSvc != nil && h.provisioningSvc.producer != nil {
		se := events.NewEvent("job_started")
		se.JobID = jobID
		se.JobType = jobType
		se.ClusterID = clusterID
		se.Progress = 0
		se.Message = "orchestration started"
		se.TraceID = e.TraceID
		_ = h.provisioningSvc.producer.PublishEvent("cluster-events", jobID, se)
		_ = h.jobSvc.jobRepo.UpdateJobProgress(jobID, 10, "orchestration started")
	}

	var err error
	switch jobType {
	case "provision":
		if clusterID != "" && h.provisioningSvc != nil {
			if h.provisioningSvc.producer != nil {
				p := events.NewEvent("job_progress")
				p.JobID = jobID
				p.JobType = jobType
				p.ClusterID = clusterID
				p.Progress = 30
				p.Message = "provisioning - initializing"
				p.TraceID = e.TraceID
				_ = h.provisioningSvc.producer.PublishEvent("cluster-events", jobID, p)
				_ = h.jobSvc.jobRepo.UpdateJobProgress(jobID, 30, "provision: initializing")
			}
			req := &models.CreateDropletRequest{
				Name:      "droplet-from-job-" + jobID[len(jobID)-8:],
				Region:    "nyc3",
				Size:      "s-1vcpu-1gb",
				Image:     "ubuntu-20-04-x64",
				ClusterID: &clusterID,
			}
			_, err = h.provisioningSvc.CreateDroplet(req)
			if err == nil && h.provisioningSvc.producer != nil {
				p2 := events.NewEvent("job_progress")
				p2.JobID = jobID
				p2.JobType = jobType
				p2.ClusterID = clusterID
				p2.Progress = 75
				p2.Message = "provisioning - completing"
				p2.TraceID = e.TraceID
				_ = h.provisioningSvc.producer.PublishEvent("cluster-events", jobID, p2)
				_ = h.jobSvc.jobRepo.UpdateJobProgress(jobID, 75, "provision: completing")
			}
		}
	case "scale":
		if clusterID != "" && h.provisioningSvc != nil {
			if h.provisioningSvc.producer != nil {
				p := events.NewEvent("job_progress")
				p.JobID = jobID
				p.JobType = jobType
				p.ClusterID = clusterID
				p.Progress = 30
				p.Message = "scaling - initializing"
				p.TraceID = e.TraceID
				_ = h.provisioningSvc.producer.PublishEvent("cluster-events", jobID, p)
				_ = h.jobSvc.jobRepo.UpdateJobProgress(jobID, 30, "scale: initializing")
			}
			err = h.provisioningSvc.ScaleCluster(clusterID, "scale_up")
			if err == nil && h.provisioningSvc.producer != nil {
				p2 := events.NewEvent("job_progress")
				p2.JobID = jobID
				p2.JobType = jobType
				p2.ClusterID = clusterID
				p2.Progress = 75
				p2.Message = "scaling - completing"
				p2.TraceID = e.TraceID
				_ = h.provisioningSvc.producer.PublishEvent("cluster-events", jobID, p2)
				_ = h.jobSvc.jobRepo.UpdateJobProgress(jobID, 75, "scale: completing")
			}
		}
	default:
		log.Printf("Unhandled job type in orchestration: %s", jobType)
	}

	if jobID != "" && h.jobSvc != nil {
		if err != nil {
			_ = h.jobSvc.jobRepo.UpdateJobStatus(jobID, "failed")
			_ = h.jobSvc.jobRepo.UpdateJobProgress(jobID, 100, "failed: "+err.Error())
		} else {
			_ = h.jobSvc.jobRepo.UpdateJobProgress(jobID, 100, "completed")
		}
	}

	if h.provisioningSvc != nil && h.provisioningSvc.producer != nil {
		jc := events.NewEvent("job_completed")
		jc.JobID = jobID
		jc.JobType = jobType
		jc.ClusterID = clusterID
		jc.Progress = 100
		jc.Message = "completed"
		jc.TraceID = e.TraceID
		if err != nil {
			jc.Message = "failed: " + err.Error()
		}
		_ = h.provisioningSvc.producer.PublishEvent("cluster-events", jobID, jc)
	}

	return err
}

func (h *EventHandler) handleMetricThresholdExceeded(event map[string]interface{}) error {
	log.Printf("Handling metric threshold exceeded: %v", event)
	// Trigger auto-scaling
	return h.triggerAutoScaling(event)
}

func (h *EventHandler) triggerAutoScaling(event map[string]interface{}) error {
	// Simple auto-scaling logic: if CPU > 80%, scale up
	clusterID, ok := event["cluster_id"].(string)
	if !ok {
		return nil
	}

	// Perform actual scaling
	err := h.provisioningSvc.ScaleCluster(clusterID, "scale_up")
	if err != nil {
		log.Printf("Failed to scale cluster %s: %v", clusterID, err)
		return err
	}

	log.Printf("Auto-scaled cluster %s", clusterID)
	return nil
}
