package services

import (
	"testing"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

type memProvRepo struct{ store map[string]*models.Provider }

func (m *memProvRepo) Create(p *models.Provider) error {
	if m.store == nil {
		m.store = map[string]*models.Provider{}
	}
	if p.ID == "" {
		p.ID = p.Name
	}
	m.store[p.ID] = p
	return nil
}
func (m *memProvRepo) Update(p *models.Provider) error { m.store[p.ID] = p; return nil }
func (m *memProvRepo) Get(id string) (*models.Provider, error) {
	if p, ok := m.store[id]; ok {
		return p, nil
	}
	return nil, nil
}
func (m *memProvRepo) List() ([]*models.Provider, error) {
	out := []*models.Provider{}
	for _, v := range m.store {
		out = append(out, v)
	}
	return out, nil
}
func (m *memProvRepo) Delete(id string) error { delete(m.store, id); return nil }

type memDropletRepo struct{ store map[string]*models.Droplet }

func (m *memDropletRepo) CreateDroplet(req *models.CreateDropletRequest) (*models.DropletResponse, error) {
	return &models.DropletResponse{}, nil
}
func (m *memDropletRepo) GetDroplet(id string) (*models.Droplet, error) {
	if d, ok := m.store[id]; ok {
		return d, nil
	}
	return nil, nil
}
func (m *memDropletRepo) ListDroplets() ([]*models.Droplet, error) {
	out := []*models.Droplet{}
	for _, d := range m.store {
		out = append(out, d)
	}
	return out, nil
}
func (m *memDropletRepo) DeleteDroplet(id string) error { delete(m.store, id); return nil }
func (m *memDropletRepo) UpdateDroplet(d *models.Droplet) error {
	if m.store == nil {
		m.store = map[string]*models.Droplet{}
	}
	m.store[d.ID] = d
	return nil
}

func TestSchedulePrefersCapacity(t *testing.T) {
	pstore := &memProvRepo{store: map[string]*models.Provider{}}
	// create providers
	pstore.Create(&models.Provider{ID: "p1", Name: "do", Regions: []string{"nyc1"}, Capacity: 5, Used: 5})
	pstore.Create(&models.Provider{ID: "p2", Name: "aws", Regions: []string{"us-east-1"}, Capacity: 10, Used: 2})

	dstore := &memDropletRepo{store: map[string]*models.Droplet{}}
	svc := NewSchedulerService(pstore, dstore)
	prov, region, err := svc.SchedulePlacement("c1", "", "")
	if err != nil {
		t.Fatalf("schedule error: %v", err)
	}
	if prov.Name != "aws" {
		t.Fatalf("expected aws provider, got %s", prov.Name)
	}
	if region == "" {
		t.Fatalf("expected region non-empty")
	}
}
