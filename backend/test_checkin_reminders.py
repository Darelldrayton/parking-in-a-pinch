#!/usr/bin/env python
"""
Test script for check-in reminder system.
Run this to verify the check-in reminder notifications are working.
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.bookings.models import Booking, BookingStatus
from apps.listings.models import ParkingListing
from apps.bookings.tasks import send_checkin_reminder, process_checkin_reminders
from apps.notifications.services import NotificationService

User = get_user_model()


def create_test_data():
    """Create test data for checking reminders"""
    print("Creating test data...")
    
    # Create test user
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'is_email_verified': True
        }
    )
    if created:
        user.set_password('testpass123')
        user.save()
    
    # Create test host
    host, created = User.objects.get_or_create(
        email='host@example.com',
        defaults={
            'first_name': 'Host',
            'last_name': 'User',
            'is_email_verified': True
        }
    )
    if created:
        host.set_password('hostpass123')
        host.save()
    
    # Create test parking listing
    listing, created = ParkingListing.objects.get_or_create(
        title='Test Parking Space',
        defaults={
            'host': host,
            'description': 'Test parking space for check-in reminders',
            'address': '123 Test Street, Test City, NY 10001',
            'latitude': 40.7128,
            'longitude': -74.0060,
            'hourly_rate': 10.00,
            'space_type': 'driveway',
            'is_active': True,
            'is_instant_book': True
        }
    )
    
    return user, host, listing


def create_test_booking(user, listing, start_offset_minutes=16):
    """Create a test booking that starts in specified minutes"""
    start_time = timezone.now() + timedelta(minutes=start_offset_minutes)
    end_time = start_time + timedelta(hours=2)
    
    booking = Booking.objects.create(
        user=user,
        parking_space=listing,
        start_time=start_time,
        end_time=end_time,
        hourly_rate=listing.hourly_rate,
        status=BookingStatus.CONFIRMED,
        vehicle_license_plate='TEST123',
        vehicle_state='NY',
        confirmed_at=timezone.now()
    )
    
    print(f"Created test booking {booking.booking_id}")
    print(f"  - Start time: {booking.start_time}")
    print(f"  - Status: {booking.status}")
    print(f"  - User: {booking.user.email}")
    
    return booking


def test_direct_reminder(booking):
    """Test sending reminder directly"""
    print(f"\n=== Testing Direct Reminder for {booking.booking_id} ===")
    
    try:
        result = send_checkin_reminder(booking.id)
        print(f"✅ Direct reminder result: {result}")
        return True
    except Exception as e:
        print(f"❌ Direct reminder failed: {str(e)}")
        return False


def test_process_reminders():
    """Test the periodic reminder processing"""
    print(f"\n=== Testing Periodic Reminder Processing ===")
    
    try:
        result = process_checkin_reminders()
        print(f"✅ Periodic processing result: {result}")
        return True
    except Exception as e:
        print(f"❌ Periodic processing failed: {str(e)}")
        return False


def test_notification_service():
    """Test the notification service directly"""
    print(f"\n=== Testing Notification Service ===")
    
    try:
        user = User.objects.get(email='test@example.com')
        
        context = {
            'user_name': 'Test User',
            'parking_space_title': 'Test Parking Space',
            'booking_date_time': 'December 21 at 2:00 PM',
            'start_time': '2:00 PM',
            'address': '123 Test Street',
            'booking_id': 'TEST123',
            'minutes_until': 15,
            'action_url': '/bookings/TEST123'
        }
        
        notifications = NotificationService.send_notification(
            user=user,
            template_type='CHECKIN_REMINDER',
            context=context,
            channels=['IN_APP']
        )
        
        print(f"✅ Notification service result: {len(notifications)} notifications sent")
        for notification in notifications:
            print(f"  - Channel: {notification.channel}")
            print(f"  - Subject: {notification.subject}")
            print(f"  - Content: {notification.content[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Notification service failed: {str(e)}")
        return False


def main():
    """Run all tests"""
    print("🚀 Starting Check-in Reminder System Tests")
    print("=" * 50)
    
    # Create test data
    user, host, listing = create_test_data()
    
    # Test 1: Test notification service directly
    success1 = test_notification_service()
    
    # Test 2: Create booking and test direct reminder
    booking = create_test_booking(user, listing, 16)  # 16 minutes from now
    success2 = test_direct_reminder(booking)
    
    # Test 3: Create booking in reminder window and test periodic processing
    booking_soon = create_test_booking(user, listing, 15)  # 15 minutes from now
    success3 = test_process_reminders()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"✅ Notification Service: {'PASS' if success1 else 'FAIL'}")
    print(f"✅ Direct Reminder: {'PASS' if success2 else 'FAIL'}")
    print(f"✅ Periodic Processing: {'PASS' if success3 else 'FAIL'}")
    
    if all([success1, success2, success3]):
        print("\n🎉 ALL TESTS PASSED! Check-in reminder system is working.")
    else:
        print("\n❌ Some tests failed. Check the output above for details.")
    
    print("\n📋 Next Steps:")
    print("1. Start Redis: redis-server")
    print("2. Start Celery Worker: celery -A config worker --loglevel=info")
    print("3. Start Celery Beat: celery -A config beat --loglevel=info")
    print("4. Or run management command: python manage.py send_checkin_reminders --dry-run")


if __name__ == '__main__':
    main()