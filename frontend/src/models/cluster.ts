// frontend/src/models/cluster.ts

export interface Cluster {
  id: string;
  name: string;
  region: string;
  droplets: string[] | null; // droplet IDs
  status: 'healthy' | 'warning' | 'critical';
  lastChecked: Date;
}

export interface CreateClusterRequest {
  name: string;
  region: string;
}

export interface CreateClusterResponse {
  cluster: Cluster;
  message: string;
}

export interface UpdateClusterRequest {
  name?: string;
  region?: string;
  status?: Cluster['status'];
}

export interface UpdateClusterResponse {
  cluster: Cluster;
  message: string;
}

export interface DeleteClusterResponse {
  message: string;
}

export interface DiagnosisRequest {
  cluster_id: string;
}

export interface DiagnosisResponse {
  cluster: Cluster;
  insights: string[];
  recommendations: string[];
}