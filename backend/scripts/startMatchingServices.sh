#!/bin/bash

# Script to start the SharedTableMatchingAlgorithm services

echo "🚀 Starting SharedTable Matching Algorithm Services..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directory for services
SERVICES_DIR="../../SharedTableMatchingAlgorithm/services"

# Check if services directory exists
if [ ! -d "$SERVICES_DIR" ]; then
    echo -e "${RED}❌ Services directory not found at $SERVICES_DIR${NC}"
    echo "Please ensure SharedTableMatchingAlgorithm is in the parent directory"
    exit 1
fi

# Function to start a service
start_service() {
    local service_name=$1
    local port=$2
    local service_path="$SERVICES_DIR/$service_name"
    
    echo -e "\n${YELLOW}Starting $service_name on port $port...${NC}"
    
    if [ ! -d "$service_path" ]; then
        echo -e "${RED}❌ Service directory not found: $service_path${NC}"
        return 1
    fi
    
    # Check if already running
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✅ $service_name already running on port $port${NC}"
        return 0
    fi
    
    # Start the service in background
    cd "$service_path"
    
    # Check if virtual environment exists
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
    
    # Install requirements if needed
    if [ -f "requirements.txt" ]; then
        pip install -q -r requirements.txt
    fi
    
    # Start service
    nohup python -m uvicorn app.main:app --reload --port $port > "$service_name.log" 2>&1 &
    
    # Wait a moment for service to start
    sleep 3
    
    # Check if service started successfully
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${GREEN}✅ $service_name started successfully on port $port${NC}"
        echo "   Log file: $service_path/$service_name.log"
        return 0
    else
        echo -e "${RED}❌ Failed to start $service_name${NC}"
        echo "   Check log file: $service_path/$service_name.log"
        return 1
    fi
}

# Start all services
echo -e "\n${YELLOW}Starting all matching services...${NC}"

start_service "data-processor" 8001
start_service "people-matcher" 8002
start_service "restaurant-matcher" 8003

echo -e "\n${GREEN}=================================================="
echo "✅ All services should be running!"
echo "==================================================${NC}"
echo ""
echo "Service URLs:"
echo "  - Data Processor:     http://localhost:8001/docs"
echo "  - People Matcher:     http://localhost:8002/docs"
echo "  - Restaurant Matcher: http://localhost:8003/docs"
echo ""
echo "To stop services, use: ./stopMatchingServices.sh"
echo ""