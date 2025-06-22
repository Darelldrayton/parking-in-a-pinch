"""
Notification Services
"""
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.conf import settings
from django.template import Template, Context
from django.core.mail import send_mail
from django.utils import timezone
from twilio.rest import Client
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import (
    Notification, NotificationTemplate, NotificationPreference,
    PushSubscription, NotificationChannel, NotificationCategory
)

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()


class NotificationService:
    """Base notification service"""
    
    @staticmethod
    def send_notification(user, template_type, context=None, channels=None):
        """
        Modern send notification method that supports multiple channels
        
        Args:
            user: User to send notification to
            template_type: Type of template (e.g., 'BOOKING_CONFIRMED')
            context: Template context variables
            channels: List of channels to send on (e.g., ['IN_APP', 'EMAIL'])
        """
        if not channels:
            channels = ['IN_APP']
            
        notifications_sent = []
        
        for channel in channels:
            try:
                # Map channel names to model values
                channel_map = {
                    'IN_APP': NotificationChannel.IN_APP,
                    'EMAIL': NotificationChannel.EMAIL,
                    'SMS': NotificationChannel.SMS,
                    'PUSH': NotificationChannel.PUSH,
                }
                
                channel_value = channel_map.get(channel, NotificationChannel.IN_APP)
                
                # Try the legacy method first
                notification = NotificationService._send_legacy_notification(
                    user, template_type, context, channel_value
                )
                
                if notification:
                    notifications_sent.append(notification)
                elif channel == 'IN_APP':
                    # For IN_APP notifications, create a simple notification even without template
                    notification = NotificationService._create_simple_notification(
                        user, template_type, context
                    )
                    if notification:
                        notifications_sent.append(notification)
                    
            except Exception as e:
                logger.error(f"Error sending {channel} notification to {user.id}: {str(e)}")
                
        return notifications_sent
    
    @staticmethod
    def _create_simple_notification(user, template_type, context):
        """Create a simple in-app notification without template"""
        try:
            # Get user preferences
            prefs, _ = NotificationPreference.objects.get_or_create(user=user)
            
            # Generate simple notification content based on template type
            notification_content = NotificationService._get_simple_content(template_type, context)
            
            if not notification_content:
                return None
            
            # Determine category based on template type
            category_map = {
                'NEW_MESSAGE': NotificationCategory.MESSAGE,
                'HOST_MESSAGE': NotificationCategory.MESSAGE,
                'GUEST_MESSAGE': NotificationCategory.MESSAGE,
            }
            category = category_map.get(template_type, NotificationCategory.BOOKING)
            
            # Create notification record
            notification = Notification.objects.create(
                user=user,
                template=None,  # No template for simple notifications
                channel=NotificationChannel.IN_APP,
                category=category,
                priority='normal',
                subject=notification_content['title'],
                content=notification_content['message'],
                recipient=user.email,
                variables=context or {}
            )
            
            # Send real-time notification via WebSocket
            NotificationService._send_websocket_notification(user, notification, notification_content)
            
            return notification
            
        except Exception as e:
            logger.error(f"Error creating simple notification: {str(e)}")
            return None
    
    @staticmethod
    def _get_simple_content(template_type, context):
        """Generate simple notification content"""
        content_templates = {
            # 🚨 Critical Success Notifications - Renter
            'BOOKING_CONFIRMED': {
                'title': 'Parking Confirmed! 🎉',
                'message': 'Your parking is confirmed for {parking_space_title} on {booking_date_time}',
                'type': 'booking_confirmed'
            },
            'CHECKIN_REMINDER': {
                'title': 'Parking Starts Soon ⏰',
                'message': 'Your parking starts in 15 minutes at {parking_space_title}. Tap for directions.',
                'type': 'checkin_reminder'
            },
            'PARKING_EXPIRATION_WARNING': {
                'title': 'Parking Expires Soon ⚠️',
                'message': 'Your parking expires in 30 minutes. Extend now?',
                'type': 'parking_expiration_warning'
            },
            'HOST_MESSAGE': {
                'title': 'Message from Your Host 💬',
                'message': '{host_name}: {message_content}',
                'type': 'host_message'
            },
            
            # 🚨 Critical Success Notifications - Host
            'NEW_BOOKING_REQUEST': {
                'title': 'New Booking! 📅',
                'message': 'New booking for {booking_date_time}',
                'type': 'new_booking'
            },
            'INSTANT_BOOKING': {
                'title': 'Space Booked Instantly! ⚡',
                'message': 'Your space was just booked for {booking_date_time}',
                'type': 'instant_booking'
            },
            'GUEST_MESSAGE': {
                'title': 'Message from Guest 💬',
                'message': '{guest_name}: {message_content}',
                'type': 'guest_message'
            },
            'REVIEW_RECEIVED': {
                'title': 'New Review! ⭐',
                'message': 'You received a {rating}-star review! Respond to boost your rating',
                'type': 'review_received'
            },
            
            # Message notifications
            'NEW_MESSAGE': {
                'title': 'New Message 💬',
                'message': '{sender_name}: {message_content}',
                'type': 'new_message'
            },
            
            # Legacy notifications
            'NEW_BOOKING': {
                'title': 'New Booking Request',
                'message': '{renter_name} has booked your parking space "{parking_space_title}".',
                'type': 'new_booking'
            },
            'BOOKING_CANCELLED': {
                'title': 'Booking Cancelled',
                'message': 'Your booking has been cancelled.',
                'type': 'booking_cancelled'
            },
            'LISTING_APPROVED': {
                'title': 'Listing Approved',
                'message': 'Your parking listing "{listing_title}" has been approved and is now live!',
                'type': 'listing_approved'
            },
            'LISTING_REJECTED': {
                'title': 'Listing Rejected',
                'message': 'Your parking listing "{listing_title}" has been rejected. Reason: {rejection_reason}',
                'type': 'listing_rejected'
            },
            'LISTING_REVISION_REQUESTED': {
                'title': 'Listing Revision Required',
                'message': 'Please revise your listing "{listing_title}". Reason: {revision_reason}',
                'type': 'listing_revision_requested'
            },
        }
        
        template = content_templates.get(template_type)
        if not template or not context:
            return None
            
        try:
            # Render the message template
            message = template['message'].format(**context)
            
            return {
                'title': template['title'],
                'message': message,
                'type': template['type']
            }
        except (KeyError, TypeError) as e:
            logger.error(f"Error formatting notification content: {str(e)}")
            return {
                'title': template['title'],
                'message': template['message'],
                'type': template['type']
            }
    
    @staticmethod
    def _send_websocket_notification(user, notification, content):
        """Send notification via WebSocket"""
        if not channel_layer:
            logger.warning("Channel layer not available for WebSocket notifications")
            return
            
        try:
            notification_data = {
                'id': notification.id,
                'type': content['type'],
                'title': content['title'],
                'message': content['message'],
                'created_at': notification.created_at.isoformat(),
                'is_read': False,
                'action_url': None if content['type'] in ['new_message', 'host_message', 'guest_message'] else notification.variables.get('action_url'),
            }
            
            async_to_sync(channel_layer.group_send)(
                f"notifications_user_{user.id}",
                {
                    'type': 'notification_message',
                    'notification': notification_data
                }
            )
            
            logger.info(f"WebSocket notification sent to user {user.id}")
            
        except Exception as e:
            logger.error(f"Error sending WebSocket notification: {str(e)}")
    
    @staticmethod
    def _send_legacy_notification(user, template_name, variables=None, channel=None):
        """Legacy send notification using template (fallback)"""
        try:
            # Get user preferences
            prefs, _ = NotificationPreference.objects.get_or_create(user=user)
            
            # Get template - this will fail for most cases since templates aren't set up
            template = NotificationTemplate.objects.get(
                name=template_name, 
                channel=channel or NotificationChannel.EMAIL,
                is_active=True
            )
            
            # Check if user wants this type of notification
            if not NotificationService._should_send(prefs, template.category):
                logger.info(f"Skipping notification for {user.email} - disabled in preferences")
                return None
            
            # Check quiet hours
            if prefs.is_quiet_hours() and template.priority not in ['high', 'urgent']:
                logger.info(f"Skipping notification for {user.email} - quiet hours")
                return None
            
            # Render template
            subject = NotificationService._render_template(template.subject_template, variables or {})
            content = NotificationService._render_template(template.content_template, variables or {})
            html_content = NotificationService._render_template(template.html_template, variables or {}) if template.html_template else ''
            
            # Determine recipient
            if channel == NotificationChannel.EMAIL:
                recipient = prefs.email_address or user.email
            elif channel == NotificationChannel.SMS:
                recipient = prefs.phone_number
            else:
                recipient = user.email
            
            # Create notification record
            notification = Notification.objects.create(
                user=user,
                template=template,
                channel=channel or NotificationChannel.EMAIL,
                category=template.category,
                priority=template.priority,
                subject=subject,
                content=content,
                html_content=html_content,
                recipient=recipient,
                variables=variables or {}
            )
            
            # Send based on channel
            if channel == NotificationChannel.EMAIL:
                EmailService.send_email(notification)
            elif channel == NotificationChannel.SMS:
                SMSService.send_sms(notification)
            elif channel == NotificationChannel.PUSH:
                PushService.send_push(notification)
            
            return notification
            
        except NotificationTemplate.DoesNotExist:
            logger.debug(f"Template {template_name} not found for channel {channel} - using fallback")
            return None
        except Exception as e:
            logger.error(f"Error sending legacy notification: {str(e)}")
            return None
    
    @staticmethod
    def _should_send(prefs, category):
        """Check if user wants this category of notification"""
        category_map = {
            NotificationCategory.BOOKING: prefs.booking_notifications,
            NotificationCategory.PAYMENT: prefs.payment_notifications,
            NotificationCategory.REMINDER: prefs.reminder_notifications,
            NotificationCategory.EMERGENCY: prefs.emergency_notifications,
            NotificationCategory.MARKETING: prefs.marketing_notifications,
            NotificationCategory.SYSTEM: prefs.system_notifications,
            NotificationCategory.MESSAGE: prefs.message_notifications,
        }
        return category_map.get(category, True)
    
    @staticmethod
    def _render_template(template_str, variables):
        """Render Django template with variables"""
        if not template_str:
            return ''
        
        template = Template(template_str)
        context = Context(variables)
        return template.render(context)


