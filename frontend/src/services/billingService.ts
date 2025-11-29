import axios from 'axios';

const baseURL = 'http://localhost:8080/api/v1';

export class BillingService {
  async estimateCluster(clusterID: string): Promise<any> {
    const res = await axios.get(`${baseURL}/billing/cluster`, { params: { cluster_id: clusterID } });
    return res.data;
  }
}
