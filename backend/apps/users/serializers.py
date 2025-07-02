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
            'is_identity_verified', 'stripe_customer_id', 'stripe_account_id',
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
    user_type = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField(source='is_identity_verified', read_only=True)
    profile_image = serializers.ImageField(source='profile_picture', required=False)
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name',
            'user_type', 'is_verified', 'phone_number', 'profile_image', 'profile'
        )
        read_only_fields = ('id', 'is_verified')
    
    def get_user_type(self, obj):
        """Convert backend user type to frontend format."""
        type_mapping = {
            'SEEKER': 'renter',
            'HOST': 'host',
            'BOTH': 'both'
        }
        return type_mapping.get(obj.user_type, 'renter')
    
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
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'full_name', 'first_name', 'last_name',
            'user_type', 'is_email_verified', 'is_phone_verified', 'is_identity_verified',
            'is_active', 'is_staff', 'is_superuser', 'created_at', 'last_login',
            'pending_verifications'
        )
    
    def get_pending_verifications(self, obj):
        """Get count of pending verification requests."""
        return obj.verification_requests.filter(
            status=VerificationRequest.VerificationStatus.PENDING
        ).count()


class VerificationRequestDetailSerializer(VerificationRequestSerializer):
    """Detailed serializer for verification requests with additional info."""
    
    can_be_reviewed = serializers.BooleanField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verification_type_display = serializers.CharField(source='get_verification_type_display', read_only=True)
    
    class Meta(VerificationRequestSerializer.Meta):
        fields = VerificationRequestSerializer.Meta.fields + (
            'can_be_reviewed', 'status_display', 'verification_type_display'
        )