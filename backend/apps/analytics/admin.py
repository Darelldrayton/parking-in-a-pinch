"""
Analytics Admin
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import (
    UserEvent, DailyStats, UserBehaviorSession, ConversionFunnel,
    RevenueMetrics, UserSegment, CustomMetric, PerformanceMetric
)


@admin.register(UserEvent)
class UserEventAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'user', 'device_type', 'timestamp', 'session_link']
    list_filter = ['event_type', 'device_type', 'browser', 'os', 'timestamp']
    search_fields = ['user__email', 'session_id', 'event_type']
    readonly_fields = ['id', 'timestamp']
    date_hierarchy = 'timestamp'
    
    fieldsets = [
        ('Event Information', {
            'fields': ['id', 'event_type', 'user', 'session_id', 'timestamp']
        }),
        ('Content Object', {
            'fields': ['content_type', 'object_id', 'content_object'],
            'classes': ['collapse']
        }),
        ('Event Data', {
            'fields': ['event_data'],
            'classes': ['collapse']
        }),
        ('Context', {
            'fields': ['ip_address', 'user_agent', 'referer', 'latitude', 'longitude'],
            'classes': ['collapse']
        }),
        ('Device Information', {
            'fields': ['device_type', 'browser', 'os'],
            'classes': ['collapse']
        }),
        ('Performance', {
            'fields': ['processing_time'],
            'classes': ['collapse']
        })
    ]
    
    def session_link(self, obj):
        if obj.session_id:
            try:
                session = UserBehaviorSession.objects.get(session_id=obj.session_id)
                url = reverse('admin:analytics_userbehaviorsession_change', args=[session.pk])
                return format_html('<a href="{}">{}</a>', url, obj.session_id[:8])
            except UserBehaviorSession.DoesNotExist:
                return obj.session_id[:8]
        return '-'
    session_link.short_description = 'Session'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'content_type')


@admin.register(DailyStats)
class DailyStatsAdmin(admin.ModelAdmin):
    list_display = [
        'date', 'new_users', 'active_users', 'new_bookings', 
        'gross_revenue', 'total_page_views', 'updated_at'
    ]
    list_filter = ['date', 'created_at']
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = [
        ('Date', {
            'fields': ['date']
        }),
        ('User Metrics', {
            'fields': ['new_users', 'active_users', 'total_users']
        }),
        ('Listing Metrics', {
            'fields': ['new_listings', 'active_listings', 'total_listings', 'listing_views']
        }),
        ('Booking Metrics', {
            'fields': ['new_bookings', 'confirmed_bookings', 'completed_bookings', 'cancelled_bookings']
        }),
        ('Revenue Metrics', {
            'fields': ['gross_revenue', 'net_revenue', 'platform_fees', 'host_payouts']
        }),
        ('Engagement Metrics', {
            'fields': ['total_page_views', 'unique_page_views', 'avg_session_duration', 'bounce_rate']
        }),
        ('Search & Error Metrics', {
            'fields': ['total_searches', 'successful_searches', 'total_errors', 'critical_errors']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]


@admin.register(UserBehaviorSession)
class UserBehaviorSessionAdmin(admin.ModelAdmin):
    list_display = [
        'session_id_short', 'user', 'started_at', 'duration_display',
        'page_views', 'events_count', 'is_conversion', 'device_type'
    ]
    list_filter = ['device_type', 'browser', 'os', 'is_bounce', 'is_conversion', 'started_at']
    search_fields = ['user__email', 'session_id', 'ip_address']
    readonly_fields = ['id', 'started_at', 'duration_seconds']
    date_hierarchy = 'started_at'
    
    fieldsets = [
        ('Session Information', {
            'fields': ['id', 'session_id', 'user', 'started_at', 'ended_at', 'duration_seconds']
        }),
        ('Navigation', {
            'fields': ['entry_page', 'exit_page', 'referrer']
        }),
        ('Device & Location', {
            'fields': ['ip_address', 'user_agent', 'device_type', 'browser', 'os'],
            'classes': ['collapse']
        }),
        ('Behavior Metrics', {
            'fields': ['page_views', 'events_count', 'conversion_events', 'is_bounce', 'is_conversion']
        })
    ]
    
    def session_id_short(self, obj):
        return obj.session_id[:8] + '...' if len(obj.session_id) > 8 else obj.session_id
    session_id_short.short_description = 'Session ID'
    
    def duration_display(self, obj):
        if obj.duration_seconds:
            minutes = obj.duration_seconds // 60
            seconds = obj.duration_seconds % 60
            return f"{minutes}m {seconds}s"
        return '-'
    duration_display.short_description = 'Duration'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(ConversionFunnel)
class ConversionFunnelAdmin(admin.ModelAdmin):
    list_display = [
        'funnel_name', 'step_name', 'step_order', 'date',
        'total_users', 'completed_users', 'conversion_rate'
    ]
    list_filter = ['funnel_name', 'date', 'step_name']
    search_fields = ['funnel_name', 'step_name']
    date_hierarchy = 'date'
    
    fieldsets = [
        ('Funnel Information', {
            'fields': ['funnel_name', 'step_name', 'step_order', 'date']
        }),
        ('Metrics', {
            'fields': ['total_users', 'completed_users', 'conversion_rate', 'drop_off_rate']
        }),
        ('Segment Data', {
            'fields': ['segment_data'],
            'classes': ['collapse']
        })
    ]


@admin.register(RevenueMetrics)
class RevenueMetricsAdmin(admin.ModelAdmin):
    list_display = [
        'date', 'booking_revenue', 'platform_commission', 'host_payouts',
        'avg_booking_value', 'created_at'
    ]
    list_filter = ['date', 'created_at']
    date_hierarchy = 'date'
    readonly_fields = ['created_at']
    
    fieldsets = [
        ('Date', {
            'fields': ['date']
        }),
        ('Revenue', {
            'fields': ['booking_revenue', 'cancellation_fees', 'subscription_revenue']
        }),
        ('Platform Fees', {
            'fields': ['platform_commission', 'payment_processing_fees']
        }),
        ('Payouts', {
            'fields': ['host_payouts', 'pending_payouts']
        }),
        ('Refunds & Chargebacks', {
            'fields': ['refunds_issued', 'chargebacks']
        }),
        ('Currency & Averages', {
            'fields': ['currency_breakdown', 'avg_booking_value', 'avg_commission_rate'],
            'classes': ['collapse']
        })
    ]


@admin.register(UserSegment)
class UserSegmentAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'user_count', 'active_user_count', 'avg_ltv',
        'conversion_rate', 'is_active', 'last_computed_at'
    ]
    list_filter = ['is_active', 'created_at', 'last_computed_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'last_computed_at']
    
    fieldsets = [
        ('Segment Information', {
            'fields': ['name', 'description', 'is_active']
        }),
        ('Criteria', {
            'fields': ['criteria']
        }),
        ('Computed Metrics', {
            'fields': [
                'user_count', 'active_user_count', 'avg_ltv',
                'avg_session_duration', 'conversion_rate'
            ]
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at', 'last_computed_at'],
            'classes': ['collapse']
        })
    ]


@admin.register(CustomMetric)
class CustomMetricAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'date', 'value', 'unit', 'created_at']
    list_filter = ['category', 'date', 'unit', 'created_at']
    search_fields = ['name', 'category']
    date_hierarchy = 'date'
    
    fieldsets = [
        ('Metric Information', {
            'fields': ['name', 'category', 'date']
        }),
        ('Value', {
            'fields': ['value', 'unit']
        }),
        ('Additional Data', {
            'fields': ['metadata', 'tags'],
            'classes': ['collapse']
        })
    ]


@admin.register(PerformanceMetric)
class PerformanceMetricAdmin(admin.ModelAdmin):
    list_display = [
        'endpoint', 'method', 'response_time', 'status_code',
        'user', 'timestamp'
    ]
    list_filter = ['method', 'status_code', 'timestamp']
    search_fields = ['endpoint', 'user__email']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    fieldsets = [
        ('Request Information', {
            'fields': ['endpoint', 'method', 'timestamp', 'status_code']
        }),
        ('Performance', {
            'fields': ['response_time', 'request_size', 'response_size']
        }),
        ('User Context', {
            'fields': ['user', 'session_id']
        }),
        ('Database & Cache', {
            'fields': ['db_query_count', 'db_query_time', 'cache_hits', 'cache_misses'],
            'classes': ['collapse']
        })
    ]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')