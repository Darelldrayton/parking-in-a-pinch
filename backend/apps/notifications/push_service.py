"""
Push Notification Service
"""
import json
import logging
from typing import Dict, List, Optional
from pywebpush import webpush, WebPushException
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from .models import NotificationPreference, PushSubscription

logger = logging.getLogger(__name__)


class PushNotificationService:
    """Service for sending push notifications via Web Push API"""
    
    @staticmethod
    def send_notification(user, title: str, body: str, data: Dict = None, 
                         icon: str = None, badge: str = None, tag: str = None,
                         require_interaction: bool = False, silent: bool = False) -> Dict:
        """
        Send push notification to user's devices
        """
        try:
            # Check user preferences
            prefs = NotificationPreference.objects.filter(user=user).first()
            if prefs and not prefs.push_notifications:
                return {
                    'success': False,
                    'message': 'User has disabled push notifications',
                    'sent_count': 0
                }
            
            # Get user's push subscriptions
            subscriptions = PushSubscription.objects.filter(
                user=user,
                is_active=True
            )
            
            if not subscriptions.exists():
                return {
                    'success': False,
                    'message': 'No active push subscriptions found for user',
                    'sent_count': 0
                }
            
            # Prepare notification payload
            notification_data = {
                'title': title,
                'body': body,
                'icon': icon or '/static/images/notification-icon.png',
                'badge': badge or '/static/images/notification-badge.png',
                'tag': tag,
                'requireInteraction': require_interaction,
                'silent': silent,
                'data': data or {}
            }
            
            # Add action buttons if specified
            if data and 'actions' in data:
                notification_data['actions'] = data['actions']
            
            # Send to each subscription
            sent_count = 0
            failed_subscriptions = []
            
            for subscription in subscriptions:
                try:
                    result = PushNotificationService._send_to_subscription(
                        subscription,
                        notification_data
                    )
                    
                    if result['success']:
                        sent_count += 1
                        # Update last sent timestamp
                        subscription.last_used_at = timezone.now()
                        subscription.save()
                    else:
                        failed_subscriptions.append({
                            'subscription_id': subscription.id,
                            'error': result['error']
                        })
                        
                        # Deactivate subscription if it's invalid
                        if result.get('invalid_subscription'):
                            subscription.is_active = False
                            subscription.save()
                            
                except Exception as e:
                    logger.error(f"Error sending to subscription {subscription.id}: {str(e)}")
                    failed_subscriptions.append({
                        'subscription_id': subscription.id,
                        'error': str(e)
                    })
            
            return {
                'success': sent_count > 0,
                'message': f'Sent to {sent_count} devices',
                'sent_count': sent_count,
                'failed_count': len(failed_subscriptions),
                'failed_subscriptions': failed_subscriptions
            }
            
        except Exception as e:
            logger.error(f"Error sending push notification: {str(e)}")
            return {
                'success': False,
                'message': f'Failed to send push notification: {str(e)}',
                'sent_count': 0
            }
    
    @staticmethod
    def _send_to_subscription(subscription: PushSubscription, notification_data: Dict) -> Dict:
        """Send notification to a specific subscription"""
        try:
            # Get VAPID keys from settings
            vapid_private_key = getattr(settings, 'VAPID_PRIVATE_KEY', None)
            vapid_public_key = getattr(settings, 'VAPID_PUBLIC_KEY', None)
            vapid_claims = getattr(settings, 'VAPID_CLAIMS', {})
            
            if not vapid_private_key or not vapid_public_key:
                return {
                    'success': False,
                    'error': 'VAPID keys not configured'
                }
            
            # Prepare subscription info
            subscription_info = {
                'endpoint': subscription.endpoint,
                'keys': {
                    'p256dh': subscription.p256dh_key,
                    'auth': subscription.auth_key
                }
            }
            
            # Send push notification
            response = webpush(
                subscription_info=subscription_info,
                data=json.dumps(notification_data),
                vapid_private_key=vapid_private_key,
                vapid_claims=vapid_claims
            )
            
            return {
                'success': True,
                'status_code': response.status_code,
                'response': response.text
            }
            
        except WebPushException as e:
            error_msg = str(e)
            
            # Check if subscription is invalid
            invalid_subscription = (
                e.response and e.response.status_code in [400, 404, 410, 413]
            )
            
            return {
                'success': False,
                'error': error_msg,
                'invalid_subscription': invalid_subscription,
                'status_code': e.response.status_code if e.response else None
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def send_bulk_notification(users: List, title: str, body: str, 
                              data: Dict = None, **kwargs) -> Dict:
        """
        Send push notification to multiple users
        """
        try:
            total_sent = 0
            total_failed = 0
            results = []
            
            for user in users:
                result = PushNotificationService.send_notification(
                    user=user,
                    title=title,
                    body=body,
                    data=data,
                    **kwargs
                )
                
                total_sent += result['sent_count']
                total_failed += result.get('failed_count', 0)
                
                results.append({
                    'user_id': user.id,
                    'result': result
                })
            
            return {
                'success': total_sent > 0,
                'total_users': len(users),
                'total_sent': total_sent,
                'total_failed': total_failed,
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Error sending bulk push notifications: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'total_sent': 0
            }
    
    @staticmethod
    def send_booking_notification(booking, notification_type: str) -> Dict:
        """Send booking-related push notifications"""
        notification_configs = {
            'booking_confirmed': {
                'title': 'Booking Confirmed!',
                'body': f'Your parking spot at {booking.listing.title} is confirmed.',
                'icon': '/static/images/booking-confirmed.png',
                'tag': f'booking-{booking.id}',
                'data': {
                    'type': 'booking_confirmed',
                    'booking_id': str(booking.id),
                    'listing_id': str(booking.listing.id),
                    'actions': [
                        {
                            'action': 'view_booking',
                            'title': 'View Booking',
                            'icon': '/static/images/view-icon.png'
                        },
                        {
                            'action': 'get_directions',
                            'title': 'Get Directions',
                            'icon': '/static/images/directions-icon.png'
                        }
                    ]
                }
            },
            'booking_reminder': {
                'title': 'Parking Reminder',
                'body': f'Your parking at {booking.listing.title} starts soon.',
                'icon': '/static/images/reminder.png',
                'tag': f'reminder-{booking.id}',
                'require_interaction': True,
                'data': {
                    'type': 'booking_reminder',
                    'booking_id': str(booking.id),
                    'actions': [
                        {
                            'action': 'start_navigation',
                            'title': 'Navigate Now',
                            'icon': '/static/images/navigation-icon.png'
                        }
                    ]
                }
            },
            'checkin_available': {
                'title': 'Check-in Available',
                'body': f'You can now check in to {booking.listing.title}.',
                'icon': '/static/images/checkin.png',
                'tag': f'checkin-{booking.id}',
                'data': {
                    'type': 'checkin_available',
                    'booking_id': str(booking.id),
                    'actions': [
                        {
                            'action': 'checkin',
                            'title': 'Check In',
                            'icon': '/static/images/checkin-icon.png'
                        }
                    ]
                }
            },
            'checkout_reminder': {
                'title': 'Check-out Reminder',
                'body': f'Your parking at {booking.listing.title} ends in 15 minutes.',
                'icon': '/static/images/checkout.png',
                'tag': f'checkout-{booking.id}',
                'require_interaction': True,
                'data': {
                    'type': 'checkout_reminder',
                    'booking_id': str(booking.id),
                    'actions': [
                        {
                            'action': 'extend_booking',
                            'title': 'Extend',
                            'icon': '/static/images/extend-icon.png'
                        },
                        {
                            'action': 'checkout',
                            'title': 'Check Out',
                            'icon': '/static/images/checkout-icon.png'
                        }
                    ]
                }
            }
        }
        
        config = notification_configs.get(notification_type)
        if not config:
            return {
                'success': False,
                'error': f'Unknown notification type: {notification_type}'
            }
        
        return PushNotificationService.send_notification(
            user=booking.user,
            **config
        )
    
    @staticmethod
    def send_payment_notification(user, payment_status: str, amount: float, currency: str = 'USD') -> Dict:
        """Send payment-related push notifications"""
        notification_configs = {
            'payment_successful': {
                'title': 'Payment Successful',
                'body': f'Your payment of {currency} {amount:.2f} was processed successfully.',
                'icon': '/static/images/payment-success.png',
                'tag': 'payment-success',
                'data': {
                    'type': 'payment_successful',
                    'amount': amount,
                    'currency': currency
                }
            },
            'payment_failed': {
                'title': 'Payment Failed',
                'body': f'Your payment of {currency} {amount:.2f} could not be processed.',
                'icon': '/static/images/payment-failed.png',
                'tag': 'payment-failed',
                'require_interaction': True,
                'data': {
                    'type': 'payment_failed',
                    'amount': amount,
                    'currency': currency,
                    'actions': [
                        {
                            'action': 'retry_payment',
                            'title': 'Retry Payment',
                            'icon': '/static/images/retry-icon.png'
                        }
                    ]
                }
            }
        }
        
        config = notification_configs.get(payment_status)
        if not config:
            return {
                'success': False,
                'error': f'Unknown payment status: {payment_status}'
            }
        
        return PushNotificationService.send_notification(
            user=user,
            **config
        )
    
    @staticmethod
    def cleanup_invalid_subscriptions():
        """Remove invalid/expired push subscriptions"""
        try:
            # Deactivate subscriptions that haven't been used in 30 days
            from django.utils import timezone
            from datetime import timedelta
            
            cutoff_date = timezone.now() - timedelta(days=30)
            
            inactive_count = PushSubscription.objects.filter(
                last_used_at__lt=cutoff_date,
                is_active=True
            ).update(is_active=False)
            
            # Delete subscriptions that have been inactive for 90 days
            delete_cutoff = timezone.now() - timedelta(days=90)
            deleted_count = PushSubscription.objects.filter(
                last_used_at__lt=delete_cutoff,
                is_active=False
            ).delete()[0]
            
            return {
                'success': True,
                'deactivated_count': inactive_count,
                'deleted_count': deleted_count
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up push subscriptions: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


class PushSubscriptionManager:
    """Manager for push subscriptions"""
    
    @staticmethod
    def subscribe(user, endpoint: str, p256dh_key: str, auth_key: str, 
                 user_agent: str = '', device_info: Dict = None) -> Dict:
        """Subscribe user to push notifications"""
        try:
            # Check if subscription already exists
            existing = PushSubscription.objects.filter(
                user=user,
                endpoint=endpoint
            ).first()
            
            if existing:
                # Update existing subscription
                existing.p256dh_key = p256dh_key
                existing.auth_key = auth_key
                existing.user_agent = user_agent
                existing.device_info = device_info or {}
                existing.is_active = True
                existing.save()
                
                return {
                    'success': True,
                    'subscription_id': existing.id,
                    'message': 'Subscription updated'
                }
            else:
                # Create new subscription
                subscription = PushSubscription.objects.create(
                    user=user,
                    endpoint=endpoint,
                    p256dh_key=p256dh_key,
                    auth_key=auth_key,
                    user_agent=user_agent,
                    device_info=device_info or {}
                )
                
                return {
                    'success': True,
                    'subscription_id': subscription.id,
                    'message': 'Subscription created'
                }
                
        except Exception as e:
            logger.error(f"Error creating push subscription: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def unsubscribe(user, endpoint: str = None, subscription_id: str = None) -> Dict:
        """Unsubscribe from push notifications"""
        try:
            if subscription_id:
                subscription = PushSubscription.objects.filter(
                    user=user,
                    id=subscription_id
                ).first()
            elif endpoint:
                subscription = PushSubscription.objects.filter(
                    user=user,
                    endpoint=endpoint
                ).first()
            else:
                return {
                    'success': False,
                    'error': 'Either subscription_id or endpoint is required'
                }
            
            if not subscription:
                return {
                    'success': False,
                    'error': 'Subscription not found'
                }
            
            subscription.is_active = False
            subscription.save()
            
            return {
                'success': True,
                'message': 'Successfully unsubscribed'
            }
            
        except Exception as e:
            logger.error(f"Error unsubscribing: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def get_user_subscriptions(user) -> List[Dict]:
        """Get user's active push subscriptions"""
        try:
            subscriptions = PushSubscription.objects.filter(
                user=user,
                is_active=True
            ).values(
                'id', 'endpoint', 'created_at', 'last_used_at', 'device_info'
            )
            
            return list(subscriptions)
            
        except Exception as e:
            logger.error(f"Error getting user subscriptions: {str(e)}")
            return []