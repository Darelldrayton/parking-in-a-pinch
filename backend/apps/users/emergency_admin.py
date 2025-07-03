"""
Emergency admin permission fix endpoint.
This creates a temporary API endpoint that can grant admin permissions.
"""
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate
from django.db import transaction
import json
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def emergency_admin_fix(request):
    """
    Emergency endpoint to grant admin permissions.
    Requires valid email/password authentication.
    """
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({
                'error': 'Email and password required'
            }, status=400)
        
        # Authenticate user
        user = authenticate(username=email, password=password)
        if not user:
            return JsonResponse({
                'error': 'Invalid credentials'
            }, status=401)
        
        # Check if this is the expected admin user
        if user.email != 'darelldrayton93@gmail.com':
            return JsonResponse({
                'error': 'Unauthorized user'
            }, status=403)
        
        # Grant admin permissions
        with transaction.atomic():
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            if user.user_type not in ['BOTH', 'HOST']:
                user.user_type = 'BOTH'
            user.save()
        
        logger.info(f"Emergency admin permissions granted to {user.email}")
        
        return JsonResponse({
            'success': True,
            'message': 'Admin permissions granted successfully',
            'user': {
                'email': user.email,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_active': user.is_active,
                'user_type': user.user_type
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Emergency admin fix error: {str(e)}")
        return JsonResponse({
            'error': f'Internal error: {str(e)}'
        }, status=500)