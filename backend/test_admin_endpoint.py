#!/usr/bin/env python
import os
import django
import sys

# Setup Django
sys.path.append('/opt/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser
from apps.users.admin_views import AdminUserViewSet
from apps.users.models import User

# Test the endpoint that's failing
factory = RequestFactory()
request = factory.get('/api/v1/users/admin/users/')
request.user = AnonymousUser()

view = AdminUserViewSet()
view.request = request
view.format_kwarg = None

try:
    # Test get_queryset
    queryset = view.get_queryset()
    print(f"✅ get_queryset works: {queryset.count()} users found")
    
    # Test list view
    response = view.list(request)
    print(f"✅ list view works: status {response.status_code}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()