"""
Serializers for parking listings.
"""
from rest_framework import serializers
from .models import ParkingListing, ListingImage, ListingAvailability
from .utils import PhotoPrivacyManager


class ListingImageSerializer(serializers.ModelSerializer):
    """
    Serializer for listing images.
    """
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ListingImage
        fields = ['id', 'image', 'image_url', 'alt_text', 'display_order', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class HostSerializer(serializers.Serializer):
    """
    Serializer for host information in listings.
    """
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()


class ParkingListingSerializer(serializers.ModelSerializer):
    """
    Serializer for parking listings.
    """
    host = HostSerializer(read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)
    amenities = serializers.SerializerMethodField()
    availability_schedule = serializers.SerializerMethodField()
    images_unlocked = serializers.SerializerMethodField()
    unlock_message = serializers.SerializerMethodField()
    
    class Meta:
        model = ParkingListing
        fields = [
            'id', 'title', 'description', 'address', 'latitude', 'longitude',
            'borough', 'space_type', 'hourly_rate', 'daily_rate', 'weekly_rate',
            'is_covered', 'has_ev_charging', 'has_security', 'is_instant_book',
            'has_lighting', 'has_cctv', 'has_gated_access', 'is_handicap_accessible',
            'has_valet_service', 'has_car_wash',
            'max_vehicle_size', 'instructions', 'is_active', 'host', 'images', 
            'rating_average', 'total_reviews', 'amenities', 'availability_schedule',
            'images_unlocked', 'unlock_message',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'host', 'rating_average', 'total_reviews', 'created_at', 'updated_at']
    
    def get_amenities(self, obj):
        """Return list of amenities for the listing."""
        return obj.get_amenities()
    
    def get_availability_schedule(self, obj):
        """Return availability schedule for the listing."""
        return obj.get_availability_schedule()
    
    def get_images_unlocked(self, obj):
        """Check if images are unlocked for current user."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return PhotoPrivacyManager.should_show_real_photos(obj, request.user)
    
    def get_unlock_message(self, obj):
        """Get unlock message for images."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 'Login to view photos after booking'
        if not PhotoPrivacyManager.should_show_real_photos(obj, request.user):
            return 'Photos will be visible after booking confirmation'
        return None
    
    def to_representation(self, instance):
        """Override to apply photo privacy filtering."""
        data = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        
        # Apply photo privacy filtering
        return PhotoPrivacyManager.filter_listing_images(instance, user, data)
    
    def create(self, validated_data):
        """Create a new parking listing."""
        validated_data['host'] = self.context['request'].user
        return super().create(validated_data)


class ParkingListingListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing lists (less data for performance).
    """
    host = HostSerializer(read_only=True)
    images = ListingImageSerializer(many=True, read_only=True)
    amenities = serializers.SerializerMethodField()
    images_unlocked = serializers.SerializerMethodField()
    
    class Meta:
        model = ParkingListing
        fields = [
            'id', 'title', 'address', 'borough', 'space_type',
            'hourly_rate', 'daily_rate', 'is_covered', 'has_ev_charging',
            'has_security', 'is_instant_book', 'has_lighting', 'has_cctv',
            'has_gated_access', 'is_handicap_accessible', 'has_valet_service',
            'has_car_wash', 'is_active', 'host', 'images', 
            'rating_average', 'total_reviews', 'amenities', 'images_unlocked'
        ]
    
    def get_amenities(self, obj):
        """Return list of amenities for the listing."""
        return obj.get_amenities()
    
    def get_images_unlocked(self, obj):
        """Check if images are unlocked for current user."""
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return PhotoPrivacyManager.should_show_real_photos(obj, request.user)
    
    def to_representation(self, instance):
        """Override to apply photo privacy filtering."""
        data = super().to_representation(instance)
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None
        
        # Apply photo privacy filtering
        return PhotoPrivacyManager.filter_listing_images(instance, user, data)


class ListingAvailabilitySerializer(serializers.ModelSerializer):
    """
    Serializer for listing availability.
    """
    class Meta:
        model = ListingAvailability
        fields = ['id', 'start_datetime', 'end_datetime', 'reason', 'created_at']
        read_only_fields = ['id', 'created_at']


class CreateListingSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new listings.
    """
    class Meta:
        model = ParkingListing
        fields = [
            'id', 'title', 'description', 'address', 'latitude', 'longitude',
            'borough', 'space_type', 'hourly_rate', 'daily_rate', 'weekly_rate',
            'is_covered', 'has_ev_charging', 'has_security', 'is_instant_book',
            'has_lighting', 'has_cctv', 'has_gated_access', 'is_handicap_accessible',
            'has_valet_service', 'has_car_wash', 'max_vehicle_size', 'instructions',
            'availability_schedule'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        """Create a new parking listing with the current user as host."""
        validated_data['host'] = self.context['request'].user
        return super().create(validated_data)


class UpdateListingSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing listings.
    """
    class Meta:
        model = ParkingListing
        fields = [
            'title', 'description', 'address', 'latitude', 'longitude',
            'borough', 'space_type', 'hourly_rate', 'daily_rate', 'weekly_rate',
            'is_covered', 'has_ev_charging', 'has_security', 'is_instant_book',
            'has_lighting', 'has_cctv', 'has_gated_access', 'is_handicap_accessible',
            'has_valet_service', 'has_car_wash', 'max_vehicle_size', 'instructions',
            'is_active'
        ]


class ParkingListingDetailSerializer(ParkingListingSerializer):
    """
    Detailed serializer for parking listings with admin fields.
    """
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    can_be_reviewed = serializers.BooleanField(read_only=True)
    is_publicly_visible = serializers.BooleanField(read_only=True)
    
    class Meta(ParkingListingSerializer.Meta):
        fields = ParkingListingSerializer.Meta.fields + [
            'approval_status', 'approval_status_display', 'reviewed_by', 'reviewed_by_name',
            'reviewed_at', 'admin_notes', 'rejection_reason', 'can_be_reviewed',
            'is_publicly_visible'
        ]


class AdminListingSerializer(serializers.ModelSerializer):
    """
    Admin serializer for listing management with approval fields.
    """
    host_name = serializers.CharField(source='host.get_full_name', read_only=True)
    host_email = serializers.CharField(source='host.email', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    can_be_reviewed = serializers.BooleanField(read_only=True)
    is_publicly_visible = serializers.BooleanField(read_only=True)
    images_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ParkingListing
        fields = [
            'id', 'title', 'description', 'address', 'borough', 'space_type',
            'hourly_rate', 'daily_rate', 'weekly_rate', 'is_active',
            'host', 'host_name', 'host_email', 'images_count',
            'approval_status', 'approval_status_display', 'reviewed_by', 'reviewed_by_name',
            'reviewed_at', 'admin_notes', 'rejection_reason', 'can_be_reviewed',
            'is_publicly_visible', 'rating_average', 'total_reviews',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'host', 'reviewed_by', 'reviewed_at', 'rating_average', 
            'total_reviews', 'created_at', 'updated_at'
        ]
    
    def get_images_count(self, obj):
        """Get count of images for this listing."""
        return obj.images.count()