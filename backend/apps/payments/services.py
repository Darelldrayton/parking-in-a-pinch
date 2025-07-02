"""
Payment and Payout Services
"""
import stripe
import logging
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from django.db import transaction
from .models import Payment, Payout, Refund
from ..bookings.models import Booking
from ..users.models import User

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentService:
    """Handle payment processing"""
    
    @staticmethod
    def create_payment_intent(booking_data):
        """Create Stripe PaymentIntent for booking"""
        try:
            # Calculate amounts
            amount = int(booking_data['amount'] * 100)  # Convert to cents
            
            # Validate Stripe configuration
            if not settings.STRIPE_SECRET_KEY:
                raise ValueError("STRIPE_SECRET_KEY is not configured. Please add it to your environment variables.")
            
            if not settings.STRIPE_SECRET_KEY.startswith(('sk_test_', 'sk_live_')):
                raise ValueError("Invalid STRIPE_SECRET_KEY format. Must start with 'sk_test_' or 'sk_live_'")
            
            # Safety check: NEVER allow live keys in development
            if settings.DEBUG and settings.STRIPE_SECRET_KEY.startswith('sk_live_'):
                raise ValueError("⚠️ LIVE STRIPE KEY DETECTED IN DEVELOPMENT MODE! This is not allowed for safety. Use sk_test_ keys in development.")
            
            # Initialize Stripe with the API key
            stripe.api_key = settings.STRIPE_SECRET_KEY
            
            # Create REAL Stripe payment intent - NO MOCK GENERATION
            logger.info(f"Creating real Stripe PaymentIntent for booking {booking_data['booking_id']} with amount ${booking_data['amount']}")
            
            payment_intent = stripe.PaymentIntent.create(
                amount=amount,
                currency='usd',
                metadata={
                    'booking_id': booking_data['booking_id'],
                    'user_id': booking_data['user_id'],
                    'host_id': booking_data['host_id'],
                    'listing_id': booking_data['listing_id']
                }
            )
            
            # Update booking status
            booking = Booking.objects.get(id=booking_data['booking_id'])
            booking.status = 'payment_pending'
            booking.save()
            
            # Get the EXACT client secret from Stripe - DO NOT MODIFY IT
            client_secret = payment_intent.client_secret
            
            if not client_secret:
                raise ValueError("Stripe did not return a client_secret")
            
            # Log the actual response for debugging
            logger.info(f"✅ Real Stripe response client_secret: {client_secret}")
            
            # Validate client secret format: should be pi_[id]_secret_[secret] (no 'test' words)
            import re
            if not re.match(r'^pi_[a-zA-Z0-9]+_secret_[a-zA-Z0-9]+$', client_secret):
                logger.error(f"❌ Invalid client secret format received from Stripe: {client_secret}")
                raise ValueError(f"Invalid client secret format: {client_secret}")
            
            # Additional check: ensure no 'test' word appears in the client secret
            if 'test' in client_secret.lower():
                logger.error(f"❌ Client secret contains 'test' word which indicates mock generation: {client_secret}")
                raise ValueError(f"Client secret should not contain 'test' word: {client_secret}")
            
            logger.info(f"✅ Valid Stripe payment intent created for booking {booking_data['booking_id']}")
            
            return {
                'client_secret': client_secret,
                'payment_intent_id': payment_intent.id
            }
            
        except Exception as e:
            logger.error(f"Error creating payment intent: {str(e)}")
            # Update booking status to failed
            if 'booking_id' in booking_data:
                try:
                    booking = Booking.objects.get(id=booking_data['booking_id'])
                    booking.status = 'payment_failed'
                    booking.save()
                except Booking.DoesNotExist:
                    pass
            raise e
    
    @staticmethod
    def create_subscription(booking_data):
        """Create recurring booking subscription"""
        try:
            # Create customer if doesn't exist
            user = User.objects.get(id=booking_data['user_id'])
            if not user.stripe_customer_id:
                customer = stripe.Customer.create(
                    email=user.email,
                    name=f"{user.first_name} {user.last_name}",
                    metadata={'user_id': user.id}
                )
                user.stripe_customer_id = customer.id
                user.save()
            
            # Create price for recurring booking
            price = stripe.Price.create(
                unit_amount=int(booking_data['amount'] * 100),
                currency='usd',
                recurring={'interval': booking_data.get('frequency', 'week')},
                product_data={
                    'name': f"Recurring Parking - {booking_data['listing_title']}",
                }
            )
            
            # Create subscription
            subscription = stripe.Subscription.create(
                customer=user.stripe_customer_id,
                items=[{'price': price.id}],
                application_fee_percent=10,  # 10% platform fee from hosts
                transfer_data={
                    'destination': booking_data['host_stripe_account_id'],
                },
                metadata={
                    'booking_id': booking_data['booking_id'],
                    'user_id': booking_data['user_id'],
                    'host_id': booking_data['host_id'],
                    'frequency': booking_data.get('frequency', 'week')
                }
            )
            
            return subscription
            
        except Exception as e:
            logger.error(f"Error creating subscription: {str(e)}")
            raise e
    
    @staticmethod
    def process_refund(booking_id, refund_reason, refund_amount=None):
        """Process refund for a booking"""
        try:
            booking = Booking.objects.get(id=booking_id)
            payment = Payment.objects.get(booking=booking, status='completed')
            
            # Calculate refund amount based on cancellation policy
            if refund_amount is None:
                refund_amount = RefundService.calculate_refund_amount(booking)
            
            if refund_amount <= 0:
                raise ValueError("No refund amount available")
            
            # Create Stripe refund
            refund = stripe.Refund.create(
                payment_intent=payment.stripe_payment_intent_id,
                amount=int(refund_amount * 100),  # Convert to cents
                metadata={
                    'booking_id': booking_id,
                    'reason': refund_reason
                }
            )
            
            # Create refund record
            refund_record = Refund.objects.create(
                booking=booking,
                payment=payment,
                amount=refund_amount,
                reason=refund_reason,
                stripe_refund_id=refund.id,
                status='completed'
            )
            
            # Update booking status
            booking.status = 'refunded'
            booking.save()
            
            return refund_record
            
        except Exception as e:
            logger.error(f"Error processing refund: {str(e)}")
            raise e


