"""
Utility functions for listings app
"""

from typing import Dict, List, Optional, Union
from django.db.models import Q
from apps.bookings.models import Booking


class PhotoPrivacyManager:
    """
    Manages photo privacy logic for parking listings
    """
    
    # Placeholder images for each parking type
    PLACEHOLDER_IMAGES = {
        'garage': 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=500&h=300&fit=crop&crop=center',
        'street': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=300&fit=crop&crop=center',
        'lot': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop&crop=center',
        'covered': 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=300&fit=crop&crop=center',
        'driveway': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop&crop=center',
        'default': 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=500&h=300&fit=crop&crop=center'
    }
    
    @classmethod
    def should_show_real_photos(cls, listing, user) -> bool:
        """
        Determine if real photos should be shown for this listing
        
        Args:
            listing: ParkingListing instance
            user: User instance (can be None for anonymous users)
            
        Returns:
            bool: True if real photos should be shown
        """
        if not user or not user.is_authenticated:
            return False
            
        # Host always sees their own photos
        if listing.host_id == user.id:
            return True
            
        # Check if user has a confirmed booking for this listing
        has_confirmed_booking = Booking.objects.filter(
            user=user,
            parking_space=listing,
            status__in=['confirmed', 'active', 'completed']
        ).exists()
        
        return has_confirmed_booking
    
    @classmethod
    def get_placeholder_image(cls, space_type: str) -> str:
        """
        Get placeholder image URL for given space type
        """
        return cls.PLACEHOLDER_IMAGES.get(space_type, cls.PLACEHOLDER_IMAGES['default'])
    
    @classmethod
    def filter_listing_images(cls, listing, user, serialized_data: Dict) -> Dict:
        """
        Filter listing images based on privacy settings
        
        Args:
            listing: ParkingListing instance
            user: User instance
            serialized_data: Serialized listing data
            
        Returns:
            Modified serialized data with filtered images
        """
        if cls.should_show_real_photos(listing, user):
            # Add privacy metadata
            serialized_data['images_unlocked'] = True
            return serialized_data
            
        # Replace with placeholder
        placeholder_url = cls.get_placeholder_image(listing.space_type)
        
        # Replace images with single placeholder
        serialized_data['images'] = [{
            'id': 0,
            'image_url': placeholder_url,
            'alt_text': f'Generic {listing.space_type} parking space',
            'display_order': 0,
            'is_placeholder': True
        }]
        
        # Add privacy metadata
        serialized_data['images_unlocked'] = False
        serialized_data['unlock_message'] = 'Photos will be visible after booking confirmation'
        
        return serialized_data
    
    @classmethod
    def process_listing_queryset(cls, queryset, user):
        """
        Process a queryset of listings to add photo privacy annotations
        
        Args:
            queryset: QuerySet of ParkingListing
            user: User instance
            
        Returns:
            Annotated queryset
        """
        if not user or not user.is_authenticated:
            return queryset
            
        # Annotate with whether user has confirmed booking
        from django.db.models import Exists, OuterRef
        
        confirmed_booking_subquery = Booking.objects.filter(
            user=user,
            parking_space=OuterRef('pk'),
            status__in=['confirmed', 'active', 'completed']
        )
        
        return queryset.annotate(
            has_user_booking=Exists(confirmed_booking_subquery)
        )