package main

import (
	"context"
	"log"
	"net"

	proto "github.com/AvinashMahala/ClusterGenie/backend/shared/proto"
	"google.golang.org/grpc"
)

type server struct {
	proto.UnimplementedHelloServiceServer
}

func (s *server) SayHello(ctx context.Context, req *proto.HelloRequest) (*proto.HelloResponse, error) {
	return &proto.HelloResponse{Message: "Hello, " + req.GetName() + " from ClusterGenie!"}, nil
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	s := grpc.NewServer()
	proto.RegisterHelloServiceServer(s, &server{})

	log.Println("Core API server listening on :50051")
	log.Println("Hot reload enabled with Air")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
