"""
Views for payments app with Stripe integration.
"""
import stripe
import logging
from decimal import Decimal
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q, Sum, Count
from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from apps.bookings.models import Booking
from .models import (
    PaymentMethod,
    PaymentIntent,
    Payment,
    Refund,
    Payout,
    WebhookEvent
)
from .serializers import (
    PaymentMethodSerializer,
    CreatePaymentMethodSerializer,
    PaymentIntentSerializer,
    CreatePaymentIntentSerializer,
    PaymentSerializer,
    RefundSerializer,
    CreateRefundSerializer,
    PayoutSerializer,
    WebhookEventSerializer,
    PaymentStatsSerializer,
    ConfirmPaymentSerializer
)
from .filters import (
    PaymentMethodFilter,
    PaymentIntentFilter,
    PaymentFilter,
    RefundFilter,
    PayoutFilter
)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)


class PaymentMethodViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user payment methods.
    """
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = PaymentMethodFilter
    ordering_fields = ['created_at', 'is_default']
    ordering = ['-is_default', '-created_at']
    
    def get_queryset(self):
        """Return payment methods for the current user."""
        return PaymentMethod.objects.filter(
            user=self.request.user,
            is_active=True
        )
    
    @action(detail=False, methods=['post'])
    def create_from_stripe(self, request):
        """
        Create a payment method from Stripe payment method ID.
        """
        serializer = CreatePaymentMethodSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        stripe_pm_id = serializer.validated_data['stripe_payment_method_id']
        is_default = serializer.validated_data['is_default']
        
        try:
            # Retrieve payment method from Stripe
            stripe_pm = stripe.PaymentMethod.retrieve(stripe_pm_id)
            
            # Attach to customer if not already attached
            if not request.user.stripe_customer_id:
                # Create Stripe customer
                stripe_customer = stripe.Customer.create(
                    email=request.user.email,
                    name=request.user.get_full_name(),
                    metadata={'user_id': request.user.id}
                )
                request.user.stripe_customer_id = stripe_customer.id
                request.user.save()
            
            # Attach payment method to customer
            stripe.PaymentMethod.attach(
                stripe_pm_id,
                customer=request.user.stripe_customer_id
            )
            
            # Create payment method record
            payment_method_data = {
                'user': request.user,
                'stripe_payment_method_id': stripe_pm_id,
                'payment_type': stripe_pm.type,
                'is_default': is_default,
            }
            
            # Extract card details if it's a card
            if stripe_pm.type == 'card':
                card = stripe_pm.card
                payment_method_data.update({
                    'card_brand': card.brand,
                    'card_last4': card.last4,
                    'card_exp_month': card.exp_month,
                    'card_exp_year': card.exp_year,
                })
            
            payment_method = PaymentMethod.objects.create(**payment_method_data)
            serializer = PaymentMethodSerializer(payment_method, context={'request': request})
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment method: {e}")
            return Response(
                {'error': 'Failed to create payment method'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error creating payment method: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """
        Set payment method as default.
        """
        payment_method = self.get_object()
        payment_method.is_default = True
        payment_method.save()
        
        serializer = PaymentMethodSerializer(payment_method, context={'request': request})
        return Response(serializer.data)
    
    def perform_destroy(self, instance):
        """
        Detach payment method from Stripe and mark as inactive.
        """
        try:
            # Detach from Stripe customer
            stripe.PaymentMethod.detach(instance.stripe_payment_method_id)
            
            # Mark as inactive instead of deleting
            instance.is_active = False
            instance.save()
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error detaching payment method: {e}")
            # Still mark as inactive locally
            instance.is_active = False
            instance.save()


class PaymentIntentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing payment intents.
    """
    serializer_class = PaymentIntentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = PaymentIntentFilter
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return payment intents for the current user."""
        return PaymentIntent.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_intent(self, request):
        """
        Create a payment intent for a booking.
        """
        serializer = CreatePaymentIntentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        booking_id = serializer.validated_data['booking_id']
        payment_method_id = serializer.validated_data.get('payment_method_id')
        save_payment_method = serializer.validated_data['save_payment_method']
        
        try:
            # Get booking
            booking = get_object_or_404(
                Booking,
                booking_id=booking_id,
                user=request.user,
                status__in=['pending', 'confirmed']
            )
            
            # Check if payment intent already exists
            if hasattr(booking, 'payment_intent'):
                existing_intent = booking.payment_intent
                if existing_intent.status not in ['canceled', 'succeeded']:
                    serializer = PaymentIntentSerializer(existing_intent, context={'request': request})
                    return Response(serializer.data)
            
            # Calculate amounts
            total_amount = booking.total_amount
            platform_fee = booking.platform_fee
            
            # Create Stripe customer if needed
            if not request.user.stripe_customer_id:
                stripe_customer = stripe.Customer.create(
                    email=request.user.email,
                    name=request.user.get_full_name(),
                    metadata={'user_id': request.user.id}
                )
                request.user.stripe_customer_id = stripe_customer.id
                request.user.save()
            
            # Get payment method if specified
            payment_method = None
            stripe_payment_method_id = None
            if payment_method_id:
                payment_method = get_object_or_404(
                    PaymentMethod,
                    id=payment_method_id,
                    user=request.user,
                    is_active=True
                )
                stripe_payment_method_id = payment_method.stripe_payment_method_id
            
            # Create Stripe payment intent
            stripe_intent_data = {
                'amount': int(total_amount * 100),  # Convert to cents
                'currency': 'usd',
                'customer': request.user.stripe_customer_id,
                'description': f'Parking booking {booking.booking_id}',
                'receipt_email': request.user.email,
                'metadata': {
                    'booking_id': booking.booking_id,
                    'user_id': request.user.id,
                    'platform_fee': str(platform_fee),
                },
                'automatic_payment_methods': {
                    'enabled': True,
                },
            }
            
            if stripe_payment_method_id:
                stripe_intent_data['payment_method'] = stripe_payment_method_id
                if not save_payment_method:
                    stripe_intent_data['confirmation_method'] = 'manual'
            
            stripe_intent = stripe.PaymentIntent.create(**stripe_intent_data)
            
            # Create payment intent record
            payment_intent = PaymentIntent.objects.create(
                booking=booking,
                user=request.user,
                payment_method=payment_method,
                stripe_payment_intent_id=stripe_intent.id,
                client_secret=stripe_intent.client_secret,
                amount=total_amount,
                platform_fee=platform_fee,
                status=stripe_intent.status,
                description=stripe_intent_data['description'],
                receipt_email=stripe_intent_data['receipt_email'],
            )
            
            serializer = PaymentIntentSerializer(payment_intent, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found or not accessible'},
                status=status.HTTP_404_NOT_FOUND
            )
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {e}")
            return Response(
                {'error': 'Failed to create payment intent'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error creating payment intent: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        Confirm a payment intent.
        """
        payment_intent = self.get_object()
        
        if payment_intent.status == 'succeeded':
            return Response({'message': 'Payment intent already confirmed'})
        
        try:
            # Confirm with Stripe
            stripe_intent = stripe.PaymentIntent.confirm(
                payment_intent.stripe_payment_intent_id
            )
            
            # Update local record
            payment_intent.status = stripe_intent.status
            if stripe_intent.status == 'succeeded':
                payment_intent.confirmed_at = timezone.now()
            payment_intent.save()
            
            serializer = PaymentIntentSerializer(payment_intent, context={'request': request})
            return Response(serializer.data)
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error confirming payment intent: {e}")
            return Response(
                {'error': 'Failed to confirm payment intent'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a payment intent.
        """
        payment_intent = self.get_object()
        
        if payment_intent.status in ['succeeded', 'canceled']:
            return Response(
                {'error': 'Cannot cancel this payment intent'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Cancel with Stripe
            stripe_intent = stripe.PaymentIntent.cancel(
                payment_intent.stripe_payment_intent_id
            )
            
            # Update local record
            payment_intent.status = stripe_intent.status
            payment_intent.canceled_at = timezone.now()
            payment_intent.save()
            
            serializer = PaymentIntentSerializer(payment_intent, context={'request': request})
            return Response(serializer.data)
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error canceling payment intent: {e}")
            return Response(
                {'error': 'Failed to cancel payment intent'},
                status=status.HTTP_400_BAD_REQUEST
            )


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing payments.
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = PaymentFilter
    ordering_fields = ['created_at', 'amount', 'processed_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return payments for the current user."""
        return Payment.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get payment statistics for the current user.
        """
        queryset = self.get_queryset()
        
        stats = {
            'total_payments': queryset.count(),
            'total_amount': queryset.aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00'),
            'successful_payments': queryset.filter(
                status='succeeded'
            ).count(),
            'failed_payments': queryset.filter(
                status='failed'
            ).count(),
            'refunded_payments': queryset.filter(
                status__in=['refunded', 'partially_refunded']
            ).count(),
            'total_refunded_amount': queryset.filter(
                refunds__status='succeeded'
            ).aggregate(
                total=Sum('refunds__amount')
            )['total'] or Decimal('0.00'),
            'platform_fees_collected': queryset.filter(
                status='succeeded'
            ).aggregate(
                total=Sum('platform_fee')
            )['total'] or Decimal('0.00'),
            'host_payouts': queryset.filter(
                status='succeeded'
            ).aggregate(
                total=Sum('host_payout_amount')
            )['total'] or Decimal('0.00'),
        }
        
        serializer = PaymentStatsSerializer(stats)
        return Response(serializer.data)


class RefundViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing refunds.
    """
    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = RefundFilter
    ordering_fields = ['created_at', 'amount', 'processed_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return refunds for the current user."""
        return Refund.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return CreateRefundSerializer
        return RefundSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a refund request.
        """
        serializer = CreateRefundSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        payment_id = serializer.validated_data['payment_id']
        amount = serializer.validated_data.get('amount')
        reason = serializer.validated_data['reason']
        description = serializer.validated_data.get('description', '')
        
        try:
            # Get payment
            payment = get_object_or_404(
                Payment,
                payment_id=payment_id,
                user=request.user,
                status='succeeded'
            )
            
            if not payment.can_be_refunded:
                return Response(
                    {'error': 'Payment cannot be refunded'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate refund amount
            if amount is None:
                amount = payment.amount
            
            # Validate refund amount
            total_refunded = payment.refunds.filter(
                status='succeeded'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            
            if amount > (payment.amount - total_refunded):
                return Response(
                    {'error': 'Refund amount exceeds available amount'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                # Create Stripe refund
                stripe_refund = stripe.Refund.create(
                    charge=payment.stripe_charge_id,
                    amount=int(amount * 100),  # Convert to cents
                    reason=reason if reason in ['duplicate', 'fraudulent', 'requested_by_customer'] else 'requested_by_customer',
                    metadata={
                        'payment_id': payment.payment_id,
                        'user_id': request.user.id,
                        'reason': reason,
                    }
                )
                
                # Create refund record
                refund = Refund.objects.create(
                    payment=payment,
                    user=request.user,
                    stripe_refund_id=stripe_refund.id,
                    amount=amount,
                    status=stripe_refund.status,
                    reason=reason,
                    description=description,
                )
                
                # Update payment status if fully refunded
                total_refunded = payment.refunds.filter(
                    status='succeeded'
                ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
                
                if total_refunded >= payment.amount:
                    payment.status = 'refunded'
                elif total_refunded > 0:
                    payment.status = 'partially_refunded'
                payment.save()
            
            serializer = RefundSerializer(refund, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Payment.DoesNotExist:
            return Response(
                {'error': 'Payment not found or not accessible'},
                status=status.HTTP_404_NOT_FOUND
            )
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating refund: {e}")
            return Response(
                {'error': 'Failed to process refund'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error creating refund: {e}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PayoutViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing payouts (host earnings).
    """
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = PayoutFilter
    ordering_fields = ['created_at', 'amount', 'period_start', 'period_end']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Return payouts for the current user if they are a host."""
        if not self.request.user.can_host():
            return Payout.objects.none()
        return Payout.objects.filter(host=self.request.user)
    
    @action(detail=False, methods=['get'])
    def earnings(self, request):
        """
        Get host earnings summary.
        """
        if not request.user.can_host():
            return Response(
                {'error': 'User is not a host'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all successful payments for host's listings
        from apps.bookings.models import Booking
        
        host_payments = Payment.objects.filter(
            booking__parking_space__host=request.user,
            status='succeeded'
        )
        
        earnings = {
            'total_earnings': host_payments.aggregate(
                total=Sum('host_payout_amount')
            )['total'] or Decimal('0.00'),
            'total_bookings': host_payments.count(),
            'pending_payout': host_payments.filter(
                payouts__isnull=True
            ).aggregate(
                total=Sum('host_payout_amount')
            )['total'] or Decimal('0.00'),
            'paid_out': Payout.objects.filter(
                host=request.user,
                status='paid'
            ).aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00'),
        }
        
        return Response(earnings)


class StripeWebhookView(APIView):
    """
    Handle Stripe webhook events.
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, *args, **kwargs):
        """
        Process Stripe webhook events.
        """
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            logger.error("Invalid payload in Stripe webhook")
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid signature in Stripe webhook")
            return Response(status=status.HTTP_400_BAD_REQUEST)
        
        # Store webhook event
        webhook_event, created = WebhookEvent.objects.get_or_create(
            stripe_event_id=event['id'],
            defaults={
                'event_type': event['type'],
                'api_version': event['api_version'],
                'data': event['data'],
                'status': WebhookEvent.EventStatus.RECEIVED,
            }
        )
        
        if not created and webhook_event.is_processed:
            return Response({'status': 'already processed'})
        
        # Process event
        try:
            webhook_event.status = WebhookEvent.EventStatus.PROCESSING
            webhook_event.save()
            
            self._process_webhook_event(event)
            
            webhook_event.status = WebhookEvent.EventStatus.PROCESSED
            webhook_event.processed_at = timezone.now()
            webhook_event.save()
            
        except Exception as e:
            logger.error(f"Error processing webhook event {event['id']}: {e}")
            webhook_event.status = WebhookEvent.EventStatus.FAILED
            webhook_event.error_message = str(e)
            webhook_event.retry_count += 1
            webhook_event.save()
            
            return Response(
                {'error': 'Failed to process event'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({'status': 'success'})
    
    def _process_webhook_event(self, event):
        """
        Process specific webhook event types.
        """
        event_type = event['type']
        data = event['data']['object']
        
        if event_type == 'payment_intent.succeeded':
            self._handle_payment_intent_succeeded(data)
        elif event_type == 'payment_intent.payment_failed':
            self._handle_payment_intent_failed(data)
        elif event_type == 'charge.succeeded':
            self._handle_charge_succeeded(data)
        elif event_type == 'charge.failed':
            self._handle_charge_failed(data)
        elif event_type == 'refund.created':
            self._handle_refund_created(data)
        elif event_type == 'payout.paid':
            self._handle_payout_paid(data)
        elif event_type == 'payout.failed':
            self._handle_payout_failed(data)
        else:
            logger.info(f"Unhandled webhook event type: {event_type}")
    
    def _handle_payment_intent_succeeded(self, data):
        """Handle successful payment intent."""
        try:
            payment_intent = PaymentIntent.objects.get(
                stripe_payment_intent_id=data['id']
            )
            payment_intent.status = 'succeeded'
            payment_intent.confirmed_at = timezone.now()
            payment_intent.save()
            
            # Update booking status
            booking = payment_intent.booking
            booking.status = 'confirmed'
            booking.confirmed_at = timezone.now()
            booking.save()
            
        except PaymentIntent.DoesNotExist:
            logger.warning(f"PaymentIntent not found for {data['id']}")
    
    def _handle_payment_intent_failed(self, data):
        """Handle failed payment intent."""
        try:
            payment_intent = PaymentIntent.objects.get(
                stripe_payment_intent_id=data['id']
            )
            payment_intent.status = data['status']
            payment_intent.save()
            
        except PaymentIntent.DoesNotExist:
            logger.warning(f"PaymentIntent not found for {data['id']}")
    
    def _handle_charge_succeeded(self, data):
        """Handle successful charge."""
        try:
            payment_intent = PaymentIntent.objects.get(
                stripe_payment_intent_id=data['payment_intent']
            )
            
            # Create payment record
            payment, created = Payment.objects.get_or_create(
                payment_intent=payment_intent,
                defaults={
                    'user': payment_intent.user,
                    'booking': payment_intent.booking,
                    'stripe_charge_id': data['id'],
                    'amount': Decimal(str(data['amount'])) / 100,
                    'platform_fee': payment_intent.platform_fee,
                    'currency': data['currency'],
                    'status': 'succeeded',
                    'payment_method_type': data['payment_method_details']['type'],
                    'receipt_url': data.get('receipt_url', ''),
                    'description': data.get('description', ''),
                    'processed_at': timezone.now(),
                }
            )
            
            if created and data['payment_method_details']['type'] == 'card':
                card = data['payment_method_details']['card']
                payment.card_brand = card['brand']
                payment.card_last4 = card['last4']
                payment.save()
            
        except PaymentIntent.DoesNotExist:
            logger.warning(f"PaymentIntent not found for charge {data['id']}")
    
    def _handle_charge_failed(self, data):
        """Handle failed charge."""
        try:
            payment_intent = PaymentIntent.objects.get(
                stripe_payment_intent_id=data['payment_intent']
            )
            
            # Create or update payment record
            payment, created = Payment.objects.get_or_create(
                payment_intent=payment_intent,
                defaults={
                    'user': payment_intent.user,
                    'booking': payment_intent.booking,
                    'stripe_charge_id': data['id'],
                    'amount': Decimal(str(data['amount'])) / 100,
                    'platform_fee': payment_intent.platform_fee,
                    'currency': data['currency'],
                    'status': 'failed',
                    'payment_method_type': data['payment_method_details']['type'],
                    'failure_code': data.get('failure_code', ''),
                    'failure_message': data.get('failure_message', ''),
                    'processed_at': timezone.now(),
                }
            )
            
        except PaymentIntent.DoesNotExist:
            logger.warning(f"PaymentIntent not found for charge {data['id']}")
    
    def _handle_refund_created(self, data):
        """Handle refund creation."""
        try:
            payment = Payment.objects.get(stripe_charge_id=data['charge'])
            
            refund = Refund.objects.filter(
                stripe_refund_id=data['id']
            ).first()
            
            if refund:
                refund.status = data['status']
                if data['status'] == 'succeeded':
                    refund.processed_at = timezone.now()
                refund.save()
                
        except Payment.DoesNotExist:
            logger.warning(f"Payment not found for refund {data['id']}")
    
    def _handle_payout_paid(self, data):
        """Handle successful payout."""
        try:
            payout = Payout.objects.get(stripe_payout_id=data['id'])
            payout.status = 'paid'
            payout.processed_at = timezone.now()
            payout.save()
            
        except Payout.DoesNotExist:
            logger.warning(f"Payout not found for {data['id']}")
    
    def _handle_payout_failed(self, data):
        """Handle failed payout."""
        try:
            payout = Payout.objects.get(stripe_payout_id=data['id'])
            payout.status = 'failed'
            payout.failure_code = data.get('failure_code', '')
            payout.failure_message = data.get('failure_message', '')
            payout.save()
            
        except Payout.DoesNotExist:
            logger.warning(f"Payout not found for {data['id']}")


class PaymentConfigView(APIView):
    """
    Get Stripe configuration for frontend.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Return Stripe public key and other config.
        """
        return Response({
            'stripe_public_key': settings.STRIPE_PUBLIC_KEY,
            'currency': 'usd',
            'country': 'US',
        })