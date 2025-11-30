import { useState, useEffect } from 'react';
import { ObservabilityService } from '../services/observabilityService';
import { Panel, PanelHeader, PanelContent, Card, CardHeader, CardContent, ActionButton, LoadingSpinner, Alert } from './common';
import './LimiterRulesPanel.scss';

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

  // create/edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const openCreate = () => {
    setEditing({ name: '', scope: 'global', scope_id: '', config: { refill_rate: '', capacity: '' } });
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    // normalize shape for the form
    setEditing({ ...item, config: { refill_rate: item.config?.refill_rate || '', capacity: item.config?.capacity || '' } });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const submitForm = async () => {
    if (!editing) return;
    setFormSubmitting(true);
    try {
      const body: any = { name: editing.name };
      if (editing.scope && editing.scope !== 'global') {
        body.scope_type = editing.scope;
        body.scope_id = editing.scope_id || '';
      }
      if (editing.config?.refill_rate !== '') body.refill_rate = Number(editing.config.refill_rate);
      if (editing.config?.capacity !== '') body.capacity = Number(editing.config.capacity);

      await obsService.setRateLimitConfig(body);
      await load();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <Panel>
      <PanelHeader title="Limiter rules" subtitle="View and manage persisted limiter configs (Redis)" />
      <PanelContent>
        <Card>
          <CardHeader title="Persisted rules" subtitle={`${items.length} rules`} />
          <CardContent>
            <div className="limiter-controls">
              <div className="search-input">
                <input placeholder="Filter by name" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
                <ActionButton variant="secondary" size="sm" onClick={load} disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" /> : 'Refresh'}
                </ActionButton>
              </div>
              <div className="control-actions">
                <ActionButton variant="primary" size="md" onClick={openCreate}>Add Rule</ActionButton>
              </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

            <div className="rules-table-wrap">
              {items.length === 0 && !loading ? (
                <div className="empty-state">No persisted limiter rules</div>
              ) : (
                <table className="rules-table" role="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Scope</th>
                      <th>Refill rate</th>
                      <th>Capacity</th>
                      <th style={{ width: 170 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.key} className="rule-row">
                        <td className="rule-col-name">
                          <div className="name">{it.name}</div>
                          <div className="meta">Key: <code>{it.key}</code></div>
                        </td>
                        <td>{it.scope || 'global'}</td>
                        <td>{it.config?.refill_rate ?? '—'}</td>
                        <td>{it.config?.capacity ?? '—'}</td>
                        <td>
                          <div className="actions">
                            <ActionButton variant="secondary" size="sm" onClick={() => openEdit(it)}>Edit</ActionButton>
                            <ActionButton variant="danger" size="sm" onClick={() => del(it.key)}>Delete</ActionButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal: Create / Edit rule */}
            {showModal && editing && (
              <div className="modal-overlay" role="dialog" aria-modal="true">
                <div className="modal-card">
                  <div className="modal-header">
                    <div className="modal-title">{editing?.key ? 'Edit rule' : 'Create rule'}</div>
                    <div className="modal-actions">
                      <ActionButton variant="secondary" size="sm" onClick={closeModal}>Cancel</ActionButton>
                      <ActionButton variant="primary" size="sm" onClick={submitForm} disabled={formSubmitting}>
                        {formSubmitting ? <LoadingSpinner size="sm" /> : 'Save'}
                      </ActionButton>
                    </div>
                  </div>

                  <div className="modal-body">
                    <div className="form-row">
                      <label>Name</label>
                      <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                    </div>

                    <div className="form-row">
                      <label>Scope</label>
                      <select value={editing.scope} onChange={(e) => setEditing({ ...editing, scope: e.target.value })}>
                        <option value="global">global</option>
                        <option value="cluster">cluster</option>
                      </select>
                    </div>

                    {editing.scope && editing.scope !== 'global' && (
                      <div className="form-row">
                        <label>Scope ID</label>
                        <input value={editing.scope_id} onChange={(e) => setEditing({ ...editing, scope_id: e.target.value })} />
                      </div>
                    )}

                    <div className="form-row grid-2">
                      <div>
                        <label>Refill rate</label>
                        <input value={editing.config?.refill_rate} onChange={(e) => setEditing({ ...editing, config: { ...editing.config, refill_rate: e.target.value } })} />
                      </div>
                      <div>
                        <label>Capacity</label>
                        <input value={editing.config?.capacity} onChange={(e) => setEditing({ ...editing, config: { ...editing.config, capacity: e.target.value } })} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </PanelContent>
    </Panel>
  );
}

export default LimiterRulesPanel;
