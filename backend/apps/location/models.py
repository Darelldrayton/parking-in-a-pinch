"""
Location Tracking Models
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import uuid

User = get_user_model()


class CheckInStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    VERIFIED = 'verified', 'Verified'
    FAILED = 'failed', 'Failed'
    EXPIRED = 'expired', 'Expired'


class LocationAccuracy(models.TextChoices):
    HIGH = 'high', 'High (< 10m)'
    MEDIUM = 'medium', 'Medium (10-50m)'
    LOW = 'low', 'Low (> 50m)'
    UNKNOWN = 'unknown', 'Unknown'


class CheckInLog(models.Model):
    """Log of user check-ins and check-outs"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='checkin_logs')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, related_name='checkin_logs')
    
    # Check-in type
    type = models.CharField(
        max_length=10,
        choices=[('checkin', 'Check In'), ('checkout', 'Check Out')],
    )
    
    # Location data
    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)
    accuracy = models.FloatField(help_text="GPS accuracy in meters")
    accuracy_level = models.CharField(max_length=10, choices=LocationAccuracy.choices)
    
    # Distance from parking spot
    distance_from_spot = models.FloatField(help_text="Distance in meters from parking spot")
    
    # Verification status
    status = models.CharField(max_length=10, choices=CheckInStatus.choices, default='pending')
    verification_method = models.CharField(
        max_length=20,
        choices=[
            ('gps', 'GPS Location'),
            ('qr_code', 'QR Code'),
            ('manual', 'Manual Override'),
            ('photo', 'Photo Verification')
        ],
        default='gps'
    )
    
    # Device information
    device_info = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Additional verification data
    photos = models.JSONField(default=list, blank=True, help_text="List of photo URLs")
    qr_code_data = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    
    # Timestamps
    attempted_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Admin fields
    verified_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='verified_checkins'
    )
    failure_reason = models.TextField(blank=True)
    
    class Meta:
        db_table = 'checkin_logs'
        ordering = ['-attempted_at']
        indexes = [
            models.Index(fields=['user', 'booking']),
            models.Index(fields=['status', 'attempted_at']),
            models.Index(fields=['type', 'attempted_at']),
        ]
    
    def __str__(self):
        return f"{self.type.title()} by {self.user.email} for booking {self.booking.id}"
    
    def calculate_distance_from_spot(self):
        """Calculate distance from parking spot location"""
        from .utils import calculate_distance
        
        parking_spot = self.booking.listing
        distance = calculate_distance(
            float(self.latitude), float(self.longitude),
            float(parking_spot.latitude), float(parking_spot.longitude)
        )
        
        self.distance_from_spot = distance
        return distance
    
    def is_within_range(self, max_distance=50):
        """Check if check-in is within acceptable range (default 50 meters)"""
        return self.distance_from_spot <= max_distance
    
    def get_accuracy_level(self):
        """Determine accuracy level based on GPS accuracy"""
        if self.accuracy < 10:
            return LocationAccuracy.HIGH
        elif self.accuracy < 50:
            return LocationAccuracy.MEDIUM
        else:
            return LocationAccuracy.LOW
    
    def verify_checkin(self, verified_by=None):
        """Mark check-in as verified"""
        self.status = CheckInStatus.VERIFIED
        self.verified_at = timezone.now()
        if verified_by:
            self.verified_by = verified_by
        self.save()
    
    def fail_checkin(self, reason):
        """Mark check-in as failed"""
        self.status = CheckInStatus.FAILED
        self.failure_reason = reason
        self.save()


