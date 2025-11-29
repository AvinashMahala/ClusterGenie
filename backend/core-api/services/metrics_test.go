package services

import "testing"

func TestRegisterPrometheusMetrics(t *testing.T) {
	// calling register should not panic
	RegisterPrometheusMetrics()
}
