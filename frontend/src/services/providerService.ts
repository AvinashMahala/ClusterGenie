import axios from 'axios';
import type { Provider, CreateProviderRequest } from '../models/provider';

const baseURL = 'http://localhost:8080/api/v1';

export class ProviderService {
  async listProviders(): Promise<Provider[]> {
    const res = await axios.get(`${baseURL}/providers`);
    return res.data.items || [];
  }

  async createProvider(req: CreateProviderRequest): Promise<Provider> {
    const res = await axios.post(`${baseURL}/providers`, req);
    return res.data;
  }

  async schedule(clusterID: string, preferred?: string, avoid?: string): Promise<any> {
    const res = await axios.post(`${baseURL}/schedule`, { cluster_id: clusterID, preferred_provider: preferred, avoid_provider: avoid });
    return res.data;
  }

  async migrate(dropletID: string, targetProvider: string) {
    const res = await axios.post(`${baseURL}/migrations`, { droplet_id: dropletID, target_provider: targetProvider });
    return res.data;
  }
}
