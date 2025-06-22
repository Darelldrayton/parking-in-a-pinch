"""
Filters for payments app.
"""
import django_filters
from django.db.models import Q
from .models import (
    PaymentMethod,
    PaymentIntent,
    Payment,
    Refund,
    Payout,
    WebhookEvent
)


class PaymentMethodFilter(django_filters.FilterSet):
    """
    Filter for payment methods.
    """
    payment_type = django_filters.ChoiceFilter(
        choices=PaymentMethod.PaymentType.choices
    )
    is_default = django_filters.BooleanFilter()
    is_active = django_filters.BooleanFilter()
    card_brand = django_filters.CharFilter(lookup_expr='icontains')
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte'
    )

    class Meta:
        model = PaymentMethod
        fields = [
            'payment_type', 'is_default', 'is_active', 'card_brand',
            'created_after', 'created_before'
        ]


class PaymentIntentFilter(django_filters.FilterSet):
    """
    Filter for payment intents.
    """
    status = django_filters.ChoiceFilter(
        choices=PaymentIntent.PaymentStatus.choices
    )
    currency = django_filters.CharFilter()
    amount_min = django_filters.NumberFilter(
        field_name='amount',
        lookup_expr='gte'
    )
    amount_max = django_filters.NumberFilter(
        field_name='amount',
        lookup_expr='lte'
    )
    booking = django_filters.CharFilter(
        field_name='booking__booking_id',
        lookup_expr='icontains'
    )
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte'
    )
    confirmed_after = django_filters.DateTimeFilter(
        field_name='confirmed_at',
        lookup_expr='gte'
    )
    confirmed_before = django_filters.DateTimeFilter(
        field_name='confirmed_at',
        lookup_expr='lte'
    )

    class Meta:
        model = PaymentIntent
        fields = [
            'status', 'currency', 'amount_min', 'amount_max', 'booking',
            'created_after', 'created_before', 'confirmed_after', 'confirmed_before'
        ]


class PaymentFilter(django_filters.FilterSet):
    """
    Filter for payments.
    """
    status = django_filters.ChoiceFilter(
        choices=Payment.PaymentStatus.choices
    )
    payment_method_type = django_filters.CharFilter(lookup_expr='icontains')
    card_brand = django_filters.CharFilter(lookup_expr='icontains')
    currency = django_filters.CharFilter()
    amount_min = django_filters.NumberFilter(
        field_name='amount',
        lookup_expr='gte'
    )
    amount_max = django_filters.NumberFilter(
        field_name='amount',
        lookup_expr='lte'
    )
    booking = django_filters.CharFilter(
        field_name='booking__booking_id',
        lookup_expr='icontains'
    )
    host = django_filters.CharFilter(
        field_name='booking__parking_space__host__email',
        lookup_expr='icontains'
    )
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte'
    )
    processed_after = django_filters.DateTimeFilter(
        field_name='processed_at',
        lookup_expr='gte'
    )
    processed_before = django_filters.DateTimeFilter(
        field_name='processed_at',
        lookup_expr='lte'
    )
    
    # Advanced filters
    has_refunds = django_filters.BooleanFilter(
        method='filter_has_refunds'
    )
    in_payout = django_filters.BooleanFilter(
        method='filter_in_payout'
    )

    class Meta:
        model = Payment
        fields = [
            'status', 'payment_method_type', 'card_brand', 'currency',
            'amount_min', 'amount_max', 'booking', 'host',
            'created_after', 'created_before', 'processed_after', 'processed_before',
            'has_refunds', 'in_payout'
        ]

    def filter_has_refunds(self, queryset, name, value):
        """Filter payments that have refunds."""
        if value:
            return queryset.filter(refunds__isnull=False).distinct()
        else:
            return queryset.filter(refunds__isnull=True)

    def filter_in_payout(self, queryset, name, value):
        """Filter payments that are included in payouts."""
        if value:
            return queryset.filter(payouts__isnull=False).distinct()
        else:
            return queryset.filter(payouts__isnull=True)


