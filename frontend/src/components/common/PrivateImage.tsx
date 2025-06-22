/**
 * Private Image Component
 * Displays real photos for owners/paid guests, placeholders for others
 */

import React from 'react';
import { Box, CardMedia, Typography, Chip, alpha, useTheme } from '@mui/material';
import { Lock, Visibility } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useBookings } from '../../context/BookingsContext';
import { 
  getDisplayImage, 
  getDisplayImages, 
  areImagesPrivate, 
  getPlaceholderImage 
} from '../../utils/photoPrivacy';

interface PrivateImageProps {
  listing: any;
  alt?: string;
  sx?: any;
  component?: any;
  height?: number | string;
  showPrivacyIndicator?: boolean;
  className?: string;
}

/**
 * Single private image component
 */
export const PrivateImage: React.FC<PrivateImageProps> = ({
  listing,
  alt = 'Parking space',
  sx = {},
  component = 'img',
  height = 200,
  showPrivacyIndicator = true,
  className
}) => {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const theme = useTheme();

  const imageUrl = getDisplayImage(listing, {
    userId: user?.id,
    listing,
    userBookings: bookings
  });

  const isPrivate = areImagesPrivate({
    userId: user?.id,
    listing,
    userBookings: bookings
  });

  return (
    <Box sx={{ position: 'relative', ...sx }}>
      <CardMedia
        component={component}
        height={height}
        image={imageUrl}
        alt={alt}
        className={className}
        sx={{
          filter: isPrivate ? 'blur(2px)' : 'none',
          transition: 'filter 0.3s ease',
          ...sx
        }}
      />
      
      {isPrivate && showPrivacyIndicator && (
        <Box
          sx={{
            position: 'absolute',
            top: 58, // Moved down to avoid overlap with availability chip and heart icon
            left: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Chip
            icon={<Lock />}
            label="Photos unlock after booking"
            size="small"
            sx={{
              bgcolor: alpha(theme.palette.common.black, 0.7),
              color: 'white',
              fontSize: '0.75rem',
              '& .MuiChip-icon': {
                color: 'white',
                fontSize: '0.875rem'
              }
            }}
          />
        </Box>
      )}
      
      {!isPrivate && showPrivacyIndicator && user?.id !== listing.host?.id && (
        <Box
          sx={{
            position: 'absolute',
            top: 58, // Moved down to avoid overlap with availability chip and heart icon
            left: 8,
          }}
        >
          <Chip
            icon={<Visibility />}
            label="Photos unlocked"
            size="small"
            color="success"
            sx={{
              bgcolor: alpha(theme.palette.success.main, 0.9),
              color: 'white',
              fontSize: '0.75rem'
            }}
          />
        </Box>
      )}
    </Box>
  );
};

interface PrivateImageGalleryProps {
  listing: any;
  maxImages?: number;
  showThumbnails?: boolean;
  height?: number | string;
  showPrivacyIndicator?: boolean;
}

/**
 * Private image gallery component
 */
export const PrivateImageGallery: React.FC<PrivateImageGalleryProps> = ({
  listing,
  maxImages = 5,
  showThumbnails = true,
  height = 400,
  showPrivacyIndicator = true
}) => {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const [selectedImage, setSelectedImage] = React.useState(0);

  const images = getDisplayImages(listing, {
    userId: user?.id,
    listing,
    userBookings: bookings
  }).slice(0, maxImages);

  const isPrivate = areImagesPrivate({
    userId: user?.id,
    listing,
    userBookings: bookings
  });

  return (
    <Box>
      {/* Main Image */}
      <PrivateImage
        listing={listing}
        height={height}
        showPrivacyIndicator={showPrivacyIndicator}
        sx={{ borderRadius: 2 }}
      />
      
      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && !isPrivate && (
        <Box sx={{ display: 'flex', gap: 1, mt: 2, overflowX: 'auto' }}>
          {images.map((image, index) => (
            <Box
              key={index}
              onClick={() => setSelectedImage(index)}
              sx={{
                width: 80,
                height: 60,
                borderRadius: 1,
                overflow: 'hidden',
                cursor: 'pointer',
                border: selectedImage === index ? '2px solid' : '1px solid',
                borderColor: selectedImage === index ? 'primary.main' : 'grey.300',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'scale(1.05)'
                }
              }}
            >
              <img
                src={image}
                alt={`Parking space ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
          ))}
        </Box>
      )}
      
      {/* Privacy Message for Thumbnails */}
      {showThumbnails && isPrivate && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            📸 Additional photos will be visible after booking confirmation
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/**
 * Background image with privacy
 */
interface PrivateBackgroundImageProps {
  listing: any;
  children: React.ReactNode;
  sx?: any;
  blurAmount?: number;
}

export const PrivateBackgroundImage: React.FC<PrivateBackgroundImageProps> = ({
  listing,
  children,
  sx = {},
  blurAmount = 3
}) => {
  const { user } = useAuth();
  const { bookings } = useBookings();

  const imageUrl = getDisplayImage(listing, {
    userId: user?.id,
    listing,
    userBookings: bookings
  });

  const isPrivate = areImagesPrivate({
    userId: user?.id,
    listing,
    userBookings: bookings
  });

  return (
    <Box
      sx={{
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: isPrivate ? `blur(${blurAmount}px)` : 'none',
        transition: 'filter 0.3s ease',
        ...sx
      }}
    >
      {children}
    </Box>
  );
};

export default PrivateImage;