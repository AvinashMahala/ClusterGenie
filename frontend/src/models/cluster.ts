// frontend/src/models/cluster.ts

export interface Cluster {
  id: string;
  name: string;
  region: string;
  droplets: string[]; // droplet IDs
  status: 'healthy' | 'warning' | 'critical';
  lastChecked: Date;
}

export interface DiagnosisRequest {
  cluster_id: string;
}

export interface DiagnosisResponse {
  cluster: Cluster;
  insights: string[];
  recommendations: string[];
}