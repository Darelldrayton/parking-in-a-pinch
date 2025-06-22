"""
Location API Views
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    CheckInLog, LocationHistory, GeofenceZone, 
    LocationPrivacySettings, EmergencyLocationShare
)
from .services import (
    LocationService, GeofenceService, EmergencyLocationService,
    LocationAnalyticsService
)
from .serializers import (
    CheckInSerializer, LocationHistorySerializer, GeofenceZoneSerializer,
    LocationPrivacySettingsSerializer, CheckInRequestSerializer,
    EmergencyAlertSerializer
)
from ..bookings.models import Booking

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkin_location(request):
    """Process user check-in at parking location"""
    try:
        serializer = CheckInRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking_id = serializer.validated_data['booking_id']
        latitude = serializer.validated_data['latitude']
        longitude = serializer.validated_data['longitude']
        accuracy = serializer.validated_data.get('accuracy')
        
        # Get booking
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        # Validate booking status
        if booking.status not in ['confirmed', 'pending']:
            return Response(
                {'error': 'Booking is not in a valid state for check-in'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if already checked in
        existing_checkin = CheckInLog.objects.filter(
            user=request.user,
            booking=booking,
            type='checkin',
            status='verified'
        ).exists()
        
        if existing_checkin:
            return Response(
                {'error': 'Already checked in for this booking'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process check-in
        result = LocationService.process_checkin(
            user=request.user,
            booking=booking,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            additional_data={
                'ip_address': request.META.get('REMOTE_ADDR'),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'timestamp': timezone.now().isoformat()
            }
        )
        
        return Response({
            'success': result['success'],
            'checkin_id': str(result['checkin_id']),
            'distance_from_spot': result['distance'],
            'message': result['message'],
            'booking_status': booking.status
        })
        
    except Exception as e:
        logger.error(f"Error processing check-in: {str(e)}")
        return Response(
            {'error': 'Failed to process check-in'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout_location(request):
    """Process user check-out from parking location"""
    try:
        serializer = CheckInRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking_id = serializer.validated_data['booking_id']
        latitude = serializer.validated_data['latitude']
        longitude = serializer.validated_data['longitude']
        accuracy = serializer.validated_data.get('accuracy')
        
        # Get booking
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        # Validate booking status
        if booking.status not in ['active', 'confirmed']:
            return Response(
                {'error': 'Booking is not in a valid state for check-out'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Process check-out
        result = LocationService.process_checkout(
            user=request.user,
            booking=booking,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy,
            additional_data={
                'ip_address': request.META.get('REMOTE_ADDR'),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                'timestamp': timezone.now().isoformat()
            }
        )
        
        return Response({
            'success': result['success'],
            'checkout_id': str(result['checkout_id']),
            'distance_from_spot': result['distance'],
            'message': result['message'],
            'booking_status': booking.status
        })
        
    except Exception as e:
        logger.error(f"Error processing check-out: {str(e)}")
        return Response(
            {'error': 'Failed to process check-out'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_checkin_status(request, booking_id):
    """Get check-in status for a booking"""
    try:
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        # Get check-in logs
        checkin = CheckInLog.objects.filter(
            user=request.user,
            booking=booking,
            type='checkin'
        ).order_by('-attempted_at').first()
        
        checkout = CheckInLog.objects.filter(
            user=request.user,
            booking=booking,
            type='checkout'
        ).order_by('-attempted_at').first()
        
        response_data = {
            'booking_id': booking.id,
            'booking_status': booking.status,
            'can_checkin': booking.status in ['confirmed', 'pending'] and not (checkin and checkin.status == 'verified'),
            'can_checkout': booking.status == 'active' and (checkin and checkin.status == 'verified'),
            'checkin': None,
            'checkout': None
        }
        
        if checkin:
            response_data['checkin'] = {
                'id': str(checkin.id),
                'status': checkin.status,
                'attempted_at': checkin.attempted_at,
                'verified_at': checkin.verified_at,
                'distance_from_spot': checkin.distance_from_spot,
                'accuracy': checkin.accuracy
            }
        
        if checkout:
            response_data['checkout'] = {
                'id': str(checkout.id),
                'status': checkout.status,
                'attempted_at': checkout.attempted_at,
                'verified_at': checkout.verified_at,
                'distance_from_spot': checkout.distance_from_spot,
                'accuracy': checkout.accuracy
            }
        
        return Response(response_data)
        
    except Exception as e:
        logger.error(f"Error getting check-in status: {str(e)}")
        return Response(
            {'error': 'Failed to get check-in status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def track_location(request):
    """Track user location for analytics"""
    try:
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        context = request.data.get('context', 'navigation')
        accuracy = request.data.get('accuracy')
        
        if not latitude or not longitude:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Track location
        from .utils import track_location_for_analytics
        
        location_entry = track_location_for_analytics(
            user=request.user,
            latitude=float(latitude),
            longitude=float(longitude),
            context=context,
            accuracy=accuracy
        )
        
        # Check geofence zones
        entered_zones = GeofenceService.check_geofence_entries(
            request.user, float(latitude), float(longitude)
        )
        
        return Response({
            'tracked': location_entry is not None,
            'geofence_zones_entered': len(entered_zones),
            'zones': [{'name': zone.name, 'type': zone.zone_type} for zone in entered_zones]
        })
        
    except Exception as e:
        logger.error(f"Error tracking location: {str(e)}")
        return Response(
            {'error': 'Failed to track location'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def emergency_alert(request):
    """Trigger emergency alert with location"""
    try:
        serializer = EmergencyAlertSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        latitude = serializer.validated_data['latitude']
        longitude = serializer.validated_data['longitude']
        message = serializer.validated_data.get('message', 'Emergency assistance needed')
        
        # Trigger emergency alert
        result = EmergencyLocationService.trigger_emergency_alert(
            user=request.user,
            latitude=latitude,
            longitude=longitude,
            message=message
        )
        
        return Response({
            'success': result['success'],
            'contacts_notified': result['contacts_notified'],
            'notifications_sent': result['notifications_sent'],
            'message': 'Emergency alert sent successfully'
        })
        
    except Exception as e:
        logger.error(f"Error triggering emergency alert: {str(e)}")
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def location_privacy_settings(request):
    """Get or update location privacy settings"""
    try:
        settings_obj, created = LocationPrivacySettings.objects.get_or_create(
            user=request.user
        )
        
        if request.method == 'GET':
            serializer = LocationPrivacySettingsSerializer(settings_obj)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            serializer = LocationPrivacySettingsSerializer(
                settings_obj,
                data=request.data,
                partial=True
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            else:
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
                
    except Exception as e:
        logger.error(f"Error managing location privacy settings: {str(e)}")
        return Response(
            {'error': 'Failed to manage privacy settings'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def location_history(request):
    """Get user's location history"""
    try:
        # Check privacy settings
        privacy_settings, _ = LocationPrivacySettings.objects.get_or_create(
            user=request.user
        )
        
        if not privacy_settings.share_location_for_analytics:
            return Response({
                'history': [],
                'message': 'Location history disabled in privacy settings'
            })
        
        # Get parameters
        context = request.GET.get('context')
        days = int(request.GET.get('days', 7))
        limit = int(request.GET.get('limit', 100))
        
        # Filter history
        history = LocationHistory.objects.filter(user=request.user)
        
        if context:
            history = history.filter(context=context)
        
        if days:
            from datetime import timedelta
            start_date = timezone.now() - timedelta(days=days)
            history = history.filter(created_at__gte=start_date)
        
        history = history[:limit]
        
        serializer = LocationHistorySerializer(history, many=True)
        
        return Response({
            'history': serializer.data,
            'total_count': history.count()
        })
        
    except Exception as e:
        logger.error(f"Error getting location history: {str(e)}")
        return Response(
            {'error': 'Failed to get location history'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def nearby_geofences(request):
    """Get geofence zones near user location"""
    try:
        latitude = float(request.GET.get('latitude'))
        longitude = float(request.GET.get('longitude'))
        radius = float(request.GET.get('radius', 1000))  # 1km default
        
        from .utils import get_geofence_zones_for_location
        
        zones = get_geofence_zones_for_location(latitude, longitude, radius)
        
        zone_data = []
        for zone_info in zones:
            zone = zone_info['zone']
            zone_data.append({
                'id': zone.id,
                'name': zone.name,
                'description': zone.description,
                'type': zone.zone_type,
                'distance': zone_info['distance'],
                'contains_point': zone_info['contains_point'],
                'center_latitude': float(zone.center_latitude),
                'center_longitude': float(zone.center_longitude),
                'radius': zone.radius
            })
        
        return Response({
            'zones': zone_data,
            'user_location': {
                'latitude': latitude,
                'longitude': longitude
            }
        })
        
    except (ValueError, TypeError) as e:
        return Response(
            {'error': 'Invalid latitude or longitude'},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error getting nearby geofences: {str(e)}")
        return Response(
            {'error': 'Failed to get nearby geofences'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def location_analytics(request):
    """Get user location analytics"""
    try:
        days = int(request.GET.get('days', 30))
        
        patterns = LocationAnalyticsService.get_user_location_patterns(
            request.user, days
        )
        
        return Response({
            'period_days': days,
            'patterns': patterns
        })
        
    except Exception as e:
        logger.error(f"Error getting location analytics: {str(e)}")
        return Response(
            {'error': 'Failed to get location analytics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_location(request):
    """Validate if user location is acceptable for check-in"""
    try:
        booking_id = request.data.get('booking_id')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if not all([booking_id, latitude, longitude]):
            return Response(
                {'error': 'booking_id, latitude, and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        from .utils import validate_checkin_location
        
        result = validate_checkin_location(
            float(latitude), float(longitude),
            float(booking.listing.latitude), float(booking.listing.longitude)
        )
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"Error validating location: {str(e)}")
        return Response(
            {'error': 'Failed to validate location'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )