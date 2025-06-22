"""
Celery tasks for booking automation.
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Booking, BookingStatus
import logging

logger = logging.getLogger(__name__)


@shared_task
def auto_checkout_bookings():
    """
    Automatically check out bookings that have been active for more than 1 hour.
    This task should be run every 15 minutes via celery beat.
    """
    now = timezone.now()
    one_hour_ago = now - timedelta(hours=1)
    
    # Find active bookings where check-in was more than 1 hour ago
    bookings_to_checkout = Booking.objects.filter(
        status=BookingStatus.ACTIVE,
        actual_start_time__isnull=False,
        actual_start_time__lte=one_hour_ago,
        actual_end_time__isnull=True,  # Not already checked out
    )
    
    checkout_count = 0
    
    for booking in bookings_to_checkout:
        try:
            # Set checkout time to exactly 1 hour after check-in
            checkout_time = booking.actual_start_time + timedelta(hours=1)
            booking.actual_end_time = checkout_time
            booking.auto_checkout = True
            booking.status = BookingStatus.COMPLETED
            booking.save()
            
            checkout_count += 1
            logger.info(f'Auto-checked out booking {booking.booking_id} at {checkout_time}')
            
        except Exception as e:
            logger.error(f'Failed to auto-checkout booking {booking.booking_id}: {str(e)}')
    
    logger.info(f'Auto-checkout task completed. Checked out {checkout_count} bookings.')
    return checkout_count


@shared_task  
def check_expired_bookings():
    """
    Mark bookings as no-show if they haven't been checked in 30 minutes after start time.
    This is a separate task from auto-checkout.
    """
    now = timezone.now()
    thirty_minutes_ago = now - timedelta(minutes=30)
    
    # Find confirmed bookings that should have started but weren't checked in
    expired_bookings = Booking.objects.filter(
        status=BookingStatus.CONFIRMED,
        start_time__lte=thirty_minutes_ago,
        actual_start_time__isnull=True,  # Never checked in
    )
    
    no_show_count = 0
    
    for booking in expired_bookings:
        try:
            booking.status = BookingStatus.NO_SHOW
            booking.save()
            
            no_show_count += 1
            logger.info(f'Marked booking {booking.booking_id} as no-show')
            
        except Exception as e:
            logger.error(f'Failed to mark booking {booking.booking_id} as no-show: {str(e)}')
    
    logger.info(f'No-show check completed. Marked {no_show_count} bookings as no-show.')
    return no_show_count