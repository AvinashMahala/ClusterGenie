import './App.css'
// @ts-ignore
import './hello_pb';
// @ts-ignore
import { HelloServiceClient } from './hello_grpc_web_pb';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ProvisioningPanel } from './components/ProvisioningPanel';

function App() {
  const [message, setMessage] = useState<string>('');

  const callHello = () => {
    const client = new HelloServiceClient('http://localhost:8080'); // gRPC-Web proxy
    const request = new (globalThis as any).proto.clustergenie.HelloRequest();
    request.setName('User');

    client.sayHello(request, {}, (err: any, response: any) => {
      if (err) {
        console.error('Error:', err);
        setMessage('Error calling backend');
      } else {
        setMessage(response.getMessage());
      }
    });
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">ClusterGenie</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link to="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Home
                  </Link>
                  <Link to="/provisioning" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Provisioning
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={
              <div className="px-4 py-6 sm:px-0">
                <div className="border-4 border-dashed border-gray-200 rounded-lg p-4">
                  <h1 className="text-2xl font-bold mb-4">Welcome to ClusterGenie</h1>
                  <p className="mb-4">Your AI-powered cluster management platform</p>
                  <button onClick={callHello} className="px-4 py-2 bg-blue-500 text-white rounded">
                    Test Backend Connection
                  </button>
                  <p className="mt-2">{message}</p>
                </div>
              </div>
            } />
            <Route path="/provisioning" element={<ProvisioningPanel />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
