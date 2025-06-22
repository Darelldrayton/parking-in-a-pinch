"""
Django signals for the messaging app.
"""
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

from .models import (
    Message, Conversation, MessageReadStatus, 
    ConversationParticipant, MessageAttachment
)

User = get_user_model()
channel_layer = get_channel_layer()


@receiver(post_save, sender=Message)
def handle_new_message(sender, instance, created, **kwargs):
    """Handle actions when a new message is created."""
    if not created:
        return
    
    message = instance
    conversation = message.conversation
    
    # Update conversation last activity
    conversation.last_activity_at = message.created_at
    conversation.save(update_fields=['last_activity_at'])
    
    # Send real-time notification via WebSocket
    send_message_notification(message)
    
    # 🚨 Critical Success Notification: Send message notifications to participants
    send_critical_message_notifications(message)
    
    # Send general message notifications for non-booking conversations
    send_general_message_notifications(message)
    
    # Send push notifications to participants
    send_push_notifications(message)
    
    # Send email notifications if enabled
    send_email_notifications(message)
    
    # Auto-mark as delivered for demo purposes
    if message.status == 'sent':
        message.status = 'delivered'
        message.delivered_at = timezone.now()
        message.save(update_fields=['status', 'delivered_at'])


@receiver(post_save, sender=MessageReadStatus)
def handle_message_read(sender, instance, created, **kwargs):
    """Handle when a message is marked as read."""
    if not created:
        return
    
    read_status = instance
    message = read_status.message
    user = read_status.user
    
    # Update participant's last read time
    try:
        participant = ConversationParticipant.objects.get(
            conversation=message.conversation,
            user=user
        )
        participant.last_read_at = read_status.read_at
        participant.save(update_fields=['last_read_at'])
    except ConversationParticipant.DoesNotExist:
        pass
    
    # Send real-time read receipt notification
    send_read_receipt_notification(message, user)


@receiver(post_save, sender=ConversationParticipant)
def handle_participant_added(sender, instance, created, **kwargs):
    """Handle when a participant is added to a conversation."""
    if not created:
        return
    
    participant = instance
    conversation = participant.conversation
    user = participant.user
    
    # Send notification about being added to conversation
    send_participant_added_notification(conversation, user)
    
    # Create system message if it's a group conversation
    if conversation.is_group and conversation.participants.count() > 2:
        Message.objects.create(
            conversation=conversation,
            sender=user,  # This would ideally be the user who added them
            content=f"{user.get_display_name()} was added to the conversation",
            message_type='system'
        )


@receiver(post_delete, sender=ConversationParticipant)
def handle_participant_removed(sender, instance, **kwargs):
    """Handle when a participant is removed from a conversation."""
    participant = instance
    conversation = participant.conversation
    user = participant.user
    
    # Create system message if it's a group conversation
    if conversation.is_group:
        Message.objects.create(
            conversation=conversation,
            sender=user,
            content=f"{user.get_display_name()} left the conversation",
            message_type='system'
        )


@receiver(pre_save, sender=Message)
def handle_message_encryption(sender, instance, **kwargs):
    """Handle message encryption before saving."""
    if instance.conversation.is_encrypted and instance.content and not instance.encrypted_content:
        # The encryption is handled in the model's save method
        pass


@receiver(post_save, sender=MessageAttachment)
def handle_attachment_upload(sender, instance, created, **kwargs):
    """Handle when a new attachment is uploaded."""
    if not created:
        return
    
    attachment = instance
    
    # Queue file for security scanning
    queue_file_scan(attachment)
    
    # Send notification about new attachment
    send_attachment_notification(attachment)


def send_message_notification(message):
    """Send real-time message notification via WebSocket."""
    if not channel_layer:
        print(f"Message notification queued for conversation {message.conversation.conversation_id}")
        return
    
    # Send to all conversation participants except the sender
    participants = message.conversation.participants.exclude(id=message.sender.id)
    
    for participant in participants:
        notification_data = {
            'type': 'new_message',
            'message_id': message.id,
            'sender': {
                'id': message.sender.id,
                'name': message.sender.get_full_name() or message.sender.username,
            },
            'content': message.content,
            'timestamp': message.created_at.isoformat(),
            'conversation_id': str(message.conversation.conversation_id),
        }
        
        async_to_sync(channel_layer.group_send)(
            f"notifications_user_{participant.id}",
            {
                'type': 'notification_message',
                'notification': notification_data
            }
        )


def send_read_receipt_notification(message, reader):
    """Send read receipt notification to message sender."""
    if not channel_layer:
        return
    
    if message.sender == reader:
        return  # Don't send read receipt to yourself
    
    read_data = {
        'type': 'message_read',
        'message_id': str(message.message_id),
        'reader': {
            'id': reader.id,
            'display_name': reader.get_display_name()
        },
        'read_at': timezone.now().isoformat()
    }
    
    group_name = f"user_{message.sender.id}"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'send_read_receipt',
            'message': json.dumps(read_data)
        }
    )


