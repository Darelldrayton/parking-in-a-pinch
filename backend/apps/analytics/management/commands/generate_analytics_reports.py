"""
Management command to generate analytics reports
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from apps.analytics.services import ReportGenerator
from apps.analytics.models import DailyStats


class Command(BaseCommand):
    help = 'Generate analytics reports for specified date range'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Date to generate report for (YYYY-MM-DD). Defaults to yesterday.'
        )
        parser.add_argument(
            '--start-date',
            type=str,
            help='Start date for range (YYYY-MM-DD)'
        )
        parser.add_argument(
            '--end-date',
            type=str,
            help='End date for range (YYYY-MM-DD)'
        )
        parser.add_argument(
            '--type',
            choices=['daily', 'weekly', 'backfill'],
            default='daily',
            help='Type of report to generate'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force regeneration of existing reports'
        )
    
    def handle(self, *args, **options):
        report_type = options['type']
        
        try:
            if report_type == 'daily':
                self.generate_daily_report(options)
            elif report_type == 'weekly':
                self.generate_weekly_report(options)
            elif report_type == 'backfill':
                self.backfill_reports(options)
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error generating {report_type} report: {str(e)}')
            )
    
    def generate_daily_report(self, options):
        """Generate daily report"""
        if options['date']:
            date = datetime.strptime(options['date'], '%Y-%m-%d').date()
        else:
            date = timezone.now().date() - timedelta(days=1)  # Yesterday
        
        # Check if report already exists
        if not options['force'] and DailyStats.objects.filter(date=date).exists():
            self.stdout.write(
                self.style.WARNING(f'Daily report for {date} already exists. Use --force to regenerate.')
            )
            return
        
        self.stdout.write(f'Generating daily report for {date}...')
        
        result = ReportGenerator.generate_daily_report(date)
        
        if 'error' in result:
            self.stdout.write(
                self.style.ERROR(f'Failed to generate report: {result["error"]}')
            )
        else:
            action = 'Created' if result['created'] else 'Updated'
            self.stdout.write(
                self.style.SUCCESS(f'{action} daily report for {date}')
            )
    
    def generate_weekly_report(self, options):
        """Generate weekly report"""
        if options['date']:
            end_date = datetime.strptime(options['date'], '%Y-%m-%d').date()
        else:
            end_date = timezone.now().date()
        
        self.stdout.write(f'Generating weekly report ending {end_date}...')
        
        result = ReportGenerator.generate_weekly_report(end_date)
        
        if 'error' in result:
            self.stdout.write(
                self.style.ERROR(f'Failed to generate weekly report: {result["error"]}')
            )
        else:
            start_date = result['period']['start']
            self.stdout.write(
                self.style.SUCCESS(f'Generated weekly report for {start_date} to {end_date}')
            )
            
            # Display summary
            summary = result['summary']
            self.stdout.write(f'New users: {summary["total_new_users"]}')
            self.stdout.write(f'Avg active users: {summary["avg_active_users"]:.1f}')
            self.stdout.write(f'Total revenue: ${summary["total_revenue"]:.2f}')
            self.stdout.write(f'Total bookings: {summary["total_bookings"]}')
    
    def backfill_reports(self, options):
        """Backfill missing daily reports"""
        if not options['start_date'] or not options['end_date']:
            self.stdout.write(
                self.style.ERROR('--start-date and --end-date required for backfill')
            )
            return
        
        start_date = datetime.strptime(options['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(options['end_date'], '%Y-%m-%d').date()
        
        if start_date > end_date:
            self.stdout.write(
                self.style.ERROR('Start date must be before end date')
            )
            return
        
        self.stdout.write(f'Backfilling reports from {start_date} to {end_date}...')
        
        current_date = start_date
        generated_count = 0
        updated_count = 0
        error_count = 0
        
        while current_date <= end_date:
            try:
                # Check if report exists
                exists = DailyStats.objects.filter(date=current_date).exists()
                
                if exists and not options['force']:
                    self.stdout.write(f'Skipping {current_date} (already exists)')
                else:
                    result = ReportGenerator.generate_daily_report(current_date)
                    
                    if 'error' in result:
                        self.stdout.write(
                            self.style.ERROR(f'Error for {current_date}: {result["error"]}')
                        )
                        error_count += 1
                    else:
                        if result['created']:
                            generated_count += 1
                        else:
                            updated_count += 1
                        self.stdout.write(f'Processed {current_date}')
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Exception for {current_date}: {str(e)}')
                )
                error_count += 1
            
            current_date += timedelta(days=1)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Backfill complete: {generated_count} created, '
                f'{updated_count} updated, {error_count} errors'
            )
        )