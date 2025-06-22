/**
 * Photo Privacy Utility
 * Manages when to show real photos vs generic placeholders based on user status
 */

import { ParkingType } from '../types/parking';

// Generic placeholder photos for each parking type
export const PLACEHOLDER_IMAGES = {
  garage: '/images/placeholders/garage-interior.jpg',
  street: '/images/placeholders/street-parking.jpg', 
  lot: '/images/placeholders/parking-lot.jpg',
  covered: '/images/placeholders/covered-space.jpg',
  driveway: '/images/placeholders/driveway.jpg',
  default: '/images/placeholders/generic-parking.jpg'
} as const;

// Fallback images if placeholders aren't available yet
export const FALLBACK_IMAGES = {
  garage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=500&h=300&fit=crop&crop=center',
  street: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&h=300&fit=crop&crop=center',
  lot: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop&crop=center', 
  covered: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=300&fit=crop&crop=center',
  driveway: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=300&fit=crop&crop=center',
  default: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=500&h=300&fit=crop&crop=center'
} as const;

export interface PhotoPrivacyOptions {
  userId?: number;
  listing: any;
  userBookings?: any[];
}

/**
 * Determines if user should see real photos or placeholder
 */
export const shouldShowRealPhotos = ({ userId, listing, userBookings = [] }: PhotoPrivacyOptions): boolean => {
  // Always show real photos to the listing owner/host
  if (userId && listing.host?.id === userId) {
    return true;
  }
  
  // Show real photos if user has a confirmed booking for this listing
  const hasConfirmedBooking = userBookings.some(booking => {
    const bookingSpaceId = typeof booking.parking_space === 'object' 
      ? booking.parking_space?.id 
      : booking.parking_space;
    
    return bookingSpaceId === listing.id && 
           ['confirmed', 'active', 'completed'].includes(booking.status?.toLowerCase());
  });
  
  return hasConfirmedBooking;
};

/**
 * Get the appropriate image URL based on privacy settings
 */
export const getDisplayImage = (listing: any, options: PhotoPrivacyOptions): string => {
  const showReal = shouldShowRealPhotos(options);
  
  if (showReal && listing.images?.length > 0) {
    return listing.images[0].image_url || listing.images[0].image;
  }
  
  // Return placeholder based on parking type
  const parkingType = listing.space_type || 'default';
  return FALLBACK_IMAGES[parkingType as keyof typeof FALLBACK_IMAGES] || FALLBACK_IMAGES.default;
};

/**
 * Get all images for a listing (real or placeholder)
 */
export const getDisplayImages = (listing: any, options: PhotoPrivacyOptions): string[] => {
  const showReal = shouldShowRealPhotos(options);
  
  if (showReal && listing.images?.length > 0) {
    return listing.images.map((img: any) => img.image_url || img.image);
  }
  
  // Return single placeholder image
  const parkingType = listing.space_type || 'default';
  return [FALLBACK_IMAGES[parkingType as keyof typeof FALLBACK_IMAGES] || FALLBACK_IMAGES.default];
};

/**
 * Check if images are blurred/placeholder for display purposes
 */
export const areImagesPrivate = (options: PhotoPrivacyOptions): boolean => {
  return !shouldShowRealPhotos(options);
};

/**
 * Get placeholder image for specific parking type
 */
export const getPlaceholderImage = (parkingType: ParkingType | string): string => {
  return FALLBACK_IMAGES[parkingType as keyof typeof FALLBACK_IMAGES] || FALLBACK_IMAGES.default;
};