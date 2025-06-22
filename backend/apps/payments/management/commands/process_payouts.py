"""
Management command to process host payouts.
"""
import stripe
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum
from apps.payments.models import Payment, Payout

stripe.api_key = settings.STRIPE_SECRET_KEY


class Command(BaseCommand):
    help = 'Process payouts to hosts for completed payments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually processing payouts',
        )
        parser.add_argument(
            '--min-amount',
            type=float,
            default=10.0,
            help='Minimum payout amount (default: $10.00)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        min_amount = Decimal(str(options['min_amount']))
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Processing payouts (dry_run={dry_run}, min_amount=${min_amount})"
            )
        )
        
        # Get all hosts with payments that haven't been paid out
        unpaid_payments = Payment.objects.filter(
            status='succeeded',
            payouts__isnull=True,
            booking__parking_space__host__stripe_account_id__isnull=False
        ).select_related('booking__parking_space__host')
        
        # Group by host
        hosts_with_payments = {}
        for payment in unpaid_payments:
            host = payment.booking.parking_space.host
            if host not in hosts_with_payments:
                hosts_with_payments[host] = []
            hosts_with_payments[host].append(payment)
        
        total_hosts = len(hosts_with_payments)
        total_payouts = 0
        total_amount = Decimal('0.00')
        
        self.stdout.write(f"Found {total_hosts} hosts with pending payouts")
        
        for host, payments in hosts_with_payments.items():
            host_total = sum(p.host_payout_amount for p in payments)
            
            if host_total < min_amount:
                self.stdout.write(
                    f"Skipping {host.email}: ${host_total} < ${min_amount}"
                )
                continue
            
            self.stdout.write(
                f"Processing payout for {host.email}: ${host_total} ({len(payments)} payments)"
            )
            
            if not dry_run:
                try:
                    with transaction.atomic():
                        # Create payout record
                        period_start = min(p.created_at for p in payments)
                        period_end = max(p.created_at for p in payments)
                        
                        payout = Payout.objects.create(
                            host=host,
                            amount=host_total,
                            period_start=period_start,
                            period_end=period_end,
                            description=f"Payout for {len(payments)} bookings",
                        )
                        
                        # Add payments to payout
                        payout.payments.set(payments)
                        
                        # Create Stripe payout if host has connected account
                        if host.stripe_account_id:
                            stripe_payout = stripe.Payout.create(
                                amount=int(host_total * 100),  # Convert to cents
                                currency='usd',
                                metadata={
                                    'payout_id': payout.payout_id,
                                    'host_id': host.id,
                                },
                                stripe_account=host.stripe_account_id,
                            )
                            
                            payout.stripe_payout_id = stripe_payout.id
                            payout.status = stripe_payout.status
                            payout.save()
                        
                        total_payouts += 1
                        total_amount += host_total
                        
                        self.stdout.write(
                            self.style.SUCCESS(f"✓ Created payout {payout.payout_id}")
                        )
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"✗ Error creating payout for {host.email}: {e}")
                    )
            else:
                total_payouts += 1
                total_amount += host_total
        
        self.stdout.write(
            self.style.SUCCESS(
                f"{'Would process' if dry_run else 'Processed'} {total_payouts} payouts "
                f"totaling ${total_amount}"
            )
        )