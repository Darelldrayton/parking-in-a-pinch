#!/usr/bin/env python3
"""
Test script to verify profile photo upload functionality
"""
import os
import sys
import django
import requests
from io import BytesIO
from PIL import Image

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import RequestFactory
from apps.users.profile_photo_views import upload_profile_photo

User = get_user_model()

def create_test_image():
    """Create a test image file."""
    image = Image.new('RGB', (100, 100), color='red')
    image_buffer = BytesIO()
    image.save(image_buffer, format='JPEG')
    image_buffer.seek(0)
    return image_buffer

def test_photo_upload():
    """Test the photo upload functionality."""
    try:
        # Get a test user
        user = User.objects.first()
        if not user:
            print("❌ No users found in database")
            return False
        
        print(f"✅ Testing with user: {user.email}")
        
        # Create a mock request
        factory = RequestFactory()
        test_image = create_test_image()
        
        # Create multipart data
        from django.core.files.uploadedfile import SimpleUploadedFile
        uploaded_file = SimpleUploadedFile(
            "test.jpg",
            test_image.getvalue(),
            content_type="image/jpeg"
        )
        
        # Create request with file
        request = factory.post('/test/', {'profile_picture': uploaded_file})
        request.user = user
        request.FILES = {'profile_picture': uploaded_file}
        
        # Test the upload view
        response = upload_profile_photo(request)
        
        if response.status_code == 200:
            print("✅ Photo upload successful!")
            print(f"Response: {response.data}")
            return True
        else:
            print(f"❌ Photo upload failed with status {response.status_code}")
            print(f"Response: {response.data}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing photo upload: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Testing profile photo upload functionality...")
    success = test_photo_upload()
    sys.exit(0 if success else 1)