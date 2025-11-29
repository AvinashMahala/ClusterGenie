// frontend/src/repositories/clusterRepository.ts

import type { ClusterRepository } from '../interfaces/clusterRepository';
import type { Cluster, DiagnosisRequest, DiagnosisResponse } from '../models/cluster';
import axios from 'axios';

const baseURL = 'http://localhost:8080/api/v1';

export class ClusterRepositoryImpl implements ClusterRepository {
  async diagnoseCluster(request: DiagnosisRequest): Promise<DiagnosisResponse> {
    const response = await axios.post(`${baseURL}/diagnosis/diagnose`, request);
    return response.data;
  }

  async getCluster(id: string): Promise<Cluster> {
    const response = await axios.get(`${baseURL}/clusters/${id}`);
    const cluster = response.data.cluster;
    return {
      ...cluster,
      lastChecked: cluster.last_checked ? new Date(cluster.last_checked) : new Date()
    };
  }

  async listClusters(): Promise<Cluster[]> {
    const response = await axios.get(`${baseURL}/clusters`);
    const clusters = response.data.clusters || [];
    return clusters.map((cluster: any) => ({
      ...cluster,
      lastChecked: cluster.last_checked ? new Date(cluster.last_checked) : new Date()
    }));
  }
}