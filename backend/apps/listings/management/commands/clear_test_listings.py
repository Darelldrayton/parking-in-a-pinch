from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.listings.models import ParkingListing
from apps.bookings.models import Booking
from apps.payments.models import Payment
from apps.reviews.models import Review

User = get_user_model()

class Command(BaseCommand):
    help = 'Clear all test listings and related data for production launch'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm that you want to delete all test listings',
        )
        parser.add_argument(
            '--keep-admin',
            action='store_true',
            help='Keep listings created by admin users',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.ERROR(
                    'This command will DELETE ALL LISTINGS and related data. '
                    'Use --confirm to proceed.'
                )
            )
            return

        self.stdout.write('Starting test data cleanup...')

        # Get all listings
        if options['keep_admin']:
            # Only delete listings from non-admin users
            listings = ParkingListing.objects.exclude(host__is_staff=True)
            self.stdout.write('Keeping listings created by admin users...')
        else:
            # Delete all listings
            listings = ParkingListing.objects.all()
            self.stdout.write('Deleting ALL listings...')

        listing_count = listings.count()
        
        if listing_count == 0:
            self.stdout.write(
                self.style.SUCCESS('No listings found to delete.')
            )
            return

        # Show what will be deleted
        self.stdout.write(f'Found {listing_count} listings to delete:')
        for listing in listings[:10]:  # Show first 10
            self.stdout.write(f'  - {listing.title} by {listing.host.email}')
        if listing_count > 10:
            self.stdout.write(f'  ... and {listing_count - 10} more')

        # Get related data counts before deletion
        booking_count = Booking.objects.filter(parking_space__in=listings).count()
        payment_count = Payment.objects.filter(booking__parking_space__in=listings).count()
        review_count = Review.objects.filter(listing__in=listings).count()

        self.stdout.write(f'\nThis will also delete:')
        self.stdout.write(f'  - {booking_count} bookings')
        self.stdout.write(f'  - {payment_count} payments')
        self.stdout.write(f'  - {review_count} reviews')

        # Delete related data first (foreign key constraints)
        Payment.objects.filter(booking__parking_space__in=listings).delete()
        self.stdout.write(f'Deleted {payment_count} payments')

        Review.objects.filter(listing__in=listings).delete()
        self.stdout.write(f'Deleted {review_count} reviews')

        Booking.objects.filter(parking_space__in=listings).delete()
        self.stdout.write(f'Deleted {booking_count} bookings')

        # Finally delete the listings
        listings.delete()
        self.stdout.write(f'Deleted {listing_count} listings')

        # Show remaining data
        remaining_listings = ParkingListing.objects.count()
        remaining_users = User.objects.filter(is_staff=False).count()
        admin_users = User.objects.filter(is_staff=True).count()

        self.stdout.write(f'\nRemaining data:')
        self.stdout.write(f'  - {remaining_listings} listings')
        self.stdout.write(f'  - {remaining_users} regular users')
        self.stdout.write(f'  - {admin_users} admin users')

        self.stdout.write(
            self.style.SUCCESS(
                '\n✅ Test data cleanup completed successfully!'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                'Your site is now clean and ready for production!'
            )
        )