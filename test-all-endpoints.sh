#!/bin/bash

# Test script for all SpoolTracker API endpoints
# Usage: ./test-all-endpoints.sh [base_url]
# Example: ./test-all-endpoints.sh http://192.168.2.13:9002

BASE_URL="${1:-http://localhost:9002}"
API_BASE="${BASE_URL}/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
TOTAL=0

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    local expected_status=${5:-200}
    
    TOTAL=$((TOTAL + 1))
    
    echo -n "Testing $method $endpoint ... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "${API_BASE}${endpoint}" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            "${API_BASE}${endpoint}" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_status" ] || [ "$http_code" -eq "200" ] || [ "$http_code" -eq "201" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "  Response: $body" | head -c 200
        echo ""
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "=========================================="
echo "SpoolTracker API Endpoint Tests"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo "API Base: $API_BASE"
echo ""

# Settings API
echo "=== Settings API ==="
test_endpoint "GET" "/settings" "Get settings"
test_endpoint "PUT" "/settings" "Update settings" '{"defaultWeightGrams":1000,"defaultCurrency":"USD","lowStockThreshold":20}'

# Materials API
echo ""
echo "=== Materials API ==="
test_endpoint "GET" "/materials" "Get all materials"
test_endpoint "GET" "/materials?page=0&pageSize=10" "Get materials with pagination"
test_endpoint "GET" "/materials/1" "Get material by ID"

# Manufacturers API
echo ""
echo "=== Manufacturers API ==="
test_endpoint "GET" "/manufacturers" "Get all manufacturers"
test_endpoint "GET" "/manufacturers?page=0&pageSize=10" "Get manufacturers with pagination"
test_endpoint "GET" "/manufacturers/1" "Get manufacturer by ID"

# Filament Types API
echo ""
echo "=== Filament Types API ==="
test_endpoint "GET" "/filament-types" "Get all filament types"
test_endpoint "GET" "/filament-types?materialId=1" "Get filament types by material"
test_endpoint "GET" "/filament-types/1" "Get filament type by ID"
test_endpoint "GET" "/filament-types/1/colors" "Get colors for filament type"

# Locations API
echo ""
echo "=== Locations API ==="
test_endpoint "GET" "/locations" "Get all locations"
test_endpoint "GET" "/locations?page=0&pageSize=10" "Get locations with pagination"
test_endpoint "GET" "/locations/tree" "Get location tree"
test_endpoint "GET" "/locations/types" "Get location types"
test_endpoint "GET" "/locations/1" "Get location by ID"
test_endpoint "GET" "/locations/1/spools" "Get spools at location"

# Spools API
echo ""
echo "=== Spools API ==="
test_endpoint "GET" "/spools" "Get all spools"
test_endpoint "GET" "/spools?page=0&pageSize=10" "Get spools with pagination"
test_endpoint "GET" "/spools?isEmpty=false" "Get non-empty spools"
test_endpoint "GET" "/spools/stats/by-location" "Get stats by location"
test_endpoint "GET" "/spools/stats/by-material" "Get stats by material"

# Spool History API
echo ""
echo "=== Spool History API ==="
# Try to get a real spool ID first
SPOOL_ID=$(curl -s "${API_BASE}/spools?pageSize=1" 2>/dev/null | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2 || echo "1")
if [ -n "$SPOOL_ID" ] && [ "$SPOOL_ID" != "null" ]; then
    test_endpoint "GET" "/spools/${SPOOL_ID}/history" "Get spool history for ID $SPOOL_ID" "" 200
else
    echo "Skipping spool history test - no spools found in database"
fi

# Export API
echo ""
echo "=== Export API ==="
test_endpoint "GET" "/export/spools/csv" "Export spools to CSV"

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "Total tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi

