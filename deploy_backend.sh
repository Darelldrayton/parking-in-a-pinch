#!/bin/bash

# Backend Deployment Script for Parking in a Pinch
# This script deploys backend changes to the production server at 165.227.111.160

set -e

echo "🚀 Starting backend deployment..."

# Configuration
BACKEND_SERVER="165.227.111.160"
BACKEND_USER="root"  # Update this if different
PROJECT_DIR="/var/www/parking-in-a-pinch"  # Update this to actual path on server
BRANCH="main"

echo "📋 Deployment Configuration:"
echo "  Server: $BACKEND_SERVER"
echo "  User: $BACKEND_USER"
echo "  Project Directory: $PROJECT_DIR"
echo "  Branch: $BRANCH"
echo ""

# Check if we can connect to the server
echo "🔍 Checking server connectivity..."
if ! ping -c 1 "$BACKEND_SERVER" > /dev/null 2>&1; then
    echo "❌ Cannot reach server $BACKEND_SERVER"
    echo "Please check:"
    echo "  1. Server is running"
    echo "  2. Network connectivity"
    echo "  3. Server IP address is correct"
    exit 1
fi

echo "✅ Server is reachable"

# SSH deployment commands
echo "📦 Deploying to production server..."
echo "Note: You will need SSH access to the server for this deployment"
echo ""
echo "Run these commands on the server ($BACKEND_SERVER):"
echo ""
echo "# Connect to server"
echo "ssh $BACKEND_USER@$BACKEND_SERVER"
echo ""
echo "# Navigate to project directory"
echo "cd $PROJECT_DIR"
echo ""
echo "# Pull latest changes"
echo "git fetch origin"
echo "git checkout $BRANCH"
echo "git pull origin $BRANCH"
echo ""
echo "# Install dependencies and run migrations"
echo "source venv/bin/activate  # or however the virtual environment is activated"
echo "pip install -r requirements.txt"
echo "python manage.py migrate"
echo "python manage.py collectstatic --noinput"
echo ""
echo "# Restart the application"
echo "sudo systemctl restart gunicorn  # or however the app is managed"
echo "sudo systemctl restart nginx     # if using nginx"
echo ""
echo "# Check status"
echo "sudo systemctl status gunicorn"
echo "curl -s http://localhost/api/listings/ | head -5"
echo ""

# Alternative: Try automated deployment if SSH keys are set up
echo "🤖 Attempting automated deployment..."
echo "Note: This requires SSH key authentication to be set up"

# Test SSH connection
if ssh -o ConnectTimeout=5 -o BatchMode=yes "$BACKEND_USER@$BACKEND_SERVER" exit 2>/dev/null; then
    echo "✅ SSH connection successful, proceeding with automated deployment..."
    
    ssh "$BACKEND_USER@$BACKEND_SERVER" << 'EOF'
        set -e
        echo "📂 Navigating to project directory..."
        cd /var/www/parking-in-a-pinch || { echo "❌ Project directory not found"; exit 1; }
        
        echo "📥 Pulling latest changes..."
        git fetch origin
        git checkout main
        git pull origin main
        
        echo "🐍 Activating virtual environment..."
        source venv/bin/activate || source env/bin/activate || { echo "❌ Virtual environment not found"; exit 1; }
        
        echo "📦 Installing dependencies..."
        pip install -r requirements.txt
        
        echo "🗄️ Running migrations..."
        python manage.py migrate
        
        echo "📁 Collecting static files..."
        python manage.py collectstatic --noinput
        
        echo "🔄 Restarting services..."
        sudo systemctl restart gunicorn || sudo supervisorctl restart parking-app || { echo "⚠️ Could not restart app service"; }
        sudo systemctl restart nginx || { echo "⚠️ Could not restart nginx"; }
        
        echo "✅ Deployment complete!"
        
        echo "🧪 Testing API..."
        sleep 2
        curl -s http://localhost/api/listings/ | head -5 || echo "⚠️ API test failed"
EOF
    
    echo "✅ Automated deployment complete!"
else
    echo "❌ SSH connection failed. Manual deployment required."
    echo ""
    echo "To set up SSH key authentication:"
    echo "1. ssh-copy-id $BACKEND_USER@$BACKEND_SERVER"
    echo "2. Test with: ssh $BACKEND_USER@$BACKEND_SERVER"
    echo "3. Re-run this script"
fi

echo ""
echo "🎯 CRITICAL: The listing approval changes must be deployed to fix the auto-approval issue"
echo "   - New listings are currently auto-appearing without admin approval"
echo "   - Backend code has the fix but needs deployment to production server"
echo ""
echo "📋 After deployment, verify the fix works:"
echo "1. Create a test listing from the frontend"
echo "2. Check that it doesn't appear on the public listings page immediately"
echo "3. Check admin dashboard for pending approval"