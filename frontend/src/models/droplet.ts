// frontend/src/models/droplet.ts

export interface Droplet {
  id: string;
  name: string;
  region: string;
  size: string;
  image: string;
  status: 'active' | 'inactive' | 'provisioning';
  createdAt: Date;
  ipAddress?: string;
}

export interface CreateDropletRequest {
  name: string;
  region: string;
  size: string;
  image: string;
}

export interface DropletResponse {
  droplet: Droplet;
  message: string;
}