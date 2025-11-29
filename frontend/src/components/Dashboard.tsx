// frontend/src/components/Dashboard.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProvisioningService } from '../services/provisioningService';
import { JobService } from '../services/jobService';
import type { Droplet, Job } from '../models';
import { Hero } from './Hero';
import TabularSection from './TabularSection';
import { StatusBadge } from './common';
import '../styles/Dashboard.scss';

const provisioningService = new ProvisioningService();
const jobService = new JobService();

export function Dashboard() {
  const [droplets, setDroplets] = useState<Droplet[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [activeTab, setActiveTab] = useState<'status' | 'actions' | 'activity'>('status');

  useEffect(() => {
    loadDashboardData();
    checkBackendStatus();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dropletsData, jobsResp] = await Promise.all([
        provisioningService.listDroplets(),
        jobService.listJobs(1, 5),
      ]);
      setDroplets(dropletsData || []);
      setJobs(jobsResp?.jobs || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setDroplets([]);
      setJobs([]);
    }
  };

  const checkBackendStatus = async () => {
    try {
      // Simple backend connectivity check using REST API
      const response = await fetch('http://localhost:8080/api/v1/hello', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Dashboard' }),
      });

      if (response.ok) {
        setBackendStatus('online');
      } else {
        throw new Error('API returned non-OK status');
      }
    } catch (error) {
      console.error('Backend check failed:', error);
      setBackendStatus('offline');
    }
  };

  const recentJobs = (jobs || []).slice(-5).reverse();
  const activeJobs = (jobs || []).filter(job => job.status === 'running' || job.status === 'pending');
  const healthyDroplets = (droplets || []).filter(droplet => droplet.status === 'active');

  return (
    <div className="dashboard">
      {/* Hero Section */}
      <Hero
        title="Welcome to ClusterGenie"
        subtitle="AI-powered cluster management for DigitalOcean infrastructure"
        variant="compact"
      />

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          System Status
        </button>
        <button
          className={`tab-button ${activeTab === 'actions' ? 'active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Actions
        </button>
        <button
          className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recent Activity {`(${recentJobs.length})`}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'status' && (
          <div className="status-tab">
            {/* System Status Cards */}
            <div className="status-grid">
              <div className="status-card compact">
                <div className="status-header">
                  <h3>Backend API</h3>
                  <span className={`status-indicator ${backendStatus === 'online' ? 'online' : backendStatus === 'offline' ? 'offline' : 'checking'}`}>
                    {backendStatus}
                  </span>
                </div>
                <div className="status-details">
                  <span className="detail-item">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    REST API
                  </span>
                  <span className="status-value">Active</span>
                </div>
              </div>

              <div className="status-card compact">
                <div className="status-header">
                  <h3>Droplets</h3>
                  <span className="status-count">{(droplets || []).length}</span>
                </div>
                <div className="status-details">
                  <span className="detail-item">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Healthy
                  </span>
                  <span className="status-value">{healthyDroplets.length}</span>
                </div>
              </div>

              <div className="status-card compact">
                <div className="status-header">
                  <h3>Jobs</h3>
                  <span className="status-count">{(jobs || []).length}</span>
                </div>
                <div className="status-details">
                  <span className="detail-item">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Active
                  </span>
                  <span className="status-value">{activeJobs.length}</span>
                </div>
              </div>

              <div className="status-card compact">
                <div className="status-header">
                  <h3>Database</h3>
                  <span className="status-indicator online">connected</span>
                </div>
                <div className="status-details">
                  <span className="detail-item">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    PostgreSQL
                  </span>
                  <span className="status-value">Ready</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <div className="actions-tab">
            <div className="actions-grid">
              <Link to="/provisioning" className="action-card compact">
                <div className="action-icon">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="action-content">
                  <h3>Create Droplet</h3>
                  <p>Provision new cloud resources</p>
                </div>
              </Link>

              <Link to="/diagnosis" className="action-card compact">
                <div className="action-icon">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="action-content">
                  <h3>Diagnose Cluster</h3>
                  <p>AI-powered cluster analysis</p>
                </div>
              </Link>

              <Link to="/jobs" className="action-card compact">
                <div className="action-icon">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="action-content">
                  <h3>Manage Jobs</h3>
                  <p>View and control running jobs</p>
                </div>
              </Link>

              <Link to="/monitoring" className="action-card compact">
                <div className="action-icon">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="action-content">
                  <h3>Monitor Metrics</h3>
                  <p>Real-time performance data</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-tab">
            <TabularSection
              title="Recent Activity"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              /* count displayed on the tab, not in the section header */
              columns={[
                {
                  key: 'type',
                  label: 'Type',
                  sortable: true
                },
                {
                  key: 'status',
                  label: 'Status',
                  sortable: true,
                  className: 'status-cell',
                  render: (value) => {
                    return <StatusBadge status={value as string} />;
                  }
                },
                {
                  key: 'id',
                  label: 'Job ID',
                  sortable: true
                },
                {
                  key: 'createdAt',
                  label: 'Created',
                  sortable: true,
                  render: (value) => {
                    if (!value) return '—';
                    const d = new Date(value as string);
                    return isNaN(d.getTime()) ? '—' : `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
                  }
                }
              ]}
              data={recentJobs}
              searchPlaceholder="Search jobs..."
              filterOptions={[
                { value: 'running', label: 'Running' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
                { value: 'pending', label: 'Pending' }
              ]}
              filterKey="status"
              emptyStateTitle="No recent activity"
              emptyStateDescription="Get started by creating your first job or provisioning a droplet."
              emptyStateIcon={
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}