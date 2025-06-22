from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

User = get_user_model()


class BookingStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    CONFIRMED = 'confirmed', 'Confirmed'
    ACTIVE = 'active', 'Active'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'
    NO_SHOW = 'no_show', 'No Show'


class Booking(models.Model):
    # Core booking information
    booking_id = models.CharField(max_length=20, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    parking_space = models.ForeignKey('listings.ParkingListing', on_delete=models.CASCADE, related_name='bookings')
    
    # Booking timing
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    duration_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Pricing
    hourly_rate = models.DecimalField(max_digits=8, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    platform_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    # Status and metadata
    status = models.CharField(max_length=20, choices=BookingStatus.choices, default=BookingStatus.PENDING)
    special_instructions = models.TextField(blank=True)
    
    # Vehicle information
    vehicle_license_plate = models.CharField(max_length=20)
    vehicle_state = models.CharField(max_length=2, default='NY')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    
    # Actual check-in/check-out times
    actual_start_time = models.DateTimeField(null=True, blank=True, help_text="When user actually checked in")
    actual_end_time = models.DateTimeField(null=True, blank=True, help_text="When user actually checked out")
    auto_checkout = models.BooleanField(default=False, help_text="Whether checkout was performed automatically")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['parking_space', 'start_time']),
            models.Index(fields=['booking_id']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.booking_id:
            self.booking_id = self.generate_booking_id()
        
        # Calculate duration and total
        if self.start_time and self.end_time:
            duration = self.end_time - self.start_time
            self.duration_hours = duration.total_seconds() / 3600
            self.total_amount = float(self.duration_hours) * float(self.hourly_rate)
            self.platform_fee = float(self.total_amount) * 0.05  # 5% platform fee
        
        super().save(*args, **kwargs)
    
    def generate_booking_id(self):
        return f"BK{str(uuid.uuid4())[:8].upper()}"
    
    def __str__(self):
        return f"Booking {self.booking_id} - {self.user.email}"
    
    @property
    def is_active(self):
        now = timezone.now()
        return (self.status == BookingStatus.ACTIVE and 
                self.start_time <= now <= self.end_time)
    
    @property
    def can_be_cancelled(self):
        return self.status in [BookingStatus.PENDING, BookingStatus.CONFIRMED]
    
    @property
    def time_until_start(self):
        if self.start_time > timezone.now():
            return self.start_time - timezone.now()
        return None



class BookingReview(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]
    
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='booking_reviews')
    
    # Review content
    rating = models.IntegerField(choices=RATING_CHOICES, validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    
    # Review categories
    cleanliness_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    security_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    location_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    value_rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    
    # Metadata
    is_anonymous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('booking', 'reviewer')
    
    def __str__(self):
        return f"Review for {self.booking.booking_id} - {self.rating}/5 stars"