package main

import (
	"context"
	"log"
	"net"

	"google.golang.org/grpc"
)

// Manual proto definitions for MVP
type HelloRequest struct {
	Name string `json:"name"`
}

type HelloResponse struct {
	Message string `json:"message"`
}

type HelloServiceServer interface {
	SayHello(context.Context, *HelloRequest) (*HelloResponse, error)
}

type server struct{}

func (s *server) SayHello(ctx context.Context, req *HelloRequest) (*HelloResponse, error) {
	return &HelloResponse{Message: "Hello, " + req.Name + " from ClusterGenie!"}, nil
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	s := grpc.NewServer()
	// Register manually for MVP
	RegisterHelloServiceServer(s, &server{})

	log.Println("Core API server listening on :50051")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}

// Manual registration for MVP
func RegisterHelloServiceServer(s *grpc.Server, srv HelloServiceServer) {
	// Placeholder
}