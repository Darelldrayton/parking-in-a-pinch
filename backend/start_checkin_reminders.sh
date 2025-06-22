#!/bin/bash

# Start Check-in Reminder System
# This script starts the necessary services for check-in reminders

echo "🚀 Starting Check-in Reminder System for Parking in a Pinch"
echo "=========================================================="

# Check if Redis is running
echo "📡 Checking Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis first."
    echo "   On Ubuntu/Debian: sudo systemctl start redis-server"
    echo "   On macOS with Homebrew: brew services start redis"
    echo "   Manual: redis-server"
    exit 1
fi
echo "✅ Redis is running"

# Check if Django migrations are up to date
echo "🔄 Checking Django migrations..."
python manage.py migrate --check > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Django migrations are not up to date"
    echo "   Running migrations now..."
    python manage.py migrate
fi
echo "✅ Django migrations are current"

# Create Celery Beat database tables
echo "🔄 Setting up Celery Beat database..."
python manage.py migrate django_celery_beat
echo "✅ Celery Beat database is ready"

# Function to start a service in background
start_service() {
    local service_name=$1
    local command=$2
    local log_file=$3
    
    echo "🚀 Starting $service_name..."
    nohup $command > $log_file 2>&1 &
    local pid=$!
    echo $pid > "${service_name,,}.pid"
    echo "✅ $service_name started (PID: $pid, Log: $log_file)"
}

# Create logs directory
mkdir -p logs

# Start Celery Worker
start_service "Celery Worker" "celery -A config worker --loglevel=info" "logs/celery_worker.log"

# Wait a moment
sleep 2

# Start Celery Beat (scheduler)
start_service "Celery Beat" "celery -A config beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler" "logs/celery_beat.log"

echo ""
echo "🎉 Check-in Reminder System is now running!"
echo "=========================================="
echo ""
echo "📊 Service Status:"
echo "  - Celery Worker: Running (PID: $(cat celery_worker.pid 2>/dev/null || echo 'Not found'))"
echo "  - Celery Beat: Running (PID: $(cat celery_beat.pid 2>/dev/null || echo 'Not found'))"
echo ""
echo "📄 Log Files:"
echo "  - Worker: logs/celery_worker.log"
echo "  - Beat: logs/celery_beat.log"
echo ""
echo "🛠️  Management Commands:"
echo "  - Test system: python test_checkin_reminders.py"
echo "  - Manual reminders: python manage.py send_checkin_reminders --dry-run"
echo "  - Stop services: ./stop_checkin_reminders.sh"
echo ""
echo "💡 The system will automatically:"
echo "  - Send reminders 15 minutes before parking starts"
echo "  - Schedule reminders when bookings are confirmed"
echo "  - Process reminders every minute via Celery Beat"
echo ""
echo "✅ Setup complete! Check-in reminders are now active."