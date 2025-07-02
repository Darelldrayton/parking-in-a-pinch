# Verify Location Button - Maps Integration Implementation Guide

## Overview
Replace the current 'Verify Location' button functionality to directly launch the user's default maps app with turn-by-turn directions to the parking location.

## Backend Changes (Already Completed)
The booking serializer has been updated to include coordinates:
- `parking_space_latitude`: Decimal field with parking location latitude
- `parking_space_longitude`: Decimal field with parking location longitude

## Frontend Implementation

### 1. Update the Verify Location Button Handler

Replace the current button handler with this implementation:

```javascript
const handleVerifyLocation = () => {
  const { parking_space_latitude, parking_space_longitude, parking_space_address } = booking;
  
  if (!parking_space_latitude || !parking_space_longitude) {
    // Show error if coordinates are not available
    alert('Location coordinates not available for this booking');
    return;
  }

  // Get user's current location for directions
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        openMapsWithDirections(userLat, userLng, parking_space_latitude, parking_space_longitude, parking_space_address);
      },
      (error) => {
        // If can't get user location, just open the destination
        openMapsAtLocation(parking_space_latitude, parking_space_longitude, parking_space_address);
      }
    );
  } else {
    // Fallback if geolocation not supported
    openMapsAtLocation(parking_space_latitude, parking_space_longitude, parking_space_address);
  }
};
```

### 2. Platform-Specific Maps Implementation

```javascript
const openMapsWithDirections = (userLat, userLng, destLat, destLng, address) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (isIOS) {
    // Apple Maps with directions
    const appleMapsUrl = `maps://maps.apple.com/?saddr=${userLat},${userLng}&daddr=${destLat},${destLng}&dirflg=d`;
    
    // Try to open Apple Maps
    window.location.href = appleMapsUrl;
    
    // Fallback to Apple Maps web version if app doesn't open
    setTimeout(() => {
      if (document.hasFocus()) {
        window.open(`https://maps.apple.com/?saddr=${userLat},${userLng}&daddr=${destLat},${destLng}&dirflg=d`, '_blank');
      }
    }, 1000);
    
  } else if (isAndroid) {
    // Google Maps intent for Android
    const googleMapsIntent = `intent://maps.google.com/?saddr=${userLat},${userLng}&daddr=${destLat},${destLng}&mode=driving#Intent;scheme=https;package=com.google.android.apps.maps;end`;
    
    window.location.href = googleMapsIntent;
    
    // Fallback to Google Maps web if app doesn't open
    setTimeout(() => {
      if (document.hasFocus()) {
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`, '_blank');
      }
    }, 1000);
    
  } else {
    // Desktop or other platforms - use Google Maps web
    window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${destLat},${destLng}&travelmode=driving`, '_blank');
  }
};

const openMapsAtLocation = (lat, lng, address) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isAndroid = /Android/.test(navigator.userAgent);
  
  if (isIOS) {
    // Apple Maps without directions (just show location)
    const appleMapsUrl = `maps://maps.apple.com/?q=${encodeURIComponent(address)}&ll=${lat},${lng}`;
    
    window.location.href = appleMapsUrl;
    
    setTimeout(() => {
      if (document.hasFocus()) {
        window.open(`https://maps.apple.com/?q=${lat},${lng}`, '_blank');
      }
    }, 1000);
    
  } else if (isAndroid) {
    // Google Maps for Android (just show location)
    const googleMapsUrl = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(address)})`;
    
    window.location.href = googleMapsUrl;
    
    setTimeout(() => {
      if (document.hasFocus()) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
      }
    }, 1000);
    
  } else {
    // Desktop - Google Maps
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  }
};
```

### 3. React Component Example

```jsx
import React from 'react';
import { Button } from '@mui/material';
import NavigationIcon from '@mui/icons-material/Navigation';

const BookingDetail = ({ booking }) => {
  const handleVerifyLocation = () => {
    const { parking_space_latitude, parking_space_longitude, parking_space_address } = booking;
    
    if (!parking_space_latitude || !parking_space_longitude) {
      // Could use a toast/snackbar instead of alert
      alert('Location coordinates not available for this booking');
      return;
    }

    // Get user's current location for directions
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          openMapsWithDirections(userLat, userLng, parking_space_latitude, parking_space_longitude, parking_space_address);
        },
        (error) => {
          // If can't get user location, just open the destination
          console.log('Geolocation error:', error);
          openMapsAtLocation(parking_space_latitude, parking_space_longitude, parking_space_address);
        },
        {
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      openMapsAtLocation(parking_space_latitude, parking_space_longitude, parking_space_address);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<NavigationIcon />}
      onClick={handleVerifyLocation}
      fullWidth
    >
      Get Directions
    </Button>
  );
};
```

### 4. Waze Integration

Add Waze as an option for users who prefer it:

