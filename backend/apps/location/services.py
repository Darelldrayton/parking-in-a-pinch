"""
Location Services
"""
import logging
from django.utils import timezone
from django.db import transaction
from .models import (
    CheckInLog, LocationHistory, GeofenceZone, 
    LocationPrivacySettings, EmergencyLocationShare,
    CheckInStatus, LocationAccuracy
)
from .utils import (
    calculate_distance, validate_coordinates, get_accuracy_level,
    validate_checkin_location, track_location_for_analytics
)

logger = logging.getLogger(__name__)


class LocationService:
    """Main location service"""
    
    @staticmethod
    def process_checkin(user, booking, latitude, longitude, accuracy=None, 
                       verification_method='gps', additional_data=None):
        """
        Process user check-in at parking location
        """
        try:
            with transaction.atomic():
                # Validate coordinates
                if not validate_coordinates(latitude, longitude):
                    raise ValueError("Invalid GPS coordinates")
                
                # Get parking spot coordinates
                parking_spot = booking.listing
                if not parking_spot.latitude or not parking_spot.longitude:
                    raise ValueError("Parking spot location not configured")
                
                # Create check-in log
                checkin = CheckInLog.objects.create(
                    user=user,
                    booking=booking,
                    type='checkin',
                    latitude=latitude,
                    longitude=longitude,
                    accuracy=accuracy or 0,
                    accuracy_level=get_accuracy_level(accuracy or 0),
                    verification_method=verification_method,
                    device_info=additional_data or {}
                )
                
                # Calculate distance from parking spot
                checkin.calculate_distance_from_spot()
                checkin.save()
                
                # Validate location
                validation_result = LocationService._validate_checkin_location(checkin)
                
                if validation_result['is_valid']:
                    checkin.verify_checkin()
                    
                    # Update booking status
                    booking.status = 'active'
                    booking.actual_start_time = timezone.now()
                    booking.save()
                    
                    # Track location for analytics
                    track_location_for_analytics(
                        user, latitude, longitude, 'checkin', 
                        booking, accuracy
                    )
                    
                    # Send notifications
                    LocationService._send_checkin_notifications(checkin)
                    
                    # Update emergency location sharing
                    LocationService._update_emergency_location_shares(user, latitude, longitude)
                    
                else:
                    checkin.fail_checkin(validation_result['message'])
                
                return {
                    'success': validation_result['is_valid'],
                    'checkin_id': checkin.id,
                    'distance': checkin.distance_from_spot,
                    'message': validation_result['message'],
                    'checkin': checkin
                }
                
        except Exception as e:
            logger.error(f"Error processing check-in: {str(e)}")
            raise e
    
    @staticmethod
    def process_checkout(user, booking, latitude, longitude, accuracy=None,
                        verification_method='gps', additional_data=None):
        """
        Process user check-out from parking location
        """
        try:
            with transaction.atomic():
                # Validate coordinates
                if not validate_coordinates(latitude, longitude):
                    raise ValueError("Invalid GPS coordinates")
                
                # Check if user has checked in
                checkin_exists = CheckInLog.objects.filter(
                    user=user,
                    booking=booking,
                    type='checkin',
                    status=CheckInStatus.VERIFIED
                ).exists()
                
                if not checkin_exists:
                    raise ValueError("No valid check-in found for this booking")
                
                # Create check-out log
                checkout = CheckInLog.objects.create(
                    user=user,
                    booking=booking,
                    type='checkout',
                    latitude=latitude,
                    longitude=longitude,
                    accuracy=accuracy or 0,
                    accuracy_level=get_accuracy_level(accuracy or 0),
                    verification_method=verification_method,
                    device_info=additional_data or {}
                )
                
                # Calculate distance from parking spot
                checkout.calculate_distance_from_spot()
                checkout.save()
                
                # For checkout, we're more lenient with distance validation
                validation_result = LocationService._validate_checkout_location(checkout)
                
                if validation_result['is_valid']:
                    checkout.verify_checkin()
                    
                    # Update booking status
                    booking.status = 'completed'
                    booking.actual_end_time = timezone.now()
                    booking.save()
                    
                    # Track location for analytics
                    track_location_for_analytics(
                        user, latitude, longitude, 'checkout', 
                        booking, accuracy
                    )
                    
                    # Send notifications
                    LocationService._send_checkout_notifications(checkout)
                    
                    # Process any final billing/payments
                    LocationService._process_checkout_billing(booking)
                    
                else:
                    checkout.fail_checkin(validation_result['message'])
                
                return {
                    'success': validation_result['is_valid'],
                    'checkout_id': checkout.id,
                    'distance': checkout.distance_from_spot,
                    'message': validation_result['message'],
                    'checkout': checkout
                }
                
        except Exception as e:
            logger.error(f"Error processing check-out: {str(e)}")
            raise e
    
    @staticmethod
    def _validate_checkin_location(checkin):
        """Validate check-in location"""
        # Get user's privacy settings for accuracy requirements
        privacy_settings, _ = LocationPrivacySettings.objects.get_or_create(
            user=checkin.user
        )
        
        max_distance = privacy_settings.required_accuracy_meters
        
        # Allow low accuracy check-in if enabled
        if (checkin.accuracy_level == LocationAccuracy.LOW and 
            not privacy_settings.allow_low_accuracy_checkin):
            return {
                'is_valid': False,
                'message': 'GPS accuracy too low for check-in. Please try again with better signal.'
            }
        
        return validate_checkin_location(
            float(checkin.latitude), float(checkin.longitude),
            float(checkin.booking.listing.latitude), float(checkin.booking.listing.longitude),
            max_distance
        )
    
    @staticmethod
    def _validate_checkout_location(checkout):
        """Validate check-out location (more lenient than check-in)"""
        # For checkout, allow up to 200m distance (user might have walked away)
        max_distance = 200
        
        return validate_checkin_location(
            float(checkout.latitude), float(checkout.longitude),
            float(checkout.booking.listing.latitude), float(checkout.booking.listing.longitude),
            max_distance
        )
    
    @staticmethod
    def _send_checkin_notifications(checkin):
        """Send check-in notifications"""
        from apps.notifications.services import NotificationService, SMSService
        
        # Notify user
        NotificationService.send_notification(
            user=checkin.user,
            template_name='checkin_success',
            variables={
                'space_title': checkin.booking.listing.title,
                'checkin_time': checkin.verified_at.strftime('%H:%M'),
            },
            channel='push'
        )
        
        # Notify host
        NotificationService.send_notification(
            user=checkin.booking.listing.host,
            template_name='guest_checked_in',
            variables={
                'guest_name': checkin.user.get_full_name(),
                'space_title': checkin.booking.listing.title,
                'checkin_time': checkin.verified_at.strftime('%H:%M'),
            },
            channel='email'
        )
    
    @staticmethod
    def _send_checkout_notifications(checkout):
        """Send check-out notifications"""
        from apps.notifications.services import NotificationService
        
        # Calculate parking duration
        checkin = CheckInLog.objects.filter(
            booking=checkout.booking,
            type='checkin',
            status=CheckInStatus.VERIFIED
        ).first()
        
        duration = None
        if checkin:
            duration = checkout.verified_at - checkin.verified_at
            duration_hours = duration.total_seconds() / 3600
        
        # Notify user
        NotificationService.send_notification(
            user=checkout.user,
            template_name='checkout_success',
            variables={
                'space_title': checkout.booking.listing.title,
                'checkout_time': checkout.verified_at.strftime('%H:%M'),
                'duration': f"{duration_hours:.1f} hours" if duration else "N/A",
            },
            channel='push'
        )
        
        # Notify host
        NotificationService.send_notification(
            user=checkout.booking.listing.host,
            template_name='guest_checked_out',
            variables={
                'guest_name': checkout.user.get_full_name(),
                'space_title': checkout.booking.listing.title,
                'checkout_time': checkout.verified_at.strftime('%H:%M'),
            },
            channel='email'
        )
    
    @staticmethod
    def _process_checkout_billing(booking):
        """Process any additional billing at checkout"""
        # This could handle things like:
        # - Overtime charges
        # - Damage fees
        # - Additional services
        pass
    
    @staticmethod
    def _update_emergency_location_shares(user, latitude, longitude):
        """Update location for emergency contacts"""
        active_shares = EmergencyLocationShare.objects.filter(
            user=user,
            is_active=True,
            share_type__in=['temporary', 'continuous']
        )
        
        for share in active_shares:
            if not share.is_expired():
                share.update_location(latitude, longitude)


