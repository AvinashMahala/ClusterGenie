// frontend/src/components/ProvisioningPanel.tsx

import { useState, useEffect } from 'react';
import { ProvisioningService } from '../services/provisioningService';
import { ClusterService } from '../services/clusterService';
import type { Droplet, CreateDropletRequest } from '../models';
import { Hero } from './Hero';
import { TabNavigation, type TabType } from './TabNavigation';
import { OverviewTab } from './OverviewTab';
import { CreateDropletTab } from './CreateDropletTab';
import { DropletsListTab } from './DropletsListTab';
import './ProvisioningPanel.scss';

const provisioningService = new ProvisioningService();
const clusterService = new ClusterService();

export function ProvisioningPanel() {
  const [droplets, setDroplets] = useState<Droplet[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [form, setForm] = useState<CreateDropletRequest>({
    name: '',
    // optional cluster selection
    "cluster_id": undefined,
    region: 'nyc1',
    size: 's-1vcpu-1gb',
    image: 'ubuntu-20-04-x64',
  });
  const [clusters, setClusters] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [clusterError, setClusterError] = useState<string | null>(null);

  useEffect(() => {
    loadDroplets();
    (async () => {
      try {
        const list = await clusterService.listClusters();
        setClusters(list || []);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    try {
      setError(null);
      await provisioningService.createDroplet(form);
      await loadDroplets();
      setForm({ name: '', "cluster_id": undefined, region: 'nyc1', size: 's-1vcpu-1gb', image: 'ubuntu-20-04-x64' });
    } catch (err: any) {
      console.error('Failed to create droplet:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (typeof msg === 'string' && msg.toLowerCase().includes('cluster not found')) {
        setClusterError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDroplets = async () => {
    try {
      const list = await provisioningService.listDroplets();
      setDroplets(list || []);
    } catch (error) {
      console.error('Failed to load droplets:', error);
      setDroplets([]);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await provisioningService.deleteDroplet(id);
      await loadDroplets();
    } catch (error) {
      console.error('Failed to delete droplet:', error);
    }
  };

  const handleQuickDeploy = (config: Partial<CreateDropletRequest>) => {
    setForm({
      ...form,
      ...config
    });
    setActiveTab('create');
  };

  return (
    <div className="provisioning-panel">
      <Hero
        title="Cloud Infrastructure"
        subtitle="Deploy and manage DigitalOcean droplets"
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
          </svg>
        }
        stats={[
          { value: (droplets || []).length, label: 'Droplets' },
          { value: (droplets || []).filter(d => d.status === 'active').length, label: 'Active' },
          { value: (droplets || []).filter(d => d.status === 'provisioning').length, label: 'Pending' }
        ]}
        variant="compact"
      />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewTab onQuickDeploy={handleQuickDeploy} />
        )}

        {activeTab === 'create' && (
          <CreateDropletTab
            form={form}
            loading={loading}
            clusters={clusters}
            error={error}
            onClearError={() => setError(null)}
            clusterError={clusterError}
            onClearClusterError={() => setClusterError(null)}
            onFormChange={setForm}
            onCreate={handleCreate}
          />
        )}

        {activeTab === 'droplets' && (
          <DropletsListTab
            droplets={droplets}
            loading={loading}
            onRefresh={loadDroplets}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
