"""
Management command to create test refund requests for demo purposes.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
import random

from apps.bookings.models import Booking
from apps.payments.models import RefundRequest, Payment
from apps.users.models import User


class Command(BaseCommand):
    help = 'Create test refund requests for demonstration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of test refund requests to create'
        )

    def handle(self, *args, **options):
        count = options['count']
        
        # Get some bookings with payments
        bookings_with_payments = Booking.objects.filter(
            payment__isnull=False
        ).select_related('user', 'payment').distinct()[:count]
        
        if not bookings_with_payments:
            self.stdout.write(
                self.style.WARNING('No bookings with payments found. Create some bookings first.')
            )
            return
        
        reasons = [
            'cancelled_by_user',
            'cancelled_by_host', 
            'no_show',
            'space_unavailable',
            'emergency',
            'weather',
            'payment_issue'
        ]
        
        customer_notes = [
            'Had to cancel due to emergency',
            'Host was unresponsive and space was not available',
            'Weather conditions made parking unsafe',
            'Emergency came up, need refund please',
            'Space was blocked by construction',
            'Host cancelled last minute',
            'Payment was charged twice by mistake'
        ]
        
        created_count = 0
        
        for booking in bookings_with_payments:
            # Check if refund request already exists
            if RefundRequest.objects.filter(booking=booking).exists():
                continue
                
            payment = booking.payment
            if not payment:
                continue
            
            # Create refund request
            refund_request = RefundRequest.objects.create(
                booking=booking,
                payment=payment,
                requested_by=booking.user,
                reason=random.choice(reasons),
                requested_amount=Decimal(str(random.uniform(10.0, 100.0))),
                customer_notes=random.choice(customer_notes),
                status='pending'
            )
            
            created_count += 1
            
            self.stdout.write(
                f'Created refund request {refund_request.request_id} for booking {booking.booking_id}'
            )
            
            if created_count >= count:
                break
        
        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created {created_count} test refund requests!'
                )
            )
            self.stdout.write(
                'You can now view them in the admin at /admin/payments/refundrequest/'
            )
        else:
            self.stdout.write(
                self.style.WARNING('No refund requests were created.')
            )