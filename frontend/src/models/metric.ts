// frontend/src/models/metric.ts

export interface Metric {
  id: string;
  clusterId: string;
  type: 'cpu' | 'memory' | 'disk' | 'network';
  value: number;
  timestamp: Date;
  unit: string;
}

export interface GetMetricsRequest {
  clusterId: string;
  type: string;
}

export interface MetricsResponse {
  metrics: Metric[];
  period: string;
  page?: number;
  page_size?: number;
  total_count?: number;
}