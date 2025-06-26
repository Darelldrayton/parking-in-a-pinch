#!/bin/bash

# Fix DigitalOcean Backend 502 Bad Gateway Error
# Run this script on your DigitalOcean server

echo "🔧 Fixing Backend 502 Error..."

# 1. Check current status
echo "📊 Checking current service status..."
sudo systemctl status gunicorn
sudo systemctl status nginx

# 2. Check if Django port 8001 is running
echo "🔍 Checking if Django is running on port 8001..."
sudo lsof -i :8001

# 3. Restart Gunicorn service
echo "🔄 Restarting Gunicorn..."
sudo systemctl restart gunicorn
sleep 3

# 4. If gunicorn doesn't exist, try these alternatives
if ! systemctl is-active --quiet gunicorn; then
    echo "⚠️  Gunicorn service not found, checking for alternatives..."
    
    # Check for Django running directly
    ps aux | grep -E 'manage.py|django|python.*8001'
    
    # Try to start Django manually
    echo "🚀 Starting Django manually..."
    cd /home/*/parking-backend || cd /opt/parking-backend || cd /var/www/parking-backend
    
    # Activate virtual environment if exists
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    elif [ -f "env/bin/activate" ]; then
        source env/bin/activate
    fi
    
    # Start Django
    python manage.py runserver 0.0.0.0:8001 &
    DJANGO_PID=$!
    echo "Django started with PID: $DJANGO_PID"
fi

# 5. Test if backend is responding
echo "🧪 Testing backend..."
sleep 5
curl -I http://localhost:8001/api/v1/listings/

# 6. Restart Nginx to clear any bad gateway cache
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

# 7. Test the full path
echo "✅ Testing full API path..."
curl -I http://localhost/api/v1/listings/

echo "🎯 Backend fix complete! Check the output above for any errors."
echo "💡 If Django is not running, you may need to:"
echo "   1. cd to your backend directory"
echo "   2. Activate virtual environment"
echo "   3. Run: python manage.py runserver 0.0.0.0:8001"