class EmailService:
    """Email notification service"""
    
    @staticmethod
    def send_email(notification):
        """Send email notification"""
        try:
            # Check if email is enabled
            prefs = notification.user.notification_preferences
            if not prefs.email_enabled:
                notification.mark_failed("Email notifications disabled")
                return
            
            # Send email
            if notification.html_content:
                # HTML email
                from django.core.mail import EmailMultiAlternatives
                
                msg = EmailMultiAlternatives(
                    subject=notification.subject,
                    body=notification.content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[notification.recipient]
                )
                msg.attach_alternative(notification.html_content, "text/html")
                msg.send()
            else:
                # Plain text email
                send_mail(
                    subject=notification.subject,
                    message=notification.content,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[notification.recipient],
                    fail_silently=False
                )
            
            notification.mark_sent()
            logger.info(f"Email sent to {notification.recipient}")
            
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            notification.mark_failed(str(e))
    
    @staticmethod
    def send_booking_confirmation(user, booking):
        """Send booking confirmation email"""
        variables = {
            'user_name': user.first_name,
            'booking_id': booking.booking_id,
            'space_title': booking.parking_space.title,
            'address': booking.parking_space.address,
            'start_time': booking.start_time.strftime('%Y-%m-%d %H:%M'),
            'end_time': booking.end_time.strftime('%Y-%m-%d %H:%M'),
            'total_amount': str(booking.total_amount),
            'host_name': booking.parking_space.host.get_full_name(),
        }
        
        return NotificationService.send_notification(
            user=user,
            template_name='booking_confirmation',
            variables=variables,
            channel=NotificationChannel.EMAIL
        )
    
    @staticmethod
    def send_payment_receipt(user, payment):
        """Send payment receipt email"""
        variables = {
            'user_name': user.first_name,
            'payment_id': payment.payment_id,
            'amount': str(payment.amount),
            'booking_id': payment.booking.booking_id,
            'date': payment.created_at.strftime('%Y-%m-%d'),
            'payment_method': payment.payment_method_type,
        }
        
        return NotificationService.send_notification(
            user=user,
            template_name='payment_receipt',
            variables=variables,
            channel=NotificationChannel.EMAIL
        )


