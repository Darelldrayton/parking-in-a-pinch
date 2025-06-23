#!/bin/bash

# 🚨 EMERGENCY: Test API directly while fixing nginx

echo "🔥 Testing Django API directly..."

# Test 1: API health
echo "1. Testing API health:"
curl -s http://165.227.111.160/api/v1/ | head -c 200
echo -e "\n"

# Test 2: Login endpoint
echo "2. Testing login endpoint:"
curl -X POST http://165.227.111.160/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -H "Origin: http://165.227.111.160" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  | python3 -m json.tool 2>/dev/null || echo "Response not JSON"

echo -e "\n"
echo "3. Testing CORS headers:"
curl -I -X OPTIONS http://165.227.111.160/api/v1/auth/login/ \
  -H "Origin: http://165.227.111.160" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

echo -e "\nIf you see JSON responses above, Django is working!"
echo "The issue is purely nginx routing, not the backend!"