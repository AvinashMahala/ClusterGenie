// frontend/src/interfaces/jobRepository.ts

import type { Job, CreateJobRequest, JobResponse, ListJobsResponse } from '../models/job';

export interface JobRepository {
  createJob(request: CreateJobRequest): Promise<JobResponse>;
  getJob(id: string): Promise<Job>;
  listJobs(page?: number, pageSize?: number, sortBy?: string, sortDir?: string): Promise<ListJobsResponse>;
}