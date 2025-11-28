// frontend/src/components/Dashboard.tsx

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProvisioningService } from '../services/provisioningService';
import { JobService } from '../services/jobService';
import type { Droplet, Job } from '../models';
import '../styles/Dashboard.scss';

const provisioningService = new ProvisioningService();
const jobService = new JobService();

export function Dashboard() {
  const [droplets, setDroplets] = useState<Droplet[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    loadDashboardData();
    checkBackendStatus();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dropletsData, jobsData] = await Promise.all([
        provisioningService.listDroplets(),
        jobService.listJobs(),
      ]);
      setDroplets(dropletsData);
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBackendStatus = async () => {
    try {
      // Simple backend connectivity check
      await new Promise((resolve, reject) => {
        const client = new (window as any).proto.clustergenie.HelloServiceClient('http://localhost:8080');
        const request = new (globalThis as any).proto.clustergenie.HelloRequest();
        request.setName('Dashboard');

        client.sayHello(request, {}, (err: any, response: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
      setBackendStatus('online');
    } catch (error) {
      console.error('Backend check failed:', error);
      setBackendStatus('offline');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'online';
      case 'offline':
        return 'offline';
      default:
        return 'checking';
    }
  };

  const recentJobs = jobs.slice(-5).reverse();
  const activeJobs = jobs.filter(job => job.status === 'running' || job.status === 'pending');
  const healthyDroplets = droplets.filter(droplet => droplet.status === 'active');

  return (
    <div className="dashboard">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to ClusterGenie</h1>
          <p>
            Your AI-powered cluster management platform for DigitalOcean infrastructure.
            Provision, monitor, and optimize your cloud resources with intelligent automation.
          </p>
          <div className="cta-buttons">
            <Link to="/provisioning" className="btn-primary">
              Start Provisioning
            </Link>
            <Link to="/diagnosis" className="btn-secondary">
              Diagnose Cluster
            </Link>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="status-card">
        <h2>System Status</h2>
        <div className="status-grid">
          <div className="status-item">
            <div className="status-indicator online"></div>
            <div>
              <span className="status-label">Backend API</span>
              <p className="status-desc">gRPC Services</p>
            </div>
            <span className={`status-badge ${backendStatus}`}>
              {backendStatus}
            </span>
          </div>
          <div className="status-item">
            <div className="status-indicator online"></div>
            <div>
              <span className="status-label">Database</span>
              <p className="status-desc">MySQL</p>
            </div>
            <span className="status-badge online">
              online
            </span>
          </div>
          <div className="status-item">
            <div className="status-indicator online"></div>
            <div>
              <span className="status-label">Message Queue</span>
              <p className="status-desc">Kafka</p>
            </div>
            <span className="status-badge online">
              online
            </span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon blue">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Droplets</p>
            <p className="metric-value">{loading ? '...' : droplets.length}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon green">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="metric-content">
            <p className="metric-label">Active Droplets</p>
            <p className="metric-value">{loading ? '...' : healthyDroplets.length}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon yellow">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="metric-content">
            <p className="metric-label">Active Jobs</p>
            <p className="metric-value">{loading ? '...' : activeJobs.length}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon purple">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="metric-content">
            <p className="metric-label">Total Jobs</p>
            <p className="metric-value">{loading ? '...' : jobs.length}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/provisioning" className="action-card">
            <div className="action-icon blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="action-title">Provision</h3>
            <p className="action-desc">Create and manage droplets</p>
          </Link>

          <Link to="/diagnosis" className="action-card">
            <div className="action-icon green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="action-title">Diagnose</h3>
            <p className="action-desc">AI-powered cluster analysis</p>
          </Link>

          <Link to="/jobs" className="action-card">
            <div className="action-icon yellow">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="action-title">Jobs</h3>
            <p className="action-desc">Monitor background tasks</p>
          </Link>

          <Link to="/monitoring" className="action-card">
            <div className="action-icon purple">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="action-title">Monitor</h3>
            <p className="action-desc">View cluster metrics</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>

        {recentJobs.length > 0 ? (
          <div className="activity-list">
            <h3>Recent Jobs</h3>
            {recentJobs.map((job) => (
              <div key={job.id} className="activity-item">
                <div className="activity-content">
                  <span className={`activity-status ${job.status}`}>
                    {job.status}
                  </span>
                  <div className="activity-info">
                    <span className="activity-type">{job.type} Job</span>
                    <p className="activity-id">ID: {job.id}</p>
                  </div>
                </div>
                <span className="activity-time">
                  {job.createdAt.toLocaleDateString()} {job.createdAt.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>No recent activity</h3>
            <p>Get started by creating your first job or provisioning a droplet.</p>
          </div>
        )}
      </div>
    </div>
  );
}