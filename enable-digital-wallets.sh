#!/bin/bash

# ===============================================
# DIGITAL WALLETS ACTIVATION SCRIPT
# ===============================================
# This script makes it easy to enable Apple Pay and Google Pay
# All the code is ready - just provide the credentials!

echo "🍎📱 Digital Wallets Activation Script"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/.env" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   (where frontend/.env exists)"
    exit 1
fi

echo "📋 Current Status:"
echo "=================="

# Check current status
APPLE_ENABLED=$(grep "VITE_APPLE_PAY_ENABLED" frontend/.env | cut -d'=' -f2)
GOOGLE_ENABLED=$(grep "VITE_GOOGLE_PAY_ENABLED" frontend/.env | cut -d'=' -f2)
APPLE_MERCHANT=$(grep "VITE_APPLE_PAY_MERCHANT_ID" frontend/.env | cut -d'=' -f2)
GOOGLE_MERCHANT=$(grep "VITE_GOOGLE_PAY_MERCHANT_ID" frontend/.env | cut -d'=' -f2)

echo "Apple Pay: $([ "$APPLE_ENABLED" = "true" ] && [ -n "$APPLE_MERCHANT" ] && echo "✅ ENABLED" || echo "⏳ Coming Soon")"
echo "Google Pay: $([ "$GOOGLE_ENABLED" = "true" ] && [ -n "$GOOGLE_MERCHANT" ] && echo "✅ ENABLED" || echo "⏳ Coming Soon")"
echo ""

echo "🔧 What would you like to do?"
echo "=============================="
echo "1) Enable Apple Pay (need Apple Merchant ID)"
echo "2) Enable Google Pay (need Google Merchant ID)" 
echo "3) Enable Both (need both Merchant IDs)"
echo "4) Show setup instructions"
echo "5) Exit"
echo ""

read -p "Choose option (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🍎 Enabling Apple Pay"
        echo "===================="
        
        read -p "Enter your Apple Merchant ID (e.g., merchant.com.yourcompany.app): " apple_merchant_id
        
        if [ -n "$apple_merchant_id" ]; then
            # Update .env file
            sed -i.bak "s/VITE_APPLE_PAY_ENABLED=.*/VITE_APPLE_PAY_ENABLED=true/" frontend/.env
            sed -i.bak "s/VITE_APPLE_PAY_MERCHANT_ID=.*/VITE_APPLE_PAY_MERCHANT_ID=$apple_merchant_id/" frontend/.env
            
            echo "✅ Apple Pay enabled!"
            echo "📝 Updated frontend/.env"
            echo "🚀 Ready to deploy!"
        else
            echo "❌ No merchant ID provided. Cancelled."
        fi
        ;;
        
    2)
        echo ""
        echo "📱 Enabling Google Pay"
        echo "====================="
        
        read -p "Enter your Google Pay Merchant ID: " google_merchant_id
        
        if [ -n "$google_merchant_id" ]; then
            # Update .env file
            sed -i.bak "s/VITE_GOOGLE_PAY_ENABLED=.*/VITE_GOOGLE_PAY_ENABLED=true/" frontend/.env
            sed -i.bak "s/VITE_GOOGLE_PAY_MERCHANT_ID=.*/VITE_GOOGLE_PAY_MERCHANT_ID=$google_merchant_id/" frontend/.env
            
            echo "✅ Google Pay enabled!"
            echo "📝 Updated frontend/.env"
            echo "🚀 Ready to deploy!"
        else
            echo "❌ No merchant ID provided. Cancelled."
        fi
        ;;
        
    3)
        echo ""
        echo "🍎📱 Enabling Both Apple Pay and Google Pay"
        echo "=========================================="
        
        read -p "Enter your Apple Merchant ID: " apple_merchant_id
        read -p "Enter your Google Pay Merchant ID: " google_merchant_id
        
        if [ -n "$apple_merchant_id" ] && [ -n "$google_merchant_id" ]; then
            # Update .env file
            sed -i.bak "s/VITE_APPLE_PAY_ENABLED=.*/VITE_APPLE_PAY_ENABLED=true/" frontend/.env
            sed -i.bak "s/VITE_APPLE_PAY_MERCHANT_ID=.*/VITE_APPLE_PAY_MERCHANT_ID=$apple_merchant_id/" frontend/.env
            sed -i.bak "s/VITE_GOOGLE_PAY_ENABLED=.*/VITE_GOOGLE_PAY_ENABLED=true/" frontend/.env
            sed -i.bak "s/VITE_GOOGLE_PAY_MERCHANT_ID=.*/VITE_GOOGLE_PAY_MERCHANT_ID=$google_merchant_id/" frontend/.env
            
            echo "✅ Both Apple Pay and Google Pay enabled!"
            echo "📝 Updated frontend/.env"
            echo "🚀 Ready to deploy!"
        else
            echo "❌ Missing merchant IDs. Cancelled."
        fi
        ;;
        
    4)
        echo ""
        echo "📚 Setup Instructions"
        echo "===================="
        echo ""
        echo "🍎 APPLE PAY SETUP:"
        echo "1. Get Apple Developer Account (\$99/year)"
        echo "2. Go to developer.apple.com → Account → Certificates, IDs & Profiles"
        echo "3. Create new Merchant ID (e.g., merchant.com.parkinginapinch.app)"
        echo "4. Enable Apple Pay capability"
        echo "5. Set up domain verification for parkinginapinch.com"
        echo "6. Run this script again with your merchant ID"
        echo ""
        echo "📱 GOOGLE PAY SETUP:"
        echo "1. Go to pay.google.com/business/console"
        echo "2. Create merchant account"
        echo "3. Verify business information"
        echo "4. Get your merchant ID"
        echo "5. Run this script again with your merchant ID"
        echo ""
        echo "📖 Full guide: see APPLE_GOOGLE_PAY_PRODUCTION_SETUP.md"
        ;;
        
    5)
        echo "👋 Bye!"
        exit 0
        ;;
        
    *)
        echo "❌ Invalid option. Please choose 1-5."
        ;;
esac

echo ""
echo "🔄 Next Steps:"
echo "=============="
echo "1. Build: npm run build"
echo "2. Deploy to production"  
echo "3. Test on real iOS/Android devices"
echo "4. Visit /payment-test to verify setup"
echo ""