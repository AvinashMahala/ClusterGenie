// frontend/src/components/JobPanel.tsx

import { useState, useEffect } from 'react';
import { JobService } from '../services/jobService';
import type { Job, CreateJobRequest } from '../models/job';

const jobService = new JobService();

export function JobPanel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateJobRequest>({
    type: 'provision',
    parameters: {},
  });

  const loadJobs = async () => {
    setLoading(true);
    try {
      const jobList = await jobService.listJobs();
      setJobs(jobList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleCreateJob = async () => {
    setCreating(true);
    setError(null);

    try {
      await jobService.createJob(form);
      setForm({ type: 'provision', parameters: {} });
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  return (
    <div className="job-panel">
      {/* Compact Header */}
      <div className="compact-header">
        <h1>Job Management</h1>
        <p>Monitor and control background tasks</p>
      </div>

      <div className="panel-content">
        {/* Create Job Form */}
        <div className="form-section compact">
          <h2>Create New Job</h2>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="jobType">Job Type</label>
              <select
                id="jobType"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Job['type'] })}
                className="form-input"
              >
                <option value="provision">Provision</option>
                <option value="diagnose">Diagnose</option>
                <option value="scale">Scale</option>
                <option value="monitor">Monitor</option>
              </select>
            </div>
            <div className="form-actions">
              <button
                onClick={handleCreateJob}
                disabled={creating}
                className="btn-primary compact"
              >
                {creating ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="list-section compact">
          <div className="section-header">
            <h2>Recent Jobs</h2>
            <button
              onClick={loadJobs}
              disabled={loading}
              className="btn-secondary compact"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="error-message compact">
              <p>{error}</p>
            </div>
          )}

          <div className="jobs-grid">
            {jobs.length === 0 ? (
              <div className="empty-state compact">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3>No jobs found</h3>
                <p>Create your first job to get started</p>
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="job-card compact">
                  <div className="job-header">
                    <span className="job-id">Job {job.id}</span>
                    <span className={`status-badge ${job.status}`}>{job.status}</span>
                  </div>
                  <div className="job-details">
                    <span className="job-type">{job.type}</span>
                    <span className="job-time">
                      {formatDate(job.createdAt)}
                    </span>
                  </div>
                  {job.error && (
                    <div className="job-error">Error: {job.error}</div>
                  )}
                  {job.result && (
                    <div className="job-result">Result: {job.result}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
);
}
