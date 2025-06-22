"""
Admin configuration for payments app with enhanced refund management.
"""
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from django.db.models import Sum, Count
from django import forms
from datetime import timedelta
import stripe

from .models import (
    PaymentMethod, PaymentIntent, Payment, Refund, 
    RefundRequest, Payout, WebhookEvent
)
from .services import PaymentService

# Configure Stripe
from django.conf import settings
stripe.api_key = settings.STRIPE_SECRET_KEY


class RefundInline(admin.TabularInline):
    """Inline admin for refunds on payment detail page."""
    model = Refund
    extra = 0
    readonly_fields = ['refund_id', 'stripe_refund_id', 'amount', 'status', 
                      'created_at', 'processed_at']
    can_delete = False


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['user', 'payment_type', 'card_info', 'is_default', 
                   'is_active', 'created_at']
    list_filter = ['payment_type', 'is_default', 'is_active', 'created_at']
    search_fields = ['user__email', 'user__username', 'stripe_payment_method_id']
    readonly_fields = ['stripe_payment_method_id', 'created_at', 'updated_at']
    
    def card_info(self, obj):
        if obj.payment_type == 'card':
            return f"{obj.card_brand} •••• {obj.card_last4}"
        elif obj.payment_type == 'bank_account':
            return f"{obj.bank_name} •••• {obj.account_last4}"
        return obj.get_payment_type_display()
    card_info.short_description = 'Payment Info'


@admin.register(PaymentIntent)
class PaymentIntentAdmin(admin.ModelAdmin):
    list_display = ['booking_link', 'user', 'amount_display', 'status', 
                   'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['user__email', 'booking__booking_id', 'stripe_payment_intent_id']
    readonly_fields = ['stripe_payment_intent_id', 'client_secret', 'created_at', 
                      'updated_at']
    
    def booking_link(self, obj):
        if obj.booking:
            url = reverse('admin:bookings_booking_change', args=[obj.booking.id])
            return format_html('<a href="{}">{}</a>', url, obj.booking.booking_id)
        return '-'
    booking_link.short_description = 'Booking'
    
    def amount_display(self, obj):
        return f"${obj.amount}"
    amount_display.short_description = 'Amount'


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['payment_id', 'booking_link', 'user', 'amount_display', 
                   'status', 'refund_status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['payment_id', 'user__email', 'booking__booking_id', 
                    'stripe_charge_id']
    readonly_fields = ['payment_id', 'stripe_charge_id', 'platform_fee', 
                      'host_payout_amount', 'created_at', 
                      'updated_at']
    inlines = [RefundInline]
    
    def booking_link(self, obj):
        if obj.booking:
            url = reverse('admin:bookings_booking_change', args=[obj.booking.id])
            return format_html('<a href="{}">{}</a>', url, obj.booking.booking_id)
        return '-'
    booking_link.short_description = 'Booking'
    
    def amount_display(self, obj):
        return f"${obj.amount}"
    amount_display.short_description = 'Amount'
    
    def refund_status(self, obj):
        total_refunded = obj.refunds.filter(status='succeeded').aggregate(
            total=Sum('amount'))['total'] or 0
        
        if total_refunded >= obj.amount:
            return format_html('<span style="color: red;">Fully Refunded</span>')
        elif total_refunded > 0:
            return format_html('<span style="color: orange;">Partially Refunded (${:.2f})</span>', 
                             total_refunded)
        return format_html('<span style="color: green;">No Refunds</span>')
    refund_status.short_description = 'Refund Status'


@admin.register(Refund)
class RefundAdmin(admin.ModelAdmin):
    list_display = ['refund_id', 'payment_link', 'user', 'amount_display', 
                   'status_badge', 'reason', 'created_at']
    list_filter = ['status', 'reason', 'created_at']
    search_fields = ['refund_id', 'user__email', 'payment__payment_id', 
                    'stripe_refund_id']
    readonly_fields = ['refund_id', 'stripe_refund_id', 'payment', 'user', 
                      'amount', 'status', 'created_at', 'processed_at', 
                      'updated_at']
    
    def payment_link(self, obj):
        url = reverse('admin:payments_payment_change', args=[obj.payment.id])
        return format_html('<a href="{}">{}</a>', url, obj.payment.payment_id)
    payment_link.short_description = 'Payment'
    
    def amount_display(self, obj):
        return f"${obj.amount}"
    amount_display.short_description = 'Amount'
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'succeeded': 'green',
            'failed': 'red',
            'canceled': 'gray'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


class RefundRequestAdminForm(forms.ModelForm):
    """Custom form for RefundRequest admin with approval actions."""
    approved_amount = forms.DecimalField(
        required=False,
        decimal_places=2,
        max_digits=10,
        help_text="Leave blank to use requested amount"
    )
    rejection_reason = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 3}),
        help_text="Required when rejecting"
    )
    
    class Meta:
        model = RefundRequest
        fields = '__all__'


