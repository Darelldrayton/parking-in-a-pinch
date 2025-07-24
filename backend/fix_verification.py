#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the path
sys.path.append('/opt/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

django.setup()

from apps.users.models import User
from django.utils import timezone

# Fix user 15's verification status
try:
    user = User.objects.get(id=15)
    print(f"Current verification status for {user.email}:")
    print(f"is_verified: {user.is_verified}")
    print(f"is_identity_verified: {user.is_identity_verified}")
    
    if user.is_identity_verified and not user.is_verified:
        user.is_verified = True
        user.verified_at = timezone.now()
        user.save()
        print("✅ Updated user.is_verified to True")
    else:
        print("No update needed")
        
except User.DoesNotExist:
    print("User 15 not found")
except Exception as e:
    print(f"Error: {e}")