// frontend/src/components/OverviewTab/OverviewTab.tsx

import type { CreateDropletRequest } from '../../models';
import './OverviewTab.scss';

export interface OverviewTabProps {
  onQuickDeploy: (config: Partial<CreateDropletRequest>) => void;
}

export function OverviewTab({ onQuickDeploy }: OverviewTabProps) {
  const handleWebServerDeploy = () => {
    onQuickDeploy({
      name: `web-${Date.now().toString().slice(-4)}`,
      region: 'nyc1',
      size: 's-1vcpu-1gb',
      image: 'ubuntu-22-04-x64'
    });
  };

  const handleDatabaseDeploy = () => {
    onQuickDeploy({
      name: `db-${Date.now().toString().slice(-4)}`,
      region: 'nyc1',
      size: 's-2vcpu-2gb',
      image: 'ubuntu-22-04-x64'
    });
  };

  const handleDevDeploy = () => {
    onQuickDeploy({
      name: `dev-${Date.now().toString().slice(-4)}`,
      region: 'nyc1',
      size: 's-1vcpu-2gb',
      image: 'ubuntu-22-04-x64'
    });
  };

  return (
    <div className="overview-tab">
      <div className="overview-grid">
        {/* Quick Actions */}
        <div className="overview-card">
          <div className="card-header">
            <h3>Quick Deploy</h3>
            <p>Deploy common configurations instantly</p>
          </div>
          <div className="quick-options">
            <button className="quick-option" onClick={handleWebServerDeploy}>
              <div className="option-icon">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 9c1.657 0 3 4.03 3 9s-1.343 9-3 9m-9 9v-9m0 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 9c-1.657 0-3 4.03-3 9s1.343 9 3 9m9-18v9m0-9c-1.657 0-3 4.03-3 9s1.343 9 3 9m0-9H3"></path>
                </svg>
              </div>
              <div className="option-content">
                <div className="option-title">Web Server</div>
                <div className="option-desc">Ubuntu 22.04 + Nginx</div>
              </div>
            </button>

            <button className="quick-option" onClick={handleDatabaseDeploy}>
              <div className="option-icon">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                </svg>
              </div>
              <div className="option-content">
                <div className="option-title">Database</div>
                <div className="option-desc">PostgreSQL ready</div>
              </div>
            </button>

            <button className="quick-option" onClick={handleDevDeploy}>
              <div className="option-icon">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
              </div>
              <div className="option-content">
                <div className="option-title">Development</div>
                <div className="option-desc">Full dev environment</div>
              </div>
            </button>
          </div>
        </div>

        {/* Resources */}
        <div className="overview-card">
          <h4>Resources</h4>
          <div className="resource-links">
            <a href="#" className="resource-link">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              Documentation
            </a>
            <a href="#" className="resource-link">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Support
            </a>
            <a href="#" className="resource-link">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              API Reference
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}