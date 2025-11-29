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

  async getRateLimitConfig(name: string, scopeType?: string, scopeId?: string) {
    const params: any = { name };
    if (scopeType) params.scope_type = scopeType;
    if (scopeId) params.scope_id = scopeId;
    const resp = await axios.get(`${baseURL}/observability/ratelimit/config`, { params });
    return resp.data;
  }

  async listRateLimitConfigs(name?: string, scopeType?: string, scopeId?: string) {
    const params: any = {};
    if (name) params.name = name;
    if (scopeType) params.scope_type = scopeType;
    if (scopeId) params.scope_id = scopeId;
    const resp = await axios.get(`${baseURL}/observability/ratelimit/config/list`, { params });
    return resp.data;
  }

  async setRateLimitConfig(body: { name: string; scope_type?: string; scope_id?: string; refill_rate?: number; capacity?: number }) {
    const resp = await axios.post(`${baseURL}/observability/ratelimit/config`, body);
    return resp.data;
  }

  async deleteRateLimitConfig(body: { name?: string; scope_type?: string; scope_id?: string; key?: string }) {
    // axios.delete with a body needs to set data
    const resp = await axios.delete(`${baseURL}/observability/ratelimit/config`, { data: body });
    return resp.data;
  }
}

export default ObservabilityRepositoryImpl;
