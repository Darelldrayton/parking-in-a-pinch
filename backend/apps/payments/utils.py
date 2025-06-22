"""
Utility functions for payments app.
"""
import stripe
import logging
from decimal import Decimal
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import PaymentMethod, PaymentIntent

stripe.api_key = settings.STRIPE_SECRET_KEY
User = get_user_model()
logger = logging.getLogger(__name__)


def create_stripe_customer(user):
    """
    Create a Stripe customer for a user.
    
    Args:
        user: User instance
        
    Returns:
        str: Stripe customer ID
    """
    if user.stripe_customer_id:
        return user.stripe_customer_id
    
    try:
        customer = stripe.Customer.create(
            email=user.email,
            name=user.get_full_name(),
            phone=user.phone_number if user.phone_number else None,
            metadata={'user_id': user.id}
        )
        
        user.stripe_customer_id = customer.id
        user.save()
        
        logger.info(f"Created Stripe customer {customer.id} for user {user.email}")
        return customer.id
        
    except stripe.error.StripeError as e:
        logger.error(f"Error creating Stripe customer for user {user.email}: {e}")
        raise


def calculate_platform_fee(amount, fee_percentage=5.0):
    """
    Calculate platform fee for a payment amount.
    
    Args:
        amount (Decimal): Payment amount
        fee_percentage (float): Fee percentage (default 5% for renters)
        
    Returns:
        Decimal: Platform fee amount
    """
    return amount * Decimal(str(fee_percentage / 100))


def calculate_stripe_fee(amount):
    """
    Calculate estimated Stripe processing fee.
    
    Args:
        amount (Decimal): Payment amount
        
    Returns:
        Decimal: Estimated Stripe fee
    """
    # Stripe fee: 2.9% + $0.30 for US cards
    percentage_fee = amount * Decimal('0.029')
    fixed_fee = Decimal('0.30')
    return percentage_fee + fixed_fee


def get_payment_method_display_info(stripe_payment_method):
    """
    Extract display information from Stripe payment method.
    
    Args:
        stripe_payment_method: Stripe PaymentMethod object
        
    Returns:
        dict: Display information
    """
    info = {
        'type': stripe_payment_method.type,
        'brand': None,
        'last4': None,
        'exp_month': None,
        'exp_year': None,
        'bank_name': None,
        'account_last4': None,
    }
    
    if stripe_payment_method.type == 'card':
        card = stripe_payment_method.card
        info.update({
            'brand': card.brand,
            'last4': card.last4,
            'exp_month': card.exp_month,
            'exp_year': card.exp_year,
        })
    elif stripe_payment_method.type == 'us_bank_account':
        bank_account = stripe_payment_method.us_bank_account
        info.update({
            'bank_name': bank_account.bank_name,
            'account_last4': bank_account.last4,
        })
    
    return info


def sync_payment_method_from_stripe(user, stripe_payment_method_id):
    """
    Sync payment method data from Stripe.
    
    Args:
        user: User instance
        stripe_payment_method_id: Stripe payment method ID
        
    Returns:
        PaymentMethod: Updated payment method instance
    """
    try:
        # Retrieve from Stripe
        stripe_pm = stripe.PaymentMethod.retrieve(stripe_payment_method_id)
        
        # Get or create local payment method
        payment_method, created = PaymentMethod.objects.get_or_create(
            user=user,
            stripe_payment_method_id=stripe_payment_method_id,
            defaults={'payment_type': stripe_pm.type}
        )
        
        # Update with latest info
        display_info = get_payment_method_display_info(stripe_pm)
        payment_method.payment_type = display_info['type']
        payment_method.card_brand = display_info['brand'] or ''
        payment_method.card_last4 = display_info['last4'] or ''
        payment_method.card_exp_month = display_info['exp_month']
        payment_method.card_exp_year = display_info['exp_year']
        payment_method.bank_name = display_info['bank_name'] or ''
        payment_method.account_last4 = display_info['account_last4'] or ''
        payment_method.save()
        
        return payment_method
        
    except stripe.error.StripeError as e:
        logger.error(f"Error syncing payment method {stripe_payment_method_id}: {e}")
        raise


