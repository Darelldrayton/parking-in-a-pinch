"""
Management command to send parking expiration warnings.

This command finds bookings that are expiring in approximately 30 minutes
and sends warning notifications to the users.

Usage:
    python manage.py send_expiration_warnings
    python manage.py send_expiration_warnings --dry-run
    python manage.py send_expiration_warnings --minutes-ahead 30
    python manage.py send_expiration_warnings --force-booking-id BK12345678
"""

import logging
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.bookings.models import Booking, BookingStatus
from apps.bookings.tasks import send_expiration_warning
from apps.notifications.services import NotificationService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Send parking expiration warnings to users with bookings ending soon'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually sending notifications',
        )
        
        parser.add_argument(
            '--minutes-ahead',
            type=int,
            default=30,
            help='Send warnings for bookings ending this many minutes ahead (default: 30)',
        )
        
        parser.add_argument(
            '--tolerance',
            type=int,
            default=5,
            help='Tolerance window in minutes around the target time (default: 5)',
        )
        
        parser.add_argument(
            '--force-booking-id',
            type=str,
            help='Force send warning for a specific booking ID (for testing)',
        )
        
        parser.add_argument(
            '--channels',
            nargs='+',
            default=['IN_APP', 'PUSH', 'SMS'],
            help='Notification channels to use (default: IN_APP PUSH SMS)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        minutes_ahead = options['minutes_ahead']
        tolerance = options['tolerance']
        force_booking_id = options['force_booking_id']
        channels = options['channels']
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('🔍 DRY RUN MODE - No notifications will be sent')
            )
        
        self.stdout.write(f'🚨 Looking for bookings expiring in {minutes_ahead}±{tolerance} minutes...')
        
        now = timezone.now()
        count = 0
        
        try:
            if force_booking_id:
                # Force send for specific booking (testing mode)
                self.stdout.write(f'🔧 Force mode: sending warning for booking {force_booking_id}')
                
                try:
                    booking = Booking.objects.get(booking_id=force_booking_id)
                    self._process_booking(booking, channels, dry_run, force=True)
                    count = 1
                except Booking.DoesNotExist:
                    self.stdout.write(
                        self.style.ERROR(f'❌ Booking {force_booking_id} not found')
                    )
                    return
            else:
                # Normal mode: find bookings expiring soon
                target_time = now + timedelta(minutes=minutes_ahead)
                start_time = target_time - timedelta(minutes=tolerance)
                end_time = target_time + timedelta(minutes=tolerance)
                
                bookings = Booking.objects.filter(
                    status__in=[BookingStatus.CONFIRMED, BookingStatus.ACTIVE],
                    end_time__gte=start_time,
                    end_time__lte=end_time,
                ).select_related('user', 'parking_space', 'parking_space__host')
                
                self.stdout.write(f'📊 Found {bookings.count()} bookings expiring between {start_time.strftime("%H:%M")} and {end_time.strftime("%H:%M")}')
                
                for booking in bookings:
                    time_until_end = booking.end_time - now
                    minutes_until = int(time_until_end.total_seconds() / 60)
                    
                    self.stdout.write(f'📝 Booking {booking.booking_id}: expires in {minutes_until} minutes')
                    
                    # Check if we've already sent a warning recently
                    if not force_booking_id:
                        from apps.bookings.tasks import _check_recent_expiration_warning
                        if _check_recent_expiration_warning(booking):
                            self.stdout.write(f'⏭️  Skipping {booking.booking_id} - warning sent recently')
                            continue
                    
                    if self._process_booking(booking, channels, dry_run):
                        count += 1
            
            if dry_run:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Dry run complete: Would have sent {count} expiration warnings')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Sent {count} expiration warnings successfully')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error processing expiration warnings: {str(e)}')
            )
            logger.error(f'Error in send_expiration_warnings command: {str(e)}')

    def _process_booking(self, booking, channels, dry_run, force=False):
        """Process a single booking for expiration warning."""
        try:
            user_name = booking.user.first_name or booking.user.email.split('@')[0]
            time_until_end = booking.end_time - timezone.now()
            minutes_until = int(time_until_end.total_seconds() / 60)
            
            context = {
                'user_name': user_name,
                'parking_space_title': booking.parking_space.title,
                'booking_id': booking.booking_id,
                'end_time': booking.end_time.strftime('%I:%M %p'),
                'minutes_until_expiration': minutes_until,
                'action_url': f'/bookings/{booking.booking_id}',
                'extend_url': f'/bookings/{booking.booking_id}/extend'
            }
            
            self.stdout.write(
                f'📞 {"[DRY RUN] " if dry_run else ""}Sending expiration warning to {booking.user.email} '
                f'for booking {booking.booking_id} (expires in {minutes_until} min)'
            )
            
            if not dry_run:
                # Try using Celery task first, fall back to direct notification
                try:
                    result = send_expiration_warning(booking.id)
                    self.stdout.write(f'✅ Task result: {result}')
                except Exception as e:
                    # Fall back to direct notification service
                    self.stdout.write(f'⚠️  Celery task failed, using direct notification: {str(e)}')
                    
                    notifications = NotificationService.send_notification(
                        user=booking.user,
                        template_type='PARKING_EXPIRATION_WARNING',
                        context=context,
                        channels=channels
                    )
                    
                    self.stdout.write(f'✅ Sent {len(notifications)} notifications via direct service')
            
            return True
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error processing booking {booking.booking_id}: {str(e)}')
            )
            logger.error(f'Error processing booking {booking.booking_id} for expiration warning: {str(e)}')
            return False