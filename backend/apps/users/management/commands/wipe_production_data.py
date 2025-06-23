from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from django.apps import apps

User = get_user_model()

class Command(BaseCommand):
    help = 'Wipe all production data while preserving admin accounts'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm that you want to delete all data',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.ERROR(
                    'This command will DELETE ALL USER DATA. '
                    'Use --confirm to proceed.'
                )
            )
            return

        self.stdout.write('Starting data wipe...')

        # Get models dynamically to avoid import issues
        models_to_clear = [
            ('analytics', 'Analytics'),
            ('notifications', 'Notification'),
            ('disputes', 'Dispute'),
            ('messaging', 'Message'),
            ('messaging', 'Conversation'),
            ('reviews', 'Review'),
            ('payments', 'RefundRequest'),
            ('payments', 'Payment'),
            ('bookings', 'Booking'),
            ('listings', 'ParkingListing'),
        ]

        for app_name, model_name in models_to_clear:
            try:
                model = apps.get_model(app_name, model_name)
                count = model.objects.count()
                model.objects.all().delete()
                self.stdout.write(f'Deleted {count} {model_name} records')
            except Exception as e:
                self.stdout.write(f'Could not delete {model_name}: {e}')

        # Delete non-admin users
        regular_users = User.objects.filter(is_staff=False, is_superuser=False)
        user_count = regular_users.count()
        regular_users.delete()
        self.stdout.write(f'Deleted {user_count} regular user accounts')

        # Show remaining admin accounts
        admin_users = User.objects.filter(is_staff=True)
        self.stdout.write(f'\nRemaining admin accounts:')
        for user in admin_users:
            self.stdout.write(f'  - {user.email} (superuser: {user.is_superuser})')

        self.stdout.write(
            self.style.SUCCESS(
                '\nData wipe completed successfully!'
            )
        )