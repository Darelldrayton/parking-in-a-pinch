"""
Review models for the Parking in a Pinch application.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class ReviewType(models.TextChoices):
    """Types of reviews in the system."""
    LISTING = 'listing', _('Listing Review')
    RENTER = 'renter', _('Renter Review')
    HOST = 'host', _('Host Review')


class ReviewStatus(models.TextChoices):
    """Review status choices."""
    PENDING = 'pending', _('Pending Moderation')
    APPROVED = 'approved', _('Approved')
    REJECTED = 'rejected', _('Rejected')
    FLAGGED = 'flagged', _('Flagged for Review')
    HIDDEN = 'hidden', _('Hidden')


class Review(models.Model):
    """
    Main review model that handles all types of reviews in the system.
    Can review listings, renters, or hosts.
    """
    
    # Core review information
    review_id = models.CharField(
        _('review ID'),
        max_length=20,
        unique=True,
        db_index=True,
        help_text=_('Unique identifier for this review')
    )
    reviewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_given',
        help_text=_('User who wrote this review')
    )
    
    # Generic foreign key to allow reviews of different objects
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        help_text=_('Type of object being reviewed')
    )
    object_id = models.PositiveIntegerField(
        help_text=_('ID of the object being reviewed')
    )
    reviewed_object = GenericForeignKey('content_type', 'object_id')
    
    # Review type and booking reference
    review_type = models.CharField(
        _('review type'),
        max_length=20,
        choices=ReviewType.choices,
        help_text=_('Type of review')
    )
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='reviews',
        null=True,
        blank=True,
        help_text=_('Booking this review is associated with')
    )
    
    # Rating information
    overall_rating = models.IntegerField(
        _('overall rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text=_('Overall rating from 1 to 5 stars')
    )
    
    # Detailed ratings (optional, depends on review type)
    cleanliness_rating = models.IntegerField(
        _('cleanliness rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        help_text=_('Rating for cleanliness (listings only)')
    )
    location_rating = models.IntegerField(
        _('location rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        help_text=_('Rating for location convenience')
    )
    value_rating = models.IntegerField(
        _('value rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        help_text=_('Rating for value for money')
    )
    communication_rating = models.IntegerField(
        _('communication rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        help_text=_('Rating for communication (hosts/renters)')
    )
    security_rating = models.IntegerField(
        _('security rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        help_text=_('Rating for security of the location')
    )
    reliability_rating = models.IntegerField(
        _('reliability rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        help_text=_('Rating for reliability (renters only)')
    )
    
    # Review content
    title = models.CharField(
        _('review title'),
        max_length=200,
        blank=True,
        help_text=_('Optional title for the review')
    )
    comment = models.TextField(
        _('review comment'),
        max_length=2000,
        blank=True,
        help_text=_('Detailed review comment')
    )
    
    # Privacy and moderation
    is_anonymous = models.BooleanField(
        _('is anonymous'),
        default=False,
        help_text=_('Whether this review should be displayed anonymously')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=ReviewStatus.choices,
        default=ReviewStatus.PENDING,
        help_text=_('Moderation status of this review')
    )
    is_verified = models.BooleanField(
        _('is verified'),
        default=False,
        help_text=_('Whether this review is from a verified booking')
    )
    
    # Engagement metrics
    helpful_votes = models.PositiveIntegerField(
        _('helpful votes'),
        default=0,
        help_text=_('Number of helpful votes this review received')
    )
    unhelpful_votes = models.PositiveIntegerField(
        _('unhelpful votes'),
        default=0,
        help_text=_('Number of unhelpful votes this review received')
    )
    
    # Moderation fields
    flagged_count = models.PositiveIntegerField(
        _('flagged count'),
        default=0,
        help_text=_('Number of times this review has been flagged')
    )
    moderated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderated_reviews',
        help_text=_('Moderator who reviewed this content')
    )
    moderation_notes = models.TextField(
        _('moderation notes'),
        blank=True,
        help_text=_('Internal notes for moderation')
    )
    
    # Response from reviewee
    response_text = models.TextField(
        _('response text'),
        max_length=1000,
        blank=True,
        help_text=_('Response from the person being reviewed')
    )
    response_date = models.DateTimeField(
        _('response date'),
        null=True,
        blank=True,
        help_text=_('Date when response was added')
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True,
        help_text=_('When this review was created')
    )
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True,
        help_text=_('When this review was last updated')
    )
    published_at = models.DateTimeField(
        _('published at'),
        null=True,
        blank=True,
        help_text=_('When this review was published')
    )
    
    class Meta:
        db_table = 'reviews'
        verbose_name = _('Review')
        verbose_name_plural = _('Reviews')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['reviewer']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['review_type']),
            models.Index(fields=['booking']),
            models.Index(fields=['overall_rating']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_verified']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['reviewer', 'booking', 'review_type'],
                name='unique_review_per_booking_type'
            ),
        ]
    
    def save(self, *args, **kwargs):
        """Generate review ID if not provided."""
        if not self.review_id:
            self.review_id = self.generate_review_id()
        super().save(*args, **kwargs)
    
    def generate_review_id(self):
        """Generate a unique review ID."""
        return f"RV{str(uuid.uuid4())[:8].upper()}"
    
    def __str__(self):
        reviewer_name = "Anonymous" if self.is_anonymous else self.reviewer.get_display_name()
        return f"Review {self.review_id} by {reviewer_name} - {self.overall_rating}/5 stars"
    
    @property
    def helpful_score(self):
        """Calculate helpful score (helpful - unhelpful)."""
        return self.helpful_votes - self.unhelpful_votes
    
    @property
    def total_votes(self):
        """Calculate total votes."""
        return self.helpful_votes + self.unhelpful_votes
    
    @property
    def helpful_percentage(self):
        """Calculate percentage of helpful votes."""
        if self.total_votes == 0:
            return 0
        return round((self.helpful_votes / self.total_votes) * 100, 1)
    
    def can_be_edited_by(self, user):
        """Check if user can edit this review."""
        return self.reviewer == user and self.status == ReviewStatus.APPROVED
    
    def can_respond(self, user):
        """Check if user can respond to this review."""
        if self.review_type == ReviewType.LISTING:
            # Host can respond to listing reviews
            from apps.listings.models import ParkingListing
            if isinstance(self.reviewed_object, ParkingListing):
                return self.reviewed_object.host == user
        elif self.review_type in [ReviewType.RENTER, ReviewType.HOST]:
            # User being reviewed can respond
            return self.reviewed_object == user
        return False


class ReviewImage(models.Model):
    """
    Images attached to reviews.
    """
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='images',
        help_text=_('Review this image belongs to')
    )
    image = models.ImageField(
        _('image'),
        upload_to='reviews/',
        help_text=_('Review image file')
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
    is_approved = models.BooleanField(
        _('is approved'),
        default=False,
        help_text=_('Whether this image has been approved by moderation')
    )
    uploaded_at = models.DateTimeField(
        _('uploaded at'),
        auto_now_add=True,
        help_text=_('When this image was uploaded')
    )
    
    class Meta:
        db_table = 'review_images'
        verbose_name = _('Review Image')
        verbose_name_plural = _('Review Images')
        ordering = ['display_order', 'uploaded_at']
        indexes = [
            models.Index(fields=['review']),
            models.Index(fields=['is_approved']),
        ]
    
    def __str__(self):
        return f"Image for review {self.review.review_id}"
    
    @property
    def image_url(self):
        """Return the full URL of the image."""
        if self.image:
            return self.image.url
        return None


class ReviewVote(models.Model):
    """
    Votes on reviews (helpful/unhelpful).
    """
    VOTE_CHOICES = [
        ('helpful', _('Helpful')),
        ('unhelpful', _('Unhelpful')),
    ]
    
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='votes',
        help_text=_('Review being voted on')
    )
    voter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='review_votes',
        help_text=_('User who cast this vote')
    )
    vote_type = models.CharField(
        _('vote type'),
        max_length=10,
        choices=VOTE_CHOICES,
        help_text=_('Type of vote cast')
    )
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True,
        help_text=_('When this vote was cast')
    )
    
    class Meta:
        db_table = 'review_votes'
        verbose_name = _('Review Vote')
        verbose_name_plural = _('Review Votes')
        unique_together = ['review', 'voter']
        indexes = [
            models.Index(fields=['review', 'vote_type']),
            models.Index(fields=['voter']),
        ]
    
    def __str__(self):
        return f"{self.voter.get_display_name()} voted {self.vote_type} on {self.review.review_id}"


class ReviewFlag(models.Model):
    """
    Flags for inappropriate reviews.
    """
    FLAG_REASONS = [
        ('spam', _('Spam')),
        ('inappropriate', _('Inappropriate Content')),
        ('fake', _('Fake Review')),
        ('harassment', _('Harassment')),
        ('off_topic', _('Off Topic')),
        ('personal_info', _('Contains Personal Information')),
        ('other', _('Other')),
    ]
    
    review = models.ForeignKey(
        Review,
        on_delete=models.CASCADE,
        related_name='flags',
        help_text=_('Review being flagged')
    )
    flagger = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='review_flags',
        help_text=_('User who flagged this review')
    )
    reason = models.CharField(
        _('reason'),
        max_length=20,
        choices=FLAG_REASONS,
        help_text=_('Reason for flagging')
    )
    description = models.TextField(
        _('description'),
        max_length=500,
        blank=True,
        help_text=_('Additional details about the flag')
    )
    is_resolved = models.BooleanField(
        _('is resolved'),
        default=False,
        help_text=_('Whether this flag has been resolved')
    )
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_flags',
        help_text=_('Moderator who resolved this flag')
    )
    resolution_notes = models.TextField(
        _('resolution notes'),
        blank=True,
        help_text=_('Notes about how this flag was resolved')
    )
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True,
        help_text=_('When this flag was created')
    )
    resolved_at = models.DateTimeField(
        _('resolved at'),
        null=True,
        blank=True,
        help_text=_('When this flag was resolved')
    )
    
    class Meta:
        db_table = 'review_flags'
        verbose_name = _('Review Flag')
        verbose_name_plural = _('Review Flags')
        unique_together = ['review', 'flagger']
        indexes = [
            models.Index(fields=['review']),
            models.Index(fields=['flagger']),
            models.Index(fields=['reason']),
            models.Index(fields=['is_resolved']),
        ]
    
    def __str__(self):
        return f"Flag on {self.review.review_id} for {self.reason}"


class ReviewTemplate(models.Model):
    """
    Pre-defined review templates to help users write reviews.
    """
    TEMPLATE_TYPES = [
        ('positive', _('Positive')),
        ('neutral', _('Neutral')),
        ('negative', _('Negative')),
    ]
    
    name = models.CharField(
        _('template name'),
        max_length=100,
        help_text=_('Name of this template')
    )
    review_type = models.CharField(
        _('review type'),
        max_length=20,
        choices=ReviewType.choices,
        help_text=_('Type of review this template is for')
    )
    template_type = models.CharField(
        _('template type'),
        max_length=10,
        choices=TEMPLATE_TYPES,
        help_text=_('Sentiment of this template')
    )
    title_template = models.CharField(
        _('title template'),
        max_length=200,
        blank=True,
        help_text=_('Template for review title')
    )
    comment_template = models.TextField(
        _('comment template'),
        max_length=1000,
        help_text=_('Template for review comment')
    )
    suggested_rating = models.IntegerField(
        _('suggested rating'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text=_('Suggested overall rating for this template')
    )
    is_active = models.BooleanField(
        _('is active'),
        default=True,
        help_text=_('Whether this template is available for use')
    )
    usage_count = models.PositiveIntegerField(
        _('usage count'),
        default=0,
        help_text=_('Number of times this template has been used')
    )
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True,
        help_text=_('When this template was created')
    )
    
    class Meta:
        db_table = 'review_templates'
        verbose_name = _('Review Template')
        verbose_name_plural = _('Review Templates')
        ordering = ['review_type', 'template_type', 'name']
        indexes = [
            models.Index(fields=['review_type']),
            models.Index(fields=['template_type']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.review_type} - {self.template_type})"