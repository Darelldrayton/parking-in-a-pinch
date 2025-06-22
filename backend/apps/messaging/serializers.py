"""
DRF serializers for the messaging app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from .models import (
    Conversation, Message, MessageAttachment, 
    MessageReadStatus, ConversationParticipant,
    ConversationType, MessageStatus
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user serializer for messaging contexts."""
    display_name = serializers.CharField(source='get_display_name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'display_name', 'profile_picture']
        read_only_fields = ['id', 'email']


class MessageAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for message attachments."""
    file_url = serializers.ReadOnlyField()
    is_safe = serializers.ReadOnlyField()
    
    class Meta:
        model = MessageAttachment
        fields = [
            'id', 'file', 'filename', 'file_size', 'content_type',
            'alt_text', 'is_image', 'file_url', 'is_safe',
            'scan_result', 'uploaded_at'
        ]
        read_only_fields = [
            'id', 'file_size', 'content_type', 'is_image', 
            'is_scanned', 'scan_result', 'uploaded_at'
        ]


class MessageReadStatusSerializer(serializers.ModelSerializer):
    """Serializer for message read status."""
    user_display_name = serializers.CharField(source='user.get_display_name', read_only=True)
    
    class Meta:
        model = MessageReadStatus
        fields = ['user', 'user_display_name', 'read_at']
        read_only_fields = ['read_at']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages."""
    sender_display_name = serializers.CharField(source='sender.get_display_name', read_only=True)
    sender_profile_picture = serializers.ImageField(source='sender.profile_picture', read_only=True)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    read_by = MessageReadStatusSerializer(many=True, read_only=True)
    reply_to_message = serializers.SerializerMethodField()
    is_own_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'message_id', 'conversation', 'sender', 'sender_display_name',
            'sender_profile_picture', 'content', 'message_type', 'status',
            'reply_to', 'reply_to_message', 'attachments', 'read_by',
            'is_deleted', 'is_edited', 'is_flagged', 'is_own_message',
            'created_at', 'updated_at', 'delivered_at'
        ]
        read_only_fields = [
            'id', 'message_id', 'sender', 'status', 'is_deleted', 
            'is_edited', 'is_flagged', 'created_at', 'updated_at', 'delivered_at'
        ]
    
    def get_reply_to_message(self, obj):
        """Get basic info about the message this is replying to."""
        if obj.reply_to:
            return {
                'id': obj.reply_to.id,
                'content': obj.reply_to.get_content()[:100] + '...' if len(obj.reply_to.get_content()) > 100 else obj.reply_to.get_content(),
                'sender_display_name': obj.reply_to.sender.get_display_name(),
                'created_at': obj.reply_to.created_at
            }
        return None
    
    def get_is_own_message(self, obj):
        """Check if the current user is the sender of this message."""
        request = self.context.get('request')
        if request and request.user:
            return obj.sender == request.user
        return False
    
    def validate_content(self, value):
        """Validate message content."""
        if not value.strip():
            raise serializers.ValidationError("Message content cannot be empty.")
        
        if len(value) > 5000:  # Reasonable message length limit
            raise serializers.ValidationError("Message is too long. Maximum 5000 characters.")
        
        return value
    
    def create(self, validated_data):
        """Create a new message."""
        # Set the sender to the current user
        validated_data['sender'] = self.context['request'].user
        
        # Set initial status
        validated_data['status'] = MessageStatus.SENT
        
        return super().create(validated_data)


class CreateMessageSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating messages."""
    attachment_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = Message
        fields = ['conversation', 'content', 'message_type', 'reply_to', 'attachment_files']
    
    def validate_attachment_files(self, value):
        """Validate attachment files."""
        if not value:
            return value
        
        # Limit number of attachments
        if len(value) > 5:
            raise serializers.ValidationError("Maximum 5 attachments per message.")
        
        # Check file sizes
        max_size = 10 * 1024 * 1024  # 10MB
        for file in value:
            if file.size > max_size:
                raise serializers.ValidationError(f"File {file.name} is too large. Maximum size is 10MB.")
        
        return value
    
    def create(self, validated_data):
        """Create message with attachments."""
        attachment_files = validated_data.pop('attachment_files', [])
        
        with transaction.atomic():
            # Create the message
            message = super().create(validated_data)
            
            # Create attachments
            for file in attachment_files:
                MessageAttachment.objects.create(
                    message=message,
                    file=file,
                    filename=file.name,
                    content_type=getattr(file, 'content_type', 'application/octet-stream')
                )
            
            return message


class ConversationParticipantSerializer(serializers.ModelSerializer):
    """Serializer for conversation participants."""
    user = UserBasicSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ConversationParticipant
        fields = [
            'user', 'is_muted', 'is_archived', 'is_blocked',
            'email_notifications', 'push_notifications',
            'joined_at', 'last_read_at', 'unread_count'
        ]
        read_only_fields = ['joined_at']
    
    def get_unread_count(self, obj):
        """Get unread message count for this participant."""
        return obj.conversation.get_unread_count(obj.user)


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversations."""
    participants = UserBasicSerializer(many=True, read_only=True)
    participant_settings = ConversationParticipantSerializer(many=True, read_only=True)
    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    
    # Related object details
    booking_details = serializers.SerializerMethodField()
    listing_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'conversation_id', 'participants', 'participant_settings',
            'conversation_type', 'status', 'booking', 'listing',
            'booking_details', 'listing_details', 'title', 'is_group',
            'is_encrypted', 'auto_delete_after_days', 'last_message',
            'unread_count', 'other_participant', 'created_at', 
            'updated_at', 'last_activity_at'
        ]
        read_only_fields = [
            'id', 'conversation_id', 'participants', 'last_message',
            'created_at', 'updated_at', 'last_activity_at'
        ]
    
    def get_unread_count(self, obj):
        """Get unread message count for current user."""
        request = self.context.get('request')
        if request and request.user:
            return obj.get_unread_count(request.user)
        return 0
    
    def get_other_participant(self, obj):
        """Get the other participant in a two-person conversation."""
        request = self.context.get('request')
        if request and request.user and not obj.is_group:
            other_participant = obj.get_other_participant(request.user)
            if other_participant:
                return UserBasicSerializer(other_participant).data
        return None
    
    def get_booking_details(self, obj):
        """Get basic booking details if conversation is booking-related."""
        if obj.booking:
            return {
                'id': obj.booking.id,
                'booking_id': obj.booking.booking_id,
                'start_time': obj.booking.start_time,
                'end_time': obj.booking.end_time,
                'status': obj.booking.status
            }
        return None
    
    def get_listing_details(self, obj):
        """Get basic listing details if conversation is listing-related."""
        if obj.listing:
            return {
                'id': obj.listing.id,
                'title': obj.listing.title,
                'address': obj.listing.address,
                'hourly_rate': obj.listing.hourly_rate
            }
        return None


