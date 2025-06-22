"""
Notification Models
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class NotificationChannel(models.TextChoices):
    EMAIL = 'email', 'Email'
    SMS = 'sms', 'SMS'
    PUSH = 'push', 'Push Notification'
    IN_APP = 'in_app', 'In-App Notification'


class NotificationCategory(models.TextChoices):
    BOOKING = 'booking', 'Booking'
    PAYMENT = 'payment', 'Payment'
    REMINDER = 'reminder', 'Reminder'
    EMERGENCY = 'emergency', 'Emergency'
    MARKETING = 'marketing', 'Marketing'
    SYSTEM = 'system', 'System'
    MESSAGE = 'message', 'Message'


class NotificationStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    SENT = 'sent', 'Sent'
    DELIVERED = 'delivered', 'Delivered'
    FAILED = 'failed', 'Failed'
    READ = 'read', 'Read'


class NotificationTemplate(models.Model):
    """Template for notifications"""
    
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=NotificationCategory.choices)
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices)
    
    # Template content
    subject_template = models.CharField(max_length=200, blank=True)
    content_template = models.TextField()
    html_template = models.TextField(blank=True)  # For emails
    
    # Variables used in template
    variables = models.JSONField(default=list, help_text="List of variables used in template")
    
    # Settings
    is_active = models.BooleanField(default=True)
    priority = models.CharField(
        max_length=10,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')],
        default='medium'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_templates'
        unique_together = ['name', 'channel']
    
    def __str__(self):
        return f"{self.name} ({self.channel})"


class NotificationPreference(models.Model):
    """User notification preferences"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Email preferences
    email_enabled = models.BooleanField(default=True)
    email_address = models.EmailField(blank=True)
    email_verified = models.BooleanField(default=False)
    
    # SMS preferences
    sms_enabled = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=20, blank=True)
    phone_verified = models.BooleanField(default=False)
    
    # Push notification preferences
    push_notifications = models.BooleanField(default=True)
    
    # Category preferences
    booking_notifications = models.BooleanField(default=True)
    payment_notifications = models.BooleanField(default=True)
    reminder_notifications = models.BooleanField(default=True)
    emergency_notifications = models.BooleanField(default=True)
    marketing_notifications = models.BooleanField(default=False)
    system_notifications = models.BooleanField(default=True)
    message_notifications = models.BooleanField(default=True)
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_hours_start = models.TimeField(default='22:00')
    quiet_hours_end = models.TimeField(default='08:00')
    timezone = models.CharField(max_length=50, default='UTC')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.email}"
    
    def is_quiet_hours(self):
        """Check if current time is within quiet hours"""
        if not self.quiet_hours_enabled:
            return False
        
        import pytz
        from datetime import datetime
        
        try:
            tz = pytz.timezone(self.timezone)
            now = datetime.now(tz).time()
            
            if self.quiet_hours_start <= self.quiet_hours_end:
                return self.quiet_hours_start <= now <= self.quiet_hours_end
            else:
                return now >= self.quiet_hours_start or now <= self.quiet_hours_end
        except:
            return False


class Notification(models.Model):
    """Individual notification instance"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    template = models.ForeignKey(NotificationTemplate, on_delete=models.CASCADE, null=True, blank=True)
    
    # Notification details
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices)
    category = models.CharField(max_length=20, choices=NotificationCategory.choices)
    priority = models.CharField(
        max_length=10,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')],
        default='medium'
    )
    
    # Content
    subject = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    html_content = models.TextField(blank=True)
    
    # Delivery details
    recipient = models.CharField(max_length=200)  # Email or phone number
    status = models.CharField(max_length=20, choices=NotificationStatus.choices, default='pending')
    
    # External service details
    external_id = models.CharField(max_length=200, blank=True)  # Twilio SID, etc.
    external_status = models.CharField(max_length=50, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    variables = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    
    # Error details
    error_message = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['channel', 'status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.channel} to {self.user.email}: {self.subject[:50]}"
    
    def mark_sent(self, external_id=None):
        """Mark notification as sent"""
        self.status = NotificationStatus.SENT
        self.sent_at = timezone.now()
        if external_id:
            self.external_id = external_id
        self.save()
    
    def mark_delivered(self):
        """Mark notification as delivered"""
        self.status = NotificationStatus.DELIVERED
        self.delivered_at = timezone.now()
        self.save()
    
    def mark_failed(self, error_message):
        """Mark notification as failed"""
        self.status = NotificationStatus.FAILED
        self.failed_at = timezone.now()
        self.error_message = error_message
        self.retry_count += 1
        self.save()
    
    def mark_read(self):
        """Mark notification as read"""
        self.status = NotificationStatus.READ
        self.read_at = timezone.now()
        self.save()
    
    def can_retry(self):
        """Check if notification can be retried"""
        return self.retry_count < self.max_retries and self.status == NotificationStatus.FAILED


class PushSubscription(models.Model):
    """Push notification subscription"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_subscriptions')
    
    # Web Push subscription data
    endpoint = models.URLField()
    p256dh_key = models.TextField()
    auth_key = models.TextField()
    
    # Device/browser info
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.JSONField(default=dict, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'push_subscriptions'
        unique_together = ['user', 'endpoint']
    
    def __str__(self):
        return f"Push subscription for {self.user.email}"
    
    @property
    def subscription_info(self):
        """Get subscription info for web push"""
        return {
            'endpoint': self.endpoint,
            'keys': {
                'p256dh': self.p256dh_key,
                'auth': self.auth_key
            }
        }