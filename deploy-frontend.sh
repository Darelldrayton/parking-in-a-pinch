#!/bin/bash

# Deploy frontend to production server
echo "Building frontend..."
cd frontend && npm run build

echo "Deploying to server..."
# You'll need to provide the SSH key path or password
scp -r dist/* root@165.227.111.160:/var/www/parkinginapinch.com/html/

echo "Deployment complete!"