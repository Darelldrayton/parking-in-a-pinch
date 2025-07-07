"""
Messaging models for the Parking in a Pinch application.
"""
import uuid
from django.db import models
from django.core.validators import FileExtensionValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.contrib.auth import get_user_model
from cryptography.fernet import Fernet
from django.conf import settings
import os

User = get_user_model()


class ConversationType(models.TextChoices):
    """Types of conversations."""
    DIRECT = 'direct', _('Direct Message')
    BOOKING = 'booking', _('Booking Related')
    INQUIRY = 'inquiry', _('Listing Inquiry')
    SUPPORT = 'support', _('Customer Support')


class MessageStatus(models.TextChoices):
    """Message delivery status."""
    SENT = 'sent', _('Sent')
    DELIVERED = 'delivered', _('Delivered')
    READ = 'read', _('Read')
    FAILED = 'failed', _('Failed')


class ConversationStatus(models.TextChoices):
    """Conversation status."""
    ACTIVE = 'active', _('Active')
    ARCHIVED = 'archived', _('Archived')
    BLOCKED = 'blocked', _('Blocked')
    DELETED = 'deleted', _('Deleted')


class Conversation(models.Model):
    """
    Model representing a conversation between users.
    """
    
    # Core conversation information
    conversation_id = models.UUIDField(
        _('conversation ID'),
        default=uuid.uuid4,
        unique=True,
        db_index=True,
        help_text=_('Unique identifier for the conversation')
    )
    
    participants = models.ManyToManyField(
        User,
        related_name='conversations',
        help_text=_('Users participating in this conversation')
    )
    
    conversation_type = models.CharField(
        _('conversation type'),
        max_length=20,
        choices=ConversationType.choices,
        default=ConversationType.DIRECT,
        help_text=_('Type of conversation')
    )
    
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=ConversationStatus.choices,
        default=ConversationStatus.ACTIVE,
        help_text=_('Current status of the conversation')
    )
    
    # Related objects
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='conversations',
        null=True,
        blank=True,
        help_text=_('Related booking if conversation is booking-related')
    )
    
    listing = models.ForeignKey(
        'listings.ParkingListing',
        on_delete=models.CASCADE,
        related_name='conversations',
        null=True,
        blank=True,
        help_text=_('Related listing if conversation is about a listing')
    )
    
    # Conversation metadata
    title = models.CharField(
        _('title'),
        max_length=200,
        blank=True,
        help_text=_('Optional title for the conversation')
    )
    
    is_group = models.BooleanField(
        _('is group conversation'),
        default=False,
        help_text=_('Whether this is a group conversation')
    )
    
    # Privacy and moderation
    is_encrypted = models.BooleanField(
        _('is encrypted'),
        default=True,
        help_text=_('Whether messages in this conversation are encrypted')
    )
    
    auto_delete_after_days = models.PositiveIntegerField(
        _('auto delete after days'),
        null=True,
        blank=True,
        help_text=_('Number of days after which to auto-delete old messages')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    last_activity_at = models.DateTimeField(
        _('last activity at'),
        auto_now_add=True,
        help_text=_('Last time there was activity in this conversation')
    )
    
    class Meta:
        db_table = 'conversations'
        verbose_name = _('Conversation')
        verbose_name_plural = _('Conversations')
        ordering = ['-last_activity_at']
        indexes = [
            models.Index(fields=['conversation_id']),
            models.Index(fields=['conversation_type']),
            models.Index(fields=['status']),
            models.Index(fields=['booking']),
            models.Index(fields=['listing']),
            models.Index(fields=['last_activity_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        if self.title:
            return self.title
        participants = list(self.participants.all())
        if len(participants) == 2:
            return f"Conversation between {participants[0].get_display_name()} and {participants[1].get_display_name()}"
        return f"Conversation {str(self.conversation_id)[:8]}"
    
    def get_other_participant(self, user):
        """Get the other participant in a two-person conversation."""
        participants = self.participants.exclude(id=user.id)
        return participants.first() if participants.exists() else None
    
    def get_unread_count(self, user):
        """Get the number of unread messages for a specific user."""
        return self.messages.exclude(
            sender=user
        ).exclude(
            id__in=MessageReadStatus.objects.filter(user=user).values_list('message_id', flat=True)
        ).count()
    
    def mark_as_read(self, user):
        """Mark all messages in conversation as read by user."""
        unread_messages = self.messages.exclude(sender=user).exclude(
            id__in=MessageReadStatus.objects.filter(user=user).values_list('message_id', flat=True)
        )
        for message in unread_messages:
            MessageReadStatus.objects.get_or_create(
                message=message,
                user=user,
                defaults={'read_at': timezone.now()}
            )
    
    @property
    def last_message(self):
        """Get the last message in the conversation."""
        return self.messages.first()


class Message(models.Model):
    """
    Model representing a message within a conversation.
    """
    
    # Core message information
    message_id = models.UUIDField(
        _('message ID'),
        default=uuid.uuid4,
        unique=True,
        db_index=True,
        help_text=_('Unique identifier for the message')
    )
    
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        help_text=_('Conversation this message belongs to')
    )
    
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        help_text=_('User who sent this message')
    )
    
    # Message content
    content = models.TextField(
        _('content'),
        help_text=_('Message content')
    )
    
    encrypted_content = models.TextField(
        _('encrypted content'),
        blank=True,
        help_text=_('Encrypted version of the message content')
    )
    
    # Message metadata
    message_type = models.CharField(
        _('message type'),
        max_length=20,
        choices=[
            ('text', _('Text')),
            ('image', _('Image')),
            ('file', _('File')),
            ('system', _('System Message')),
        ],
        default='text',
        help_text=_('Type of message')
    )
    
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=MessageStatus.choices,
        default=MessageStatus.SENT,
        help_text=_('Delivery status of the message')
    )
    
    # Threading
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='replies',
        null=True,
        blank=True,
        help_text=_('Message this is a reply to')
    )
    
    # Moderation
    is_deleted = models.BooleanField(
        _('is deleted'),
        default=False,
        help_text=_('Whether this message has been deleted')
    )
    
    is_edited = models.BooleanField(
        _('is edited'),
        default=False,
        help_text=_('Whether this message has been edited')
    )
    
    is_flagged = models.BooleanField(
        _('is flagged'),
        default=False,
        help_text=_('Whether this message has been flagged for review')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    delivered_at = models.DateTimeField(
        _('delivered at'),
        null=True,
        blank=True,
        help_text=_('When the message was delivered')
    )
    
    class Meta:
        db_table = 'messages'
        verbose_name = _('Message')
        verbose_name_plural = _('Messages')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['message_id']),
            models.Index(fields=['conversation', '-created_at']),
            models.Index(fields=['sender']),
            models.Index(fields=['status']),
            models.Index(fields=['message_type']),
            models.Index(fields=['is_deleted']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        content_preview = self.get_content()[:50]
        return f"Message from {self.sender.get_display_name()}: {content_preview}..."
    
    def get_content(self):
        """Get decrypted content if message is encrypted."""
        if self.conversation.is_encrypted and self.encrypted_content:
            return self.decrypt_content()
        return self.content
    
    def encrypt_content(self):
        """Encrypt the message content."""
        if not self.content:
            return
        
        # Simple encryption for demo - in production, use proper key management
        key = getattr(settings, 'MESSAGE_ENCRYPTION_KEY', Fernet.generate_key())
        f = Fernet(key)
        self.encrypted_content = f.encrypt(self.content.encode()).decode()
    
    def decrypt_content(self):
        """Decrypt the message content."""
        if not self.encrypted_content:
            return self.content
        
        try:
            key = getattr(settings, 'MESSAGE_ENCRYPTION_KEY', Fernet.generate_key())
            f = Fernet(key)
            return f.decrypt(self.encrypted_content.encode()).decode()
        except Exception:
            return self.content  # Fallback to unencrypted content
    
    def save(self, *args, **kwargs):
        """Override save to handle encryption and update conversation activity."""
        if self.conversation.is_encrypted and self.content and not self.encrypted_content:
            self.encrypt_content()
        
        super().save(*args, **kwargs)
        
        # Update conversation last activity
        self.conversation.last_activity_at = self.created_at or timezone.now()
        self.conversation.save(update_fields=['last_activity_at'])


class MessageReadStatus(models.Model):
    """
    Model to track when users have read specific messages.
    """
    
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='read_by'
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='read_messages'
    )
    
    read_at = models.DateTimeField(_('read at'), auto_now_add=True)
    
    class Meta:
        db_table = 'message_read_status'
        verbose_name = _('Message Read Status')
        verbose_name_plural = _('Message Read Statuses')
        unique_together = ['message', 'user']
        indexes = [
            models.Index(fields=['message']),
            models.Index(fields=['user']),
            models.Index(fields=['read_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_display_name()} read message {self.message.message_id}"


class MessageAttachment(models.Model):
    """
    Model for message attachments (images, documents, etc.).
    """
    
    # Allowed file extensions
    ALLOWED_EXTENSIONS = [
        'jpg', 'jpeg', 'png', 'gif', 'webp',  # Images
        'pdf', 'doc', 'docx', 'txt', 'rtf',   # Documents
        'mp3', 'wav', 'mp4', 'avi', 'mov',    # Media (limited)
    ]
    
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='attachments',
        help_text=_('Message this attachment belongs to')
    )
    
    file = models.FileField(
        _('file'),
        upload_to='message_attachments/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=ALLOWED_EXTENSIONS)],
        help_text=_('Attached file')
    )
    
    filename = models.CharField(
        _('filename'),
        max_length=255,
        help_text=_('Original filename')
    )
    
    file_size = models.PositiveIntegerField(
        _('file size'),
        help_text=_('File size in bytes')
    )
    
    content_type = models.CharField(
        _('content type'),
        max_length=100,
        help_text=_('MIME type of the file')
    )
    
    # Metadata
    alt_text = models.CharField(
        _('alt text'),
        max_length=200,
        blank=True,
        help_text=_('Alt text for images (accessibility)')
    )
    
    is_image = models.BooleanField(
        _('is image'),
        default=False,
        help_text=_('Whether this attachment is an image')
    )
    
    # Security
    is_scanned = models.BooleanField(
        _('is scanned'),
        default=False,
        help_text=_('Whether the file has been scanned for malware')
    )
    
    scan_result = models.CharField(
        _('scan result'),
        max_length=20,
        choices=[
            ('clean', _('Clean')),
            ('infected', _('Infected')),
            ('suspicious', _('Suspicious')),
            ('pending', _('Pending')),
        ],
        default='pending',
        help_text=_('Result of malware scan')
    )
    
    # Timestamps
    uploaded_at = models.DateTimeField(_('uploaded at'), auto_now_add=True)
    
    class Meta:
        db_table = 'message_attachments'
        verbose_name = _('Message Attachment')
        verbose_name_plural = _('Message Attachments')
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['message']),
            models.Index(fields=['is_image']),
            models.Index(fields=['scan_result']),
            models.Index(fields=['uploaded_at']),
        ]
    
    def __str__(self):
        return f"Attachment: {self.filename}"
    
    def save(self, *args, **kwargs):
        """Override save to set metadata."""
        if self.file:
            self.filename = self.filename or os.path.basename(self.file.name)
            self.file_size = self.file.size
            
            # Detect if file is an image
            image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
            file_extension = self.filename.split('.')[-1].lower()
            self.is_image = file_extension in image_extensions
        
        super().save(*args, **kwargs)
    
    @property
    def file_url(self):
        """Get the URL of the attached file."""
        if self.file:
            return self.file.url
        return None
    
    @property
    def is_safe(self):
        """Check if the file is safe to download."""
        return self.scan_result == 'clean'


