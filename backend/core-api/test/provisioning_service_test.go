package coreapitest

import (
	"testing"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/repositories"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/services"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupInMemoryDBForService(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed open sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.Cluster{}, &models.Droplet{}); err != nil {
		t.Fatalf("auto migrate failed: %v", err)
	}
	return db
}

func TestCreateDroplet_FailsWhenClusterMissing(t *testing.T) {
	db := setupInMemoryDBForService(t)
	dropletRepo := repositories.NewDropletRepository(db, nil)
	clusterRepo := repositories.NewClusterRepository(db, nil)
	clusterSvc := services.NewClusterService(clusterRepo)
	provisioningSvc := services.NewProvisioningService(dropletRepo, nil, clusterSvc, nil)

	req := &models.CreateDropletRequest{
		Name:      "bad-drop",
		ClusterID: ptrString("non-existent"),
		Region:    "nyc1",
		Size:      "s-1vcpu-1gb",
		Image:     "ubuntu",
	}

	_, err := provisioningSvc.CreateDroplet(req)
	if err == nil {
		t.Fatalf("expected error when creating droplet for missing cluster")
	}
}

func TestCreateDroplet_SucceedsAndAddsToCluster(t *testing.T) {
	db := setupInMemoryDBForService(t)
	dropletRepo := repositories.NewDropletRepository(db, nil)
	clusterRepo := repositories.NewClusterRepository(db, nil)
	clusterSvc := services.NewClusterService(clusterRepo)
	provisioningSvc := services.NewProvisioningService(dropletRepo, nil, clusterSvc, nil)

	// create cluster
	cluster := &models.Cluster{
		ID:          "cluster-svc-test",
		Name:        "SvcCluster",
		Region:      "nyc1",
		Status:      "healthy",
		LastChecked: time.Now(),
	}
	if err := db.Create(cluster).Error; err != nil {
		t.Fatalf("failed to create cluster: %v", err)
	}

	req := &models.CreateDropletRequest{
		Name:      "attached",
		ClusterID: &cluster.ID,
		Region:    "nyc1",
		Size:      "s-1vcpu-1gb",
		Image:     "ubuntu",
	}

	resp, err := provisioningSvc.CreateDroplet(req)
	if err != nil {
		t.Fatalf("CreateDroplet returned error: %v", err)
	}
	if resp.Droplet == nil {
		t.Fatalf("expected droplet in response")
	}

	// ensure cluster has the droplet id appended
	updated, err := clusterSvc.GetCluster(cluster.ID)
	if err != nil {
		t.Fatalf("failed to get cluster: %v", err)
	}
	found := false
	for _, d := range updated.Droplets {
		if d == resp.Droplet.ID {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected cluster droplets to include new droplet id; got %+v", updated.Droplets)
	}
}

func ptrString(s string) *string { return &s }
