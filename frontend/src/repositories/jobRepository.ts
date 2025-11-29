// frontend/src/repositories/jobRepository.ts

import type { JobRepository } from '../interfaces/jobRepository';
import type { Job, CreateJobRequest, JobResponse } from '../models/job';
import axios from 'axios';

const baseURL = 'http://localhost:8080/api/v1';

export class JobRepositoryImpl implements JobRepository {
  async createJob(request: CreateJobRequest): Promise<JobResponse> {
    const response = await axios.post(`${baseURL}/jobs`, request);
    const jobResponse = response.data;
    return {
      ...jobResponse,
      job: {
        ...jobResponse.job,
        createdAt: new Date(jobResponse.job.createdAt),
        completedAt: jobResponse.job.completedAt ? new Date(jobResponse.job.completedAt) : undefined,
        progress: jobResponse.job.progress ?? 0,
      },
    };
  }

  async getJob(id: string): Promise<Job> {
    const response = await axios.get(`${baseURL}/jobs/${id}`);
    const job = response.data.job;
    return {
      ...job,
      createdAt: new Date(job.createdAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
      progress: job.progress ?? 0,
    };
  }

  async listJobs(): Promise<Job[]> {
    const response = await axios.get(`${baseURL}/jobs`);
    return response.data.jobs.map((job: any) => ({
      ...job,
      createdAt: new Date(job.createdAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
      progress: job.progress ?? 0,
    }));
  }
}