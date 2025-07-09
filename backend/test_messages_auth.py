#!/usr/bin/env python
"""
Test script to verify messages endpoint authentication is working properly.
"""
import os
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()

# Get or create a test user
user, created = User.objects.get_or_create(
    email='test@example.com',
    defaults={
        'username': 'testuser',
        'first_name': 'Test',
        'last_name': 'User'
    }
)

if created:
    user.set_password('testpass123')
    user.save()
    print(f"Created test user: {user.email}")
else:
    print(f"Using existing test user: {user.email}")

# Get or create token
token, created = Token.objects.get_or_create(user=user)
print(f"Token: {token.key}")

# Test the messages endpoint
base_url = "http://localhost:8000"

# Test without authentication (should fail)
print("\n1. Testing without authentication...")
response = requests.get(f"{base_url}/api/conversations/")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# Test with token authentication
print("\n2. Testing with token authentication...")
headers = {
    'Authorization': f'Token {token.key}'
}
response = requests.get(f"{base_url}/api/conversations/", headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# Test messages endpoint
print("\n3. Testing messages endpoint with authentication...")
response = requests.get(f"{base_url}/api/messages/", headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# Test unread count endpoint
print("\n4. Testing unread count endpoint with authentication...")
response = requests.get(f"{base_url}/api/conversations/unread_count/", headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

print("\nAuthentication test completed!")