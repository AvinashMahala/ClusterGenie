package interfaces

import "context"

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

// HelloRepository defines the contract for hello data operations
type HelloRepository interface {
	// Add repository methods as needed
}
