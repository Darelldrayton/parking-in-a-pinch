"""
URL patterns for payments app.
"""
from django.urls import path, include
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
from .admin_views import RefundRequestViewSet
from .webhook_handlers import webhook_view
from . import api_views
from .admin_dashboard import refund_dashboard

app_name = 'payments'

# Router for ViewSets
router = DefaultRouter()
router.register(r'payment-methods', PaymentMethodViewSet, basename='payment-methods')
router.register(r'payment-intents', PaymentIntentViewSet, basename='payment-intents')
router.register(r'payments', PaymentViewSet, basename='payments')
router.register(r'refunds', RefundViewSet, basename='refunds')
router.register(r'payouts', PayoutViewSet, basename='payouts')
router.register(r'admin/refund-requests', RefundRequestViewSet, basename='admin-refund-requests')

urlpatterns = [
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
    
    # Payment configuration
    path('config/', PaymentConfigView.as_view(), name='payment-config'),
    
    # Admin dashboard
    path('admin/dashboard/', refund_dashboard, name='refund-dashboard'),
]