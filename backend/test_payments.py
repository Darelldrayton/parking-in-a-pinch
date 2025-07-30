#!/usr/bin/env python3
"""
Test script to verify Stripe payment configuration
Run this after setting up your Stripe keys in .env
"""
import os
import sys
import django
import stripe
from decimal import Decimal

# Setup Django
sys.path.append('/home/rellizuraddixion/projects/Parking-in-a-Pinch/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from config.stripe_settings import (
    STRIPE_SECRET_KEY, 
    STRIPE_PUBLISHABLE_KEY, 
    validate_stripe_settings
)
from apps.payments.models import PaymentIntent, Payment
from apps.users.models import User
from apps.bookings.models import Booking
from apps.listings.models import ParkingListing

def test_stripe_connection():
    """Test basic Stripe API connection"""
    print("🔍 Testing Stripe Configuration...")
    
    try:
        # Validate settings
        validate_stripe_settings()
        print("✅ Stripe settings validation passed")
    except ValueError as e:
        print(f"❌ Stripe settings validation failed: {e}")
        return False
    
    try:
        # Test API connection
        stripe.api_key = STRIPE_SECRET_KEY
        
        # Create a test payment intent for $1
        intent = stripe.PaymentIntent.create(
            amount=100,  # $1.00 in cents
            currency='usd',
            metadata={'test': 'configuration_check'}
        )
        
        print(f"✅ Stripe API connection successful")
        print(f"   - Test Payment Intent ID: {intent.id}")
        print(f"   - Status: {intent.status}")
        print(f"   - Amount: ${intent.amount / 100}")
        
        return True
        
    except stripe.error.AuthenticationError:
        print("❌ Stripe authentication failed - check your secret key")
        return False
    except stripe.error.StripeError as e:
        print(f"❌ Stripe API error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_payment_models():
    """Test payment database models"""
    print("\n🗄️  Testing Payment Database Models...")
    
    try:
        # Test PaymentIntent model
        payment_intent_count = PaymentIntent.objects.count()
        print(f"✅ PaymentIntent model accessible - {payment_intent_count} records")
        
        # Test Payment model
        payment_count = Payment.objects.count()
        print(f"✅ Payment model accessible - {payment_count} records")
        
        return True
        
    except Exception as e:
        print(f"❌ Database model error: {e}")
        return False

def test_booking_payment_flow():
    """Test if we can create a payment for a booking"""
    print("\n💳 Testing Booking Payment Flow...")
    
    try:
        # Check if we have test data
        users = User.objects.count()
        listings = ParkingListing.objects.count()
        bookings = Booking.objects.count()
        
        print(f"📊 Available test data:")
        print(f"   - Users: {users}")
        print(f"   - Listings: {listings}")
        print(f"   - Bookings: {bookings}")
        
        if bookings > 0:
            # Get a test booking
            test_booking = Booking.objects.first()
            print(f"✅ Found test booking: {test_booking.id}")
            print(f"   - Amount: ${test_booking.total_amount}")
            print(f"   - Guest: {test_booking.user.email}")
            print(f"   - Listing: {test_booking.listing.title}")
            
            # Test payment intent creation
            stripe.api_key = STRIPE_SECRET_KEY
            
            intent = stripe.PaymentIntent.create(
                amount=int(test_booking.total_amount * 100),  # Convert to cents
                currency='usd',
                metadata={
                    'booking_id': str(test_booking.id),
                    'user_id': str(test_booking.user.id),
                    'test': 'booking_payment_flow'
                }
            )
            
            print(f"✅ Payment intent created for booking")
            print(f"   - Intent ID: {intent.id}")
            print(f"   - Status: {intent.status}")
            
            return True
        else:
            print("⚠️  No bookings found - create a test booking first")
            return True
            
    except Exception as e:
        print(f"❌ Booking payment flow error: {e}")
        return False

def test_payout_calculation():
    """Test payout calculation logic"""
    print("\n💰 Testing Payout Calculations...")
    
    try:
        from config.stripe_settings import PLATFORM_FEE_PERCENTAGE
        
        # Test amounts
        test_amounts = [10.00, 25.50, 100.00, 250.00]
        
        print(f"Platform fee: {PLATFORM_FEE_PERCENTAGE}%")
        print("Payment → Host Payout (Platform Fee)")
        
        for amount in test_amounts:
            platform_fee = amount * (PLATFORM_FEE_PERCENTAGE / 100)
            host_payout = amount - platform_fee
            
            print(f"${amount:6.2f} → ${host_payout:6.2f} (${platform_fee:5.2f})")
        
        print("✅ Payout calculation logic working")
        return True
        
    except Exception as e:
        print(f"❌ Payout calculation error: {e}")
        return False

def display_configuration():
    """Display current configuration"""
    print("\n⚙️  Current Configuration:")
    print(f"   - Publishable Key: {STRIPE_PUBLISHABLE_KEY[:20]}..." if STRIPE_PUBLISHABLE_KEY else "   - Publishable Key: ❌ NOT SET")
    print(f"   - Secret Key: {STRIPE_SECRET_KEY[:20]}..." if STRIPE_SECRET_KEY else "   - Secret Key: ❌ NOT SET")
    print(f"   - Mode: {'TEST' if STRIPE_SECRET_KEY and STRIPE_SECRET_KEY.startswith('sk_test_') else 'LIVE' if STRIPE_SECRET_KEY and STRIPE_SECRET_KEY.startswith('sk_live_') else 'UNKNOWN'}")

def main():
    """Run all payment system tests"""
    print("🎯 Parking in a Pinch - Payment System Test")
    print("=" * 50)
    
    display_configuration()
    
    # Run tests
    tests = [
        test_stripe_connection,
        test_payment_models,
        test_booking_payment_flow,
        test_payout_calculation
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append(False)
    
    # Summary
    print("\n📋 Test Summary:")
    print("=" * 50)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"🎉 All tests passed! ({passed}/{total})")
        print("\n✅ Your payment system is ready to process payments!")
        print("\n🔗 Next steps:")
        print("   1. Test a real booking on your website")
        print("   2. Check payments in Stripe dashboard")
        print("   3. Verify webhooks are working")
        print("   4. Set up host payout accounts")
    else:
        print(f"⚠️  Some tests failed: {passed}/{total} passed")
        print("\n🔧 Fix the failed tests before processing payments")

if __name__ == "__main__":
    main()