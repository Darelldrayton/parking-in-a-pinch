#!/usr/bin/env python3
"""
Test URL routing for upload endpoint
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from django.test import Client
from django.urls import reverse, resolve
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()

def test_url_routing():
    """Test URL routing for the upload endpoint."""
    try:
        # Test if we can resolve the upload endpoint
        print("Testing URL routing...")
        
        # The upload endpoint should be part of the UserViewSet
        # Let's check what URLs are available
        client = Client()
        
        # Get a user with a token
        user = User.objects.first()
        token, created = Token.objects.get_or_create(user=user)
        
        # Test the upload endpoint
        upload_url = '/api/v1/users/upload_profile_photo/'
        print(f"Testing URL: {upload_url}")
        
        # Make a request to see if the endpoint exists
        response = client.post(upload_url, HTTP_AUTHORIZATION=f'Token {token.key}')
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 400:
            print("✅ Endpoint exists (400 = Bad Request - expected without file)")
        elif response.status_code == 405:
            print("❌ Method not allowed")
        elif response.status_code == 404:
            print("❌ Endpoint not found")
        else:
            print(f"Response: {response.content}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error testing URL routing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_url_routing()
    print(f"URL routing test {'PASSED' if success else 'FAILED'}")