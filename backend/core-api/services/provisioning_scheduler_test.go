package services

import (
	"testing"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

// in-memory provider repo for test
type memProv struct{ store map[string]*models.Provider }

func (m *memProv) Create(p *models.Provider) error {
	if m.store == nil {
		m.store = map[string]*models.Provider{}
	}
	if p.ID == "" {
		p.ID = p.Name
	}
	m.store[p.ID] = p
	return nil
}
func (m *memProv) Update(p *models.Provider) error { m.store[p.ID] = p; return nil }
func (m *memProv) Get(id string) (*models.Provider, error) {
	if p, ok := m.store[id]; ok {
		return p, nil
	}
	return nil, nil
}
func (m *memProv) List() ([]*models.Provider, error) {
	out := []*models.Provider{}
	for _, v := range m.store {
		out = append(out, v)
	}
	return out, nil
}
func (m *memProv) Delete(id string) error { delete(m.store, id); return nil }

// in-memory droplet repo for test
type memDropRepo struct{ store map[string]*models.Droplet }

func (m *memDropRepo) CreateDroplet(req *models.CreateDropletRequest) (*models.DropletResponse, error) {
	if m.store == nil {
		m.store = map[string]*models.Droplet{}
	}
	id := "dtest-" + time.Now().Format("150405")
	d := &models.Droplet{ID: id, ClusterID: req.ClusterID, Name: req.Name, Region: req.Region, Provider: req.Provider, Size: req.Size, Image: req.Image, Status: "active", CreatedAt: time.Now()}
	m.store[id] = d
	return &models.DropletResponse{Droplet: d, Message: "created"}, nil
}
func (m *memDropRepo) GetDroplet(id string) (*models.Droplet, error) {
	if d, ok := m.store[id]; ok {
		return d, nil
	}
	return nil, nil
}
func (m *memDropRepo) ListDroplets() ([]*models.Droplet, error) {
	out := []*models.Droplet{}
	for _, d := range m.store {
		out = append(out, d)
	}
	return out, nil
}
func (m *memDropRepo) DeleteDroplet(id string) error { delete(m.store, id); return nil }
func (m *memDropRepo) UpdateDroplet(d *models.Droplet) error {
	if m.store == nil {
		m.store = map[string]*models.Droplet{}
	}
	m.store[d.ID] = d
	return nil
}

func TestScaleClusterUsesScheduler(t *testing.T) {
	provRepo := &memProv{store: map[string]*models.Provider{}}
	provRepo.Create(&models.Provider{ID: "p1", Name: "demo", Regions: []string{"eu1"}, Capacity: 5, Used: 0})

	dropRepo := &memDropRepo{store: map[string]*models.Droplet{}}
	scheduler := NewSchedulerService(provRepo, dropRepo)

	// provisioning service should pick provider via scheduler
	provSvc := NewProvisioningService(dropRepo, nil, nil, scheduler)

	if err := provSvc.ScaleCluster("c-test", "scale_up"); err != nil {
		t.Fatalf("scale up failed: %v", err)
	}

	// check that a droplet was created with provider assigned
	list, _ := dropRepo.ListDroplets()
	if len(list) != 1 {
		t.Fatalf("expected 1 droplet, got %d", len(list))
	}
	if list[0].Provider == "" {
		t.Fatalf("expected droplet provider set, got empty")
	}
}
