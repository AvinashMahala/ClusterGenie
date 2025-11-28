// frontend/src/models/job.ts

export interface Job {
  id: string;
  type: 'provision' | 'diagnose' | 'scale' | 'monitor';
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

export interface CreateJobRequest {
  type: Job['type'];
  parameters: Record<string, any>;
}

export interface JobResponse {
  job: Job;
  message: string;
}