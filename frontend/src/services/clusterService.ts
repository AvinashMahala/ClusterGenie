// frontend/src/services/clusterService.ts

import type { ClusterRepository } from '../interfaces/clusterRepository';
import type { Cluster, DiagnosisRequest, DiagnosisResponse } from '../models/cluster';
import { ClusterRepositoryImpl } from '../repositories/clusterRepository';

export class ClusterService {
  private clusterRepo: ClusterRepository;

  constructor(clusterRepo: ClusterRepository = new ClusterRepositoryImpl()) {
    this.clusterRepo = clusterRepo;
  }

  async diagnoseCluster(request: DiagnosisRequest): Promise<DiagnosisResponse> {
    return this.clusterRepo.diagnoseCluster(request);
  }

  async getCluster(id: string): Promise<Cluster> {
    return this.clusterRepo.getCluster(id);
  }

  async listClusters(): Promise<Cluster[]> {
    return this.clusterRepo.listClusters();
  }
}