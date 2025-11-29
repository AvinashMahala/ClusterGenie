import axios from 'axios';
import type { Provider, CreateProviderRequest } from '../models/provider';
import { API_BASE } from '../lib/config';

export class ProviderService {
  async listProviders(): Promise<Provider[]> {
    const res = await axios.get(`${API_BASE}/providers`);
    return res.data.items || [];
  }

  async createProvider(req: CreateProviderRequest): Promise<Provider> {
    const res = await axios.post(`${API_BASE}/providers`, req);
    return res.data;
  }

  async schedule(clusterID: string, preferred?: string, avoid?: string): Promise<any> {
    const res = await axios.post(`${API_BASE}/schedule`, { cluster_id: clusterID, preferred_provider: preferred, avoid_provider: avoid });
    return res.data;
  }

  async migrate(dropletID: string, targetProvider: string) {
    const res = await axios.post(`${API_BASE}/migrations`, { droplet_id: dropletID, target_provider: targetProvider });
    return res.data;
  }
}
