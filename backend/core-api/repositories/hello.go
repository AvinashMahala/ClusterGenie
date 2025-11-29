package repositories

// helloRepository implements the HelloRepository interface
type helloRepository struct {
}

// NewHelloRepository creates a new hello repository
func NewHelloRepository() *helloRepository {
	return &helloRepository{}
}

// Add repository methods here
