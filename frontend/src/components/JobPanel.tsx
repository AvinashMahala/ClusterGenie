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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Management</h2>

      <div className="space-y-6">
        {/* Create Job Form */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Job</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <select
                id="jobType"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as Job['type'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="provision">Provision</option>
                <option value="diagnose">Diagnose</option>
                <option value="scale">Scale</option>
                <option value="monitor">Monitor</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreateJob}
                disabled={creating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Job'}
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
            <button
              onClick={loadJobs}
              disabled={loading}
              className="bg-gray-100 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {jobs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No jobs found</p>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">Job {job.id}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">{job.type}</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Created: {formatDate(job.createdAt)}</p>
                        {job.completedAt && <p>Completed: {formatDate(job.completedAt)}</p>}
                      </div>
                      {job.error && (
                        <p className="text-xs text-red-600 mt-1">Error: {job.error}</p>
                      )}
                      {job.result && (
                        <p className="text-xs text-green-600 mt-1">Result: {job.result}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}