package services

import (
	"log"
	"time"

	"github.com/AvinashMahala/ClusterGenie/backend/core-api/interfaces"
	"github.com/AvinashMahala/ClusterGenie/backend/core-api/models"
)

// StartClusterMetricsExporter periodically reads DB-stored cluster metrics and exports
// them as Prometheus gauges so Grafana can plot per-cluster metrics.
func StartClusterMetricsExporter(clusterRepo interfaces.ClusterRepository, metricRepo interfaces.MetricRepository, interval time.Duration) {
	if clusterRepo == nil || metricRepo == nil {
		log.Println("cluster metrics exporter: repositories not configured; skipping exporter")
		return
	}

	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		for {
			// do initial run immediately
			exportOnce(clusterRepo, metricRepo)
			<-ticker.C
		}
	}()
}

func exportOnce(clusterRepo interfaces.ClusterRepository, metricRepo interfaces.MetricRepository) {
	clusters, err := clusterRepo.ListClusters()
	if err != nil {
		log.Printf("cluster metrics exporter: failed to list clusters: %v", err)
		return
	}

	for _, c := range clusters {
		if c == nil || c.ID == "" {
			continue
		}
		metrics, err := metricRepo.ListMetricsByCluster(c.ID)
		if err != nil {
			log.Printf("cluster metrics exporter: failed to list metrics for cluster %s: %v", c.ID, err)
			continue
		}

		// keep latest metric per type
		latest := map[string]*models.Metric{}
		for _, m := range metrics {
			if m == nil {
				continue
			}
			key := m.Type
			if existing, ok := latest[key]; !ok || m.Timestamp.After(existing.Timestamp) {
				// we must convert models.Metric to the minimal interface expected by this package
				// however the repository returns models.Metric pointers which satisfy fields used
				latest[key] = m
			}
		}

		for _, m := range latest {
			if m == nil {
				continue
			}
			// set metric gauge with labels (cluster_id, metric_type, unit)
			ClusterMetricGauge.WithLabelValues(m.ClusterID, m.Type, m.Unit).Set(m.Value)
		}
	}
}
