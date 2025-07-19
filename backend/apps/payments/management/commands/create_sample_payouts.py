"""
Management command to create sample payout requests for testing
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import random

from apps.payments.models import Payment, PayoutRequest

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample payout requests for testing the admin dashboard'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of sample payout requests to create'
        )

    def handle(self, *args, **options):
        count = options['count']
        
        # Get or create test hosts
        hosts = []
        for i in range(3):
            email = f'host{i+1}@test.com'
            host, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': f'Host{i+1}',
                    'last_name': 'Testing',
                    'is_verified': True,
                    'user_type': 'host'
                }
            )
            hosts.append(host)
            if created:
                self.stdout.write(f'Created test host: {email}')

        # Create sample payout requests
        statuses = ['pending', 'approved', 'rejected', 'completed']
        payout_methods = ['bank_transfer', 'stripe_express', 'paypal']
        
        for i in range(count):
            host = random.choice(hosts)
            status = random.choice(statuses)
            amount = Decimal(random.randint(50, 500))
            
            payout_request = PayoutRequest.objects.create(
                host=host,
                requested_amount=amount,
                approved_amount=amount if status in ['approved', 'completed'] else None,
                payout_method=random.choice(payout_methods),
                status=status,
                bank_name=f'Test Bank {i+1}',
                account_holder_name=f'{host.first_name} {host.last_name}',
                account_number=f'****{random.randint(1000, 9999)}',
                routing_number=f'{random.randint(100000000, 999999999)}',
                host_notes=f'Sample payout request {i+1} - Please process payment',
                admin_notes=f'Test data - created by management command' if status != 'pending' else '',
                rejection_reason='Insufficient documentation' if status == 'rejected' else '',
                reviewed_at=timezone.now() if status != 'pending' else None,
                processed_at=timezone.now() if status == 'completed' else None
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created payout request {payout_request.request_id} '
                    f'for {host.email} - ${amount} ({status})'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {count} sample payout requests'
            )
        )