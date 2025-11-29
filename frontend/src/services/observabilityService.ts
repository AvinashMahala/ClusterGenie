import type ObservabilityRepository from '../repositories/observabilityRepository';
import { ObservabilityRepositoryImpl } from '../repositories/observabilityRepository';

export class ObservabilityService {
  private repo: any;

  constructor(repo: any = new ObservabilityRepositoryImpl()) {
    this.repo = repo;
  }

  async getRateLimit(name: string) {
    return this.repo.getRateLimit(name);
  }

  async getRateLimitScoped(name: string, scopeType?: string, scopeId?: string) {
    return this.repo.getRateLimit(name, scopeType, scopeId);
  }

  async getWorkerPool() {
    return this.repo.getWorkerPool();
  }

  async getRateLimitConfig(name: string, scopeType?: string, scopeId?: string) {
    return this.repo.getRateLimitConfig(name, scopeType, scopeId);
  }

  async listRateLimitConfigs(name?: string, scopeType?: string, scopeId?: string) {
    return this.repo.listRateLimitConfigs(name, scopeType, scopeId);
  }

  async setRateLimitConfig(body: { name: string; scope_type?: string; scope_id?: string; refill_rate?: number; capacity?: number }) {
    return this.repo.setRateLimitConfig(body);
  }

  async deleteRateLimitConfig(body: { name?: string; scope_type?: string; scope_id?: string; key?: string }) {
    return this.repo.deleteRateLimitConfig(body);
  }
}

export default ObservabilityService;
