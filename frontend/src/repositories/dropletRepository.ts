// frontend/src/repositories/dropletRepository.ts

import type { DropletRepository } from '../interfaces/dropletRepository';
import type { Droplet, CreateDropletRequest, DropletResponse } from '../models/droplet';
// @ts-ignore
import { ProvisioningServiceClient } from '../hello_grpc_web_pb';
import '../hello_pb';

const host = 'http://localhost:8080'; // gRPC-Web proxy

export class DropletRepositoryImpl implements DropletRepository {
  private client = new ProvisioningServiceClient(host);

  async createDroplet(request: CreateDropletRequest): Promise<DropletResponse> {
    return new Promise((resolve, reject) => {
      const req = new (globalThis as any).proto.clustergenie.CreateDropletRequest();
      req.setName(request.name);
      req.setRegion(request.region);
      req.setSize(request.size);
      req.setImage(request.image);

      this.client.createDroplet(req, {}, (err: any, response: any) => {
        if (err) {
          reject(err);
        } else {
          const droplet = this.mapProtoToDroplet(response.getDroplet());
          resolve({
            droplet,
            message: response.getMessage(),
          });
        }
      });
    });
  }

  async getDroplet(id: string): Promise<Droplet> {
    return new Promise((resolve, reject) => {
      const req = new (globalThis as any).proto.clustergenie.GetDropletRequest();
      req.setId(id);

      this.client.getDroplet(req, {}, (err: any, response: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.mapProtoToDroplet(response.getDroplet()));
        }
      });
    });
  }

  async listDroplets(): Promise<Droplet[]> {
    return new Promise((resolve, reject) => {
      const req = new (globalThis as any).proto.clustergenie.ListDropletsRequest();

      this.client.listDroplets(req, {}, (err: any, response: any) => {
        if (err) {
          reject(err);
        } else {
          const droplets = response.getDropletsList().map((d: any) => this.mapProtoToDroplet(d));
          resolve(droplets);
        }
      });
    });
  }

  async deleteDroplet(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = new (globalThis as any).proto.clustergenie.DeleteDropletRequest();
      req.setId(id);

      this.client.deleteDroplet(req, {}, (err: any, _response: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private mapProtoToDroplet(proto: any): Droplet {
    return {
      id: proto.getId(),
      name: proto.getName(),
      region: proto.getRegion(),
      size: proto.getSize(),
      image: proto.getImage(),
      status: proto.getStatus() as Droplet['status'],
      createdAt: new Date(proto.getCreatedAt()),
      ipAddress: proto.getIpAddress() || undefined,
    };
  }
}