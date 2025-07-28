"""
Authentication serializers for user registration, login, and JWT token management.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils.translation import gettext_lazy as _
from apps.users.models import UserProfile

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes user information in the response.
    """
    username_field = 'email'  # Override to use email instead of username
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field] = serializers.EmailField()
        self.fields['password'] = serializers.CharField()
        # Remove the default username field if it exists
        if 'username' in self.fields:
            del self.fields['username']
    
    def validate(self, attrs):
        # Get email and password from attrs
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Since USERNAME_FIELD = 'email', authenticate directly with email
            self.user = authenticate(
                request=self.context.get('request'),
                username=email.lower(),  # email is the username field
                password=password
            )
            
            if not self.user:
                raise serializers.ValidationError('Invalid credentials')
            
            if not self.user.is_active:
                raise serializers.ValidationError('User account is disabled')
                    
        else:
            raise serializers.ValidationError('Must include email and password')
        
        data = super(TokenObtainPairSerializer, self).validate(attrs)
        
        # Add user information to the response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'user_type': self.user.user_type.lower() if self.user.user_type else 'seeker',
            'is_verified': self.user.is_identity_verified,
            'is_email_verified': self.user.is_email_verified,
            'phone_number': self.user.phone_number,
            'profile_image': self.context.get('request').build_absolute_uri(self.user.profile_picture.url) if self.user.profile_picture and self.context.get('request') else (self.user.profile_picture.url if self.user.profile_picture else None),
        }
        
        return data
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims to the token
        token['email'] = user.email
        token['user_type'] = user.user_type
        token['is_verified'] = user.is_identity_verified
        
        return token


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration with password confirmation.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        label='Confirm Password'
    )
    user_type = serializers.ChoiceField(
        choices=['seeker', 'host', 'both'],
        default='seeker'
    )
    tokens = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'password', 'password2', 'user_type', 'phone_number',
            'subscribe_to_newsletter', 'tokens'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'username': {'required': False, 'allow_blank': True},
        }
    
    def validate(self, attrs):
        """Validate passwords match and email is unique."""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                'password': _("Password fields didn't match.")
            })
        
        # Generate username from email if not provided
        if not attrs.get('username'):
            email = attrs.get('email', '')
            if email:
                username = email.split('@')[0]
                # Ensure username is unique
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                attrs['username'] = username
            else:
                raise serializers.ValidationError({
                    'username': _("Username is required or email must be provided to generate username.")
                })
        
        # Convert frontend user_type to backend format
        user_type_mapping = {
            'seeker': 'SEEKER',
            'host': 'HOST',
            'both': 'BOTH'
        }
        attrs['user_type'] = user_type_mapping.get(attrs['user_type'], 'SEEKER')
        
        return attrs
    
    def validate_email(self, value):
        """Check if email already exists."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                _("A user with this email already exists.")
            )
        return value.lower()
    
    def validate_username(self, value):
        """Generate username from email if not provided."""
        # If username is not provided or is empty, generate from email
        if not value or value == '':
            email = self.initial_data.get('email', '')
            if email:
                value = email.split('@')[0]
                # Ensure username is unique
                base_username = value
                counter = 1
                while User.objects.filter(username=value).exists():
                    value = f"{base_username}{counter}"
                    counter += 1
            else:
                # If no email either, raise validation error
                raise serializers.ValidationError(
                    _("Username is required or email must be provided to generate username.")
                )
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        """Create user and associated profile."""
        # Remove password2 and tokens from validated data
        validated_data.pop('password2', None)
        password = validated_data.pop('password')
        
        # Create user (UserProfile will be created automatically via signal)
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        
        return user
    
    def get_tokens(self, obj):
        """Generate JWT tokens for the user."""
        refresh = RefreshToken.for_user(obj)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    
    def to_representation(self, instance):
        """Convert backend user type to frontend format in response."""
        data = super().to_representation(instance)
        
        # Convert user type back to frontend format
        user_type_mapping = {
            'SEEKER': 'seeker',
            'HOST': 'host',
            'BOTH': 'both'
        }
        data['user_type'] = user_type_mapping.get(instance.user_type, 'seeker')
        
        # Add full user object to response
        data['user'] = {
            'id': instance.id,
            'email': instance.email,
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'user_type': data['user_type'],
            'is_verified': instance.is_identity_verified,
            'is_email_verified': instance.is_email_verified,
            'phone_number': instance.phone_number,
            'profile_image': instance.profile_picture.url if instance.profile_picture else None,
        }
        
        return data


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login with email and password.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        email = attrs.get('email').lower()
        password = attrs.get('password')
        
        if email and password:
            # Authenticate user
            user = authenticate(
                request=self.context.get('request'),
                username=email,  # Using email as username
                password=password
            )
            
            if not user:
                raise serializers.ValidationError(
                    _('Unable to login with provided credentials.'),
                    code='authentication'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    _('User account is disabled.'),
                    code='inactive'
                )
            
            attrs['user'] = user
        else:
            raise serializers.ValidationError(
                _('Must include "email" and "password".'),
                code='required'
            )
        
        return attrs


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user details with frontend-compatible format.
    """
    user_type = serializers.SerializerMethodField()
    is_verified = serializers.BooleanField(source='is_identity_verified', read_only=True)
    profile_image = serializers.ImageField(source='profile_picture', required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'username',
            'user_type', 'is_verified', 'is_email_verified',
            'phone_number', 'profile_image', 'bio', 'date_of_birth',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_verified', 'is_email_verified', 'created_at', 'updated_at']
    
    def get_user_type(self, obj):
        """Convert backend user type to frontend format."""
        type_mapping = {
            'SEEKER': 'seeker',
            'HOST': 'host',
            'BOTH': 'both'
        }
        return type_mapping.get(obj.user_type, 'seeker')


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for changing user password.
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                'new_password': _("Password fields didn't match.")
            })
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                _('Old password is not correct.')
            )
        return value
    
    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    Serializer for requesting password reset.
    """
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Check if user with email exists."""
        try:
            User.objects.get(email=value.lower(), is_active=True)
        except User.DoesNotExist:
            # Don't reveal whether a user exists
            pass
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    Serializer for confirming password reset.
    """
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                'new_password': _("Password fields didn't match.")
            })
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    """
    Serializer for email verification.
    """
    token = serializers.CharField(required=True)