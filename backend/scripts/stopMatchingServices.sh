#!/bin/bash

# Script to stop the SharedTableMatchingAlgorithm services

echo "🛑 Stopping SharedTable Matching Algorithm Services..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to stop a service on a port
stop_service() {
    local service_name=$1
    local port=$2
    
    echo -e "\n${YELLOW}Stopping $service_name on port $port...${NC}"
    
    # Find process using the port
    PID=$(lsof -ti:$port)
    
    if [ -z "$PID" ]; then
        echo -e "${YELLOW}⚠️  No service running on port $port${NC}"
        return 0
    fi
    
    # Kill the process
    kill $PID 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Stopped $service_name (PID: $PID)${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to stop $service_name${NC}"
        return 1
    fi
}

# Stop all services
stop_service "data-processor" 8001
stop_service "people-matcher" 8002
stop_service "restaurant-matcher" 8003

echo -e "\n${GREEN}=================================================="
echo "✅ All services stopped!"
echo "==================================================${NC}"