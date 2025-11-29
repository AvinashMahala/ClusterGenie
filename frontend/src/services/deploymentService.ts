import axios from 'axios';
import type { Deployment, StartDeploymentRequest } from '../models/deployment';

const baseURL = 'http://localhost:8080/api/v1';

export class DeploymentService {
  async startDeployment(req: StartDeploymentRequest): Promise<Deployment> {
    const res = await axios.post(`${baseURL}/deployments/start`, req);
    return res.data;
  }

  async getDeployment(id: string): Promise<Deployment> {
    const res = await axios.get(`${baseURL}/deployments/${id}`);
    return res.data;
  }

  async listDeployments(clusterID: string): Promise<Deployment[]> {
    const res = await axios.get(`${baseURL}/deployments`, { params: { cluster_id: clusterID } });
    return res.data.items || [];
  }

  async rollback(id: string): Promise<void> {
    await axios.post(`${baseURL}/deployments/${id}/rollback`);
  }
}
