// frontend/src/interfaces/clusterRepository.ts

import type { Cluster, DiagnosisRequest, DiagnosisResponse } from '../models/cluster';

export interface ClusterRepository {
  diagnoseCluster(request: DiagnosisRequest): Promise<DiagnosisResponse>;
  getCluster(id: string): Promise<Cluster>;
  listClusters(): Promise<Cluster[]>;
}