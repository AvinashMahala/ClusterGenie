import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProvisioningPanel } from './components/ProvisioningPanel';
import { DiagnosisPanel } from './components/DiagnosisPanel';
import { JobPanel } from './components/JobPanel';
import { MonitoringPanel } from './components/MonitoringPanel';
import { ClusterPanel } from './components/ClusterPanel';
import { ClustersPanel } from './components/ClustersPanel';
import { Dashboard } from './components/Dashboard';
import Layout from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/provisioning" element={<ProvisioningPanel />} />
          <Route path="/diagnosis" element={<DiagnosisPanel />} />
          <Route path="/jobs" element={<JobPanel />} />
          <Route path="/monitoring" element={<MonitoringPanel />} />
          <Route path="/clusters" element={<ClustersPanel />} />
          <Route path="/clusters/:id" element={<ClusterPanel />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
