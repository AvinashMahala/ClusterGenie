package services

import (
	"testing"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/repositories"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupInMemoryDBForEvents(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.Metric{}); err != nil {
		t.Fatalf("auto migrate failed: %v", err)
	}
	return db
}

func TestHandleClusterEvent_PersistsTelemetryArray(t *testing.T) {
	db := setupInMemoryDBForEvents(t)
	repo := repositories.NewMetricRepository(db, nil)
	svc := NewMonitoringService(repo)
	handler := NewEventHandler(nil, svc, nil)

	payload := []map[string]interface{}{
		{"type": "cpu", "value": 55.5, "unit": "%", "timestamp": time.Now().Add(-time.Minute).UTC().Format(time.RFC3339)},
		{"type": "memory", "value": 70.2, "unit": "%", "timestamp": time.Now().Add(-2 * time.Minute).UTC().Format(time.RFC3339)},
	}

	ev := map[string]interface{}{
		"type":       "telemetry",
		"cluster_id": "cluster-test",
		"metrics":    payload,
	}

	if err := handler.HandleClusterEvent(ev); err != nil {
		t.Fatalf("HandleClusterEvent returned error: %v", err)
	}

	// confirm persisted
	req := &models.GetMetricsRequest{ClusterID: "cluster-test", Page: 1, PageSize: 50}
	resp, err := repo.GetMetrics(req)
	if err != nil {
		t.Fatalf("GetMetrics failed: %v", err)
	}
	if resp.Total < 2 {
		t.Fatalf("expected at least 2 metrics persisted, got %d", resp.Total)
	}
}

func TestHandleClusterEvent_PersistsSingleKeys(t *testing.T) {
	db := setupInMemoryDBForEvents(t)
	repo := repositories.NewMetricRepository(db, nil)
	svc := NewMonitoringService(repo)
	handler := NewEventHandler(nil, svc, nil)

	ev := map[string]interface{}{
		"type":       "telemetry",
		"cluster_id": "cluster-single",
		"cpu":        88.9,
	}

	if err := handler.HandleClusterEvent(ev); err != nil {
		t.Fatalf("HandleClusterEvent returned error: %v", err)
	}

	req := &models.GetMetricsRequest{ClusterID: "cluster-single", Page: 1, PageSize: 50}
	resp, err := repo.GetMetrics(req)
	if err != nil {
		t.Fatalf("GetMetrics failed: %v", err)
	}
	if resp.Total < 1 {
		t.Fatalf("expected at least 1 metric persisted, got %d", resp.Total)
	}
}