class ConversationParticipant(models.Model):
    """
    Model to track participant-specific settings for conversations.
    """
    
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='participant_settings'
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='conversation_settings'
    )
    
    # Participant preferences
    is_muted = models.BooleanField(
        _('is muted'),
        default=False,
        help_text=_('Whether notifications are muted for this conversation')
    )
    
    is_archived = models.BooleanField(
        _('is archived'),
        default=False,
        help_text=_('Whether this conversation is archived for the user')
    )
    
    is_blocked = models.BooleanField(
        _('is blocked'),
        default=False,
        help_text=_('Whether the user has blocked this conversation')
    )
    
    # Notifications
    email_notifications = models.BooleanField(
        _('email notifications'),
        default=True,
        help_text=_('Send email notifications for new messages')
    )
    
    push_notifications = models.BooleanField(
        _('push notifications'),
        default=True,
        help_text=_('Send push notifications for new messages')
    )
    
    # Timestamps
    joined_at = models.DateTimeField(_('joined at'), auto_now_add=True)
    last_read_at = models.DateTimeField(
        _('last read at'),
        null=True,
        blank=True,
        help_text=_('Last time the user read messages in this conversation')
    )
    
    class Meta:
        db_table = 'conversation_participants'
        verbose_name = _('Conversation Participant')
        verbose_name_plural = _('Conversation Participants')
        unique_together = ['conversation', 'user']
        indexes = [
            models.Index(fields=['conversation']),
            models.Index(fields=['user']),
            models.Index(fields=['is_archived']),
            models.Index(fields=['is_blocked']),
            models.Index(fields=['last_read_at']),
        ]
    
    def __str__(self):
        return f"{self.user.get_display_name()} in {self.conversation}"