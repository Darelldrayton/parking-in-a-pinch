#!/bin/bash

# Setup script for Payout Management System
echo "🚀 Setting up Payout Management System..."

# Navigate to backend directory
cd backend

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️ Virtual environment not found. Please create one first:"
    echo "python3 -m venv venv"
    echo "source venv/bin/activate" 
    echo "pip install -r requirements.txt"
    exit 1
fi

# Apply migrations
echo "🔄 Applying database migrations..."
python manage.py migrate

# Create sample payout data
echo "📊 Creating sample payout data..."
python manage.py create_sample_payouts --count=10

# Collect static files if needed
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo "✅ Payout Management System setup complete!"
echo ""
echo "🌐 Access the admin dashboard at:"
echo "   https://www.parkinginapinch.com/admin/dashboard"
echo "   https://www.parkinginapinch.com/ruler/dashboard"
echo ""
echo "🔑 Login with admin credentials:"
echo "   Email: darelldrayton93@gmail.com"
echo "   (Use your admin password)"
echo ""
echo "📋 Payout Management Features:"
echo "   • View payout requests statistics"
echo "   • Filter by status (Pending, Approved, Rejected, Completed)"
echo "   • Approve/Reject payout requests"
echo "   • Mark approved payouts as completed"
echo "   • Track bank details and payment methods"
echo ""