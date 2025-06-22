#!/bin/bash

# Production deployment script for Parking in a Pinch
# Run this script on your production server

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

# Configuration
PROJECT_DIR="/var/www/parking-app"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
DEPLOY_DIR="$PROJECT_DIR/deploy"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    postgresql \
    postgresql-contrib \
    redis-server \
    nginx \
    certbot \
    python3-certbot-nginx \
    git \
    curl \
    nodejs \
    npm

# Create project directory
print_status "Creating project directory..."
sudo mkdir -p $PROJECT_DIR
sudo chown $USER:$USER $PROJECT_DIR

# Clone or update repository
if [ ! -d "$PROJECT_DIR/.git" ]; then
    print_status "Cloning repository..."
    git clone https://github.com/yourusername/parking-in-a-pinch.git $PROJECT_DIR
else
    print_status "Updating repository..."
    cd $PROJECT_DIR
    git pull origin main
fi

# Setup backend
print_status "Setting up Django backend..."
cd $BACKEND_DIR

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment and install packages
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements-production.txt

# Setup environment file
if [ ! -f ".env" ]; then
    print_warning "Creating .env file from template..."
    cp .env.production .env
    print_warning "Please edit $BACKEND_DIR/.env with your actual values!"
    print_warning "Press Enter when ready to continue..."
    read
fi

# Collect static files
print_status "Collecting static files..."
python manage.py collectstatic --noinput --settings=config.settings.production

# Run database migrations
print_status "Running database migrations..."
python manage.py migrate --settings=config.settings.production

# Create superuser (if needed)
print_status "Creating superuser (if needed)..."
python manage.py shell --settings=config.settings.production << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@yourdomain.com', 'change-this-password')
    print('Superuser created')
else:
    print('Superuser already exists')
EOF

deactivate

# Setup frontend
print_status "Setting up React frontend..."
cd $FRONTEND_DIR

# Install dependencies
npm install

# Build for production
print_status "Building frontend for production..."
npm run build

# Setup Nginx
print_status "Configuring Nginx..."
sudo cp $DEPLOY_DIR/nginx.conf /etc/nginx/sites-available/parking-app
sudo ln -sf /etc/nginx/sites-available/parking-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Setup systemd services
print_status "Setting up systemd services..."
sudo cp $DEPLOY_DIR/parking-app.service /etc/systemd/system/
sudo cp $DEPLOY_DIR/parking-app.socket /etc/systemd/system/

# Create log directories
sudo mkdir -p /var/log/parking-app
sudo chown www-data:www-data /var/log/parking-app

# Create run directory
sudo mkdir -p /var/run/parking-app
sudo chown www-data:www-data /var/run/parking-app

# Set correct permissions
sudo chown -R www-data:www-data $PROJECT_DIR
sudo chmod -R 755 $PROJECT_DIR

# Enable and start services
print_status "Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable parking-app.socket
sudo systemctl start parking-app.socket
sudo systemctl enable parking-app.service
sudo systemctl start parking-app.service

# Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Setup SSL with Let's Encrypt
print_status "Setting up SSL certificates..."
print_warning "Make sure your domain points to this server before continuing!"
print_warning "Press Enter when ready to setup SSL certificates..."
read

# Replace yourdomain.com with actual domain
DOMAIN="yourdomain.com"
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN

# Setup automatic certificate renewal
sudo systemctl enable certbot.timer

# Setup Redis
print_status "Configuring Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Final checks
print_status "Running final checks..."

# Check services status
echo "Service Status:"
sudo systemctl status parking-app.service --no-pager -l
sudo systemctl status nginx --no-pager -l

# Check if ports are listening
echo "Port Status:"
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :8000

print_status "Deployment completed!"
print_status "Your application should be available at: https://$DOMAIN"
print_warning "Don't forget to:"
print_warning "1. Update your .env file with actual production values"
print_warning "2. Change the default admin password"
print_warning "3. Configure your domain DNS to point to this server"
print_warning "4. Test all functionality thoroughly"