class PayoutService:
    """Handle host payouts"""
    
    @staticmethod
    def initiate_host_payout(booking):
        """Initiate payout to host after successful booking payment"""
        try:
            with transaction.atomic():
                # Calculate payout amount (keep 10% for platform)
                platform_fee = booking.total_amount * Decimal('0.10')  # 10% platform fee from hosts
                payout_amount = booking.total_amount - platform_fee
                
                # Get host's Stripe account
                host = booking.parking_space.host
                if not host.stripe_account_id:
                    raise ValueError(f"Host {host.id} doesn't have Stripe account configured")
                
                # Create payout record
                payout = Payout.objects.create(
                    booking=booking,
                    host=host,
                    amount=payout_amount,
                    platform_fee=platform_fee,
                    currency='usd',
                    status='pending'
                )
                
                # Check if immediate payout is enabled for host
                if host.profile.instant_payout_enabled:
                    PayoutService._process_instant_payout(payout)
                else:
                    PayoutService._schedule_payout(payout)
                
                return payout
                
        except Exception as e:
            logger.error(f"Error initiating host payout: {str(e)}")
            raise e
    
    @staticmethod
    def _process_instant_payout(payout):
        """Process instant payout to host"""
        try:
            # Create Stripe transfer
            transfer = stripe.Transfer.create(
                amount=int(payout.amount * 100),  # Convert to cents
                currency=payout.currency,
                destination=payout.host.stripe_account_id,
                metadata={
                    'booking_id': payout.booking.id,
                    'payout_id': payout.id
                }
            )
            
            payout.stripe_transfer_id = transfer.id
            payout.status = 'processing'
            payout.processed_at = timezone.now()
            payout.save()
            
            logger.info(f"Instant payout initiated for booking {payout.booking.id}")
            
        except Exception as e:
            logger.error(f"Error processing instant payout: {str(e)}")
            payout.status = 'failed'
            payout.failure_reason = str(e)
            payout.save()
            raise e
    
    @staticmethod
    def _schedule_payout(payout):
        """Schedule payout for next payout cycle"""
        try:
            # Schedule for next Friday (standard payout day)
            next_payout_date = PayoutService._get_next_payout_date()
            
            payout.scheduled_date = next_payout_date
            payout.status = 'scheduled'
            payout.save()
            
            logger.info(f"Payout scheduled for {next_payout_date} for booking {payout.booking.id}")
            
        except Exception as e:
            logger.error(f"Error scheduling payout: {str(e)}")
            raise e
    
    @staticmethod
    def _get_next_payout_date():
        """Get next Friday for scheduled payouts"""
        from datetime import datetime, timedelta
        
        today = timezone.now().date()
        days_ahead = 4 - today.weekday()  # Friday is 4
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        return today + timedelta(days_ahead)
    
    @staticmethod
    def process_scheduled_payouts():
        """Process all scheduled payouts for today (run via cron job)"""
        today = timezone.now().date()
        scheduled_payouts = Payout.objects.filter(
            scheduled_date=today,
            status='scheduled'
        )
        
        for payout in scheduled_payouts:
            try:
                PayoutService._process_instant_payout(payout)
            except Exception as e:
                logger.error(f"Error processing scheduled payout {payout.id}: {str(e)}")
                continue


