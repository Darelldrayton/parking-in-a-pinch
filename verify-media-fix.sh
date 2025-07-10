#!/bin/bash

# Verify Media Files Fix
# This script verifies that the media files fix is working correctly

echo "🔍 Verifying Media Files Fix"
echo "=============================="

# Test URLs
DOMAIN_URL="https://www.parkinginapinch.com"
IP_URL="http://165.227.111.160"

# Sample profile image URLs from the console logs
SAMPLE_IMAGES=(
    "media/profiles/profile_15_4d232ccc.jpg"
    "media/profiles/profile_15_993c3f97.jpg"
)

echo "📡 Testing media file serving..."
echo ""

for image in "${SAMPLE_IMAGES[@]}"; do
    echo "Testing: $image"
    echo "----------------------------------------"
    
    # Test with domain HTTPS
    echo "🌐 Testing HTTPS domain:"
    DOMAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DOMAIN_URL/$image" || echo "FAILED")
    DOMAIN_CONTENT_TYPE=$(curl -s -I "$DOMAIN_URL/$image" | grep -i "content-type" | cut -d: -f2 | tr -d ' \r\n' || echo "FAILED")
    
    echo "   Status: $DOMAIN_STATUS"
    echo "   Content-Type: $DOMAIN_CONTENT_TYPE"
    
    if [[ "$DOMAIN_STATUS" == "200" && "$DOMAIN_CONTENT_TYPE" == *"image"* ]]; then
        echo "   ✅ HTTPS Domain: WORKING"
    elif [[ "$DOMAIN_STATUS" == "200" && "$DOMAIN_CONTENT_TYPE" == *"text/html"* ]]; then
        echo "   ❌ HTTPS Domain: Returning HTML instead of image"
    else
        echo "   ⚠️  HTTPS Domain: Status $DOMAIN_STATUS"
    fi
    
    echo ""
    
    # Test with IP HTTP
    echo "🖥️  Testing HTTP IP:"
    IP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$IP_URL/$image" || echo "FAILED")
    IP_CONTENT_TYPE=$(curl -s -I "$IP_URL/$image" | grep -i "content-type" | cut -d: -f2 | tr -d ' \r\n' || echo "FAILED")
    
    echo "   Status: $IP_STATUS"
    echo "   Content-Type: $IP_CONTENT_TYPE"
    
    if [[ "$IP_STATUS" == "200" && "$IP_CONTENT_TYPE" == *"image"* ]]; then
        echo "   ✅ HTTP IP: WORKING"
    elif [[ "$IP_STATUS" == "200" && "$IP_CONTENT_TYPE" == *"text/html"* ]]; then
        echo "   ❌ HTTP IP: Returning HTML instead of image"
    else
        echo "   ⚠️  HTTP IP: Status $IP_STATUS"
    fi
    
    echo ""
    echo "========================================"
    echo ""
done

# Check nginx configuration
echo "🔧 Checking nginx configuration..."
if command -v nginx >/dev/null 2>&1; then
    if nginx -t 2>/dev/null; then
        echo "✅ Nginx configuration is valid"
    else
        echo "❌ Nginx configuration has errors"
        nginx -t
    fi
else
    echo "ℹ️  Nginx not available (may be running on different server)"
fi

echo ""

# Check media directory (if accessible)
MEDIA_DIR="/var/www/parkinginapinch/backend/media"
if [ -d "$MEDIA_DIR" ]; then
    echo "📁 Checking media directory..."
    echo "   Directory: $MEDIA_DIR"
    echo "   Permissions: $(stat -c '%A' "$MEDIA_DIR" 2>/dev/null || echo "Unable to check")"
    echo "   Owner: $(stat -c '%U:%G' "$MEDIA_DIR" 2>/dev/null || echo "Unable to check")"
    
    PROFILE_COUNT=$(find "$MEDIA_DIR/profiles" -name "*.jpg" -o -name "*.png" -o -name "*.gif" 2>/dev/null | wc -l)
    echo "   Profile images found: $PROFILE_COUNT"
    
    if [ "$PROFILE_COUNT" -gt 0 ]; then
        echo "   Sample files:"
        find "$MEDIA_DIR/profiles" -name "*.jpg" -o -name "*.png" -o -name "*.gif" 2>/dev/null | head -3 | while read file; do
            echo "     - $(basename "$file")"
        done
    fi
else
    echo "ℹ️  Media directory not accessible from this location"
fi

echo ""
echo "🏁 Verification Complete"
echo "========================"
echo ""
echo "📋 Summary:"
echo "  - If images return 'image/jpeg' content-type: ✅ WORKING"
echo "  - If images return 'text/html' content-type: ❌ NEEDS FIX"
echo "  - If images return 404: ⚠️  File doesn't exist (normal for new uploads)"
echo ""
echo "🔧 If media files are still returning HTML:"
echo "  1. Run: sudo bash deploy-media-fix.sh"
echo "  2. Check nginx error logs: sudo tail -f /var/log/nginx/error.log"
echo "  3. Verify media directory permissions"
echo "  4. Check MEDIA_FILES_FIX.md for detailed troubleshooting"
echo ""