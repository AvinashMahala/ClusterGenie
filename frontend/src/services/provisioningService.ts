// frontend/src/services/provisioningService.ts

import type { DropletRepository } from '../interfaces/dropletRepository';
import type { Droplet, CreateDropletRequest } from '../models/droplet';
import { DropletRepositoryImpl } from '../repositories/dropletRepository';

export class ProvisioningService {
  private dropletRepo: DropletRepository;

  constructor(dropletRepo: DropletRepository = new DropletRepositoryImpl()) {
    this.dropletRepo = dropletRepo;
  }

  async createDroplet(request: CreateDropletRequest) {
    // Business logic here, e.g., validation
    if (!request.name || !request.region) {
      throw new Error('Name and region are required');
    }
    try {
      return await this.dropletRepo.createDroplet(request);
    } catch (err: any) {
      // Map backend message for better UX
      const backendMsg = err?.response?.data?.error || (err?.message || '').toString();
      if (typeof backendMsg === 'string' && backendMsg.toLowerCase().includes('cluster not found')) {
        throw new Error('Cluster not found — please create a cluster first or pick an existing cluster from the dropdown.');
      }
      // rethrow original error
      throw err instanceof Error ? err : new Error('Failed to create droplet');
    }
  }

  async getDroplet(id: string): Promise<Droplet> {
    return this.dropletRepo.getDroplet(id);
  }

  async listDroplets(): Promise<Droplet[]> {
    return this.dropletRepo.listDroplets();
  }

  async deleteDroplet(id: string): Promise<void> {
    return this.dropletRepo.deleteDroplet(id);
  }
}