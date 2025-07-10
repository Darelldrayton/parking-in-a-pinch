/**
 * Image proxy utility to handle HTTP/HTTPS image loading
 * Fixes mixed content issues when HTTPS frontend needs to load HTTP images
 */

/**
 * Convert HTTP image URLs to HTTPS-compatible URLs using a proxy service
 * @param {string} url - The original image URL
 * @returns {string} - HTTPS-compatible URL
 */
export const getSecureImageUrl = (url) => {
  if (!url) return '/default-avatar.png'; // Default avatar fallback
  
  // If it's already HTTPS, return as is
  if (url.startsWith('https://')) return url;
  
  // If it's an HTTP URL from your server, proxy it
  if (url.includes('165.227.111.160') || url.includes('http://')) {
    // Using weserv.nl proxy service (free and reliable)
    const cleanUrl = url.replace('http://', '');
    return `https://images.weserv.nl/?url=${cleanUrl}`;
  }
  
  return url;
};

/**
 * Get a fallback avatar URL for when profile images fail to load
 * @param {string} name - User's name for generating initials
 * @returns {string} - Fallback avatar URL
 */
export const getFallbackAvatarUrl = (name) => {
  if (!name) return 'https://via.placeholder.com/150/6366f1/white?text=?';
  
  // Extract initials from name
  const initials = name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
  
  // Use a reliable placeholder service with initials
  return `https://via.placeholder.com/150/6366f1/white?text=${initials}`;
};

/**
 * Enhanced image URL handler with fallback support
 * @param {string} imageUrl - Original image URL
 * @param {string} fallbackName - Name for fallback avatar
 * @returns {object} - Object with primary and fallback URLs
 */
export const getImageUrls = (imageUrl, fallbackName) => {
  return {
    primary: getSecureImageUrl(imageUrl),
    fallback: getFallbackAvatarUrl(fallbackName)
  };
};

/**
 * Debug function to log image URL transformations
 * @param {string} originalUrl - Original URL
 * @param {string} transformedUrl - Transformed URL
 */
export const debugImageUrl = (originalUrl, transformedUrl) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🖼️ Image URL Debug:', {
      original: originalUrl,
      transformed: transformedUrl,
      isHTTP: originalUrl?.startsWith('http://'),
      needsProxy: originalUrl?.startsWith('http://') && (originalUrl?.includes('165.227.111.160') || originalUrl?.includes('parkinginapinch.com'))
    });
  }
};