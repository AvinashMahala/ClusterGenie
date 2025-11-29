#!/bin/bash

# ClusterGenie Development Script - Hot reloading for daily development
# This script starts infrastructure in Docker and runs backend/frontend with hot reloading

set -e  # Exit on error

# Add Go bin directory to PATH
export PATH="$PATH:$(go env GOPATH)/bin"

# Resolve a usable `air` binary path for new Terminal tabs (portable across machines)
AIR_BIN="$(command -v air 2>/dev/null || true)"
if [ -z "$AIR_BIN" ]; then
    AIR_BIN="$(go env GOPATH)/bin/air"
fi

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

# Setup logging
LOG_FILE="dev.log"
SESSION_START=$(date '+%Y-%m-%d %H:%M:%S')
echo "==========================================" >> "$LOG_FILE"
echo "🚀 ClusterGenie Development Session - $SESSION_START" >> "$LOG_FILE"
echo "==========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

print_info "Starting ClusterGenie Development Mode..."
print_info "This will start infrastructure in Docker and run backend/frontend with hot reloading"
echo "Session: $SESSION_START"
echo ""


# ---- CLI flags and defaults -------------------------------------------
# DEFAULTS
BACKEND_MODE="local"       # local | docker
OBSERVE_ENABLED=false       # whether to start prometheus/grafana
FRONTEND_ENABLED=true       # start frontend by default
INTERACTIVE=true            # prompt to confirm plan
AUTO_APPROVE=false          # skip interactive prompt

show_help() {
    cat <<EOF
Usage: dev.sh [options]

Options:
  -o, --observe        Include observability (prometheus + grafana)
  -d, --docker-api     Run core-api inside Docker instead of local Air
  --no-frontend        Don't start the frontend (Vite)
  --no-backend         Don't start the backend (local Air nor Docker container)
  -y, --yes            Auto-approve the start plan (non-interactive)
  -n, --no-interactive Disable interactive confirmation prompts
  -h, --help           Show this help message

Examples:
  ./dev.sh -o            # start infra + backend local + frontend + prometheus/grafana
  ./dev.sh -d            # start infra + core-api Docker container + frontend
  ./dev.sh -d -n         # start without interactive prompt
EOF
}

# parse args
while [ "$#" -gt 0 ]; do
    case "$1" in
        -o|--observe)
            OBSERVE_ENABLED=true; shift;;
        -d|--docker-api)
            BACKEND_MODE="docker"; shift;;
        --no-frontend)
            FRONTEND_ENABLED=false; shift;;
        --no-backend)
            BACKEND_MODE="none"; shift;;
        -y|--yes)
            AUTO_APPROVE=true; INTERACTIVE=false; shift;;
        -n|--no-interactive)
            INTERACTIVE=false; shift;;
        -h|--help)
            show_help; exit 0;;
        *)
            echo "Unknown option: $1"; show_help; exit 1;;
    esac
done

# If using docker backend with --no-backend set to none, ensure we don't start local backend
if [ "$BACKEND_MODE" = "none" ]; then
    BACKEND_MODE="none"
fi

# auto toggle default frontend based on BACKEND_MODE none
if [ "$BACKEND_MODE" = "none" ]; then
    # no backend; keep frontend enabled unless explicitly disabled
    :
fi

# interactive default behavior respects AUTO_APPROVE flag
if [ "$AUTO_APPROVE" = true ]; then
    INTERACTIVE=false
fi

# Print a compact header showing selected services and flags
print_plan_and_confirm() {
    echo ""
    print_info "Development start plan"
    echo "  • Services to start: ${SERVICES_TO_START}"
    echo "  • Backend mode: ${BACKEND_MODE}"
    echo "  • Frontend: ${FRONTEND_ENABLED}"
    echo "  • Observability: ${OBSERVE_ENABLED}"
    echo "  • Interactive: ${INTERACTIVE}"
    echo ""
    if [ "${INTERACTIVE}" = "true" ] && [ "${AUTO_APPROVE}" != "true" ]; then
        read -p "Proceed with this plan? (y/N): " confirm
        if [[ ! "${confirm}" =~ ^[Yy] ]]; then
            print_warning "User aborted — exiting"
            exit 0
        fi
    fi
}

# --- readiness helpers -------------------------------------------------
wait_for_port() {
    # wait_for_port host port timeout
    host="$1"; port="$2"; timeout="$3"
    attempt=0
    while [ $attempt -lt $timeout ]; do
        if nc -z "$host" "$port" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
        attempt=$((attempt+1))
    done
    return 1
}

check_mysql_ready() {
    # try to connect inside container (preferred) then fallback to localhost
    if docker-compose exec -T mysql mysql -uroot -prootpassword -e "SELECT 1" >/dev/null 2>&1; then
        print_status "MySQL container is responsive"
        return 0
    fi
    if wait_for_port localhost 3306 15; then
        print_status "MySQL port is listening on localhost:3306"
        return 0
    fi
    print_error "MySQL did not become ready on localhost:3306"
    return 1
}

