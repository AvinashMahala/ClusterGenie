// frontend/src/services/clusterService.ts

import type { ClusterRepository } from '../interfaces/clusterRepository';
import type {
  Cluster,
  CreateClusterRequest,
  DiagnosisRequest,
  DiagnosisResponse,
  UpdateClusterRequest,
} from '../models/cluster';
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

  async createCluster(request: CreateClusterRequest): Promise<Cluster> {
    return this.clusterRepo.createCluster(request);
  }

  async updateCluster(id: string, request: UpdateClusterRequest): Promise<Cluster> {
    return this.clusterRepo.updateCluster(id, request);
  }

  async deleteCluster(id: string): Promise<void> {
    return this.clusterRepo.deleteCluster(id);
  }
}