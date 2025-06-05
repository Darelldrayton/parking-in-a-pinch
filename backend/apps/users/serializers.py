"""
Serializers for the users app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile

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
            'created_at', 'profile'
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
            'first_name', 'last_name', 'phone_number', 'user_type'
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
    
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = (
            'first_name', 'last_name', 'phone_number', 'user_type',
            'profile_picture', 'bio', 'date_of_birth',
            'default_address',
            'preferred_notification_method', 'profile'
        )
    
    def update(self, instance, validated_data):
        """Update user and profile information."""
        profile_data = validated_data.pop('profile', None)
        
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
            'id', 'display_name', 'profile_picture', 'bio',
            'user_type', 'average_rating_as_host', 'total_reviews_as_host',
            'average_rating_as_guest', 'total_reviews_as_guest',
            'is_verified', 'created_at'
        )