check_redis_ready() {
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        print_status "Redis container replied PONG"
        return 0
    fi
    if wait_for_port localhost 6379 10; then
        print_status "Redis port listening on localhost:6379"
        return 0
    fi
    print_error "Redis did not become ready on localhost:6379"
    return 1
}

check_zookeeper_ready() {
    if wait_for_port localhost 2181 10; then
        print_status "Zookeeper is listening on port 2181"
        return 0
    fi
    print_warning "Zookeeper not available on 2181"
    return 1
}

check_kafka_ready() {
    # Kafka advertised listener port 9092 should be available on localhost
    if wait_for_port localhost 9092 15; then
        print_status "Kafka is listening on 9092"
        return 0
    fi
    print_warning "Kafka not reachable on port 9092"
    return 1
}

check_prometheus_ready() {
    if wait_for_port localhost 9090 10; then
        print_status "Prometheus is listening on 9090"
        return 0
    fi
    print_warning "Prometheus not reachable on port 9090"
    return 1
}

check_grafana_ready() {
    if wait_for_port localhost 3001 10; then
        print_status "Grafana is listening on 3001"
        return 0
    fi
    print_warning "Grafana not reachable on port 3001"
    return 1
}

check_coreapi_ready_docker() {
    port=${COREAPI_PORT:-8080}
    if wait_for_port localhost ${port} 10; then
        if curl -sSf "http://localhost:${port}/swagger/index.html" >/dev/null 2>&1; then
            print_status "core-api container responded to HTTP check"
            return 0
        fi
    fi
    print_warning "core-api docker container not responding to HTTP checks"
    return 1
}

check_backend_local_ready() {
    if wait_for_port localhost 8080 15; then
        print_status "Backend (local) listening on 8080"
        return 0
    fi
    print_warning "Backend local not responding on 8080"
    return 1
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

    # Calculate which compose services to start
    COMPOSE_SERVICES=( )
    # always include base infra
    COMPOSE_SERVICES+=(mysql redis zookeeper kafka)
    if [ "${OBSERVE_ENABLED}" = "true" ]; then
        COMPOSE_SERVICES+=(prometheus grafana)
    fi
    if [ "${BACKEND_MODE}" = "docker" ]; then
        COMPOSE_SERVICES+=(core-api)
    fi

    # Start base infra first (mysql redis zookeeper kafka)
    BASE_SERVICES=(mysql redis zookeeper kafka)
    if docker-compose up -d "${BASE_SERVICES[@]}"; then
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

    # start observability services; if local backend is running, start prometheus without deps
    if [ "${OBSERVE_ENABLED}" = "true" ]; then
        if [ "${BACKEND_MODE}" = "local" ]; then
            print_info "Starting prometheus + grafana without pulling core-api (no-deps)"
            if docker-compose up -d --no-deps prometheus grafana; then
                print_status "Prometheus and Grafana started (no-deps)"
            else
                print_warning "Failed to start prometheus/grafana with --no-deps; trying full compose start"
                docker-compose up -d prometheus grafana || true
            fi
        else
            # if backend runs in Docker we'll start prometheus/grafana after core-api is up
            print_info "Prometheus/Grafana will be started after core-api is started (backend in docker mode)"
        fi
    fi
}

