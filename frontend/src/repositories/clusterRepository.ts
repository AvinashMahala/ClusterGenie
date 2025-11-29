// frontend/src/repositories/clusterRepository.ts

import type { ClusterRepository } from '../interfaces/clusterRepository';
import type {
  Cluster,
  CreateClusterRequest,
  DiagnosisRequest,
  DiagnosisResponse,
  UpdateClusterRequest,
} from '../models/cluster';
import axios from 'axios';

const baseURL = 'http://localhost:8080/api/v1';

export class ClusterRepositoryImpl implements ClusterRepository {
  async diagnoseCluster(request: DiagnosisRequest): Promise<DiagnosisResponse> {
    const response = await axios.post(`${baseURL}/diagnosis/diagnose`, request);
    return response.data;
  }

  async getCluster(id: string): Promise<Cluster> {
    const response = await axios.get(`${baseURL}/clusters/${id}`);
    return mapCluster(response.data.cluster);
  }

  async listClusters(): Promise<Cluster[]> {
    const response = await axios.get(`${baseURL}/clusters`);
    const clusters = response.data.clusters || [];
    return clusters.map(mapCluster);
  }

  async createCluster(request: CreateClusterRequest): Promise<Cluster> {
    const response = await axios.post(`${baseURL}/clusters`, request);
    return mapCluster(response.data.cluster);
  }

  async updateCluster(id: string, request: UpdateClusterRequest): Promise<Cluster> {
    const response = await axios.put(`${baseURL}/clusters/${id}`, request);
    return mapCluster(response.data.cluster);
  }

  async deleteCluster(id: string): Promise<void> {
    await axios.delete(`${baseURL}/clusters/${id}`);
  }
}

function mapCluster(cl: any): Cluster {
  const lastCheckedRaw = cl?.last_checked ?? cl?.lastChecked;
  const lastChecked = lastCheckedRaw ? new Date(lastCheckedRaw) : new Date();

  return {
    id: cl?.id ?? '',
    name: cl?.name ?? '',
    region: cl?.region ?? '',
    droplets: Array.isArray(cl?.droplets) ? cl.droplets : [],
    status: cl?.status ?? 'healthy',
    lastChecked,
  };
}