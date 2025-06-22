#!/bin/bash

# SSL Certificate setup script using Let's Encrypt
# Run this after your domain is pointed to the server

set -e

# Configuration
DOMAIN="yourdomain.com"  # Replace with your actual domain
EMAIL="admin@yourdomain.com"  # Replace with your actual email

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

# Check if domain is provided
if [[ "$DOMAIN" == "yourdomain.com" ]]; then
    print_error "Please edit this script and replace 'yourdomain.com' with your actual domain"
    exit 1
fi

# Check if domain points to this server
print_status "Checking if domain points to this server..."
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN)

if [[ "$DOMAIN_IP" != "$SERVER_IP" ]]; then
    print_warning "Domain $DOMAIN points to $DOMAIN_IP but server IP is $SERVER_IP"
    print_warning "Make sure your DNS is configured correctly before continuing"
    print_warning "Press Enter to continue anyway, or Ctrl+C to exit"
    read
fi

# Install Certbot if not already installed
if ! command -v certbot &> /dev/null; then
    print_status "Installing Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Stop nginx temporarily
print_status "Stopping Nginx temporarily..."
sudo systemctl stop nginx

# Request SSL certificate
print_status "Requesting SSL certificate for $DOMAIN..."
sudo certbot certonly \
    --standalone \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --domains $DOMAIN,www.$DOMAIN

# Check if certificate was created
if [[ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
    print_error "SSL certificate was not created successfully"
    exit 1
fi

print_status "SSL certificate created successfully!"

# Update Nginx configuration with correct domain
print_status "Updating Nginx configuration..."
sudo sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/parking-app

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Start Nginx
print_status "Starting Nginx..."
sudo systemctl start nginx

# Setup automatic renewal
print_status "Setting up automatic certificate renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal process
print_status "Testing certificate renewal..."
sudo certbot renew --dry-run

# Create renewal hook to reload nginx
sudo tee /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh > /dev/null << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF

sudo chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh

print_status "SSL setup completed successfully!"
print_status "Your site should now be available at: https://$DOMAIN"
print_status "Certificate will automatically renew every 60 days"

# Show certificate info
print_status "Certificate information:"
sudo certbot certificates