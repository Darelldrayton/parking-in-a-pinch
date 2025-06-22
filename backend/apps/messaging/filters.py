"""
Django filters for the messaging app.
"""
import django_filters
from django.db.models import Q
from .models import Conversation, Message, ConversationType, MessageStatus


class ConversationFilter(django_filters.FilterSet):
    """
    Filter for conversations with advanced search capabilities.
    """
    
    # Basic filters
    conversation_type = django_filters.ChoiceFilter(
        choices=ConversationType.choices,
        help_text="Filter by conversation type"
    )
    
    status = django_filters.CharFilter(
        field_name='status',
        help_text="Filter by conversation status"
    )
    
    is_group = django_filters.BooleanFilter(
        help_text="Filter group vs direct conversations"
    )
    
    is_encrypted = django_filters.BooleanFilter(
        help_text="Filter encrypted conversations"
    )
    
    # Related object filters
    booking = django_filters.NumberFilter(
        field_name='booking__id',
        help_text="Filter by booking ID"
    )
    
    listing = django_filters.NumberFilter(
        field_name='listing__id',
        help_text="Filter by listing ID"
    )
    
    # Participant filters
    participant_email = django_filters.CharFilter(
        field_name='participants__email',
        lookup_expr='iexact',
        help_text="Filter by participant email"
    )
    
    participant_name = django_filters.CharFilter(
        method='filter_by_participant_name',
        help_text="Filter by participant name"
    )
    
    # Time-based filters
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text="Filter conversations created after this date"
    )
    
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text="Filter conversations created before this date"
    )
    
    last_activity_after = django_filters.DateTimeFilter(
        field_name='last_activity_at',
        lookup_expr='gte',
        help_text="Filter by last activity after this date"
    )
    
    last_activity_before = django_filters.DateTimeFilter(
        field_name='last_activity_at',
        lookup_expr='lte',
        help_text="Filter by last activity before this date"
    )
    
    # User-specific filters
    is_archived = django_filters.BooleanFilter(
        method='filter_by_archived_status',
        help_text="Filter archived conversations for current user"
    )
    
    is_muted = django_filters.BooleanFilter(
        method='filter_by_muted_status',
        help_text="Filter muted conversations for current user"
    )
    
    has_unread = django_filters.BooleanFilter(
        method='filter_by_unread_status',
        help_text="Filter conversations with unread messages"
    )
    
    # Content search
    search = django_filters.CharFilter(
        method='filter_by_search',
        help_text="Search in conversation title and participant names"
    )
    
    class Meta:
        model = Conversation
        fields = [
            'conversation_type', 'status', 'is_group', 'is_encrypted',
            'booking', 'listing', 'participant_email', 'participant_name',
            'created_after', 'created_before', 'last_activity_after',
            'last_activity_before', 'is_archived', 'is_muted', 'has_unread',
            'search'
        ]
    
    def filter_by_participant_name(self, queryset, name, value):
        """Filter by participant first name or last name."""
        return queryset.filter(
            Q(participants__first_name__icontains=value) |
            Q(participants__last_name__icontains=value)
        ).distinct()
    
    def filter_by_archived_status(self, queryset, name, value):
        """Filter by archived status for the current user."""
        if not hasattr(self.request, 'user') or not self.request.user.is_authenticated:
            return queryset.none()
        
        return queryset.filter(
            participant_settings__user=self.request.user,
            participant_settings__is_archived=value
        )
    
    def filter_by_muted_status(self, queryset, name, value):
        """Filter by muted status for the current user."""
        if not hasattr(self.request, 'user') or not self.request.user.is_authenticated:
            return queryset.none()
        
        return queryset.filter(
            participant_settings__user=self.request.user,
            participant_settings__is_muted=value
        )
    
    def filter_by_unread_status(self, queryset, name, value):
        """Filter conversations with unread messages for the current user."""
        if not hasattr(self.request, 'user') or not self.request.user.is_authenticated:
            return queryset.none()
        
        user = self.request.user
        
        if value:
            # Conversations with unread messages
            return queryset.filter(
                messages__read_by__isnull=True
            ).exclude(
                messages__sender=user
            ).distinct()
        else:
            # Conversations with no unread messages
            unread_conversation_ids = queryset.filter(
                messages__read_by__isnull=True
            ).exclude(
                messages__sender=user
            ).values_list('id', flat=True)
            
            return queryset.exclude(id__in=unread_conversation_ids)
    
    def filter_by_search(self, queryset, name, value):
        """Search in conversation title and participant information."""
        return queryset.filter(
            Q(title__icontains=value) |
            Q(participants__first_name__icontains=value) |
            Q(participants__last_name__icontains=value) |
            Q(participants__email__icontains=value)
        ).distinct()