class SMSService:
    """SMS notification service"""
    
    def __init__(self):
        self.client = None
        if hasattr(settings, 'TWILIO_ACCOUNT_SID') and hasattr(settings, 'TWILIO_AUTH_TOKEN'):
            self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    
    @staticmethod
    def send_sms(notification):
        """Send SMS notification"""
        try:
            service = SMSService()
            if not service.client:
                notification.mark_failed("Twilio not configured")
                return
            
            # Check if SMS is enabled
            prefs = notification.user.notification_preferences
            if not prefs.sms_enabled or not prefs.phone_verified:
                notification.mark_failed("SMS notifications disabled or phone not verified")
                return
            
            # Send SMS
            message = service.client.messages.create(
                body=notification.content,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=notification.recipient
            )
            
            notification.mark_sent(external_id=message.sid)
            logger.info(f"SMS sent to {notification.recipient}")
            
        except Exception as e:
            logger.error(f"Error sending SMS: {str(e)}")
            notification.mark_failed(str(e))
    
    @staticmethod
    def send_booking_reminder(user, booking, minutes_until=30):
        """Send booking reminder SMS"""
        variables = {
            'user_name': user.first_name,
            'space_title': booking.parking_space.title,
            'address': booking.parking_space.address,
            'start_time': booking.start_time.strftime('%H:%M'),
            'minutes_until': minutes_until,
        }
        
        return NotificationService.send_notification(
            user=user,
            template_name='booking_reminder',
            variables=variables,
            channel=NotificationChannel.SMS
        )
    
    @staticmethod
    def send_emergency_alert(contacts, user, location, message):
        """Send emergency alert to emergency contacts"""
        notifications = []
        
        for contact in contacts:
            variables = {
                'user_name': user.get_full_name(),
                'contact_name': contact.name,
                'location': location,
                'message': message,
                'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
            }
            
            # Create direct notification (bypass user preferences for emergency)
            notification = Notification.objects.create(
                user=user,
                channel=NotificationChannel.SMS,
                category=NotificationCategory.EMERGENCY,
                priority='urgent',
                subject='EMERGENCY ALERT',
                content=f"EMERGENCY: {user.get_full_name()} needs help at {location}. Message: {message}",
                recipient=contact.phone_number
            )
            
            SMSService.send_sms(notification)
            notifications.append(notification)
        
        return notifications


