// frontend/src/services/jobService.ts

import type { JobRepository } from '../interfaces/jobRepository';
import type { Job, CreateJobRequest, JobResponse } from '../models/job';
import { JobRepositoryImpl } from '../repositories/jobRepository';

export class JobService {
  private jobRepo: JobRepository;

  constructor(jobRepo: JobRepository = new JobRepositoryImpl()) {
    this.jobRepo = jobRepo;
  }

  async createJob(request: CreateJobRequest): Promise<JobResponse> {
    // Validate job type
    const validTypes = ['provision', 'diagnose', 'scale', 'monitor'];
    if (!validTypes.includes(request.type)) {
      throw new Error('Invalid job type');
    }

    return this.jobRepo.createJob(request);
  }

  async getJob(id: string): Promise<Job> {
    return this.jobRepo.getJob(id);
  }

  async listJobs(): Promise<Job[]> {
    return this.jobRepo.listJobs();
  }
}