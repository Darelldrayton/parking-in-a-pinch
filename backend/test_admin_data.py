#!/usr/bin/env python
import os
import django
import sys
import json

# Setup Django
sys.path.append('/opt/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import AnonymousUser
from apps.users.admin_views import AdminUserViewSet
from apps.users.models import User

# Test the actual data being returned
factory = APIRequestFactory()

print("Testing Admin User endpoint data...")
request = factory.get('/api/v1/users/admin/users/')
request.user = AnonymousUser()

view = AdminUserViewSet()
view.request = request
view.format_kwarg = None

try:
    # Get the actual response
    response = view.list(request)
    print(f"✅ Status: {response.status_code}")
    
    # Parse the response data
    if hasattr(response, 'data'):
        data = response.data
        print(f"\n📊 Total users: {len(data)}")
        
        # Show first 3 users as sample
        print("\n👥 Sample user data:")
        for i, user in enumerate(data[:3]):
            print(f"\nUser {i+1}:")
            print(f"  ID: {user.get('id')}")
            print(f"  Email: {user.get('email')}")
            print(f"  Name: {user.get('first_name')} {user.get('last_name')}")
            print(f"  Type: {user.get('user_type')}")
            print(f"  Verified: {user.get('is_verified')}")
            print(f"  Identity Verified: {user.get('is_identity_verified')}")
            print(f"  Active: {user.get('is_active')}")
            print(f"  Created: {user.get('created_at')}")
            
            # Check what fields are actually present
            print(f"  Available fields: {list(user.keys())}")
            
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()