class PushService:
    """Push notification service"""
    
    @staticmethod
    def send_push(notification):
        """Send push notification"""
        try:
            from pywebpush import webpush, WebPushException
            
            # Get user's push subscriptions
            subscriptions = PushSubscription.objects.filter(
                user=notification.user,
                is_active=True
            )
            
            if not subscriptions.exists():
                notification.mark_failed("No active push subscriptions")
                return
            
            # Prepare push data
            push_data = {
                'title': notification.subject,
                'body': notification.content,
                'icon': '/static/images/icon-192x192.png',
                'badge': '/static/images/badge-72x72.png',
                'data': {
                    'notification_id': notification.id,
                    'category': notification.category,
                    'url': notification.metadata.get('url', '/')
                }
            }
            
            # Send to all subscriptions
            sent_count = 0
            for subscription in subscriptions:
                try:
                    webpush(
                        subscription_info=subscription.subscription_info,
                        data=push_data,
                        vapid_private_key=settings.VAPID_PRIVATE_KEY,
                        vapid_claims={
                            "sub": f"mailto:{settings.VAPID_EMAIL}"
                        }
                    )
                    sent_count += 1
                    subscription.last_used_at = timezone.now()
                    subscription.save()
                    
                except WebPushException as e:
                    logger.error(f"Push notification failed for subscription {subscription.id}: {str(e)}")
                    if e.response and e.response.status_code in [400, 404, 410]:
                        # Invalid subscription, mark as inactive
                        subscription.is_active = False
                        subscription.save()
            
            if sent_count > 0:
                notification.mark_sent()
                logger.info(f"Push notification sent to {sent_count} devices")
            else:
                notification.mark_failed("No valid push subscriptions")
                
        except Exception as e:
            logger.error(f"Error sending push notification: {str(e)}")
            notification.mark_failed(str(e))


