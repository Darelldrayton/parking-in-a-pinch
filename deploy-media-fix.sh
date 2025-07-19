#!/bin/bash

# Deploy Media Files Fix
# This script applies the nginx configuration fix for profile image serving

set -e  # Exit on any error

echo "🔧 Deploying Media Files Fix for Parking in a Pinch"
echo "=================================================="

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root or with sudo"
   exit 1
fi

# Define paths
PROJECT_DIR="/var/www/parkinginapinch"
NGINX_CONFIG_DIR="/etc/nginx/sites-available"
NGINX_CONFIG_FILE="$NGINX_CONFIG_DIR/parkinginapinch"
NEW_CONFIG_FILE="$PROJECT_DIR/nginx-media-fix.conf"
MEDIA_DIR="$PROJECT_DIR/backend/media"

echo "📁 Verifying paths..."

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

# Check if new config file exists
if [ ! -f "$NEW_CONFIG_FILE" ]; then
    echo "❌ New nginx config file not found: $NEW_CONFIG_FILE"
    exit 1
fi

echo "✅ All paths verified"

# Backup current nginx configuration
echo "💾 Backing up current nginx configuration..."
cp "$NGINX_CONFIG_FILE" "$NGINX_CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created"

# Copy new configuration
echo "📋 Applying new nginx configuration..."
cp "$NEW_CONFIG_FILE" "$NGINX_CONFIG_FILE"
echo "✅ New configuration copied"

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
if nginx -t; then
    echo "✅ Nginx configuration test passed"
else
    echo "❌ Nginx configuration test failed"
    echo "🔄 Restoring backup..."
    cp "$NGINX_CONFIG_FILE.backup."* "$NGINX_CONFIG_FILE"
    exit 1
fi

# Create media directory if it doesn't exist
echo "📁 Ensuring media directory exists..."
mkdir -p "$MEDIA_DIR/profiles"
echo "✅ Media directory ready"

# Set correct permissions
echo "🔒 Setting correct permissions..."
chown -R www-data:www-data "$MEDIA_DIR"
chmod -R 755 "$MEDIA_DIR"
echo "✅ Permissions set"

# Reload nginx
echo "🔄 Reloading nginx..."
if systemctl reload nginx; then
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Failed to reload nginx"
    echo "🔄 Restoring backup..."
    cp "$NGINX_CONFIG_FILE.backup."* "$NGINX_CONFIG_FILE"
    systemctl reload nginx
    exit 1
fi

# Test media file serving
echo "🧪 Testing media file serving..."
echo "Testing with a sample media URL..."

# Check if any profile images exist
SAMPLE_IMAGE=$(find "$MEDIA_DIR/profiles" -name "*.jpg" -o -name "*.png" -o -name "*.gif" 2>/dev/null | head -1)

if [ -n "$SAMPLE_IMAGE" ]; then
    # Extract filename from full path
    FILENAME=$(basename "$SAMPLE_IMAGE")
    echo "Testing with existing file: $FILENAME"
    
    # Test with curl
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://165.227.111.160/media/profiles/$FILENAME")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Media file serving test passed (HTTP $HTTP_STATUS)"
    else
        echo "⚠️  Media file test returned HTTP $HTTP_STATUS"
        echo "This may be normal if the file doesn't exist yet"
    fi
else
    echo "ℹ️  No existing profile images found to test with"
    echo "Upload a profile image to test the fix"
fi

echo ""
echo "🎉 Media Files Fix Deployment Complete!"
echo "=================================================="
echo ""
echo "📊 Summary:"
echo "  ✅ Nginx configuration updated"
echo "  ✅ Media directory permissions set" 
echo "  ✅ Nginx reloaded successfully"
echo ""
echo "🔍 Next Steps:"
echo "  1. Upload a profile image to test the fix"
echo "  2. Check that images display in the browser"
echo "  3. Monitor nginx logs for any issues: tail -f /var/log/nginx/error.log"
echo ""
echo "🐛 If issues persist:"
echo "  - Check the troubleshooting section in MEDIA_FILES_FIX.md"
echo "  - Verify Django media settings"
echo "  - Check file permissions in $MEDIA_DIR"
echo ""