```javascript
const openWazeWithDirections = (destLat, destLng, address) => {
  // Waze URL scheme works on both iOS and Android
  const wazeUrl = `waze://?ll=${destLat},${destLng}&navigate=yes`;
  const wazeWebUrl = `https://www.waze.com/ul?ll=${destLat},${destLng}&navigate=yes&zoom=17`;
  
  // Try to open Waze app
  window.location.href = wazeUrl;
  
  // Fallback to Waze web if app doesn't open
  setTimeout(() => {
    if (document.hasFocus()) {
      window.open(wazeWebUrl, '_blank');
    }
  }, 1000);
};

// Updated implementation with user choice
const handleVerifyLocationWithChoice = () => {
  const { parking_space_latitude, parking_space_longitude, parking_space_address } = booking;
  
  if (!parking_space_latitude || !parking_space_longitude) {
    alert('Location coordinates not available');
    return;
  }

  // You could show a modal/dialog to let user choose their preferred app
  // For automatic selection based on what's likely installed:
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  // Check if user has preference stored
  const userPreferredMap = localStorage.getItem('preferredMapApp') || 'auto';
  
  if (userPreferredMap === 'waze') {
    openWazeWithDirections(parking_space_latitude, parking_space_longitude, parking_space_address);
  } else if (userPreferredMap === 'auto') {
    // Auto-detect based on platform
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          openMapsWithDirections(userLat, userLng, parking_space_latitude, parking_space_longitude, parking_space_address);
        },
        () => {
          openMapsAtLocation(parking_space_latitude, parking_space_longitude, parking_space_address);
        }
      );
    }
  }
};
```

### 5. Multi-App Selector Implementation

For a better user experience, you could implement a selector that lets users choose their preferred maps app:

```javascript
import React, { useState } from 'react';
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import NavigationIcon from '@mui/icons-material/Navigation';
import AppleIcon from '@mui/icons-material/Apple';
import AndroidIcon from '@mui/icons-material/Android';

const MapAppSelector = ({ booking }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { parking_space_latitude: lat, parking_space_longitude: lng, parking_space_address: address } = booking;

  const handleClick = (event) => {
    if (!lat || !lng) {
      alert('Location coordinates not available');
      return;
    }
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const openInAppleMaps = () => {
    const url = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    window.open(url, '_blank');
    handleClose();
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
    handleClose();
  };

  const openInWaze = () => {
    const wazeUrl = `https://www.waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(wazeUrl, '_blank');
    handleClose();
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<NavigationIcon />}
        onClick={handleClick}
        fullWidth
      >
        Get Directions
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={openInAppleMaps}>
          <ListItemIcon>
            <AppleIcon />
          </ListItemIcon>
          <ListItemText primary="Apple Maps" />
        </MenuItem>
        <MenuItem onClick={openInGoogleMaps}>
          <ListItemIcon>
            <AndroidIcon />
          </ListItemIcon>
          <ListItemText primary="Google Maps" />
        </MenuItem>
        <MenuItem onClick={openInWaze}>
          <ListItemIcon>
            <NavigationIcon />
          </ListItemIcon>
          <ListItemText primary="Waze" />
        </MenuItem>
      </Menu>
    </>
  );
};
```

### 6. Alternative Implementation (Using Map URLs Only)

If you prefer a simpler implementation without trying native app intents:

```javascript
const handleVerifyLocationSimple = () => {
  const { parking_space_latitude, parking_space_longitude } = booking;
  
  if (!parking_space_latitude || !parking_space_longitude) {
    alert('Location coordinates not available');
    return;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  // Use Apple Maps for iOS devices, Google Maps for everything else
  const mapsUrl = isIOS
    ? `https://maps.apple.com/?daddr=${parking_space_latitude},${parking_space_longitude}&dirflg=d`
    : `https://www.google.com/maps/dir/?api=1&destination=${parking_space_latitude},${parking_space_longitude}&travelmode=driving`;
  
  window.open(mapsUrl, '_blank');
};
```

## Testing Instructions

1. **Test on iOS Device:**
   - Click button should open Apple Maps app with directions
   - If Apple Maps not installed, should open web version

2. **Test on Android Device:**
   - Click button should open Google Maps app with directions
   - If Google Maps not installed, should open web version

3. **Test on Desktop:**
   - Should open Google Maps in new browser tab

4. **Test with missing coordinates:**
   - Should show appropriate error message

5. **Test with location permissions denied:**
   - Should still open maps at destination (without directions)

## Notes

- The implementation requests user's location to provide turn-by-turn directions
- Falls back gracefully if location access is denied
- Uses platform-specific URL schemes for better native app integration
- Includes timeouts to detect if native app didn't open and falls back to web version
- Consider adding loading states while getting user location
- Consider using a toast/snackbar for error messages instead of alerts