start_core_api_docker() {
    print_info "Starting core-api as Docker container (docker-compose)..."
    # pick a host port for core-api; allow existing COREAPI_PORT env to override
    preferred=${COREAPI_PORT:-8080}
    port=$preferred
    # if preferred port is occupied, try next ports (8081..8099)
    if nc -z localhost ${port} >/dev/null 2>&1; then
        print_warning "Port ${port} already in use — attempting to find another free host port for core-api"
        found=false
        for p in $(seq 8081 8099); do
            if ! nc -z localhost ${p} >/dev/null 2>&1; then
                port=${p}
                found=true
                break
            fi
        done
        if [ "${found}" != "true" ]; then
            print_error "Could not find a free host port for core-api between 8081 and 8099"
            exit 1
        fi
    fi

    export COREAPI_PORT=${port}
    print_info "Starting core-api container with host port ${COREAPI_PORT} -> container 8080"

    if docker-compose up -d core-api; then
        print_status "core-api container started (host:${COREAPI_PORT})"
        check_coreapi_ready_docker || print_warning "core-api container didn't pass full HTTP checks yet"
    else
        print_error "Failed to start core-api container"
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

    # Prefer applying versioned migrations (reproducible & reversible) when possible
    if command -v make >/dev/null 2>&1; then
        print_info "Attempting to apply versioned migrations (make migrate-up)..."
        # try host.docker.internal first (mac), fall back to localhost
        if make migrate-up MYSQL_HOST=host.docker.internal MYSQL_PORT=3306 MYSQL_USER=root MYSQL_PASSWORD=rootpassword MYSQL_DATABASE=clustergenie; then
            print_status "Migrations applied using host.docker.internal"
        else
            print_warning "migrate-up with host.docker.internal failed — trying localhost next"
            if make migrate-up MYSQL_HOST=localhost MYSQL_PORT=3306 MYSQL_USER=root MYSQL_PASSWORD=rootpassword MYSQL_DATABASE=clustergenie; then
                print_status "Migrations applied using localhost"
            else
                print_warning "migrate-up failed on both host.docker.internal and localhost — falling back to init.sql check"
            fi
        fi
    else
        print_warning "make not found; skipping migrate-up and falling back to init.sql if needed"
    fi

    # Check if tables exist (after migrations) and fall back to init.sql if missing
    if ! docker-compose exec -T mysql mysql -uroot -prootpassword clustergenie -e "SHOW TABLES;" | grep -q "clusters"; then
        print_info "Initializing database schema via database/init.sql (fallback)..."
        if docker-compose exec -T mysql mysql -uroot -prootpassword clustergenie < database/init.sql; then
            print_status "Database schema initialized (fallback)"
        else
            print_error "Failed to initialize database schema via init.sql"
            exit 1
        fi
    else
        print_status "Database schema already exists"
    fi

    # Check if data exists
    if docker-compose exec -T mysql mysql -uroot -prootpassword clustergenie -e "SELECT COUNT(*) FROM clusters;" | tail -n1 | grep -q "0"; then
        print_info "Seeding sample data..."
        if docker-compose exec -T mysql mysql -uroot -prootpassword clustergenie < database/seed.sql; then
            print_status "Sample data seeded"
        else
            print_error "Failed to seed sample data"
            exit 1
        fi
    else
        print_status "Sample data already exists"
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
    # support using resolved AIR_BIN variable inside apple script
    set newTab to do script "cd '$PWD/backend' && echo '🚀 ClusterGenie Backend (Air Hot Reload)' && echo '📍 Logs: tail -f ../backend-dev.log' && echo '🔄 Watching for Go file changes...' && echo '' && ${AIR_BIN} > ../backend-dev.log 2>&1"
    set custom title of window 1 to "Backend - ClusterGenie"
end tell
EOF

    print_status "Backend terminal tab opened"
    print_info "Backend will start with Air hot reloading"
}

# Function to start frontend in new terminal
start_frontend() {
    print_info "Starting frontend in new terminal tab..."

    # Check if port 5173 is available (frontend port)
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port 5173 is already in use. Frontend might already be running."
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
    echo "🌐 Frontend: http://localhost:5173"
    # Show backend URL depending on mode and COREAPI_PORT
    if [ "${BACKEND_MODE}" = "docker" ]; then
        port=${COREAPI_PORT:-8080}
        echo "📡 Backend API (docker): http://localhost:${port}"
    elif [ "${BACKEND_MODE}" = "local" ]; then
        echo "📡 Backend API (local): http://localhost:8080"
    else
        echo "📡 Backend API: (disabled)"
    fi
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
    # Evaluate options and show plan
    # Compose services list based on flags
    SERVICES_TO_START="mysql redis zookeeper kafka"
    if [ "${OBSERVE_ENABLED}" = "true" ]; then
        SERVICES_TO_START="${SERVICES_TO_START} prometheus grafana"
    fi
    if [ "${BACKEND_MODE}" = "docker" ]; then
        SERVICES_TO_START="${SERVICES_TO_START} core-api"
    else
        SERVICES_TO_START="${SERVICES_TO_START} backend(local)"
    fi
    if [ "${FRONTEND_ENABLED}" = "true" ]; then
        SERVICES_TO_START="${SERVICES_TO_START} frontend"
    fi

    print_plan_and_confirm
    show_status
    start_infrastructure
    # run quick readiness checks for infra
    check_mysql_ready || true
    check_redis_ready || true
    check_zookeeper_ready || true
    check_kafka_ready || true
    if [ "${OBSERVE_ENABLED}" = "true" ]; then
        check_prometheus_ready || true
        check_grafana_ready || true
    fi

    initialize_database
    # start backend either in Docker or local
    if [ "${BACKEND_MODE}" = "docker" ]; then
        start_core_api_docker
        # If observability requested, start prometheus/grafana now that core-api is running
        if [ "${OBSERVE_ENABLED}" = "true" ]; then
            print_info "Starting Prometheus + Grafana now that core-api is available"
            docker-compose up -d prometheus grafana || print_warning "Failed to start prometheus/grafana"
            check_prometheus_ready || true
            check_grafana_ready || true
        fi
    elif [ "${BACKEND_MODE}" = "local" ]; then
        start_backend
    else
        print_info "Skipping backend startup (mode: ${BACKEND_MODE})"
    fi
    if [ "${FRONTEND_ENABLED}" = "true" ]; then
        start_frontend
    fi

    # verify backend health
    if [ "${BACKEND_MODE}" = "docker" ]; then
        check_coreapi_ready_docker || true
    elif [ "${BACKEND_MODE}" = "local" ]; then
        check_backend_local_ready || true
    fi

    print_info "Development environment started successfully!"
    print_info "You can now monitor each service in its respective terminal tab."
}

# Run main function
main