class MessageFilter(django_filters.FilterSet):
    """
    Filter for messages with advanced search capabilities.
    """
    
    # Basic filters
    conversation = django_filters.NumberFilter(
        field_name='conversation__id',
        help_text="Filter by conversation ID"
    )
    
    sender = django_filters.NumberFilter(
        field_name='sender__id',
        help_text="Filter by sender user ID"
    )
    
    sender_email = django_filters.CharFilter(
        field_name='sender__email',
        lookup_expr='iexact',
        help_text="Filter by sender email"
    )
    
    message_type = django_filters.ChoiceFilter(
        choices=[
            ('text', 'Text'),
            ('image', 'Image'),
            ('file', 'File'),
            ('system', 'System Message'),
        ],
        help_text="Filter by message type"
    )
    
    status = django_filters.ChoiceFilter(
        choices=MessageStatus.choices,
        help_text="Filter by message status"
    )
    
    # Content filters
    content_contains = django_filters.CharFilter(
        field_name='content',
        lookup_expr='icontains',
        help_text="Filter messages containing specific text"
    )
    
    # Reply and threading
    is_reply = django_filters.BooleanFilter(
        field_name='reply_to__isnull',
        lookup_expr='exact',
        help_text="Filter messages that are replies"
    )
    
    reply_to = django_filters.NumberFilter(
        field_name='reply_to__id',
        help_text="Filter replies to specific message ID"
    )
    
    # State filters
    is_deleted = django_filters.BooleanFilter(
        help_text="Filter deleted messages"
    )
    
    is_edited = django_filters.BooleanFilter(
        help_text="Filter edited messages"
    )
    
    is_flagged = django_filters.BooleanFilter(
        help_text="Filter flagged messages"
    )
    
    # Time-based filters
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte',
        help_text="Filter messages created after this date"
    )
    
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte',
        help_text="Filter messages created before this date"
    )
    
    delivered_after = django_filters.DateTimeFilter(
        field_name='delivered_at',
        lookup_expr='gte',
        help_text="Filter messages delivered after this date"
    )
    
    delivered_before = django_filters.DateTimeFilter(
        field_name='delivered_at',
        lookup_expr='lte',
        help_text="Filter messages delivered before this date"
    )
    
    # Attachment filters
    has_attachments = django_filters.BooleanFilter(
        method='filter_by_attachments',
        help_text="Filter messages with or without attachments"
    )
    
    attachment_type = django_filters.CharFilter(
        method='filter_by_attachment_type',
        help_text="Filter by attachment type (image, document, etc.)"
    )
    
    # Read status filters
    is_read_by_me = django_filters.BooleanFilter(
        method='filter_by_read_status',
        help_text="Filter messages read by current user"
    )
    
    unread_only = django_filters.BooleanFilter(
        method='filter_unread_only',
        help_text="Show only unread messages for current user"
    )
    
    # Advanced search
    search = django_filters.CharFilter(
        method='filter_by_search',
        help_text="Search in message content and sender information"
    )
    
    # Date range filter
    date_range = django_filters.DateFromToRangeFilter(
        field_name='created_at',
        help_text="Filter messages within date range"
    )
    
    class Meta:
        model = Message
        fields = [
            'conversation', 'sender', 'sender_email', 'message_type', 'status',
            'content_contains', 'is_reply', 'reply_to', 'is_deleted', 'is_edited',
            'is_flagged', 'created_after', 'created_before', 'delivered_after',
            'delivered_before', 'has_attachments', 'attachment_type',
            'is_read_by_me', 'unread_only', 'search', 'date_range'
        ]
    
    def filter_by_attachments(self, queryset, name, value):
        """Filter messages by attachment presence."""
        if value:
            return queryset.filter(attachments__isnull=False).distinct()
        else:
            return queryset.filter(attachments__isnull=True)
    
    def filter_by_attachment_type(self, queryset, name, value):
        """Filter by attachment type."""
        type_mapping = {
            'image': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            'document': ['pdf', 'doc', 'docx', 'txt', 'rtf'],
            'media': ['mp3', 'wav', 'mp4', 'avi', 'mov'],
        }
        
        if value.lower() in type_mapping:
            extensions = type_mapping[value.lower()]
            extension_filters = Q()
            for ext in extensions:
                extension_filters |= Q(attachments__filename__iendswith=f'.{ext}')
            
            return queryset.filter(extension_filters).distinct()
        
        return queryset
    
    def filter_by_read_status(self, queryset, name, value):
        """Filter by read status for current user."""
        if not hasattr(self.request, 'user') or not self.request.user.is_authenticated:
            return queryset.none()
        
        user = self.request.user
        
        if value:
            # Messages read by current user
            return queryset.filter(read_by__user=user)
        else:
            # Messages not read by current user (excluding own messages)
            return queryset.exclude(read_by__user=user).exclude(sender=user)
    
    def filter_unread_only(self, queryset, name, value):
        """Show only unread messages for current user."""
        if not hasattr(self.request, 'user') or not self.request.user.is_authenticated:
            return queryset.none()
        
        if value:
            user = self.request.user
            return queryset.exclude(
                read_by__user=user
            ).exclude(
                sender=user
            )
        
        return queryset
    
    def filter_by_search(self, queryset, name, value):
        """Advanced search in message content and sender information."""
        return queryset.filter(
            Q(content__icontains=value) |
            Q(sender__first_name__icontains=value) |
            Q(sender__last_name__icontains=value) |
            Q(sender__email__icontains=value)
        ).distinct()


