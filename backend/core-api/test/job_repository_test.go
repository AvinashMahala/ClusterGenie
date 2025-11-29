package coreapitest

import (
	"testing"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/repositories"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupInMemoryJobDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed open sqlite: %v", err)
	}

	if err := db.AutoMigrate(&models.Job{}); err != nil {
		t.Fatalf("auto migrate failed: %v", err)
	}
	return db
}

func TestUpdateJobProgress(t *testing.T) {
	db := setupInMemoryJobDB(t)
	repo := repositories.NewJobRepository(db, nil)

	// create job
	j := &models.Job{
		ID:        "job-test-1",
		Type:      "diagnose",
		Status:    "pending",
		CreatedAt: time.Now(),
		Progress:  0,
	}
	if err := db.Create(j).Error; err != nil {
		t.Fatalf("create job failed: %v", err)
	}

	if err := repo.UpdateJobProgress(j.ID, 40, "halfway"); err != nil {
		t.Fatalf("UpdateJobProgress failed: %v", err)
	}

	saved, err := repo.GetJob(j.ID)
	if err != nil {
		t.Fatalf("GetJob returned error: %v", err)
	}
	if saved.Progress != 40 {
		t.Fatalf("expected progress 40, got %d", saved.Progress)
	}

	// mark complete
	if err := repo.UpdateJobProgress(j.ID, 100, "done"); err != nil {
		t.Fatalf("UpdateJobProgress to complete failed: %v", err)
	}
	saved2, _ := repo.GetJob(j.ID)
	if saved2.Progress != 100 || saved2.Status != "completed" || saved2.CompletedAt == nil {
		t.Fatalf("expected completed job; got progress=%d status=%s completedAt=%v", saved2.Progress, saved2.Status, saved2.CompletedAt)
	}
}
