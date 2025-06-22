import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import { LocationOn } from '@mui/icons-material';

interface ParkingSpot {
  id: number;
  lat: number;
  lng: number;
  title: string;
  price: number;
  availability: 'available' | 'limited' | 'booked';
}

// Sample parking spots data
const sampleParkingSpots: ParkingSpot[] = [
  {
    id: 1,
    lat: 40.7589,
    lng: -73.9851,
    title: 'Midtown Garage',
    price: 15,
    availability: 'available'
  },
  {
    id: 2,
    lat: 40.7505,
    lng: -73.9934,
    title: 'Times Square Parking',
    price: 25,
    availability: 'limited'
  },
  {
    id: 3,
    lat: 40.7614,
    lng: -73.9776,
    title: 'Central Park East',
    price: 20,
    availability: 'available'
  },
  {
    id: 4,
    lat: 40.7282,
    lng: -73.9942,
    title: 'SoHo Street Parking',
    price: 12,
    availability: 'booked'
  },
  {
    id: 5,
    lat: 40.7831,
    lng: -73.9712,
    title: 'Upper East Side',
    price: 18,
    availability: 'available'
  }
];

const InteractiveMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const getMarkerColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return '#4CAF50'; // Green
      case 'limited':
        return '#FF9800'; // Orange
      case 'booked':
        return '#F44336'; // Red
      default:
        return '#2196F3'; // Blue
    }
  };

  const createMarkerElement = (spot: ParkingSpot) => {
    const markerElement = document.createElement('div');
    markerElement.style.width = '24px';
    markerElement.style.height = '24px';
    markerElement.style.borderRadius = '50%';
    markerElement.style.backgroundColor = getMarkerColor(spot.availability);
    markerElement.style.border = '2px solid white';
    markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    markerElement.style.cursor = 'pointer';
    markerElement.style.display = 'flex';
    markerElement.style.alignItems = 'center';
    markerElement.style.justifyContent = 'center';
    markerElement.style.fontSize = '12px';
    markerElement.style.color = 'white';
    markerElement.style.fontWeight = 'bold';
    markerElement.textContent = '$' + spot.price;
    return markerElement;
  };

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.google) return;

      // Initialize map centered on Manhattan, NYC
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 40.7589, lng: -73.9851 }, // Manhattan center
        zoom: 13,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry.fill',
            stylers: [{ color: '#f5f5f5' }]
          },
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#e0e7ff' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }]
          }
        ],
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add parking spot markers using AdvancedMarkerElement if available, fallback to Marker
      sampleParkingSpots.forEach(spot => {
        try {
          // Try to use the new AdvancedMarkerElement
          if (window.google.maps.marker && window.google.maps.marker.AdvancedMarkerElement) {
            const markerElement = createMarkerElement(spot);
            
            const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
              map: map,
              position: { lat: spot.lat, lng: spot.lng },
              content: markerElement,
              title: spot.title,
            });

            // Create info window
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; color: #7C3AED; font-size: 16px;">${spot.title}</h3>
                  <p style="margin: 4px 0; color: #666; font-size: 14px;">$${spot.price}/hour</p>
                  <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${getMarkerColor(spot.availability)};"></div>
                    <span style="font-size: 12px; text-transform: capitalize; color: #666;">
                      ${spot.availability === 'booked' ? 'Fully Booked' : 
                        spot.availability === 'limited' ? 'Limited Availability' : 'Available'}
                    </span>
                  </div>
                </div>
              `
            });

            advancedMarker.addListener('click', () => {
              infoWindow.open(map, advancedMarker);
            });

            // Store in markersRef for cleanup (cast to any to avoid type issues)
            markersRef.current.push(advancedMarker as any);
          } else {
            // Fallback to legacy Marker
            const marker = new google.maps.Marker({
              position: { lat: spot.lat, lng: spot.lng },
              map: map,
              title: spot.title,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: getMarkerColor(spot.availability),
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }
            });

            // Create info window
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="padding: 8px; min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; color: #7C3AED; font-size: 16px;">${spot.title}</h3>
                  <p style="margin: 4px 0; color: #666; font-size: 14px;">$${spot.price}/hour</p>
                  <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${getMarkerColor(spot.availability)};"></div>
                    <span style="font-size: 12px; text-transform: capitalize; color: #666;">
                      ${spot.availability === 'booked' ? 'Fully Booked' : 
                        spot.availability === 'limited' ? 'Limited Availability' : 'Available'}
                    </span>
                  </div>
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            markersRef.current.push(marker);
          }
        } catch (error) {
          console.warn('Error creating marker for spot:', spot.title, error);
        }
      });

      setIsLoaded(true);
    };

    // Check if Google Maps is already loaded
    const initializeMap = () => {
      if (window.google && window.google.maps) {
        initMap();
        return true;
      }
      return false;
    };

    if (!initializeMap()) {
      // Wait for Google Maps to load with proper error handling
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds max
      
      const checkGoogleMaps = setInterval(() => {
        attempts++;
        if (initializeMap()) {
          clearInterval(checkGoogleMaps);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkGoogleMaps);
          console.error('Google Maps failed to load after 10 seconds');
          setIsLoaded(false);
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }

    return () => {
      // Cleanup markers on unmount
      markersRef.current.forEach(marker => marker.setMap(null));
    };
  }, []);

  // Show loading state or error state
  if (!isLoaded || !window.google || !window.google.maps) {
    const isApiKeyError = window.location.search.includes('YOUR_API_KEY') || 
                         document.querySelector('script[src*="YOUR_API_KEY"]');
    
    return (
      <Box
        sx={{
          height: 450,
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid #e0e0e0',
          boxShadow: 4,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <LocationOn sx={{ fontSize: 60, mb: 2, opacity: 0.8 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            {isApiKeyError ? 'Configure Google Maps API Key' : 'Loading Interactive Map...'}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
            {isApiKeyError 
              ? 'Please replace YOUR_API_KEY with your actual Google Maps API key'
              : 'Initializing map with parking locations...'
            }
          </Typography>
          
          <Stack direction="row" spacing={3} justifyContent="center" flexWrap="wrap">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: '#4CAF50' 
              }} />
              <Typography variant="body2">Available Spots</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: '#FF9800' 
              }} />
              <Typography variant="body2">Limited Availability</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                bgcolor: '#F44336' 
              }} />
              <Typography variant="body2">Fully Booked</Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        height: 450,
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid #e0e0e0',
        boxShadow: 4,
      }}
    >
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '12px',
        }}
      />
      
      {/* Legend overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          bgcolor: 'white',
          borderRadius: 2,
          p: 2,
          boxShadow: 2,
          border: '1px solid #e0e0e0',
        }}
      >
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
          Parking Availability
        </Typography>
        <Stack spacing={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              bgcolor: '#4CAF50' 
            }} />
            <Typography variant="caption">Available</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              bgcolor: '#FF9800' 
            }} />
            <Typography variant="caption">Limited</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              width: 10, 
              height: 10, 
              borderRadius: '50%', 
              bgcolor: '#F44336' 
            }} />
            <Typography variant="caption">Booked</Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default InteractiveMap;