class MessageAttachmentFilter(django_filters.FilterSet):
    """
    Filter for message attachments.
    """
    
    # Basic filters
    message = django_filters.NumberFilter(
        field_name='message__id',
        help_text="Filter by message ID"
    )
    
    conversation = django_filters.NumberFilter(
        field_name='message__conversation__id',
        help_text="Filter by conversation ID"
    )
    
    is_image = django_filters.BooleanFilter(
        help_text="Filter image attachments"
    )
    
    scan_result = django_filters.ChoiceFilter(
        choices=[
            ('clean', 'Clean'),
            ('infected', 'Infected'),
            ('suspicious', 'Suspicious'),
            ('pending', 'Pending'),
        ],
        help_text="Filter by scan result"
    )
    
    # File properties
    filename_contains = django_filters.CharFilter(
        field_name='filename',
        lookup_expr='icontains',
        help_text="Filter by filename content"
    )
    
    content_type = django_filters.CharFilter(
        help_text="Filter by MIME type"
    )
    
    file_size_min = django_filters.NumberFilter(
        field_name='file_size',
        lookup_expr='gte',
        help_text="Minimum file size in bytes"
    )
    
    file_size_max = django_filters.NumberFilter(
        field_name='file_size',
        lookup_expr='lte',
        help_text="Maximum file size in bytes"
    )
    
    # Time filters
    uploaded_after = django_filters.DateTimeFilter(
        field_name='uploaded_at',
        lookup_expr='gte',
        help_text="Filter attachments uploaded after this date"
    )
    
    uploaded_before = django_filters.DateTimeFilter(
        field_name='uploaded_at',
        lookup_expr='lte',
        help_text="Filter attachments uploaded before this date"
    )
    
    # File extension filter
    file_extension = django_filters.CharFilter(
        method='filter_by_extension',
        help_text="Filter by file extension"
    )
    
    class Meta:
        model = Message
        fields = [
            'message', 'conversation', 'is_image', 'scan_result',
            'filename_contains', 'content_type', 'file_size_min',
            'file_size_max', 'uploaded_after', 'uploaded_before',
            'file_extension'
        ]
    
    def filter_by_extension(self, queryset, name, value):
        """Filter by file extension."""
        return queryset.filter(filename__iendswith=f'.{value.lower()}')