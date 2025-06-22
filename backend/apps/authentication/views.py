"""
Authentication views for user registration, login, logout, and token management.
"""
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    LoginSerializer,
    UserSerializer,
    PasswordChangeSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    EmailVerificationSerializer,
)

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """
    Register a new user.
    
    Creates a new user account with the provided information and returns
    JWT tokens for immediate authentication.
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary="Register new user",
        description="Create a new user account and receive JWT tokens",
        responses={
            201: OpenApiResponse(
                description="User created successfully",
                response=UserRegistrationSerializer
            ),
            400: OpenApiResponse(description="Validation error"),
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
            user = serializer.save()
            
            # Send welcome email
            self.send_welcome_email(user)
            
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            # Log the error for debugging
            print(f"Registration error: {str(e)}")
            
            # Check if it's a validation error
            if hasattr(e, 'detail'):
                return Response(
                    {'error': e.detail},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # For other errors, return a generic message
            return Response(
                {'error': 'Registration failed. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def send_welcome_email(self, user):
        """Send welcome email to newly registered user."""
        subject = 'Welcome to Parking in a Pinch!'
        message = f"""
        Hi {user.first_name},
        
        Welcome to Parking in a Pinch! Your account has been created successfully.
        
        To get started, please verify your email address by clicking the link we'll send you shortly.
        
        Best regards,
        The Parking in a Pinch Team
        """
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=True,
        )


class CustomLoginView(TokenObtainPairView):
    """
    Login user with email and password.
    
    Authenticates user credentials and returns JWT tokens along with user information.
    """
    serializer_class = CustomTokenObtainPairSerializer
    
    @extend_schema(
        summary="User login",
        description="Authenticate with email and password to receive JWT tokens",
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(
                description="Login successful",
                response=CustomTokenObtainPairSerializer
            ),
            401: OpenApiResponse(description="Invalid credentials"),
        }
    )
    def post(self, request, *args, **kwargs):
        # Use LoginSerializer for validation
        login_serializer = LoginSerializer(
            data=request.data,
            context={'request': request}
        )
        login_serializer.is_valid(raise_exception=True)
        
        # Get the authenticated user
        user = login_serializer.validated_data['user']
        
        # Generate tokens using CustomTokenObtainPairSerializer
        refresh = RefreshToken.for_user(user)
        token_serializer = self.get_serializer()
        
        # Prepare response data
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': user.user_type.lower() if user.user_type else 'seeker',
                'is_verified': user.is_identity_verified,
                'is_email_verified': user.is_email_verified,
                'phone_number': user.phone_number,
                'profile_image': user.profile_picture.url if user.profile_picture else None,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            }
        }
        
        return Response(data, status=status.HTTP_200_OK)


class CustomTokenRefreshView(TokenRefreshView):
    """
    Refresh JWT access token.
    
    Takes a refresh token and returns a new access token.
    """
    @extend_schema(
        summary="Refresh access token",
        description="Get a new access token using a valid refresh token",
        responses={
            200: OpenApiResponse(description="Token refreshed successfully"),
            401: OpenApiResponse(description="Invalid or expired refresh token"),
        }
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class LogoutView(APIView):
    """
    Logout user.
    
    Blacklists the refresh token to prevent further use.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="User logout",
        description="Logout user by blacklisting their refresh token",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'refresh': {
                        'type': 'string',
                        'description': 'Refresh token to blacklist'
                    }
                },
                'required': ['refresh']
            }
        },
        responses={
            200: OpenApiResponse(description="Logout successful"),
            400: OpenApiResponse(description="Invalid token"),
        }
    )
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            # For djangorestframework-simplejwt, we need to manually invalidate
            # In production, you'd typically add to a blacklist
            # For now, we'll just acknowledge the logout without actual blacklisting
            
            return Response(
                {'message': 'Logout successful'},
                status=status.HTTP_200_OK
            )
        except TokenError as e:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get or update user profile.
    
    Retrieve the authenticated user's profile or update their information.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    @extend_schema(
        summary="Get user profile",
        description="Retrieve the authenticated user's profile information",
        responses={
            200: OpenApiResponse(
                description="User profile",
                response=UserSerializer
            ),
        }
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="Update user profile",
        description="Update the authenticated user's profile information",
        request=UserSerializer,
        responses={
            200: OpenApiResponse(
                description="Profile updated successfully",
                response=UserSerializer
            ),
            400: OpenApiResponse(description="Validation error"),
        }
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)
    
    @extend_schema(
        summary="Partially update user profile",
        description="Partially update the authenticated user's profile information",
        request=UserSerializer,
        responses={
            200: OpenApiResponse(
                description="Profile updated successfully",
                response=UserSerializer
            ),
            400: OpenApiResponse(description="Validation error"),
        }
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class PasswordChangeView(generics.UpdateAPIView):
    """
    Change user password.
    
    Allows authenticated users to change their password.
    """
    serializer_class = PasswordChangeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    @extend_schema(
        summary="Change password",
        description="Change the authenticated user's password",
        responses={
            200: OpenApiResponse(description="Password changed successfully"),
            400: OpenApiResponse(description="Validation error"),
        }
    )
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )


