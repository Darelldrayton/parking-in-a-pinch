"""
Analytics URLs
"""
from django.urls import path
from . import api_views

app_name = 'analytics'

urlpatterns = [
    # Event tracking
    path('track/', api_views.track_event, name='track_event'),
    
    # User analytics
    path('dashboard/', api_views.dashboard_metrics, name='dashboard_metrics'),
    path('overview/', api_views.analytics_overview, name='analytics_overview'),
    path('my-events/', api_views.my_events, name='my_events'),
    path('my-sessions/', api_views.my_sessions, name='my_sessions'),
    path('user/<uuid:user_id>/', api_views.user_analytics, name='user_analytics'),
    
    # Admin analytics
    path('admin/daily-stats/', api_views.daily_stats, name='daily_stats'),
    path('admin/revenue/', api_views.revenue_metrics, name='revenue_metrics'),
    path('admin/performance/', api_views.performance_report, name='performance_report'),
    path('admin/segments/', api_views.user_segments, name='user_segments'),
    path('admin/funnel/<str:funnel_name>/', api_views.conversion_funnel, name='conversion_funnel'),
    
    # Reports
    path('admin/reports/daily/', api_views.generate_daily_report, name='generate_daily_report'),
    path('admin/reports/weekly/', api_views.weekly_report, name='weekly_report'),
    
    # Custom metrics
    path('admin/metrics/', api_views.custom_metrics, name='custom_metrics'),
    path('admin/metrics/create/', api_views.create_custom_metric, name='create_custom_metric'),
]