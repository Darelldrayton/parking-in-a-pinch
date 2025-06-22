"""
QR Code Models
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid
import secrets

User = get_user_model()


class QRCodeType(models.TextChoices):
    CHECKIN = 'checkin', 'Check-in'
    CHECKOUT = 'checkout', 'Check-out'
    LISTING_INFO = 'listing_info', 'Listing Information'
    EMERGENCY = 'emergency', 'Emergency Contact'
    PAYMENT = 'payment', 'Payment'


class QRCodeStatus(models.TextChoices):
    ACTIVE = 'active', 'Active'
    USED = 'used', 'Used'
    EXPIRED = 'expired', 'Expired'
    REVOKED = 'revoked', 'Revoked'


class QRCode(models.Model):
    """QR Code generation and tracking"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # QR Code details
    token = models.CharField(max_length=64, unique=True, db_index=True)
    qr_type = models.CharField(max_length=20, choices=QRCodeType.choices)
    status = models.CharField(max_length=10, choices=QRCodeStatus.choices, default='active')
    
    # Associated records
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='qr_codes')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.CASCADE, null=True, blank=True)
    listing = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, null=True, blank=True)
    
    # QR Code data
    data = models.JSONField(default=dict, help_text="Additional data encoded in QR code")
    verification_url = models.URLField(blank=True)
    
    # Security settings
    single_use = models.BooleanField(default=True)
    max_uses = models.IntegerField(default=1)
    current_uses = models.IntegerField(default=0)
    
    # Expiration
    expires_at = models.DateTimeField()
    auto_expire_after_use = models.BooleanField(default=True)
    
    # Location restrictions
    location_restricted = models.BooleanField(default=False)
    allowed_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    allowed_longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    allowed_radius = models.FloatField(default=100, help_text="Allowed radius in meters")
    
    # Usage tracking
    generated_at = models.DateTimeField(auto_now_add=True)
    first_used_at = models.DateTimeField(null=True, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    # Device/IP restrictions
    allowed_ip_addresses = models.JSONField(default=list, blank=True)
    device_fingerprint = models.CharField(max_length=255, blank=True)
    
    class Meta:
        db_table = 'qr_codes'
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'qr_type']),
            models.Index(fields=['status', 'expires_at']),
        ]
    
    def __str__(self):
        return f"QR Code {self.token[:8]}... ({self.qr_type})"
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = self.generate_secure_token()
        if not self.verification_url:
            self.verification_url = self.generate_verification_url()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_secure_token():
        """Generate a cryptographically secure token"""
        return secrets.token_urlsafe(32)
    
    def generate_verification_url(self):
        """Generate verification URL for QR code"""
        from django.conf import settings
        base_url = getattr(settings, 'FRONTEND_URL', 'https://parkinginapinch.com')
        return f"{base_url}/verify-qr/{self.token}"
    
    def is_valid(self):
        """Check if QR code is valid for use"""
        now = timezone.now()
        
        # Check expiration
        if now > self.expires_at:
            if self.status == QRCodeStatus.ACTIVE:
                self.status = QRCodeStatus.EXPIRED
                self.save()
            return False
        
        # Check status
        if self.status != QRCodeStatus.ACTIVE:
            return False
        
        # Check usage limits
        if self.single_use and self.current_uses > 0:
            return False
        
        if self.current_uses >= self.max_uses:
            return False
        
        return True
    
    def use_code(self, user_location=None, ip_address=None, user_agent=None):
        """Mark QR code as used"""
        if not self.is_valid():
            raise ValueError("QR code is not valid for use")
        
        # Validate location if restricted
        if self.location_restricted and user_location:
            if not self.is_location_allowed(user_location['latitude'], user_location['longitude']):
                raise ValueError("QR code can only be used at the designated location")
        
        # Validate IP if restricted
        if self.allowed_ip_addresses and ip_address:
            if ip_address not in self.allowed_ip_addresses:
                raise ValueError("QR code cannot be used from this IP address")
        
        # Mark as used
        self.current_uses += 1
        if self.current_uses == 1:
            self.first_used_at = timezone.now()
        self.last_used_at = timezone.now()
        
        # Auto-expire if configured
        if self.auto_expire_after_use and self.current_uses >= self.max_uses:
            self.status = QRCodeStatus.USED
        
        self.save()
        
        # Create usage log
        QRCodeUsage.objects.create(
            qr_code=self,
            used_by=self.user,  # This could be different from the owner
            ip_address=ip_address,
            user_agent=user_agent,
            location_latitude=user_location.get('latitude') if user_location else None,
            location_longitude=user_location.get('longitude') if user_location else None
        )
    
    def is_location_allowed(self, latitude, longitude):
        """Check if location is within allowed radius"""
        if not self.location_restricted:
            return True
        
        if not self.allowed_latitude or not self.allowed_longitude:
            return True
        
        from apps.location.utils import calculate_distance
        
        distance = calculate_distance(
            float(latitude), float(longitude),
            float(self.allowed_latitude), float(self.allowed_longitude)
        )
        
        return distance <= self.allowed_radius
    
    def revoke(self, reason=""):
        """Revoke QR code"""
        self.status = QRCodeStatus.REVOKED
        self.save()
        
        # Log revocation
        QRCodeRevocation.objects.create(
            qr_code=self,
            reason=reason,
            revoked_by=self.user
        )