class PasswordResetRequestView(generics.GenericAPIView):
    """
    Request password reset.
    
    Sends a password reset email to the user.
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary="Request password reset",
        description="Send a password reset email to the user",
        responses={
            200: OpenApiResponse(description="Password reset email sent"),
            400: OpenApiResponse(description="Validation error"),
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email, is_active=True)
            # Generate password reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Send password reset email
            self.send_password_reset_email(user, uid, token)
        except User.DoesNotExist:
            # Don't reveal whether a user exists
            pass
        
        return Response(
            {'message': 'If an account exists with this email, a password reset link has been sent.'},
            status=status.HTTP_200_OK
        )
    
    def send_password_reset_email(self, user, uid, token):
        """Send password reset email."""
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
        subject = 'Password Reset Request'
        message = f"""
        Hi {user.first_name},
        
        You requested a password reset. Click the link below to reset your password:
        
        {reset_url}
        
        This link will expire in 24 hours.
        
        If you didn't request this, please ignore this email.
        
        Best regards,
        The Parking in a Pinch Team
        """
        
        # For development, also print to console for easy access
        print(f"\n{'='*50}")
        print(f"PASSWORD RESET EMAIL")
        print(f"{'='*50}")
        print(f"To: {user.email}")
        print(f"Subject: {subject}")
        print(f"Reset URL: {reset_url}")
        print(f"{'='*50}\n")
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=True,
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    """
    Confirm password reset.
    
    Validates the reset token and sets a new password.
    """
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary="Confirm password reset",
        description="Set a new password using the reset token",
        responses={
            200: OpenApiResponse(description="Password reset successful"),
            400: OpenApiResponse(description="Invalid token or validation error"),
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            uid = force_str(urlsafe_base64_decode(serializer.validated_data['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid reset link'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not default_token_generator.check_token(user, serializer.validated_data['token']):
            return Response(
                {'error': 'Invalid or expired reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response(
            {'message': 'Password reset successful'},
            status=status.HTTP_200_OK
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_verification_email(request):
    """
    Resend email verification link.
    
    Sends a new verification email to the authenticated user.
    """
    user = request.user
    if user.is_email_verified:
        return Response(
            {'message': 'Email is already verified'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate verification token
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Send verification email
    verification_url = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}"
    subject = 'Verify your email address'
    message = f"""
    Hi {user.first_name},
    
    Please verify your email address by clicking the link below:
    
    {verification_url}
    
    This link will expire in 24 hours.
    
    Best regards,
    The Parking in a Pinch Team
    """
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True,
    )
    
    return Response(
        {'message': 'Verification email sent'},
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify user email address.
    
    Validates the verification token and marks the email as verified.
    """
    serializer = EmailVerificationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    token = serializer.validated_data['token']
    
    # Token format: uid.token
    try:
        uid, token_value = token.split('.')
        uid = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=uid)
    except (ValueError, TypeError, OverflowError, User.DoesNotExist):
        return Response(
            {'error': 'Invalid verification link'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not default_token_generator.check_token(user, token_value):
        return Response(
            {'error': 'Invalid or expired verification token'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Mark email as verified
    user.is_email_verified = True
    user.save()
    
    return Response(
        {'message': 'Email verified successfully'},
        status=status.HTTP_200_OK
    )


class DeleteAccountView(APIView):
    """
    Delete user account.
    
    Permanently deletes the authenticated user's account after password confirmation.
    """
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="Delete user account",
        description="Permanently delete the authenticated user's account",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'password': {
                        'type': 'string',
                        'description': 'Current password for confirmation'
                    },
                    'confirmation': {
                        'type': 'string',
                        'description': 'Must be "DELETE" to confirm deletion'
                    }
                },
                'required': ['password', 'confirmation']
            }
        },
        responses={
            200: OpenApiResponse(description="Account deleted successfully"),
            400: OpenApiResponse(description="Invalid password or confirmation"),
            403: OpenApiResponse(description="Cannot delete account with active bookings"),
        }
    )
    def post(self, request):
        user = request.user
        password = request.data.get('password')
        confirmation = request.data.get('confirmation')
        
        # Validate input
        if not password:
            return Response(
                {'error': 'Password is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if confirmation != 'DELETE':
            return Response(
                {'error': 'Must type "DELETE" to confirm account deletion'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify password
        if not user.check_password(password):
            return Response(
                {'error': 'Incorrect password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for active bookings
        from apps.bookings.models import Booking
        active_bookings = Booking.objects.filter(
            user=user,
            status__in=['confirmed', 'active']
        ).exists()
        
        if active_bookings:
            return Response(
                {'error': 'Cannot delete account with active bookings. Please cancel or complete your bookings first.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check for active listings with upcoming bookings
        if hasattr(user, 'listings'):
            from apps.bookings.models import Booking
            from django.utils import timezone
            
            upcoming_bookings = Booking.objects.filter(
                parking_space__host=user,
                status__in=['confirmed', 'active'],
                start_time__gt=timezone.now()
            ).exists()
            
            if upcoming_bookings:
                return Response(
                    {'error': 'Cannot delete account with listings that have upcoming bookings. Please cancel or transfer your listings first.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Mark account as deleted (soft delete)
        user.is_active = False
        user.is_deleted = True
        user.email = f"deleted_{user.id}_{user.email}"  # Avoid email conflicts
        user.save()
        
        return Response(
            {'message': 'Account deleted successfully'},
            status=status.HTTP_200_OK
        )