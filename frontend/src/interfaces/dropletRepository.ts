// frontend/src/interfaces/dropletRepository.ts

import type { Droplet, CreateDropletRequest, DropletResponse } from '../models/droplet';

export interface DropletRepository {
  createDroplet(request: CreateDropletRequest): Promise<DropletResponse>;
  getDroplet(id: string): Promise<Droplet>;
  listDroplets(): Promise<Droplet[]>;
  deleteDroplet(id: string): Promise<void>;
}