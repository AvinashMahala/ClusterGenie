import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProvisioningPanel } from './components/ProvisioningPanel';
import { DiagnosisPanel } from './components/DiagnosisPanel';
import { JobPanel } from './components/JobPanel';
import { JobDetails } from './components/JobDetails';
import { MonitoringPanel } from './components/MonitoringPanel';
import { LimiterRulesPanel } from './components/LimiterRulesPanel';
import { ClusterPanel } from './components/ClusterPanel';
import { ClustersPanel } from './components/ClustersPanel';
import { CreateClusterPanel } from './components/CreateClusterPanel';
import { Dashboard } from './components/Dashboard';
import { AutoscalingPanel } from './components/AutoscalingPanel';
import { DeploymentsPanel } from './components/DeploymentsPanel';
import { ProvidersPanel } from './components/ProvidersPanel';
import { BillingPanel } from './components/BillingPanel';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast/ToastProvider';

function App() {
  return (
    <Router>
      <ToastProvider>
        <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/provisioning" element={<ProvisioningPanel />} />
          <Route path="/diagnosis" element={<DiagnosisPanel />} />
          <Route path="/jobs" element={<JobPanel />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/monitoring" element={<MonitoringPanel />} />
          <Route path="/autoscaling" element={<AutoscalingPanel />} />
          <Route path="/deployments" element={<DeploymentsPanel />} />
          <Route path="/providers" element={<ProvidersPanel />} />
          <Route path="/billing" element={<BillingPanel />} />
          <Route path="/admin/limiter-rules" element={<LimiterRulesPanel />} />
          <Route path="/clusters" element={<ClustersPanel />} />
          <Route path="/clusters/new" element={<CreateClusterPanel />} />
          <Route path="/clusters/:id" element={<ClusterPanel />} />
        </Routes>
        </Layout>
      </ToastProvider>
    </Router>
  )
}

export default App
