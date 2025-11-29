import axios from 'axios';
import type { AutoscalePolicy, CreateAutoscalePolicyRequest, UpdateAutoscalePolicyRequest } from '../models/autoscale';

const baseURL = 'http://localhost:8080/api/v1';

export class AutoscalingService {
  async createPolicy(req: CreateAutoscalePolicyRequest): Promise<AutoscalePolicy> {
    const res = await axios.post(`${baseURL}/autoscaling/policies`, req);
    return res.data;
  }

  async listPolicies(clusterID: string): Promise<AutoscalePolicy[]> {
    const res = await axios.get(`${baseURL}/autoscaling/policies`, { params: { cluster_id: clusterID } });
    return res.data.items || [];
  }

  async getPolicy(id: string): Promise<AutoscalePolicy> {
    const res = await axios.get(`${baseURL}/autoscaling/policies/${id}`);
    return res.data;
  }

  async updatePolicy(id: string, req: UpdateAutoscalePolicyRequest): Promise<AutoscalePolicy> {
    const res = await axios.put(`${baseURL}/autoscaling/policies/${id}`, req);
    return res.data;
  }

  async deletePolicy(id: string): Promise<void> {
    await axios.delete(`${baseURL}/autoscaling/policies/${id}`);
  }

  async evaluate(clusterID: string): Promise<any> {
    const res = await axios.post(`${baseURL}/autoscaling/evaluate`, null, { params: { cluster_id: clusterID } });
    return res.data;
  }
}
