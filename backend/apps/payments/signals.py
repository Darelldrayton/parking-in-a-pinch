"""
Signals for payments app.
"""
import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from apps.bookings.models import Booking
from .models import PaymentIntent, Payment, Refund

logger = logging.getLogger(__name__)


@receiver(post_save, sender=PaymentIntent)
def payment_intent_status_changed(sender, instance, created, **kwargs):
    """
    Handle payment intent status changes.
    """
    if not created and instance.status == 'succeeded':
        # Update booking status when payment is successful
        try:
            booking = instance.booking
            if booking.status != 'confirmed':
                booking.status = 'confirmed'
                booking.confirmed_at = timezone.now()
                booking.save()
                logger.info(f"Booking {booking.booking_id} confirmed after successful payment")
        except Exception as e:
            logger.error(f"Error updating booking status: {e}")


@receiver(post_save, sender=Payment)
def payment_status_changed(sender, instance, created, **kwargs):
    """
    Handle payment status changes.
    """
    if created and instance.status == 'succeeded':
        # Payment processing completed
        try:
            logger.info(f"Payment {instance.payment_id} succeeded for booking {instance.booking.booking_id}")
            
            # Update user's payment history
            user = instance.user
            # You could update user stats or loyalty points here
            
        except Exception as e:
            logger.error(f"Error handling successful payment: {e}")
    
    elif created and instance.status == 'failed':
        # Handle failed payment
        try:
            logger.warning(f"Payment {instance.payment_id} failed for booking {instance.booking.booking_id}")
            
            # Update booking status back to pending
            booking = instance.booking
            booking.status = 'pending'
            booking.save()
            
            # Send failure notification to user
            # You would implement notification logic here
            
        except Exception as e:
            logger.error(f"Error handling failed payment: {e}")


@receiver(post_save, sender=Refund)
def refund_status_changed(sender, instance, created, **kwargs):
    """
    Handle refund status changes.
    """
    if not created and instance.status == 'succeeded':
        # Handle successful refund
        try:
            logger.info(f"Refund {instance.refund_id} succeeded for payment {instance.payment.payment_id}")
            
            # Update booking status if applicable
            booking = instance.payment.booking
            if instance.reason in ['booking_canceled', 'host_canceled', 'no_show']:
                booking.status = 'cancelled'
                booking.save()
            
            # Send refund confirmation notification
            # You would implement notification logic here
            
        except Exception as e:
            logger.error(f"Error handling successful refund: {e}")


@receiver(pre_save, sender=Booking)
def booking_status_changed(sender, instance, **kwargs):
    """
    Handle booking status changes that might affect payments.
    """
    if instance.pk:
        try:
            # Get the old booking status
            old_booking = Booking.objects.get(pk=instance.pk)
            
            # If booking is being cancelled and payment exists, consider refund
            if (old_booking.status in ['confirmed', 'active'] and 
                instance.status == 'cancelled' and 
                hasattr(instance, 'payment')):
                
                payment = instance.payment
                if payment.status == 'succeeded' and payment.can_be_refunded:
                    logger.info(f"Booking {instance.booking_id} cancelled - payment {payment.payment_id} may need refund")
                    # You could automatically create a refund request here
                    # or flag it for admin review
            
        except Booking.DoesNotExist:
            # New booking, nothing to do
            pass
        except Exception as e:
            logger.error(f"Error handling booking status change: {e}")


# You can add more signal handlers for:
# - Host payout calculations
# - Platform fee tracking
# - Fraud detection
# - Tax calculations
# - Analytics and reporting