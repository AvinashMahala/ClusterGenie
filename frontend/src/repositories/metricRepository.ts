// frontend/src/repositories/metricRepository.ts

import type { MetricRepository } from '../interfaces/metricRepository';
import type { Metric, MetricsResponse } from '../models/metric';
import axios from 'axios';

const baseURL = 'http://localhost:8080/api/v1';

export class MetricRepositoryImpl implements MetricRepository {
  async getMetrics(clusterId: string, type?: Metric['type']): Promise<MetricsResponse> {
    const params = { cluster_id: clusterId };
    if (type) {
      (params as any).type = type;
    }
    const response = await axios.get(`${baseURL}/metrics`, { params });
    const metricsResponse = response.data;
    return {
      ...metricsResponse,
      metrics: metricsResponse.metrics.map((metric: any) => ({
        ...metric,
        timestamp: new Date(metric.timestamp),
      })),
    };
  }
}