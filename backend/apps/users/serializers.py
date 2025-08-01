"""
Serializers for the users app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, VerificationRequest

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    
    class Meta:
        model = UserProfile
        exclude = ('user', 'created_at', 'updated_at')


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with profile information."""
    
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    display_name = serializers.CharField(source='get_display_name', read_only=True)
    can_host = serializers.BooleanField(read_only=True)
    can_book = serializers.BooleanField(read_only=True)
    is_verified = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'display_name', 'phone_number', 'user_type',
            'profile_picture', 'bio', 'date_of_birth',
            'is_email_verified', 'is_phone_verified', 'is_identity_verified',
            'default_address',
            'preferred_notification_method',
            'average_rating_as_host', 'total_reviews_as_host',
            'average_rating_as_guest', 'total_reviews_as_guest',
            'can_host', 'can_book', 'is_verified',
            'created_at', 'profile', 'subscribe_to_newsletter'
        )
        read_only_fields = (
            'id', 'is_email_verified', 'is_phone_verified', 
            'is_identity_verified', 'is_verified', 'verified_at', 'verified_by',
            'stripe_customer_id', 'stripe_account_id',
            'average_rating_as_host', 'total_reviews_as_host',
            'average_rating_as_guest', 'total_reviews_as_guest',
            'created_at'
        )
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone_number', 'user_type', 
            'subscribe_to_newsletter'
        )
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        """Create a new user with encrypted password."""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        
        # Create associated profile
        UserProfile.objects.create(user=user)
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user information."""
    
    # Vehicle information fields (flattened from profile)
    primary_vehicle_make = serializers.CharField(required=False, allow_blank=True)
    primary_vehicle_model = serializers.CharField(required=False, allow_blank=True)
    primary_vehicle_year = serializers.IntegerField(required=False, allow_null=True)
    primary_vehicle_color = serializers.CharField(required=False, allow_blank=True)
    primary_vehicle_license_plate = serializers.CharField(required=False, allow_blank=True)
    primary_vehicle_state = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = (
            'first_name', 'last_name', 'phone_number', 'user_type',
            'profile_picture', 'bio', 'date_of_birth',
            'default_address', 'preferred_notification_method',
            'primary_vehicle_make', 'primary_vehicle_model', 'primary_vehicle_year',
            'primary_vehicle_color', 'primary_vehicle_license_plate', 'primary_vehicle_state'
        )
    
    def update(self, instance, validated_data):
        """Update user and profile information."""
        # Extract profile fields
        profile_fields = [
            'primary_vehicle_make', 'primary_vehicle_model', 'primary_vehicle_year',
            'primary_vehicle_color', 'primary_vehicle_license_plate', 'primary_vehicle_state'
        ]
        
        profile_data = {}
        for field in profile_fields:
            if field in validated_data:
                profile_data[field] = validated_data.pop(field)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update profile fields
        if profile_data:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return instance


class UserListSerializer(serializers.ModelSerializer):
    """Minimal serializer for user lists."""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    display_name = serializers.CharField(source='get_display_name', read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'display_name', 'full_name', 'profile_picture',
            'user_type', 'average_rating_as_host', 'total_reviews_as_host',
            'average_rating_as_guest', 'total_reviews_as_guest',
            'is_verified', 'created_at'
        )


class UserPublicSerializer(serializers.ModelSerializer):
    """Public serializer for user information (visible to other users)."""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    display_name = serializers.CharField(source='get_display_name', read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'display_name', 'full_name', 'profile_picture', 'bio',
            'user_type', 'average_rating_as_host', 'total_reviews_as_host',
            'average_rating_as_guest', 'total_reviews_as_guest',
            'is_verified', 'created_at'
        )


class FrontendUserSerializer(serializers.ModelSerializer):
    """Serializer compatible with frontend expectations."""
    
    # Map backend fields to frontend field names
    user_type = serializers.CharField()
    is_verified = serializers.BooleanField(read_only=True)  # Use the admin-controlled verification field
    profile_image = serializers.ImageField(source='profile_picture', required=False)
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name',
            'user_type', 'is_verified', 'phone_number', 'profile_image', 'profile', 'bio'
        )
        read_only_fields = ('id', 'is_verified')
    
    def validate_user_type(self, value):
        """Convert frontend user type to backend format."""
        type_mapping = {
            'renter': 'SEEKER',
            'host': 'HOST',
            'both': 'BOTH'
        }
        return type_mapping.get(value, 'SEEKER')
    
    def to_representation(self, instance):
        """Ensure output format matches frontend expectations."""
        data = super().to_representation(instance)
        # Convert any backend user type to frontend format
        if 'user_type' in data:
            type_mapping = {
                'SEEKER': 'renter',
                'HOST': 'host',
                'BOTH': 'both'
            }
            data['user_type'] = type_mapping.get(data['user_type'], 'renter')
        return data
    
    def to_internal_value(self, data):
        """Convert frontend format to backend format."""
        if 'user_type' in data:
            type_mapping = {
                'renter': 'SEEKER',
                'host': 'HOST',
                'both': 'BOTH'
            }
            data['user_type'] = type_mapping.get(data['user_type'], 'SEEKER')
        return super().to_internal_value(data)


class VerificationRequestSerializer(serializers.ModelSerializer):
    """Serializer for verification requests."""
    
    user_display_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    
    class Meta:
        model = VerificationRequest
        fields = (
            'id', 'user', 'user_display_name', 'user_email',
            'verification_type', 'status',
            'id_document_front', 'id_document_back', 'selfie_with_id',
            'document_type', 'document_number', 'document_expiry_date',
            'verification_data',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'admin_notes', 'rejection_reason',
            'created_at', 'updated_at'
        )
        read_only_fields = (
            'id', 'user', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at'
        )


class CreateVerificationRequestSerializer(serializers.ModelSerializer):
    """Serializer for creating verification requests."""
    
    class Meta:
        model = VerificationRequest
        fields = (
            'verification_type',
            'id_document_front', 'id_document_back', 'selfie_with_id',
            'document_type', 'document_number', 'document_expiry_date',
            'verification_data'
        )
    
    def validate_id_document_front(self, value):
        """Validate front ID document."""
        if value:
            # Validate file size (max 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("Image file too large. Maximum size is 10MB")
            
            # Validate file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if hasattr(value, 'content_type') and value.content_type not in allowed_types:
                raise serializers.ValidationError("Invalid file format. Allowed formats: JPEG, PNG, WebP")
        return value
    
    def validate_id_document_back(self, value):
        """Validate back ID document."""
        if value:
            # Validate file size (max 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("Image file too large. Maximum size is 10MB")
            
            # Validate file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if hasattr(value, 'content_type') and value.content_type not in allowed_types:
                raise serializers.ValidationError("Invalid file format. Allowed formats: JPEG, PNG, WebP")
        return value
    
    def validate_selfie_with_id(self, value):
        """Validate selfie with ID."""
        if value:
            # Validate file size (max 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("Image file too large. Maximum size is 10MB")
            
            # Validate file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
            if hasattr(value, 'content_type') and value.content_type not in allowed_types:
                raise serializers.ValidationError("Invalid file format. Allowed formats: JPEG, PNG, WebP")
        return value
    
    def create(self, validated_data):
        """Create verification request for the current user."""
        user = self.context['request'].user
        return VerificationRequest.objects.create(user=user, **validated_data)


class AdminVerificationActionSerializer(serializers.Serializer):
    """Serializer for admin verification actions."""
    
    ACTION_CHOICES = [
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('request_revision', 'Request Revision'),
    ]
    
    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    reason = serializers.CharField(max_length=200, required=False, allow_blank=True)
    
    def validate(self, attrs):
        """Validate that reason is provided for reject/revision actions."""
        action = attrs.get('action')
        reason = attrs.get('reason', '')
        
        if action in ['reject', 'request_revision'] and not reason:
            raise serializers.ValidationError(
                "Reason is required when rejecting or requesting revision."
            )
        
        return attrs


class AdminUserListSerializer(serializers.ModelSerializer):
    """Serializer for admin user list view."""
    
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    pending_verifications = serializers.SerializerMethodField()
    latest_verification_request = serializers.SerializerMethodField()
    id_document_front = serializers.SerializerMethodField()
    id_document_back = serializers.SerializerMethodField()
    selfie_with_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'full_name', 'first_name', 'last_name',
            'phone_number', 'subscribe_to_newsletter',
            'user_type', 'is_email_verified', 'is_phone_verified', 'is_identity_verified',
            'is_verified', 'is_active', 'is_staff', 'is_superuser', 'created_at', 'last_login',
            'pending_verifications', 'latest_verification_request',
            'id_document_front', 'id_document_back', 'selfie_with_id'
        )
    
    def get_pending_verifications(self, obj):
        """Get count of pending verification requests."""
        return obj.verification_requests.filter(
            status=VerificationRequest.VerificationStatus.PENDING
        ).count()
    
    def get_latest_verification_request(self, obj):
        """Get the latest verification request."""
        try:
            return obj.verification_requests.filter(
                verification_type='IDENTITY'
            ).order_by('-created_at').first()
        except Exception:
            return None
    
    def get_id_document_front(self, obj):
        """Get the front ID document from latest verification request."""
        latest_request = self.get_latest_verification_request(obj)
        if latest_request and latest_request.id_document_front:
            request = self.context.get('request')
            if request:
                try:
                    return request.build_absolute_uri(latest_request.id_document_front.url)
                except:
                    # Fallback for test environments or invalid hosts
                    return latest_request.id_document_front.url
            return latest_request.id_document_front.url
        return None
    
    def get_id_document_back(self, obj):
        """Get the back ID document from latest verification request."""
        latest_request = self.get_latest_verification_request(obj)
        if latest_request and latest_request.id_document_back:
            request = self.context.get('request')
            if request:
                try:
                    return request.build_absolute_uri(latest_request.id_document_back.url)
                except:
                    # Fallback for test environments or invalid hosts
                    return latest_request.id_document_back.url
            return latest_request.id_document_back.url
        return None
    
    def get_selfie_with_id(self, obj):
        """Get the selfie with ID from latest verification request."""
        latest_request = self.get_latest_verification_request(obj)
        if latest_request and latest_request.selfie_with_id:
            request = self.context.get('request')
            if request:
                try:
                    return request.build_absolute_uri(latest_request.selfie_with_id.url)
                except:
                    # Fallback for test environments or invalid hosts
                    return latest_request.selfie_with_id.url
            return latest_request.selfie_with_id.url
        return None


class VerificationRequestDetailSerializer(VerificationRequestSerializer):
    """Detailed serializer for verification requests with additional info."""
    
    can_be_reviewed = serializers.BooleanField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verification_type_display = serializers.CharField(source='get_verification_type_display', read_only=True)
    
    class Meta(VerificationRequestSerializer.Meta):
        fields = VerificationRequestSerializer.Meta.fields + (
            'can_be_reviewed', 'status_display', 'verification_type_display'
        )