class LocationHistory(models.Model):
    """Track user location history for analytics"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='location_history')
    
    # Location data
    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)
    accuracy = models.FloatField()
    
    # Context
    context = models.CharField(
        max_length=20,
        choices=[
            ('search', 'Location Search'),
            ('checkin', 'Check In'),
            ('checkout', 'Check Out'),
            ('navigation', 'Navigation'),
            ('background', 'Background Update')
        ]
    )
    
    # Associated records
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, null=True, blank=True)
    checkin_log = models.ForeignKey(CheckInLog, on_delete=models.CASCADE, null=True, blank=True)
    
    # Device info
    device_info = models.JSONField(default=dict, blank=True)
    
    # Privacy settings
    is_anonymous = models.BooleanField(default=False)
    retention_days = models.IntegerField(default=30)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'location_history'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['context', 'created_at']),
        ]
    
    def __str__(self):
        return f"Location for {self.user.email} at {self.created_at}"


class GeofenceZone(models.Model):
    """Define geofence zones around parking areas"""
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Center point
    center_latitude = models.DecimalField(max_digits=10, decimal_places=8)
    center_longitude = models.DecimalField(max_digits=11, decimal_places=8)
    
    # Zone definition
    radius = models.FloatField(help_text="Radius in meters")
    
    # Zone type
    zone_type = models.CharField(
        max_length=20,
        choices=[
            ('parking_area', 'Parking Area'),
            ('restricted', 'Restricted Zone'),
            ('high_demand', 'High Demand Zone'),
            ('low_signal', 'Low GPS Signal Zone')
        ]
    )
    
    # Settings
    is_active = models.BooleanField(default=True)
    auto_checkin_enabled = models.BooleanField(default=False)
    notification_enabled = models.BooleanField(default=True)
    
    # Associated listings
    listings = models.ManyToManyField('listings.Listing', blank=True, related_name='geofence_zones')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'geofence_zones'
    
    def __str__(self):
        return self.name
    
    def is_point_inside(self, latitude, longitude):
        """Check if a point is inside this geofence zone"""
        from .utils import calculate_distance
        
        distance = calculate_distance(
            float(latitude), float(longitude),
            float(self.center_latitude), float(self.center_longitude)
        )
        
        return distance <= self.radius


class LocationPrivacySettings(models.Model):
    """User privacy settings for location tracking"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='location_privacy')
    
    # Location sharing preferences
    share_location_during_booking = models.BooleanField(default=True)
    share_location_for_analytics = models.BooleanField(default=False)
    allow_geofence_notifications = models.BooleanField(default=True)
    
    # Data retention
    location_history_retention_days = models.IntegerField(default=30)
    auto_delete_enabled = models.BooleanField(default=True)
    
    # Accuracy settings
    required_accuracy_meters = models.IntegerField(default=50)
    allow_low_accuracy_checkin = models.BooleanField(default=False)
    
    # Emergency settings
    share_location_emergency = models.BooleanField(default=True)
    emergency_contacts_can_track = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'location_privacy_settings'
    
    def __str__(self):
        return f"Location privacy for {self.user.email}"


class EmergencyLocationShare(models.Model):
    """Share location with emergency contacts"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_shares')
    emergency_contact = models.ForeignKey(
        'users.EmergencyContact', 
        on_delete=models.CASCADE,
        related_name='location_shares'
    )
    
    # Share details
    is_active = models.BooleanField(default=True)
    share_type = models.CharField(
        max_length=20,
        choices=[
            ('temporary', 'Temporary (During Booking)'),
            ('emergency', 'Emergency Only'),
            ('continuous', 'Continuous Sharing')
        ]
    )
    
    # Duration
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Associated booking (for temporary shares)
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, null=True, blank=True)
    
    # Last location shared
    last_shared_at = models.DateTimeField(null=True, blank=True)
    last_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    last_longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'emergency_location_shares'
        unique_together = ['user', 'emergency_contact']
    
    def __str__(self):
        return f"Location share: {self.user.email} → {self.emergency_contact.name}"
    
    def is_expired(self):
        """Check if location share has expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    def update_location(self, latitude, longitude):
        """Update shared location"""
        self.last_latitude = latitude
        self.last_longitude = longitude
        self.last_shared_at = timezone.now()
        self.save()