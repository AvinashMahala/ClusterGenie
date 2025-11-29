export interface Provider {
  id: string;
  name: string;
  regions: string[];
  capacity: number;
  used?: number;
  classes?: string[];
}

export interface CreateProviderRequest {
  name: string;
  regions: string[];
  capacity: number;
  classes?: string[];
}