class GeofenceService:
    """Geofence monitoring service"""
    
    @staticmethod
    def check_geofence_entries(user, latitude, longitude):
        """Check if user has entered any geofence zones"""
        from .utils import get_geofence_zones_for_location
        
        zones = get_geofence_zones_for_location(latitude, longitude)
        
        entered_zones = []
        for zone_data in zones:
            if zone_data['contains_point']:
                zone = zone_data['zone']
                
                # Check if this is a new entry
                recent_entry = LocationHistory.objects.filter(
                    user=user,
                    context='geofence_entry',
                    created_at__gte=timezone.now() - timezone.timedelta(minutes=5)
                ).exists()
                
                if not recent_entry:
                    # Log geofence entry
                    LocationHistory.objects.create(
                        user=user,
                        latitude=latitude,
                        longitude=longitude,
                        context='geofence_entry',
                        device_info={'geofence_zone_id': zone.id}
                    )
                    
                    entered_zones.append(zone)
                    
                    # Send notification if enabled
                    if zone.notification_enabled:
                        GeofenceService._send_geofence_notification(user, zone, 'entered')
        
        return entered_zones
    
    @staticmethod
    def _send_geofence_notification(user, zone, action):
        """Send geofence notification"""
        from apps.notifications.services import NotificationService
        
        message = f"You have {action} {zone.name}"
        
        if zone.zone_type == 'parking_area':
            message += ". Parking spots may be available nearby."
        elif zone.zone_type == 'restricted':
            message += ". This is a restricted parking area."
        elif zone.zone_type == 'high_demand':
            message += ". This is a high-demand parking area."
        
        NotificationService.send_notification(
            user=user,
            template_name='geofence_notification',
            variables={
                'zone_name': zone.name,
                'action': action,
                'message': message
            },
            channel='push'
        )