def send_participant_added_notification(conversation, user):
    """Send notification when a participant is added to conversation."""
    if not channel_layer:
        return
    
    notification_data = {
        'type': 'participant_added',
        'conversation_id': str(conversation.conversation_id),
        'user': {
            'id': user.id,
            'display_name': user.get_display_name()
        }
    }
    
    group_name = f"user_{user.id}"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            'type': 'send_notification',
            'message': json.dumps(notification_data)
        }
    )


def send_attachment_notification(attachment):
    """Send notification about new attachment."""
    if not channel_layer:
        return
    
    message = attachment.message
    conversation = message.conversation
    
    attachment_data = {
        'type': 'new_attachment',
        'message_id': str(message.message_id),
        'attachment': {
            'id': attachment.id,
            'filename': attachment.filename,
            'file_size': attachment.file_size,
            'is_image': attachment.is_image,
            'file_url': attachment.file_url
        }
    }
    
    # Send to all participants except the sender
    for participant in conversation.participants.exclude(id=message.sender.id):
        group_name = f"user_{participant.id}"
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'send_attachment',
                'message': json.dumps(attachment_data)
            }
        )


def send_push_notifications(message):
    """Send push notifications to conversation participants."""
    conversation = message.conversation
    sender = message.sender
    
    # Get participants who should receive notifications
    participants = ConversationParticipant.objects.filter(
        conversation=conversation,
        push_notifications=True,
        is_muted=False
    ).exclude(user=sender).select_related('user')
    
    for participant in participants:
        user = participant.user
        
        # Skip if user is currently active (would receive via WebSocket)
        if is_user_active(user):
            continue
        
        # Prepare notification content
        if conversation.is_group:
            title = conversation.title or "Group Message"
            body = f"{sender.get_display_name()}: {message.get_content()[:100]}"
        else:
            title = f"Message from {sender.get_display_name()}"
            body = message.get_content()[:100]
        
        # Queue push notification
        queue_push_notification(user, title, body, {
            'conversation_id': str(conversation.conversation_id),
            'message_id': str(message.message_id)
        })


def send_email_notifications(message):
    """Send email notifications to conversation participants."""
    conversation = message.conversation
    sender = message.sender
    
    # Get participants who should receive email notifications
    participants = ConversationParticipant.objects.filter(
        conversation=conversation,
        email_notifications=True,
        is_muted=False
    ).exclude(user=sender).select_related('user')
    
    for participant in participants:
        user = participant.user
        
        # Skip if user is currently active or has recent activity
        if is_user_recently_active(user):
            continue
        
        # Queue email notification
        queue_email_notification(user, message)


def queue_push_notification(user, title, body, data):
    """Queue a push notification for sending."""
    # This would typically use Celery to queue the notification
    # For now, we'll just log it
    print(f"Push notification queued for {user.email}: {title}")


def send_general_message_notifications(message):
    """
    Send general NEW_MESSAGE notifications for non-booking conversations.
    """
    conversation = message.conversation
    sender = message.sender
    
    # Skip if this is a booking conversation (handled by send_critical_message_notifications)
    if conversation.conversation_type == 'booking' and conversation.booking:
        return
    
    # Import notification service here to avoid circular imports
    from apps.notifications.services import NotificationService
    
    # Send notification to all participants except the sender
    recipients = conversation.participants.exclude(id=sender.id)
    
    for recipient in recipients:
        # Skip if participant has muted notifications
        try:
            participant_settings = ConversationParticipant.objects.get(
                conversation=conversation,
                user=recipient
            )
            if participant_settings.is_muted:
                continue
        except ConversationParticipant.DoesNotExist:
            pass
        
        # Send general NEW_MESSAGE notification
        context = {
            'sender_name': sender.get_full_name() or sender.username,
            'message_content': message.get_content()[:100] + ('...' if len(message.get_content()) > 100 else ''),
        }
        
        try:
            NotificationService.send_notification(
                user=recipient,
                template_type='NEW_MESSAGE',
                context=context,
                channels=['IN_APP', 'PUSH']
            )
            print(f"✅ Sent NEW_MESSAGE notification to {recipient.email}")
        except Exception as e:
            print(f"❌ Error sending NEW_MESSAGE notification: {str(e)}")