class RefundService:
    """Handle refund calculations and policies"""
    
    CANCELLATION_POLICIES = {
        'simple': {
            'full_refund_hours': 2,
            'partial_refund_hours': 0,
            'partial_refund_percentage': 0
        },
        'flexible': {
            'full_refund_hours': 24,
            'partial_refund_hours': 1,
            'partial_refund_percentage': 50
        },
        'moderate': {
            'full_refund_hours': 2,  # Updated to match new policy
            'partial_refund_hours': 0,
            'partial_refund_percentage': 0
        },
        'strict': {
            'full_refund_hours': 168,  # 7 days
            'partial_refund_hours': 48,
            'partial_refund_percentage': 0
        }
    }
    
    @staticmethod
    def calculate_refund_amount(booking):
        """Calculate refund amount based on cancellation policy"""
        try:
            policy = booking.parking_space.cancellation_policy or 'moderate'
            policy_rules = RefundService.CANCELLATION_POLICIES[policy]
            
            # Calculate hours until booking start
            now = timezone.now()
            hours_until_booking = (booking.start_time - now).total_seconds() / 3600
            
            # Apply policy rules
            if hours_until_booking >= policy_rules['full_refund_hours']:
                return booking.total_amount
            elif hours_until_booking >= policy_rules['partial_refund_hours']:
                refund_percentage = policy_rules['partial_refund_percentage'] / 100
                return booking.total_amount * Decimal(str(refund_percentage))
            else:
                return Decimal('0.00')
                
        except Exception as e:
            logger.error(f"Error calculating refund amount: {str(e)}")
            return Decimal('0.00')
    
    @staticmethod
    def get_refund_policy_text(booking):
        """Get human-readable refund policy text"""
        policy = booking.parking_space.cancellation_policy or 'moderate'
        policy_rules = RefundService.CANCELLATION_POLICIES[policy]
        
        return {
            'flexible': f"Full refund if cancelled {policy_rules['full_refund_hours']} hours before check-in. "
                       f"50% refund if cancelled {policy_rules['partial_refund_hours']} hour before check-in.",
            
            'moderate': f"Full refund if cancelled {policy_rules['full_refund_hours']} hours before check-in. "
                       f"50% refund if cancelled {policy_rules['partial_refund_hours']} hours before check-in.",
            
            'strict': f"Full refund if cancelled {policy_rules['full_refund_hours']} hours (7 days) before check-in. "
                     f"No refund if cancelled less than {policy_rules['partial_refund_hours']} hours before check-in."
        }[policy]


class NotificationService:
    """Handle payment-related notifications"""
    
    @staticmethod
    def notify_booking_confirmed(booking):
        """Send booking confirmation to user"""
        # This will integrate with the notification services we'll implement next
        pass
    
    @staticmethod
    def notify_host_new_booking(booking):
        """Notify host of new booking"""
        pass
    
    @staticmethod
    def notify_payment_failed(booking, reason):
        """Notify user of payment failure"""
        pass
    
    @staticmethod
    def notify_subscription_created(booking):
        """Notify user of subscription creation"""
        pass
    
    @staticmethod
    def notify_subscription_canceled(booking):
        """Notify user of subscription cancellation"""
        pass
    
    @staticmethod
    def notify_subscription_past_due(booking):
        """Notify user of past due subscription"""
        pass
    
    @staticmethod
    def notify_recurring_booking_confirmed(booking):
        """Notify user of recurring booking confirmation"""
        pass
    
    @staticmethod
    def notify_payout_completed(payout):
        """Notify host of completed payout"""
        pass
    
    @staticmethod
    def notify_dispute_created(payment):
        """Notify admin and host of payment dispute"""
        pass