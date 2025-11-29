export interface AutoscalePolicy {
  id: string;
  name: string;
  cluster_id: string;
  type: string;
  enabled: boolean;
  min_replicas: number;
  max_replicas: number;
  metric_type?: string;
  metric_trigger?: number;
  time_window?: string;
  cost_limit?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAutoscalePolicyRequest {
  name: string;
  cluster_id: string;
  type: string;
  enabled?: boolean;
  min_replicas?: number;
  max_replicas?: number;
  metric_type?: string;
  metric_trigger?: number;
  time_window?: string;
  cost_limit?: number;
}

export type UpdateAutoscalePolicyRequest = CreateAutoscalePolicyRequest;
