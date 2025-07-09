#!/usr/bin/env python3
"""
Simple test to verify the upload endpoint works directly
"""
import os
import sys
import django
from io import BytesIO
from PIL import Image

# Add the project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from django.test import RequestFactory
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from apps.users.profile_photo_views import upload_profile_photo

User = get_user_model()

def create_test_image():
    """Create a test image file."""
    image = Image.new('RGB', (200, 200), color='blue')
    image_buffer = BytesIO()
    image.save(image_buffer, format='JPEG')
    image_buffer.seek(0)
    return image_buffer

def test_upload():
    """Test the upload endpoint directly."""
    try:
        # Get the first existing user
        user = User.objects.first()
        if not user:
            print("❌ No users found in database")
            return False
        
        print(f"Using user: {user.email}")
        
        # Create test image
        test_image = create_test_image()
        uploaded_file = SimpleUploadedFile(
            "test_profile.jpg",
            test_image.getvalue(),
            content_type="image/jpeg"
        )
        
        # Create or get a token for the user
        from rest_framework.authtoken.models import Token
        token, created = Token.objects.get_or_create(user=user)
        print(f"Token: {token.key} (created: {created})")
        
        # Create mock request
        factory = RequestFactory()
        request = factory.post('/test/', data={'profile_picture': uploaded_file}, format='multipart')
        
        # Add proper authorization header
        request.META['HTTP_AUTHORIZATION'] = f'Token {token.key}'
        
        # Set user as anonymous initially (the view will authenticate via token)
        from django.contrib.auth.models import AnonymousUser
        request.user = AnonymousUser()
        
        print("Calling upload_profile_photo...")
        response = upload_profile_photo(request)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Data: {response.data}")
        
        if response.status_code == 200:
            print("✅ Upload successful!")
            
            # Refresh the user object from database
            user.refresh_from_db()
            
            # Check if file was saved
            if user.profile_picture:
                print(f"Profile picture saved to: {user.profile_picture.name}")
                
                # Check if file exists on disk
                import os
                file_path = user.profile_picture.path
                if os.path.exists(file_path):
                    print(f"File exists on disk: {file_path}")
                    return True
                else:
                    print(f"❌ File not found on disk: {file_path}")
                    return False
            else:
                print("❌ No profile picture saved to user")
                return False
        else:
            print(f"❌ Upload failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing upload endpoint...")
    success = test_upload()
    print(f"Test {'PASSED' if success else 'FAILED'}")