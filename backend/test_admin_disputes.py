#!/usr/bin/env python
"""
Simple test script to debug admin disputes API endpoint.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from apps.disputes.models import Dispute
from apps.disputes.views import AdminDisputeViewSet

User = get_user_model()

def test_admin_disputes():
    print("=== ADMIN DISPUTES API TEST ===")
    
    # Get admin user
    try:
        admin_user = User.objects.get(email='darelldrayton93@gmail.com')
        print(f"✅ Admin user found: {admin_user.email}")
    except User.DoesNotExist:
        print("❌ Admin user not found")
        return
    
    # Check disputes in database
    dispute_count = Dispute.objects.count()
    print(f"📊 Disputes in database: {dispute_count}")
    
    # Create token
    token = AccessToken.for_user(admin_user)
    print(f"🔑 Token created: {str(token)[:50]}...")
    
    # Create API client
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    # Test stats endpoint (we know this works)
    print("\n--- Testing Stats Endpoint ---")
    response = client.get('/api/v1/disputes/admin/stats/')
    print(f"Stats Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Stats Data: {response.data}")
    else:
        print(f"Stats Error: {response.content}")
    
    # Test list endpoint (this is the problem)
    print("\n--- Testing List Endpoint ---")
    response = client.get('/api/v1/disputes/admin/')
    print(f"List Status: {response.status_code}")
    if response.status_code == 200:
        print(f"List Data: {response.data}")
    else:
        print(f"List Error: {response.content}")
        
    # Test with empty query parameters
    print("\n--- Testing List Endpoint with Query Params ---")
    response = client.get('/api/v1/disputes/admin/?page=1')
    print(f"List with params Status: {response.status_code}")
    if response.status_code == 200:
        print(f"List with params Data: {response.data}")
    else:
        print(f"List with params Error: {response.content}")

if __name__ == '__main__':
    test_admin_disputes()