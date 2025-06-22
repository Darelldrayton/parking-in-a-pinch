"""
Django admin configuration for the messaging app.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import (
    Conversation, Message, MessageAttachment, 
    MessageReadStatus, ConversationParticipant
)


class ConversationParticipantInline(admin.TabularInline):
    """Inline admin for conversation participants."""
    model = ConversationParticipant
    extra = 0
    readonly_fields = ['joined_at', 'last_read_at']
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        return super().get_queryset(request).select_related('user')


class MessageInline(admin.StackedInline):
    """Inline admin for messages."""
    model = Message
    extra = 0
    readonly_fields = ['message_id', 'sender', 'created_at', 'updated_at', 'delivered_at']
    fields = [
        'message_id', 'sender', 'content', 'message_type', 'status',
        'reply_to', 'is_deleted', 'is_edited', 'is_flagged',
        'created_at', 'updated_at', 'delivered_at'
    ]
    
    def get_queryset(self, request):
        """Limit to latest messages to avoid performance issues."""
        return super().get_queryset(request).select_related('sender')[:10]


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    """Admin for conversations."""
    list_display = [
        'conversation_id_short', 'conversation_type', 'status', 
        'participants_list', 'is_group', 'is_encrypted',
        'last_activity_at', 'created_at'
    ]
    list_filter = [
        'conversation_type', 'status', 'is_group', 'is_encrypted',
        'created_at', 'last_activity_at'
    ]
    search_fields = [
        'conversation_id', 'title', 'participants__first_name',
        'participants__last_name', 'participants__email'
    ]
    readonly_fields = [
        'conversation_id', 'created_at', 'updated_at', 'last_activity_at'
    ]
    filter_horizontal = ['participants']
    inlines = [ConversationParticipantInline, MessageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'conversation_id', 'conversation_type', 'status', 'title', 'is_group'
            )
        }),
        ('Related Objects', {
            'fields': ('booking', 'listing'),
            'classes': ('collapse',)
        }),
        ('Participants', {
            'fields': ('participants',)
        }),
        ('Settings', {
            'fields': ('is_encrypted', 'auto_delete_after_days'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_activity_at'),
            'classes': ('collapse',)
        }),
    )
    
    def conversation_id_short(self, obj):
        """Display shortened conversation ID."""
        return str(obj.conversation_id)[:8] + '...'
    conversation_id_short.short_description = 'ID'
    
    def participants_list(self, obj):
        """Display list of participants."""
        participants = obj.participants.all()[:3]  # Limit to first 3
        names = [p.get_display_name() for p in participants]
        result = ', '.join(names)
        if obj.participants.count() > 3:
            result += f' (+{obj.participants.count() - 3} more)'
        return result
    participants_list.short_description = 'Participants'
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).prefetch_related(
            'participants', 'messages'
        ).select_related('booking', 'listing')


class MessageAttachmentInline(admin.TabularInline):
    """Inline admin for message attachments."""
    model = MessageAttachment
    extra = 0
    readonly_fields = ['file_size', 'content_type', 'is_image', 'uploaded_at']
    fields = [
        'file', 'filename', 'file_size', 'content_type', 'is_image',
        'scan_result', 'uploaded_at'
    ]


class MessageReadStatusInline(admin.TabularInline):
    """Inline admin for message read status."""
    model = MessageReadStatus
    extra = 0
    readonly_fields = ['user', 'read_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Admin for messages."""
    list_display = [
        'message_id_short', 'conversation_link', 'sender_link', 
        'content_preview', 'message_type', 'status',
        'is_deleted', 'is_flagged', 'created_at'
    ]
    list_filter = [
        'message_type', 'status', 'is_deleted', 'is_edited', 'is_flagged',
        'created_at', 'conversation__conversation_type'
    ]
    search_fields = [
        'message_id', 'content', 'sender__first_name',
        'sender__last_name', 'sender__email'
    ]
    readonly_fields = [
        'message_id', 'sender', 'created_at', 'updated_at', 'delivered_at'
    ]
    inlines = [MessageAttachmentInline, MessageReadStatusInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'message_id', 'conversation', 'sender', 'content', 'message_type'
            )
        }),
        ('Status & Threading', {
            'fields': ('status', 'reply_to', 'delivered_at')
        }),
        ('Moderation', {
            'fields': ('is_deleted', 'is_edited', 'is_flagged'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def message_id_short(self, obj):
        """Display shortened message ID."""
        return str(obj.message_id)[:8] + '...'
    message_id_short.short_description = 'ID'
    
    def conversation_link(self, obj):
        """Link to the conversation."""
        url = reverse('admin:messaging_conversation_change', args=[obj.conversation.id])
        return format_html('<a href="{}">{}</a>', url, str(obj.conversation)[:30])
    conversation_link.short_description = 'Conversation'
    
    def sender_link(self, obj):
        """Link to the sender."""
        url = reverse('admin:users_user_change', args=[obj.sender.id])
        return format_html('<a href="{}">{}</a>', url, obj.sender.get_display_name())
    sender_link.short_description = 'Sender'
    
    def content_preview(self, obj):
        """Display content preview."""
        content = obj.get_content()
        if len(content) > 50:
            return content[:50] + '...'
        return content
    content_preview.short_description = 'Content'
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related(
            'conversation', 'sender', 'reply_to'
        ).prefetch_related('attachments', 'read_by')


@admin.register(MessageAttachment)
class MessageAttachmentAdmin(admin.ModelAdmin):
    """Admin for message attachments."""
    list_display = [
        'filename', 'message_link', 'file_size_formatted', 
        'content_type', 'is_image', 'scan_result', 'uploaded_at'
    ]
    list_filter = [
        'is_image', 'scan_result', 'content_type', 'uploaded_at'
    ]
    search_fields = ['filename', 'message__content', 'message__sender__email']
    readonly_fields = [
        'file_size', 'content_type', 'is_image', 'uploaded_at'
    ]
    
    fieldsets = (
        ('File Information', {
            'fields': ('file', 'filename', 'file_size', 'content_type', 'is_image')
        }),
        ('Message', {
            'fields': ('message',)
        }),
        ('Security', {
            'fields': ('is_scanned', 'scan_result'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('alt_text', 'uploaded_at'),
            'classes': ('collapse',)
        }),
    )
    
    def message_link(self, obj):
        """Link to the message."""
        url = reverse('admin:messaging_message_change', args=[obj.message.id])
        return format_html('<a href="{}">{}</a>', url, f"Message {str(obj.message.message_id)[:8]}")
    message_link.short_description = 'Message'
    
    def file_size_formatted(self, obj):
        """Format file size in human-readable format."""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    file_size_formatted.short_description = 'Size'
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('message')


@admin.register(MessageReadStatus)
class MessageReadStatusAdmin(admin.ModelAdmin):
    """Admin for message read status."""
    list_display = ['message_link', 'user_link', 'read_at']
    list_filter = ['read_at']
    search_fields = [
        'message__content', 'user__first_name', 'user__last_name', 'user__email'
    ]
    readonly_fields = ['read_at']
    
    def message_link(self, obj):
        """Link to the message."""
        url = reverse('admin:messaging_message_change', args=[obj.message.id])
        return format_html('<a href="{}">{}</a>', url, f"Message {str(obj.message.message_id)[:8]}")
    message_link.short_description = 'Message'
    
    def user_link(self, obj):
        """Link to the user."""
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.get_display_name())
    user_link.short_description = 'User'
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('message', 'user')


@admin.register(ConversationParticipant)
class ConversationParticipantAdmin(admin.ModelAdmin):
    """Admin for conversation participants."""
    list_display = [
        'conversation_link', 'user_link', 'is_muted', 'is_archived', 
        'is_blocked', 'joined_at'
    ]
    list_filter = [
        'is_muted', 'is_archived', 'is_blocked', 'email_notifications',
        'push_notifications', 'joined_at'
    ]
    search_fields = [
        'conversation__title', 'user__first_name', 'user__last_name', 'user__email'
    ]
    readonly_fields = ['joined_at', 'last_read_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('conversation', 'user', 'joined_at')
        }),
        ('Preferences', {
            'fields': ('is_muted', 'is_archived', 'is_blocked')
        }),
        ('Notifications', {
            'fields': ('email_notifications', 'push_notifications'),
            'classes': ('collapse',)
        }),
        ('Activity', {
            'fields': ('last_read_at',),
            'classes': ('collapse',)
        }),
    )
    
    def conversation_link(self, obj):
        """Link to the conversation."""
        url = reverse('admin:messaging_conversation_change', args=[obj.conversation.id])
        return format_html('<a href="{}">{}</a>', url, str(obj.conversation)[:30])
    conversation_link.short_description = 'Conversation'
    
    def user_link(self, obj):
        """Link to the user."""
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.get_display_name())
    user_link.short_description = 'User'
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('conversation', 'user')