class CreateConversationSerializer(serializers.ModelSerializer):
    """Serializer for creating conversations."""
    participant_emails = serializers.ListField(
        child=serializers.EmailField(),
        write_only=True,
        required=False
    )
    initial_message = serializers.CharField(
        write_only=True,
        required=False,
        max_length=5000
    )
    
    class Meta:
        model = Conversation
        fields = [
            'conversation_type', 'booking', 'listing', 'title', 
            'is_group', 'is_encrypted', 'auto_delete_after_days',
            'participant_emails', 'initial_message'
        ]
    
    def validate_participant_emails(self, value):
        """Validate participant emails."""
        if not value:
            return value
        
        # Limit number of participants
        if len(value) > 10:
            raise serializers.ValidationError("Maximum 10 participants allowed.")
        
        # Check if users exist
        existing_users = User.objects.filter(email__in=value)
        if existing_users.count() != len(value):
            existing_emails = set(existing_users.values_list('email', flat=True))
            missing_emails = set(value) - existing_emails
            raise serializers.ValidationError(
                f"Users with these emails do not exist: {', '.join(missing_emails)}"
            )
        
        return value
    
    def validate(self, data):
        """Validate conversation data."""
        conversation_type = data.get('conversation_type')
        booking = data.get('booking')
        listing = data.get('listing')
        
        # Validate booking-related conversations
        if conversation_type == ConversationType.BOOKING and not booking:
            raise serializers.ValidationError(
                "Booking must be specified for booking-related conversations."
            )
        
        # Validate listing inquiry conversations
        if conversation_type == ConversationType.INQUIRY and not listing:
            raise serializers.ValidationError(
                "Listing must be specified for listing inquiry conversations."
            )
        
        return data
    
    def create(self, validated_data):
        """Create conversation with participants and initial message."""
        participant_emails = validated_data.pop('participant_emails', [])
        initial_message_content = validated_data.pop('initial_message', None)
        
        with transaction.atomic():
            # Create the conversation
            conversation = super().create(validated_data)
            
            # Add current user as participant
            current_user = self.context['request'].user
            conversation.participants.add(current_user)
            
            # Add other participants
            if participant_emails:
                other_users = User.objects.filter(email__in=participant_emails)
                conversation.participants.add(*other_users)
            
            # Create participant settings for each user
            for participant in conversation.participants.all():
                ConversationParticipant.objects.create(
                    conversation=conversation,
                    user=participant
                )
            
            # Create initial message if provided
            if initial_message_content:
                Message.objects.create(
                    conversation=conversation,
                    sender=current_user,
                    content=initial_message_content,
                    status=MessageStatus.SENT
                )
            
            return conversation


class ConversationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for conversation lists."""
    other_participant = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'conversation_id', 'conversation_type', 'status',
            'title', 'is_group', 'other_participant', 'last_message_preview',
            'unread_count', 'last_activity_at'
        ]
    
    def get_other_participant(self, obj):
        """Get the other participant for display."""
        request = self.context.get('request')
        if request and request.user and not obj.is_group:
            other_participant = obj.get_other_participant(request.user)
            if other_participant:
                return {
                    'id': other_participant.id,
                    'display_name': other_participant.get_display_name(),
                    'profile_picture': other_participant.profile_picture.url if other_participant.profile_picture else None
                }
        return None
    
    def get_last_message_preview(self, obj):
        """Get a preview of the last message."""
        last_message = obj.last_message
        if last_message:
            content = last_message.get_content()
            preview = content[:100] + '...' if len(content) > 100 else content
            return {
                'content': preview,
                'sender_display_name': last_message.sender.get_display_name(),
                'created_at': last_message.created_at,
                'message_type': last_message.message_type
            }
        return None
    
    def get_unread_count(self, obj):
        """Get unread message count."""
        request = self.context.get('request')
        if request and request.user:
            return obj.get_unread_count(request.user)
        return 0


class ConversationSettingsSerializer(serializers.ModelSerializer):
    """Serializer for updating conversation participant settings."""
    
    class Meta:
        model = ConversationParticipant
        fields = [
            'is_muted', 'is_archived', 'email_notifications', 
            'push_notifications'
        ]
    
    def update(self, instance, validated_data):
        """Update participant settings."""
        # Update last_read_at when settings are changed
        if not instance.is_archived and validated_data.get('is_archived'):
            # Mark all messages as read when archiving
            instance.conversation.mark_as_read(instance.user)
        
        return super().update(instance, validated_data)