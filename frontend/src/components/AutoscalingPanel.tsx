import React, { useEffect, useState } from 'react';
import './AutoscalingPanel.scss';
import { ClusterService, AutoscalingService, MonitoringService } from '../services';
import { Panel, PanelHeader, PanelContent, Card, CardHeader, CardContent, ActionButton, Select, Input, StatusBadge } from './common';
import { useToast } from './Toast/ToastProvider';
import EvaluateModal from './EvaluateModal';
import AutoscalingTopBar from './AutoscalingTopBar';
import type { AutoscalePolicy, CreateAutoscalePolicyRequest } from '../models/autoscale';
import PolicyCard from './PolicyCard';
import PolicyEditor from './PolicyEditor';
import Sparkline from './Sparkline';

const clusterSvc = new ClusterService();
const autosvc = new AutoscalingService();
const monitoringSvc = new MonitoringService();

export const AutoscalingPanel: React.FC = () => {
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [policies, setPolicies] = useState<AutoscalePolicy[]>([]);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState<boolean>(false);
  const [editorInitial, setEditorInitial] = useState<any | null>(null);
  const [detailPolicy, setDetailPolicy] = useState<AutoscalePolicy | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEnabled, setFilterEnabled] = useState<string>('all');
  const [detailMetrics, setDetailMetrics] = useState<number[]>([]);
  const [evaluateOpen, setEvaluateOpen] = useState<boolean>(false);
  const [evaluateResult, setEvaluateResult] = useState<any | null>(null);
  // used when opening editor; no inline create form anymore

  useEffect(() => {
    clusterSvc.listClusters().then((c) => setClusters(c || []));
  }, []);

  useEffect(() => {
    if (selectedCluster) loadPolicies(selectedCluster);
  }, [selectedCluster]);

  const loadPolicies = async (clusterID: string) => {
    const list = await autosvc.listPolicies(clusterID);
    setPolicies(list || []);
  };

  const { addToast } = useToast();

  // No inline create - use modal editor for creating & editing

  const onDelete = async (id: string) => {
    const ok = window.confirm('Delete policy?');
    if (!ok) return;
    try {
      await autosvc.deletePolicy(id);
      await loadPolicies(selectedCluster);
      addToast({ type: 'success', message: 'Policy deleted' });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Failed to delete policy' });
    }
  };

  const onToggle = async (id: string, enabled: boolean) => {
    try {
      // updatePolicy expects a full request type — cast here for partial update (toggle enabled)
      await autosvc.updatePolicy(id, { enabled } as any);
      await loadPolicies(selectedCluster);
      addToast({ type: 'success', message: `Policy ${enabled ? 'enabled' : 'disabled'}` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Failed to update policy' });
    }
  };

  const onEdit = async (policy: AutoscalePolicy) => {
    // open editor modal pre-filled
    setEditorInitial({
      name: policy.name,
      cluster_id: policy.cluster_id,
      type: policy.type,
      enabled: policy.enabled,
      min_replicas: policy.min_replicas,
      max_replicas: policy.max_replicas,
      metric_type: policy.metric_type || 'cpu',
      metric_trigger: policy.metric_trigger || 0.8,
      time_window: policy.time_window,
      cost_limit: policy.cost_limit,
    });
    setEditingPolicyId(policy.id);
    setEditorOpen(true);
  };

  const onDuplicate = async (policy: AutoscalePolicy) => {
    // open editor with copy
    setEditingPolicyId(null);
    setEditorInitial({
      name: `${policy.name} (copy)`,
      cluster_id: selectedCluster,
      type: policy.type,
      enabled: policy.enabled,
      min_replicas: policy.min_replicas,
      max_replicas: policy.max_replicas,
      metric_type: policy.metric_type || 'cpu',
      metric_trigger: policy.metric_trigger || 0.8,
      time_window: policy.time_window,
      cost_limit: policy.cost_limit,
    });
    setEditorOpen(true);
  };

  const onEditorSave = async (req: CreateAutoscalePolicyRequest) => {
    try {
      if (editingPolicyId) {
        await autosvc.updatePolicy(editingPolicyId, req);
        addToast({ type: 'success', message: 'Updated policy' });
      } else {
        await autosvc.createPolicy(req);
        addToast({ type: 'success', message: 'Created policy' });
      }
      setEditorOpen(false);
      setEditingPolicyId(null);
      setEditorInitial(null);
      await loadPolicies(selectedCluster);
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Failed to save policy' });
    }
  };

  // When a policy is selected to view details, fetch a small metric window (if metrics policy)
  useEffect(() => {
    async function fetchDetailsMetrics() {
      if (!detailPolicy || !detailPolicy.metric_type) {
        setDetailMetrics([]);
        return;
      }
      try {
        // metric_type in policy is a string; cast to the MonitoringService expected union type
        const resp = await monitoringSvc.getMetrics(detailPolicy.cluster_id, detailPolicy.metric_type as any, 1, 24);
        setDetailMetrics((resp.metrics || []).map((m) => Number(m.value)));
      } catch (err) {
        setDetailMetrics([]);
      }
    }
    fetchDetailsMetrics();
  }, [detailPolicy]);

  const onEvaluate = async () => {
    try {
      const r = await autosvc.evaluate(selectedCluster);
      setEvaluateResult(r);
      setEvaluateOpen(true);
      addToast({ type: 'info', message: 'Evaluation finished' });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Evaluation failed' });
    }
  };

  return (
    <Panel>
      <PanelHeader title="Autoscaling" subtitle="Manage autoscaling policies and evaluate simulations" />
      <PanelContent>
      <div className="autoscaling-panel autoscaling-page">
      <AutoscalingTopBar
        clusters={clusters}
        selectedCluster={selectedCluster}
        setSelectedCluster={setSelectedCluster}
        onEvaluate={onEvaluate}
        onRefresh={() => loadPolicies(selectedCluster)}
        onNewPolicy={() => { setEditorInitial({ cluster_id: selectedCluster }); setEditorOpen(true); }}
      />

      <div className="autoscaling-body">


        <div className="left-pane col">
          <Card>
            <CardHeader title="Create policy" subtitle="Templates and quickstarts" />
            <CardContent>
            <div style={{padding:'0px 4px'}}>
            <div style={{marginBottom:8, color:'#6b7280'}}>Create from templates or create a custom policy. Templates help you quickly get started.</div>

            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <div style={{flex:1}}>
                  <strong>CPU based autoscale</strong>
                  <div className="muted" style={{fontSize:'0.85rem'}}>Scale by CPU usage — common for web services</div>
                </div>
                <div>
                  <button aria-label="Use CPU template" title="Use CPU autoscale template" className="action-button small" onClick={() => { setEditorInitial({ name: 'CPU autoscale', cluster_id: selectedCluster, type: 'metrics', enabled: true, min_replicas: 1, max_replicas: 5, metric_type: 'cpu', metric_trigger: 0.7 }); setEditorOpen(true); }}>Use</button>
                </div>
              </div>

              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <div style={{flex:1}}>
                  <strong>Time of day scaling</strong>
                  <div className="muted" style={{fontSize:'0.85rem'}}>Scale up during business hours and down overnight</div>
                </div>
                <div>
                  <button aria-label="Use business-hours template" title="Use time-of-day template" className="action-button small" onClick={() => { setEditorInitial({ name: 'Business hours', cluster_id: selectedCluster, type: 'time_of_day', enabled: true, min_replicas: 1, max_replicas: 6, time_window: '08:00-18:00' }); setEditorOpen(true); }}>Use</button>
                </div>
              </div>

              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <div style={{flex:1}}>
                  <strong>Cost constrained</strong>
                  <div className="muted" style={{fontSize:'0.85rem'}}>Limit autoscaling to stay within a cost budget</div>
                </div>
                <div>
                  <button aria-label="Use cost limit template" title="Use cost-constrained template" className="action-button small" onClick={() => { setEditorInitial({ name: 'Cost limit', cluster_id: selectedCluster, type: 'cost', enabled: true, min_replicas: 1, max_replicas: 4, cost_limit: 100 }); setEditorOpen(true); }}>Use</button>
                </div>
              </div>
            </div>
            </div>
            </CardContent>
          </Card>
        </div>

        <div className="right-pane col">
          <Card>
            <CardHeader title="Policies" subtitle="Active policies for the selected cluster" />
            <CardContent>
          {!selectedCluster && <div className="muted">Select a cluster to view policies</div>}
          {selectedCluster && (
            <div className="policies-list">
              {policies.length === 0 && <div className="muted">No policies yet</div>}
              <div className="toolbar">
                <div className="filter-controls">
                  <input placeholder="Search policies" value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)} />
                  <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <option value="all">All types</option>
                    <option value="metrics">Metrics</option>
                    <option value="time_of_day">Time of day</option>
                    <option value="cost">Cost</option>
                  </select>
                  <select value={filterEnabled} onChange={(e) => setFilterEnabled(e.target.value)}>
                    <option value="all">All</option>
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <div className="policies-grid">
                {policies
                  .filter((p) => filterQuery === '' || p.name.toLowerCase().includes(filterQuery.toLowerCase()))
                  .filter((p) => filterType === 'all' || p.type === filterType)
                  .filter((p) => filterEnabled === 'all' || (filterEnabled === 'enabled' ? p.enabled : !p.enabled))
                  .map((p) => (
                    <PolicyCard
                      key={p.id}
                      policy={p}
                      onDelete={onDelete}
                      onToggle={onToggle}
                      onEdit={onEdit}
                      onDuplicate={onDuplicate}
                      onOpen={(pp) => setDetailPolicy(pp)}
                    />
                  ))}
              </div>
            </div>
          )}
            </CardContent>
          </Card>
        </div>
      </div>
      {detailPolicy && (
        <div className="policy-drawer" role="dialog" aria-label="policy-details">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e6e9ef' }}>
            <div>
              <strong style={{ fontSize: '1.05rem' }}>{detailPolicy.name}</strong>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Type: {detailPolicy.type} • {detailPolicy.enabled ? 'Enabled' : 'Disabled'}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="action-button" onClick={() => setDetailPolicy(null)}>Close</button>
            </div>
          </div>

          <div style={{ padding: '12px 16px' }}>
            <div style={{ marginBottom: '8px' }}><strong>Range</strong>: min {detailPolicy.min_replicas} — max {detailPolicy.max_replicas}</div>
            {detailPolicy.metric_type && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Metric</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
                  <div style={{ width: '160px', height: '36px', display: 'flex', alignItems: 'center' }}>
                    {detailMetrics.length === 0 && <div className="muted">no metric samples</div>}
                    {detailMetrics.length > 0 && (
                      <Sparkline values={detailMetrics} width={160} height={36} />
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>{detailMetrics.length ? `${detailMetrics[detailMetrics.length - 1]} ${detailPolicy.metric_type}` : '—'}</div>
                </div>
              </div>
            )}

            <div style={{ marginTop: '8px' }}>
              <strong>Details</strong>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: '6px', fontSize: '0.85rem', color: '#374151' }}>{JSON.stringify(detailPolicy, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
      <PolicyEditor
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingPolicyId(null); setEditorInitial(null); }}
        onSave={onEditorSave}
        initial={editorInitial}
        editing={!!editingPolicyId}
        clusters={clusters}
        defaultCluster={selectedCluster}
      />
      <EvaluateModal open={evaluateOpen} onClose={() => setEvaluateOpen(false)} results={evaluateResult} />
      </div>
      </PanelContent>
    </Panel>
  );
};

export default AutoscalingPanel;
