"""
Analytics Serializers
"""
from rest_framework import serializers
from .models import (
    UserEvent, DailyStats, UserBehaviorSession, ConversionFunnel,
    RevenueMetrics, UserSegment, CustomMetric, PerformanceMetric
)


class UserEventSerializer(serializers.ModelSerializer):
    """Serializer for user events"""
    
    class Meta:
        model = UserEvent
        fields = [
            'id', 'user', 'session_id', 'event_type', 'event_data',
            'ip_address', 'device_type', 'browser', 'os',
            'timestamp', 'processing_time'
        ]
        read_only_fields = ['id', 'timestamp']


class TrackEventSerializer(serializers.Serializer):
    """Serializer for tracking new events"""
    
    event_type = serializers.CharField(max_length=50)
    event_data = serializers.JSONField(required=False, default=dict)
    content_type = serializers.CharField(required=False)
    object_id = serializers.CharField(required=False)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=8, required=False)
    longitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=False)


class DailyStatsSerializer(serializers.ModelSerializer):
    """Serializer for daily statistics"""
    
    class Meta:
        model = DailyStats
        fields = [
            'date', 'new_users', 'active_users', 'total_users',
            'new_listings', 'active_listings', 'total_listings', 'listing_views',
            'new_bookings', 'confirmed_bookings', 'completed_bookings', 'cancelled_bookings',
            'gross_revenue', 'net_revenue', 'platform_fees', 'host_payouts',
            'total_page_views', 'unique_page_views', 'avg_session_duration', 'bounce_rate',
            'total_searches', 'successful_searches', 'total_errors', 'critical_errors'
        ]


class UserBehaviorSessionSerializer(serializers.ModelSerializer):
    """Serializer for user behavior sessions"""
    
    class Meta:
        model = UserBehaviorSession
        fields = [
            'id', 'user', 'session_id', 'started_at', 'ended_at', 'duration_seconds',
            'entry_page', 'exit_page', 'referrer', 'device_type', 'browser', 'os',
            'page_views', 'events_count', 'conversion_events', 'is_bounce', 'is_conversion'
        ]


class ConversionFunnelSerializer(serializers.ModelSerializer):
    """Serializer for conversion funnel data"""
    
    class Meta:
        model = ConversionFunnel
        fields = [
            'funnel_name', 'step_name', 'step_order', 'date',
            'total_users', 'completed_users', 'conversion_rate', 'drop_off_rate',
            'segment_data'
        ]


class RevenueMetricsSerializer(serializers.ModelSerializer):
    """Serializer for revenue metrics"""
    
    class Meta:
        model = RevenueMetrics
        fields = [
            'date', 'booking_revenue', 'cancellation_fees', 'platform_commission',
            'payment_processing_fees', 'host_payouts', 'pending_payouts',
            'refunds_issued', 'chargebacks', 'subscription_revenue',
            'currency_breakdown', 'avg_booking_value', 'avg_commission_rate'
        ]


class UserSegmentSerializer(serializers.ModelSerializer):
    """Serializer for user segments"""
    
    class Meta:
        model = UserSegment
        fields = [
            'id', 'name', 'description', 'criteria', 'user_count',
            'active_user_count', 'avg_ltv', 'avg_session_duration',
            'conversion_rate', 'is_active', 'created_at', 'updated_at',
            'last_computed_at'
        ]


class CustomMetricSerializer(serializers.ModelSerializer):
    """Serializer for custom metrics"""
    
    class Meta:
        model = CustomMetric
        fields = [
            'name', 'category', 'date', 'value', 'unit',
            'metadata', 'tags', 'created_at'
        ]


class PerformanceMetricSerializer(serializers.ModelSerializer):
    """Serializer for performance metrics"""
    
    class Meta:
        model = PerformanceMetric
        fields = [
            'endpoint', 'method', 'timestamp', 'response_time', 'status_code',
            'request_size', 'response_size', 'user', 'session_id',
            'db_query_count', 'db_query_time', 'cache_hits', 'cache_misses'
        ]


class DashboardMetricsSerializer(serializers.Serializer):
    """Serializer for dashboard metrics response"""
    
    current = serializers.DictField()
    trends = serializers.DictField(required=False)
    charts = serializers.DictField(required=False)
    user = serializers.DictField(required=False)


class UserAnalyticsSerializer(serializers.Serializer):
    """Serializer for user analytics response"""
    
    user_id = serializers.UUIDField()
    period = serializers.DictField()
    overview = serializers.DictField()
    activity_by_type = serializers.DictField()
    device_breakdown = serializers.DictField()
    conversion_events = serializers.IntegerField()


class FunnelDataSerializer(serializers.Serializer):
    """Serializer for funnel data response"""
    
    funnel_name = serializers.CharField()
    period = serializers.DictField()
    steps = serializers.DictField()


class PerformanceReportSerializer(serializers.Serializer):
    """Serializer for performance report response"""
    
    period_hours = serializers.IntegerField()
    total_requests = serializers.IntegerField()
    avg_response_time = serializers.FloatField()
    slowest_endpoints = serializers.ListField()
    error_rate = serializers.FloatField()
    status_breakdown = serializers.DictField()


class WeeklyReportSerializer(serializers.Serializer):
    """Serializer for weekly report response"""
    
    period = serializers.DictField()
    summary = serializers.DictField()
    daily_breakdown = serializers.ListField()
    top_events = serializers.ListField()


class AnalyticsQuerySerializer(serializers.Serializer):
    """Serializer for analytics query parameters"""
    
    date_range = serializers.IntegerField(default=30, min_value=1, max_value=365)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    event_types = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    user_segments = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    device_types = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    group_by = serializers.ChoiceField(
        choices=['day', 'week', 'month', 'event_type', 'device_type'],
        default='day'
    )