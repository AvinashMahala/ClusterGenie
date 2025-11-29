// frontend/src/repositories/dropletRepository.ts

import type { DropletRepository } from '../interfaces/dropletRepository';
import type { Droplet, CreateDropletRequest, DropletResponse } from '../models/droplet';
import axios from 'axios';

const baseURL = 'http://localhost:8080/api/v1';

export class DropletRepositoryImpl implements DropletRepository {
  async createDroplet(request: CreateDropletRequest): Promise<DropletResponse> {
    const response = await axios.post(`${baseURL}/droplets`, request);
    // normalize droplet -> createdAt Date
    const raw = response.data;
    if (raw && raw.droplet) {
      const created = raw.droplet.createdAt ?? raw.droplet.created_at;
      raw.droplet.createdAt = created ? new Date(created) : undefined;
    }
    return raw;
  }

  async getDroplet(id: string): Promise<Droplet> {
    const response = await axios.get(`${baseURL}/droplets/${id}`);
    const raw = response.data && response.data.droplet ? response.data.droplet : response.data;
    const created = raw.createdAt ?? raw.created_at;
    return {
      ...raw,
      createdAt: created ? new Date(created) : undefined,
    } as Droplet;
  }

  async listDroplets(): Promise<Droplet[]> {
    const response = await axios.get(`${baseURL}/droplets`);
    const items = response.data?.droplets || [];
    return items.map((raw: any) => {
      const created = raw.createdAt ?? raw.created_at;
      return {
        ...raw,
        createdAt: created ? new Date(created) : undefined,
      } as Droplet;
    });
  }

  async deleteDroplet(id: string): Promise<void> {
    await axios.delete(`${baseURL}/droplets/${id}`);
  }
}