def validate_payment_amount(amount, min_amount=None, max_amount=None):
    """
    Validate payment amount.
    
    Args:
        amount (Decimal): Amount to validate
        min_amount (Decimal, optional): Minimum allowed amount
        max_amount (Decimal, optional): Maximum allowed amount
        
    Returns:
        bool: True if valid
        
    Raises:
        ValueError: If amount is invalid
    """
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    
    if amount <= 0:
        raise ValueError("Payment amount must be positive")
    
    if min_amount and amount < min_amount:
        raise ValueError(f"Payment amount must be at least ${min_amount}")
    
    if max_amount and amount > max_amount:
        raise ValueError(f"Payment amount cannot exceed ${max_amount}")
    
    # Check for reasonable decimal places (cents)
    if amount.as_tuple().exponent < -2:
        raise ValueError("Payment amount cannot have more than 2 decimal places")
    
    return True


def format_payment_description(booking):
    """
    Format payment description for a booking.
    
    Args:
        booking: Booking instance
        
    Returns:
        str: Formatted description
    """
    return (
        f"Parking at {booking.parking_space.title} "
        f"({booking.start_time.strftime('%m/%d/%Y %H:%M')} - "
        f"{booking.end_time.strftime('%m/%d/%Y %H:%M')})"
    )


def can_cancel_payment_intent(payment_intent):
    """
    Check if a payment intent can be canceled.
    
    Args:
        payment_intent: PaymentIntent instance
        
    Returns:
        bool: True if can be canceled
    """
    cancelable_statuses = [
        'requires_payment_method',
        'requires_confirmation',
        'requires_action',
        'processing',
        'requires_capture'
    ]
    return payment_intent.status in cancelable_statuses


def calculate_refund_amount(payment, refund_percentage=None):
    """
    Calculate refund amount based on booking timing and policies.
    
    Args:
        payment: Payment instance
        refund_percentage (float, optional): Custom refund percentage
        
    Returns:
        Decimal: Refund amount
    """
    if refund_percentage is not None:
        return payment.amount * Decimal(str(refund_percentage / 100))
    
    # Default full refund minus platform fee
    return payment.amount - payment.platform_fee


def get_host_payout_schedule():
    """
    Get the payout schedule configuration.
    
    Returns:
        dict: Payout schedule settings
    """
    return {
        'frequency': 'weekly',  # weekly, monthly
        'day_of_week': 1,  # Monday
        'minimum_amount': Decimal('10.00'),
        'hold_period_days': 2,  # Hold payments for 2 days before payout
    }


def is_payment_eligible_for_payout(payment):
    """
    Check if a payment is eligible for payout to host.
    
    Args:
        payment: Payment instance
        
    Returns:
        bool: True if eligible
    """
    from django.utils import timezone
    from datetime import timedelta
    
    # Must be successful
    if payment.status != 'succeeded':
        return False
    
    # Must not already be in a payout
    if payment.payouts.exists():
        return False
    
    # Must be past hold period
    schedule = get_host_payout_schedule()
    hold_period = timedelta(days=schedule['hold_period_days'])
    cutoff_time = timezone.now() - hold_period
    
    return payment.processed_at <= cutoff_time


def get_payment_statistics(user=None, start_date=None, end_date=None):
    """
    Get payment statistics.
    
    Args:
        user: User instance (optional, for user-specific stats)
        start_date: Start date for filtering
        end_date: End date for filtering
        
    Returns:
        dict: Payment statistics
    """
    from django.db.models import Sum, Count, Q
    from .models import Payment, Refund
    
    # Build base queryset
    queryset = Payment.objects.all()
    
    if user:
        queryset = queryset.filter(user=user)
    
    if start_date:
        queryset = queryset.filter(created_at__gte=start_date)
    
    if end_date:
        queryset = queryset.filter(created_at__lte=end_date)
    
    # Calculate stats
    stats = queryset.aggregate(
        total_payments=Count('id'),
        total_amount=Sum('amount'),
        successful_payments=Count('id', filter=Q(status='succeeded')),
        failed_payments=Count('id', filter=Q(status='failed')),
        platform_fees=Sum('platform_fee', filter=Q(status='succeeded')),
    )
    
    # Get refund stats
    refund_stats = Refund.objects.filter(
        payment__in=queryset,
        status='succeeded'
    ).aggregate(
        total_refunds=Count('id'),
        total_refund_amount=Sum('amount'),
    )
    
    stats.update(refund_stats)
    
    # Convert None values to 0
    for key, value in stats.items():
        if value is None:
            stats[key] = 0 if 'count' in key or 'total' in key else Decimal('0.00')
    
    return stats