class QRCodeUsage(models.Model):
    """Track QR code usage"""
    
    qr_code = models.ForeignKey(QRCode, on_delete=models.CASCADE, related_name='usage_logs')
    used_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='qr_usage_logs')
    
    # Usage context
    used_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Location data
    location_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    location_longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    location_accuracy = models.FloatField(null=True, blank=True)
    
    # Additional data
    metadata = models.JSONField(default=dict, blank=True)
    
    # Result
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True)
    
    class Meta:
        db_table = 'qr_code_usage'
        ordering = ['-used_at']
    
    def __str__(self):
        return f"QR usage by {self.used_by.email} at {self.used_at}"


class QRCodeRevocation(models.Model):
    """Track QR code revocations"""
    
    qr_code = models.ForeignKey(QRCode, on_delete=models.CASCADE, related_name='revocations')
    revoked_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    reason = models.TextField(blank=True)
    revoked_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'qr_code_revocations'
    
    def __str__(self):
        return f"QR revocation by {self.revoked_by.email} at {self.revoked_at}"


class QRCodeTemplate(models.Model):
    """Templates for different types of QR codes"""
    
    name = models.CharField(max_length=100, unique=True)
    qr_type = models.CharField(max_length=20, choices=QRCodeType.choices)
    description = models.TextField(blank=True)
    
    # Default settings
    default_expiry_hours = models.IntegerField(default=24)
    default_single_use = models.BooleanField(default=True)
    default_max_uses = models.IntegerField(default=1)
    location_restricted = models.BooleanField(default=False)
    
    # Data template
    data_template = models.JSONField(
        default=dict,
        help_text="JSON template for QR code data"
    )
    
    # Appearance settings
    include_logo = models.BooleanField(default=True)
    error_correction_level = models.CharField(
        max_length=1,
        choices=[('L', 'Low'), ('M', 'Medium'), ('Q', 'Quartile'), ('H', 'High')],
        default='M'
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'qr_code_templates'
    
    def __str__(self):
        return f"{self.name} ({self.qr_type})"


class QRCodeBatch(models.Model):
    """Batch generation of QR codes"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Batch settings
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='qr_batches')
    template = models.ForeignKey(QRCodeTemplate, on_delete=models.CASCADE)
    
    # Generation settings
    quantity = models.IntegerField()
    prefix = models.CharField(max_length=20, blank=True)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('generating', 'Generating'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='pending'
    )
    
    # Progress tracking
    generated_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Results
    download_url = models.URLField(blank=True)
    error_log = models.TextField(blank=True)
    
    class Meta:
        db_table = 'qr_code_batches'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"QR Batch: {self.name} ({self.quantity} codes)"