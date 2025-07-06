"""
Parking listing models for the Parking in a Pinch application.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from apps.users.models import User


class ParkingListing(models.Model):
    """
    Model representing a parking space listing.
    """
    
    class Borough(models.TextChoices):
        MANHATTAN = 'Manhattan', _('Manhattan')
        BROOKLYN = 'Brooklyn', _('Brooklyn')
        QUEENS = 'Queens', _('Queens')
        BRONX = 'Bronx', _('Bronx')
        STATEN_ISLAND = 'Staten Island', _('Staten Island')
    
    class SpaceType(models.TextChoices):
        GARAGE = 'garage', _('Garage')
        LOT = 'lot', _('Parking lot')
        COVERED = 'covered', _('Covered space')
        DRIVEWAY = 'driveway', _('Driveway')
    
    # Basic information
    host = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='parking_listings',
        help_text=_('Host who owns this parking space')
    )
    title = models.CharField(
        _('title'),
        max_length=200,
        help_text=_('Title of the parking listing')
    )
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Detailed description of the parking space')
    )
    
    # Location
    address = models.TextField(
        _('address'),
        help_text=_('Full address of the parking space')
    )
    latitude = models.DecimalField(
        _('latitude'),
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True,
        help_text=_('Latitude coordinate')
    )
    longitude = models.DecimalField(
        _('longitude'),
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True,
        help_text=_('Longitude coordinate')
    )
    borough = models.CharField(
        _('borough'),
        max_length=20,
        choices=Borough.choices,
        help_text=_('NYC borough where the parking space is located')
    )
    
    # Space details
    space_type = models.CharField(
        _('space type'),
        max_length=20,
        choices=SpaceType.choices,
        help_text=_('Type of parking space')
    )
    max_vehicle_size = models.CharField(
        _('max vehicle size'),
        max_length=50,
        blank=True,
        help_text=_('Maximum vehicle size that can fit')
    )
    
    # Pricing
    hourly_rate = models.DecimalField(
        _('hourly rate'),
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text=_('Hourly parking rate in USD')
    )
    daily_rate = models.DecimalField(
        _('daily rate'),
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text=_('Daily parking rate in USD')
    )
    weekly_rate = models.DecimalField(
        _('weekly rate'),
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text=_('Weekly parking rate in USD')
    )
    
    # Amenities
    is_covered = models.BooleanField(
        _('is covered'),
        default=False,
        help_text=_('Whether the parking space is covered')
    )
    has_ev_charging = models.BooleanField(
        _('has EV charging'),
        default=False,
        help_text=_('Whether EV charging is available')
    )
    has_security = models.BooleanField(
        _('has security'),
        default=False,
        help_text=_('Whether the area has security cameras or guards')
    )
    is_instant_book = models.BooleanField(
        _('instant book enabled'),
        default=False,
        help_text=_('Whether verified users can book this space instantly without approval')
    )
    
    # Additional amenities
    has_lighting = models.BooleanField(
        _('well lit'),
        default=False,
        help_text=_('Whether the parking area has good lighting for safety')
    )
    has_cctv = models.BooleanField(
        _('CCTV monitoring'),
        default=False,
        help_text=_('Whether the area has CCTV video surveillance')
    )
    has_gated_access = models.BooleanField(
        _('gated access'),
        default=False,
        help_text=_('Whether the parking area has controlled/gated access')
    )
    is_handicap_accessible = models.BooleanField(
        _('handicap accessible'),
        default=False,
        help_text=_('Whether the parking space is ADA compliant')
    )
    has_valet_service = models.BooleanField(
        _('valet service'),
        default=False,
        help_text=_('Whether valet parking service is available')
    )
    has_car_wash = models.BooleanField(
        _('car wash'),
        default=False,
        help_text=_('Whether car washing services are available')
    )
    
    # Instructions and availability
    instructions = models.TextField(
        _('instructions'),
        blank=True,
        help_text=_('Special instructions for guests')
    )
    is_active = models.BooleanField(
        _('is active'),
        default=True,
        help_text=_('Whether the listing is active and available for booking')
    )
    
    # Admin approval system
    class ApprovalStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending Review')
        APPROVED = 'APPROVED', _('Approved')
        REJECTED = 'REJECTED', _('Rejected')
        REVISION_REQUESTED = 'REVISION_REQUESTED', _('Revision Requested')
    
    approval_status = models.CharField(
        _('approval status'),
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING,
        help_text=_('Admin approval status for this listing')
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_listings',
        help_text=_('Admin who reviewed this listing')
    )
    reviewed_at = models.DateTimeField(
        _('reviewed at'),
        null=True,
        blank=True,
        help_text=_('When the listing was reviewed')
    )
    admin_notes = models.TextField(
        _('admin notes'),
        blank=True,
        help_text=_('Notes from admin review')
    )
    rejection_reason = models.CharField(
        _('rejection reason'),
        max_length=200,
        blank=True,
        help_text=_('Reason for rejection if applicable')
    )
    
    # Availability schedule (JSON field for flexible schedule storage)
    availability_schedule = models.JSONField(
        _('availability schedule'),
        default=dict,
        blank=True,
        help_text=_('Weekly availability schedule')
    )
    
    # Ratings and reviews
    rating_average = models.DecimalField(
        _('average rating'),
        max_digits=3,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text=_('Average rating from reviews')
    )
    total_reviews = models.PositiveIntegerField(
        _('total reviews'),
        default=0,
        help_text=_('Total number of reviews')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        db_table = 'parking_listings'
        verbose_name = _('Parking Listing')
        verbose_name_plural = _('Parking Listings')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['host']),
            models.Index(fields=['borough']),
            models.Index(fields=['space_type']),
            models.Index(fields=['hourly_rate']),
            models.Index(fields=['daily_rate']),
            models.Index(fields=['is_active']),
            models.Index(fields=['created_at']),
            models.Index(fields=['rating_average']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.borough}"
    
    def get_amenities(self):
        """Return a list of available amenities."""
        amenities = []
        if self.is_covered:
            amenities.append('Covered')
        if self.has_ev_charging:
            amenities.append('EV Charging')
        if self.has_security:
            amenities.append('Security')
        if self.has_lighting:
            amenities.append('Well Lit')
        if self.has_cctv:
            amenities.append('CCTV Monitoring')
        if self.has_gated_access:
            amenities.append('Gated Access')
        if self.is_handicap_accessible:
            amenities.append('Wheelchair Accessible')
        if self.has_valet_service:
            amenities.append('Valet Service')
        if self.has_car_wash:
            amenities.append('Car Wash')
        return amenities
    
    def get_availability_schedule(self):
        """Return formatted availability schedule."""
        default_schedule = {
            'monday': {'available': True, 'start': '06:00', 'end': '22:00'},
            'tuesday': {'available': True, 'start': '06:00', 'end': '22:00'},
            'wednesday': {'available': True, 'start': '06:00', 'end': '22:00'},
            'thursday': {'available': True, 'start': '06:00', 'end': '22:00'},
            'friday': {'available': True, 'start': '06:00', 'end': '22:00'},
            'saturday': {'available': True, 'start': '08:00', 'end': '20:00'},
            'sunday': {'available': True, 'start': '08:00', 'end': '20:00'},
        }
        return self.availability_schedule or default_schedule
    
    def is_publicly_visible(self):
        """Check if listing should be visible to the public."""
        return (self.approval_status == self.ApprovalStatus.APPROVED and 
                self.is_active)
    
    def can_be_reviewed(self):
        """Check if this listing can be reviewed by admin."""
        return self.approval_status == self.ApprovalStatus.PENDING
    
    def approve(self, admin_user, notes=''):
        """Approve the listing."""
        from django.utils import timezone
        self.approval_status = self.ApprovalStatus.APPROVED
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.admin_notes = notes
        self.save()
    
    def reject(self, admin_user, reason, notes=''):
        """Reject the listing."""
        from django.utils import timezone
        self.approval_status = self.ApprovalStatus.REJECTED
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.rejection_reason = reason
        self.admin_notes = notes
        self.save()
    
    def request_revision(self, admin_user, reason, notes=''):
        """Request revision of the listing."""
        from django.utils import timezone
        self.approval_status = self.ApprovalStatus.REVISION_REQUESTED
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.rejection_reason = reason
        self.admin_notes = notes
        self.save()


class ListingImage(models.Model):
    """
    Model for parking listing images.
    """
    listing = models.ForeignKey(
        ParkingListing,
        on_delete=models.CASCADE,
        related_name='images',
        help_text=_('Parking listing this image belongs to')
    )
    image = models.ImageField(
        _('image'),
        upload_to='listings/',
        help_text=_('Listing image file')
    )
    alt_text = models.CharField(
        _('alt text'),
        max_length=200,
        blank=True,
        help_text=_('Alt text for accessibility')
    )
    display_order = models.PositiveIntegerField(
        _('display order'),
        default=0,
        help_text=_('Order in which to display the image')
    )
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)
    
    class Meta:
        db_table = 'listing_images'
        verbose_name = _('Listing Image')
        verbose_name_plural = _('Listing Images')
        ordering = ['display_order', 'uploaded_at']
        unique_together = ['listing', 'display_order']
    
    def __str__(self):
        return f"Image for {self.listing.title}"
    
    @property
    def image_url(self):
        """Return the full URL of the image."""
        if self.image:
            return self.image.url
        return None


class ListingAvailability(models.Model):
    """
    Model to track when parking spaces are unavailable.
    """
    listing = models.ForeignKey(
        ParkingListing,
        on_delete=models.CASCADE,
        related_name='unavailable_periods',
        help_text=_('Parking listing')
    )
    start_datetime = models.DateTimeField(
        _('start datetime'),
        help_text=_('Start of unavailable period')
    )
    end_datetime = models.DateTimeField(
        _('end datetime'),
        help_text=_('End of unavailable period')
    )
    reason = models.CharField(
        _('reason'),
        max_length=100,
        blank=True,
        help_text=_('Reason for unavailability')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        db_table = 'listing_availability'
        verbose_name = _('Listing Availability')
        verbose_name_plural = _('Listing Availabilities')
        ordering = ['start_datetime']
        indexes = [
            models.Index(fields=['listing', 'start_datetime']),
            models.Index(fields=['listing', 'end_datetime']),
        ]
    
    def __str__(self):
        return f"{self.listing.title} unavailable {self.start_datetime} - {self.end_datetime}"