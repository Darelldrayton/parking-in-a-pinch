"""
Dispute models for the Parking in a Pinch application.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.users.models import User
from apps.bookings.models import Booking


class Dispute(models.Model):
    """
    Model representing a dispute filed by a user.
    """
    
    class DisputeType(models.TextChoices):
        HOST_ISSUE = 'host_issue', _('Issue with Host')
        RENTER_ISSUE = 'renter_issue', _('Issue with Renter')
        REFUND_REQUEST = 'refund_request', _('Refund Request')
        PROPERTY_DAMAGE = 'property_damage', _('Property Damage')
        NO_SHOW = 'no_show', _('No Show')
        BILLING_ISSUE = 'billing_issue', _('Billing Issue')
        OTHER = 'other', _('Other')
    
    class DisputeStatus(models.TextChoices):
        OPEN = 'open', _('Open')
        IN_REVIEW = 'in_review', _('In Review')
        RESOLVED = 'resolved', _('Resolved')
        CLOSED = 'closed', _('Closed')
    
    class Priority(models.TextChoices):
        LOW = 'low', _('Low')
        MEDIUM = 'medium', _('Medium')
        HIGH = 'high', _('High')
        URGENT = 'urgent', _('Urgent')
    
    # Basic information
    dispute_id = models.CharField(
        _('dispute ID'),
        max_length=20,
        unique=True,
        help_text=_('Unique dispute identifier')
    )
    complainant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='disputes_filed',
        help_text=_('User filing the dispute')
    )
    respondent = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='disputes_against',
        help_text=_('User being disputed against (if applicable)')
    )
    
    # Dispute details
    dispute_type = models.CharField(
        _('dispute type'),
        max_length=20,
        choices=DisputeType.choices,
        help_text=_('Type of dispute')
    )
    subject = models.CharField(
        _('subject'),
        max_length=200,
        help_text=_('Brief description of the dispute')
    )
    description = models.TextField(
        _('description'),
        help_text=_('Detailed description of the issue')
    )
    
    # Related booking (if applicable)
    booking = models.ForeignKey(
        Booking,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='disputes',
        help_text=_('Related booking (if applicable)')
    )
    
    # Status and priority
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=DisputeStatus.choices,
        default=DisputeStatus.OPEN,
        help_text=_('Current status of the dispute')
    )
    priority = models.CharField(
        _('priority'),
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        help_text=_('Priority level of the dispute')
    )
    
    # Financial information
    disputed_amount = models.DecimalField(
        _('disputed amount'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Amount in dispute (if applicable)')
    )
    refund_requested = models.BooleanField(
        _('refund requested'),
        default=False,
        help_text=_('Whether a refund is being requested')
    )
    refund_amount = models.DecimalField(
        _('refund amount'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Amount of refund requested')
    )
    
    # Administrative
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_disputes',
        help_text=_('Admin user assigned to this dispute')
    )
    admin_notes = models.TextField(
        _('admin notes'),
        blank=True,
        help_text=_('Internal notes for admin use')
    )
    resolution = models.TextField(
        _('resolution'),
        blank=True,
        help_text=_('Final resolution of the dispute')
    )
    
    # Timestamps
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        _('updated at'),
        auto_now=True
    )
    resolved_at = models.DateTimeField(
        _('resolved at'),
        null=True,
        blank=True,
        help_text=_('When the dispute was resolved')
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Dispute')
        verbose_name_plural = _('Disputes')
    
    def __str__(self):
        return f"Dispute #{self.dispute_id} - {self.subject}"
    
    def save(self, *args, **kwargs):
        if not self.dispute_id:
            # Generate dispute ID: DSP + timestamp
            import time
            self.dispute_id = f"DSP{int(time.time())}"
        super().save(*args, **kwargs)
    
    @property
    def is_open(self):
        return self.status in [self.DisputeStatus.OPEN, self.DisputeStatus.IN_REVIEW]
    
    @property
    def is_resolved(self):
        return self.status in [self.DisputeStatus.RESOLVED, self.DisputeStatus.CLOSED]


class DisputeMessage(models.Model):
    """
    Model for messages/communications within a dispute.
    """
    dispute = models.ForeignKey(
        Dispute,
        on_delete=models.CASCADE,
        related_name='messages',
        help_text=_('Dispute this message belongs to')
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        help_text=_('User who sent the message')
    )
    message = models.TextField(
        _('message'),
        help_text=_('Message content')
    )
    is_internal = models.BooleanField(
        _('internal message'),
        default=False,
        help_text=_('Whether this is an internal admin message')
    )
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    class Meta:
        ordering = ['created_at']
        verbose_name = _('Dispute Message')
        verbose_name_plural = _('Dispute Messages')
    
    def __str__(self):
        return f"Message from {self.sender} in {self.dispute}"


class DisputeAttachment(models.Model):
    """
    Model for file attachments in disputes.
    """
    dispute = models.ForeignKey(
        Dispute,
        on_delete=models.CASCADE,
        related_name='attachments',
        help_text=_('Dispute this attachment belongs to')
    )
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        help_text=_('User who uploaded the file')
    )
    file = models.FileField(
        _('file'),
        upload_to='dispute_attachments/%Y/%m/',
        help_text=_('Uploaded file')
    )
    filename = models.CharField(
        _('filename'),
        max_length=255,
        help_text=_('Original filename')
    )
    description = models.CharField(
        _('description'),
        max_length=500,
        blank=True,
        help_text=_('Description of the file')
    )
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True
    )
    
    class Meta:
        ordering = ['created_at']
        verbose_name = _('Dispute Attachment')
        verbose_name_plural = _('Dispute Attachments')
    
    def __str__(self):
        return f"Attachment: {self.filename} for {self.dispute}"