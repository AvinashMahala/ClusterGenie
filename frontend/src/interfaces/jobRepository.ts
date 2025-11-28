// frontend/src/interfaces/jobRepository.ts

import type { Job, CreateJobRequest, JobResponse } from '../models/job';

export interface JobRepository {
  createJob(request: CreateJobRequest): Promise<JobResponse>;
  getJob(id: string): Promise<Job>;
  listJobs(): Promise<Job[]>;
}