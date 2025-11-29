import { useState, useEffect } from 'react';
import { ObservabilityService } from '../services/observabilityService';
import { Panel, PanelHeader, PanelContent, Card, CardHeader, CardContent, ActionButton, LoadingSpinner, Alert } from './common';
import './MonitoringPanel.scss';

const obsService = new ObservabilityService();

export function LimiterRulesPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterName, setFilterName] = useState<string>('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await obsService.listRateLimitConfigs(filterName || undefined);
      setItems(resp.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const del = async (key: string) => {
    if (!confirm('Delete config ' + key + '?')) return;
    setLoading(true);
    try {
      await obsService.deleteRateLimitConfig({ key });
      // reload
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel>
      <PanelHeader title="Limiter rules" subtitle="View and manage persisted limiter configs (Redis)" />
      <PanelContent>
        <Card>
          <CardHeader title="Persisted rules" />
          <CardContent>
            <div className="rule-list-controls">
              <input placeholder="Filter by name (optional)" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
              <ActionButton onClick={load} disabled={loading}>{loading ? <LoadingSpinner size="sm" /> : 'Refresh'}</ActionButton>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

            <div style={{ marginTop: 12 }}>
              {items.length === 0 && !loading && <div className="text-gray-500">No persisted limiter rules</div>}
              {items.map((it) => (
                <div key={it.key} className="rule-item">
                  <div className="rule-meta">
                    <div className="rule-name">{it.name}</div>
                    <div className="rule-scope">{it.scope}</div>
                  </div>
                  <div className="rule-body">
                    <div className="rule-config">Refill: {it.config?.refill_rate || 'n/a'} — Capacity: {it.config?.capacity || 'n/a'}</div>
                    <div className="rule-actions">
                      <ActionButton onClick={() => del(it.key)}>Delete</ActionButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </PanelContent>
    </Panel>
  );
}

export default LimiterRulesPanel;
