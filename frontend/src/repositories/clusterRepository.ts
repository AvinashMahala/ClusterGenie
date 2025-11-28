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
}