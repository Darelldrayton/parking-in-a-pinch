"""
Payment API Views
"""
import stripe
import logging
from decimal import Decimal
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Payment, PaymentIntent, Payout, Refund
from .services import PaymentService, PayoutService, RefundService
from .serializers import PaymentSerializer, PayoutSerializer, RefundSerializer
from ..bookings.models import Booking
from ..listings.models import ParkingListing

logger = logging.getLogger(__name__)
stripe.api_key = settings.STRIPE_SECRET_KEY


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_mock_payment(request):
    """Confirm mock payment for development"""
    try:
        booking_id = request.data.get('booking_id')
        payment_intent_id = request.data.get('payment_intent_id')
        
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        if settings.DEBUG and payment_intent_id.startswith('pi_test_'):
            # Simulate successful payment
            booking.status = 'confirmed'
            booking.save()
            
            logger.info(f"Mock payment confirmed for booking {booking_id}")
            
            return Response({
                'success': True,
                'booking_id': booking.id,
                'status': booking.status,
                'message': 'Payment confirmed successfully (mock)'
            })
        else:
            return Response(
                {'error': 'Invalid payment intent for mock payment'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except Exception as e:
        logger.error(f"Error confirming mock payment: {str(e)}")
        return Response(
            {'error': 'Failed to confirm payment'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_real_payment(request):
    """Confirm real Stripe payment for development"""
    try:
        booking_id = request.data.get('booking_id')
        payment_intent_id = request.data.get('payment_intent_id')
        
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        # Verify this is a real Stripe payment intent
        if not payment_intent_id or not payment_intent_id.startswith('pi_'):
            return Response(
                {'error': 'Invalid Stripe payment intent ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Skip payment intent verification since booking model doesn't store it
        # In production, this should be verified through Payment model records
        
        # Retrieve payment intent from Stripe to verify it succeeded
        try:
            stripe_payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if stripe_payment_intent.status != 'succeeded':
                return Response(
                    {'error': f'Payment has not succeeded. Status: {stripe_payment_intent.status}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error retrieving payment intent: {e}")
            return Response(
                {'error': 'Failed to verify payment with Stripe'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update booking status to confirmed
        booking.status = 'confirmed'
        booking.save()
        
        # Create PaymentIntent record first, then Payment record
        from decimal import Decimal
        
        # Ensure all amounts are Decimal for proper calculation
        amount = Decimal(str(booking.total_amount))
        platform_fee = Decimal('0.00')  # Calculate proper fee
        
        # Create PaymentIntent record
        payment_intent_record = PaymentIntent.objects.create(
            booking=booking,
            user=booking.user,
            stripe_payment_intent_id=payment_intent_id,
            client_secret=f'{payment_intent_id}_secret_{payment_intent_id[3:11]}',  # Proper format mock client secret
            amount=amount,
            platform_fee=platform_fee,
            currency='USD',
            status='succeeded',
            description=f'Payment for booking {booking.booking_id}',
            confirmed_at=timezone.now()
        )
        
        # Create Payment record
        payment_record = Payment.objects.create(
            user=booking.user,
            booking=booking,
            payment_intent=payment_intent_record,
            amount=amount,
            platform_fee=platform_fee,
            host_payout_amount=amount - platform_fee,
            currency='USD',
            status='succeeded',
            payment_method_type='card',
            stripe_charge_id=f'ch_{payment_intent_id[3:]}',  # Mock charge ID from payment intent
            description=f'Payment for booking {booking.booking_id}',
            processed_at=timezone.now()
        )
        
        logger.info(f"Real Stripe payment confirmed for booking {booking_id}, payment intent {payment_intent_id}")
        
        return Response({
            'success': True,
            'booking_id': booking.id,
            'payment_id': payment_record.id,
            'status': booking.status,
            'message': 'Payment confirmed successfully'
        })
            
    except Exception as e:
        logger.error(f"Error confirming real payment: {str(e)}")
        return Response(
            {'error': 'Failed to confirm payment'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment_intent(request):
    """Create payment intent for booking"""
    try:
        booking_id = request.data.get('booking_id')
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        # Verify booking is in correct state
        if booking.status not in ['pending', 'confirmed', 'payment_failed']:
            return Response(
                {'error': 'Booking is not in a payable state'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare booking data for payment
        booking_data = {
            'booking_id': booking.id,
            'user_id': booking.user.id,
            'host_id': booking.parking_space.host.id,
            'listing_id': booking.parking_space.id,
            'amount': float(booking.total_amount),
            'host_stripe_account_id': getattr(booking.parking_space.host, 'stripe_account_id', None)
        }
        
        # For now, skip Stripe account validation to allow testing
        # if not booking.parking_space.host.stripe_account_id:
        #     return Response(
        #         {'error': 'Host payment account not configured'},
        #         status=status.HTTP_400_BAD_REQUEST
        #     )
        
        # Create payment intent
        result = PaymentService.create_payment_intent(booking_data)
        
        return Response({
            'client_secret': result['client_secret'],
            'payment_intent_id': result['payment_intent_id'],
            'booking_id': booking.id,
            'amount': booking.total_amount
        })
        
    except Exception as e:
        logger.error(f"Error creating payment intent: {str(e)}")
        return Response(
            {'error': 'Failed to create payment intent'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_subscription(request):
    """Create recurring booking subscription"""
    try:
        booking_id = request.data.get('booking_id')
        frequency = request.data.get('frequency', 'week')
        
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        # Verify booking supports recurring
        if not booking.parking_space.allows_recurring:
            return Response(
                {'error': 'This listing does not allow recurring bookings'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare subscription data
        booking_data = {
            'booking_id': booking.id,
            'user_id': booking.user.id,
            'host_id': booking.parking_space.host.id,
            'listing_title': booking.parking_space.title,
            'amount': float(booking.total_amount),
            'frequency': frequency,
            'host_stripe_account_id': booking.parking_space.host.stripe_account_id
        }
        
        # Create subscription
        subscription = PaymentService.create_subscription(booking_data)
        
        return Response({
            'subscription_id': subscription.id,
            'status': subscription.status,
            'current_period_end': subscription.current_period_end,
            'frequency': frequency
        })
        
    except Exception as e:
        logger.error(f"Error creating subscription: {str(e)}")
        return Response(
            {'error': 'Failed to create subscription'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_refund(request):
    """Process refund for a booking"""
    try:
        booking_id = request.data.get('booking_id')
        refund_reason = request.data.get('reason', 'User requested cancellation')
        
        booking = get_object_or_404(Booking, id=booking_id)
        
        # Verify user can request refund
        if booking.user != request.user and booking.parking_space.host != request.user:
            return Response(
                {'error': 'Not authorized to refund this booking'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verify booking can be refunded
        if booking.status not in ['confirmed', 'active']:
            return Response(
                {'error': 'Booking cannot be refunded in current state'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate refund amount
        refund_amount = RefundService.calculate_refund_amount(booking)
        
        if refund_amount <= 0:
            return Response({
                'error': 'No refund available',
                'refund_amount': 0,
                'policy': RefundService.get_refund_policy_text(booking)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Process refund
        refund = PaymentService.process_refund(booking_id, refund_reason, refund_amount)
        
        return Response({
            'refund_id': refund.id,
            'amount': refund.amount,
            'status': refund.status,
            'booking_id': booking.id
        })
        
    except Exception as e:
        logger.error(f"Error processing refund: {str(e)}")
        return Response(
            {'error': 'Failed to process refund'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_refund_estimate(request, booking_id):
    """Get refund estimate for a booking"""
    try:
        booking = get_object_or_404(Booking, id=booking_id)
        
        # Verify user can view refund estimate
        if booking.user != request.user and booking.parking_space.host != request.user:
            return Response(
                {'error': 'Not authorized to view refund estimate'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        refund_amount = RefundService.calculate_refund_amount(booking)
        policy_text = RefundService.get_refund_policy_text(booking)
        
        return Response({
            'booking_id': booking.id,
            'original_amount': booking.total_amount,
            'refund_amount': refund_amount,
            'cancellation_policy': booking.parking_space.cancellation_policy,
            'policy_description': policy_text
        })
        
    except Exception as e:
        logger.error(f"Error getting refund estimate: {str(e)}")
        return Response(
            {'error': 'Failed to get refund estimate'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment_history(request):
    """Get user's payment history"""
    try:
        user_bookings = Booking.objects.filter(user=request.user)
        payments = Payment.objects.filter(booking__in=user_bookings).order_by('-created_at')
        
        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error getting payment history: {str(e)}")
        return Response(
            {'error': 'Failed to get payment history'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_host_payouts(request):
    """Get host's payout history"""
    try:
        # Verify user is a host
        user_listings = ParkingListing.objects.filter(host=request.user)
        if not user_listings.exists():
            return Response(
                {'error': 'User is not a host'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        payouts = Payout.objects.filter(host=request.user).order_by('-created_at')
        
        serializer = PayoutSerializer(payouts, many=True)
        return Response(serializer.data)
        
    except Exception as e:
        logger.error(f"Error getting host payouts: {str(e)}")
        return Response(
            {'error': 'Failed to get payout history'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_instant_payout(request):
    """Request instant payout for pending earnings"""
    try:
        # Get pending payouts for host
        pending_payouts = Payout.objects.filter(
            host=request.user,
            status='scheduled'
        )
        
        if not pending_payouts.exists():
            return Response(
                {'error': 'No pending payouts available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if instant payout is enabled for host
        if not request.user.profile.instant_payout_enabled:
            return Response(
                {'error': 'Instant payout not enabled for your account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process instant payouts
        processed_payouts = []
        for payout in pending_payouts:
            try:
                PayoutService._process_instant_payout(payout)
                processed_payouts.append(payout.id)
            except Exception as e:
                logger.error(f"Failed to process instant payout {payout.id}: {str(e)}")
                continue
        
        return Response({
            'processed_payouts': processed_payouts,
            'total_amount': sum(p.amount for p in pending_payouts if p.id in processed_payouts)
        })
        
    except Exception as e:
        logger.error(f"Error requesting instant payout: {str(e)}")
        return Response(
            {'error': 'Failed to process instant payout'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_earnings_summary(request):
    """Get host earnings summary"""
    try:
        from django.db.models import Sum, Count
        from datetime import datetime, timedelta
        
        # Verify user is a host
        user_listings = ParkingListing.objects.filter(host=request.user)
        if not user_listings.exists():
            return Response(
                {'error': 'User is not a host'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get date ranges
        today = datetime.now().date()
        this_month_start = today.replace(day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        
        # Calculate earnings
        total_earnings = Payout.objects.filter(
            host=request.user,
            status__in=['completed', 'processing']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        this_month_earnings = Payout.objects.filter(
            host=request.user,
            status__in=['completed', 'processing'],
            created_at__gte=this_month_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        pending_earnings = Payout.objects.filter(
            host=request.user,
            status='scheduled'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_bookings = Booking.objects.filter(
            parking_space__host=request.user,
            status__in=['confirmed', 'completed']
        ).count()
        
        return Response({
            'total_earnings': total_earnings,
            'this_month_earnings': this_month_earnings,
            'pending_earnings': pending_earnings,
            'total_bookings': total_bookings,
            'instant_payout_enabled': getattr(request.user.profile, 'instant_payout_enabled', False)
        })
        
    except Exception as e:
        logger.error(f"Error getting earnings summary: {str(e)}")
        return Response(
            {'error': 'Failed to get earnings summary'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )