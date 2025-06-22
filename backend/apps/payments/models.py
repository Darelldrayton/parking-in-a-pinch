"""
Payment models for the Parking in a Pinch application.
"""
import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

User = get_user_model()


class PaymentMethod(models.Model):
    """
    Model representing a saved payment method for a user.
    """
    
    class PaymentType(models.TextChoices):
        CARD = 'card', _('Credit/Debit Card')
        BANK_ACCOUNT = 'bank_account', _('Bank Account')
        DIGITAL_WALLET = 'digital_wallet', _('Digital Wallet')
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payment_methods',
        help_text=_('User who owns this payment method')
    )
    stripe_payment_method_id = models.CharField(
        _('Stripe payment method ID'),
        max_length=255,
        unique=True,
        help_text=_('Stripe payment method identifier')
    )
    payment_type = models.CharField(
        _('payment type'),
        max_length=20,
        choices=PaymentType.choices,
        default=PaymentType.CARD,
        help_text=_('Type of payment method')
    )
    
    # Card details (for display purposes)
    card_brand = models.CharField(
        _('card brand'),
        max_length=20,
        blank=True,
        help_text=_('Card brand (e.g., visa, mastercard)')
    )
    card_last4 = models.CharField(
        _('card last 4 digits'),
        max_length=4,
        blank=True,
        help_text=_('Last 4 digits of the card')
    )
    card_exp_month = models.PositiveIntegerField(
        _('card expiration month'),
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(12)],
        help_text=_('Card expiration month')
    )
    card_exp_year = models.PositiveIntegerField(
        _('card expiration year'),
        null=True,
        blank=True,
        help_text=_('Card expiration year')
    )
    
    # Bank account details (for display purposes)
    bank_name = models.CharField(
        _('bank name'),
        max_length=100,
        blank=True,
        help_text=_('Name of the bank')
    )
    account_last4 = models.CharField(
        _('account last 4 digits'),
        max_length=4,
        blank=True,
        help_text=_('Last 4 digits of the account')
    )
    
    # Status and preferences
    is_default = models.BooleanField(
        _('is default'),
        default=False,
        help_text=_('Whether this is the user\'s default payment method')
    )
    is_active = models.BooleanField(
        _('is active'),
        default=True,
        help_text=_('Whether this payment method is active')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        db_table = 'payment_methods'
        verbose_name = _('Payment Method')
        verbose_name_plural = _('Payment Methods')
        ordering = ['-is_default', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['stripe_payment_method_id']),
            models.Index(fields=['user', 'is_default']),
        ]
    
    def __str__(self):
        if self.payment_type == self.PaymentType.CARD:
            return f"{self.card_brand.title()} ending in {self.card_last4}"
        elif self.payment_type == self.PaymentType.BANK_ACCOUNT:
            return f"{self.bank_name} ending in {self.account_last4}"
        return f"{self.get_payment_type_display()}"
    
    def save(self, *args, **kwargs):
        # Ensure only one default payment method per user
        if self.is_default:
            PaymentMethod.objects.filter(
                user=self.user, 
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class PaymentIntent(models.Model):
    """
    Model representing a Stripe payment intent for a booking.
    """
    
    class PaymentStatus(models.TextChoices):
        REQUIRES_PAYMENT_METHOD = 'requires_payment_method', _('Requires Payment Method')
        REQUIRES_CONFIRMATION = 'requires_confirmation', _('Requires Confirmation')
        REQUIRES_ACTION = 'requires_action', _('Requires Action')
        PROCESSING = 'processing', _('Processing')
        REQUIRES_CAPTURE = 'requires_capture', _('Requires Capture')
        CANCELED = 'canceled', _('Canceled')
        SUCCEEDED = 'succeeded', _('Succeeded')
    
    # Relationships
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='payment_intent',
        help_text=_('Associated booking')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payment_intents',
        help_text=_('User making the payment')
    )
    payment_method = models.ForeignKey(
        PaymentMethod,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payment_intents',
        help_text=_('Payment method used for this payment')
    )
    
    # Stripe information
    stripe_payment_intent_id = models.CharField(
        _('Stripe payment intent ID'),
        max_length=255,
        unique=True,
        help_text=_('Stripe payment intent identifier')
    )
    client_secret = models.CharField(
        _('client secret'),
        max_length=255,
        help_text=_('Client secret for frontend confirmation')
    )
    
    # Payment details
    amount = models.DecimalField(
        _('amount'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_('Payment amount in USD')
    )
    platform_fee = models.DecimalField(
        _('platform fee'),
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Platform fee amount in USD')
    )
    currency = models.CharField(
        _('currency'),
        max_length=3,
        default='USD',
        help_text=_('Payment currency')
    )
    status = models.CharField(
        _('status'),
        max_length=30,
        choices=PaymentStatus.choices,
        default=PaymentStatus.REQUIRES_PAYMENT_METHOD,
        help_text=_('Current status of the payment intent')
    )
    
    # Additional metadata
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Payment description')
    )
    receipt_email = models.EmailField(
        _('receipt email'),
        blank=True,
        help_text=_('Email for payment receipt')
    )
    
    # Processing details
    confirmation_method = models.CharField(
        _('confirmation method'),
        max_length=20,
        default='automatic',
        help_text=_('How the payment intent is confirmed')
    )
    capture_method = models.CharField(
        _('capture method'),
        max_length=20,
        default='automatic',
        help_text=_('How the payment is captured')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    confirmed_at = models.DateTimeField(
        _('confirmed at'),
        null=True,
        blank=True,
        help_text=_('When the payment was confirmed')
    )
    canceled_at = models.DateTimeField(
        _('canceled at'),
        null=True,
        blank=True,
        help_text=_('When the payment was canceled')
    )
    
    class Meta:
        db_table = 'payment_intents'
        verbose_name = _('Payment Intent')
        verbose_name_plural = _('Payment Intents')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['booking']),
            models.Index(fields=['stripe_payment_intent_id']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Payment Intent {self.stripe_payment_intent_id} - ${self.amount}"
    
    @property
    def is_successful(self):
        """Check if payment was successful."""
        return self.status == self.PaymentStatus.SUCCEEDED
    
    @property
    def is_pending(self):
        """Check if payment is still pending."""
        return self.status in [
            self.PaymentStatus.REQUIRES_PAYMENT_METHOD,
            self.PaymentStatus.REQUIRES_CONFIRMATION,
            self.PaymentStatus.REQUIRES_ACTION,
            self.PaymentStatus.PROCESSING,
            self.PaymentStatus.REQUIRES_CAPTURE,
        ]
    
    @property
    def host_payout_amount(self):
        """Calculate the amount that goes to the host."""
        return self.amount - self.platform_fee


class Payment(models.Model):
    """
    Model representing a completed payment transaction.
    """
    
    class PaymentStatus(models.TextChoices):
        PENDING = 'pending', _('Pending')
        PROCESSING = 'processing', _('Processing')
        SUCCEEDED = 'succeeded', _('Succeeded')
        FAILED = 'failed', _('Failed')
        CANCELED = 'canceled', _('Canceled')
        REFUNDED = 'refunded', _('Refunded')
        PARTIALLY_REFUNDED = 'partially_refunded', _('Partially Refunded')
    
    # Relationships
    payment_intent = models.OneToOneField(
        PaymentIntent,
        on_delete=models.CASCADE,
        related_name='payment',
        help_text=_('Associated payment intent')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payments',
        help_text=_('User who made the payment')
    )
    booking = models.OneToOneField(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='payment',
        help_text=_('Associated booking')
    )
    
    # Payment identifiers
    payment_id = models.CharField(
        _('payment ID'),
        max_length=20,
        unique=True,
        db_index=True,
        help_text=_('Internal payment identifier')
    )
    stripe_charge_id = models.CharField(
        _('Stripe charge ID'),
        max_length=255,
        unique=True,
        help_text=_('Stripe charge identifier')
    )
    
    # Payment details
    amount = models.DecimalField(
        _('amount'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_('Payment amount in USD')
    )
    platform_fee = models.DecimalField(
        _('platform fee'),
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Platform fee amount in USD')
    )
    host_payout_amount = models.DecimalField(
        _('host payout amount'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_('Amount paid out to host in USD')
    )
    currency = models.CharField(
        _('currency'),
        max_length=3,
        default='USD',
        help_text=_('Payment currency')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        help_text=_('Current payment status')
    )
    
    # Payment method details
    payment_method_type = models.CharField(
        _('payment method type'),
        max_length=50,
        help_text=_('Type of payment method used')
    )
    card_brand = models.CharField(
        _('card brand'),
        max_length=20,
        blank=True,
        help_text=_('Card brand if payment was made with card')
    )
    card_last4 = models.CharField(
        _('card last 4 digits'),
        max_length=4,
        blank=True,
        help_text=_('Last 4 digits of card if used')
    )
    
    # Receipt and metadata
    receipt_url = models.URLField(
        _('receipt URL'),
        blank=True,
        help_text=_('URL to payment receipt')
    )
    receipt_number = models.CharField(
        _('receipt number'),
        max_length=50,
        blank=True,
        help_text=_('Receipt number for tracking')
    )
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Payment description')
    )
    
    # Failure information
    failure_code = models.CharField(
        _('failure code'),
        max_length=50,
        blank=True,
        help_text=_('Error code if payment failed')
    )
    failure_message = models.TextField(
        _('failure message'),
        blank=True,
        help_text=_('Error message if payment failed')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    processed_at = models.DateTimeField(
        _('processed at'),
        null=True,
        blank=True,
        help_text=_('When the payment was processed')
    )
    
    class Meta:
        db_table = 'payments'
        verbose_name = _('Payment')
        verbose_name_plural = _('Payments')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['booking']),
            models.Index(fields=['payment_id']),
            models.Index(fields=['stripe_charge_id']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Payment {self.payment_id} - ${self.amount}"
    
    def save(self, *args, **kwargs):
        if not self.payment_id:
            self.payment_id = self.generate_payment_id()
        if not self.host_payout_amount:
            self.host_payout_amount = self.amount - self.platform_fee
        super().save(*args, **kwargs)
    
    def generate_payment_id(self):
        """Generate a unique payment ID."""
        return f"PAY{str(uuid.uuid4())[:8].upper()}"
    
    @property
    def is_successful(self):
        """Check if payment was successful."""
        return self.status == self.PaymentStatus.SUCCEEDED
    
    @property
    def can_be_refunded(self):
        """Check if payment can be refunded."""
        return self.status in [
            self.PaymentStatus.SUCCEEDED,
            self.PaymentStatus.PARTIALLY_REFUNDED
        ]


class Refund(models.Model):
    """
    Model representing a payment refund.
    """
    
    class RefundStatus(models.TextChoices):
        PENDING = 'pending', _('Pending')
        SUCCEEDED = 'succeeded', _('Succeeded')
        FAILED = 'failed', _('Failed')
        CANCELED = 'canceled', _('Canceled')
    
    class RefundReason(models.TextChoices):
        DUPLICATE = 'duplicate', _('Duplicate Payment')
        FRAUDULENT = 'fraudulent', _('Fraudulent Payment')
        REQUESTED_BY_CUSTOMER = 'requested_by_customer', _('Requested by Customer')
        BOOKING_CANCELED = 'booking_canceled', _('Booking Canceled')
        HOST_CANCELED = 'host_canceled', _('Host Canceled')
        NO_SHOW = 'no_show', _('Customer No Show')
        OTHER = 'other', _('Other')
    
    # Relationships
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='refunds',
        help_text=_('Original payment being refunded')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='refunds',
        help_text=_('User who requested the refund')
    )
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_refunds',
        help_text=_('Admin user who processed the refund')
    )
    
    # Refund identifiers
    refund_id = models.CharField(
        _('refund ID'),
        max_length=20,
        unique=True,
        db_index=True,
        help_text=_('Internal refund identifier')
    )
    stripe_refund_id = models.CharField(
        _('Stripe refund ID'),
        max_length=255,
        unique=True,
        help_text=_('Stripe refund identifier')
    )
    
    # Refund details
    amount = models.DecimalField(
        _('refund amount'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_('Refund amount in USD')
    )
    currency = models.CharField(
        _('currency'),
        max_length=3,
        default='USD',
        help_text=_('Refund currency')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=RefundStatus.choices,
        default=RefundStatus.PENDING,
        help_text=_('Current refund status')
    )
    reason = models.CharField(
        _('reason'),
        max_length=30,
        choices=RefundReason.choices,
        help_text=_('Reason for the refund')
    )
    
    # Additional information
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Additional refund details')
    )
    admin_notes = models.TextField(
        _('admin notes'),
        blank=True,
        help_text=_('Internal notes for admin use')
    )
    
    # Failure information
    failure_reason = models.TextField(
        _('failure reason'),
        blank=True,
        help_text=_('Reason if refund failed')
    )
    
    # Timestamps
    requested_at = models.DateTimeField(_('requested at'), auto_now_add=True)
    processed_at = models.DateTimeField(
        _('processed at'),
        null=True,
        blank=True,
        help_text=_('When the refund was processed')
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        db_table = 'refunds'
        verbose_name = _('Refund')
        verbose_name_plural = _('Refunds')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['payment', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['refund_id']),
            models.Index(fields=['stripe_refund_id']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Refund {self.refund_id} - ${self.amount}"
    
    def save(self, *args, **kwargs):
        if not self.refund_id:
            self.refund_id = self.generate_refund_id()
        super().save(*args, **kwargs)
    
    def generate_refund_id(self):
        """Generate a unique refund ID."""
        return f"REF{str(uuid.uuid4())[:8].upper()}"
    
    @property
    def is_successful(self):
        """Check if refund was successful."""
        return self.status == self.RefundStatus.SUCCEEDED


class Payout(models.Model):
    """
    Model representing payouts to hosts.
    """
    
    class PayoutStatus(models.TextChoices):
        PENDING = 'pending', _('Pending')
        PROCESSING = 'processing', _('Processing')
        PAID = 'paid', _('Paid')
        FAILED = 'failed', _('Failed')
        CANCELED = 'canceled', _('Canceled')
    
    # Relationships
    host = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payouts',
        help_text=_('Host receiving the payout')
    )
    payments = models.ManyToManyField(
        Payment,
        related_name='payouts',
        help_text=_('Payments included in this payout')
    )
    
    # Payout identifiers
    payout_id = models.CharField(
        _('payout ID'),
        max_length=20,
        unique=True,
        db_index=True,
        help_text=_('Internal payout identifier')
    )
    stripe_payout_id = models.CharField(
        _('Stripe payout ID'),
        max_length=255,
        blank=True,
        help_text=_('Stripe payout identifier')
    )
    
    # Payout details
    amount = models.DecimalField(
        _('payout amount'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_('Total payout amount in USD')
    )
    currency = models.CharField(
        _('currency'),
        max_length=3,
        default='USD',
        help_text=_('Payout currency')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=PayoutStatus.choices,
        default=PayoutStatus.PENDING,
        help_text=_('Current payout status')
    )
    
    # Period information
    period_start = models.DateTimeField(
        _('period start'),
        help_text=_('Start of the payout period')
    )
    period_end = models.DateTimeField(
        _('period end'),
        help_text=_('End of the payout period')
    )
    
    # Additional information
    description = models.TextField(
        _('description'),
        blank=True,
        help_text=_('Payout description')
    )
    admin_notes = models.TextField(
        _('admin notes'),
        blank=True,
        help_text=_('Internal notes for admin use')
    )
    
    # Failure information
    failure_code = models.CharField(
        _('failure code'),
        max_length=50,
        blank=True,
        help_text=_('Error code if payout failed')
    )
    failure_message = models.TextField(
        _('failure message'),
        blank=True,
        help_text=_('Error message if payout failed')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    processed_at = models.DateTimeField(
        _('processed at'),
        null=True,
        blank=True,
        help_text=_('When the payout was processed')
    )
    arrival_date = models.DateTimeField(
        _('arrival date'),
        null=True,
        blank=True,
        help_text=_('Expected arrival date of funds')
    )
    
    class Meta:
        db_table = 'payouts'
        verbose_name = _('Payout')
        verbose_name_plural = _('Payouts')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['host', 'status']),
            models.Index(fields=['payout_id']),
            models.Index(fields=['stripe_payout_id']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['period_start', 'period_end']),
        ]
    
    def __str__(self):
        return f"Payout {self.payout_id} - ${self.amount}"
    
    def save(self, *args, **kwargs):
        if not self.payout_id:
            self.payout_id = self.generate_payout_id()
        super().save(*args, **kwargs)
    
    def generate_payout_id(self):
        """Generate a unique payout ID."""
        return f"PO{str(uuid.uuid4())[:8].upper()}"
    
    @property
    def is_successful(self):
        """Check if payout was successful."""
        return self.status == self.PayoutStatus.PAID
    
    @property
    def payment_count(self):
        """Get the number of payments in this payout."""
        return self.payments.count()


class RefundRequest(models.Model):
    """
    Model representing a refund request that requires admin approval.
    """
    
    class RequestStatus(models.TextChoices):
        PENDING = 'pending', _('Pending Review')
        APPROVED = 'approved', _('Approved')
        REJECTED = 'rejected', _('Rejected')
        PROCESSED = 'processed', _('Processed')
    
    class RefundReason(models.TextChoices):
        CANCELLED_BY_USER = 'cancelled_by_user', _('Cancelled by User')
        CANCELLED_BY_HOST = 'cancelled_by_host', _('Cancelled by Host')
        NO_SHOW = 'no_show', _('No Show')
        SPACE_UNAVAILABLE = 'space_unavailable', _('Space Unavailable')
        EMERGENCY = 'emergency', _('Emergency')
        WEATHER = 'weather', _('Weather Related')
        PAYMENT_ISSUE = 'payment_issue', _('Payment Issue')
        DISPUTE = 'dispute', _('Dispute')
        OTHER = 'other', _('Other')
    
    # Relationships
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='refund_requests',
        help_text=_('Booking for which refund is requested')
    )
    payment = models.ForeignKey(
        Payment,
        on_delete=models.CASCADE,
        related_name='refund_requests',
        help_text=_('Payment to be refunded')
    )
    requested_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='requested_refunds',
        help_text=_('User who requested the refund')
    )
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_refunds',
        help_text=_('Admin who reviewed the request')
    )
    
    # Request details
    request_id = models.CharField(
        _('request ID'),
        max_length=20,
        unique=True,
        db_index=True,
        help_text=_('Internal request identifier')
    )
    requested_amount = models.DecimalField(
        _('requested amount'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_('Requested refund amount')
    )
    approved_amount = models.DecimalField(
        _('approved amount'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_('Admin approved refund amount')
    )
    reason = models.CharField(
        _('reason'),
        max_length=50,
        choices=RefundReason.choices,
        help_text=_('Reason for refund request')
    )
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=RequestStatus.choices,
        default=RequestStatus.PENDING,
        help_text=_('Current request status')
    )
    
    # Additional information
    user_notes = models.TextField(
        _('user notes'),
        blank=True,
        help_text=_('Notes from the user requesting refund')
    )
    admin_notes = models.TextField(
        _('admin notes'),
        blank=True,
        help_text=_('Internal admin notes')
    )
    rejection_reason = models.TextField(
        _('rejection reason'),
        blank=True,
        help_text=_('Reason for rejection if denied')
    )
    
    # Related refund (after processing)
    refund = models.OneToOneField(
        Refund,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='refund_request',
        help_text=_('Associated refund after processing')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    reviewed_at = models.DateTimeField(
        _('reviewed at'),
        null=True,
        blank=True,
        help_text=_('When the request was reviewed')
    )
    processed_at = models.DateTimeField(
        _('processed at'),
        null=True,
        blank=True,
        help_text=_('When the refund was processed')
    )
    
    class Meta:
        db_table = 'refund_requests'
        verbose_name = _('Refund Request')
        verbose_name_plural = _('Refund Requests')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['requested_by']),
            models.Index(fields=['booking']),
            models.Index(fields=['payment']),
        ]
    
    def __str__(self):
        return f"Refund Request {self.request_id} - ${self.requested_amount}"
    
    def save(self, *args, **kwargs):
        if not self.request_id:
            self.request_id = self.generate_request_id()
        super().save(*args, **kwargs)
    
    def generate_request_id(self):
        """Generate a unique request ID."""
        return f"RFR{str(uuid.uuid4())[:8].upper()}"
    
    @property
    def is_pending(self):
        """Check if request is pending review."""
        return self.status == self.RequestStatus.PENDING
    
    @property
    def is_approved(self):
        """Check if request has been approved."""
        return self.status == self.RequestStatus.APPROVED
    
    @property
    def is_processed(self):
        """Check if refund has been processed."""
        return self.status == self.RequestStatus.PROCESSED
    
    @property
    def can_be_approved(self):
        """Check if request can be approved."""
        return self.status == self.RequestStatus.PENDING
    
    @property
    def final_amount(self):
        """Get the final refund amount (approved or requested)."""
        return self.approved_amount or self.requested_amount


class WebhookEvent(models.Model):
    """
    Model to track Stripe webhook events.
    """
    
    class EventStatus(models.TextChoices):
        RECEIVED = 'received', _('Received')
        PROCESSING = 'processing', _('Processing')
        PROCESSED = 'processed', _('Processed')
        FAILED = 'failed', _('Failed')
        IGNORED = 'ignored', _('Ignored')
    
    # Event details
    stripe_event_id = models.CharField(
        _('Stripe event ID'),
        max_length=255,
        unique=True,
        db_index=True,
        help_text=_('Stripe event identifier')
    )
    event_type = models.CharField(
        _('event type'),
        max_length=100,
        help_text=_('Type of Stripe event')
    )
    api_version = models.CharField(
        _('API version'),
        max_length=20,
        help_text=_('Stripe API version')
    )
    
    # Processing status
    status = models.CharField(
        _('status'),
        max_length=20,
        choices=EventStatus.choices,
        default=EventStatus.RECEIVED,
        help_text=_('Event processing status')
    )
    
    # Event data
    data = models.JSONField(
        _('event data'),
        help_text=_('Complete event data from Stripe')
    )
    
    # Processing information
    processed_at = models.DateTimeField(
        _('processed at'),
        null=True,
        blank=True,
        help_text=_('When the event was processed')
    )
    error_message = models.TextField(
        _('error message'),
        blank=True,
        help_text=_('Error message if processing failed')
    )
    retry_count = models.PositiveIntegerField(
        _('retry count'),
        default=0,
        help_text=_('Number of processing attempts')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        db_table = 'webhook_events'
        verbose_name = _('Webhook Event')
        verbose_name_plural = _('Webhook Events')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['stripe_event_id']),
            models.Index(fields=['event_type', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]
    
    def __str__(self):
        return f"Webhook {self.event_type} - {self.stripe_event_id}"
    
    @property
    def is_processed(self):
        """Check if event was successfully processed."""
        return self.status == self.EventStatus.PROCESSED