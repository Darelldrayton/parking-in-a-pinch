from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.users.models import User


class Command(BaseCommand):
    help = 'Fix verification status for users who have identity verification approved'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='Specific user ID to fix (optional)',
        )

    def handle(self, *args, **options):
        user_id = options.get('user_id')
        
        if user_id:
            # Fix specific user
            try:
                user = User.objects.get(id=user_id)
                self.fix_user_verification(user)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with ID {user_id} not found')
                )
        else:
            # Fix all users who need it
            users = User.objects.filter(
                is_identity_verified=True,
                is_verified=False
            )
            
            self.stdout.write(f'Found {users.count()} users needing verification fix')
            
            for user in users:
                self.fix_user_verification(user)

    def fix_user_verification(self, user):
        self.stdout.write(f'Processing user: {user.email} (ID: {user.id})')
        self.stdout.write(f'  Current is_verified: {user.is_verified}')
        self.stdout.write(f'  Current is_identity_verified: {user.is_identity_verified}')
        
        if user.is_identity_verified and not user.is_verified:
            user.is_verified = True
            user.verified_at = timezone.now()
            user.save()
            self.stdout.write(
                self.style.SUCCESS('  ✅ Updated user.is_verified to True')
            )
        elif user.is_verified:
            self.stdout.write(
                self.style.SUCCESS('  ✅ User is already verified')
            )
        else:
            self.stdout.write(
                self.style.WARNING('  ⚠️ User needs identity verification first')
            )