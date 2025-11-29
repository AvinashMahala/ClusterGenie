package services

import (
	"testing"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

type memDepRepo struct{ store map[string]*models.Deployment }

func (m *memDepRepo) Create(d *models.Deployment) error {
	if m.store == nil {
		m.store = map[string]*models.Deployment{}
	}
	if d.ID == "" {
		d.ID = "d-" + time.Now().Format("150405")
	}
	d.StartedAt = time.Now()
	d.UpdatedAt = time.Now()
	m.store[d.ID] = d
	return nil
}
func (m *memDepRepo) Get(id string) (*models.Deployment, error) {
	if p, ok := m.store[id]; ok {
		return p, nil
	}
	return nil, nil
}
func (m *memDepRepo) List(clusterID string) ([]*models.Deployment, error) {
	out := []*models.Deployment{}
	for _, v := range m.store {
		if v.ClusterID == clusterID {
			out = append(out, v)
		}
	}
	return out, nil
}
func (m *memDepRepo) Update(d *models.Deployment) error {
	if m.store == nil {
		return nil
	}
	m.store[d.ID] = d
	return nil
}
func (m *memDepRepo) Delete(id string) error { delete(m.store, id); return nil }

type nopProv struct{}

func (n *nopProv) ScaleCluster(c, a string) error { return nil }

type nopProd struct{}

func (n *nopProd) PublishEvent(topic, key string, event interface{}) error { return nil }

func TestStartDeploymentCreatesAndRuns(t *testing.T) {
	repo := &memDepRepo{}
	prov := &ProvisioningService{}
	svc := NewDeploymentService(repo, prov, &nopProd{})

	r := &models.StartDeploymentRequest{ClusterID: "c-test", Version: "v1", Strategy: "canary", TargetPercent: 10}
	d, err := svc.StartDeployment(r)
	if err != nil {
		t.Fatalf("start failed: %v", err)
	}
	if d.ClusterID != "c-test" {
		t.Fatalf("unexpected cluster id")
	}
	// repository should have the deployment
	got, _ := repo.Get(d.ID)
	if got == nil {
		t.Fatalf("expected deployment in repo")
	}

	// let background simulate a bit
	time.Sleep(1200 * time.Millisecond)
	// ensure status moved to something other than pending
	cur, _ := repo.Get(d.ID)
	if cur == nil {
		t.Fatalf("missing after simulate")
	}
	if cur.Status == "pending" {
		t.Fatalf("expected simulation to start")
	}
}
