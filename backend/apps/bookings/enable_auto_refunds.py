"""
Enable automatic refund processing for booking cancellations
Run this as a Django migration or management command
"""
from django.db import models
from apps.bookings.models import Booking
from apps.payments.services import PaymentService, RefundService
from apps.payments.models import RefundRequest
import logging

logger = logging.getLogger(__name__)

def make_refunds_automatic():
    """
    Modify the booking cancellation to process refunds automatically
    instead of creating RefundRequests that need approval
    """
    
    # This would be added to the booking cancel method:
    def auto_process_refund(booking):
        """Process refund automatically when booking is cancelled"""
        try:
            # Calculate refund amount based on policy
            refund_amount = RefundService.calculate_refund_amount(booking)
            
            if refund_amount > 0:
                # Get the payment
                payment = booking.payment_set.filter(status='completed').first()
                
                if payment and payment.stripe_payment_intent_id:
                    # Process refund immediately through Stripe
                    result = PaymentService.process_refund(
                        booking_id=booking.id,
                        refund_reason='cancelled_by_user',
                        refund_amount=refund_amount
                    )
                    
                    if result['success']:
                        logger.info(f"Auto-refund processed: ${refund_amount} for booking {booking.id}")
                        
                        # Still create RefundRequest for record keeping
                        RefundRequest.objects.create(
                            booking=booking,
                            payment=payment,
                            requested_amount=refund_amount,
                            approved_amount=refund_amount,
                            reason='cancelled_by_user',
                            requested_by=booking.user,
                            status='processed',  # Mark as already processed
                            stripe_refund_id=result['refund_id'],
                            admin_notes='Automatically processed based on cancellation policy'
                        )
                        
                        return True
                    else:
                        logger.error(f"Auto-refund failed for booking {booking.id}: {result.get('error')}")
                        return False
                        
        except Exception as e:
            logger.error(f"Error in auto-refund for booking {booking.id}: {str(e)}")
            return False
    
    return auto_process_refund


# To add cancellation_policy field to listings:
"""
# Run this migration:

from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('listings', 'latest_migration'),
    ]

    operations = [
        migrations.AddField(
            model_name='parkinglisting',
            name='cancellation_policy',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('flexible', 'Flexible - Full refund 24h before'),
                    ('moderate', 'Moderate - Full refund 2h before'),
                    ('strict', 'Strict - Full refund 7 days before'),
                ],
                default='moderate',
                help_text='Cancellation policy for this listing'
            ),
        ),
    ]
"""