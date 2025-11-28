// frontend/src/repositories/jobRepository.ts

import type { JobRepository } from '../interfaces/jobRepository';
import type { Job, CreateJobRequest, JobResponse } from '../models/job';
import axios from 'axios';

const baseURL = 'http://localhost:8080/api/v1';

export class JobRepositoryImpl implements JobRepository {
  async createJob(request: CreateJobRequest): Promise<JobResponse> {
    const response = await axios.post(`${baseURL}/jobs`, request);
    return response.data;
  }

  async getJob(id: string): Promise<Job> {
    const response = await axios.get(`${baseURL}/jobs/${id}`);
    return response.data.job;
  }

  async listJobs(): Promise<Job[]> {
    const response = await axios.get(`${baseURL}/jobs`);
    return response.data.jobs;
  }
}