// frontend/src/components/ProvisioningPanel.tsx

import { useState } from 'react';
import { ProvisioningService } from '../services/provisioningService';
import type { Droplet, CreateDropletRequest } from '../models';

const provisioningService = new ProvisioningService();

export function ProvisioningPanel() {
  const [droplets, setDroplets] = useState<Droplet[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateDropletRequest>({
    name: '',
    region: 'nyc1',
    size: 's-1vcpu-1gb',
    image: 'ubuntu-20-04-x64',
  });

  const handleCreate = async () => {
    setLoading(true);
    try {
      await provisioningService.createDroplet(form);
      await loadDroplets();
      setForm({ name: '', region: 'nyc1', size: 's-1vcpu-1gb', image: 'ubuntu-20-04-x64' });
    } catch (error) {
      console.error('Failed to create droplet:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDroplets = async () => {
    try {
      const list = await provisioningService.listDroplets();
      setDroplets(list);
    } catch (error) {
      console.error('Failed to load droplets:', error);
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

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Provisioning</h2>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Create Droplet</h3>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Region"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Size"
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Image"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            className="p-2 border rounded"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={loading || !form.name}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Droplet'}
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Droplets</h3>
        <button onClick={loadDroplets} className="mb-2 px-4 py-2 bg-green-500 text-white rounded">
          Load Droplets
        </button>
        <div className="space-y-2">
          {droplets.map((droplet) => (
            <div key={droplet.id} className="p-2 border rounded flex justify-between items-center">
              <div>
                <div className="font-semibold">{droplet.name}</div>
                <div className="text-sm text-gray-600">
                  {droplet.region} • {droplet.size} • {droplet.status}
                </div>
              </div>
              <button
                onClick={() => handleDelete(droplet.id)}
                className="px-2 py-1 bg-red-500 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}