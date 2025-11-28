// frontend/src/components/CreateDropletTab/CreateDropletTab.tsx


import type { CreateDropletRequest } from '../../models';
import './CreateDropletTab.scss';

export interface CreateDropletTabProps {
  form: CreateDropletRequest;
  loading: boolean;
  onFormChange: (form: CreateDropletRequest) => void;
  onCreate: () => void;
}

export function CreateDropletTab({ form, loading, onFormChange, onCreate }: CreateDropletTabProps) {
  const handleInputChange = (field: keyof CreateDropletRequest, value: string) => {
    onFormChange({
      ...form,
      [field]: value
    });
  };

  return (
    <div className="create-tab">
      <div className="create-form-card">
        <div className="form-header">
          <div className="form-icon">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          </div>
          <div>
            <h2>Create New Droplet</h2>
            <p>Configure your DigitalOcean droplet settings</p>
          </div>
        </div>

        <div className="droplet-form">
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="name">Droplet Name</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                  </svg>
                </div>
                <input
                  id="name"
                  type="text"
                  placeholder="my-droplet"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="region">Region</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <select
                  id="region"
                  value={form.region}
                  onChange={(e) => handleInputChange('region', e.target.value)}
                >
                  <option value="nyc1">New York 1</option>
                  <option value="nyc2">New York 2</option>
                  <option value="nyc3">New York 3</option>
                  <option value="sfo1">San Francisco 1</option>
                  <option value="sfo2">San Francisco 2</option>
                  <option value="sfo3">San Francisco 3</option>
                  <option value="lon1">London 1</option>
                  <option value="fra1">Frankfurt 1</option>
                  <option value="tor1">Toronto 1</option>
                  <option value="blr1">Bangalore 1</option>
                  <option value="sgp1">Singapore 1</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="size">Size</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <select
                  id="size"
                  value={form.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                >
                  <option value="s-1vcpu-1gb">Basic - 1 vCPU, 1GB RAM ($6/mo)</option>
                  <option value="s-1vcpu-2gb">Basic - 1 vCPU, 2GB RAM ($12/mo)</option>
                  <option value="s-2vcpu-2gb">Basic - 2 vCPU, 2GB RAM ($18/mo)</option>
                  <option value="s-2vcpu-4gb">Basic - 2 vCPU, 4GB RAM ($24/mo)</option>
                  <option value="s-4vcpu-8gb">General Purpose - 4 vCPU, 8GB RAM ($48/mo)</option>
                  <option value="c-2">CPU Optimized - 2 vCPU, 4GB RAM ($42/mo)</option>
                  <option value="m-1vcpu-8gb">Memory Optimized - 1 vCPU, 8GB RAM ($48/mo)</option>
                </select>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="image">Image</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <select
                  id="image"
                  value={form.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                >
                  <option value="ubuntu-22-04-x64">Ubuntu 22.04 LTS</option>
                  <option value="ubuntu-20-04-x64">Ubuntu 20.04 LTS</option>
                  <option value="centos-7-x64">CentOS 7</option>
                  <option value="debian-11-x64">Debian 11</option>
                  <option value="fedora-36-x64">Fedora 36</option>
                  <option value="rocky-8-x64">Rocky Linux 8</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              className="create-button"
              onClick={onCreate}
              disabled={loading || !form.name.trim()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              {loading ? 'Creating...' : 'Create Droplet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}