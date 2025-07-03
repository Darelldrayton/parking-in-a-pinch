"""
Middleware to handle automatic token refresh for expired JWT tokens.
"""
import json
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class TokenRefreshMiddleware(MiddlewareMixin):
    """
    Middleware that automatically refreshes expired access tokens
    when a 401 response would be returned.
    """
    
    def process_response(self, request, response):
        """
        Check if response is 401 and try to refresh token automatically.
        """
        # Only handle 401 responses for API endpoints
        if (response.status_code == 401 and 
            request.path.startswith('/api/') and
            hasattr(request, 'META')):
            
            # Get Authorization header
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            
            if auth_header.startswith('Bearer '):
                access_token = auth_header.split(' ')[1]
                
                # Try to get refresh token from request body or headers
                refresh_token = self._extract_refresh_token(request)
                
                if refresh_token:
                    try:
                        # Validate and refresh the token
                        refresh = RefreshToken(refresh_token)
                        new_access_token = str(refresh.access_token)
                        
                        # Return new token in response
                        return JsonResponse({
                            'error': 'Token expired',
                            'token_refreshed': True,
                            'access_token': new_access_token,
                            'message': 'Please retry your request with the new token'
                        }, status=401)
                        
                    except (TokenError, InvalidToken) as e:
                        logger.warning(f"Token refresh failed: {str(e)}")
                        return JsonResponse({
                            'error': 'Authentication failed',
                            'token_expired': True,
                            'message': 'Please log in again'
                        }, status=401)
        
        return response
    
    def _extract_refresh_token(self, request):
        """
        Extract refresh token from request body or headers.
        """
        # Try to get from request body
        if hasattr(request, 'body') and request.body:
            try:
                body = json.loads(request.body.decode('utf-8'))
                if 'refresh_token' in body:
                    return body['refresh_token']
            except (json.JSONDecodeError, UnicodeDecodeError):
                pass
        
        # Try to get from custom header
        refresh_token = request.META.get('HTTP_X_REFRESH_TOKEN')
        if refresh_token:
            return refresh_token
        
        # Try to get from cookies
        if hasattr(request, 'COOKIES'):
            refresh_token = request.COOKIES.get('refresh_token')
            if refresh_token:
                return refresh_token
        
        return None