#!/bin/bash

echo "🅿️ Starting Parking in a Pinch on port 3008..."

# Kill any existing processes
pkill -f "python.*manage.py" || true
pkill -f "vite" || true
pkill -f "npm.*dev" || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3008 | xargs kill -9 2>/dev/null || true

sleep 2

# Start backend
echo "🔧 Starting Django backend..."
cd backend
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
cd ..

# Wait for backend
sleep 5

# Start frontend
echo "⚛️ Starting React frontend on port 3008..."
cd frontend
npm run dev &
cd ..

sleep 5

echo "
🎉 Servers started!

Access your application at:
- Frontend: http://172.22.146.152:3008
- Backend: http://172.22.146.152:8000

Or from Windows after running the PowerShell script:
- Frontend: http://localhost:3008
- Backend: http://localhost:8000
"