class NotificationTemplateService:
    """Service for managing notification templates"""
    
    @staticmethod
    def create_default_templates():
        """Create default notification templates"""
        templates = [
            # Email templates
            {
                'name': 'booking_confirmation',
                'category': NotificationCategory.BOOKING,
                'channel': NotificationChannel.EMAIL,
                'subject_template': 'Booking Confirmed - {{space_title}}',
                'content_template': '''Hi {{user_name}},

Your parking reservation has been confirmed!

Booking Details:
- Space: {{space_title}}
- Address: {{address}}
- Date & Time: {{start_time}} - {{end_time}}
- Host: {{host_name}}
- Total: ${{total_amount}}
- Booking ID: {{booking_id}}

Please arrive on time and follow any special instructions from your host.

Best regards,
Parking in a Pinch Team''',
                'html_template': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Booking Confirmed!</h2>
    <p>Hi {{user_name}},</p>
    <p>Your parking reservation has been confirmed!</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>{{space_title}}</h3>
        <p><strong>Address:</strong> {{address}}</p>
        <p><strong>Date & Time:</strong> {{start_time}} - {{end_time}}</p>
        <p><strong>Host:</strong> {{host_name}}</p>
        <p><strong>Total Amount:</strong> ${{total_amount}}</p>
        <p><strong>Booking ID:</strong> {{booking_id}}</p>
    </div>
    
    <p>Please arrive on time and follow any special instructions from your host.</p>
    <p>Best regards,<br>Parking in a Pinch Team</p>
</div>''',
                'variables': ['user_name', 'space_title', 'address', 'start_time', 'end_time', 'host_name', 'total_amount', 'booking_id'],
                'priority': 'high'
            },
            
            # SMS templates
            {
                'name': 'booking_reminder',
                'category': NotificationCategory.REMINDER,
                'channel': NotificationChannel.SMS,
                'subject_template': 'Parking Reminder',
                'content_template': 'Hi {{user_name}}! Your parking at {{space_title}} starts in {{minutes_until}} minutes ({{start_time}}). Address: {{address}}. Safe travels!',
                'variables': ['user_name', 'space_title', 'minutes_until', 'start_time', 'address'],
                'priority': 'medium'
            },
            
            # Push notification templates
            {
                'name': 'payment_completed',
                'category': NotificationCategory.PAYMENT,
                'channel': NotificationChannel.PUSH,
                'subject_template': 'Payment Confirmed',
                'content_template': 'Your payment of ${{amount}} for booking {{booking_id}} has been processed successfully.',
                'variables': ['amount', 'booking_id'],
                'priority': 'medium'
            },
            
            # Listing approval templates
            {
                'name': 'listing_approved',
                'category': NotificationCategory.SYSTEM,
                'channel': NotificationChannel.EMAIL,
                'subject_template': 'Your listing "{{listing_title}}" has been approved!',
                'content_template': '''Hi {{host_name}},

Great news! Your parking space listing has been approved and is now live on our platform.

Listing Details:
- Title: {{listing_title}}
- Address: {{listing_address}}

Your listing is now visible to renters and ready to receive bookings. Make sure to:
- Keep your availability calendar updated
- Respond promptly to booking requests
- Provide clear instructions for your guests

Start earning money from your parking space today!

Best regards,
Parking in a Pinch Team''',
                'html_template': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #28a745;">🎉 Your Listing is Approved!</h2>
    <p>Hi {{host_name}},</p>
    <p>Great news! Your parking space listing has been approved and is now live on our platform.</p>
    
    <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
        <h3 style="margin-top: 0;">{{listing_title}}</h3>
        <p><strong>Address:</strong> {{listing_address}}</p>
        <p style="color: #28a745; font-weight: bold;">✅ Status: APPROVED & LIVE</p>
    </div>
    
    <p>Your listing is now visible to renters and ready to receive bookings. Make sure to:</p>
    <ul>
        <li>Keep your availability calendar updated</li>
        <li>Respond promptly to booking requests</li>
        <li>Provide clear instructions for your guests</li>
    </ul>
    
    <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; font-weight: bold;">
        🚗 Start earning money from your parking space today!
    </p>
    
    <p>Best regards,<br>Parking in a Pinch Team</p>
</div>''',
                'variables': ['host_name', 'listing_title', 'listing_address'],
                'priority': 'high'
            },
            
            {
                'name': 'listing_rejected',
                'category': NotificationCategory.SYSTEM,
                'channel': NotificationChannel.EMAIL,
                'subject_template': 'Action Required: Your listing "{{listing_title}}" needs updates',
                'content_template': '''Hi {{host_name}},

We've reviewed your parking space listing and unfortunately, it doesn't meet our current requirements.

Listing Details:
- Title: {{listing_title}}
- Address: {{listing_address}}

Reason for rejection:
{{rejection_reason}}

Don't worry - you can easily fix this! Simply update your listing with the necessary changes and resubmit for review. Our team will review it again within 24 hours.

If you have any questions, please don't hesitate to contact our support team.

Best regards,
Parking in a Pinch Team''',
                'html_template': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #dc3545;">📋 Action Required: Listing Updates Needed</h2>
    <p>Hi {{host_name}},</p>
    <p>We've reviewed your parking space listing and unfortunately, it doesn't meet our current requirements.</p>
    
    <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
        <h3 style="margin-top: 0;">{{listing_title}}</h3>
        <p><strong>Address:</strong> {{listing_address}}</p>
        <p style="color: #dc3545; font-weight: bold;">❌ Status: REQUIRES UPDATES</p>
    </div>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
        <strong>Reason for rejection:</strong>
        <p style="margin: 10px 0 0 0;">{{rejection_reason}}</p>
    </div>
    
    <p>Don't worry - you can easily fix this! Simply update your listing with the necessary changes and resubmit for review. Our team will review it again within 24 hours.</p>
    
    <p>If you have any questions, please don't hesitate to contact our support team.</p>
    
    <p>Best regards,<br>Parking in a Pinch Team</p>
</div>''',
                'variables': ['host_name', 'listing_title', 'listing_address', 'rejection_reason'],
                'priority': 'high'
            },
            
            {
                'name': 'listing_revision_requested',
                'category': NotificationCategory.SYSTEM,
                'channel': NotificationChannel.EMAIL,
                'subject_template': 'Minor updates needed for "{{listing_title}}"',
                'content_template': '''Hi {{host_name}},

We've reviewed your parking space listing and it looks great! We just need a few minor updates before we can approve it.

Listing Details:
- Title: {{listing_title}}
- Address: {{listing_address}}

Requested changes:
{{revision_reason}}

Please make these small updates and your listing will be approved quickly. Our team will review the revised version within 24 hours.

Thank you for your cooperation!

Best regards,
Parking in a Pinch Team''',
                'html_template': '''<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #fd7e14;">📝 Minor Updates Needed</h2>
    <p>Hi {{host_name}},</p>
    <p>We've reviewed your parking space listing and it looks great! We just need a few minor updates before we can approve it.</p>
    
    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h3 style="margin-top: 0;">{{listing_title}}</h3>
        <p><strong>Address:</strong> {{listing_address}}</p>
        <p style="color: #fd7e14; font-weight: bold;">📝 Status: MINOR REVISIONS NEEDED</p>
    </div>
    
    <div style="background: #e2f3ff; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
        <strong>Requested changes:</strong>
        <p style="margin: 10px 0 0 0;">{{revision_reason}}</p>
    </div>
    
    <p>Please make these small updates and your listing will be approved quickly. Our team will review the revised version within 24 hours.</p>
    
    <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">
        🚀 You're almost there! Just a few quick fixes and you'll be earning money from your parking space.
    </p>
    
    <p>Thank you for your cooperation!</p>
    
    <p>Best regards,<br>Parking in a Pinch Team</p>
</div>''',
                'variables': ['host_name', 'listing_title', 'listing_address', 'revision_reason'],
                'priority': 'medium'
            },
            
            # Push notification templates for listing approvals (for notification bell)
            {
                'name': 'listing_approved',
                'category': NotificationCategory.SYSTEM,
                'channel': NotificationChannel.PUSH,
                'subject_template': 'Listing Approved! 🎉',
                'content_template': 'Great news! Your listing "{{listing_title}}" has been approved and is now live on our platform.',
                'variables': ['listing_title'],
                'priority': 'high'
            },
            
            {
                'name': 'listing_rejected',
                'category': NotificationCategory.SYSTEM,
                'channel': NotificationChannel.PUSH,
                'subject_template': 'Listing Needs Updates 📋',
                'content_template': 'Your listing "{{listing_title}}" needs some updates before approval. Check your email for details.',
                'variables': ['listing_title'],
                'priority': 'high'
            },
            
            {
                'name': 'listing_revision_requested',
                'category': NotificationCategory.SYSTEM,
                'channel': NotificationChannel.PUSH,
                'subject_template': 'Minor Updates Needed 📝',
                'content_template': 'Your listing "{{listing_title}}" needs minor updates. Check your email for details.',
                'variables': ['listing_title'],
                'priority': 'medium'
            }
        ]
        
        for template_data in templates:
            template, created = NotificationTemplate.objects.get_or_create(
                name=template_data['name'],
                channel=template_data['channel'],
                defaults=template_data
            )
            if created:
                logger.info(f"Created template: {template.name} ({template.channel})")
        
        return len(templates)