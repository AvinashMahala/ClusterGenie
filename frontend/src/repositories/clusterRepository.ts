// frontend/src/repositories/clusterRepository.ts

import type { ClusterRepository } from '../interfaces/clusterRepository';
import type { Cluster, DiagnosisRequest, DiagnosisResponse } from '../models/cluster';
// @ts-ignore
import { DiagnosisServiceClient } from '../hello_grpc_web_pb';
import '../hello_pb';

const host = 'http://localhost:8080'; // gRPC-Web proxy

export class ClusterRepositoryImpl implements ClusterRepository {
  private client = new DiagnosisServiceClient(host);

  async diagnoseCluster(request: DiagnosisRequest): Promise<DiagnosisResponse> {
    return new Promise((resolve, reject) => {
      const req = new (globalThis as any).proto.clustergenie.DiagnoseClusterRequest();
      req.setClusterId(request.clusterId);

      this.client.diagnoseCluster(req, {}, (err: any, response: any) => {
        if (err) {
          reject(err);
        } else {
          const cluster = this.mapProtoToCluster(response.getCluster());
          resolve({
            cluster,
            insights: response.getInsightsList(),
            recommendations: response.getRecommendationsList(),
          });
        }
      });
    });
  }

  async getCluster(_id: string): Promise<Cluster> {
    // For now, we'll need to implement this when the backend supports it
    // This is a placeholder implementation
    throw new Error('Get cluster by ID not yet implemented in backend');
  }

  async listClusters(): Promise<Cluster[]> {
    // For now, we'll need to implement this when the backend supports it
    // This is a placeholder implementation
    throw new Error('List clusters not yet implemented in backend');
  }

  private mapProtoToCluster(protoCluster: any): Cluster {
    return {
      id: protoCluster.getId(),
      name: protoCluster.getName(),
      region: protoCluster.getRegion(),
      droplets: protoCluster.getDropletsList(),
      status: protoCluster.getStatus() as 'healthy' | 'warning' | 'critical',
      lastChecked: new Date(protoCluster.getLastChecked()),
    };
  }
}