@admin.register(RefundRequest)
class RefundRequestAdmin(admin.ModelAdmin):
    """
    Enhanced admin for RefundRequest with inline approval/rejection actions.
    """
    form = RefundRequestAdminForm
    
    list_display = ['request_id', 'booking_link', 'requested_by', 'amount_display', 
                   'status_badge', 'reason', 'created_at', 'action_buttons']
    list_filter = ['status', 'reason', 'created_at', 'reviewed_at']
    search_fields = ['request_id', 'booking__booking_id', 'requested_by__email', 
                    'payment__payment_id']
    readonly_fields = ['request_id', 'booking_info', 'payment_info', 'requested_by', 
                      'created_at', 'reviewed_at', 'processed_at', 'refund_link']
    
    fieldsets = (
        ('Request Information', {
            'fields': ('request_id', 'status', 'booking_info', 'payment_info', 
                      'requested_by', 'reason')
        }),
        ('Amounts', {
            'fields': ('requested_amount', 'approved_amount')
        }),
        ('Notes', {
            'fields': ('customer_notes', 'admin_notes', 'rejection_reason')
        }),
        ('Review Information', {
            'fields': ('reviewed_by', 'reviewed_at', 'processed_at', 'refund_link'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('booking', 'payment', 'requested_by', 
                               'reviewed_by', 'refund')
    
    def booking_link(self, obj):
        if obj.booking:
            url = reverse('admin:bookings_booking_change', args=[obj.booking.id])
            return format_html('<a href="{}">{}</a>', url, obj.booking.booking_id)
        return '-'
    booking_link.short_description = 'Booking'
    
    def booking_info(self, obj):
        if obj.booking:
            return format_html(
                '<strong>Booking ID:</strong> {}<br>'
                '<strong>Space:</strong> {}<br>'
                '<strong>Date:</strong> {}<br>'
                '<strong>Status:</strong> {}',
                obj.booking.booking_id,
                obj.booking.parking_space.title,
                obj.booking.start_time.strftime('%Y-%m-%d %H:%M'),
                obj.booking.status
            )
        return '-'
    booking_info.short_description = 'Booking Details'
    
    def payment_info(self, obj):
        if obj.payment:
            return format_html(
                '<strong>Payment ID:</strong> {}<br>'
                '<strong>Amount Paid:</strong> ${}<br>'
                '<strong>Payment Date:</strong> {}',
                obj.payment.payment_id,
                obj.payment.amount,
                obj.payment.created_at.strftime('%Y-%m-%d %H:%M')
            )
        return '-'
    payment_info.short_description = 'Payment Details'
    
    def amount_display(self, obj):
        if obj.approved_amount and obj.status in ['approved', 'processed']:
            return format_html(
                '<span style="text-decoration: line-through;">${:.2f}</span> '
                '<span style="color: green; font-weight: bold;">${:.2f}</span>',
                obj.requested_amount, obj.approved_amount
            )
        return f"${obj.requested_amount}"
    amount_display.short_description = 'Amount'
    
    def status_badge(self, obj):
        colors = {
            'pending': 'orange',
            'approved': 'blue',
            'rejected': 'red',
            'processed': 'green'
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def refund_link(self, obj):
        if obj.refund:
            url = reverse('admin:payments_refund_change', args=[obj.refund.id])
            return format_html('<a href="{}">View Refund #{}</a>', 
                             url, obj.refund.refund_id)
        return '-'
    refund_link.short_description = 'Processed Refund'
    
    def action_buttons(self, obj):
        if obj.status == 'pending':
            return format_html(
                '<a class="button" href="{}?action=approve" style="background-color: #28a745; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px;">Approve</a> '
                '<a class="button" href="{}?action=reject" style="background-color: #dc3545; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px; margin-left: 5px;">Reject</a>',
                reverse('admin:payments_refundrequest_change', args=[obj.id]),
                reverse('admin:payments_refundrequest_change', args=[obj.id])
            )
        return '-'
    action_buttons.short_description = 'Quick Actions'
    action_buttons.allow_tags = True
    
    def save_model(self, request, obj, form, change):
        """Handle approval/rejection when saving."""
        if change and obj.status == 'pending':
            action = request.GET.get('action')
            
            if action == 'approve':
                # Approve the refund request
                obj.status = 'approved'
                obj.reviewed_by = request.user
                obj.reviewed_at = timezone.now()
                
                # Use approved amount or requested amount
                approved_amount = form.cleaned_data.get('approved_amount') or obj.requested_amount
                obj.approved_amount = approved_amount
                
                # Process the refund through Stripe
                try:
                    refund_record = PaymentService.process_refund(
                        booking_id=obj.booking.id,
                        refund_reason=obj.reason,
                        refund_amount=float(approved_amount)
                    )
                    
                    obj.refund = refund_record
                    obj.status = 'processed'
                    obj.processed_at = timezone.now()
                    
                    self.message_user(request, 
                        f"Refund request approved and processed successfully. "
                        f"Refund ID: {refund_record.refund_id}", 
                        level='SUCCESS')
                except Exception as e:
                    obj.status = 'approved'  # Keep as approved but not processed
                    self.message_user(request, 
                        f"Refund approved but processing failed: {str(e)}", 
                        level='ERROR')
                    
            elif action == 'reject':
                # Reject the refund request
                if not form.cleaned_data.get('rejection_reason'):
                    self.message_user(request, 
                        "Please provide a rejection reason", 
                        level='ERROR')
                    return
                
                obj.status = 'rejected'
                obj.reviewed_by = request.user
                obj.reviewed_at = timezone.now()
                obj.rejection_reason = form.cleaned_data.get('rejection_reason')
                
                self.message_user(request, 
                    "Refund request rejected", 
                    level='WARNING')
        
        super().save_model(request, obj, form, change)
    
    def get_readonly_fields(self, request, obj=None):
        """Make most fields readonly after initial creation."""
        readonly = list(self.readonly_fields)
        
        if obj and obj.status != 'pending':
            # If already processed, make everything readonly except admin notes
            readonly.extend(['status', 'approved_amount', 'rejection_reason'])
        
        return readonly
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deletion of refund requests."""
        return False
    
    def changelist_view(self, request, extra_context=None):
        """Add statistics to the changelist view."""
        extra_context = extra_context or {}
        
        # Calculate statistics
        now = timezone.now()
        today = now.date()
        thirty_days_ago = now - timedelta(days=30)
        
        queryset = self.get_queryset(request)
        
        stats = {
            'pending_count': queryset.filter(status='pending').count(),
            'approved_count': queryset.filter(
                status__in=['approved', 'processed'],
                reviewed_at__date=today
            ).count(),
            'rejected_count': queryset.filter(
                status='rejected',
                reviewed_at__date=today
            ).count(),
            'total_amount': Refund.objects.filter(
                status='succeeded',
                created_at__gte=thirty_days_ago
            ).aggregate(total=Sum('amount'))['total'] or 0,
        }
        
        extra_context.update(stats)
        return super().changelist_view(request, extra_context=extra_context)
    
    actions = ['bulk_approve_refunds', 'bulk_reject_refunds']
    
    def bulk_approve_refunds(self, request, queryset):
        """Bulk approve pending refund requests."""
        pending = queryset.filter(status='pending')
        approved_count = 0
        
        for refund_request in pending:
            try:
                refund_request.status = 'approved'
                refund_request.reviewed_by = request.user
                refund_request.reviewed_at = timezone.now()
                refund_request.approved_amount = refund_request.requested_amount
                
                # Process the refund
                refund_record = PaymentService.process_refund(
                    booking_id=refund_request.booking.id,
                    refund_reason=refund_request.reason,
                    refund_amount=float(refund_request.requested_amount)
                )
                
                refund_request.refund = refund_record
                refund_request.status = 'processed'
                refund_request.processed_at = timezone.now()
                refund_request.save()
                
                approved_count += 1
            except Exception as e:
                self.message_user(request, 
                    f"Failed to process refund for {refund_request.request_id}: {str(e)}", 
                    level='ERROR')
        
        self.message_user(request, 
            f"Successfully approved and processed {approved_count} refunds", 
            level='SUCCESS')
    bulk_approve_refunds.short_description = "Approve selected refund requests"
    
    def bulk_reject_refunds(self, request, queryset):
        """Bulk reject pending refund requests."""
        pending = queryset.filter(status='pending')
        rejected_count = pending.update(
            status='rejected',
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
            rejection_reason='Bulk rejection by admin'
        )
        
        self.message_user(request, 
            f"Rejected {rejected_count} refund requests", 
            level='WARNING')
    bulk_reject_refunds.short_description = "Reject selected refund requests"


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ['payout_id', 'host', 'amount_display', 'status', 
                   'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['payout_id', 'host__email', 'stripe_payout_id']
    readonly_fields = ['payout_id', 'stripe_payout_id', 
                      'created_at', 'updated_at']
    
    def amount_display(self, obj):
        return f"${obj.amount}"
    amount_display.short_description = 'Amount'


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ['stripe_event_id', 'event_type', 'status', 'created_at']
    list_filter = ['event_type', 'status', 'created_at']
    search_fields = ['stripe_event_id', 'event_type']
    readonly_fields = ['stripe_event_id', 'event_type', 'data', 'created_at', 
                      'processed_at']
    
    def has_add_permission(self, request):
        return False  # Webhook events are created automatically
    
    def has_delete_permission(self, request, obj=None):
        return False  # Preserve webhook history