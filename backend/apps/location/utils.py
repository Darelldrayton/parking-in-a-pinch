"""
Location utility functions
"""
import math
from typing import Tuple, Dict, Any
from decimal import Decimal


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth (specified in decimal degrees)
    Returns distance in meters
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in meters
    r = 6371000
    
    return c * r


def validate_coordinates(latitude: float, longitude: float) -> bool:
    """
    Validate GPS coordinates
    """
    try:
        lat = float(latitude)
        lon = float(longitude)
        
        # Check valid ranges
        if not (-90 <= lat <= 90):
            return False
        if not (-180 <= lon <= 180):
            return False
        
        return True
    except (ValueError, TypeError):
        return False


def get_accuracy_level(accuracy: float) -> str:
    """
    Determine GPS accuracy level based on accuracy in meters
    """
    if accuracy < 10:
        return 'high'
    elif accuracy < 50:
        return 'medium'
    else:
        return 'low'


def is_location_in_bounds(latitude: float, longitude: float, bounds: Dict[str, float]) -> bool:
    """
    Check if location is within specified bounds
    bounds = {'north': lat, 'south': lat, 'east': lon, 'west': lon}
    """
    try:
        lat = float(latitude)
        lon = float(longitude)
        
        return (bounds['south'] <= lat <= bounds['north'] and 
                bounds['west'] <= lon <= bounds['east'])
    except (ValueError, TypeError, KeyError):
        return False


def calculate_bounding_box(center_lat: float, center_lon: float, radius_meters: float) -> Dict[str, float]:
    """
    Calculate bounding box coordinates for a circle
    Returns dict with north, south, east, west coordinates
    """
    # Approximate meters per degree (varies by latitude)
    meters_per_lat_degree = 111319.9
    meters_per_lon_degree = 111319.9 * math.cos(math.radians(center_lat))
    
    lat_delta = radius_meters / meters_per_lat_degree
    lon_delta = radius_meters / meters_per_lon_degree
    
    return {
        'north': center_lat + lat_delta,
        'south': center_lat - lat_delta,
        'east': center_lon + lon_delta,
        'west': center_lon - lon_delta
    }


