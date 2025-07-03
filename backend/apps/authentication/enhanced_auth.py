"""
Enhanced authentication views with automatic token refresh capabilities.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import authenticate
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def enhanced_token_refresh(request):
    """
    Enhanced token refresh endpoint that provides better error handling
    and supports multiple refresh methods.
    """
    try:
        # Get refresh token from multiple sources
        refresh_token = (
            request.data.get('refresh') or
            request.META.get('HTTP_X_REFRESH_TOKEN') or
            request.COOKIES.get('refresh_token')
        )
        
        if not refresh_token:
            return Response({
                'error': 'Refresh token required',
                'code': 'REFRESH_TOKEN_MISSING'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Validate and refresh the token
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            # Optionally rotate refresh token for added security
            new_refresh_token = str(refresh)
            
            return Response({
                'access': access_token,
                'refresh': new_refresh_token,
                'message': 'Token refreshed successfully'
            }, status=status.HTTP_200_OK)
            
        except (TokenError, InvalidToken) as e:
            logger.warning(f"Token refresh failed: {str(e)}")
            return Response({
                'error': 'Invalid or expired refresh token',
                'code': 'REFRESH_TOKEN_INVALID',
                'message': 'Please log in again'
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return Response({
            'error': 'Token refresh failed',
            'code': 'REFRESH_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def auto_login_refresh(request):
    """
    Emergency endpoint that can re-authenticate and refresh tokens
    when the user has valid credentials but expired tokens.
    """
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Email and password required',
                'code': 'CREDENTIALS_MISSING'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = authenticate(username=email, password=password)
        if not user:
            return Response({
                'error': 'Invalid credentials',
                'code': 'INVALID_CREDENTIALS'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({
                'error': 'Account disabled',
                'code': 'ACCOUNT_DISABLED'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate new tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        return Response({
            'access': access_token,
            'refresh': refresh_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': user.user_type,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_verified': user.is_email_verified
            },
            'message': 'Authentication refreshed successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Auto login refresh error: {str(e)}")
        return Response({
            'error': 'Authentication refresh failed',
            'code': 'AUTH_REFRESH_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)