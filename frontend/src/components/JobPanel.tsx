// frontend/src/components/JobPanel.tsx

import { useState, useEffect } from 'react';
import { JobService } from '../services/jobService';
import type { Job, CreateJobRequest } from '../models/job';
import { Panel, PanelHeader, PanelContent, FormSection, FormField, FormGrid, ActionButton, EmptyState, Alert, StatusBadge, Select } from './common';
import '../styles/JobPanel.scss';

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
    <Panel>
      <PanelHeader
        title="Job Management"
        subtitle="Monitor and control background tasks"
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        actions={
          <ActionButton
            onClick={loadJobs}
            disabled={loading}
            variant="secondary"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </ActionButton>
        }
      />

      <PanelContent>
        <FormSection title="Create New Job">
          <FormGrid>
            <FormField label="Job Type">
              <Select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Job['type'] })}
                options={[
                  { value: 'provision', label: 'Provision' },
                  { value: 'diagnose', label: 'Diagnose' },
                  { value: 'scale', label: 'Scale' },
                  { value: 'monitor', label: 'Monitor' }
                ]}
              />
            </FormField>
          </FormGrid>

          <div className="form-actions">
            <ActionButton
              onClick={handleCreateJob}
              disabled={creating}
              loading={creating}
            >
              {creating ? 'Creating...' : 'Create Job'}
            </ActionButton>
          </div>
        </FormSection>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div className="list-section">
          <h2>Recent Jobs</h2>

          <div className="jobs-grid">
            {jobs.length === 0 ? (
              <EmptyState
                title="No jobs found"
                description="Create your first job to get started"
                icon={
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="job-card">
                  <div className="job-header">
                    <span className="job-id">Job {job.id}</span>
                    <StatusBadge status={job.status} />
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
      </PanelContent>
    </Panel>
  );
}