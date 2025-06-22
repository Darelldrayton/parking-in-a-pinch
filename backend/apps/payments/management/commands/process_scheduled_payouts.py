"""
Management command to process scheduled payouts
Run via: python manage.py process_scheduled_payouts
"""
import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from ...services import PayoutService
from ...models import Payout

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Process scheduled payouts for today'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be processed without actually processing',
        )
        parser.add_argument(
            '--date',
            type=str,
            help='Process payouts for specific date (YYYY-MM-DD)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Determine target date
        if options['date']:
            try:
                from datetime import datetime
                target_date = datetime.strptime(options['date'], '%Y-%m-%d').date()
            except ValueError:
                self.stdout.write(
                    self.style.ERROR('Invalid date format. Use YYYY-MM-DD')
                )
                return
        else:
            target_date = timezone.now().date()
        
        self.stdout.write(f"Processing payouts for {target_date}")
        
        # Get scheduled payouts for target date
        scheduled_payouts = Payout.objects.filter(
            scheduled_date=target_date,
            status='scheduled'
        )
        
        if not scheduled_payouts.exists():
            self.stdout.write(
                self.style.WARNING(f'No scheduled payouts found for {target_date}')
            )
            return
        
        self.stdout.write(f"Found {scheduled_payouts.count()} scheduled payouts")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN - No actual processing"))
            for payout in scheduled_payouts:
                self.stdout.write(
                    f"Would process: Payout {payout.id} - ${payout.amount} to {payout.host.email}"
                )
            return
        
        # Process payouts
        processed_count = 0
        failed_count = 0
        
        for payout in scheduled_payouts:
            try:
                self.stdout.write(f"Processing payout {payout.id}...")
                
                PayoutService._process_instant_payout(payout)
                processed_count += 1
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✓ Processed payout {payout.id} - ${payout.amount} to {payout.host.email}"
                    )
                )
                
            except Exception as e:
                failed_count += 1
                logger.error(f"Failed to process payout {payout.id}: {str(e)}")
                
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ Failed to process payout {payout.id}: {str(e)}"
                    )
                )
                
                # Update payout status
                payout.status = 'failed'
                payout.failure_reason = str(e)
                payout.save()
        
        # Summary
        self.stdout.write("\n" + "="*50)
        self.stdout.write(f"SUMMARY for {target_date}")
        self.stdout.write(f"Processed: {processed_count}")
        self.stdout.write(f"Failed: {failed_count}")
        self.stdout.write(f"Total: {processed_count + failed_count}")
        
        if failed_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    f"\n{failed_count} payouts failed. Check logs for details."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("\nAll payouts processed successfully!")
            )