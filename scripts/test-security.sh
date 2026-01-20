#!/bin/bash

# Security Testing Script for Creator Ledger
# Tests rate limiting, validation, and CORS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get Supabase URL and keys from environment or .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

SUPABASE_URL="${VITE_SUPABASE_URL:-https://pdvqegojzgipuoxruhzm.supabase.co}"
ANON_KEY="${VITE_SUPABASE_ANON_KEY}"

if [ -z "$ANON_KEY" ]; then
    echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY not set${NC}"
    echo "Please set it in .env.local or export it:"
    echo "export VITE_SUPABASE_ANON_KEY=your-key"
    exit 1
fi

echo -e "${GREEN}🧪 Testing Security Features${NC}"
echo "Supabase URL: $SUPABASE_URL"
echo ""

# Test 1: Rate Limiting
echo -e "${YELLOW}Test 1: Rate Limiting${NC}"
echo "Making 21 requests to create-entry (limit is 20/min)..."
echo ""

RATE_LIMIT_HIT=false
for i in {1..21}; do
    response=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_URL/functions/v1/create-entry" \
        -H "apikey: $ANON_KEY" \
        -H "Content-Type: application/json" \
        -d '{"url":"https://example.com","platform":"test","payload_hash":"abc123"}' 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "429" ]; then
        echo -e "${GREEN}✅ Request $i: Rate limited (429) - Rate limiting works!${NC}"
        RATE_LIMIT_HIT=true
        break
    elif [ "$i" -le 5 ]; then
        echo "Request $i: HTTP $http_code"
    fi
done

if [ "$RATE_LIMIT_HIT" = false ]; then
    echo -e "${YELLOW}⚠️  Rate limit not hit (may need authentication or different endpoint)${NC}"
fi

echo ""

# Test 2: Input Validation
echo -e "${YELLOW}Test 2: Input Validation${NC}"
echo "Testing with invalid URL..."

response=$(curl -s -w "\n%{http_code}" -X POST "$SUPABASE_URL/functions/v1/create-entry" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"url":"not-a-url","platform":"test","payload_hash":"abc123"}' 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✅ Invalid URL rejected (400) - Validation works!${NC}"
    echo "Response: $body"
else
    echo -e "${YELLOW}⚠️  Expected 400, got $http_code${NC}"
    echo "Response: $body"
fi

echo ""

# Test 3: CORS
echo -e "${YELLOW}Test 3: CORS Headers${NC}"
echo "Testing CORS from localhost..."

response=$(curl -s -I -H "Origin: http://localhost:5173" \
    "$SUPABASE_URL/functions/v1/get-entries" \
    -H "apikey: $ANON_KEY" 2>/dev/null)

if echo "$response" | grep -q "Access-Control-Allow-Origin"; then
    origin=$(echo "$response" | grep -i "access-control-allow-origin" | cut -d' ' -f2 | tr -d '\r')
    echo -e "${GREEN}✅ CORS header present: $origin${NC}"
    
    if [ "$origin" = "*" ]; then
        echo -e "${YELLOW}⚠️  Using wildcard - set ALLOWED_ORIGINS in Supabase Dashboard${NC}"
    fi
else
    echo -e "${RED}❌ CORS header missing${NC}"
fi

echo ""
echo -e "${GREEN}✅ Security tests complete!${NC}"