class EmergencyLocationService:
    """Emergency location sharing service"""
    
    @staticmethod
    def trigger_emergency_alert(user, latitude, longitude, message="Emergency assistance needed"):
        """Trigger emergency alert with location"""
        try:
            from apps.users.models import EmergencyContact
            from apps.notifications.services import SMSService, EmailService
            
            # Get user's emergency contacts
            emergency_contacts = EmergencyContact.objects.filter(
                user=user,
                is_active=True
            )
            
            if not emergency_contacts.exists():
                raise ValueError("No emergency contacts configured")
            
            # Create location share entries
            shares = []
            for contact in emergency_contacts:
                share, created = EmergencyLocationShare.objects.get_or_create(
                    user=user,
                    emergency_contact=contact,
                    defaults={
                        'share_type': 'emergency',
                        'expires_at': timezone.now() + timezone.timedelta(hours=24)
                    }
                )
                share.update_location(latitude, longitude)
                shares.append(share)
            
            # Send emergency alerts
            notifications = []
            for contact in emergency_contacts:
                # Send SMS
                if contact.phone_number:
                    sms_notification = SMSService.send_emergency_alert(
                        [contact],
                        user,
                        f"{latitude:.6f}, {longitude:.6f}",
                        message
                    )
                    notifications.extend(sms_notification)
                
                # Send Email
                if contact.email:
                    email_notification = EmailService.send_emergency_alert(
                        contact.email,
                        {
                            'user_name': user.get_full_name(),
                            'contact_name': contact.name,
                            'location': f"{latitude:.6f}, {longitude:.6f}",
                            'message': message,
                            'timestamp': timezone.now().strftime('%Y-%m-%d %H:%M:%S'),
                            'location_link': f"https://maps.google.com/?q={latitude},{longitude}"
                        }
                    )
                    if email_notification:
                        notifications.append(email_notification)
            
            # Log emergency event
            LocationHistory.objects.create(
                user=user,
                latitude=latitude,
                longitude=longitude,
                context='emergency',
                device_info={
                    'message': message,
                    'contacts_notified': len(emergency_contacts)
                }
            )
            
            return {
                'success': True,
                'contacts_notified': len(emergency_contacts),
                'notifications_sent': len(notifications),
                'shares_created': len(shares)
            }
            
        except Exception as e:
            logger.error(f"Error triggering emergency alert: {str(e)}")
            raise e
    
    @staticmethod
    def get_shared_location(share_token):
        """Get shared location for emergency contact"""
        # In a real implementation, you'd validate the token and return location
        # This is a placeholder
        pass


class LocationAnalyticsService:
    """Location analytics and insights"""
    
    @staticmethod
    def get_user_location_patterns(user, days=30):
        """Analyze user location patterns"""
        from datetime import timedelta
        from django.db.models import Count
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Get user's location history
        locations = LocationHistory.objects.filter(
            user=user,
            created_at__gte=start_date,
            context__in=['checkin', 'checkout', 'search']
        )
        
        # Analyze patterns
        patterns = {
            'total_locations': locations.count(),
            'checkin_locations': locations.filter(context='checkin').count(),
            'checkout_locations': locations.filter(context='checkout').count(),
            'search_locations': locations.filter(context='search').count(),
            'most_visited_areas': [],
            'average_accuracy': 0
        }
        
        if locations.exists():
            patterns['average_accuracy'] = locations.aggregate(
                avg_accuracy=models.Avg('accuracy')
            )['avg_accuracy']
        
        return patterns
    
    @staticmethod
    def get_area_utilization_stats(bounds, days=30):
        """Get utilization statistics for a geographic area"""
        from datetime import timedelta
        from django.db.models import Count
        from .utils import is_location_in_bounds
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Get all check-ins in the area
        checkins = CheckInLog.objects.filter(
            type='checkin',
            status=CheckInStatus.VERIFIED,
            attempted_at__gte=start_date
        )
        
        # Filter by bounds
        area_checkins = []
        for checkin in checkins:
            if is_location_in_bounds(
                float(checkin.latitude), 
                float(checkin.longitude), 
                bounds
            ):
                area_checkins.append(checkin)
        
        stats = {
            'total_checkins': len(area_checkins),
            'unique_users': len(set(c.user_id for c in area_checkins)),
            'peak_hours': [],
            'busiest_days': []
        }
        
        return stats