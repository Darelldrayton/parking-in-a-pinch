"""
Analytics API Views
"""
import logging
from datetime import datetime, timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.shortcuts import get_object_or_404

from .models import (
    UserEvent, DailyStats, UserBehaviorSession, ConversionFunnel,
    RevenueMetrics, UserSegment, CustomMetric, PerformanceMetric
)
from .serializers import (
    UserEventSerializer, TrackEventSerializer, DailyStatsSerializer,
    UserBehaviorSessionSerializer, ConversionFunnelSerializer,
    RevenueMetricsSerializer, UserSegmentSerializer, CustomMetricSerializer,
    PerformanceMetricSerializer, DashboardMetricsSerializer,
    UserAnalyticsSerializer, FunnelDataSerializer, PerformanceReportSerializer,
    WeeklyReportSerializer, AnalyticsQuerySerializer
)
from .services import EventTracker, AnalyticsService, ReportGenerator, PerformanceAnalytics

User = get_user_model()
logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_event(request):
    """Track a user event"""
    try:
        serializer = TrackEventSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = serializer.validated_data
        
        # Get content object if specified
        content_object = None
        if data.get('content_type') and data.get('object_id'):
            try:
                content_type = ContentType.objects.get(model=data['content_type'])
                model_class = content_type.model_class()
                content_object = model_class.objects.get(pk=data['object_id'])
            except Exception as e:
                logger.warning(f"Could not find content object: {str(e)}")
        
        # Track event
        event = EventTracker.track_event(
            event_type=data['event_type'],
            user=request.user,
            content_object=content_object,
            event_data=data.get('event_data', {}),
            request=request,
            latitude=data.get('latitude'),
            longitude=data.get('longitude')
        )
        
        if event:
            return Response({
                'success': True,
                'event_id': str(event.id),
                'message': 'Event tracked successfully'
            })
        else:
            return Response({
                'success': False,
                'message': 'Failed to track event'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"Error tracking event: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to track event'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_metrics(request):
    """Get dashboard analytics metrics"""
    try:
        date_range = int(request.GET.get('date_range', 30))
        include_user_metrics = request.GET.get('include_user', 'false').lower() == 'true'
        
        user = request.user if include_user_metrics else None
        metrics = AnalyticsService.get_dashboard_metrics(user=user, date_range=date_range)
        
        if 'error' in metrics:
            return Response(
                {'error': metrics['error']},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        serializer = DashboardMetricsSerializer(metrics)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error getting dashboard metrics: {str(e)}")
        return Response(
            {'error': 'Failed to load dashboard metrics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_analytics(request, user_id=None):
    """Get user analytics data"""
    try:
        # Users can only view their own analytics unless they're admin
        if user_id and str(user_id) != str(request.user.id):
            if not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        target_user_id = user_id or request.user.id
        date_range = int(request.GET.get('date_range', 30))
        
        analytics = AnalyticsService.get_user_analytics(target_user_id, date_range)
        
        if 'error' in analytics:
            return Response(
                {'error': analytics['error']},
                status=status.HTTP_404_NOT_FOUND if analytics['error'] == 'User not found' else status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        serializer = UserAnalyticsSerializer(analytics)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error getting user analytics: {str(e)}")
        return Response(
            {'error': 'Failed to load user analytics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_events(request):
    """Get current user's events"""
    try:
        date_range = int(request.GET.get('date_range', 30))
        event_type = request.GET.get('event_type')
        limit = int(request.GET.get('limit', 50))
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=date_range)
        
        events = UserEvent.objects.filter(
            user=request.user,
            timestamp__gte=start_date
        )
        
        if event_type:
            events = events.filter(event_type=event_type)
        
        events = events.order_by('-timestamp')[:limit]
        
        serializer = UserEventSerializer(events, many=True)
        
        return Response({
            'events': serializer.data,
            'total_count': events.count(),
            'period': {
                'start': start_date.date(),
                'end': end_date.date(),
                'days': date_range
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting user events: {str(e)}")
        return Response(
            {'error': 'Failed to load events'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_sessions(request):
    """Get current user's sessions"""
    try:
        date_range = int(request.GET.get('date_range', 30))
        limit = int(request.GET.get('limit', 20))
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=date_range)
        
        sessions = UserBehaviorSession.objects.filter(
            user=request.user,
            started_at__gte=start_date
        ).order_by('-started_at')[:limit]
        
        serializer = UserBehaviorSessionSerializer(sessions, many=True)
        
        return Response({
            'sessions': serializer.data,
            'total_count': sessions.count()
        })
        
    except Exception as e:
        logger.error(f"Error getting user sessions: {str(e)}")
        return Response(
            {'error': 'Failed to load sessions'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def daily_stats(request):
    """Get daily statistics (admin only)"""
    try:
        days = int(request.GET.get('days', 30))
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days-1)
        
        stats = DailyStats.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).order_by('-date')
        
        serializer = DailyStatsSerializer(stats, many=True)
        
        return Response({
            'daily_stats': serializer.data,
            'period': {
                'start': start_date,
                'end': end_date,
                'days': days
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting daily stats: {str(e)}")
        return Response(
            {'error': 'Failed to load daily statistics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def conversion_funnel(request, funnel_name):
    """Get conversion funnel data (admin only)"""
    try:
        date_range = int(request.GET.get('date_range', 30))
        
        funnel_data = AnalyticsService.get_conversion_funnel_data(funnel_name, date_range)
        
        if 'error' in funnel_data:
            return Response(
                {'error': funnel_data['error']},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        serializer = FunnelDataSerializer(funnel_data)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error getting funnel data: {str(e)}")
        return Response(
            {'error': 'Failed to load funnel data'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def revenue_metrics(request):
    """Get revenue metrics (admin only)"""
    try:
        days = int(request.GET.get('days', 30))
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days-1)
        
        metrics = RevenueMetrics.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        ).order_by('-date')
        
        serializer = RevenueMetricsSerializer(metrics, many=True)
        
        return Response({
            'revenue_metrics': serializer.data,
            'period': {
                'start': start_date,
                'end': end_date,
                'days': days
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting revenue metrics: {str(e)}")
        return Response(
            {'error': 'Failed to load revenue metrics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_segments(request):
    """Get user segments (admin only)"""
    try:
        segments = UserSegment.objects.filter(is_active=True).order_by('name')
        
        serializer = UserSegmentSerializer(segments, many=True)
        
        return Response({
            'segments': serializer.data
        })
        
    except Exception as e:
        logger.error(f"Error getting user segments: {str(e)}")
        return Response(
            {'error': 'Failed to load user segments'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def performance_report(request):
    """Get performance report (admin only)"""
    try:
        hours = int(request.GET.get('hours', 24))
        
        report = PerformanceAnalytics.get_performance_report(hours)
        
        if 'error' in report:
            return Response(
                {'error': report['error']},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        serializer = PerformanceReportSerializer(report)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error getting performance report: {str(e)}")
        return Response(
            {'error': 'Failed to load performance report'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def weekly_report(request):
    """Generate and get weekly report (admin only)"""
    try:
        end_date_str = request.GET.get('end_date')
        
        if end_date_str:
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        else:
            end_date = timezone.now().date()
        
        report = ReportGenerator.generate_weekly_report(end_date)
        
        if 'error' in report:
            return Response(
                {'error': report['error']},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        serializer = WeeklyReportSerializer(report)
        return Response(serializer.data)
        
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error generating weekly report: {str(e)}")
        return Response(
            {'error': 'Failed to generate weekly report'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def generate_daily_report(request):
    """Generate daily report (admin only)"""
    try:
        date_str = request.data.get('date')
        
        if date_str:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date = timezone.now().date()
        
        result = ReportGenerator.generate_daily_report(date)
        
        if 'error' in result:
            return Response(
                {'error': result['error']},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            'success': True,
            'date': result['date'],
            'created': result['created'],
            'message': f"Daily report {'created' if result['created'] else 'updated'} for {result['date']}"
        })
        
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error generating daily report: {str(e)}")
        return Response(
            {'error': 'Failed to generate daily report'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def custom_metrics(request):
    """Get custom metrics (admin only)"""
    try:
        category = request.GET.get('category')
        days = int(request.GET.get('days', 30))
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days-1)
        
        metrics = CustomMetric.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        )
        
        if category:
            metrics = metrics.filter(category=category)
        
        metrics = metrics.order_by('-date', 'name')
        
        serializer = CustomMetricSerializer(metrics, many=True)
        
        return Response({
            'custom_metrics': serializer.data,
            'period': {
                'start': start_date,
                'end': end_date,
                'days': days
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting custom metrics: {str(e)}")
        return Response(
            {'error': 'Failed to load custom metrics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_custom_metric(request):
    """Create custom metric (admin only)"""
    try:
        serializer = CustomMetricSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        metric = serializer.save()
        
        return Response({
            'success': True,
            'metric_id': metric.id,
            'message': 'Custom metric created successfully'
        })
        
    except Exception as e:
        logger.error(f"Error creating custom metric: {str(e)}")
        return Response(
            {'error': 'Failed to create custom metric'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_overview(request):
    """Get analytics overview for current user"""
    try:
        # Basic overview that regular users can see
        date_range = int(request.GET.get('date_range', 30))
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=date_range)
        
        user_events = UserEvent.objects.filter(
            user=request.user,
            timestamp__gte=start_date
        )
        
        user_sessions = UserBehaviorSession.objects.filter(
            user=request.user,
            started_at__gte=start_date
        )
        
        overview = {
            'period': {
                'start': start_date.date(),
                'end': end_date.date(),
                'days': date_range
            },
            'summary': {
                'total_events': user_events.count(),
                'total_sessions': user_sessions.count(),
                'avg_session_duration': user_sessions.aggregate(avg=models.Avg('duration_seconds'))['avg'] or 0,
                'most_active_day': None,
                'favorite_features': []
            },
            'activity_timeline': [],
            'device_usage': dict(
                user_events.values('device_type').annotate(
                    count=models.Count('id')
                ).values_list('device_type', 'count')
            )
        }
        
        # Get daily activity
        from django.db.models import Count
        daily_activity = user_events.extra(
            select={'day': 'date(timestamp)'}
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')
        
        overview['activity_timeline'] = [
            {'date': item['day'], 'events': item['count']}
            for item in daily_activity
        ]
        
        # Most active day
        if daily_activity:
            most_active = max(daily_activity, key=lambda x: x['count'])
            overview['summary']['most_active_day'] = most_active['day']
        
        # Favorite features (top event types)
        favorite_features = user_events.values('event_type').annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        overview['summary']['favorite_features'] = [
            {'feature': item['event_type'], 'usage_count': item['count']}
            for item in favorite_features
        ]
        
        return Response(overview)
        
    except Exception as e:
        logger.error(f"Error getting analytics overview: {str(e)}")
        return Response(
            {'error': 'Failed to load analytics overview'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )