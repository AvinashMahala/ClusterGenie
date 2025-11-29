
import axios from 'axios';
import { API_BASE } from '../lib/config';

export class DeploymentService {
  async startDeployment(req: StartDeploymentRequest): Promise<Deployment> {
    const res = await axios.post(`${API_BASE}/deployments/start`, req);
    return res.data;
  }

  async getDeployment(id: string): Promise<Deployment> {
    const res = await axios.get(`${API_BASE}/deployments/${id}`);
    return res.data;
  }

  async listDeployments(clusterID: string): Promise<Deployment[]> {
    const res = await axios.get(`${API_BASE}/deployments`, { params: { cluster_id: clusterID } });
    return res.data.items || [];
  }

  async rollback(id: string): Promise<void> {
    await axios.post(`${API_BASE}/deployments/${id}/rollback`);
  }
}
