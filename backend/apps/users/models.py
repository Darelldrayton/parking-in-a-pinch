"""
User models for the Parking in a Pinch application.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator, MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class User(AbstractUser):
    """
    Custom user model with additional fields for the parking marketplace.
    """
    
    class UserType(models.TextChoices):
        SEEKER = 'SEEKER', _('Parking Seeker')
        HOST = 'HOST', _('Space Host')
        BOTH = 'BOTH', _('Both Seeker and Host')
    
    # Override email to be unique and required
    email = models.EmailField(_('email address'), unique=True)
    
    # Phone number with validation
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message=_("Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.")
    )
    phone_number = models.CharField(
        _('phone number'),
        validators=[phone_regex],
        max_length=17,
        blank=True,
        help_text=_('Contact phone number')
    )
    
    # User type
    user_type = models.CharField(
        _('user type'),
        max_length=10,
        choices=UserType.choices,
        default=UserType.SEEKER,
        help_text=_('Type of user account')
    )
    
    # Profile details
    profile_picture = models.ImageField(
        _('profile picture'),
        upload_to='profiles/',
        blank=True,
        null=True,
        help_text=_('Profile picture')
    )
    bio = models.TextField(
        _('bio'),
        max_length=500,
        blank=True,
        help_text=_('Short bio about yourself')
    )
    date_of_birth = models.DateField(
        _('date of birth'),
        null=True,
        blank=True,
        help_text=_('Your date of birth')
    )
    
    # Verification status
    is_email_verified = models.BooleanField(
        _('email verified'),
        default=False,
        help_text=_('Whether the email address has been verified')
    )
    is_phone_verified = models.BooleanField(
        _('phone verified'),
        default=False,
        help_text=_('Whether the phone number has been verified')
    )
    is_identity_verified = models.BooleanField(
        _('identity verified'),
        default=False,
        help_text=_('Whether identity has been verified')
    )
    is_verified = models.BooleanField(
        _('verified user'),
        default=False,
        help_text=_('Whether user has been manually verified by admin (shows verification badge)')
    )
    verified_at = models.DateTimeField(
        _('verified at'),
        null=True,
        blank=True,
        help_text=_('When the user was verified by admin')
    )
    verified_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_users',
        help_text=_('Admin who verified this user')
    )
    
    # Driver information
    driver_license_number = models.CharField(
        _('driver license number'),
        max_length=50,
        blank=True,
        help_text=_('Driver license number for verification')
    )
    driver_license_state = models.CharField(
        _('driver license state'),
        max_length=2,
        blank=True,
        help_text=_('State that issued the driver license')
    )
    
    # Location preferences
    # default_location = models.PointField(
    #     _('default location'),
    #     null=True,
    #     blank=True,
    #     srid=4326,
    #     help_text=_('Default location for searches')
    # )
    default_address = models.CharField(
        _('default address'),
        max_length=255,
        blank=True,
        help_text=_('Default address for searches')
    )
    
    # Payment information
    stripe_customer_id = models.CharField(
        _('Stripe customer ID'),
        max_length=255,
        blank=True,
        help_text=_('Stripe customer ID for payments')
    )
    stripe_account_id = models.CharField(
        _('Stripe account ID'),
        max_length=255,
        blank=True,
        help_text=_('Stripe connected account ID for hosts')
    )
    
    # Preferences
    NOTIFICATION_CHOICES = [
        ('email', _('Email')),
        ('sms', _('SMS')),
        ('push', _('Push Notification')),
    ]
    preferred_notification_method = models.CharField(
        _('preferred notification method'),
        max_length=10,
        choices=NOTIFICATION_CHOICES,
        default='email',
        help_text=_('Preferred method for notifications')
    )
    
    # Ratings and reviews
    average_rating_as_host = models.DecimalField(
        _('average rating as host'),
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text=_('Average rating received as a host')
    )
    total_reviews_as_host = models.PositiveIntegerField(
        _('total reviews as host'),
        default=0,
        help_text=_('Total number of reviews received as a host')
    )
    
    average_rating_as_guest = models.DecimalField(
        _('average rating as guest'),
        max_digits=3,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text=_('Average rating received as a guest')
    )
    total_reviews_as_guest = models.PositiveIntegerField(
        _('total reviews as guest'),
        default=0,
        help_text=_('Total number of reviews received as a guest')
    )
    
    # Marketing preferences
    subscribe_to_newsletter = models.BooleanField(
        _('subscribe to newsletter'),
        default=False,
        help_text=_('Whether the user wants to receive marketing emails')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    last_login_ip = models.GenericIPAddressField(
        _('last login IP'),
        null=True,
        blank=True,
        help_text=_('IP address of last login')
    )
    
    # Soft delete
    is_deleted = models.BooleanField(_('is deleted'), default=False)
    deleted_at = models.DateTimeField(_('deleted at'), null=True, blank=True)
    
    # Use email as the username field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        db_table = 'users'
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone_number']),
            models.Index(fields=['user_type']),
            models.Index(fields=['stripe_customer_id']),
            models.Index(fields=['is_email_verified']),
            models.Index(fields=['is_identity_verified']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f'{self.first_name} {self.last_name}'
        return full_name.strip() or self.email
    
    def can_host(self):
        """Check if user can create parking spot listings."""
        return self.user_type in [self.UserType.HOST, self.UserType.BOTH]
    
    def can_book(self):
        """Check if user can book parking spots."""
        return self.user_type in [self.UserType.SEEKER, self.UserType.BOTH]
    
    def is_verified(self):
        """Check if user is fully verified."""
        return self.is_email_verified and self.is_identity_verified
    
    def get_display_name(self):
        """Get the best available display name for the user."""
        if self.first_name:
            return self.first_name
        return self.email.split('@')[0]


class VerificationRequest(models.Model):
    """
    Model to store user verification requests for admin approval.
    """
    
    class VerificationType(models.TextChoices):
        IDENTITY = 'IDENTITY', _('Identity Verification')
        PHONE = 'PHONE', _('Phone Verification')
        EMAIL = 'EMAIL', _('Email Verification')
    
    class VerificationStatus(models.TextChoices):
        PENDING = 'PENDING', _('Pending Review')
        APPROVED = 'APPROVED', _('Approved')
        REJECTED = 'REJECTED', _('Rejected')
        REVISION_REQUESTED = 'REVISION_REQUESTED', _('Revision Requested')
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='verification_requests'
    )
    verification_type = models.CharField(
        _('verification type'),
        max_length=20,
        choices=VerificationType.choices,
        default=VerificationType.IDENTITY
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=VerificationStatus.choices,
        default=VerificationStatus.PENDING
    )
    
    # Identity verification documents
    id_document_front = models.ImageField(
        _('ID document front'),
        upload_to='verification/id_documents/',
        blank=True,
        null=True,
        help_text=_('Front side of government-issued ID')
    )
    id_document_back = models.ImageField(
        _('ID document back'),
        upload_to='verification/id_documents/',
        blank=True,
        null=True,
        help_text=_('Back side of government-issued ID')
    )
    selfie_with_id = models.ImageField(
        _('selfie with ID'),
        upload_to='verification/selfies/',
        blank=True,
        null=True,
        help_text=_('Selfie holding the ID document')
    )
    
    # Document information
    document_type = models.CharField(
        _('document type'),
        max_length=50,
        blank=True,
        help_text=_('Type of ID document (e.g., Driver License, Passport)')
    )
    document_number = models.CharField(
        _('document number'),
        max_length=100,
        blank=True,
        help_text=_('Document number (encrypted for security)')
    )
    document_expiry_date = models.DateField(
        _('document expiry date'),
        blank=True,
        null=True,
        help_text=_('When the document expires')
    )
    
    # Additional verification data
    verification_data = models.JSONField(
        _('verification data'),
        default=dict,
        blank=True,
        help_text=_('Additional verification information')
    )
    
    # Admin review
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_verifications',
        help_text=_('Admin who reviewed this request')
    )
    reviewed_at = models.DateTimeField(
        _('reviewed at'),
        null=True,
        blank=True,
        help_text=_('When the request was reviewed')
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
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        db_table = 'verification_requests'
        verbose_name = _('Verification Request')
        verbose_name_plural = _('Verification Requests')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'verification_type']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['reviewed_by', 'reviewed_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.verification_type} ({self.status})"
    
    def can_be_reviewed(self):
        """Check if this request can be reviewed."""
        return self.status == self.VerificationStatus.PENDING
    
    def approve(self, admin_user, notes=''):
        """Approve the verification request."""
        self.status = self.VerificationStatus.APPROVED
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.admin_notes = notes
        self.save()
        
        # Update user verification status
        if self.verification_type == self.VerificationType.IDENTITY:
            self.user.is_identity_verified = True
            self.user.save()
        elif self.verification_type == self.VerificationType.PHONE:
            self.user.is_phone_verified = True
            self.user.save()
        elif self.verification_type == self.VerificationType.EMAIL:
            self.user.is_email_verified = True
            self.user.save()
    
    def reject(self, admin_user, reason, notes=''):
        """Reject the verification request."""
        self.status = self.VerificationStatus.REJECTED
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.rejection_reason = reason
        self.admin_notes = notes
        self.save()
    
    def request_revision(self, admin_user, reason, notes=''):
        """Request revision of the verification request."""
        self.status = self.VerificationStatus.REVISION_REQUESTED
        self.reviewed_by = admin_user
        self.reviewed_at = timezone.now()
        self.rejection_reason = reason
        self.admin_notes = notes
        self.save()


class UserProfile(models.Model):
    """
    Extended profile information for users.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    
    # Emergency contact
    emergency_contact_name = models.CharField(
        _('emergency contact name'),
        max_length=100,
        blank=True,
        help_text=_('Name of emergency contact')
    )
    emergency_contact_phone = models.CharField(
        _('emergency contact phone'),
        max_length=17,
        blank=True,
        help_text=_('Phone number of emergency contact')
    )
    
    # Vehicle information
    primary_vehicle_make = models.CharField(
        _('primary vehicle make'),
        max_length=50,
        blank=True,
        help_text=_('Make of primary vehicle')
    )
    primary_vehicle_model = models.CharField(
        _('primary vehicle model'),
        max_length=50,
        blank=True,
        help_text=_('Model of primary vehicle')
    )
    primary_vehicle_year = models.PositiveIntegerField(
        _('primary vehicle year'),
        null=True,
        blank=True,
        help_text=_('Year of primary vehicle')
    )
    primary_vehicle_color = models.CharField(
        _('primary vehicle color'),
        max_length=30,
        blank=True,
        help_text=_('Color of primary vehicle')
    )
    primary_vehicle_license_plate = models.CharField(
        _('primary vehicle license plate'),
        max_length=20,
        blank=True,
        help_text=_('License plate of primary vehicle')
    )
    primary_vehicle_state = models.CharField(
        _('primary vehicle state'),
        max_length=2,
        blank=True,
        help_text=_('State where primary vehicle is registered')
    )
    
    # Preferences
    auto_approve_bookings = models.BooleanField(
        _('auto approve bookings'),
        default=False,
        help_text=_('Automatically approve booking requests for your listings')
    )
    email_notifications = models.BooleanField(
        _('email notifications'),
        default=True,
        help_text=_('Receive email notifications')
    )
    sms_notifications = models.BooleanField(
        _('SMS notifications'),
        default=False,
        help_text=_('Receive SMS notifications')
    )
    push_notifications = models.BooleanField(
        _('push notifications'),
        default=True,
        help_text=_('Receive push notifications')
    )
    
    # Privacy settings
    show_phone_to_guests = models.BooleanField(
        _('show phone to guests'),
        default=False,
        help_text=_('Show phone number to confirmed guests')
    )
    show_last_name = models.BooleanField(
        _('show last name'),
        default=True,
        help_text=_('Show last name in profile')
    )
    
    # Marketing preferences
    marketing_emails = models.BooleanField(
        _('marketing emails'),
        default=True,
        help_text=_('Receive marketing and promotional emails')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
        verbose_name = _('User Profile')
        verbose_name_plural = _('User Profiles')
    
    def __str__(self):
        return f"Profile for {self.user.get_full_name()}"