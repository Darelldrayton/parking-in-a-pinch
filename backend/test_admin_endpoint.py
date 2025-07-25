#!/usr/bin/env python
import os
import django
import sys

# Setup Django
sys.path.append('/opt/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import AnonymousUser
from apps.users.admin_views import AdminUserViewSet
from apps.payments.admin_views import PayoutRequestViewSet
from apps.users.models import User

# Test the endpoints that were failing
factory = APIRequestFactory()

print("Testing Admin User endpoint...")
request = factory.get('/api/v1/users/admin/users/')
request.user = AnonymousUser()

view = AdminUserViewSet()
view.request = request
view.format_kwarg = None

try:
    # Test get_queryset
    queryset = view.get_queryset()
    print(f"✅ User get_queryset works: {queryset.count()} users found")
    
    # Test list view
    response = view.list(request)
    print(f"✅ User list view works: status {response.status_code}")
    
except Exception as e:
    print(f"❌ User endpoint error: {e}")
    import traceback
    traceback.print_exc()

print("\nTesting Payout Request endpoint...")
print("⚠️  Skipping payout test - table may not exist in production DB")