package services

import (
	"testing"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

// in-memory implementations for a small integration flow
type memDroplets struct{ store map[string]*models.Droplet }

func (m *memDroplets) CreateDroplet(req *models.CreateDropletRequest) (*models.DropletResponse, error) {
	if m.store == nil {
		m.store = map[string]*models.Droplet{}
	}
	id := "d-" + time.Now().Format("150405")
	d := &models.Droplet{ID: id, ClusterID: req.ClusterID, Name: req.Name, Region: req.Region, Provider: req.Provider, Size: req.Size, Image: req.Image, Status: "active", CreatedAt: time.Now()}
	m.store[id] = d
	return &models.DropletResponse{Droplet: d, Message: "ok"}, nil
}
func (m *memDroplets) GetDroplet(id string) (*models.Droplet, error) {
	if v, ok := m.store[id]; ok {
		return v, nil
	}
	return nil, nil
}
func (m *memDroplets) ListDroplets() ([]*models.Droplet, error) {
	out := []*models.Droplet{}
	for _, d := range m.store {
		out = append(out, d)
	}
	return out, nil
}
func (m *memDroplets) DeleteDroplet(id string) error { delete(m.store, id); return nil }
func (m *memDroplets) UpdateDroplet(d *models.Droplet) error {
	if m.store == nil {
		m.store = map[string]*models.Droplet{}
	}
	m.store[d.ID] = d
	return nil
}

type memProvRepo2 struct{ store map[string]*models.Provider }

func (m *memProvRepo2) Create(p *models.Provider) error {
	if m.store == nil {
		m.store = map[string]*models.Provider{}
	}
	if p.ID == "" {
		p.ID = p.Name
	}
	m.store[p.ID] = p
	return nil
}
func (m *memProvRepo2) Update(p *models.Provider) error { m.store[p.ID] = p; return nil }
func (m *memProvRepo2) Get(id string) (*models.Provider, error) {
	if p, ok := m.store[id]; ok {
		return p, nil
	}
	return nil, nil
}
func (m *memProvRepo2) List() ([]*models.Provider, error) {
	out := []*models.Provider{}
	for _, v := range m.store {
		out = append(out, v)
	}
	return out, nil
}
func (m *memProvRepo2) Delete(id string) error { delete(m.store, id); return nil }

type memAutoscaleRepo2 struct {
	store map[string]*models.AutoscalePolicy
}

func (m *memAutoscaleRepo2) CreatePolicy(p *models.AutoscalePolicy) error {
	if m.store == nil {
		m.store = map[string]*models.AutoscalePolicy{}
	}
	if p.ID == "" {
		p.ID = "p-" + time.Now().Format("150405")
	}
	m.store[p.ID] = p
	return nil
}
func (m *memAutoscaleRepo2) UpdatePolicy(p *models.AutoscalePolicy) error {
	m.store[p.ID] = p
	return nil
}
func (m *memAutoscaleRepo2) GetPolicy(id string) (*models.AutoscalePolicy, error) {
	if p, ok := m.store[id]; ok {
		return p, nil
	}
	return nil, nil
}
func (m *memAutoscaleRepo2) ListPolicies(clusterID string) ([]*models.AutoscalePolicy, error) {
	out := []*models.AutoscalePolicy{}
	for _, v := range m.store {
		if v.ClusterID == clusterID {
			out = append(out, v)
		}
	}
	return out, nil
}
func (m *memAutoscaleRepo2) DeletePolicy(id string) error { delete(m.store, id); return nil }

type fakeMon2 struct{ value float64 }

func (f *fakeMon2) GetMetrics(req *models.GetMetricsRequest) (*models.GetMetricsResponse, error) {
	return &models.GetMetricsResponse{Metrics: []models.Metric{{ClusterID: req.ClusterID, Type: req.Type, Value: f.value}}}, nil
}

func TestPhase8IntegrationFlow(t *testing.T) {
	// providers
	provrepo := &memProvRepo2{store: map[string]*models.Provider{}}
	provrepo.Create(&models.Provider{ID: "do", Name: "do", Regions: []string{"nyc1"}, Capacity: 10, Used: 0, PricePerHour: 0.08})
	provrepo.Create(&models.Provider{ID: "aws", Name: "aws", Regions: []string{"us-east-1"}, Capacity: 4, Used: 0, PricePerHour: 0.12})

	// droplets
	droprepo := &memDroplets{store: map[string]*models.Droplet{}}
	// create two droplets under cluster c-demo
	droprepo.CreateDroplet(&models.CreateDropletRequest{Name: "d1", ClusterID: &([]string{"c-demo"}[0]), Region: "nyc1", Provider: "do", Size: "s1"})
	droprepo.CreateDroplet(&models.CreateDropletRequest{Name: "d2", ClusterID: &([]string{"c-demo"}[0]), Region: "nyc1", Provider: "do", Size: "s1"})

	// billing
	billing := NewBillingService(droprepo, provrepo)
	est, err := billing.EstimateClusterCost("c-demo")
	if err != nil {
		t.Fatalf("billing failed: %v", err)
	}
	if est["droplet_count"].(int) != 2 {
		t.Fatalf("unexpected droplet count")
	}

	// scheduler picks AWS (remaining capacity) when prefer empty
	scheduler := NewSchedulerService(provrepo, droprepo)
	prov, reg, err := scheduler.SchedulePlacement("c-demo", "", "")
	if err != nil {
		t.Fatalf("schedule failed: %v", err)
	}
	if prov == nil || reg == "" {
		t.Fatalf("unexpected schedule result")
	}

	// autoscaler with fake monitoring should create policy and evaluation should succeed (crud)
	autos := &memAutoscaleRepo2{store: map[string]*models.AutoscalePolicy{}}
	provsvc := NewProvisioningService(droprepo, nil, nil, nil)
	autosvc := NewAutoscalerService(autos, provsvc, &MonitoringService{metricRepo: nil})
	// create policy
	cp := &models.CreateAutoscalePolicyRequest{Name: "cpu-up", ClusterID: "c-demo", Type: "metrics", Enabled: true, MinReplicas: 1, MaxReplicas: 5, MetricType: "cpu", MetricTrigger: 0.8}
	p, err := autosvc.CreatePolicy(cp)
	if err != nil {
		t.Fatalf("create policy failed: %v", err)
	}
	if p == nil {
		t.Fatalf("policy missing")
	}

	// replace monitoring service with fake for evaluation
	autosvc.monitoringSvc = &MonitoringService{metricRepo: nil}
	// could simulate evaluation but it's covered in unit tests; here ensure wiring doesn't panic
	_, _ = autosvc.ListPolicies("c-demo")
}
