//go:build moved

package services

import (
	"testing"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
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

func TestProcessProvisionJob_PublishesEvent(t *testing.T) {
	prod := &fakeProducer{}
	svc := NewJobService(nil, prod)

	job := &models.Job{
		ID:         "job-provision-1234",
		Type:       "provision",
		Status:     "pending",
		Parameters: `{"cluster_id":"cluster-1"}`,
	}

	msg, err := svc.processProvisionJob(job)
	if err != nil {
		t.Fatalf("expected no error publishing event, got: %v", err)
	}
	if msg == "" {
		t.Fatalf("expected non-empty message")
	}
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
	svc := NewJobService(nil, prod)

	job := &models.Job{
		ID:         "job-scale-1234",
		Type:       "scale",
		Status:     "pending",
		Parameters: `{"cluster_id":"cluster-2"}`,
	}

	msg, err := svc.processScaleJob(job)
	if err != nil {
		t.Fatalf("expected no error publishing event, got: %v", err)
	}
	if msg == "" {
		t.Fatalf("expected non-empty message")
	}
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
	svc := NewJobService(nil, prod)

	job := &models.Job{
		ID:         "job-diagnose-1234",
		Type:       "diagnose",
		Status:     "pending",
		Parameters: `{}`,
	}

	msg, err := svc.processDiagnoseJob(job)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if msg == "" {
		t.Fatalf("expected non-empty message")
	}
	if prod.lastEvent == nil || prod.lastEvent["type"] != "job_completed" {
		t.Fatalf("expected last event to be job_completed, got: %#v", prod.lastEvent)
	}
	// progress should be 100
	if prod.lastEvent["progress"] == nil {
		t.Fatalf("expected progress field in event")
	}
}
