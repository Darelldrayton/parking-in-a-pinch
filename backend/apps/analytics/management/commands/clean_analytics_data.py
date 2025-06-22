"""
Management command to clean old analytics data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.analytics.models import (
    UserEvent, UserBehaviorSession, PerformanceMetric
)


class Command(BaseCommand):
    help = 'Clean old analytics data based on retention policies'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--events-days',
            type=int,
            default=90,
            help='Keep user events for this many days (default: 90)'
        )
        parser.add_argument(
            '--sessions-days',
            type=int,
            default=180,
            help='Keep session data for this many days (default: 180)'
        )
        parser.add_argument(
            '--performance-days',
            type=int,
            default=30,
            help='Keep performance metrics for this many days (default: 30)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=1000,
            help='Batch size for deletions (default: 1000)'
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch_size']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be deleted'))
        
        # Clean user events
        events_cutoff = timezone.now() - timedelta(days=options['events_days'])
        self.clean_user_events(events_cutoff, dry_run, batch_size)
        
        # Clean sessions
        sessions_cutoff = timezone.now() - timedelta(days=options['sessions_days'])
        self.clean_sessions(sessions_cutoff, dry_run, batch_size)
        
        # Clean performance metrics
        performance_cutoff = timezone.now() - timedelta(days=options['performance_days'])
        self.clean_performance_metrics(performance_cutoff, dry_run, batch_size)
        
        if not dry_run:
            self.stdout.write(self.style.SUCCESS('Analytics data cleanup completed'))
    
    def clean_user_events(self, cutoff_date, dry_run, batch_size):
        """Clean old user events"""
        old_events = UserEvent.objects.filter(timestamp__lt=cutoff_date)
        total_count = old_events.count()
        
        self.stdout.write(f'User events older than {cutoff_date.date()}: {total_count}')
        
        if total_count == 0:
            return
        
        if dry_run:
            self.stdout.write(f'Would delete {total_count} user events')
            return
        
        deleted_count = 0
        while True:
            # Get batch of IDs to delete
            batch_ids = list(
                old_events.values_list('id', flat=True)[:batch_size]
            )
            
            if not batch_ids:
                break
            
            # Delete batch
            batch_deleted = UserEvent.objects.filter(id__in=batch_ids).delete()[0]
            deleted_count += batch_deleted
            
            self.stdout.write(f'Deleted {deleted_count}/{total_count} user events')
        
        self.stdout.write(
            self.style.SUCCESS(f'Deleted {deleted_count} user events')
        )
    
    def clean_sessions(self, cutoff_date, dry_run, batch_size):
        """Clean old sessions"""
        old_sessions = UserBehaviorSession.objects.filter(started_at__lt=cutoff_date)
        total_count = old_sessions.count()
        
        self.stdout.write(f'Sessions older than {cutoff_date.date()}: {total_count}')
        
        if total_count == 0:
            return
        
        if dry_run:
            self.stdout.write(f'Would delete {total_count} sessions')
            return
        
        deleted_count = 0
        while True:
            batch_ids = list(
                old_sessions.values_list('id', flat=True)[:batch_size]
            )
            
            if not batch_ids:
                break
            
            batch_deleted = UserBehaviorSession.objects.filter(id__in=batch_ids).delete()[0]
            deleted_count += batch_deleted
            
            self.stdout.write(f'Deleted {deleted_count}/{total_count} sessions')
        
        self.stdout.write(
            self.style.SUCCESS(f'Deleted {deleted_count} sessions')
        )
    
    def clean_performance_metrics(self, cutoff_date, dry_run, batch_size):
        """Clean old performance metrics"""
        old_metrics = PerformanceMetric.objects.filter(timestamp__lt=cutoff_date)
        total_count = old_metrics.count()
        
        self.stdout.write(f'Performance metrics older than {cutoff_date.date()}: {total_count}')
        
        if total_count == 0:
            return
        
        if dry_run:
            self.stdout.write(f'Would delete {total_count} performance metrics')
            return
        
        deleted_count = 0
        while True:
            batch_ids = list(
                old_metrics.values_list('id', flat=True)[:batch_size]
            )
            
            if not batch_ids:
                break
            
            batch_deleted = PerformanceMetric.objects.filter(id__in=batch_ids).delete()[0]
            deleted_count += batch_deleted
            
            self.stdout.write(f'Deleted {deleted_count}/{total_count} performance metrics')
        
        self.stdout.write(
            self.style.SUCCESS(f'Deleted {deleted_count} performance metrics')
        )