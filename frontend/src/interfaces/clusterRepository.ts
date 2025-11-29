// frontend/src/interfaces/clusterRepository.ts

import type { Cluster, CreateClusterRequest, DiagnosisRequest, DiagnosisResponse, UpdateClusterRequest } from '../models/cluster';

export interface ClusterRepository {
  diagnoseCluster(request: DiagnosisRequest): Promise<DiagnosisResponse>;
  getCluster(id: string): Promise<Cluster>;
  listClusters(): Promise<Cluster[]>;
  createCluster(request: CreateClusterRequest): Promise<Cluster>;
  updateCluster(id: string, request: UpdateClusterRequest): Promise<Cluster>;
  deleteCluster(id: string): Promise<void>;
}