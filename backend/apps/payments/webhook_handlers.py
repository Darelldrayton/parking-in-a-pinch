"""
Stripe Webhook Handlers for Payment Processing
"""
import json
import logging
import stripe
from django.conf import settings
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from django.views import View
from .models import Payment, Payout, Refund
from ..bookings.models import Booking
from ..users.models import User
from .services import PayoutService, NotificationService

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(View):
    """
    Handle Stripe webhook events
    """
    
    def post(self, request):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        endpoint_secret = settings.STRIPE_WEBHOOK_SECRET
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError:
            logger.error("Invalid payload in Stripe webhook")
            return HttpResponseBadRequest("Invalid payload")
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid signature in Stripe webhook")
            return HttpResponseBadRequest("Invalid signature")
        
        # Handle the event
        try:
            if event['type'] == 'payment_intent.succeeded':
                self.handle_payment_succeeded(event['data']['object'])
            
            elif event['type'] == 'payment_intent.payment_failed':
                self.handle_payment_failed(event['data']['object'])
            
            elif event['type'] == 'customer.subscription.created':
                self.handle_subscription_created(event['data']['object'])
            
            elif event['type'] == 'customer.subscription.updated':
                self.handle_subscription_updated(event['data']['object'])
            
            elif event['type'] == 'invoice.payment_succeeded':
                self.handle_recurring_payment_succeeded(event['data']['object'])
            
            elif event['type'] == 'transfer.created':
                self.handle_transfer_created(event['data']['object'])
            
            elif event['type'] == 'payout.paid':
                self.handle_payout_paid(event['data']['object'])
            
            elif event['type'] == 'charge.dispute.created':
                self.handle_dispute_created(event['data']['object'])
            
            else:
                logger.info(f"Unhandled event type: {event['type']}")
                
        except Exception as e:
            logger.error(f"Error handling Stripe webhook: {str(e)}")
            return HttpResponseBadRequest(f"Webhook handling failed: {str(e)}")
        
        return HttpResponse(json.dumps({'received': True}), content_type='application/json')
    
    def handle_payment_succeeded(self, payment_intent):
        """Handle successful payment"""
        try:
            booking_id = payment_intent.get('metadata', {}).get('booking_id')
            if not booking_id:
                logger.error("No booking_id found in payment_intent metadata")
                return
            
            booking = Booking.objects.get(id=booking_id)
            
            # Update payment record
            payment, created = Payment.objects.get_or_create(
                stripe_payment_intent_id=payment_intent['id'],
                defaults={
                    'booking': booking,
                    'amount': payment_intent['amount_received'] / 100,  # Convert from cents
                    'currency': payment_intent['currency'],
                    'status': 'completed',
                    'stripe_payment_method_id': payment_intent.get('payment_method')
                }
            )
            
            if not created:
                payment.status = 'completed'
                payment.amount = payment_intent['amount_received'] / 100
                payment.save()
            
            # Update booking status
            booking.status = 'confirmed'
            booking.paid_at = payment.created_at
            booking.save()
            
            # Trigger host payout
            PayoutService.initiate_host_payout(booking)
            
            # Send notifications
            NotificationService.notify_booking_confirmed(booking)
            NotificationService.notify_host_new_booking(booking)
            
            logger.info(f"Payment succeeded for booking {booking_id}")
            
        except Booking.DoesNotExist:
            logger.error(f"Booking not found for payment_intent {payment_intent['id']}")
        except Exception as e:
            logger.error(f"Error handling payment success: {str(e)}")
    
    def handle_payment_failed(self, payment_intent):
        """Handle failed payment"""
        try:
            booking_id = payment_intent.get('metadata', {}).get('booking_id')
            if not booking_id:
                return
            
            booking = Booking.objects.get(id=booking_id)
            
            # Update payment record
            payment, created = Payment.objects.get_or_create(
                stripe_payment_intent_id=payment_intent['id'],
                defaults={
                    'booking': booking,
                    'amount': payment_intent['amount'] / 100,
                    'currency': payment_intent['currency'],
                    'status': 'failed',
                    'failure_reason': payment_intent.get('last_payment_error', {}).get('message', 'Unknown error')
                }
            )
            
            if not created:
                payment.status = 'failed'
                payment.failure_reason = payment_intent.get('last_payment_error', {}).get('message', 'Unknown error')
                payment.save()
            
            # Update booking status
            booking.status = 'payment_failed'
            booking.save()
            
            # Send failure notification
            NotificationService.notify_payment_failed(booking, payment.failure_reason)
            
            logger.info(f"Payment failed for booking {booking_id}")
            
        except Booking.DoesNotExist:
            logger.error(f"Booking not found for failed payment_intent {payment_intent['id']}")
        except Exception as e:
            logger.error(f"Error handling payment failure: {str(e)}")
    
    def handle_subscription_created(self, subscription):
        """Handle new recurring booking subscription"""
        try:
            booking_id = subscription.get('metadata', {}).get('booking_id')
            if not booking_id:
                return
            
            booking = Booking.objects.get(id=booking_id)
            booking.is_recurring = True
            booking.stripe_subscription_id = subscription['id']
            booking.recurring_frequency = subscription.get('metadata', {}).get('frequency', 'weekly')
            booking.save()
            
            # Send subscription confirmation
            NotificationService.notify_subscription_created(booking)
            
            logger.info(f"Subscription created for booking {booking_id}")
            
        except Booking.DoesNotExist:
            logger.error(f"Booking not found for subscription {subscription['id']}")
        except Exception as e:
            logger.error(f"Error handling subscription creation: {str(e)}")
    
    def handle_subscription_updated(self, subscription):
        """Handle subscription updates"""
        try:
            booking = Booking.objects.get(stripe_subscription_id=subscription['id'])
            
            if subscription['status'] == 'canceled':
                booking.recurring_status = 'canceled'
                booking.save()
                NotificationService.notify_subscription_canceled(booking)
            
            elif subscription['status'] == 'past_due':
                booking.recurring_status = 'past_due'
                booking.save()
                NotificationService.notify_subscription_past_due(booking)
            
            logger.info(f"Subscription updated: {subscription['id']}")
            
        except Booking.DoesNotExist:
            logger.error(f"Booking not found for subscription {subscription['id']}")
        except Exception as e:
            logger.error(f"Error handling subscription update: {str(e)}")
    
    def handle_recurring_payment_succeeded(self, invoice):
        """Handle successful recurring payment"""
        try:
            subscription_id = invoice['subscription']
            booking = Booking.objects.get(stripe_subscription_id=subscription_id)
            
            # Create new booking instance for this recurring payment
            new_booking = Booking.objects.create(
                user=booking.user,
                listing=booking.listing,
                start_time=booking.calculate_next_start_time(),
                end_time=booking.calculate_next_end_time(),
                total_amount=booking.total_amount,
                status='confirmed',
                is_recurring_instance=True,
                parent_booking=booking
            )
            
            # Create payment record
            Payment.objects.create(
                booking=new_booking,
                amount=invoice['amount_paid'] / 100,
                currency=invoice['currency'],
                status='completed',
                stripe_invoice_id=invoice['id']
            )
            
            # Trigger host payout
            PayoutService.initiate_host_payout(new_booking)
            
            # Send notifications
            NotificationService.notify_recurring_booking_confirmed(new_booking)
            
            logger.info(f"Recurring payment succeeded for booking {booking.id}")
            
        except Booking.DoesNotExist:
            logger.error(f"Booking not found for subscription {subscription_id}")
        except Exception as e:
            logger.error(f"Error handling recurring payment: {str(e)}")
    
    def handle_transfer_created(self, transfer):
        """Handle host payout transfer"""
        try:
            booking_id = transfer.get('metadata', {}).get('booking_id')
            if not booking_id:
                return
            
            payout = Payout.objects.get(
                booking_id=booking_id,
                stripe_transfer_id=transfer['id']
            )
            payout.status = 'processing'
            payout.save()
            
            logger.info(f"Transfer created for booking {booking_id}")
            
        except Payout.DoesNotExist:
            logger.error(f"Payout not found for transfer {transfer['id']}")
        except Exception as e:
            logger.error(f"Error handling transfer creation: {str(e)}")
    
    def handle_payout_paid(self, payout_data):
        """Handle successful payout to host"""
        try:
            # Find payout by arrival_date or other identifier
            payouts = Payout.objects.filter(
                status='processing',
                scheduled_date=payout_data['arrival_date']
            )
            
            for payout in payouts:
                payout.status = 'completed'
                payout.completed_at = payout_data['arrival_date']
                payout.save()
                
                # Notify host
                NotificationService.notify_payout_completed(payout)
            
            logger.info(f"Payout completed: {payout_data['id']}")
            
        except Exception as e:
            logger.error(f"Error handling payout completion: {str(e)}")
    
    def handle_dispute_created(self, charge):
        """Handle payment dispute/chargeback"""
        try:
            payment = Payment.objects.get(stripe_charge_id=charge['id'])
            payment.status = 'disputed'
            payment.dispute_reason = charge.get('dispute', {}).get('reason', 'Unknown')
            payment.save()
            
            # Notify admin and host
            NotificationService.notify_dispute_created(payment)
            
            logger.info(f"Dispute created for payment {payment.id}")
            
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for disputed charge {charge['id']}")
        except Exception as e:
            logger.error(f"Error handling dispute: {str(e)}")


# URL configuration for webhook
webhook_view = StripeWebhookView.as_view()