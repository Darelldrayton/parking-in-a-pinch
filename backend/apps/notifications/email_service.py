"""
Enhanced Email Service for Parking in a Pinch
"""
import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from django.utils import timezone
from .models import NotificationTemplate, NotificationChannel, Notification
from .services import NotificationService

logger = logging.getLogger(__name__)


class ParkingEmailService:
    """Enhanced email service for automated notifications"""
    
    @staticmethod
    def send_listing_approved_email(user, listing):
        """Send email when a listing is approved"""
        try:
            context = {
                'user': user,
                'listing_title': listing.title,
                'listing_address': listing.address,
                'listing_id': listing.id,
                'hourly_rate': listing.hourly_rate,
                'frontend_url': settings.FRONTEND_URL,
            }
            
            return ParkingEmailService._send_template_email(
                template_name='listing_approved',
                subject='🎉 Your Parking Listing Has Been Approved!',
                user=user,
                context=context
            )
            
        except Exception as e:
            logger.error(f"Error sending listing approved email to {user.email}: {str(e)}")
            return False

    @staticmethod
    def send_new_booking_email(host, booking):
        """Send email to host when they receive a new booking"""
        try:
            context = {
                'user': host,
                'guest_name': f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.username,
                'listing_title': booking.listing.title,
                'booking_id': booking.id,
                'booking_date': booking.start_datetime.strftime('%B %d, %Y'),
                'start_time': booking.start_datetime.strftime('%I:%M %p'),
                'end_time': booking.end_datetime.strftime('%I:%M %p'),
                'duration': int((booking.end_datetime - booking.start_datetime).total_seconds() / 3600),
                'total_amount': booking.total_amount,
                'frontend_url': settings.FRONTEND_URL,
            }
            
            return ParkingEmailService._send_template_email(
                template_name='new_booking',
                subject=f'🚗 New Booking: {booking.listing.title}',
                user=host,
                context=context
            )
            
        except Exception as e:
            logger.error(f"Error sending new booking email to {host.email}: {str(e)}")
            return False

    @staticmethod
    def send_booking_confirmed_email(user, booking):
        """Send booking confirmation email to guest"""
        try:
            context = {
                'user': user,
                'booking_id': booking.id,
                'listing_title': booking.listing.title,
                'listing_address': booking.listing.address,
                'booking_date': booking.start_datetime.strftime('%B %d, %Y'),
                'start_time': booking.start_datetime.strftime('%I:%M %p'),
                'end_time': booking.end_datetime.strftime('%I:%M %p'),
                'duration': int((booking.end_datetime - booking.start_datetime).total_seconds() / 3600),
                'total_amount': booking.total_amount,
                'special_instructions': booking.listing.instructions,
                'frontend_url': settings.FRONTEND_URL,
            }
            
            return ParkingEmailService._send_template_email(
                template_name='booking_confirmed',
                subject=f'✅ Booking Confirmed: {booking.listing.title}',
                user=user,
                context=context
            )
            
        except Exception as e:
            logger.error(f"Error sending booking confirmation email to {user.email}: {str(e)}")
            return False

    @staticmethod 
    def send_new_message_email(recipient, sender, message, booking=None):
        """Send email notification for new messages"""
        try:
            context = {
                'user': recipient,
                'sender_name': f"{sender.first_name} {sender.last_name}".strip() or sender.username,
                'message_content': message.content[:200] + ('...' if len(message.content) > 200 else ''),
                'conversation_id': message.conversation.id if hasattr(message, 'conversation') else None,
                'frontend_url': settings.FRONTEND_URL,
            }
            
            if booking:
                context.update({
                    'listing_title': booking.listing.title,
                    'booking_date': booking.start_datetime.strftime('%B %d, %Y'),
                    'booking_id': booking.id,
                })
            
            return ParkingEmailService._send_template_email(
                template_name='new_message',
                subject=f'💬 New Message from {context["sender_name"]}',
                user=recipient,
                context=context
            )
            
        except Exception as e:
            logger.error(f"Error sending new message email to {recipient.email}: {str(e)}")
            return False

    @staticmethod
    def send_payment_received_email(host, booking, payment_amount, service_fee):
        """Send email when host receives payment"""
        try:
            context = {
                'user': host,
                'listing_title': booking.listing.title,
                'guest_name': f"{booking.user.first_name} {booking.user.last_name}".strip() or booking.user.username,
                'booking_date': booking.start_datetime.strftime('%B %d, %Y'),
                'duration': int((booking.end_datetime - booking.start_datetime).total_seconds() / 3600),
                'gross_amount': booking.total_amount,
                'service_fee': service_fee,
                'net_amount': payment_amount,
                'fee_percentage': round((service_fee / booking.total_amount) * 100, 1),
                'payment_date': booking.start_datetime.strftime('%B %d, %Y'),
                'transaction_id': f"PAY_{booking.id}_{booking.start_datetime.strftime('%Y%m%d')}",
                'frontend_url': settings.FRONTEND_URL,
            }
            
            return ParkingEmailService._send_template_email(
                template_name='payment_received',
                subject=f'💰 Payment Received: ${payment_amount}',
                user=host,
                context=context
            )
            
        except Exception as e:
            logger.error(f"Error sending payment received email to {host.email}: {str(e)}")
            return False

    @staticmethod
    def _send_template_email(template_name, subject, user, context):
        """Send email using HTML template"""
        try:
            # Add user to context if not already there
            if 'user' not in context:
                context['user'] = user
                
            # Add frontend URL if not already there
            if 'frontend_url' not in context:
                context['frontend_url'] = settings.FRONTEND_URL

            # Render HTML email
            html_content = render_to_string(f'emails/{template_name}.html', context)
            
            # Create plain text version by stripping HTML
            text_content = strip_tags(html_content)
            
            # Add email subject prefix
            full_subject = f"{settings.EMAIL_SUBJECT_PREFIX}{subject}"
            
            # Create email message
            email = EmailMultiAlternatives(
                subject=full_subject,
                body=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            
            # Attach HTML version
            email.attach_alternative(html_content, "text/html")
            
            # Send email
            email.send()
            
            # Log successful send
            logger.info(f"Successfully sent {template_name} email to {user.email}")
            
            # Create notification record for tracking
            try:
                Notification.objects.create(
                    user=user,
                    title=subject,
                    message=text_content[:200] + ('...' if len(text_content) > 200 else ''),
                    category='EMAIL',
                    channel=NotificationChannel.EMAIL,
                    is_sent=True,
                    sent_at=timezone.now()
                )
            except Exception as notification_error:
                logger.warning(f"Could not create notification record: {str(notification_error)}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error sending {template_name} email to {user.email}: {str(e)}")
            return False

    @staticmethod
    def send_welcome_email(user):
        """Send welcome email to new users"""
        try:
            context = {
                'user': user,
                'frontend_url': settings.FRONTEND_URL,
            }
            
            # Use base template for welcome email
            html_content = f"""
            <h2>Welcome to Parking in a Pinch, {user.first_name}!</h2>
            <p>Thank you for joining our community. You can now:</p>
            <ul>
                <li>🔍 Find parking spaces in your area</li>
                <li>🏠 List your own parking space to earn money</li>
                <li>📱 Manage everything from your dashboard</li>
                <li>⭐ Build your reputation through reviews</li>
            </ul>
            <p><a href="{settings.FRONTEND_URL}/dashboard" style="background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Get Started</a></p>
            """
            
            subject = "Welcome to Parking in a Pinch! 🅿️"
            
            # Create full HTML email with base template
            full_html = render_to_string('emails/base_email.html', {
                'user': user,
                'frontend_url': settings.FRONTEND_URL,
                'content': html_content,
                'title': 'Welcome to Parking in a Pinch'
            })
            
            # Send email
            email = EmailMultiAlternatives(
                subject=f"{settings.EMAIL_SUBJECT_PREFIX}{subject}",
                body=strip_tags(full_html),
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email]
            )
            email.attach_alternative(full_html, "text/html")
            email.send()
            
            logger.info(f"Successfully sent welcome email to {user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending welcome email to {user.email}: {str(e)}")
            return False