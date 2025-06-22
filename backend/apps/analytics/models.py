"""
Analytics Models
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
import uuid

User = get_user_model()


class EventType(models.TextChoices):
    USER_REGISTRATION = 'user_registration', 'User Registration'
    USER_LOGIN = 'user_login', 'User Login'
    USER_LOGOUT = 'user_logout', 'User Logout'
    PROFILE_UPDATE = 'profile_update', 'Profile Update'
    
    LISTING_VIEW = 'listing_view', 'Listing View'
    LISTING_CREATE = 'listing_create', 'Listing Create'
    LISTING_UPDATE = 'listing_update', 'Listing Update'
    LISTING_DELETE = 'listing_delete', 'Listing Delete'
    LISTING_FAVORITE = 'listing_favorite', 'Listing Favorite'
    
    BOOKING_CREATED = 'booking_created', 'Booking Created'
    BOOKING_CONFIRMED = 'booking_confirmed', 'Booking Confirmed'
    BOOKING_CANCELLED = 'booking_cancelled', 'Booking Cancelled'
    BOOKING_COMPLETED = 'booking_completed', 'Booking Completed'
    BOOKING_CHECKIN = 'booking_checkin', 'Booking Check-in'
    BOOKING_CHECKOUT = 'booking_checkout', 'Booking Check-out'
    
    PAYMENT_INITIATED = 'payment_initiated', 'Payment Initiated'
    PAYMENT_COMPLETED = 'payment_completed', 'Payment Completed'
    PAYMENT_FAILED = 'payment_failed', 'Payment Failed'
    PAYMENT_REFUNDED = 'payment_refunded', 'Payment Refunded'
    
    SEARCH_PERFORMED = 'search_performed', 'Search Performed'
    FILTER_APPLIED = 'filter_applied', 'Filter Applied'
    
    MESSAGE_SENT = 'message_sent', 'Message Sent'
    REVIEW_SUBMITTED = 'review_submitted', 'Review Submitted'
    
    QR_CODE_GENERATED = 'qr_code_generated', 'QR Code Generated'
    QR_CODE_SCANNED = 'qr_code_scanned', 'QR Code Scanned'
    
    ERROR_OCCURRED = 'error_occurred', 'Error Occurred'
    PAGE_VIEW = 'page_view', 'Page View'
    FEATURE_USAGE = 'feature_usage', 'Feature Usage'


class UserEvent(models.Model):
    """Track user events and interactions"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Event details
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events', null=True, blank=True)
    session_id = models.CharField(max_length=255, db_index=True)
    event_type = models.CharField(max_length=50, choices=EventType.choices, db_index=True)
    
    # Related object (generic foreign key)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.CharField(max_length=255, null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Event data
    event_data = models.JSONField(default=dict, blank=True)
    
    # Context information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referer = models.URLField(blank=True)
    
    # Location data
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
    # Device information
    device_type = models.CharField(max_length=50, blank=True)  # mobile, tablet, desktop
    browser = models.CharField(max_length=100, blank=True)
    os = models.CharField(max_length=100, blank=True)
    
    # Timing
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    processing_time = models.FloatField(null=True, blank=True, help_text="Processing time in milliseconds")
    
    class Meta:
        db_table = 'user_events'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'event_type']),
            models.Index(fields=['session_id', 'timestamp']),
            models.Index(fields=['event_type', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        user_id = self.user.id if self.user else 'Anonymous'
        return f"Event: {self.event_type} by {user_id} at {self.timestamp}"


class DailyStats(models.Model):
    """Daily aggregated statistics"""
    
    date = models.DateField(unique=True, db_index=True)
    
    # User metrics
    new_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)
    total_users = models.IntegerField(default=0)
    
    # Listing metrics
    new_listings = models.IntegerField(default=0)
    active_listings = models.IntegerField(default=0)
    total_listings = models.IntegerField(default=0)
    listing_views = models.IntegerField(default=0)
    
    # Booking metrics
    new_bookings = models.IntegerField(default=0)
    confirmed_bookings = models.IntegerField(default=0)
    completed_bookings = models.IntegerField(default=0)
    cancelled_bookings = models.IntegerField(default=0)
    
    # Revenue metrics
    gross_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    platform_fees = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    host_payouts = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Engagement metrics
    total_page_views = models.IntegerField(default=0)
    unique_page_views = models.IntegerField(default=0)
    avg_session_duration = models.FloatField(default=0)
    bounce_rate = models.FloatField(default=0)
    
    # Search metrics
    total_searches = models.IntegerField(default=0)
    successful_searches = models.IntegerField(default=0)
    
    # Error metrics
    total_errors = models.IntegerField(default=0)
    critical_errors = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'daily_stats'
        ordering = ['-date']
    
    def __str__(self):
        return f"Daily Stats for {self.date}"


class UserBehaviorSession(models.Model):
    """Track user session behavior and flow"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions', null=True, blank=True)
    session_id = models.CharField(max_length=255, unique=True, db_index=True)
    
    # Session details
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    
    # Entry/exit
    entry_page = models.URLField(blank=True)
    exit_page = models.URLField(blank=True)
    referrer = models.URLField(blank=True)
    
    # Device/location
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    device_type = models.CharField(max_length=50, blank=True)
    browser = models.CharField(max_length=100, blank=True)
    os = models.CharField(max_length=100, blank=True)
    
    # Behavior metrics
    page_views = models.IntegerField(default=0)
    events_count = models.IntegerField(default=0)
    conversion_events = models.JSONField(default=list, blank=True)
    
    # Flags
    is_bounce = models.BooleanField(default=False)
    is_conversion = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'user_behavior_sessions'
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', 'started_at']),
            models.Index(fields=['session_id']),
        ]
    
    def __str__(self):
        user_id = self.user.id if self.user else 'Anonymous'
        return f"Session {self.session_id[:8]} by {user_id}"


class ConversionFunnel(models.Model):
    """Track conversion funnel metrics"""
    
    funnel_name = models.CharField(max_length=100, db_index=True)
    step_name = models.CharField(max_length=100)
    step_order = models.IntegerField()
    
    date = models.DateField(db_index=True)
    
    # Metrics
    total_users = models.IntegerField(default=0)
    completed_users = models.IntegerField(default=0)
    conversion_rate = models.FloatField(default=0)
    drop_off_rate = models.FloatField(default=0)
    
    # Segment data
    segment_data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'conversion_funnels'
        unique_together = ['funnel_name', 'step_name', 'date']
        ordering = ['funnel_name', 'step_order', '-date']
    
    def __str__(self):
        return f"{self.funnel_name} - {self.step_name} ({self.date})"


class RevenueMetrics(models.Model):
    """Detailed revenue and financial metrics"""
    
    date = models.DateField(db_index=True)
    
    # Booking revenue
    booking_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cancellation_fees = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Platform fees
    platform_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_processing_fees = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Host payouts
    host_payouts = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pending_payouts = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Refunds and chargebacks
    refunds_issued = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    chargebacks = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Subscription revenue (if applicable)
    subscription_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Metrics by currency
    currency_breakdown = models.JSONField(default=dict, blank=True)
    
    # Average values
    avg_booking_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    avg_commission_rate = models.FloatField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'revenue_metrics'
        unique_together = ['date']
        ordering = ['-date']
    
    def __str__(self):
        return f"Revenue Metrics for {self.date}"


class UserSegment(models.Model):
    """User segmentation for analytics"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Segment criteria
    criteria = models.JSONField(help_text="JSON criteria for segment membership")
    
    # Computed metrics
    user_count = models.IntegerField(default=0)
    active_user_count = models.IntegerField(default=0)
    avg_ltv = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    avg_session_duration = models.FloatField(default=0)
    conversion_rate = models.FloatField(default=0)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_computed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_segments'
        ordering = ['name']
    
    def __str__(self):
        return f"Segment: {self.name} ({self.user_count} users)"


class CustomMetric(models.Model):
    """Custom business metrics tracking"""
    
    name = models.CharField(max_length=100, db_index=True)
    category = models.CharField(max_length=50, db_index=True)
    
    date = models.DateField(db_index=True)
    
    # Metric values
    value = models.FloatField()
    unit = models.CharField(max_length=50, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'custom_metrics'
        unique_together = ['name', 'date']
        ordering = ['-date', 'name']
        indexes = [
            models.Index(fields=['name', 'date']),
            models.Index(fields=['category', 'date']),
        ]
    
    def __str__(self):
        return f"{self.name}: {self.value} {self.unit} ({self.date})"


class PerformanceMetric(models.Model):
    """Application performance metrics"""
    
    endpoint = models.CharField(max_length=200, db_index=True)
    method = models.CharField(max_length=10)
    
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Performance data
    response_time = models.FloatField()  # milliseconds
    status_code = models.IntegerField()
    
    # Request data
    request_size = models.IntegerField(null=True, blank=True)  # bytes
    response_size = models.IntegerField(null=True, blank=True)  # bytes
    
    # User context
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=255, blank=True)
    
    # Additional metrics
    db_query_count = models.IntegerField(null=True, blank=True)
    db_query_time = models.FloatField(null=True, blank=True)
    cache_hits = models.IntegerField(null=True, blank=True)
    cache_misses = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'performance_metrics'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['endpoint', 'timestamp']),
            models.Index(fields=['status_code', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.method} {self.endpoint} - {self.response_time}ms"