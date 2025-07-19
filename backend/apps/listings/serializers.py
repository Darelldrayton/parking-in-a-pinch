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
            'max_vehicle_size', 'instructions', 'is_active', 'approval_status', 'host', 'images', 
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
        # Handle case where authentication is disabled
        if self.context['request'].user.is_authenticated:
            validated_data['host'] = self.context['request'].user
        else:
            # Use default user when authentication is disabled
            from apps.users.models import User
            validated_data['host'] = User.objects.first()
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
    # Allow both parking_type and space_type to support frontend compatibility
    parking_type = serializers.CharField(write_only=True, required=False)
    vehicle_types = serializers.ListField(write_only=True, required=False)
    
    # Make normally required fields optional with defaults
    borough = serializers.CharField(required=False)
    space_type = serializers.CharField(required=False)
    hourly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    daily_rate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    weekly_rate = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    
    class Meta:
        model = ParkingListing
        fields = [
            'id', 'title', 'description', 'address', 'latitude', 'longitude',
            'borough', 'space_type', 'parking_type', 'vehicle_types', 
            'hourly_rate', 'daily_rate', 'weekly_rate',
            'is_covered', 'has_ev_charging', 'has_security', 'is_instant_book',
            'has_lighting', 'has_cctv', 'has_gated_access', 'is_handicap_accessible',
            'has_valet_service', 'has_car_wash', 'max_vehicle_size', 'instructions',
            'availability_schedule'
        ]
        read_only_fields = ['id']
    
    def validate(self, attrs):
        """Custom validation to handle field mapping and defaults."""
        # Handle field mapping and defaults - remove fields that don't exist in model
        parking_type = attrs.pop('parking_type', None)
        vehicle_types = attrs.pop('vehicle_types', None)
        
        # Map parking_type to space_type if provided
        if parking_type and 'space_type' not in attrs:
            attrs['space_type'] = parking_type
        
        # Set default values for required fields if not provided
        if 'borough' not in attrs:
            attrs['borough'] = 'Manhattan'  # Default borough
        if 'space_type' not in attrs:
            attrs['space_type'] = 'driveway'  # Default space type
        if 'hourly_rate' not in attrs:
            attrs['hourly_rate'] = 10.00  # Default hourly rate
        if 'daily_rate' not in attrs:
            attrs['daily_rate'] = 50.00  # Default daily rate
        if 'weekly_rate' not in attrs:
            attrs['weekly_rate'] = 300.00  # Default weekly rate
        
        return attrs
    
    def create(self, validated_data):
        """Create a new parking listing with the current user as host."""
        try:
            # Handle case where authentication is disabled
            if self.context['request'].user.is_authenticated:
                validated_data['host'] = self.context['request'].user
            else:
                # Use default user when authentication is disabled
                from apps.users.models import User
                default_user = User.objects.first()
                if not default_user:
                    raise serializers.ValidationError("No users exist in the system. Cannot create listing.")
                validated_data['host'] = default_user
            
            return super().create(validated_data)
        except Exception as e:
            import traceback
            print(f"ERROR in serializer create: {str(e)}")
            print(f"TRACEBACK: {traceback.format_exc()}")
            print(f"validated_data keys: {list(validated_data.keys())}")
            raise


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