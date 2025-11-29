import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from './common/Input';
import { Select } from './common/Select';
import { ClusterService } from '../services/clusterService';
import type { CreateClusterRequest } from '../models/cluster';
import '../styles/buttons.scss';
import './CreateClusterPanel.scss';

const clusterService = new ClusterService();

const REGION_OPTIONS = [
  { value: 'nyc1', label: 'New York (nyc1)' },
  { value: 'sfo3', label: 'San Francisco (sfo3)' },
  { value: 'ams3', label: 'Amsterdam (ams3)' },
  { value: 'lon1', label: 'London (lon1)' },
];

export function CreateClusterPanel() {
  const [form, setForm] = useState<CreateClusterRequest>({
    name: '',
    region: 'nyc1',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError('Please provide a cluster name.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await clusterService.createCluster(form);
      navigate('/clusters');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create cluster');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="create-cluster-page">
      <div className="create-cluster-header">
        <div>
          <p className="eyebrow">Clusters</p>
          <h1>Create new cluster</h1>
          <p className="subtitle">Provision an empty cluster so you can attach droplets, monitor health, and run diagnostics.</p>
        </div>
        <Link to="/clusters" className="back-link">
          ← Return to cluster list
        </Link>
      </div>

      <form className="create-cluster-form" onSubmit={handleSubmit}>
        <Input
          label="Cluster name"
          placeholder="e.g. Production API Cluster"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          required
        />
        <Select
          label="Region"
          options={REGION_OPTIONS}
          value={form.region}
          onChange={(event) => setForm((prev) => ({ ...prev, region: event.target.value }))}
        />

        <div className="form-actions">
          <button type="submit" className="btn primary" disabled={saving}>
            {saving ? 'Creating cluster…' : 'Create cluster'}
          </button>
          <p className="helper-text">Clusters are lightweight groups backed by DigitalOcean metadata. You'll add droplets once the cluster exists.</p>
        </div>

        {error && <p className="form-error">{error}</p>}
      </form>
    </div>
  );
}
