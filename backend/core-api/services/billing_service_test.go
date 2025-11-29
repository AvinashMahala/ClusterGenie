package services

import (
	"testing"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

type memDropletRepo2 struct{ store map[string]*models.Droplet }

func (m *memDropletRepo2) CreateDroplet(req *models.CreateDropletRequest) (*models.DropletResponse, error) {
	return &models.DropletResponse{}, nil
}
func (m *memDropletRepo2) GetDroplet(id string) (*models.Droplet, error) {
	if d, ok := m.store[id]; ok {
		return d, nil
	}
	return nil, nil
}
func (m *memDropletRepo2) ListDroplets() ([]*models.Droplet, error) {
	out := []*models.Droplet{}
	for _, d := range m.store {
		out = append(out, d)
	}
	return out, nil
}
func (m *memDropletRepo2) DeleteDroplet(id string) error { delete(m.store, id); return nil }
func (m *memDropletRepo2) UpdateDroplet(d *models.Droplet) error {
	if m.store == nil {
		m.store = map[string]*models.Droplet{}
	}
	m.store[d.ID] = d
	return nil
}

type memProvRepo3 struct{ store map[string]*models.Provider }

func (m *memProvRepo3) Create(p *models.Provider) error {
	if m.store == nil {
		m.store = map[string]*models.Provider{}
	}
	if p.ID == "" {
		p.ID = p.Name
	}
	m.store[p.ID] = p
	return nil
}
func (m *memProvRepo3) Update(p *models.Provider) error { m.store[p.ID] = p; return nil }
func (m *memProvRepo3) Get(id string) (*models.Provider, error) {
	if p, ok := m.store[id]; ok {
		return p, nil
	}
	return nil, nil
}
func (m *memProvRepo3) List() ([]*models.Provider, error) {
	out := []*models.Provider{}
	for _, v := range m.store {
		out = append(out, v)
	}
	return out, nil
}
func (m *memProvRepo3) Delete(id string) error { delete(m.store, id); return nil }

func TestEstimateClusterCostCountsAndCalculates(t *testing.T) {
	dstore := &memDropletRepo2{store: map[string]*models.Droplet{}}
	// put two droplets for cluster c-1 on provider do
	dstore.store["d1"] = &models.Droplet{ID: "d1", ClusterID: &([]string{"c-1"}[0]), Provider: "do"}
	dstore.store["d2"] = &models.Droplet{ID: "d2", ClusterID: &([]string{"c-1"}[0]), Provider: "do"}

	pstore := &memProvRepo3{store: map[string]*models.Provider{}}
	pstore.Create(&models.Provider{ID: "do", Name: "do", PricePerHour: 0.05})

	billing := NewBillingService(dstore, pstore)
	est, err := billing.EstimateClusterCost("c-1")
	if err != nil {
		t.Fatalf("estimate error: %v", err)
	}
	if est["droplet_count"].(int) != 2 {
		t.Fatalf("expected 2 droplets, got %#v", est["droplet_count"])
	}
	if est["hourly_cost"].(string) != "0.1000" {
		t.Fatalf("unexpected hourly cost: %v", est["hourly_cost"])
	}
}
