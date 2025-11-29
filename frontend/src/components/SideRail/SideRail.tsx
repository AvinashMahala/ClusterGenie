import './SideRail.scss';

export type TabType = 'overview' | 'create' | 'droplets';

export interface SideRailProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function SideRail({ activeTab, onTabChange }: SideRailProps) {
  return (
    <nav className="side-rail" aria-label="Provisioning navigation">
      <div className="brand">Provisioning</div>

      <ul className="rail-list">
        <li>
          <button
            className={`rail-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => onTabChange('overview')}
            aria-current={activeTab === 'overview' ? 'page' : undefined}
          >
            <span className="icon" aria-hidden>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </span>
            <span className="label">Overview</span>
          </button>
        </li>

        <li>
          <button
            className={`rail-item ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => onTabChange('create')}
            aria-current={activeTab === 'create' ? 'page' : undefined}
          >
            <span className="icon" aria-hidden>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </span>
            <span className="label">Create</span>
          </button>
        </li>

        <li>
          <button
            className={`rail-item ${activeTab === 'droplets' ? 'active' : ''}`}
            onClick={() => onTabChange('droplets')}
            aria-current={activeTab === 'droplets' ? 'page' : undefined}
          >
            <span className="icon" aria-hidden>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </span>
            <span className="label">My Droplets</span>
          </button>
        </li>
      </ul>

      <div className="rail-footer">
        <small className="muted">Cloud • Droplets</small>
      </div>
    </nav>
  );
}

export default SideRail;
