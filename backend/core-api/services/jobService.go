// backend/core-api/services/jobService.go

package services

import (
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/events"
	"github.com/google/uuid"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

type JobService struct {
	jobRepo         interfaces.JobRepository
	provisioningSvc *ProvisioningService
	clusterSvc      *ClusterService
	producer        interface {
		PublishEvent(topic, key string, event interface{}) error
	}
}

func NewJobService(jobRepo interfaces.JobRepository, producer interface {
	PublishEvent(topic, key string, event interface{}) error
}) *JobService {
	return &JobService{
		jobRepo:  jobRepo,
		producer: producer,
	}
}

func (s *JobService) SetProvisioningService(provisioningSvc *ProvisioningService) {
	s.provisioningSvc = provisioningSvc
}

func (s *JobService) SetClusterService(clusterSvc *ClusterService) {
	s.clusterSvc = clusterSvc
}

func (s *JobService) CreateJob(req *models.CreateJobRequest) (*models.JobResponse, error) {
	// Validate job type
	validTypes := map[string]bool{
		"provision": true,
		"diagnose":  true,
		"scale":     true,
		"monitor":   true,
	}

	if !validTypes[req.Type] {
		return nil, errors.New("invalid job type")
	}

	resp, err := s.jobRepo.CreateJob(req)
	if err != nil {
		return nil, err
	}

	// Automatically start processing the job
	go func() {
		err := s.ProcessJob(resp.Job.ID)
		if err != nil {
			log.Printf("Failed to process job %s: %v", resp.Job.ID, err)
		}
	}()

	return resp, nil
}

func (s *JobService) GetJob(id string) (*models.Job, error) {
	return s.jobRepo.GetJob(id)
}

func (s *JobService) ListJobs() ([]*models.Job, error) {
	return s.jobRepo.ListJobs()
}

// ProcessJob handles actual job processing based on type
func (s *JobService) ProcessJob(id string) error {
	job, err := s.jobRepo.GetJob(id)
	if err != nil {
		return err
	}

	if job.Status != "pending" {
		return errors.New("job is not in pending status")
	}

	// Update to running
	err = s.jobRepo.UpdateJobStatus(id, "running")
	if err != nil {
		return err
	}

	// Process based on job type
	go func() {
		defer func() {
			if r := recover(); r != nil {
				s.jobRepo.UpdateJobStatus(id, "failed")
			}
		}()

		var jobErr error
		waitForOrchestration := false

		switch job.Type {
		case "provision":
			_, jobErr = s.processProvisionJob(job)
			// provisioning is handled asynchronously by the orchestration consumer
			if jobErr == nil {
				waitForOrchestration = true
			}
		case "diagnose":
			_, jobErr = s.processDiagnoseJob(job)
		case "scale":
			_, jobErr = s.processScaleJob(job)
			if jobErr == nil {
				waitForOrchestration = true
			}
		case "monitor":
			_, jobErr = s.processMonitorJob(job)
		default:
			jobErr = errors.New("unknown job type")
		}

		// Update job status: if this job was handed to orchestration, leave it to the consumer
		if jobErr != nil {
			s.jobRepo.UpdateJobStatus(id, "failed")
		} else {
			if waitForOrchestration {
				s.jobRepo.UpdateJobStatus(id, "queued")
			} else {
				s.jobRepo.UpdateJobStatus(id, "completed")
			}
		}
	}()

	return nil
}

func (s *JobService) processProvisionJob(job *models.Job) (string, error) {
	// Publish a job_requested event — provisioning will be handled by the orchestrator
	var params map[string]string
	if job.Parameters != "" {
		if err := json.Unmarshal([]byte(job.Parameters), &params); err != nil {
			return "", errors.New("invalid job parameters")
		}
	}

	clusterID, ok := params["cluster_id"]
	if !ok {
		return "", errors.New("cluster_id not specified in job parameters")
	}

	if s.producer == nil {
		return "", errors.New("event producer not available")
	}

	// prefer job.TraceID if available
	trace := job.TraceID
	if trace == "" {
		trace = uuid.NewString()
	}

	e := events.NewEvent("job_requested")
	e.JobID = job.ID
	e.JobType = job.Type
	e.ClusterID = clusterID
	e.Payload = make(map[string]interface{})
	for k, v := range params {
		e.Payload[k] = v
	}
	e.TraceID = trace

	if err := s.producer.PublishEvent("cluster-events", job.ID, e); err != nil {
		return "", err
	}

	// indicate the job has been handed off to the orchestration pipeline
	return "Job queued for provisioning via event orchestration", nil
}

func (s *JobService) processDiagnoseJob(job *models.Job) (string, error) {
	// Publish job_started
	if s.producer != nil {
		// publish typed event
		trace := job.TraceID
		if trace == "" {
			trace = uuid.NewString()
		}
		e := events.NewEvent("job_started")
		e.JobID = job.ID
		e.JobType = job.Type
		e.ClusterID = job.ClusterID
		e.Progress = 0
		e.Message = "diagnosis started"
		e.TraceID = trace
		_ = s.producer.PublishEvent("cluster-events", job.ID, e)
	}

	// Simulate diagnosis with progress updates
	steps := 3
	for i := 1; i <= steps; i++ {
		time.Sleep(700 * time.Millisecond)
		progress := (i * 100) / steps
		if s.jobRepo != nil {
			_ = s.jobRepo.UpdateJobProgress(job.ID, progress, "diagnosis step completed")
		}
		if s.producer != nil {
			trace := job.TraceID
			if trace == "" {
				trace = uuid.NewString()
			}
			e := events.NewEvent("job_progress")
			e.JobID = job.ID
			e.JobType = job.Type
			e.ClusterID = job.ClusterID
			e.Progress = progress
			e.Message = "diagnosis in-progress"
			e.TraceID = trace
			_ = s.producer.PublishEvent("cluster-events", job.ID, e)
		}
	}

	// Finalize
	if s.jobRepo != nil {
		_ = s.jobRepo.UpdateJobProgress(job.ID, 100, "diagnosis completed")
	}
	if s.producer != nil {
		trace := job.TraceID
		if trace == "" {
			trace = uuid.NewString()
		}
		e := events.NewEvent("job_completed")
		e.JobID = job.ID
		e.JobType = job.Type
		e.ClusterID = job.ClusterID
		e.Progress = 100
		e.Message = "diagnosis completed"
		e.TraceID = trace
		_ = s.producer.PublishEvent("cluster-events", job.ID, e)
	}

	return "Diagnosis completed", nil
}

func (s *JobService) processScaleJob(job *models.Job) (string, error) {
	// For scale jobs, publish a job_requested event so orchestrator performs the scale
	var params map[string]string
	if job.Parameters != "" {
		if err := json.Unmarshal([]byte(job.Parameters), &params); err != nil {
			return "", errors.New("invalid job parameters")
		}
	}

	clusterID, ok := params["cluster_id"]
	if !ok {
		return "", errors.New("cluster_id not specified in job parameters")
	}

	if s.producer == nil {
		return "", errors.New("event producer not available")
	}
	trace := job.TraceID
	if trace == "" {
		trace = uuid.NewString()
	}

	e := events.NewEvent("job_requested")
	e.JobID = job.ID
	e.JobType = job.Type
	e.ClusterID = clusterID
	e.Payload = make(map[string]interface{})
	for k, v := range params {
		e.Payload[k] = v
	}
	e.TraceID = trace

	if err := s.producer.PublishEvent("cluster-events", job.ID, e); err != nil {
		return "", err
	}

	return "Scale requested via orchestration", nil
}

func (s *JobService) processMonitorJob(job *models.Job) (string, error) {
	// Publish job_started
	if s.producer != nil {
		trace := job.TraceID
		if trace == "" {
			trace = uuid.NewString()
		}
		e := events.NewEvent("job_started")
		e.JobID = job.ID
		e.JobType = job.Type
		e.ClusterID = job.ClusterID
		e.Progress = 0
		e.Message = "monitoring started"
		e.TraceID = trace
		_ = s.producer.PublishEvent("cluster-events", job.ID, e)
	}

	// Simulate work
	time.Sleep(1 * time.Second)
	if s.jobRepo != nil {
		_ = s.jobRepo.UpdateJobProgress(job.ID, 100, "monitoring completed")
	}

	if s.producer != nil {
		trace := job.TraceID
		if trace == "" {
			trace = uuid.NewString()
		}
		e := events.NewEvent("job_completed")
		e.JobID = job.ID
		e.JobType = job.Type
		e.ClusterID = job.ClusterID
		e.Progress = 100
		e.Message = "monitoring completed"
		e.TraceID = trace
		_ = s.producer.PublishEvent("cluster-events", job.ID, e)
	}

	return "Monitoring completed", nil
}
