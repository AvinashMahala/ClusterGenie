// frontend/src/interfaces/metricRepository.ts

import type { Metric, MetricsResponse } from '../models/metric';

export interface MetricRepository {
  getMetrics(clusterId: string, type?: Metric['type'], page?: number, pageSize?: number): Promise<MetricsResponse>;
}