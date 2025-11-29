import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JobService } from '../services/jobService';
import type { Job } from '../models/job';
import { Panel, PanelHeader, PanelContent, ActionButton, StatusBadge } from './common';

const jobService = new JobService();

export function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const j = await jobService.getJob(id);
        setJob(j);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch job');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <Panel>
      <PanelHeader
        title={`Job ${id}`}
        subtitle={job ? `Type: ${job.type}` : 'Loading job details'}
        actions={(
          <>
            <ActionButton variant="secondary" onClick={() => navigate('/jobs')}>Back</ActionButton>
          </>
        )}
      />
      <PanelContent>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {job && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>Status:</div>
              <StatusBadge status={job.status} />
            </div>
            <div><strong>Type:</strong> {job.type}</div>
            <div><strong>Created:</strong> {job.createdAt?.toLocaleString() ?? 'Unknown'}</div>
            <div><strong>Completed:</strong> {job.completedAt?.toLocaleString() ?? '—'}</div>
            <div><strong>Progress:</strong> {job.progress ?? 0}%</div>
            {job.parameters && (
              <div>
                <strong>Parameters:</strong>
                <pre style={{ background: '#f8fafc', padding: 8, borderRadius: 6 }}>{String(job.parameters)}</pre>
              </div>
            )}
            {job.result && (
              <div><strong>Result:</strong> {String(job.result)}</div>
            )}
            {job.error && (
              <div style={{ color: '#b91c1c' }}><strong>Error:</strong> {job.error}</div>
            )}
          </div>
        )}
      </PanelContent>
    </Panel>
  );
}
