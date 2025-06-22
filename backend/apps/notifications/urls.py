"""
URL patterns for notifications app.
"""
from django.urls import path
from . import api_views

app_name = 'notifications'

urlpatterns = [
    # Notification management
    path('', api_views.get_notifications, name='get-notifications'),
    path('<int:notification_id>/read/', api_views.mark_notification_read, name='mark-notification-read'),
    path('mark-all-read/', api_views.mark_all_read, name='mark-all-read'),
    path('stats/', api_views.notification_stats, name='notification-stats'),
    
    # Preferences
    path('preferences/', api_views.notification_preferences, name='notification-preferences'),
    
    # Phone verification
    path('verify-phone/', api_views.verify_phone_number, name='verify-phone'),
    path('confirm-phone/', api_views.confirm_phone_verification, name='confirm-phone'),
    
    # Push notifications
    path('push/subscribe/', api_views.subscribe_push, name='subscribe-push'),
    path('push/unsubscribe/', api_views.unsubscribe_push, name='unsubscribe-push'),
    path('push/subscriptions/', api_views.get_push_subscriptions, name='get-push-subscriptions'),
    path('push/send/', api_views.send_push_notification, name='send-push-notification'),
    path('push/vapid-key/', api_views.get_vapid_public_key, name='get-vapid-public-key'),
    
    # Testing
    path('test/', api_views.send_test_notification, name='send-test-notification'),
]