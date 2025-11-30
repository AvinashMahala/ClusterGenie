import React, { useEffect, useState } from 'react';
import { MonitoringService } from '../services';
import { Select, ActionButton, StatusBadge } from './common';

const monitoringSvc = new MonitoringService();

interface Props {
  clusters: any[];
  selectedCluster: string;
  setSelectedCluster: (id: string) => void;
  onEvaluate: () => void;
  onRefresh: () => void;
  onNewPolicy: () => void;
}

export const AutoscalingTopBar: React.FC<Props> = ({ clusters, selectedCluster, setSelectedCluster, onEvaluate, onRefresh, onNewPolicy }) => {
  const [cpuAvg, setCpuAvg] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCpu() {
      if (!selectedCluster) {
        setCpuAvg(null);
        return;
      }
      try {
        const res = await monitoringSvc.getMetrics(selectedCluster, 'cpu', 1, 12);
        const m = res.metrics || [];
        if (m.length === 0) {
          setCpuAvg(null);
          return;
        }
        const avg = m.reduce((acc, v) => acc + Number(v.value), 0) / m.length;
        setCpuAvg(Number(avg.toFixed(1)));
      } catch (err) {
        setCpuAvg(null);
        // swallow — parent may show toasts later
      }
    }

    fetchCpu();
  }, [selectedCluster]);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="page-title">
          <h2>Autoscaling</h2>
          <div className="subtitle">Manage autoscaling policies and evaluate simulations</div>
        </div>

        <div style={{minWidth: 240}}>
          <Select label="Cluster" value={selectedCluster} onChange={(e) => setSelectedCluster(e.target.value)} options={[{ value: '', label: '-- select cluster --' }, ...(clusters.map((c) => ({ value: c.id, label: c.name })))]} />
        </div>

        <div style={{display:'flex', gap: '0.75rem', marginLeft: '1rem', alignItems: 'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontWeight:700, fontSize: '0.95rem'}}>{cpuAvg === null ? '—' : `${cpuAvg}%`}</div>
            <div style={{fontSize: '0.8rem', color:'#6b7280'}}>CPU avg</div>
          </div>

          <div style={{textAlign:'center'}}>
            <div style={{fontWeight:700, fontSize: '0.95rem'}}>{selectedCluster ? 'n/a' : '—'}</div>
            <div style={{fontSize: '0.8rem', color:'#6b7280'}}>Replicas</div>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <div style={{display: 'flex', gap: '6px'}}>
          <ActionButton variant="secondary" onClick={onEvaluate} disabled={!selectedCluster}>Evaluate</ActionButton>
          <ActionButton variant="secondary" onClick={onRefresh} disabled={!selectedCluster}>Refresh</ActionButton>
        </div>

        <div>
          <ActionButton variant="primary" onClick={onNewPolicy} disabled={!selectedCluster}>New policy</ActionButton>
        </div>
      </div>
    </div>
  );
};

export default AutoscalingTopBar;