def reverse_geocode(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Convert coordinates to address (placeholder - would integrate with Google Maps API)
    """
    # This would typically call Google Maps Geocoding API
    # For now, return mock data
    return {
        'formatted_address': f"{latitude:.6f}, {longitude:.6f}",
        'address_components': {
            'street_number': '',
            'route': '',
            'locality': '',
            'administrative_area_level_1': '',
            'country': '',
            'postal_code': ''
        }
    }


def geocode_address(address: str) -> Tuple[float, float]:
    """
    Convert address to coordinates (placeholder - would integrate with Google Maps API)
    Returns (latitude, longitude)
    """
    # This would typically call Google Maps Geocoding API
    # For now, return mock coordinates for demo
    return (40.7128, -74.0060)  # NYC coordinates


def validate_checkin_location(user_lat: float, user_lon: float, spot_lat: float, spot_lon: float, 
                            max_distance: float = 50.0) -> Dict[str, Any]:
    """
    Validate if user location is close enough to parking spot for check-in
    """
    try:
        distance = calculate_distance(user_lat, user_lon, spot_lat, spot_lon)
        
        is_valid = distance <= max_distance
        
        result = {
            'is_valid': is_valid,
            'distance': round(distance, 2),
            'max_distance': max_distance,
            'message': ''
        }
        
        if is_valid:
            result['message'] = f"Location verified. You are {distance:.1f}m from the parking spot."
        else:
            result['message'] = f"Too far from parking spot. You are {distance:.1f}m away (max: {max_distance}m)."
        
        return result
        
    except Exception as e:
        return {
            'is_valid': False,
            'distance': None,
            'max_distance': max_distance,
            'message': f'Location validation error: {str(e)}'
        }


def get_geofence_zones_for_location(latitude: float, longitude: float, radius: float = 1000):
    """
    Get geofence zones that contain or are near the given location
    """
    from .models import GeofenceZone
    
    zones = []
    
    for zone in GeofenceZone.objects.filter(is_active=True):
        distance = calculate_distance(
            latitude, longitude,
            float(zone.center_latitude), float(zone.center_longitude)
        )
        
        # Include zones that either contain the point or are within search radius
        if distance <= zone.radius or distance <= radius:
            zones.append({
                'zone': zone,
                'distance': distance,
                'contains_point': distance <= zone.radius
            })
    
    return sorted(zones, key=lambda x: x['distance'])


def track_location_for_analytics(user, latitude: float, longitude: float, context: str, 
                                booking=None, accuracy: float = None):
    """
    Track user location for analytics (respecting privacy settings)
    """
    from .models import LocationHistory, LocationPrivacySettings
    
    try:
        # Get user privacy settings
        privacy_settings, _ = LocationPrivacySettings.objects.get_or_create(user=user)
        
        # Check if user allows location tracking for analytics
        if not privacy_settings.share_location_for_analytics and context not in ['checkin', 'checkout']:
            return None
        
        # Create location history entry
        location_entry = LocationHistory.objects.create(
            user=user,
            latitude=latitude,
            longitude=longitude,
            accuracy=accuracy or 0,
            context=context,
            booking=booking,
            retention_days=privacy_settings.location_history_retention_days
        )
        
        return location_entry
        
    except Exception as e:
        # Don't fail the main operation if analytics tracking fails
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to track location for analytics: {str(e)}")
        return None


def clean_old_location_data():
    """
    Clean up old location data based on retention settings
    """
    from django.utils import timezone
    from datetime import timedelta
    from .models import LocationHistory, LocationPrivacySettings
    
    deleted_count = 0
    
    # Clean location history based on user retention settings
    for privacy_setting in LocationPrivacySettings.objects.filter(auto_delete_enabled=True):
        cutoff_date = timezone.now() - timedelta(days=privacy_setting.location_history_retention_days)
        
        deleted = LocationHistory.objects.filter(
            user=privacy_setting.user,
            created_at__lt=cutoff_date
        ).delete()
        
        deleted_count += deleted[0] if deleted[0] else 0
    
    return deleted_count


def generate_location_sharing_link(emergency_share):
    """
    Generate a secure link for emergency contacts to view user location
    """
    import uuid
    from django.conf import settings
    
    # Generate a secure token
    token = str(uuid.uuid4())
    
    # In a real implementation, you'd store this token in cache/database
    # with expiration and associate it with the emergency share
    
    base_url = getattr(settings, 'FRONTEND_URL', 'https://yourapp.com')
    return f"{base_url}/emergency/location/{token}"


def calculate_eta(from_lat: float, from_lon: float, to_lat: float, to_lon: float) -> Dict[str, Any]:
    """
    Calculate estimated time of arrival (placeholder - would integrate with Google Maps Directions API)
    """
    # This would typically call Google Maps Directions API
    # For now, calculate based on straight-line distance and average speed
    
    distance_meters = calculate_distance(from_lat, from_lon, to_lat, to_lon)
    
    # Assume average city driving speed of 30 km/h
    average_speed_ms = 30 * 1000 / 3600  # 30 km/h in m/s
    
    eta_seconds = distance_meters / average_speed_ms
    eta_minutes = eta_seconds / 60
    
    return {
        'distance_meters': round(distance_meters),
        'distance_km': round(distance_meters / 1000, 2),
        'eta_seconds': round(eta_seconds),
        'eta_minutes': round(eta_minutes),
        'eta_text': f"{int(eta_minutes)} minutes"
    }


def format_coordinates_for_display(latitude: float, longitude: float) -> str:
    """
    Format coordinates for user-friendly display
    """
    def format_coord(coord: float, is_latitude: bool) -> str:
        direction = ''
        if is_latitude:
            direction = 'N' if coord >= 0 else 'S'
        else:
            direction = 'E' if coord >= 0 else 'W'
        
        return f"{abs(coord):.6f}°{direction}"
    
    lat_str = format_coord(latitude, True)
    lon_str = format_coord(longitude, False)
    
    return f"{lat_str}, {lon_str}"