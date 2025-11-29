// frontend/src/repositories/jobRepository.ts

import type { JobRepository } from '../interfaces/jobRepository';
import type { Job, CreateJobRequest, JobResponse, ListJobsResponse } from '../models/job';
import axios from 'axios';

import { API_BASE } from '../lib/config';
const baseURL = API_BASE;

export class JobRepositoryImpl implements JobRepository {
  async createJob(request: CreateJobRequest): Promise<JobResponse> {
    const response = await axios.post(`${baseURL}/jobs`, request);
    const jobResponse = response.data;
    const rawJob = jobResponse.job || {};
    const created = rawJob.createdAt ?? rawJob.created_at;
    const completed = rawJob.completedAt ?? rawJob.completed_at;
    return {
      ...jobResponse,
      job: {
        ...rawJob,
        createdAt: created ? new Date(created) : undefined,
        completedAt: completed ? new Date(completed) : undefined,
        progress: rawJob.progress ?? 0,
      },
    };
  }

  async getJob(id: string): Promise<Job> {
    const response = await axios.get(`${baseURL}/jobs/${id}`);
    const job = response.data.job || {};
    const created = job.createdAt ?? job.created_at;
    const completed = job.completedAt ?? job.completed_at;
    return {
      ...job,
      createdAt: created ? new Date(created) : undefined,
      completedAt: completed ? new Date(completed) : undefined,
      progress: job.progress ?? 0,
    };
  }

  async listJobs(page = 1, pageSize = 5, sortBy = 'created_at', sortDir = 'desc'): Promise<ListJobsResponse> {
    const params: any = { page, page_size: pageSize };
    if (sortBy) params.sort_by = sortBy;
    if (sortDir) params.sort_dir = sortDir;
    const response = await axios.get(`${baseURL}/jobs`, { params });
    const data = response.data as any;
    const jobs = (data.jobs || []).map((job: any) => {
      const created = job.createdAt ?? job.created_at;
      const completed = job.completedAt ?? job.completed_at;
      return {
        ...job,
        createdAt: created ? new Date(created) : undefined,
        completedAt: completed ? new Date(completed) : undefined,
        progress: job.progress ?? 0,
      } as Job;
    });

    return {
      jobs,
      page: data.page ?? page,
      page_size: data.page_size ?? pageSize,
      total: data.total ?? jobs.length,
    };
  }
}