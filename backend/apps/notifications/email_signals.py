"""
Django signals for automated email notifications
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.conf import settings
from django.contrib.auth import get_user_model
from .email_service import ParkingEmailService

User = get_user_model()


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    """Send welcome email to new users"""
    if created and hasattr(instance, 'email') and instance.email:
        # Only send if email backend is configured for production
        if settings.EMAIL_BACKEND != 'django.core.mail.backends.console.EmailBackend':
            try:
                ParkingEmailService.send_welcome_email(instance)
            except Exception as e:
                # Don't let email failures break user creation
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to send welcome email to {instance.email}: {str(e)}")


# Import these dynamically to avoid circular imports
def setup_listing_signals():
    """Setup signals for listing-related emails"""
    try:
        from apps.listings.models import ParkingListing
        
        @receiver(pre_save, sender=ParkingListing)
        def track_listing_approval(sender, instance, **kwargs):
            """Track when listing approval status changes"""
            if instance.pk:
                try:
                    old_instance = ParkingListing.objects.get(pk=instance.pk)
                    # Check if approval status changed to APPROVED
                    if (old_instance.approval_status != ParkingListing.ApprovalStatus.APPROVED and 
                        instance.approval_status == ParkingListing.ApprovalStatus.APPROVED):
                        
                        # Send approval email (after save completes)
                        from django.db import transaction
                        def send_approval_email():
                            if settings.EMAIL_BACKEND != 'django.core.mail.backends.console.EmailBackend':
                                ParkingEmailService.send_listing_approved_email(instance.host, instance)
                        
                        transaction.on_commit(send_approval_email)
                        
                except ParkingListing.DoesNotExist:
                    pass  # New listing, will be handled elsewhere
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error in listing approval signal: {str(e)}")
                    
    except ImportError:
        pass  # Listings app not available


def setup_booking_signals():
    """Setup signals for booking-related emails"""
    try:
        from apps.bookings.models import Booking
        
        @receiver(post_save, sender=Booking)
        def send_booking_emails(sender, instance, created, **kwargs):
            """Send emails when bookings are created or updated"""
            if created and settings.EMAIL_BACKEND != 'django.core.mail.backends.console.EmailBackend':
                try:
                    # Send confirmation email to guest
                    ParkingEmailService.send_booking_confirmed_email(instance.user, instance)
                    
                    # Send new booking notification to host
                    ParkingEmailService.send_new_booking_email(instance.listing.host, instance)
                    
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error sending booking emails: {str(e)}")
                    
    except ImportError:
        pass  # Bookings app not available


def setup_message_signals():
    """Setup signals for message-related emails"""
    try:
        from apps.messaging.models import Message
        
        @receiver(post_save, sender=Message)
        def send_message_notification_email(sender, instance, created, **kwargs):
            """Send email notification when new messages are received"""
            if created and settings.EMAIL_BACKEND != 'django.core.mail.backends.console.EmailBackend':
                try:
                    # Send to recipient, not sender
                    if hasattr(instance, 'conversation') and hasattr(instance.conversation, 'participants'):
                        recipients = instance.conversation.participants.exclude(id=instance.sender.id)
                        for recipient in recipients:
                            # Try to get related booking for context
                            booking = None
                            if hasattr(instance.conversation, 'booking'):
                                booking = instance.conversation.booking
                                
                            ParkingEmailService.send_new_message_email(
                                recipient=recipient,
                                sender=instance.sender,
                                message=instance,
                                booking=booking
                            )
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error sending message notification email: {str(e)}")
                    
    except ImportError:
        pass  # Messaging app not available


def setup_payment_signals():
    """Setup signals for payment-related emails"""
    try:
        from apps.payments.models import Payment
        
        @receiver(post_save, sender=Payment)
        def send_payment_emails(sender, instance, created, **kwargs):
            """Send payment notification emails"""
            if (instance.status == 'completed' and 
                settings.EMAIL_BACKEND != 'django.core.mail.backends.console.EmailBackend'):
                try:
                    # Get booking and host information
                    if hasattr(instance, 'booking') and instance.booking:
                        booking = instance.booking
                        host = booking.listing.host
                        
                        # Calculate service fee (assuming 10% platform fee)
                        service_fee = float(instance.amount) * 0.10
                        host_amount = float(instance.amount) - service_fee
                        
                        ParkingEmailService.send_payment_received_email(
                            host=host,
                            booking=booking,
                            payment_amount=host_amount,
                            service_fee=service_fee
                        )
                        
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error sending payment notification email: {str(e)}")
                    
    except ImportError:
        pass  # Payments app not available


# Initialize all signal handlers
def setup_all_email_signals():
    """Initialize all email signal handlers"""
    setup_listing_signals()
    setup_booking_signals()
    setup_message_signals()
    setup_payment_signals()