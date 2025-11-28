import './App.css'
// @ts-ignore
import { HelloServiceClient } from './hello_grpc_web_pb';
// @ts-ignore
import * as hello_pb from './hello_pb';
import { useState } from 'react';

function App() {
  const [message, setMessage] = useState<string>('');

  const callHello = () => {
    const client = new HelloServiceClient('http://localhost:8080'); // gRPC-Web proxy
    const request = new hello_pb.HelloRequest();
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
    <div className="App">
      <h1>Hello from ClusterGenie</h1>
      <p>Frontend MVP is running!</p>
      <button onClick={callHello}>Call Backend</button>
      <p>{message}</p>
    </div>
  )
}

export default App
