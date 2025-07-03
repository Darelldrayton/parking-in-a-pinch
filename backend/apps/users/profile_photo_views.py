"""
Profile photo upload functionality for users.
"""
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.conf import settings
import os
import uuid
from PIL import Image
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_profile_photo(request):
    """
    Upload and update user's profile photo.
    Handles image validation, resizing, and storage.
    """
    try:
        user = request.user
        
        if 'profile_picture' not in request.FILES:
            return Response({
                'error': 'No profile picture file provided',
                'field': 'profile_picture'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = request.FILES['profile_picture']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response({
                'error': 'Invalid image format. Allowed formats: JPEG, PNG, GIF, WebP',
                'field': 'profile_picture'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (max 2MB)
        max_size = 2 * 1024 * 1024  # 2MB
        if image_file.size > max_size:
            return Response({
                'error': 'Image file too large. Maximum size is 2MB',
                'field': 'profile_picture'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate unique filename
        file_extension = os.path.splitext(image_file.name)[1].lower()
        if not file_extension:
            file_extension = '.jpg'
        
        filename = f"profile_{user.id}_{uuid.uuid4().hex[:8]}{file_extension}"
        
        # Delete old profile picture if exists
        if user.profile_picture:
            try:
                old_path = user.profile_picture.path
                if os.path.exists(old_path):
                    os.remove(old_path)
                    logger.info(f"Deleted old profile picture: {old_path}")
            except Exception as e:
                logger.warning(f"Could not delete old profile picture: {e}")
        
        # Save the uploaded image
        try:
            # Process and resize image
            processed_image = process_profile_image(image_file)
            
            # Save to user's profile_picture field
            user.profile_picture.save(filename, processed_image, save=True)
            
            # Generate URL for response
            if user.profile_picture:
                if hasattr(user.profile_picture, 'url'):
                    image_url = request.build_absolute_uri(user.profile_picture.url)
                else:
                    image_url = f"{request.scheme}://{request.get_host()}/media/{user.profile_picture.name}"
            else:
                image_url = None
            
            return Response({
                'success': True,
                'message': 'Profile picture updated successfully',
                'profile_picture_url': image_url,
                'filename': filename
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error saving profile picture: {str(e)}")
            return Response({
                'error': f'Failed to save profile picture: {str(e)}',
                'field': 'profile_picture'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"Profile photo upload error: {str(e)}")
        return Response({
            'error': f'Profile photo upload failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_profile_photo(request):
    """
    Delete user's profile photo.
    """
    try:
        user = request.user
        
        if not user.profile_picture:
            return Response({
                'error': 'No profile picture to delete'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete the file
        try:
            if user.profile_picture:
                old_path = user.profile_picture.path
                if os.path.exists(old_path):
                    os.remove(old_path)
                    logger.info(f"Deleted profile picture: {old_path}")
        except Exception as e:
            logger.warning(f"Could not delete profile picture file: {e}")
        
        # Clear the field
        user.profile_picture = None
        user.save()
        
        return Response({
            'success': True,
            'message': 'Profile picture deleted successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Profile photo deletion error: {str(e)}")
        return Response({
            'error': f'Profile photo deletion failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def process_profile_image(image_file):
    """
    Process and resize profile image to standard dimensions.
    """
    try:
        # Open image with Pillow
        image = Image.open(image_file)
        
        # Convert to RGB if necessary (for JPEG compatibility)
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        
        # Resize to square dimensions (400x400)
        target_size = (400, 400)
        
        # Calculate crop box to maintain aspect ratio
        width, height = image.size
        if width > height:
            # Landscape - crop width
            crop_size = height
            left = (width - crop_size) // 2
            top = 0
            right = left + crop_size
            bottom = crop_size
        else:
            # Portrait or square - crop height
            crop_size = width
            left = 0
            top = (height - crop_size) // 2
            right = crop_size
            bottom = top + crop_size
        
        # Crop to square
        image = image.crop((left, top, right, bottom))
        
        # Resize to target size
        image = image.resize(target_size, Image.Resampling.LANCZOS)
        
        # Save to BytesIO
        from io import BytesIO
        output = BytesIO()
        image.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        
        return output
        
    except Exception as e:
        logger.error(f"Image processing error: {str(e)}")
        # If processing fails, return original file
        image_file.seek(0)
        return image_file