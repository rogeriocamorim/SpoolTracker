#!/bin/bash

# SpoolTracker Development Server Startup Script
# This script starts both the backend (Quarkus) and frontend (React) servers

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${GREEN}🧵 SpoolTracker Development Server${NC}"
echo "=================================="
echo ""

# Check if Maven wrapper exists
if [ ! -f "backend/mvnw" ]; then
    echo -e "${YELLOW}⚠️  Maven wrapper not found. Initializing...${NC}"
    cd backend && mvn wrapper:wrapper && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not found. Installing...${NC}"
    cd frontend && npm install && cd ..
fi

# Check if root dependencies are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Root dependencies not found. Installing...${NC}"
    npm install
fi

echo -e "${BLUE}Starting services...${NC}"
echo ""
echo "  📦 Backend:  http://localhost:8080"
echo "  🌐 Frontend: http://localhost:5173"
echo "  📚 API Docs: http://localhost:8080/q/swagger-ui"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Start both services
npm run dev

