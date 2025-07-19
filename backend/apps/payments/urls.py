"""
URL patterns for payments app.
"""
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentMethodViewSet,
    PaymentIntentViewSet,
    PaymentViewSet,
    RefundViewSet,
    PayoutViewSet,
    StripeWebhookView,
    PaymentConfigView,
)
from .admin_views import RefundRequestViewSet, PayoutRequestViewSet
from .webhook_handlers import webhook_view
from . import api_views
from .admin_dashboard import refund_dashboard

app_name = 'payments'

@csrf_exempt
def admin_refund_stats(request):
    """Refund stats endpoint that frontend expects"""
    try:
        from .models import RefundRequest
        from decimal import Decimal
        
        stats = {
            'pending_requests': RefundRequest.objects.filter(status=RefundRequest.RequestStatus.PENDING).count(),
            'total_requests': RefundRequest.objects.count(),
            'approved_requests': RefundRequest.objects.filter(status=RefundRequest.RequestStatus.APPROVED).count(),
            'rejected_requests': RefundRequest.objects.filter(status=RefundRequest.RequestStatus.REJECTED).count(),
            'total_requested_amount': float(sum(
                refund.requested_amount for refund in RefundRequest.objects.filter(status=RefundRequest.RequestStatus.PENDING)
                if refund.requested_amount
            ) or Decimal('0.00')),
        }
        
        return JsonResponse(stats)
        
    except Exception as e:
        return JsonResponse({'error': f'Refund stats error: {str(e)}'}, status=500)


@csrf_exempt
def admin_payout_stats(request):
    """Payout stats endpoint that frontend expects"""
    try:
        from .models import PayoutRequest
        from decimal import Decimal
        
        stats = {
            'pending_requests': PayoutRequest.objects.filter(status=PayoutRequest.RequestStatus.PENDING).count(),
            'total_requests': PayoutRequest.objects.count(),
            'approved_requests': PayoutRequest.objects.filter(status=PayoutRequest.RequestStatus.APPROVED).count(),
            'rejected_requests': PayoutRequest.objects.filter(status=PayoutRequest.RequestStatus.REJECTED).count(),
            'completed_requests': PayoutRequest.objects.filter(status=PayoutRequest.RequestStatus.COMPLETED).count(),
            'total_requested_amount': float(sum(
                payout.requested_amount for payout in PayoutRequest.objects.all()
                if payout.requested_amount
            ) or Decimal('0.00')),
            'total_pending_amount': float(sum(
                payout.requested_amount for payout in PayoutRequest.objects.filter(status=PayoutRequest.RequestStatus.PENDING)
                if payout.requested_amount
            ) or Decimal('0.00')),
        }
        
        return JsonResponse(stats)
        
    except Exception as e:
        return JsonResponse({'error': f'Payout stats error: {str(e)}'}, status=500)

# Router for ViewSets
router = DefaultRouter()
router.register(r'payment-methods', PaymentMethodViewSet, basename='payment-methods')
router.register(r'payment-intents', PaymentIntentViewSet, basename='payment-intents')
router.register(r'payments', PaymentViewSet, basename='payments')
router.register(r'refunds', RefundViewSet, basename='refunds')
router.register(r'payouts', PayoutViewSet, basename='payouts')
router.register(r'admin/refund-requests', RefundRequestViewSet, basename='admin-refund-requests')
router.register(r'admin/payout-requests', PayoutRequestViewSet, basename='admin-payout-requests')

urlpatterns = [
    # Stats endpoints that frontend expects as fallback
    path('admin/refund-requests/stats/', admin_refund_stats, name='admin-refund-stats'),
    path('admin/payout-requests/stats/', admin_payout_stats, name='admin-payout-stats'),
    # Include router URLs
    path('', include(router.urls)),
    
    # Enhanced Stripe webhook endpoint
    path('webhooks/stripe/', webhook_view, name='stripe-webhook-enhanced'),
    path('webhooks/stripe-legacy/', StripeWebhookView.as_view(), name='stripe-webhook'),
    
    # Enhanced payment processing endpoints
    path('v2/create-payment-intent/', api_views.create_payment_intent, name='create-payment-intent-v2'),
    path('v2/confirm-mock-payment/', api_views.confirm_mock_payment, name='confirm-mock-payment'),
    path('v2/confirm-real-payment/', api_views.confirm_real_payment, name='confirm-real-payment'),
    path('v2/create-subscription/', api_views.create_subscription, name='create-subscription'),
    path('v2/process-refund/', api_views.process_refund, name='process-refund'),
    path('v2/refund-estimate/<int:booking_id>/', api_views.get_refund_estimate, name='refund-estimate'),
    
    # Payment history and earnings
    path('v2/payment-history/', api_views.get_payment_history, name='payment-history'),
    path('v2/host-payouts/', api_views.get_host_payouts, name='host-payouts'),
    path('v2/earnings-summary/', api_views.get_earnings_summary, name='earnings-summary'),
    path('v2/request-instant-payout/', api_views.request_instant_payout, name='request-instant-payout'),
    
    # Mobile payment endpoints
    path('mobile/validate/', api_views.validate_mobile_payment, name='mobile-payment-validate'),
    path('mobile/session/', api_views.create_mobile_payment_session, name='mobile-payment-session'),
    
    # Payment configuration
    path('config/', PaymentConfigView.as_view(), name='payment-config'),
    
    # Admin dashboard
    path('admin/dashboard/', refund_dashboard, name='refund-dashboard'),
]