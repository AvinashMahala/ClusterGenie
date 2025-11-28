#!/bin/bash

# ClusterGenie Start Script - Initiates and starts backend/frontend in separate terminals with error handling

set -e  # Exit on error

# Setup logging
LOG_FILE="setup.log"
SESSION_START=$(date '+%Y-%m-%d %H:%M:%S')
echo "==========================================" >> "$LOG_FILE"
echo "🚀 ClusterGenie Setup Session - $SESSION_START" >> "$LOG_FILE"
echo "==========================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

echo "🚀 Starting ClusterGenie setup..."
echo "This is an interactive setup process. Detailed logs are saved to $LOG_FILE"
echo "Session: $SESSION_START"
echo ""

# Flag to prevent duplicate prerequisite checks
CHECKED_PREREQS=false

# Function to check prerequisites
check_prerequisites() {
    if [ "$CHECKED_PREREQS" = true ]; then
        return
    fi
    CHECKED_PREREQS=true

    echo "🔍 Checking prerequisites..."
    echo "We'll install any missing tools automatically."
    echo ""

    # Xcode Command Line Tools
    if ! xcode-select -p >/dev/null 2>&1; then
        echo "📦 Installing Xcode Command Line Tools (5-10 minutes)..."
        echo "💡 This requires manual completion. Follow the prompts."
        xcode-select --install >> "$LOG_FILE" 2>&1
        echo "✅ Please complete the installation in the dialog and press Enter here."
        read -p ""
        if ! xcode-select -p >/dev/null 2>&1; then
            echo "❌ Command Line Tools installation failed. Check $LOG_FILE for details."
            exit 1
        fi
        echo "✅ Command Line Tools installed!"
    else
        echo "✅ Xcode Command Line Tools already installed."
        echo "🔄 Checking for updates..."
        if softwareupdate --list 2>/dev/null | grep -q "Command Line Tools"; then
            echo "📦 Updating Command Line Tools (2-5 minutes)..."
            echo "💡 You can open Activity Monitor to watch progress."
            sudo softwareupdate --install --all --force >> "$LOG_FILE" 2>&1
            echo "✅ Command Line Tools updated!"
        else
            echo "✅ Command Line Tools are up to date."
        fi
    fi
    echo ""

    # Homebrew
    if ! command -v brew >/dev/null 2>&1; then
        echo "📦 Installing Homebrew (1-2 minutes)..."
        echo "Starting Homebrew installation..." >> "$LOG_FILE"
        ( /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" ) >> "$LOG_FILE" 2>&1
        echo "Homebrew installation completed." >> "$LOG_FILE"
        if ! command -v brew >/dev/null 2>&1; then
            echo "❌ Homebrew installation failed. Check $LOG_FILE for details."
            exit 1
        fi
        echo "✅ Homebrew installed!"
    else
        echo "✅ Homebrew already installed."
    fi
    echo ""

    # Docker
    if ! command -v docker >/dev/null 2>&1; then
        echo "📦 Installing Docker Desktop (2-3 minutes)..."
        echo "Starting Docker installation..." >> "$LOG_FILE"
        ( brew install --cask docker ) >> "$LOG_FILE" 2>&1
        echo "Docker installation completed." >> "$LOG_FILE"
        if ! command -v docker >/dev/null 2>&1; then
            echo "❌ Docker installation failed. Check $LOG_FILE for details."
            echo "💡 Try installing manually from https://www.docker.com/products/docker-desktop"
            exit 1
        fi
        echo "✅ Docker installed! Starting Docker Desktop..."
        open -a Docker
        sleep 5
    else
        echo "✅ Docker already installed."
    fi

    if ! docker info >/dev/null 2>&1; then
        echo "🐳 Docker not running. Attempting to start..."
        open -a Docker
        sleep 10
        if ! docker info >/dev/null 2>&1; then
            echo "❌ Docker still not running. Please start Docker Desktop manually."
            exit 1
        fi
    fi
    echo "✅ Docker is running!"
    echo ""

    # Docker Compose
    if ! command -v docker-compose >/dev/null 2>&1; then
        echo "📦 Installing Docker Compose..."
        if command -v pip3 >/dev/null 2>&1; then
            pip3 install docker-compose >> "$LOG_FILE" 2>&1
        else
            echo "❌ pip3 not found. Installing Docker Compose manually required."
            exit 1
        fi
        if ! command -v docker-compose >/dev/null 2>&1; then
            echo "❌ Docker Compose installation failed."
            exit 1
        fi
        echo "✅ Docker Compose installed!"
    else
        echo "✅ Docker Compose already installed."
    fi
    echo ""

    # Go
    if ! command -v go >/dev/null 2>&1; then
        echo "📦 Installing Go (1-2 minutes)..."
        echo "Starting Go installation..." >> "$LOG_FILE"
        ( brew install go ) >> "$LOG_FILE" 2>&1
        echo "Go installation completed." >> "$LOG_FILE"
        if ! command -v go >/dev/null 2>&1; then
            echo "❌ Go installation failed. Check $LOG_FILE for details."
            exit 1
        fi
        echo "✅ Go installed!"
        # Install Go protobuf plugins
        echo "📦 Installing Go protobuf plugins (1 minute)..."
        echo "Starting Go protobuf plugins installation..." >> "$LOG_FILE"
        ( go install google.golang.org/protobuf/cmd/protoc-gen-go@latest ) >> "$LOG_FILE" 2>&1
        ( go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest ) >> "$LOG_FILE" 2>&1
        echo "Go protobuf plugins installation completed." >> "$LOG_FILE"
        echo "✅ Go protobuf plugins installed!"
        # Install Air for hot reloading
        echo "📦 Installing Air for Go hot reloading (1 minute)..."
        echo "Starting Air installation..." >> "$LOG_FILE"
        ( go install github.com/air-verse/air@latest ) >> "$LOG_FILE" 2>&1
        echo "Air installation completed." >> "$LOG_FILE"
        echo "✅ Air installed!"
        # Install Swag for Swagger documentation
        echo "📦 Installing Swag for Swagger docs (1 minute)..."
        echo "Starting Swag installation..." >> "$LOG_FILE"
        ( go install github.com/swaggo/swag/cmd/swag@latest ) >> "$LOG_FILE" 2>&1
        echo "Swag installation completed." >> "$LOG_FILE"
        echo "✅ Swag installed!"
    else
        echo "✅ Go already installed."
    fi
    echo ""

    # Node.js
    if ! command -v node >/dev/null 2>&1; then
        echo "📦 Installing Node.js (1-2 minutes)..."
        echo "Starting Node.js installation..." >> "$LOG_FILE"
        ( brew install node ) >> "$LOG_FILE" 2>&1
        echo "Node.js installation completed." >> "$LOG_FILE"
        if ! command -v node >/dev/null 2>&1; then
            echo "❌ Node.js installation failed. Check $LOG_FILE for details."
            exit 1
        fi
        echo "✅ Node.js installed!"
        # Install gRPC-Web plugin
        echo "📦 Installing gRPC-Web plugin (1 minute)..."
        echo "Starting gRPC-Web plugin installation..." >> "$LOG_FILE"
        ( npm install -g protoc-gen-grpc-web ) >> "$LOG_FILE" 2>&1
        echo "gRPC-Web plugin installation completed." >> "$LOG_FILE"
        echo "✅ gRPC-Web plugin installed!"
hello_pb.js:14 Uncaught ReferenceError: global is not defined
        echo "📦 Installing protobuf TypeScript plugin (1 minute)..."
        echo "Starting protobuf TypeScript plugin installation..." >> "$LOG_FILE"
        ( cd frontend && yarn add --dev @protobuf-ts/protoc ) >> "$LOG_FILE" 2>&1
        echo "Protobuf TypeScript plugin installation completed." >> "$LOG_FILE"
        echo "✅ Protobuf TypeScript plugin installed!"
    else
        echo "✅ Node.js already installed."
    fi
    echo ""

    # Yarn
    if ! command -v yarn >/dev/null 2>&1; then
        echo "📦 Installing Yarn (30 seconds)..."
        echo "Starting Yarn installation..." >> "$LOG_FILE"
        ( brew install yarn ) >> "$LOG_FILE" 2>&1
        echo "Yarn installation completed." >> "$LOG_FILE"
        if ! command -v yarn >/dev/null 2>&1; then
            echo "❌ Yarn installation failed. Check $LOG_FILE for details."
            exit 1
        fi
        echo "✅ Yarn installed!"
    else
        echo "✅ Yarn already installed."
    fi
    echo ""

    # Protobuf
    if ! command -v protoc >/dev/null 2>&1; then
        echo "📦 Installing Protobuf (5-10 minutes)..."
        echo "💡 This compiles from source. You can open Activity Monitor to watch CPU usage."
        echo "Starting Protobuf installation..." >> "$LOG_FILE"
        ( brew install protobuf ) >> "$LOG_FILE" 2>&1
        echo "Protobuf installation completed." >> "$LOG_FILE"
        if ! command -v protoc >/dev/null 2>&1; then
            echo "❌ Protobuf installation failed. Check $LOG_FILE for details."
            exit 1
        fi
        echo "✅ Protobuf installed!"
    else
        echo "✅ Protobuf already installed."
    fi

    # Go protobuf plugins (if not already installed)
    if ! command -v protoc-gen-go >/dev/null 2>&1; then
        echo "📦 Installing Go protobuf plugins..."
        echo "Starting Go protobuf plugins installation..." >> "$LOG_FILE"
        ( go install google.golang.org/protobuf/cmd/protoc-gen-go@latest ) >> "$LOG_FILE" 2>&1
        ( go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest ) >> "$LOG_FILE" 2>&1
        echo "Go protobuf plugins installation completed." >> "$LOG_FILE"
        echo "✅ Go protobuf plugins installed!"
    else
        echo "✅ Go protobuf plugins already installed."
    fi

    # gRPC-Web plugin
    if ! command -v protoc-gen-grpc-web >/dev/null 2>&1; then
        echo "📦 Installing gRPC-Web plugin..."
        echo "Starting gRPC-Web plugin installation..." >> "$LOG_FILE"
        ( npm install -g protoc-gen-grpc-web ) >> "$LOG_FILE" 2>&1
        echo "gRPC-Web plugin installation completed." >> "$LOG_FILE"
        echo "✅ gRPC-Web plugin installed!"
    else
        echo "✅ gRPC-Web plugin already installed."
    fi

    # grpcwebproxy
    if ! command -v grpcwebproxy >/dev/null 2>&1; then
        echo "📦 Installing grpcwebproxy..."
        echo "Starting grpcwebproxy installation..." >> "$LOG_FILE"
        ( curl -L https://github.com/improbable-eng/grpc-web/releases/download/v0.15.0/grpcwebproxy-v0.15.0-osx-x86_64.zip -o grpcwebproxy.zip && unzip grpcwebproxy.zip && chmod +x dist/grpcwebproxy-v0.15.0-osx-x86_64 && sudo mv dist/grpcwebproxy-v0.15.0-osx-x86_64 /usr/local/bin/grpcwebproxy && rm grpcwebproxy.zip ) >> "$LOG_FILE" 2>&1
        echo "grpcwebproxy installation completed." >> "$LOG_FILE"
        if ! command -v grpcwebproxy >/dev/null 2>&1; then
            echo "❌ grpcwebproxy installation failed. Check $LOG_FILE for details."
            exit 1
        fi
        echo "✅ grpcwebproxy installed!"
    else
        echo "✅ grpcwebproxy already installed."
    fi

    echo "🎉 All prerequisites ready!"
    echo ""
}

# Function to start gRPC-Web proxy
start_grpc_web_proxy() {
    echo "Starting gRPC-Web proxy..."
    grpcwebproxy --backend_addr=localhost:50051 --run_tls_server=false --allow_all_origins >> "$LOG_FILE" 2>&1 &
    echo $! > grpcwebproxy.pid
    sleep 2
    echo "gRPC-Web proxy started on port 8080"
}
start_docker_services() {
    local retries=3
    for i in $(seq 1 $retries); do
        echo "Attempting to start Docker services (attempt $i/$retries)..."
        if docker-compose up -d; then
            echo "Docker services started successfully."
            return 0
        else
            echo "Failed to start Docker services. Retrying in 5 seconds..."
            sleep 5
        fi
    done
    echo "Failed to start Docker services after $retries attempts."
    exit 1
}

# Function to wait for services to be healthy
wait_for_services() {
    echo "Waiting for services to be healthy..."
    local timeout=60
    local elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if docker-compose ps | grep -q "Up"; then
            echo "Services are up."
            return 0
        fi
        sleep 5
        elapsed=$((elapsed + 5))
    done
    echo "Services did not start within $timeout seconds."
    exit 1
}

# Check prerequisites
check_prerequisites

# Generate protobuf code if not present
if [ ! -f "backend/shared/proto/hello.pb.go" ]; then
    echo "🔧 Generating Go protobuf code..."
    echo "Starting Go protobuf code generation..." >> "$LOG_FILE"
    ( cd backend/shared/proto && export PATH=$PATH:~/go/bin && protoc --go_out=. --go-grpc_out=. hello.proto ) >> "$LOG_FILE" 2>&1
    echo "Go protobuf code generation completed." >> "$LOG_FILE"
    echo "✅ Go protobuf code generated!"
fi

if [ ! -f "frontend/src/hello_grpc_web_pb.js" ]; then
    echo "🔧 Generating TypeScript protobuf code..."
    echo "Starting TypeScript protobuf code generation..." >> "$LOG_FILE"
    ( cd frontend/src && protoc -I ../../backend/shared/proto --plugin=protoc-gen-grpc-web=/Users/avinashmahala/.nvm/versions/node/v20.19.5/bin/protoc-gen-grpc-web --grpc-web_out=import_style=commonjs,mode=grpcwebtext:. hello.proto ) >> "$LOG_FILE" 2>&1
    echo "TypeScript protobuf code generation completed." >> "$LOG_FILE"
    echo "✅ TypeScript protobuf code generated!"
    # Fix CommonJS require for ES modules
    echo "🔧 Fixing CommonJS imports for ES modules..."
    ( cd frontend/src && sed -i '' 's/const grpc = {};/import * as grpcWeb from '\''grpc-web'\'';\nconst grpc = {};/g' hello_grpc_web_pb.js )
    ( cd frontend/src && sed -i '' 's/grpc\.web = require('\''grpc-web'\'');/grpc.web = grpcWeb.default || grpcWeb;/g' hello_grpc_web_pb.js )
    echo "✅ CommonJS imports fixed!"
fi

if [ ! -f "frontend/src/hello_pb.js" ]; then
    echo "🔧 Generating JavaScript protobuf messages..."
    echo "Starting JS protobuf message generation..." >> "$LOG_FILE"
    ( cd frontend/src && protoc -I ../../backend/shared/proto --plugin=protoc-gen-js=../node_modules/.bin/protoc-gen-js --js_out=import_style=es6,binary:. hello.proto ) >> "$LOG_FILE" 2>&1
    echo "JS protobuf message generation completed." >> "$LOG_FILE"
    echo "✅ JS protobuf messages generated!"
fi

# Start Docker services if not running
if ! docker-compose ps | grep -q "Up"; then
    echo "🐳 Starting Docker services..."
    start_docker_services >> "$LOG_FILE" 2>&1
    wait_for_services >> "$LOG_FILE" 2>&1
    echo "✅ Docker services started!"
fi

# Initiate backend with error handling
if [ ! -f "backend/go.sum" ]; then
    echo "🔧 Setting up backend dependencies..."
    echo "Starting backend setup..." >> "$LOG_FILE"
    ( cd backend && go mod tidy ) >> "$LOG_FILE" 2>&1
    echo "Backend setup completed." >> "$LOG_FILE"
    if [ $? -ne 0 ]; then
        echo "❌ Failed to initiate backend. Check $LOG_FILE for details."
        exit 1
    fi
    echo "✅ Backend dependencies ready!"
    # Generate Swagger docs if swag is available
    if command -v swag >/dev/null 2>&1; then
        echo "🔧 Generating Swagger documentation..."
        ( cd backend/core-api && swag init ) >> "$LOG_FILE" 2>&1
        echo "Swagger docs generated." >> "$LOG_FILE"
    fi
fi

# Initiate frontend with error handling
if [ ! -d "frontend/node_modules" ]; then
    echo "🔧 Setting up frontend dependencies..."
    echo "Starting frontend setup..." >> "$LOG_FILE"
    ( cd frontend && yarn install ) >> "$LOG_FILE" 2>&1
    echo "Frontend setup completed." >> "$LOG_FILE"
    if [ $? -ne 0 ]; then
        echo "❌ Failed to initiate frontend. Check $LOG_FILE for details."
        exit 1
    fi
    echo "✅ Frontend dependencies ready!"
fi

#!/bin/bash

# ClusterGenie Start Script - Central monitor for all services

set -e

echo "Starting ClusterGenie services..."

# ... (previous functions remain)

# Check prerequisites
check_prerequisites

# Start Docker services if not running
if ! docker-compose ps | grep -q "Up"; then
    start_docker_services
    wait_for_services
fi

# Initiate backend/frontend (same as before)

# Start services in separate terminals
echo "Starting backend services, frontend, and Docker in separate terminals..."

# Core API terminal
echo "Opening terminal for Core API logs..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && docker-compose logs -f core-api\"" > /dev/null 2>&1

# Diagnosis terminal (placeholder)
echo "Opening terminal for Diagnosis service..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && echo 'Diagnosis service terminal - implement later'; sleep infinity\"" > /dev/null 2>&1

# Provisioning terminal (placeholder)
echo "Opening terminal for Provisioning service..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && echo 'Provisioning service terminal - implement later'; sleep infinity\"" > /dev/null 2>&1

# Monitoring terminal (placeholder)
echo "Opening terminal for Monitoring service..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && echo 'Monitoring service terminal - implement later'; sleep infinity\"" > /dev/null 2>&1

# Kafka terminal
echo "Opening terminal for Kafka logs..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && docker-compose logs -f kafka\"" > /dev/null 2>&1

# Frontend terminal
echo "Opening terminal for Frontend dev server..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd)/frontend && yarn dev\"" > /dev/null 2>&1

# Backend terminal
echo "Opening terminal for Backend dev server..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd)/backend && export PATH=\$PATH:~/go/bin && air\"" > /dev/null 2>&1

# Docker overview terminal
echo "Opening terminal for Docker overview logs..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && docker-compose logs -f\"" > /dev/null 2>&1

# Central monitor terminal
echo "📺 Opening central monitor terminal..."
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && echo '🎛️  Central Monitor: Run ./stop.sh to stop all services.'; echo '📄 Setup logs: $LOG_FILE'; sleep infinity\"" > /dev/null 2>&1

start_grpc_web_proxy

echo "🎉 All terminals opened successfully!"
echo "💡 Use ./stop.sh in the central monitor to stop all services."
echo "📄 Detailed setup logs are in $LOG_FILE"