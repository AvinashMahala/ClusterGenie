-- database/seed.sql

-- Insert sample clusters
INSERT INTO clusters (id, name, region, droplets, status, last_checked) VALUES
('cluster-1', 'Production Cluster', 'nyc1', '["droplet-1", "droplet-2"]', 'healthy', '2025-11-28 10:00:00'),
('cluster-2', 'Staging Cluster', 'nyc1', '["droplet-3"]', 'warning', '2025-11-28 09:30:00'),
('cluster-3', 'Development Cluster', 'nyc1', '[]', 'critical', '2025-11-28 08:00:00');

-- Insert sample droplets
INSERT INTO droplets (id, cluster_id, name, region, size, image, status, created_at, ip_address) VALUES
('droplet-1', 'cluster-1', 'web-server-1', 'nyc1', 's-1vcpu-1gb', 'ubuntu-20-04-x64', 'active', '2025-11-20 10:00:00', '192.168.1.1'),
('droplet-2', 'cluster-1', 'db-server-1', 'nyc1', 's-2vcpu-2gb', 'ubuntu-20-04-x64', 'active', '2025-11-20 10:05:00', '192.168.1.2'),
('droplet-3', 'cluster-2', 'staging-web', 'nyc1', 's-1vcpu-1gb', 'ubuntu-20-04-x64', 'active', '2025-11-25 14:00:00', '192.168.1.3'),
('droplet-4', NULL, 'orphan-droplet', 'nyc1', 's-1vcpu-1gb', 'ubuntu-20-04-x64', 'active', '2025-11-27 16:00:00', '192.168.1.4');

-- Insert sample jobs
INSERT INTO jobs (id, cluster_id, type, status, trace_id, progress, created_at, completed_at, result, error, parameters) VALUES
('job-1', 'cluster-1', 'provision', 'completed', 'trace-job-1', 100, '2025-11-20 10:00:00', '2025-11-20 10:10:00', 'Provisioned successfully', NULL, '{"droplets": 2}'),
('job-2', 'cluster-2', 'diagnose', 'completed', 'trace-job-2', 100, '2025-11-25 14:00:00', '2025-11-25 14:05:00', 'Diagnosis complete', NULL, '{}'),
('job-3', 'cluster-3', 'scale', 'failed', 'trace-job-3', 0, '2025-11-28 08:00:00', NULL, NULL, 'Scaling failed due to insufficient resources', '{"target_size": 3}');

-- Insert sample metrics
INSERT INTO metrics (id, cluster_id, type, timestamp, value, unit) VALUES
('metric-1', 'cluster-1', 'cpu_usage', '2025-11-28 10:00:00', 45.5, 'percent'),
('metric-2', 'cluster-1', 'memory_usage', '2025-11-28 10:00:00', 60.2, 'percent'),
('metric-3', 'cluster-2', 'cpu_usage', '2025-11-28 09:30:00', 80.1, 'percent'),
('metric-4', 'cluster-2', 'memory_usage', '2025-11-28 09:30:00', 75.0, 'percent'),
('metric-5', 'cluster-3', 'cpu_usage', '2025-11-28 08:00:00', 95.0, 'percent');