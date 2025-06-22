"""
Analytics Services
"""
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Sum, Avg, F, Q, Max, Min
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from .models import (
    UserEvent, DailyStats, UserBehaviorSession, ConversionFunnel,
    RevenueMetrics, UserSegment, CustomMetric, PerformanceMetric, EventType
)

User = get_user_model()
logger = logging.getLogger(__name__)


class EventTracker:
    """Service for tracking user events and interactions"""
    
    @staticmethod
    def track_event(event_type, user=None, session_id=None, content_object=None, 
                   event_data=None, request=None, **kwargs):
        """
        Track a user event
        """
        try:
            # Extract request data
            ip_address = None
            user_agent = ""
            referer = ""
            
            if request:
                ip_address = EventTracker._get_client_ip(request)
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                referer = request.META.get('HTTP_REFERER', '')
                
                # Auto-detect session if not provided
                if not session_id:
                    session_id = request.session.session_key
            
            # Prepare event data
            event_data = event_data or {}
            
            # Get content type and object id for generic foreign key
            content_type = None
            object_id = None
            if content_object:
                content_type = ContentType.objects.get_for_model(content_object)
                object_id = str(content_object.pk)
            
            # Device information
            device_info = EventTracker._parse_user_agent(user_agent)
            
            # Create event
            event = UserEvent.objects.create(
                user=user,
                session_id=session_id or '',
                event_type=event_type,
                content_type=content_type,
                object_id=object_id,
                event_data=event_data,
                ip_address=ip_address,
                user_agent=user_agent,
                referer=referer,
                device_type=device_info.get('device_type', ''),
                browser=device_info.get('browser', ''),
                os=device_info.get('os', ''),
                **kwargs
            )
            
            # Update session
            if session_id:
                EventTracker._update_session(session_id, user, event_type, request)
            
            return event
            
        except Exception as e:
            logger.error(f"Error tracking event {event_type}: {str(e)}")
            return None
    
    @staticmethod
    def _get_client_ip(request):
        """Extract client IP from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @staticmethod
    def _parse_user_agent(user_agent):
        """Parse user agent string to extract device information"""
        # Simplified parsing - in production, use a library like user-agents
        device_info = {
            'device_type': 'desktop',
            'browser': 'unknown',
            'os': 'unknown'
        }
        
        user_agent_lower = user_agent.lower()
        
        # Detect mobile
        if any(mobile in user_agent_lower for mobile in ['mobile', 'android', 'iphone', 'ipad']):
            device_info['device_type'] = 'mobile'
            if 'ipad' in user_agent_lower:
                device_info['device_type'] = 'tablet'
        
        # Detect browser
        if 'chrome' in user_agent_lower:
            device_info['browser'] = 'chrome'
        elif 'firefox' in user_agent_lower:
            device_info['browser'] = 'firefox'
        elif 'safari' in user_agent_lower:
            device_info['browser'] = 'safari'
        elif 'edge' in user_agent_lower:
            device_info['browser'] = 'edge'
        
        # Detect OS
        if 'windows' in user_agent_lower:
            device_info['os'] = 'windows'
        elif 'mac' in user_agent_lower:
            device_info['os'] = 'macos'
        elif 'android' in user_agent_lower:
            device_info['os'] = 'android'
        elif 'ios' in user_agent_lower or 'iphone' in user_agent_lower or 'ipad' in user_agent_lower:
            device_info['os'] = 'ios'
        elif 'linux' in user_agent_lower:
            device_info['os'] = 'linux'
        
        return device_info
    
    @staticmethod
    def _update_session(session_id, user, event_type, request):
        """Update or create user session"""
        try:
            session, created = UserBehaviorSession.objects.get_or_create(
                session_id=session_id,
                defaults={
                    'user': user,
                    'ip_address': EventTracker._get_client_ip(request) if request else None,
                    'user_agent': request.META.get('HTTP_USER_AGENT', '') if request else '',
                    'entry_page': request.build_absolute_uri() if request else '',
                    'referrer': request.META.get('HTTP_REFERER', '') if request else ''
                }
            )
            
            # Update session metrics
            session.events_count = F('events_count') + 1
            if event_type == EventType.PAGE_VIEW:
                session.page_views = F('page_views') + 1
            
            # Track conversion events
            conversion_events = [
                EventType.BOOKING_CREATED,
                EventType.PAYMENT_COMPLETED,
                EventType.USER_REGISTRATION
            ]
            
            if event_type in conversion_events:
                session.is_conversion = True
                if event_type not in session.conversion_events:
                    session.conversion_events.append(event_type)
            
            session.save()
            
        except Exception as e:
            logger.error(f"Error updating session {session_id}: {str(e)}")


class AnalyticsService:
    """Core analytics service for data aggregation and insights"""
    
    @staticmethod
    def get_dashboard_metrics(user=None, date_range=30):
        """Get dashboard metrics for overview"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=date_range)
        
        metrics = {}
        
        try:
            # Get recent daily stats
            daily_stats = DailyStats.objects.filter(
                date__gte=start_date,
                date__lte=end_date
            ).order_by('-date')
            
            if daily_stats.exists():
                latest_stats = daily_stats.first()
                
                # Current metrics
                metrics['current'] = {
                    'total_users': latest_stats.total_users,
                    'active_users': latest_stats.active_users,
                    'total_listings': latest_stats.total_listings,
                    'total_bookings': sum(stat.new_bookings for stat in daily_stats),
                    'gross_revenue': sum(stat.gross_revenue for stat in daily_stats),
                    'platform_fees': sum(stat.platform_fees for stat in daily_stats)
                }
                
                # Trends (compare with previous period)
                previous_start = start_date - timedelta(days=date_range)
                previous_stats = DailyStats.objects.filter(
                    date__gte=previous_start,
                    date__lt=start_date
                ).order_by('-date')
                
                if previous_stats.exists():
                    prev_revenue = sum(stat.gross_revenue for stat in previous_stats)
                    prev_bookings = sum(stat.new_bookings for stat in previous_stats)
                    
                    metrics['trends'] = {
                        'revenue_change': float((metrics['current']['gross_revenue'] - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0,
                        'booking_change': float((metrics['current']['total_bookings'] - prev_bookings) / prev_bookings * 100) if prev_bookings > 0 else 0
                    }
                
                # Chart data
                metrics['charts'] = {
                    'daily_revenue': [
                        {'date': stat.date.isoformat(), 'value': float(stat.gross_revenue)}
                        for stat in daily_stats
                    ],
                    'daily_bookings': [
                        {'date': stat.date.isoformat(), 'value': stat.new_bookings}
                        for stat in daily_stats
                    ]
                }
            
            # User-specific metrics if user provided
            if user:
                user_events = UserEvent.objects.filter(
                    user=user,
                    timestamp__gte=start_date
                )
                
                metrics['user'] = {
                    'total_events': user_events.count(),
                    'sessions': UserBehaviorSession.objects.filter(user=user, started_at__gte=start_date).count(),
                    'bookings': user_events.filter(event_type=EventType.BOOKING_CREATED).count(),
                    'favorite_listings': user_events.filter(event_type=EventType.LISTING_FAVORITE).count()
                }
            
        except Exception as e:
            logger.error(f"Error getting dashboard metrics: {str(e)}")
            metrics = {'error': 'Failed to load metrics'}
        
        return metrics
    
    @staticmethod
    def get_user_analytics(user_id, date_range=30):
        """Get detailed analytics for a specific user"""
        try:
            user = User.objects.get(id=user_id)
            end_date = timezone.now().date()
            start_date = end_date - timedelta(days=date_range)
            
            # User events in period
            events = UserEvent.objects.filter(
                user=user,
                timestamp__date__gte=start_date
            )
            
            # Sessions in period
            sessions = UserBehaviorSession.objects.filter(
                user=user,
                started_at__date__gte=start_date
            )
            
            analytics = {
                'user_id': user_id,
                'period': {'start': start_date, 'end': end_date},
                'overview': {
                    'total_events': events.count(),
                    'total_sessions': sessions.count(),
                    'avg_session_duration': sessions.aggregate(avg=Avg('duration_seconds'))['avg'] or 0,
                    'total_page_views': events.filter(event_type=EventType.PAGE_VIEW).count()
                },
                'activity_by_type': dict(
                    events.values('event_type').annotate(count=Count('id')).values_list('event_type', 'count')
                ),
                'device_breakdown': dict(
                    events.values('device_type').annotate(count=Count('id')).values_list('device_type', 'count')
                ),
                'conversion_events': events.filter(
                    event_type__in=[EventType.BOOKING_CREATED, EventType.PAYMENT_COMPLETED]
                ).count()
            }
            
            return analytics
            
        except User.DoesNotExist:
            return {'error': 'User not found'}
        except Exception as e:
            logger.error(f"Error getting user analytics: {str(e)}")
            return {'error': 'Failed to load user analytics'}
    
    @staticmethod
    def get_conversion_funnel_data(funnel_name, date_range=30):
        """Get conversion funnel data"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=date_range)
        
        try:
            funnel_data = ConversionFunnel.objects.filter(
                funnel_name=funnel_name,
                date__gte=start_date
            ).order_by('step_order', '-date')
            
            # Group by step and aggregate
            steps = {}
            for step in funnel_data:
                if step.step_name not in steps:
                    steps[step.step_name] = {
                        'step_order': step.step_order,
                        'total_users': 0,
                        'completed_users': 0,
                        'dates': []
                    }
                
                steps[step.step_name]['total_users'] += step.total_users
                steps[step.step_name]['completed_users'] += step.completed_users
                steps[step.step_name]['dates'].append({
                    'date': step.date,
                    'users': step.total_users,
                    'completed': step.completed_users,
                    'rate': step.conversion_rate
                })
            
            # Calculate overall conversion rates
            for step_name, step_data in steps.items():
                if step_data['total_users'] > 0:
                    step_data['overall_conversion_rate'] = (
                        step_data['completed_users'] / step_data['total_users'] * 100
                    )
                else:
                    step_data['overall_conversion_rate'] = 0
            
            return {
                'funnel_name': funnel_name,
                'period': {'start': start_date, 'end': end_date},
                'steps': dict(sorted(steps.items(), key=lambda x: x[1]['step_order']))
            }
            
        except Exception as e:
            logger.error(f"Error getting funnel data: {str(e)}")
            return {'error': 'Failed to load funnel data'}


class ReportGenerator:
    """Generate analytics reports"""
    
    @staticmethod
    def generate_daily_report(date=None):
        """Generate daily analytics report"""
        if not date:
            date = timezone.now().date()
        
        try:
            # Get or create daily stats
            stats, created = DailyStats.objects.get_or_create(date=date)
            
            # Calculate metrics for the day
            start_datetime = timezone.make_aware(datetime.combine(date, datetime.min.time()))
            end_datetime = start_datetime + timedelta(days=1)
            
            # User metrics
            new_users = User.objects.filter(date_joined__gte=start_datetime, date_joined__lt=end_datetime).count()
            active_users = UserEvent.objects.filter(
                timestamp__gte=start_datetime,
                timestamp__lt=end_datetime
            ).values('user').distinct().count()
            
            # Event metrics
            events_today = UserEvent.objects.filter(
                timestamp__gte=start_datetime,
                timestamp__lt=end_datetime
            )
            
            page_views = events_today.filter(event_type=EventType.PAGE_VIEW).count()
            
            # Update stats
            stats.new_users = new_users
            stats.active_users = active_users
            stats.total_users = User.objects.count()
            stats.total_page_views = page_views
            stats.unique_page_views = events_today.filter(
                event_type=EventType.PAGE_VIEW
            ).values('session_id').distinct().count()
            
            # Calculate other metrics from related apps
            # (This would integrate with bookings, payments, etc.)
            
            stats.save()
            
            return {
                'date': date,
                'stats': stats,
                'created': created
            }
            
        except Exception as e:
            logger.error(f"Error generating daily report: {str(e)}")
            return {'error': 'Failed to generate report'}
    
    @staticmethod
    def generate_weekly_report(end_date=None):
        """Generate weekly analytics report"""
        if not end_date:
            end_date = timezone.now().date()
        
        start_date = end_date - timedelta(days=6)  # 7 days total
        
        try:
            daily_stats = DailyStats.objects.filter(
                date__gte=start_date,
                date__lte=end_date
            ).order_by('date')
            
            # Aggregate weekly metrics
            weekly_report = {
                'period': {'start': start_date, 'end': end_date},
                'summary': {
                    'total_new_users': sum(stat.new_users for stat in daily_stats),
                    'avg_active_users': sum(stat.active_users for stat in daily_stats) / len(daily_stats) if daily_stats else 0,
                    'total_page_views': sum(stat.total_page_views for stat in daily_stats),
                    'total_revenue': sum(stat.gross_revenue for stat in daily_stats),
                    'total_bookings': sum(stat.new_bookings for stat in daily_stats)
                },
                'daily_breakdown': [
                    {
                        'date': stat.date,
                        'new_users': stat.new_users,
                        'active_users': stat.active_users,
                        'page_views': stat.total_page_views,
                        'revenue': float(stat.gross_revenue),
                        'bookings': stat.new_bookings
                    }
                    for stat in daily_stats
                ],
                'top_events': AnalyticsService._get_top_events(start_date, end_date)
            }
            
            return weekly_report
            
        except Exception as e:
            logger.error(f"Error generating weekly report: {str(e)}")
            return {'error': 'Failed to generate weekly report'}
    
    @staticmethod
    def _get_top_events(start_date, end_date):
        """Get top events for period"""
        start_datetime = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
        end_datetime = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))
        
        return list(
            UserEvent.objects.filter(
                timestamp__gte=start_datetime,
                timestamp__lte=end_datetime
            ).values('event_type').annotate(
                count=Count('id')
            ).order_by('-count')[:10]
        )


class PerformanceAnalytics:
    """Performance monitoring and analytics"""
    
    @staticmethod
    def track_performance(endpoint, method, response_time, status_code, 
                         user=None, session_id=None, **kwargs):
        """Track API performance metrics"""
        try:
            PerformanceMetric.objects.create(
                endpoint=endpoint,
                method=method,
                response_time=response_time,
                status_code=status_code,
                user=user,
                session_id=session_id,
                **kwargs
            )
        except Exception as e:
            logger.error(f"Error tracking performance: {str(e)}")
    
    @staticmethod
    def get_performance_report(hours=24):
        """Get performance report for last N hours"""
        start_time = timezone.now() - timedelta(hours=hours)
        
        try:
            metrics = PerformanceMetric.objects.filter(timestamp__gte=start_time)
            
            report = {
                'period_hours': hours,
                'total_requests': metrics.count(),
                'avg_response_time': metrics.aggregate(avg=Avg('response_time'))['avg'] or 0,
                'slowest_endpoints': list(
                    metrics.values('endpoint').annotate(
                        avg_time=Avg('response_time'),
                        request_count=Count('id')
                    ).order_by('-avg_time')[:10]
                ),
                'error_rate': metrics.filter(status_code__gte=400).count() / metrics.count() * 100 if metrics.count() > 0 else 0,
                'status_breakdown': dict(
                    metrics.values('status_code').annotate(
                        count=Count('id')
                    ).values_list('status_code', 'count')
                )
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating performance report: {str(e)}")
            return {'error': 'Failed to generate performance report'}