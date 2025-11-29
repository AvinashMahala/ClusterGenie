package coreapitest

import (
	"testing"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/services"
)

type fakeProducer struct {
	lastTopic string
	lastKey   string
	lastEvent map[string]interface{}
}

func (f *fakeProducer) PublishEvent(topic, key string, event interface{}) error {
	f.lastTopic = topic
	f.lastKey = key
	if m, ok := event.(map[string]interface{}); ok {
		f.lastEvent = m
	}
	return nil
}

type fakeJobRepo struct{ save *models.Job }

func (f *fakeJobRepo) CreateJob(req *models.CreateJobRequest) (*models.JobResponse, error) {
	f.save = &models.Job{ID: "job-created", Type: req.Type, Status: "pending", Parameters: ""}
	return &models.JobResponse{Job: f.save, Message: "ok"}, nil
}
func (f *fakeJobRepo) GetJob(id string) (*models.Job, error) { return f.save, nil }
func (f *fakeJobRepo) ListJobs() ([]*models.Job, error)      { return []*models.Job{f.save}, nil }
func (f *fakeJobRepo) UpdateJobStatus(id string, status string) error {
	if f.save != nil {
		f.save.Status = status
	}
	return nil
}
func (f *fakeJobRepo) UpdateJobProgress(id string, progress int, message string) error {
	if f.save != nil {
		f.save.Progress = progress
		if progress >= 100 {
			f.save.Status = "completed"
		}
	}
	return nil
}

func TestProcessProvisionJob_PublishesEvent(t *testing.T) {
	prod := &fakeProducer{}
	job := &models.Job{ID: "job-provision-1234", Type: "provision", Status: "pending", Parameters: `{"cluster_id":"cluster-1"}`}
	fj := &fakeJobRepo{save: job}
	svc := services.NewJobService(fj, prod)

	// start processing asynchronously
	if err := svc.ProcessJob(job.ID); err != nil {
		t.Fatalf("ProcessJob returned error: %v", err)
	}
	time.Sleep(300 * time.Millisecond)

	if prod.lastTopic != "cluster-events" {
		t.Fatalf("expected topic cluster-events got %s", prod.lastTopic)
	}
	if prod.lastKey != job.ID {
		t.Fatalf("expected key to be job id got %s", prod.lastKey)
	}
	if prod.lastEvent == nil || prod.lastEvent["type"] != "job_requested" {
		t.Fatalf("expected job_requested event, got: %#v", prod.lastEvent)
	}
}

func TestProcessScaleJob_PublishesEvent(t *testing.T) {
	prod := &fakeProducer{}
	job := &models.Job{ID: "job-scale-1234", Type: "scale", Status: "pending", Parameters: `{"cluster_id":"cluster-2"}`}
	fj := &fakeJobRepo{save: job}
	svc := services.NewJobService(fj, prod)

	if err := svc.ProcessJob(job.ID); err != nil {
		t.Fatalf("ProcessJob returned error: %v", err)
	}
	time.Sleep(300 * time.Millisecond)

	if prod.lastTopic != "cluster-events" {
		t.Fatalf("expected topic cluster-events got %s", prod.lastTopic)
	}
	if prod.lastKey != job.ID {
		t.Fatalf("expected key to be job id got %s", prod.lastKey)
	}
	if prod.lastEvent == nil || prod.lastEvent["type"] != "job_requested" {
		t.Fatalf("expected job_requested event, got: %#v", prod.lastEvent)
	}
}

func TestProcessDiagnoseJob_PublishesCompletedEvent(t *testing.T) {
	prod := &fakeProducer{}
	job := &models.Job{ID: "job-diagnose-1234", Type: "diagnose", Status: "pending", Parameters: `{}`}
	fj := &fakeJobRepo{save: job}
	svc := services.NewJobService(fj, prod)

	if err := svc.ProcessJob(job.ID); err != nil {
		t.Fatalf("ProcessJob returned error: %v", err)
	}
	// wait longer because diagnose job has multiple steps
	time.Sleep(2500 * time.Millisecond)
	if prod.lastEvent == nil || prod.lastEvent["type"] != "job_completed" {
		t.Fatalf("expected last event to be job_completed, got: %#v", prod.lastEvent)
	}
	if prod.lastEvent["progress"] == nil {
		t.Fatalf("expected progress field in event")
	}
}
