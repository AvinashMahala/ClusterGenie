package coreapitest

import (
    "testing"
    "time"

    "github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
    "github.com/AvinashMahala/ClusterGenie/backend/core-api/repositories"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

func setupInMemoryMetricDB(t *testing.T) *gorm.DB {
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

func TestGetMetrics_Pagination(t *testing.T) {
    db := setupInMemoryMetricDB(t)
    repo := repositories.NewMetricRepository(db, nil)

    clusterID := "cluster-pg"

    // create 55 metrics
    for i := 0; i < 55; i++ {
        m := &models.Metric{
            ID:        clusterID + "-cpu-" + time.Now().Add(time.Duration(-i)*time.Minute).Format("20060102150405"),
            ClusterID: clusterID,
            Type:      "cpu",
            Value:     float64(i),
            Timestamp: time.Now().Add(time.Duration(-i) * time.Minute),
            Unit:      "%",
        }
        if err := repo.CreateMetric(m); err != nil {
            t.Fatalf("failed to create metric: %v", err)
        }
    }

    req := &models.GetMetricsRequest{
        ClusterID: clusterID,
        Type:      "cpu",
        Page:      1,
        PageSize:  20,
    }

    resp, err := repo.GetMetrics(req)
    if err != nil {
        t.Fatalf("GetMetrics error: %v", err)
    }

    if resp.Total != 55 {
        t.Fatalf("expected total 55 got %d", resp.Total)
    }
    if len(resp.Metrics) != 20 {
        t.Fatalf("expected 20 metrics for page 1 got %d", len(resp.Metrics))
    }

    // page 3 should have 15 entries
    req.Page = 3
    resp2, err := repo.GetMetrics(req)
    if err != nil {
        t.Fatalf("GetMetrics page 3 error: %v", err)
    }
    if len(resp2.Metrics) != 15 {
        t.Fatalf("expected 15 metrics for page 3 got %d", len(resp2.Metrics))
    }
}
