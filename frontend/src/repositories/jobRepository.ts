// frontend/src/repositories/jobRepository.ts

import type { JobRepository } from '../interfaces/jobRepository';
import type { Job, CreateJobRequest, JobResponse } from '../models/job';
// @ts-ignore
import { JobServiceClient } from '../hello_grpc_web_pb';
import '../hello_pb';

const host = 'http://localhost:8080'; // gRPC-Web proxy

export class JobRepositoryImpl implements JobRepository {
  private client = new JobServiceClient(host);

  async createJob(request: CreateJobRequest): Promise<JobResponse> {
    return new Promise((resolve, reject) => {
      const req = new (globalThis as any).proto.clustergenie.CreateJobRequest();
      req.setType(request.type);

      // Convert parameters map
      const paramsMap = req.getParametersMap();
      Object.entries(request.parameters).forEach(([key, value]) => {
        paramsMap.set(key, value);
      });

      this.client.createJob(req, {}, (err: any, response: any) => {
        if (err) {
          reject(err);
        } else {
          const job = this.mapProtoToJob(response.getJob());
          resolve({
            job,
            message: response.getMessage(),
          });
        }
      });
    });
  }

  async getJob(id: string): Promise<Job> {
    return new Promise((resolve, reject) => {
      const req = new (globalThis as any).proto.clustergenie.GetJobRequest();
      req.setId(id);

      this.client.getJob(req, {}, (err: any, response: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.mapProtoToJob(response.getJob()));
        }
      });
    });
  }

  async listJobs(): Promise<Job[]> {
    return new Promise((resolve, reject) => {
      const req = new (globalThis as any).proto.clustergenie.ListJobsRequest();

      this.client.listJobs(req, {}, (err: any, response: any) => {
        if (err) {
          reject(err);
        } else {
          const jobs = response.getJobsList().map((job: any) => this.mapProtoToJob(job));
          resolve(jobs);
        }
      });
    });
  }

  private mapProtoToJob(protoJob: any): Job {
    const job: Job = {
      id: protoJob.getId(),
      type: protoJob.getType() as Job['type'],
      status: protoJob.getStatus() as Job['status'],
      createdAt: new Date(protoJob.getCreatedAt()),
    };

    if (protoJob.getCompletedAt()) {
      job.completedAt = new Date(protoJob.getCompletedAt());
    }
    if (protoJob.getResult()) {
      job.result = protoJob.getResult();
    }
    if (protoJob.getError()) {
      job.error = protoJob.getError();
    }

    return job;
  }
}