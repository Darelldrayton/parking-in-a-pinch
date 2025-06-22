#!/bin/bash

# Parking in a Pinch startup script - starts both frontend and backend
 
set -e  # Exit on any error
 
echo "🅿️ Starting Parking in a Pinch..."
 
# Create logs directory if it doesn't exist
mkdir -p logs
 
# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}
 
# Function to kill processes on specific ports
kill_port() {
    local port=$1
    echo "🧹 Killing processes on port $port..."
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    sleep 1
}
 
# Stop existing processes
echo "🛑 Stopping existing Parking in a Pinch processes..."
if [ -f logs/backend.pid ]; then
    kill $(cat logs/backend.pid) 2>/dev/null || true
    rm -f logs/backend.pid
fi
if [ -f logs/frontend.pid ]; then
    kill $(cat logs/frontend.pid) 2>/dev/null || true
    rm -f logs/frontend.pid
fi
 
# Kill processes by name
pkill -f "manage.py runserver" 2>/dev/null || true
pkill -f "gunicorn.*config.wsgi" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "vite.*frontend" 2>/dev/null || true
 
# Kill by port if still running
if check_port 8000; then
    kill_port 8000
fi
if check_port 3008; then
    kill_port 3008
fi
 
# Wait for cleanup
sleep 2
 
# Verify ports are free
if check_port 8000; then
    echo "❌ Port 8000 still in use. Please manually kill processes on this port."
    exit 1
fi
if check_port 3008; then
    echo "❌ Port 3008 still in use. Please manually kill processes on this port."
    exit 1
fi
 
# Start backend
echo "🔧 Starting Django backend on port 8000 (with auto-reload)..."
cd backend
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found in backend/"
    exit 1
fi
source venv/bin/activate
# Use standard runserver with auto-reload enabled for development
nohup python manage.py runserver 0.0.0.0:8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..
 
# Wait for backend to start
echo "⏳ Waiting for backend to start (this may take up to 30 seconds)..."
for i in {1..30}; do
    if check_port 8000; then
        # Port is open, but let's verify Django is actually responding
        if curl -s -o /dev/null -w "%{http_code}" http://172.22.146.152:8000/ | grep -q "404\|200\|301\|302"; then
            echo "✅ Backend started and responding on port 8000"
            break
        else
            echo "⏳ Port open, waiting for Django to respond..."
        fi
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start on port 8000"
        echo "📋 Last 20 lines of backend log:"
        cat logs/backend.log | tail -20
        exit 1
    fi
    sleep 1
done
 
# Start frontend
echo "⚛️  Starting React frontend on port 3008 (with HMR auto-reload)..."
cd frontend
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in frontend/"
    exit 1
fi
nohup npm run dev -- --host 0.0.0.0 --port 3008 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..
 
# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
for i in {1..15}; do
    if check_port 3008; then
        echo "✅ Frontend started on port 3008"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "❌ Frontend failed to start on port 3008"
        cat logs/frontend.log | tail -10
        exit 1
    fi
    sleep 1
done
 
# Verify both servers are responding
echo "🔍 Testing server connections..."
if curl -s http://localhost:8000 > /dev/null; then
    echo "✅ Backend responding at http://localhost:8000"
else
    echo "❌ Backend not responding"
fi
 
if curl -s http://localhost:3008 > /dev/null; then
    echo "✅ Frontend responding at http://localhost:3008"
else
    echo "❌ Frontend not responding"
fi
 
echo ""
echo "🎉 Parking in a Pinch started successfully!"
echo ""
echo "🌐 Frontend: http://localhost:3008 (Hot Module Replacement enabled)"
echo "🔗 Backend:  http://localhost:8000 (Django auto-reload enabled)"
echo ""
echo "🔄 Auto-reload is active:"
echo "   - Frontend: Vite HMR will reload on file changes"
echo "   - Backend: Django will restart on Python file changes"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 To stop: ./stop.sh"
echo ""
echo "💡 Tips:"
echo "   - Frontend changes will auto-refresh in browser"
echo "   - Backend changes will restart Django server"
echo "   - If auto-reload stops working, use the menu (Ctrl+C) to restart"
echo ""
echo "⏳ Parking in a Pinch is running... Press Ctrl+C to restart or exit"
echo ""
 
# Function to handle restart
restart_servers() {
    echo ""
    echo "🔄 Stopping current servers..."
    ./stop.sh > /dev/null 2>&1
    sleep 2
    echo "🚀 Restarting Parking in a Pinch..."
    exec "$0"  # Restart the script
}
 
# Function to handle exit
exit_servers() {
    echo ""
    echo "🛑 Stopping Parking in a Pinch servers..."
    ./stop.sh
    echo "✅ Parking in a Pinch stopped successfully"
    exit 0
}
 
# Trap Ctrl+C to show restart menu
trap 'echo ""; echo "🔧 Parking in a Pinch Control Menu:"; echo "  r) Restart servers"; echo "  s) Stop and exit"; echo "  c) Continue running"; echo ""; read -p "Choose [r/s/c]: " action; case $action in r|R) restart_servers ;; s|S) exit_servers ;; *) echo "✅ Continuing..." ;; esac' INT
 
# Keep the script alive and show live logs
echo "📋 Live logs (Ctrl+C for menu):"
echo ""
tail -f logs/backend.log logs/frontend.log