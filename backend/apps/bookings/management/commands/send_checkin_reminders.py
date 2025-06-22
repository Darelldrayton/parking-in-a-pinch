"""
Management command to send check-in reminder notifications.
This can be run manually or via cron as a backup to Celery.
"""
import logging
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.bookings.models import Booking, BookingStatus
from apps.notifications.services import NotificationService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Send check-in reminder notifications for bookings starting soon'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--minutes-ahead',
            type=int,
            default=15,
            help='Send reminders for bookings starting in this many minutes (default: 15)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be sent without actually sending notifications'
        )
        parser.add_argument(
            '--force-booking-id',
            type=str,
            help='Force send reminder for specific booking ID (for testing)'
        )
        parser.add_argument(
            '--channels',
            nargs='+',
            default=['IN_APP', 'PUSH'],
            help='Notification channels to use (default: IN_APP PUSH)'
        )
        parser.add_argument(
            '--tolerance-minutes',
            type=int,
            default=2,
            help='Tolerance window in minutes for finding bookings (default: 2)'
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        minutes_ahead = options['minutes_ahead']
        force_booking_id = options['force_booking_id']
        channels = options['channels']
        tolerance = options['tolerance_minutes']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No notifications will be sent'))
        
        now = timezone.now()
        
        if force_booking_id:
            # Force send for specific booking (testing)
            self.send_forced_reminder(force_booking_id, channels, dry_run)
            return
        
        # Calculate time window for bookings
        target_start_time = now + timedelta(minutes=minutes_ahead)
        window_start = target_start_time - timedelta(minutes=tolerance)
        window_end = target_start_time + timedelta(minutes=tolerance)
        
        self.stdout.write(f'Looking for bookings starting between {window_start} and {window_end}')
        
        # Find bookings that need reminders
        bookings_needing_reminders = Booking.objects.filter(
            status=BookingStatus.CONFIRMED,
            start_time__gte=window_start,
            start_time__lte=window_end,
        ).select_related('user', 'parking_space')
        
        if not bookings_needing_reminders:
            self.stdout.write(self.style.SUCCESS('No bookings found that need reminders'))
            return
        
        self.stdout.write(f'Found {bookings_needing_reminders.count()} bookings that may need reminders')
        
        sent_count = 0
        skipped_count = 0
        error_count = 0
        
        for booking in bookings_needing_reminders:
            try:
                # Check if we've already sent a reminder recently
                if self.has_recent_reminder(booking):
                    self.stdout.write(f'Skipping {booking.booking_id} - reminder already sent recently')
                    skipped_count += 1
                    continue
                
                # Calculate exact time until start
                time_until_start = booking.start_time - now
                minutes_until = int(time_until_start.total_seconds() / 60)
                
                if dry_run:
                    self.stdout.write(
                        f'Would send reminder for booking {booking.booking_id} '
                        f'(starts in {minutes_until} minutes) to {booking.user.email}'
                    )
                    sent_count += 1
                    continue
                
                # Send the reminder
                success = self.send_reminder(booking, channels, minutes_until)
                
                if success:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Sent reminder for booking {booking.booking_id} '
                            f'(starts in {minutes_until} minutes) to {booking.user.email}'
                        )
                    )
                    sent_count += 1
                else:
                    self.stdout.write(
                        self.style.ERROR(f'Failed to send reminder for booking {booking.booking_id}')
                    )
                    error_count += 1
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error processing booking {booking.booking_id}: {str(e)}')
                )
                error_count += 1
        
        # Summary
        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(f'DRY RUN COMPLETE: Would send {sent_count} reminders')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'COMPLETE: Sent {sent_count} reminders, '
                    f'skipped {skipped_count}, errors {error_count}'
                )
            )
    
    def send_forced_reminder(self, booking_id, channels, dry_run):
        """Send reminder for specific booking ID (for testing)"""
        try:
            booking = Booking.objects.select_related('user', 'parking_space').get(
                booking_id=booking_id
            )
            
            now = timezone.now()
            time_until_start = booking.start_time - now
            minutes_until = int(time_until_start.total_seconds() / 60)
            
            self.stdout.write(f'Forcing reminder for booking {booking_id} (starts in {minutes_until} minutes)')
            
            if dry_run:
                self.stdout.write(f'Would send forced reminder to {booking.user.email}')
                return
            
            success = self.send_reminder(booking, channels, minutes_until)
            
            if success:
                self.stdout.write(self.style.SUCCESS(f'Successfully sent forced reminder'))
            else:
                self.stdout.write(self.style.ERROR(f'Failed to send forced reminder'))
                
        except Booking.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Booking {booking_id} not found'))
    
    def send_reminder(self, booking, channels, minutes_until):
        """Send reminder notification for a booking"""
        try:
            # Prepare notification context
            context = {
                'user_name': booking.user.first_name or booking.user.email.split('@')[0],
                'parking_space_title': booking.parking_space.title,
                'booking_date_time': booking.start_time.strftime('%B %d at %I:%M %p'),
                'start_time': booking.start_time.strftime('%I:%M %p'),
                'address': booking.parking_space.address,
                'booking_id': booking.booking_id,
                'minutes_until': minutes_until,
                'action_url': f'/bookings/{booking.booking_id}'
            }
            
            # Add SMS to channels if user has it enabled
            final_channels = list(channels)
            if 'SMS' not in final_channels and hasattr(booking.user, 'notification_preferences'):
                prefs = booking.user.notification_preferences
                if prefs.sms_enabled and prefs.phone_number:
                    final_channels.append('SMS')
            
            # Send notification
            notifications = NotificationService.send_notification(
                user=booking.user,
                template_type='CHECKIN_REMINDER',
                context=context,
                channels=final_channels
            )
            
            self.stdout.write(f'  → Sent via {len(notifications)} channels: {[n.channel for n in notifications]}')
            
            return len(notifications) > 0
            
        except Exception as e:
            logger.error(f"Error sending reminder for booking {booking.booking_id}: {str(e)}")
            return False
    
    def has_recent_reminder(self, booking):
        """Check if reminder was sent recently for this booking"""
        try:
            from apps.notifications.models import Notification
            
            # Check for notifications sent in the last 30 minutes
            recent_time = timezone.now() - timedelta(minutes=30)
            
            recent_reminders = Notification.objects.filter(
                user=booking.user,
                content__icontains=booking.booking_id,
                created_at__gte=recent_time,
                subject__icontains='Parking Starts Soon'
            ).exists()
            
            return recent_reminders
            
        except Exception as e:
            logger.error(f"Error checking recent reminders: {str(e)}")
            return False  # If we can't check, assume no recent reminder