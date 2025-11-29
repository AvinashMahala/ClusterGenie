import axios from 'axios';
import type { AutoscalePolicy, CreateAutoscalePolicyRequest, UpdateAutoscalePolicyRequest } from '../models/autoscale';
import { API_BASE } from '../lib/config';

export class AutoscalingService {
  async createPolicy(req: CreateAutoscalePolicyRequest): Promise<AutoscalePolicy> {
    const res = await axios.post(`${API_BASE}/autoscaling/policies`, req);
    return res.data;
  }

  async listPolicies(clusterID: string): Promise<AutoscalePolicy[]> {
    const res = await axios.get(`${API_BASE}/autoscaling/policies`, { params: { cluster_id: clusterID } });
    return res.data.items || [];
  }

  async getPolicy(id: string): Promise<AutoscalePolicy> {
    const res = await axios.get(`${API_BASE}/autoscaling/policies/${id}`);
    return res.data;
  }

  async updatePolicy(id: string, req: UpdateAutoscalePolicyRequest): Promise<AutoscalePolicy> {
    const res = await axios.put(`${API_BASE}/autoscaling/policies/${id}`, req);
    return res.data;
  }

  async deletePolicy(id: string): Promise<void> {
    await axios.delete(`${API_BASE}/autoscaling/policies/${id}`);
  }

  async evaluate(clusterID: string): Promise<any> {
    const res = await axios.post(`${API_BASE}/autoscaling/evaluate`, null, { params: { cluster_id: clusterID } });
    return res.data;
  }
}
