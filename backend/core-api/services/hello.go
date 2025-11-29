package services

import (
	"context"
	"fmt"
)

// HelloRequest represents the request data for the Hello service
type HelloRequest struct {
	Name string `json:"name"`
}

// HelloResponse represents the response data for the Hello service
type HelloResponse struct {
	Message string `json:"message"`
}

// HelloService defines the contract for hello operations
type HelloService interface {
	SayHello(ctx context.Context, req *HelloRequest) (*HelloResponse, error)
}

// helloService implements the HelloService interface
type helloService struct {
	// Add dependencies like repository
}

// NewHelloService creates a new hello service
func NewHelloService() HelloService {
	return &helloService{}
}

// SayHello implements the SayHello method
func (s *helloService) SayHello(ctx context.Context, req *HelloRequest) (*HelloResponse, error) {
	message := fmt.Sprintf("Hello, %s! Welcome to ClusterGenie.", req.Name)
	return &HelloResponse{Message: message}, nil
}
