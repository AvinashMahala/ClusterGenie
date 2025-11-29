// frontend/src/services/monitoringService.ts

import type { MetricRepository } from '../interfaces/metricRepository';
import type { Metric, MetricsResponse } from '../models/metric';
import { MetricRepositoryImpl } from '../repositories/metricRepository';

export class MonitoringService {
  private metricRepo: MetricRepository;

  constructor(metricRepo: MetricRepository = new MetricRepositoryImpl()) {
    this.metricRepo = metricRepo;
  }

  async getMetrics(clusterId: string, type?: Metric['type'], page?: number, pageSize?: number): Promise<MetricsResponse> {
    return this.metricRepo.getMetrics(clusterId, type, page, pageSize);
  }
}