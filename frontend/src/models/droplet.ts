// frontend/src/models/droplet.ts

export interface Droplet {
  id: string;
  name: string;
  cluster?: import('./cluster').Cluster;
  cluster_id?: string | null;
  region: string;
  size: string;
  image: string;
  status: 'active' | 'inactive' | 'provisioning';
  createdAt: Date;
  ipAddress?: string;
}

export interface CreateDropletRequest {
  name: string;
  // attach created droplet to this cluster (optional)
  "cluster_id"?: string | null;
  region: string;
  size: string;
  image: string;
}

export interface DropletResponse {
  droplet: Droplet;
  message: string;
}