#!/bin/bash

# ClusterGenie Development Script - Hot reloading for daily development
# This script starts infrastructure in Docker and runs backend/frontend with hot reloading

set -e  # Exit on error

# Add Go bin directory to PATH
export PATH="$PATH:$(go env GOPATH)/bin"

# Setup logging
LOG_FILE="dev.log"
SESSION_START=$(date '+%Y-%m-%d %H:%M:%S')
echo "==========================================" >> "$LOG_FILE"
echo "🚀 ClusterGenie Development Session - $SESSION_START" >> "$LOG_FILE"
echo "==========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo "🚀 Starting ClusterGenie Development Mode..."
echo "This will start infrastructure in Docker and run backend/frontend with hot reloading"
echo "Session: $SESSION_START"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    print_status "Docker is running"
}

# Start infrastructure services
start_infrastructure() {
    print_info "Starting infrastructure services (MySQL, Redis, Kafka, Zookeeper)..."

    # Stop any existing containers first
    docker-compose down >/dev/null 2>&1 || true

    # Start only the infrastructure services
    if docker-compose up -d mysql redis kafka zookeeper; then
        print_status "Infrastructure services started"

        # Wait for services to be healthy
        print_info "Waiting for services to be ready..."
        sleep 10

        # Check if services are running
        if docker-compose ps | grep -q "Up"; then
            print_status "All infrastructure services are running"
        else
            print_error "Some infrastructure services failed to start"
            docker-compose logs
            exit 1
        fi
    else
        print_error "Failed to start infrastructure services"
        exit 1
    fi
}

# Check if Air is installed
check_air() {
    # Add Go bin to PATH for this check
    export PATH="$PATH:$(go env GOPATH)/bin"
    
    if ! command -v air >/dev/null 2>&1; then
        print_warning "Air not found. Installing Air for Go hot reloading..."
        go install github.com/air-verse/air@latest
        print_status "Air installed"
    else
        print_status "Air is available"
    fi
}

# Initialize database schema
initialize_database() {
    print_info "Checking database initialization..."

    # Wait for MySQL to be ready
    print_info "Waiting for MySQL to be ready..."
    for i in {1..30}; do
        if docker-compose exec -T mysql mysql -uroot -prootpassword -e "SELECT 1" >/dev/null 2>&1; then
            break
        fi
        sleep 2
    done

    # Check if tables exist
    if ! docker-compose exec -T mysql mysql -uroot -prootpassword clustergenie -e "SHOW TABLES;" | grep -q "clusters"; then
        print_info "Initializing database schema..."
        if docker-compose exec -T mysql mysql -uroot -prootpassword clustergenie < database/init.sql; then
            print_status "Database schema initialized"
        else
            print_error "Failed to initialize database schema"
            exit 1
        fi
    else
        print_status "Database schema already exists"
    fi
}
check_yarn() {
    if ! command -v yarn >/dev/null 2>&1; then
        print_error "Yarn not found. Please install Node.js and Yarn first."
        exit 1
    fi
    print_status "Yarn is available"
}

# Install frontend dependencies if needed
setup_frontend() {
    if [ ! -d "frontend/node_modules" ]; then
        print_info "Installing frontend dependencies..."
        cd frontend
        yarn install
        cd ..
        print_status "Frontend dependencies installed"
    else
        print_status "Frontend dependencies already installed"
    fi
}

# Function to start backend in new terminal
start_backend() {
    print_info "Starting backend in new terminal tab..."

    # Check if port 8080 is available (backend port)
    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 8080 is already in use. Backend might already be running."
    fi

    # Create AppleScript to open new terminal tab for backend
    osascript <<EOF
tell application "Terminal"
    activate
    set newTab to do script "cd '$PWD/backend' && echo '🚀 ClusterGenie Backend (Air Hot Reload)' && echo '📍 Logs: tail -f ../backend-dev.log' && echo '🔄 Watching for Go file changes...' && echo '' && /Users/avinashmahala/go/bin/air > ../backend-dev.log 2>&1"
    set custom title of window 1 to "Backend - ClusterGenie"
end tell
EOF

    print_status "Backend terminal tab opened"
    print_info "Backend will start with Air hot reloading"
}

# Function to start frontend in new terminal
start_frontend() {
    print_info "Starting frontend in new terminal tab..."

    # Check if port 3000 is available (frontend port)
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 3000 is already in use. Frontend might already be running."
    fi

    # Create AppleScript to open new terminal tab for frontend
    osascript <<EOF
tell application "Terminal"
    activate
    set newTab to do script "cd '$PWD/frontend' && echo '🌐 ClusterGenie Frontend (Vite Hot Reload)' && echo '📍 Logs: tail -f ../frontend-dev.log' && echo '🔄 Watching for React/TypeScript changes...' && echo '' && yarn dev > ../frontend-dev.log 2>&1"
    set custom title of window 1 to "Frontend - ClusterGenie"
end tell
EOF

    print_status "Frontend terminal tab opened"
    print_info "Frontend will start with Vite hot reloading"
}

# Function to show status
show_status() {
    echo ""
    print_info "Development environment is ready!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "📡 Backend API: http://localhost:8080"
    echo "📚 Swagger Docs: http://localhost:8080/swagger/index.html"
    echo "🗄️  MySQL: localhost:3306"
    echo "🔴 Redis: localhost:6379"
    echo "📨 Kafka: localhost:9092"
    echo ""
    print_info "Terminal tabs opened:"
    print_info "  • 'Backend - ClusterGenie' - Go backend with Air hot reloading"
    print_info "  • 'Frontend - ClusterGenie' - React frontend with Vite hot reloading"
    print_info "  • Current terminal - Infrastructure services and control"
    echo ""
    print_info "To stop: Run './stop.sh' or close the terminal tabs"
    echo ""
}

# Function to cleanup on exit
cleanup() {
    echo ""
    print_info "Shutting down infrastructure services..."
    print_info "Note: Close the Backend and Frontend terminal tabs manually"

    # Stop Docker services
    docker-compose down >/dev/null 2>&1

    print_status "Infrastructure services stopped"
    exit 0
}

# Main execution
main() {
    # Don't exit on error for main execution
    set +e

    print_info "Checking prerequisites..."
    check_docker
    check_air
    check_yarn

    print_info "Setting up environment..."
    setup_frontend

    print_info "Starting services..."
    start_infrastructure
    initialize_database
    start_backend
    start_frontend

    show_status

    print_info "Development environment started successfully!"
    print_info "You can now monitor each service in its respective terminal tab."
}

# Run main function
main