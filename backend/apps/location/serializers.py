"""
Location Serializers
"""
from rest_framework import serializers
from .models import (
    CheckInLog, LocationHistory, GeofenceZone,
    LocationPrivacySettings, EmergencyLocationShare
)


class CheckInSerializer(serializers.ModelSerializer):
    """Serializer for CheckInLog model"""
    
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    listing_title = serializers.CharField(source='booking.listing.title', read_only=True)
    distance_display = serializers.SerializerMethodField()
    accuracy_display = serializers.SerializerMethodField()
    
    class Meta:
        model = CheckInLog
        fields = [
            'id', 'booking_id', 'listing_title', 'type', 'latitude', 'longitude',
            'accuracy', 'accuracy_level', 'distance_from_spot', 'distance_display',
            'accuracy_display', 'status', 'verification_method', 'attempted_at',
            'verified_at', 'failure_reason'
        ]
        read_only_fields = ['id', 'attempted_at', 'verified_at']
    
    def get_distance_display(self, obj):
        """Get human-readable distance"""
        if obj.distance_from_spot is None:
            return "Unknown"
        
        if obj.distance_from_spot < 1000:
            return f"{obj.distance_from_spot:.1f}m"
        else:
            return f"{obj.distance_from_spot / 1000:.2f}km"
    
    def get_accuracy_display(self, obj):
        """Get human-readable accuracy"""
        if obj.accuracy is None:
            return "Unknown"
        
        return f"±{obj.accuracy:.1f}m"


class LocationHistorySerializer(serializers.ModelSerializer):
    """Serializer for LocationHistory model"""
    
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    time_ago = serializers.SerializerMethodField()
    
    class Meta:
        model = LocationHistory
        fields = [
            'id', 'latitude', 'longitude', 'accuracy', 'context',
            'booking_id', 'created_at', 'time_ago'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_time_ago(self, obj):
        """Get human-readable time since creation"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            minutes = int(diff.total_seconds() / 60)
            return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
        elif diff < timedelta(days=1):
            hours = int(diff.total_seconds() / 3600)
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
        else:
            days = diff.days
            return f"{days} day{'s' if days != 1 else ''} ago"


class GeofenceZoneSerializer(serializers.ModelSerializer):
    """Serializer for GeofenceZone model"""
    
    listings_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GeofenceZone
        fields = [
            'id', 'name', 'description', 'center_latitude', 'center_longitude',
            'radius', 'zone_type', 'is_active', 'auto_checkin_enabled',
            'notification_enabled', 'listings_count', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_listings_count(self, obj):
        """Get number of associated listings"""
        return obj.listings.count()


class LocationPrivacySettingsSerializer(serializers.ModelSerializer):
    """Serializer for LocationPrivacySettings model"""
    
    class Meta:
        model = LocationPrivacySettings
        fields = [
            'share_location_during_booking', 'share_location_for_analytics',
            'allow_geofence_notifications', 'location_history_retention_days',
            'auto_delete_enabled', 'required_accuracy_meters',
            'allow_low_accuracy_checkin', 'share_location_emergency',
            'emergency_contacts_can_track'
        ]
    
    def validate_location_history_retention_days(self, value):
        """Validate retention days"""
        if value < 1 or value > 365:
            raise serializers.ValidationError("Retention days must be between 1 and 365")
        return value
    
    def validate_required_accuracy_meters(self, value):
        """Validate required accuracy"""
        if value < 1 or value > 1000:
            raise serializers.ValidationError("Required accuracy must be between 1 and 1000 meters")
        return value


class EmergencyLocationShareSerializer(serializers.ModelSerializer):
    """Serializer for EmergencyLocationShare model"""
    
    contact_name = serializers.CharField(source='emergency_contact.name', read_only=True)
    contact_phone = serializers.CharField(source='emergency_contact.phone_number', read_only=True)
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = EmergencyLocationShare
        fields = [
            'id', 'contact_name', 'contact_phone', 'is_active', 'share_type',
            'expires_at', 'last_shared_at', 'last_latitude', 'last_longitude',
            'is_expired', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'last_shared_at']
    
    def get_is_expired(self, obj):
        """Check if share has expired"""
        return obj.is_expired()


class CheckInRequestSerializer(serializers.Serializer):
    """Serializer for check-in/checkout requests"""
    
    booking_id = serializers.IntegerField()
    latitude = serializers.DecimalField(max_digits=10, decimal_places=8)
    longitude = serializers.DecimalField(max_digits=11, decimal_places=8)
    accuracy = serializers.FloatField(required=False, min_value=0)
    verification_method = serializers.ChoiceField(
        choices=['gps', 'qr_code', 'manual', 'photo'],
        default='gps'
    )
    
    def validate_latitude(self, value):
        """Validate latitude range"""
        if not (-90 <= float(value) <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_longitude(self, value):
        """Validate longitude range"""
        if not (-180 <= float(value) <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value


class EmergencyAlertSerializer(serializers.Serializer):
    """Serializer for emergency alert requests"""
    
    latitude = serializers.DecimalField(max_digits=10, decimal_places=8)
    longitude = serializers.DecimalField(max_digits=11, decimal_places=8)
    message = serializers.CharField(max_length=500, default="Emergency assistance needed")
    
    def validate_latitude(self, value):
        """Validate latitude range"""
        if not (-90 <= float(value) <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_longitude(self, value):
        """Validate longitude range"""
        if not (-180 <= float(value) <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value


class LocationValidationSerializer(serializers.Serializer):
    """Serializer for location validation responses"""
    
    is_valid = serializers.BooleanField()
    distance = serializers.FloatField()
    max_distance = serializers.FloatField()
    message = serializers.CharField()


class GeofenceEntrySerializer(serializers.Serializer):
    """Serializer for geofence entry notifications"""
    
    zone_name = serializers.CharField()
    zone_type = serializers.CharField()
    distance = serializers.FloatField()
    contains_point = serializers.BooleanField()


class LocationAnalyticsSerializer(serializers.Serializer):
    """Serializer for location analytics"""
    
    total_locations = serializers.IntegerField()
    checkin_locations = serializers.IntegerField()
    checkout_locations = serializers.IntegerField()
    search_locations = serializers.IntegerField()
    average_accuracy = serializers.FloatField()
    most_visited_areas = serializers.ListField()


class TrackLocationSerializer(serializers.Serializer):
    """Serializer for location tracking requests"""
    
    latitude = serializers.DecimalField(max_digits=10, decimal_places=8)
    longitude = serializers.DecimalField(max_digits=11, decimal_places=8)
    accuracy = serializers.FloatField(required=False, min_value=0)
    context = serializers.ChoiceField(
        choices=['search', 'checkin', 'checkout', 'navigation', 'background'],
        default='navigation'
    )
    
    def validate_latitude(self, value):
        """Validate latitude range"""
        if not (-90 <= float(value) <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90")
        return value
    
    def validate_longitude(self, value):
        """Validate longitude range"""
        if not (-180 <= float(value) <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180")
        return value