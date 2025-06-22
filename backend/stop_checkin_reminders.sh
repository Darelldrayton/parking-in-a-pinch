#!/bin/bash

# Stop Check-in Reminder System
# This script stops the Celery services

echo "🛑 Stopping Check-in Reminder System"
echo "===================================="

stop_service() {
    local service_name=$1
    local pid_file="${service_name,,}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🛑 Stopping $service_name (PID: $pid)..."
            kill "$pid"
            rm "$pid_file"
            echo "✅ $service_name stopped"
        else
            echo "⚠️  $service_name PID file exists but process not running"
            rm "$pid_file"
        fi
    else
        echo "ℹ️  $service_name is not running (no PID file)"
    fi
}

# Stop services
stop_service "Celery Worker"
stop_service "Celery Beat"

# Kill any remaining celery processes
echo "🧹 Cleaning up any remaining Celery processes..."
pkill -f "celery.*config" 2>/dev/null && echo "✅ Cleaned up remaining processes" || echo "ℹ️  No remaining processes found"

echo ""
echo "✅ Check-in Reminder System stopped"
echo ""
echo "💡 To restart: ./start_checkin_reminders.sh"