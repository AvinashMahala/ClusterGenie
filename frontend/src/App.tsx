import './App.css'
import { HelloServiceClient } from './HelloServiceClientPb';
import { HelloRequest } from './hello_pb';
import { useState } from 'react';

function App() {
  const [message, setMessage] = useState<string>('');

  const callHello = () => {
    const client = new HelloServiceClient('http://localhost:8080'); // gRPC-Web proxy
    const request = new HelloRequest();
    request.setName('User');

    client.sayHello(request, {}, (err, response) => {
      if (err) {
        console.error('Error:', err);
        setMessage('Error calling backend');
      } else {
        setMessage(response.getMessage());
      }
    });
  };

  return (
    <div className="App">
      <h1>Hello from ClusterGenie</h1>
      <p>Frontend MVP is running!</p>
      <button onClick={callHello}>Call Backend</button>
      <p>{message}</p>
    </div>
  )
}

export default App
