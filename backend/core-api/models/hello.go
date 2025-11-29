package models

// HelloRequest represents the request data for the Hello service
type HelloRequest struct {
	Name string `json:"name" example:"Ava"`
}

// HelloResponse represents the response data for the Hello service
type HelloResponse struct {
	Message string `json:"message" example:"Hello, Ava from ClusterGenie!"`
}