class RefundFilter(django_filters.FilterSet):
    """
    Filter for refunds.
    """
    status = django_filters.ChoiceFilter(
        choices=Refund.RefundStatus.choices
    )
    reason = django_filters.ChoiceFilter(
        choices=Refund.RefundReason.choices
    )
    currency = django_filters.CharFilter()
    amount_min = django_filters.NumberFilter(
        field_name='amount',
        lookup_expr='gte'
    )
    amount_max = django_filters.NumberFilter(
        field_name='amount',
        lookup_expr='lte'
    )
    payment = django_filters.CharFilter(
        field_name='payment__payment_id',
        lookup_expr='icontains'
    )
    booking = django_filters.CharFilter(
        field_name='payment__booking__booking_id',
        lookup_expr='icontains'
    )
    requested_after = django_filters.DateTimeFilter(
        field_name='requested_at',
        lookup_expr='gte'
    )
    requested_before = django_filters.DateTimeFilter(
        field_name='requested_at',
        lookup_expr='lte'
    )
    processed_after = django_filters.DateTimeFilter(
        field_name='processed_at',
        lookup_expr='gte'
    )
    processed_before = django_filters.DateTimeFilter(
        field_name='processed_at',
        lookup_expr='lte'
    )

    class Meta:
        model = Refund
        fields = [
            'status', 'reason', 'currency', 'amount_min', 'amount_max',
            'payment', 'booking', 'requested_after', 'requested_before',
            'processed_after', 'processed_before'
        ]


class PayoutFilter(django_filters.FilterSet):
    """
    Filter for payouts.
    """
    status = django_filters.ChoiceFilter(
        choices=Payout.PayoutStatus.choices
    )
    currency = django_filters.CharFilter()
    amount_min = django_filters.NumberFilter(
        field_name='amount',
        lookup_expr='gte'
    )
    amount_max = django_filters.NumberFilter(
        field_name='amount',
        lookup_expr='lte'
    )
    host = django_filters.CharFilter(
        field_name='host__email',
        lookup_expr='icontains'
    )
    period_start_after = django_filters.DateTimeFilter(
        field_name='period_start',
        lookup_expr='gte'
    )
    period_start_before = django_filters.DateTimeFilter(
        field_name='period_start',
        lookup_expr='lte'
    )
    period_end_after = django_filters.DateTimeFilter(
        field_name='period_end',
        lookup_expr='gte'
    )
    period_end_before = django_filters.DateTimeFilter(
        field_name='period_end',
        lookup_expr='lte'
    )
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte'
    )
    processed_after = django_filters.DateTimeFilter(
        field_name='processed_at',
        lookup_expr='gte'
    )
    processed_before = django_filters.DateTimeFilter(
        field_name='processed_at',
        lookup_expr='lte'
    )

    class Meta:
        model = Payout
        fields = [
            'status', 'currency', 'amount_min', 'amount_max', 'host',
            'period_start_after', 'period_start_before',
            'period_end_after', 'period_end_before',
            'created_after', 'created_before',
            'processed_after', 'processed_before'
        ]


class WebhookEventFilter(django_filters.FilterSet):
    """
    Filter for webhook events.
    """
    event_type = django_filters.CharFilter(lookup_expr='icontains')
    status = django_filters.ChoiceFilter(
        choices=WebhookEvent.EventStatus.choices
    )
    api_version = django_filters.CharFilter()
    retry_count_min = django_filters.NumberFilter(
        field_name='retry_count',
        lookup_expr='gte'
    )
    retry_count_max = django_filters.NumberFilter(
        field_name='retry_count',
        lookup_expr='lte'
    )
    created_after = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='gte'
    )
    created_before = django_filters.DateTimeFilter(
        field_name='created_at',
        lookup_expr='lte'
    )
    processed_after = django_filters.DateTimeFilter(
        field_name='processed_at',
        lookup_expr='gte'
    )
    processed_before = django_filters.DateTimeFilter(
        field_name='processed_at',
        lookup_expr='lte'
    )
    
    # Search across multiple fields
    search = django_filters.CharFilter(
        method='filter_search'
    )

    class Meta:
        model = WebhookEvent
        fields = [
            'event_type', 'status', 'api_version',
            'retry_count_min', 'retry_count_max',
            'created_after', 'created_before',
            'processed_after', 'processed_before', 'search'
        ]

    def filter_search(self, queryset, name, value):
        """Search across event type and Stripe event ID."""
        return queryset.filter(
            Q(event_type__icontains=value) |
            Q(stripe_event_id__icontains=value)
        )