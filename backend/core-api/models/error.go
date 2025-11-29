package models

// ErrorResponse is a generic error wrapper used by the API
type ErrorResponse struct {
	// The error message
	// example: Invalid request payload
	Error string `json:"error"`
}
