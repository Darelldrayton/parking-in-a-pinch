from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.bookings.models import Booking, BookingStatus


class Command(BaseCommand):
    help = 'Automatically check out active bookings that have been running for more than 1 hour'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be checked out without actually doing it',
        )

    def handle(self, *args, **options):
        now = timezone.now()
        one_hour_ago = now - timedelta(hours=1)
        
        # Find active bookings where check-in was more than 1 hour ago
        bookings_to_checkout = Booking.objects.filter(
            status=BookingStatus.ACTIVE,
            actual_start_time__isnull=False,
            actual_start_time__lte=one_hour_ago,
            actual_end_time__isnull=True,  # Not already checked out
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Found {bookings_to_checkout.count()} bookings to auto-checkout')
        )
        
        for booking in bookings_to_checkout:
            if options['dry_run']:
                self.stdout.write(
                    f'Would auto-checkout booking {booking.booking_id} '
                    f'(checked in {booking.actual_start_time})'
                )
            else:
                # Perform auto-checkout
                checkout_time = booking.actual_start_time + timedelta(hours=1)
                booking.actual_end_time = checkout_time
                booking.auto_checkout = True
                booking.status = BookingStatus.COMPLETED
                booking.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Auto-checked out booking {booking.booking_id} at {checkout_time}'
                    )
                )
        
        if not options['dry_run'] and bookings_to_checkout.exists():
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully auto-checked out {bookings_to_checkout.count()} bookings'
                )
            )