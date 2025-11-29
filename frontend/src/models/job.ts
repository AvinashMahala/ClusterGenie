// frontend/src/models/job.ts

export interface Job {
  id: string;
  type: 'provision' | 'diagnose' | 'scale' | 'monitor';
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  progress?: number;
}

export interface CreateJobRequest {
  type: Job['type'];
  parameters: Record<string, any>;
}

export interface JobResponse {
  job: Job;
  message: string;
}

export interface ListJobsResponse {
  jobs: Job[];
  page: number;
  page_size: number;
  total: number;
}