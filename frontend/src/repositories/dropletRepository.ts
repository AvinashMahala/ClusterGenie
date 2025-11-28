// frontend/src/repositories/dropletRepository.ts

import type { DropletRepository } from '../interfaces/dropletRepository';
import type { Droplet, CreateDropletRequest, DropletResponse } from '../models/droplet';
import axios from 'axios';

const baseURL = 'http://localhost:8080/api/v1';

export class DropletRepositoryImpl implements DropletRepository {
  async createDroplet(request: CreateDropletRequest): Promise<DropletResponse> {
    const response = await axios.post(`${baseURL}/droplets`, request);
    return response.data;
  }

  async getDroplet(id: string): Promise<Droplet> {
    const response = await axios.get(`${baseURL}/droplets/${id}`);
    return response.data.droplet;
  }

  async listDroplets(): Promise<Droplet[]> {
    const response = await axios.get(`${baseURL}/droplets`);
    return response.data.droplets;
  }

  async deleteDroplet(id: string): Promise<void> {
    await axios.delete(`${baseURL}/droplets/${id}`);
  }
}