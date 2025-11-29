import axios from 'axios';
import { API_BASE } from '../lib/config';

export class BillingService {
  async estimateCluster(clusterID: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/billing/cluster`, { params: { cluster_id: clusterID } });
    return res.data;
  }
}
