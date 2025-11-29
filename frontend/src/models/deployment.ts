export interface Deployment {
  id: string;
  cluster_id: string;
  version: string;
  strategy: string;
  target_percent?: number;
  status: string;
  started_at?: string;
  updated_at?: string;
  logs?: string[];
}

export interface StartDeploymentRequest {
  cluster_id: string;
  version: string;
  strategy: string;
  target_percent?: number;
}