def send_critical_message_notifications(message):
    """
    Send critical success notifications when messages are sent between hosts and guests.
    This implements the HOST_MESSAGE and GUEST_MESSAGE notification templates.
    """
    conversation = message.conversation
    sender = message.sender
    
    # Only send critical notifications for booking-related conversations
    if conversation.conversation_type != 'booking' or not conversation.booking:
        return
    
    booking = conversation.booking
    host = booking.parking_space.host
    guest = booking.user
    
    # Import notification service here to avoid circular imports
    from apps.notifications.services import NotificationService
    
    # Determine who is receiving the message and send appropriate notification
    recipients = conversation.participants.exclude(id=sender.id)
    
    for recipient in recipients:
        # Skip if participant has muted notifications
        try:
            participant_settings = ConversationParticipant.objects.get(
                conversation=conversation,
                user=recipient
            )
            if participant_settings.is_muted:
                continue
        except ConversationParticipant.DoesNotExist:
            pass
        
        # Determine notification type based on sender and recipient roles
        if sender == host and recipient == guest:
            # Host is sending message to guest
            template_type = 'HOST_MESSAGE'
            context = {
                'host_name': host.get_full_name() or host.username,
                'message_content': message.get_content()[:100] + ('...' if len(message.get_content()) > 100 else ''),
            }
        elif sender == guest and recipient == host:
            # Guest is sending message to host  
            template_type = 'GUEST_MESSAGE'
            context = {
                'guest_name': guest.get_full_name() or guest.username,
                'message_content': message.get_content()[:100] + ('...' if len(message.get_content()) > 100 else ''),
            }
        else:
            # Unknown role combination, skip
            continue
        
        # Send the critical notification
        try:
            NotificationService.send_notification(
                user=recipient,
                template_type=template_type,
                context=context,
                channels=['IN_APP', 'PUSH']  # Don't spam with email for messages
            )
            print(f"✅ Sent {template_type} notification to {recipient.email}")
        except Exception as e:
            print(f"❌ Error sending {template_type} notification: {str(e)}")


def queue_email_notification(user, message):
    """Queue an email notification for sending."""
    # This would typically use Celery to queue the email
    # For now, we'll just log it
    print(f"Email notification queued for {user.email} about message from {message.sender.get_display_name()}")


def queue_file_scan(attachment):
    """Queue a file for security scanning."""
    # This would typically use Celery to queue the file scan
    # For now, we'll just mark it as clean
    attachment.is_scanned = True
    attachment.scan_result = 'clean'
    attachment.save(update_fields=['is_scanned', 'scan_result'])


def is_user_active(user):
    """Check if user is currently active (for push notification optimization)."""
    # This would check Redis cache or database for recent activity
    # For now, always return False
    return False


def is_user_recently_active(user):
    """Check if user was recently active (for email notification optimization)."""
    # This would check if user was active in the last hour
    # For now, always return False
    return False


# Auto-cleanup signals
@receiver(post_save, sender=Conversation)
def handle_auto_cleanup(sender, instance, created, **kwargs):
    """Handle auto-cleanup of old messages if enabled."""
    if not instance.auto_delete_after_days:
        return
    
    # Queue cleanup task
    queue_message_cleanup(instance)


def queue_message_cleanup(conversation):
    """Queue cleanup of old messages for a conversation."""
    # This would typically use Celery to queue the cleanup
    # For now, we'll just log it
    print(f"Message cleanup queued for conversation {conversation.conversation_id}")


# Performance optimization signals
@receiver(post_save, sender=Message)
def update_conversation_cache(sender, instance, created, **kwargs):
    """Update conversation-related cache when messages change."""
    if not created:
        return
    
    conversation = instance.conversation
    
    # This would typically update Redis cache with conversation summary
    # For now, we'll just log it
    print(f"Cache updated for conversation {conversation.conversation_id}")


@receiver(post_delete, sender=Message)
def cleanup_orphaned_attachments(sender, instance, **kwargs):
    """Clean up attachments when a message is deleted."""
    message = instance
    
    # Delete associated attachments
    for attachment in message.attachments.all():
        if attachment.file:
            attachment.file.delete(save=False)
        attachment.delete()


# Moderation signals
@receiver(post_save, sender=Message)
def handle_message_moderation(sender, instance, created, **kwargs):
    """Handle message moderation when flagged."""
    if not created or not instance.is_flagged:
        return
    
    # Queue moderation review
    queue_moderation_review(instance)


def queue_moderation_review(message):
    """Queue a message for moderation review."""
    # This would typically create a moderation task
    print(f"Moderation review queued for message {message.message_id}")


# Spam detection signals
@receiver(pre_save, sender=Message)
def detect_spam(sender, instance, **kwargs):
    """Basic spam detection before saving message."""
    content = instance.content
    
    # Simple spam detection (in production, use more sophisticated methods)
    spam_keywords = ['spam', 'scam', 'phishing', 'urgent money']
    
    if any(keyword in content.lower() for keyword in spam_keywords):
        instance.is_flagged = True
        print(f"Potential spam detected in message: {content[:50]}...")


# Analytics signals
@receiver(post_save, sender=Message)
def track_message_analytics(sender, instance, created, **kwargs):
    """Track message analytics."""
    if not created:
        return
    
    # This would typically send analytics data to a service
    print(f"Analytics: New message in conversation {instance.conversation.conversation_id}")