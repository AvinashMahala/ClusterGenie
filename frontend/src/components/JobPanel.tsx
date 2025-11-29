// frontend/src/components/JobPanel.tsx

import { useState, useEffect } from 'react';
import { JobService } from '../services/jobService';
import type { Job, CreateJobRequest } from '../models/job';
import { Panel, PanelHeader, PanelContent, FormSection, FormField, FormGrid, ActionButton, EmptyState, Alert, StatusBadge, Select } from './common';
import '../styles/JobPanel.scss';

const jobService = new JobService();

export function JobPanel() {
  const [jobs, setJobs] = useState<Job[]>([]);
  // Polling enabled by default
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateJobRequest>({
    type: 'provision',
    parameters: {},
  });

  // Table / pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);
  const [sortField, setSortField] = useState<'createdAt' | 'id'>('createdAt');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

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

    // Poll frequently for live job updates while there are running/queued jobs
    const interval = setInterval(async () => {
      await loadJobs();
    }, 3000);
    return () => clearInterval(interval);
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

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Unknown';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // sorting helpers
  const toggleSort = (field: 'createdAt' | 'id') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  // derive sorted + paginated
  const sortedJobs = [...jobs].sort((a, b) => {
    let val = 0;
    if (sortField === 'createdAt') {
      val = +new Date(a.createdAt).getTime() - +new Date(b.createdAt).getTime();
    } else {
      val = a.id.localeCompare(b.id);
    }
    return sortDir === 'desc' ? -val : val;
  });

  const total = sortedJobs.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pagedJobs = sortedJobs.slice((page - 1) * pageSize, page * pageSize);

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

        <div className="list-section job-panel">
          <h2>Recent Jobs</h2>

          <div className="jobs-table-area">
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
              <>
                <div className="table-controls">
                  <div className="left-controls">
                    <label>
                      Rows per page:
                      <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                        {[5, 8, 10, 20].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </label>
                    <div className="summary">Showing <strong>{Math.min(total, (page - 1) * pageSize + 1)}</strong> - <strong>{Math.min(total, page * pageSize)}</strong> of <strong>{total}</strong></div>
                  </div>

                  <div className="right-controls">
                    <div className="sort-pill">Sort:
                      <button className={`sort-btn ${sortField === 'createdAt' ? 'active' : ''}`} onClick={() => toggleSort('createdAt')}>
                        Date {sortField === 'createdAt' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                      </button>
                      <button className={`sort-btn ${sortField === 'id' ? 'active' : ''}`} onClick={() => toggleSort('id')}>
                        ID {sortField === 'id' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                      </button>
                    </div>
                  </div>
                  <div className="table-hint">Click a column header or the Sort buttons to change ordering. Newest is shown by default.</div>
                </div>

                <div className="table-wrap">
                  <table className="jobs-table">
                    <thead>
                      <tr>
                        <th className="col-id">ID</th>
                        <th className="col-type">Type</th>
                        <th className="col-status">Status</th>
                        <th className="col-created" onClick={() => toggleSort('createdAt')}>
                          Created{sortField === 'createdAt' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                        </th>
                        <th className="col-progress">Progress</th>
                        <th className="col-details">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedJobs.map((job) => (
                        <tr key={job.id} className="job-row">
                          <td className="col-id">{job.id}</td>
                          <td className="col-type">{job.type}</td>
                          <td className="col-status"><StatusBadge status={job.status} /></td>
                          <td className="col-created">{formatDate(job.createdAt)}</td>
                          <td className="col-progress">
                            {typeof job.progress === 'number' && job.progress >= 0 ? (
                              <div className="mini-progress">
                                <div className="mini-bar" style={{ width: `${job.progress}%` }} />
                                <div className="mini-label">{job.progress}%</div>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="col-details">
                            {job.error ? <div className="job-error">{job.error}</div> : (job.result ? <div className="job-result">{String(job.result)}</div> : '—')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pagination-controls">
                  <div className="left" />
                  <div className="right">
                    <button onClick={() => setPage(1)} disabled={page === 1}>« First</button>
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹ Prev</button>
                    <span className="page-indicator">Page {page} of {pageCount}</span>
                    <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}>Next ›</button>
                    <button onClick={() => setPage(pageCount)} disabled={page === pageCount}>Last »</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </PanelContent>
    </Panel>
  );
}