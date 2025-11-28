// frontend/src/repositories/metricRepository.ts

import type { MetricRepository } from '../interfaces/metricRepository';
import type { Metric, MetricsResponse } from '../models/metric';
// @ts-ignore
import { MonitoringServiceClient } from '../hello_grpc_web_pb';
import '../hello_pb';

const host = 'http://localhost:8080'; // gRPC-Web proxy

export class MetricRepositoryImpl implements MetricRepository {
  private client = new MonitoringServiceClient(host);

  async getMetrics(clusterId: string, type?: Metric['type']): Promise<MetricsResponse> {
    return new Promise((resolve, reject) => {
      const req = new (globalThis as any).proto.clustergenie.GetMetricsRequest();
      req.setClusterId(clusterId);
      if (type) {
        req.setType(type);
      }

      this.client.getMetrics(req, {}, (err: any, response: any) => {
        if (err) {
          reject(err);
        } else {
          const metrics = response.getMetricsList().map((metric: any) => this.mapProtoToMetric(metric));
          resolve({
            metrics,
            period: response.getPeriod(),
          });
        }
      });
    });
  }

  private mapProtoToMetric(protoMetric: any): Metric {
    return {
      id: protoMetric.getId(),
      clusterId: protoMetric.getClusterId(),
      type: protoMetric.getType() as Metric['type'],
      value: protoMetric.getValue(),
      timestamp: new Date(protoMetric.getTimestamp()),
      unit: protoMetric.getUnit(),
    };
  }
}