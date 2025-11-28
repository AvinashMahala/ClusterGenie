// Type declarations for generated protobuf files
// This provides TypeScript support for generated JavaScript files

declare module './hello_pb' {
  export namespace proto {
    export namespace clustergenie {
      export class HelloRequest {
        constructor();
        setName(value: string): void;
        getName(): string;
        serializeBinary(): Uint8Array;
        static deserializeBinary(bytes: Uint8Array): HelloRequest;
      }

      export class HelloResponse {
        constructor();
        setMessage(value: string): void;
        getMessage(): string;
        serializeBinary(): Uint8Array;
        static deserializeBinary(bytes: Uint8Array): HelloResponse;
      }
    }
  }
}

declare module './hello_grpc_web_pb' {
  import * as grpcWeb from 'grpc-web';

  export class HelloServiceClient {
    constructor(hostname: string, credentials?: any, options?: any);
    sayHello(
      request: any,
      metadata: any,
      callback: (error: any, response: any) => void
    ): void;
  }
}