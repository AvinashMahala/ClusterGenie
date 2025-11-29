// frontend/src/repositories/metricRepository.ts

import type { MetricRepository } from '../interfaces/metricRepository';
import type { Metric, MetricsResponse } from '../models/metric';
import axios from 'axios';

const baseURL = 'http://localhost:8080/api/v1';

export class MetricRepositoryImpl implements MetricRepository {
  async getMetrics(clusterId: string, type?: Metric['type'], page?: number, pageSize?: number): Promise<MetricsResponse> {
    const params: any = { cluster_id: clusterId };
    if (type) {
      (params as any).type = type;
    }
    if (page && page > 0) params.page = page;
    if (pageSize && pageSize > 0) params.page_size = pageSize;
    const response = await axios.get(`${baseURL}/metrics`, { params });
    const metricsResponse = response.data || {};

    // normalize numeric/pagination fields (support different casing from backend)
    const resolvedPage = metricsResponse.page ?? metricsResponse.Page ?? page ?? 1;
    const resolvedPageSize = metricsResponse.page_size ?? metricsResponse.PageSize ?? pageSize ?? 50;
    const total = metricsResponse.total_count ?? metricsResponse.Total ?? metricsResponse.total ?? 0;

    return {
      metrics: (metricsResponse.metrics || []).map((metric: any) => ({
        id: metric.id,
        clusterId: metric.cluster_id ?? metric.clusterId ?? '',
        type: metric.type,
        value: metric.value,
        timestamp: new Date(metric.timestamp),
        unit: metric.unit,
      })),
      period: metricsResponse.period ?? metricsResponse.Period ?? '',
      page: resolvedPage,
      page_size: resolvedPageSize,
      total_count: total,
    };
  }
}