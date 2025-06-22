"""
Serializers for payments app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    PaymentMethod,
    PaymentIntent,
    Payment,
    Refund,
    Payout,
    WebhookEvent,
    RefundRequest
)

User = get_user_model()


class PaymentMethodSerializer(serializers.ModelSerializer):
    """
    Serializer for payment methods.
    """
    display_name = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'payment_type', 'card_brand', 'card_last4', 
            'card_exp_month', 'card_exp_year', 'bank_name', 
            'account_last4', 'is_default', 'is_active',
            'display_name', 'is_expired', 'created_at'
        ]
        read_only_fields = [
            'id', 'card_brand', 'card_last4', 'card_exp_month',
            'card_exp_year', 'bank_name', 'account_last4', 'created_at'
        ]
    
    def get_display_name(self, obj):
        """Get a user-friendly display name for the payment method."""
        return str(obj)
    
    def get_is_expired(self, obj):
        """Check if the payment method is expired (for cards)."""
        if obj.payment_type == PaymentMethod.PaymentType.CARD:
            if obj.card_exp_month and obj.card_exp_year:
                from datetime import datetime
                now = datetime.now()
                return (obj.card_exp_year < now.year or 
                       (obj.card_exp_year == now.year and obj.card_exp_month < now.month))
        return False


class CreatePaymentMethodSerializer(serializers.Serializer):
    """
    Serializer for creating payment methods via Stripe.
    """
    stripe_payment_method_id = serializers.CharField(
        max_length=255,
        help_text="Stripe payment method ID from frontend"
    )
    is_default = serializers.BooleanField(
        default=False,
        help_text="Set as default payment method"
    )


class PaymentIntentSerializer(serializers.ModelSerializer):
    """
    Serializer for payment intents.
    """
    booking_details = serializers.SerializerMethodField()
    payment_method_details = PaymentMethodSerializer(source='payment_method', read_only=True)
    host_payout_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = PaymentIntent
        fields = [
            'id', 'stripe_payment_intent_id', 'client_secret',
            'amount', 'platform_fee', 'host_payout_amount', 'currency',
            'status', 'description', 'receipt_email',
            'confirmation_method', 'capture_method',
            'booking_details', 'payment_method_details',
            'created_at', 'updated_at', 'confirmed_at', 'canceled_at'
        ]
        read_only_fields = [
            'id', 'stripe_payment_intent_id', 'client_secret',
            'status', 'created_at', 'updated_at', 'confirmed_at', 'canceled_at'
        ]
    
    def get_booking_details(self, obj):
        """Get basic booking information."""
        booking = obj.booking
        return {
            'id': booking.id,
            'booking_id': booking.booking_id,
            'start_time': booking.start_time,
            'end_time': booking.end_time,
            'parking_space': {
                'id': booking.parking_space.id,
                'title': booking.parking_space.title,
                'address': booking.parking_space.address,
            }
        }


class CreatePaymentIntentSerializer(serializers.Serializer):
    """
    Serializer for creating payment intents.
    """
    booking_id = serializers.CharField(
        max_length=20,
        help_text="Booking ID to create payment for"
    )
    payment_method_id = serializers.IntegerField(
        required=False,
        help_text="Payment method ID to use (optional)"
    )
    save_payment_method = serializers.BooleanField(
        default=False,
        help_text="Save payment method for future use"
    )


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for payments.
    """
    booking_details = serializers.SerializerMethodField()
    user_details = serializers.SerializerMethodField()
    can_be_refunded = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payment_id', 'stripe_charge_id', 'amount',
            'platform_fee', 'host_payout_amount', 'currency', 'status',
            'payment_method_type', 'card_brand', 'card_last4',
            'receipt_url', 'receipt_number', 'description',
            'failure_code', 'failure_message', 'can_be_refunded',
            'booking_details', 'user_details',
            'created_at', 'updated_at', 'processed_at'
        ]
        read_only_fields = [
            'id', 'payment_id', 'stripe_charge_id', 'amount',
            'platform_fee', 'host_payout_amount', 'currency', 'status',
            'payment_method_type', 'card_brand', 'card_last4',
            'receipt_url', 'receipt_number', 'failure_code', 'failure_message',
            'created_at', 'updated_at', 'processed_at'
        ]
    
    def get_booking_details(self, obj):
        """Get basic booking information."""
        booking = obj.booking
        return {
            'id': booking.id,
            'booking_id': booking.booking_id,
            'start_time': booking.start_time,
            'end_time': booking.end_time,
            'parking_space': {
                'id': booking.parking_space.id,
                'title': booking.parking_space.title,
                'address': booking.parking_space.address,
            }
        }
    
    def get_user_details(self, obj):
        """Get basic user information."""
        user = obj.user
        return {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
        }


