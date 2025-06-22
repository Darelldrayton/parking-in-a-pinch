#!/bin/bash

# Parking in a Pinch stop script

echo "🛑 Stopping Parking in a Pinch..."

# Kill processes by PID files
if [ -f logs/backend.pid ]; then
    echo "🔧 Stopping backend..."
    kill $(cat logs/backend.pid) 2>/dev/null || true
    rm -f logs/backend.pid
fi

if [ -f logs/frontend.pid ]; then
    echo "⚛️  Stopping frontend..."
    kill $(cat logs/frontend.pid) 2>/dev/null || true
    rm -f logs/frontend.pid
fi

# Kill processes by name
pkill -f "manage.py runserver" 2>/dev/null || true
pkill -f "gunicorn.*config.wsgi" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite.*frontend" 2>/dev/null || true

# Kill by port
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "✅ Parking in a Pinch stopped successfully"