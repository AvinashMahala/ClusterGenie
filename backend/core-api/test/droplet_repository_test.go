package coreapitest

import (
	"testing"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/repositories"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupInMemoryDB(t *testing.T) *gorm.DB {
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

func TestCreateDroplet_AssignsClusterAndReturnsWithCluster(t *testing.T) {
	db := setupInMemoryDB(t)

	// create a cluster
	cluster := &models.Cluster{
		ID:          "cluster-test",
		Name:        "TestCluster",
		Region:      "nyc1",
		Status:      "healthy",
		LastChecked: time.Now(),
	}
	if err := db.Create(cluster).Error; err != nil {
		t.Fatalf("create cluster failed: %v", err)
	}

	repo := repositories.NewDropletRepository(db, nil)

	req := &models.CreateDropletRequest{
		Name:      "web-1",
		ClusterID: &cluster.ID,
		Region:    "nyc1",
		Size:      "s-1vcpu-1gb",
		Image:     "ubuntu-20-04-x64",
	}

	resp, err := repo.CreateDroplet(req)
	if err != nil {
		t.Fatalf("CreateDroplet returned error: %v", err)
	}

	if resp.Droplet == nil {
		t.Fatalf("expected droplet in response")
	}

	if resp.Droplet.ClusterID == nil || *resp.Droplet.ClusterID != cluster.ID {
		t.Fatalf("expected cluster id to be set on droplet, got: %v", resp.Droplet.ClusterID)
	}

	// fetch the droplet via GetDroplet and expect Cluster to be preloaded
	d, err := repo.GetDroplet(resp.Droplet.ID)
	if err != nil {
		t.Fatalf("GetDroplet error: %v", err)
	}
	if d.Cluster == nil || d.Cluster.ID != cluster.ID {
		t.Fatalf("expected Cluster to be preloaded and match cluster id; got cluster: %+v", d.Cluster)
	}

	// verify the cluster's Droplets array contains the new droplet
	var updatedCluster models.Cluster
	if err := db.First(&updatedCluster, "id = ?", cluster.ID).Error; err != nil {
		t.Fatalf("failed to re-read cluster: %v", err)
	}

	found := false
	for _, id := range updatedCluster.Droplets {
		if id == resp.Droplet.ID {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected cluster.Droplets to include created droplet id; got: %+v", updatedCluster.Droplets)
	}

	// list droplets and expect cluster present
	list, err := repo.ListDroplets()
	if err != nil {
		t.Fatalf("ListDroplets failed: %v", err)
	}
	if len(list) != 1 {
		t.Fatalf("expected 1 droplet; got %d", len(list))
	}
	if list[0].Cluster == nil || list[0].Cluster.ID != cluster.ID {
		t.Fatalf("expected cluster present on listed droplet; got: %+v", list[0].Cluster)
	}
}

func TestCreateDroplet_OrphanNoCluster(t *testing.T) {
	db := setupInMemoryDB(t)

	repo := repositories.NewDropletRepository(db, nil)

	req := &models.CreateDropletRequest{
		Name:   "orphan",
		Region: "nyc1",
		Size:   "s-1vcpu-1gb",
		Image:  "ubuntu-20-04-x64",
	}

	resp, err := repo.CreateDroplet(req)
	if err != nil {
		t.Fatalf("CreateDroplet returned error: %v", err)
	}

	if resp.Droplet == nil {
		t.Fatalf("expected droplet in response")
	}
	if resp.Droplet.ClusterID != nil {
		t.Fatalf("expected nil ClusterID for orphan droplet; got: %v", resp.Droplet.ClusterID)
	}
	// ensure GetDroplet returns a nil Cluster
	d, err := repo.GetDroplet(resp.Droplet.ID)
	if err != nil {
		t.Fatalf("GetDroplet error: %v", err)
	}
	if d.Cluster != nil {
		t.Fatalf("expected nil Cluster on orphan droplet; got: %+v", d.Cluster)
	}
}
