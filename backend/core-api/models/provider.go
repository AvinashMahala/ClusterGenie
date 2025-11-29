package models

type Provider struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Regions      []string `json:"regions"`
	Capacity     int      `json:"capacity"` // total capacity in droplets
	Used         int      `json:"used"`     // currently used
	Classes      []string `json:"classes"`  // capacity classes or instance families
	PricePerHour float64  `json:"price_per_hour"`
}

type CreateProviderRequest struct {
	Name     string   `json:"name"`
	Regions  []string `json:"regions"`
	Capacity int      `json:"capacity"`
	Classes  []string `json:"classes"`
}
