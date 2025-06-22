from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from .models import Booking, BookingStatus
from apps.notifications.services import NotificationService
import logging

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Booking)
def update_booking_timestamps(sender, instance, **kwargs):
    """Update booking timestamps when status changes"""
    if instance.pk:
        try:
            old_instance = Booking.objects.get(pk=instance.pk)
            
            # Set confirmed_at when status changes to confirmed
            if (old_instance.status != BookingStatus.CONFIRMED and 
                instance.status == BookingStatus.CONFIRMED and 
                not instance.confirmed_at):
                instance.confirmed_at = timezone.now()
                
        except Booking.DoesNotExist:
            pass


@receiver(post_save, sender=Booking)
def handle_booking_creation(sender, instance, created, **kwargs):
    """Handle actions after booking is created"""
    if created:
        # Format booking date/time for notifications
        booking_date_time = f"{instance.start_time.strftime('%B %d, %Y')} at {instance.start_time.strftime('%-I:%M %p')}"
        
        # 🚨 Critical Success Notification: Send notification to host about new booking
        if instance.parking_space.is_instant_book:
            # Instant booking notification for host
            NotificationService.send_notification(
                user=instance.parking_space.host,
                template_type='INSTANT_BOOKING',
                context={
                    'booking_date_time': booking_date_time,
                    'parking_space_title': instance.parking_space.title,
                    'renter_name': instance.user.get_full_name() or instance.user.username,
                    'action_url': f'/bookings/{instance.booking_id}',
                },
                channels=['IN_APP', 'EMAIL']
            )
        else:
            # New booking notification for host
            NotificationService.send_notification(
                user=instance.parking_space.host,
                template_type='NEW_BOOKING_REQUEST',
                context={
                    'booking_date_time': booking_date_time,
                    'parking_space_title': instance.parking_space.title,
                    'renter_name': instance.user.get_full_name() or instance.user.username,
                    'action_url': f'/bookings/{instance.booking_id}',
                },
                channels=['IN_APP', 'EMAIL']
            )
        
        # 🚨 Critical Success Notification: Send confirmation to renter
        NotificationService.send_notification(
            user=instance.user,
            template_type='BOOKING_CONFIRMED',
            context={
                'parking_space_title': instance.parking_space.title,
                'booking_date_time': booking_date_time,
                'host_name': instance.parking_space.host.get_full_name() or instance.parking_space.host.username,
                'action_url': f'/booking/{instance.booking_id}',
            },
            channels=['IN_APP', 'EMAIL']
        )


@receiver(post_save, sender=Booking)
def handle_booking_status_change(sender, instance, **kwargs):
    """Handle actions when booking status changes"""
    if not kwargs.get('created'):
        # Check if booking was just confirmed
        if instance.status == BookingStatus.CONFIRMED:
            # Schedule check-in reminder
            schedule_checkin_reminder(instance)
            # Schedule expiration warning
            schedule_expiration_warning(instance)
        
        # Check if booking just became active (user checked in)
        elif instance.status == BookingStatus.ACTIVE:
            # Schedule expiration warning (in case it wasn't scheduled before)
            schedule_expiration_warning(instance)


def schedule_checkin_reminder(booking):
    """
    Schedule a check-in reminder for a confirmed booking.
    Uses Celery if available, otherwise relies on periodic task.
    """
    try:
        # Only schedule if booking starts more than 15 minutes from now
        now = timezone.now()
        time_until_start = booking.start_time - now
        
        if time_until_start <= timedelta(minutes=15):
            logger.info(f"Booking {booking.booking_id} starts too soon to schedule reminder")
            return
        
        # Calculate when to send the reminder (15 minutes before start)
        reminder_time = booking.start_time - timedelta(minutes=15)
        
        # Try to use Celery for precise scheduling
        try:
            from .tasks import send_scheduled_checkin_reminder
            
            # Schedule the task to run at the exact reminder time
            send_scheduled_checkin_reminder.apply_async(
                args=[booking.id],
                eta=reminder_time
            )
            
            logger.info(f"Scheduled check-in reminder for booking {booking.booking_id} at {reminder_time}")
            
        except ImportError:
            # Celery not available, will rely on periodic task
            logger.info(f"Celery not available, check-in reminder for booking {booking.booking_id} will be handled by periodic task")
            
        except Exception as e:
            logger.error(f"Error scheduling check-in reminder for booking {booking.booking_id}: {str(e)}")
            # Fall back to periodic task processing
            
    except Exception as e:
        logger.error(f"Error in schedule_checkin_reminder: {str(e)}")


def schedule_expiration_warning(booking):
    """
    Schedule an expiration warning for an active booking.
    Uses Celery if available, otherwise relies on periodic task.
    """
    try:
        # Only schedule if booking ends more than 30 minutes from now
        now = timezone.now()
        time_until_end = booking.end_time - now
        
        if time_until_end <= timedelta(minutes=30):
            logger.info(f"Booking {booking.booking_id} ends too soon to schedule expiration warning")
            return
        
        # Calculate when to send the warning (30 minutes before end)
        warning_time = booking.end_time - timedelta(minutes=30)
        
        # Try to use Celery for precise scheduling
        try:
            from .tasks import send_scheduled_expiration_warning
            
            # Schedule the task to run at the exact warning time
            send_scheduled_expiration_warning.apply_async(
                args=[booking.id],
                eta=warning_time
            )
            
            logger.info(f"Scheduled expiration warning for booking {booking.booking_id} at {warning_time}")
            
        except ImportError:
            # Celery not available, will rely on periodic task
            logger.info(f"Celery not available, expiration warning for booking {booking.booking_id} will be handled by periodic task")
            
        except Exception as e:
            logger.error(f"Error scheduling expiration warning for booking {booking.booking_id}: {str(e)}")
            # Fall back to periodic task processing
            
    except Exception as e:
        logger.error(f"Error in schedule_expiration_warning: {str(e)}")