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
    return this.dropletRepo.createDroplet(request);
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