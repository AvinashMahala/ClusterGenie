import axios from 'axios';

const baseURL = 'http://localhost:8080/api/v1';

export class ObservabilityRepositoryImpl {
  async getRateLimit(name: string, scopeType?: string, scopeId?: string) {
    const params: any = { name };
    if (scopeType) params.scope_type = scopeType;
    if (scopeId) params.scope_id = scopeId;
    const resp = await axios.get(`${baseURL}/observability/ratelimit`, { params });
    return resp.data;
  }

  async getWorkerPool() {
    const resp = await axios.get(`${baseURL}/observability/workerpool`);
    return resp.data;
  }
}

export default ObservabilityRepositoryImpl;