class RefundSerializer(serializers.ModelSerializer):
    """
    Serializer for refunds.
    """
    payment_details = serializers.SerializerMethodField()
    user_details = serializers.SerializerMethodField()
    processed_by_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Refund
        fields = [
            'id', 'refund_id', 'stripe_refund_id', 'amount', 'currency',
            'status', 'reason', 'description', 'admin_notes',
            'failure_reason', 'payment_details', 'user_details',
            'processed_by_details', 'requested_at', 'processed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'refund_id', 'stripe_refund_id', 'status',
            'failure_reason', 'requested_at', 'processed_at',
            'created_at', 'updated_at'
        ]
    
    def get_payment_details(self, obj):
        """Get basic payment information."""
        payment = obj.payment
        return {
            'id': payment.id,
            'payment_id': payment.payment_id,
            'amount': payment.amount,
            'booking_id': payment.booking.booking_id,
        }
    
    def get_user_details(self, obj):
        """Get basic user information."""
        user = obj.user
        return {
            'id': user.id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
        }
    
    def get_processed_by_details(self, obj):
        """Get admin user who processed the refund."""
        if obj.processed_by:
            user = obj.processed_by
            return {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
            }
        return None


class CreateRefundSerializer(serializers.Serializer):
    """
    Serializer for creating refunds.
    """
    payment_id = serializers.CharField(
        max_length=20,
        help_text="Payment ID to refund"
    )
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        help_text="Refund amount (full refund if not specified)"
    )
    reason = serializers.ChoiceField(
        choices=Refund.RefundReason.choices,
        help_text="Reason for the refund"
    )
    description = serializers.CharField(
        max_length=500,
        required=False,
        help_text="Additional refund details"
    )


class PayoutSerializer(serializers.ModelSerializer):
    """
    Serializer for payouts.
    """
    host_details = serializers.SerializerMethodField()
    payment_count = serializers.IntegerField(read_only=True)
    payments_list = serializers.SerializerMethodField()
    
    class Meta:
        model = Payout
        fields = [
            'id', 'payout_id', 'stripe_payout_id', 'amount', 'currency',
            'status', 'period_start', 'period_end', 'description',
            'admin_notes', 'failure_code', 'failure_message',
            'host_details', 'payment_count', 'payments_list',
            'created_at', 'updated_at', 'processed_at', 'arrival_date'
        ]
        read_only_fields = [
            'id', 'payout_id', 'stripe_payout_id', 'amount', 'currency',
            'status', 'failure_code', 'failure_message',
            'created_at', 'updated_at', 'processed_at', 'arrival_date'
        ]
    
    def get_host_details(self, obj):
        """Get basic host information."""
        host = obj.host
        return {
            'id': host.id,
            'first_name': host.first_name,
            'last_name': host.last_name,
            'email': host.email,
        }
    
    def get_payments_list(self, obj):
        """Get list of payments in this payout."""
        payments = obj.payments.all()[:10]  # Limit to first 10 for performance
        return [
            {
                'id': payment.id,
                'payment_id': payment.payment_id,
                'amount': payment.amount,
                'booking_id': payment.booking.booking_id,
            }
            for payment in payments
        ]


class WebhookEventSerializer(serializers.ModelSerializer):
    """
    Serializer for webhook events.
    """
    class Meta:
        model = WebhookEvent
        fields = [
            'id', 'stripe_event_id', 'event_type', 'api_version',
            'status', 'processed_at', 'error_message', 'retry_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'stripe_event_id', 'event_type', 'api_version',
            'status', 'processed_at', 'error_message', 'retry_count',
            'created_at', 'updated_at'
        ]


class PaymentStatsSerializer(serializers.Serializer):
    """
    Serializer for payment statistics.
    """
    total_payments = serializers.IntegerField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    successful_payments = serializers.IntegerField()
    failed_payments = serializers.IntegerField()
    refunded_payments = serializers.IntegerField()
    total_refunded_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    platform_fees_collected = serializers.DecimalField(max_digits=12, decimal_places=2)
    host_payouts = serializers.DecimalField(max_digits=12, decimal_places=2)


class ConfirmPaymentSerializer(serializers.Serializer):
    """
    Serializer for confirming payment intents.
    """
    payment_intent_id = serializers.CharField(
        max_length=255,
        help_text="Stripe payment intent ID to confirm"
    )
    payment_method_id = serializers.CharField(
        max_length=255,
        required=False,
        help_text="Payment method ID to use for confirmation"
    )


class RefundRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for refund requests.
    """
    requested_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()
    booking_details = serializers.SerializerMethodField()
    payment_details = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    reason_display = serializers.SerializerMethodField()
    
    class Meta:
        model = RefundRequest
        fields = [
            'id', 'request_id', 'requested_amount', 'approved_amount',
            'reason', 'reason_display', 'status', 'status_display',
            'user_notes', 'admin_notes', 'rejection_reason',
            'requested_by_name', 'reviewed_by_name',
            'booking_details', 'payment_details',
            'created_at', 'updated_at', 'reviewed_at', 'processed_at'
        ]
        read_only_fields = [
            'id', 'request_id', 'approved_amount', 'admin_notes',
            'rejection_reason', 'reviewed_by_name', 'reviewed_at',
            'processed_at', 'created_at', 'updated_at'
        ]
    
    def get_requested_by_name(self, obj):
        """Get the name of the user who requested the refund."""
        user = obj.requested_by
        return f"{user.first_name} {user.last_name}".strip() or user.email
    
    def get_reviewed_by_name(self, obj):
        """Get the name of the admin who reviewed the request."""
        if obj.reviewed_by:
            user = obj.reviewed_by
            return f"{user.first_name} {user.last_name}".strip() or user.email
        return None
    
    def get_booking_details(self, obj):
        """Get basic booking information."""
        booking = obj.booking
        return {
            'id': booking.id,
            'booking_id': getattr(booking, 'booking_id', None),
            'start_time': booking.start_time,
            'end_time': booking.end_time,
            'total_amount': booking.total_amount,
            'status': booking.status,
            'parking_space': {
                'title': booking.parking_space.title,
                'address': booking.parking_space.address
            } if hasattr(booking, 'parking_space') else None
        }
    
    def get_payment_details(self, obj):
        """Get basic payment information."""
        payment = obj.payment
        return {
            'id': payment.id,
            'payment_id': payment.payment_id,
            'amount': payment.amount,
            'status': payment.status,
            'created_at': payment.created_at
        }
    
    def get_status_display(self, obj):
        """Get human-readable status."""
        return obj.get_status_display()
    
    def get_reason_display(self, obj):
        """Get human-readable reason."""
        return obj.get_reason_display()


class RefundRequestDetailSerializer(RefundRequestSerializer):
    """
    Detailed serializer for refund requests with more information.
    """
    refund_details = serializers.SerializerMethodField()
    final_amount = serializers.ReadOnlyField()
    is_pending = serializers.ReadOnlyField()
    is_approved = serializers.ReadOnlyField()
    is_processed = serializers.ReadOnlyField()
    can_be_approved = serializers.ReadOnlyField()
    
    class Meta(RefundRequestSerializer.Meta):
        fields = RefundRequestSerializer.Meta.fields + [
            'refund_details', 'final_amount', 'is_pending',
            'is_approved', 'is_processed', 'can_be_approved'
        ]
    
    def get_refund_details(self, obj):
        """Get details of the processed refund if available."""
        if obj.refund:
            return {
                'id': obj.refund.id,
                'refund_id': obj.refund.refund_id,
                'stripe_refund_id': obj.refund.stripe_refund_id,
                'amount': obj.refund.amount,
                'status': obj.refund.status,
                'created_at': obj.refund.created_at
            }
        return None


class CreateRefundRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for creating refund requests.
    """
    class Meta:
        model = RefundRequest
        fields = [
            'reason', 'user_notes'
        ]
    
    def create(self, validated_data):
        """Create a refund request with calculated amount."""
        # This would be used in the booking cancellation endpoint
        # The booking, payment, requested_by, and requested_amount 
        # would be set by the view
        return super().create(validated_data)


class ApproveRefundSerializer(serializers.Serializer):
    """
    Serializer for approving refund requests.
    """
    approved_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        help_text="Amount to approve (defaults to requested amount)"
    )
    admin_notes = serializers.CharField(
        max_length=1000,
        required=False,
        help_text="Internal admin notes"
    )


class RejectRefundSerializer(serializers.Serializer):
    """
    Serializer for rejecting refund requests.
    """
    rejection_reason = serializers.CharField(
        max_length=500,
        help_text="Reason for rejecting the refund request"
    )
    admin_notes = serializers.CharField(
        max_length=1000,
        required=False,
        help_text="Internal admin notes"
    )