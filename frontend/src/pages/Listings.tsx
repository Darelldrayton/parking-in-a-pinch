import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  IconButton,
  Chip,
  Button,
  Stack,
  useTheme,
  alpha,
  Fade,
  Zoom,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Skeleton,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn,
  Star,
  Favorite,
  FavoriteBorder,
  FilterList,
  AttachMoney,
  DirectionsCar,
  Security,
  ElectricBolt,
  LocalParking,
  CheckCircle,
  AccessTime,
  Block,
  Schedule,
  MyLocation,
  Navigation,
} from '@mui/icons-material';
import type { ParkingListing, SearchFilters } from '../types/parking';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingsContext';
import toast from 'react-hot-toast';
import AdvancedFilters from '../components/search/AdvancedFilters';
import type { FilterOptions } from '../components/search/AdvancedFilters';
import SmartLocationSearch from '../components/search/SmartLocationSearch';
import { bookingsService, listingsService } from '../services/listings';
import { PrivateImage } from '../components/common/PrivateImage';
import { getListingDisplayLocation } from '../utils/locationUtils';

// Urban Manhattan parking images
const urbanParkingImages = [
  'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&h=300&fit=crop', // NYC parking garage
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=300&fit=crop', // Modern parking garage
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=300&fit=crop', // City street parking
  'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=400&h=300&fit=crop', // Urban parking structure
  'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=400&h=300&fit=crop', // Underground parking
  'https://images.unsplash.com/photo-1590534247854-e97d5e3feae6?w=400&h=300&fit=crop', // Parking meter street
];

interface Listing {
  id: number;
  title: string;
  description: string;
  address: string;
  space_type: string;
  hourly_rate: number;
  daily_rate: number;
  weekly_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images: any[];
  borough?: string;
  neighborhood?: string;
  max_vehicle_size?: string;
  is_covered?: boolean;
  has_ev_charging?: boolean;
  has_security?: boolean;
  latitude?: number;
  longitude?: number;
  distance?: number; // Calculated distance from user location
}

interface AvailabilityStatus {
  isChecking: boolean;
  isAvailable: boolean | null;
  nextAvailable?: string;
  lastChecked?: Date;
}

export default function Listings() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceFilter, setPriceFilter] = useState('');
  const [parkingTypeFilter, setParkingTypeFilter] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [availabilityStatuses, setAvailabilityStatuses] = useState<Record<number, AvailabilityStatus>>({});
  const [advancedFilters, setAdvancedFilters] = useState<FilterOptions>({
    priceRange: [0, 50],
    spaceTypes: [],
    amenities: [],
    vehicleTypes: [],
    availability: 'any',
    distance: 10,
    rating: 0,
    accessibleParking: false,
  });
  const [selectedBorough, setSelectedBorough] = useState<string>('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [lastAvailabilityCheck, setLastAvailabilityCheck] = useState<Date | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(false);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  }, []);

  // Get user's current location
  const getUserLocation = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
      );
    });
  };

  // Handle finding nearest listings
  const handleFindNearest = async () => {
    if (sortByDistance && userLocation) {
      // Already sorted by distance, turn off
      setSortByDistance(false);
      setUserLocation(null);
      toast.success('Showing all listings');
      return;
    }

    setIsGettingLocation(true);
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      setSortByDistance(true);
      toast.success('Listings sorted by distance from your location');
    } catch (error) {
      console.error('Error getting location:', error);
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out.');
            break;
          default:
            toast.error('An unknown error occurred while getting your location.');
            break;
        }
      } else {
        toast.error('Unable to get your location. Please try again.');
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Get search parameters from URL
  useEffect(() => {
    const location = searchParams.get('location');
    const filter = searchParams.get('filter');
    const available = searchParams.get('available');
    
    if (location) {
      setSearchQuery(location);
    }
    
    // Check for availability filter in URL
    if (filter === 'available' || available === 'true') {
      setShowOnlyAvailable(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadListings();
    loadFavorites();
  }, [user, selectedBorough, parkingTypeFilter, priceFilter, advancedFilters, searchQuery]);

  // Batch availability check for ALL listings when they load
  useEffect(() => {
    if (listings.length > 0) {
      checkAllAvailability();
    }
  }, [listings]);


  // Batch availability checking function
  const checkAllAvailability = async () => {
    console.log(`🔄 Checking availability for ${listings.length} listings in batch...`);
    
    // Set all listings to "checking" state
    const checkingStatuses: Record<number, AvailabilityStatus> = {};
    listings.forEach(listing => {
      checkingStatuses[listing.id] = {
        isChecking: true,
        isAvailable: null,
      };
    });
    setAvailabilityStatuses(checkingStatuses);

    // Prepare time range (5 minutes from now to 2 hours from now)
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);
    
    const startDate = fiveMinutesFromNow.toISOString().split('T')[0];
    const endDate = twoHoursFromNow.toISOString().split('T')[0];
    const startTime = fiveMinutesFromNow.toTimeString().slice(0, 5);
    const endTime = twoHoursFromNow.toTimeString().slice(0, 5);

    // Create promises for all availability checks
    const availabilityPromises = listings.map(listing => 
      bookingsService.checkAvailability(
        listing.id,
        startDate,
        endDate,
        startTime,
        endTime
      ).then(result => ({
        listingId: listing.id,
        available: result.available,
        success: true
      })).catch(error => {
        console.error(`Error checking availability for listing ${listing.id}:`, error);
        return {
          listingId: listing.id,
          available: null,
          success: false
        };
      })
    );

    try {
      // Execute all availability checks in parallel
      const results = await Promise.all(availabilityPromises);
      
      // Update all statuses at once
      const newStatuses: Record<number, AvailabilityStatus> = {};
      results.forEach(result => {
        newStatuses[result.listingId] = {
          isChecking: false,
          isAvailable: result.available,
          lastChecked: new Date(),
        };
      });
      
      setAvailabilityStatuses(newStatuses);
      setLastAvailabilityCheck(new Date());
      
      // Count results for user feedback
      const availableCount = results.filter(r => r.available === true).length;
      const bookedCount = results.filter(r => r.available === false).length;
      const errorCount = results.filter(r => !r.success).length;
      
      console.log(`✅ Availability check complete: ${availableCount} available, ${bookedCount} booked, ${errorCount} errors`);
      
      // Show subtle feedback to user (only for manual checks, not auto-refresh)
      if (availableCount > 0 && !lastAvailabilityCheck) {
        toast.success(`Found ${availableCount} available parking spaces`, { 
          duration: 3000,
          id: 'availability-batch-check' // Prevent duplicate toasts
        });
      }
      
    } catch (error) {
      console.error('Batch availability check failed:', error);
      
      // Reset all to unchecked state on failure
      const resetStatuses: Record<number, AvailabilityStatus> = {};
      listings.forEach(listing => {
        resetStatuses[listing.id] = {
          isChecking: false,
          isAvailable: null,
        };
      });
      setAvailabilityStatuses(resetStatuses);
    }
  };

  const loadFavorites = () => {
    if (user) {
      const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    }
  };

  const loadListings = async () => {
    setLoading(true);
    try {
      // Build comprehensive filters from current filter state
      const filters: SearchFilters = {};
      
      // Add search query to filters
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }
      
      if (selectedBorough) {
        filters.borough = selectedBorough;
      }
      
      if (parkingTypeFilter) {
        filters.parking_type = [parkingTypeFilter];
      }
      
      // Handle basic price filter
      if (priceFilter) {
        switch (priceFilter) {
          case 'under15':
            filters.max_price = 15;
            break;
          case '15to25':
            filters.min_price = 15;
            filters.max_price = 25;
            break;
          case 'over25':
            filters.min_price = 25;
            break;
        }
      }
      
      // Add advanced filters
      if (advancedFilters.priceRange[0] > 0 || advancedFilters.priceRange[1] < 50) {
        filters.min_price = advancedFilters.priceRange[0];
        filters.max_price = advancedFilters.priceRange[1];
      }
      
      if (advancedFilters.spaceTypes.length > 0) {
        filters.parking_type = advancedFilters.spaceTypes as any;
      }
      
      if (advancedFilters.amenities.length > 0) {
        filters.amenities = advancedFilters.amenities as any;
      }
      
      if (advancedFilters.vehicleTypes.length > 0) {
        filters.vehicle_type = advancedFilters.vehicleTypes[0] as any;
      }
      
      if (advancedFilters.availability === 'now') {
        filters.available_now = true;
      } else if (advancedFilters.availability === 'today') {
        filters.available_today = true;
      } else if (advancedFilters.availability === 'this_week') {
        filters.available_this_week = true;
      }
      
      if (advancedFilters.rating > 0) {
        filters.min_rating = advancedFilters.rating;
      }
      
      if (advancedFilters.accessibleParking) {
        filters.wheelchair_accessible = true;
      }
      
      if (advancedFilters.distance < 10) {
        filters.max_distance = advancedFilters.distance;
      }
      
      // Use listingsService with comprehensive filters
      const response = await listingsService.getListings(filters);
      console.log('Listings response:', response);
      console.log('First listing rating_average:', response.results[0]?.rating_average, typeof response.results[0]?.rating_average);
      
      if (response.results) {
        setListings(response.results);
        setTotalResults(response.count || response.results.length);
      } else {
        // Handle case where response is just an array
        setListings(response || []);
        setTotalResults((response || []).length);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      setListings([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Check availability for current time (next 2 hours)
  const checkCurrentAvailability = async (listingId: number, showToast: boolean = true) => {
    // Start from 5 minutes in the future to ensure it's valid but still "now"
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);
    
    const startDate = fiveMinutesFromNow.toISOString().split('T')[0];
    const endDate = twoHoursFromNow.toISOString().split('T')[0];
    const startTime = fiveMinutesFromNow.toTimeString().slice(0, 5);
    const endTime = twoHoursFromNow.toTimeString().slice(0, 5);

    // Update status to show we're checking
    setAvailabilityStatuses(prev => ({
      ...prev,
      [listingId]: {
        ...prev[listingId],
        isChecking: true,
      }
    }));

    try {
      const availabilityResult = await bookingsService.checkAvailability(
        listingId,
        startDate,
        endDate,
        startTime,
        endTime
      );

      setAvailabilityStatuses(prev => ({
        ...prev,
        [listingId]: {
          isChecking: false,
          isAvailable: availabilityResult.available,
          lastChecked: new Date(),
        }
      }));

      // Show a subtle toast for user feedback (only if requested)
      if (showToast) {
        if (availabilityResult.available) {
          toast.success(`Parking space is available now!`, { duration: 2000 });
        } else {
          toast.error(`Parking space is currently booked`, { duration: 2000 });
        }
      }

      return availabilityResult.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityStatuses(prev => ({
        ...prev,
        [listingId]: {
          isChecking: false,
          isAvailable: null,
          lastChecked: new Date(),
        }
      }));
      return null;
    }
  };

  // Handle hover to check availability
  const handleListingHover = async (listingId: number) => {
    const status = availabilityStatuses[listingId];
    
    // Only check if we haven't checked recently (within 5 minutes)
    if (!status || !status.lastChecked || 
        (new Date().getTime() - status.lastChecked.getTime()) > 5 * 60 * 1000) {
      await checkCurrentAvailability(listingId);
    }
  };

  // Get availability display info
  const getAvailabilityInfo = (listingId: number) => {
    const status = availabilityStatuses[listingId];
    const listing = listings.find(l => l.id === listingId);
    
    if (!listing?.is_active) {
      return {
        label: 'Inactive',
        color: 'error' as const,
        icon: <Block sx={{ fontSize: 16 }} />,
        bgColor: 'error.main',
      };
    }

    if (!status) {
      return {
        label: 'Check Availability',
        color: 'info' as const,
        icon: <Schedule sx={{ fontSize: 16 }} />,
        bgColor: 'info.main',
      };
    }

    if (status.isChecking) {
      return {
        label: 'Checking...',
        color: 'default' as const,
        icon: <CircularProgress size={16} />,
        bgColor: 'grey.400',
      };
    }

    if (status.isAvailable === true) {
      return {
        label: 'Available Now',
        color: 'success' as const,
        icon: <CheckCircle sx={{ fontSize: 16 }} />,
        bgColor: 'success.main',
      };
    }

    if (status.isAvailable === false) {
      return {
        label: 'Currently Booked',
        color: 'warning' as const,
        icon: <AccessTime sx={{ fontSize: 16 }} />,
        bgColor: 'warning.main',
      };
    }

    return {
      label: 'Check Availability',
      color: 'info' as const,
      icon: <Schedule sx={{ fontSize: 16 }} />,
      bgColor: 'info.main',
    };
  };

  // Client-side filtering for availability filter only (search is now handled server-side)
  const filteredListings = useMemo(() => {
    let filtered = listings.filter(listing => {
      // Availability filter
      if (showOnlyAvailable) {
        const availabilityStatus = availabilityStatuses[listing.id];
        return availabilityStatus?.isAvailable === true;
      }
      
      return true;
    });

    // Calculate distances and sort by distance if location-based sorting is enabled
    if (sortByDistance && userLocation) {
      filtered = filtered.map(listing => {
        if (listing.latitude && listing.longitude) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            listing.latitude,
            listing.longitude
          );
          return { ...listing, distance };
        }
        return { ...listing, distance: Infinity }; // Push listings without coordinates to the end
      }).sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    return filtered;
  }, [listings, showOnlyAvailable, availabilityStatuses, sortByDistance, userLocation, calculateDistance]);

  const handleHeartClick = (id: number) => {
    if (!user) {
      toast.error('Please login to view favorites');
      navigate('/login');
      return;
    }
    
    // Add to favorites if not already favorited, then navigate
    const wasFavorite = favorites.includes(id);
    if (!wasFavorite) {
      const newFavorites = [...favorites, id];
      setFavorites(newFavorites);
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(newFavorites));
      toast.success('Added to favorites');
    }
    
    // Navigate to favorites page
    navigate('/favorites');
  };

  const handleAvailableNowClick = () => {
    const newShowOnlyAvailable = !showOnlyAvailable;
    setShowOnlyAvailable(newShowOnlyAvailable);
    
    // Update URL parameters
    const newParams = new URLSearchParams(searchParams);
    if (newShowOnlyAvailable) {
      newParams.set('filter', 'available');
    } else {
      newParams.delete('filter');
      newParams.delete('available');
    }
    
    // Navigate with new parameters
    navigate(`/listings?${newParams.toString()}`, { replace: true });
    
    toast.success(
      newShowOnlyAvailable 
        ? 'Showing only available parking' 
        : 'Showing all parking spaces'
    );
  };

  const handleShowAll = () => {
    setShowOnlyAvailable(false);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('filter');
    newParams.delete('available');
    navigate(`/listings?${newParams.toString()}`, { replace: true });
    toast.success('Showing all parking spaces');
  };

  const handleShowAvailableOnly = () => {
    setShowOnlyAvailable(true);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('filter', 'available');
    navigate(`/listings?${newParams.toString()}`, { replace: true });
    toast.success('Showing only available parking');
  };

  const handleCardClick = (listingId: number) => {
    // Navigate to listing detail page when card is clicked
    navigate(`/listings/${listingId}`);
  };

  const getAmenityIcon = (listing: Listing) => {
    if (listing.has_ev_charging) return <ElectricBolt sx={{ fontSize: 16 }} />;
    if (listing.has_security) return <Security sx={{ fontSize: 16 }} />;
    if (listing.is_covered) return <DirectionsCar sx={{ fontSize: 16 }} />;
    return <LocalParking sx={{ fontSize: 16 }} />;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      pt: 4,
    }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" fontWeight={700} gutterBottom color="text.primary">
            Find Your Perfect Parking Spot
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" color="text.secondary">
              {showOnlyAvailable ? filteredListings.length : totalResults} parking spaces in New York City
              {showOnlyAvailable && (
                <Typography component="span" sx={{ ml: 1, fontWeight: 600, color: 'success.main' }}>
                  (Available only)
                </Typography>
              )}
              {searchQuery && !showOnlyAvailable && (
                <Typography component="span" sx={{ ml: 1, fontStyle: 'italic' }}>
                  for "{searchQuery}"
                </Typography>
              )}
            </Typography>
            {(() => {
              const availableCount = Object.values(availabilityStatuses).filter(status => status.isAvailable === true).length;
              const bookedCount = Object.values(availabilityStatuses).filter(status => status.isAvailable === false).length;
              const checkingCount = Object.values(availabilityStatuses).filter(status => status.isChecking).length;
              const checkedCount = availableCount + bookedCount;
              
              return (
                <>
                  <Typography variant="body2" color="text.secondary">•</Typography>
                  
                  {/* Availability Status */}
                  {checkingCount > 0 ? (
                    <Chip
                      icon={<CircularProgress size={12} sx={{ color: 'inherit' }} />}
                      label={`Checking ${checkingCount} listings...`}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: 'info.main',
                        fontWeight: 600,
                      }}
                    />
                  ) : (
                    <Chip
                      icon={<CheckCircle sx={{ fontSize: 16 }} />}
                      label={`${availableCount} Available Now`}
                      size="small"
                      clickable
                      onClick={handleAvailableNowClick}
                      sx={{
                        bgcolor: showOnlyAvailable 
                          ? 'success.main' 
                          : alpha(theme.palette.success.main, 0.1),
                        color: showOnlyAvailable ? 'white' : 'success.main',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: showOnlyAvailable 
                            ? 'success.dark' 
                            : alpha(theme.palette.success.main, 0.2),
                          transform: 'translateY(-1px)',
                          boxShadow: theme.shadows[4],
                        },
                        '& .MuiChip-icon': { 
                          color: showOnlyAvailable ? 'white' : 'success.main'
                        }
                      }}
                    />
                  )}
                  
                  {/* Booked Count */}
                  {bookedCount > 0 && (
                    <Chip
                      icon={<AccessTime sx={{ fontSize: 16 }} />}
                      label={`${bookedCount} Booked`}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        color: 'warning.main',
                        fontWeight: 600,
                        '& .MuiChip-icon': { color: 'warning.main' }
                      }}
                    />
                  )}
                  
                  
                  {/* Last Check Time */}
                  {lastAvailabilityCheck && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      Last updated: {lastAvailabilityCheck.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  )}
                </>
              );
            })()}
          </Stack>
        </Box>

        {/* Search and Filters */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 5 }}>
              <SmartLocationSearch
                value={searchQuery}
                onChange={(value, selectedLocation) => {
                  setSearchQuery(value);
                  if (value) {
                    // Clear borough filter when searching to avoid backend conflict
                    setSelectedBorough('');
                    setSelectedNeighborhood('');
                  }
                  if (selectedLocation) {
                    if (selectedLocation.type === 'borough') {
                      setSelectedBorough(selectedLocation.borough || '');
                      setSelectedNeighborhood('');
                    } else if (selectedLocation.type === 'neighborhood') {
                      setSelectedBorough(selectedLocation.borough || '');
                      setSelectedNeighborhood(selectedLocation.neighborhood || '');
                    }
                  } else {
                    // Clear selections if search is cleared
                    if (!value) {
                      setSelectedBorough('');
                      setSelectedNeighborhood('');
                    }
                  }
                }}
                placeholder="Search by borough, neighborhood, or address..."
                onBoroughSelect={(borough) => {
                  setSelectedBorough(borough);
                  setSelectedNeighborhood('');
                }}
                onNeighborhoodSelect={(borough, neighborhood) => {
                  setSelectedBorough(borough);
                  setSelectedNeighborhood(neighborhood);
                }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Parking Type</InputLabel>
                <Select
                  value={parkingTypeFilter}
                  onChange={(e) => setParkingTypeFilter(e.target.value)}
                  label="Parking Type"
                  sx={{ 
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : 'transparent',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? theme.palette.divider : undefined,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="garage">Garage</MenuItem>
                  <MenuItem value="street">Street</MenuItem>
                  <MenuItem value="lot">Lot</MenuItem>
                  <MenuItem value="driveway">Driveway</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, md: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Price Range</InputLabel>
                <Select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  label="Price Range"
                  sx={{ 
                    borderRadius: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : 'transparent',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? theme.palette.divider : undefined,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <MenuItem value="">All Prices</MenuItem>
                  <MenuItem value="under15">Under $15/hr</MenuItem>
                  <MenuItem value="15to25">$15-25/hr</MenuItem>
                  <MenuItem value="over25">Over $25/hr</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, md: 1 }}>
              <Button
                fullWidth
                variant={advancedFilters.availability === 'now' ? 'contained' : 'outlined'}
                startIcon={<CheckCircle />}
                onClick={() => {
                  setAdvancedFilters(prev => ({
                    ...prev,
                    availability: prev.availability === 'now' ? 'any' : 'now'
                  }));
                }}
                sx={{ 
                  height: '56px',
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.success.main, 0.3),
                  '&:hover': {
                    borderColor: theme.palette.success.main,
                    backgroundColor: alpha(theme.palette.success.main, 0.05),
                  },
                }}
              >
                Available
              </Button>
            </Grid>
            <Grid size={{ xs: 6, md: 1 }}>
              <Button
                fullWidth
                variant={sortByDistance ? 'contained' : 'outlined'}
                startIcon={isGettingLocation ? <CircularProgress size={16} /> : (sortByDistance ? <Navigation /> : <MyLocation />)}
                onClick={handleFindNearest}
                disabled={isGettingLocation}
                sx={{ 
                  height: '56px',
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.secondary.main, 0.3),
                  color: sortByDistance ? 'white' : 'secondary.main',
                  bgcolor: sortByDistance ? 'secondary.main' : 'transparent',
                  '&:hover': {
                    borderColor: theme.palette.secondary.main,
                    backgroundColor: sortByDistance 
                      ? theme.palette.secondary.dark 
                      : alpha(theme.palette.secondary.main, 0.05),
                  },
                  '&:disabled': {
                    borderColor: alpha(theme.palette.secondary.main, 0.2),
                    color: alpha(theme.palette.secondary.main, 0.5),
                  },
                }}
              >
                {isGettingLocation ? 'Getting...' : (sortByDistance ? 'Nearest' : 'Nearest')}
              </Button>
            </Grid>
            <Grid size={{ xs: 6, md: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFiltersOpen(true)}
                sx={{ 
                  height: '56px',
                  borderRadius: 2,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Filter Toggle Buttons */}
        {showOnlyAvailable && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
              bgcolor: alpha(theme.palette.success.main, 0.05),
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
              <Typography variant="body2" color="success.main" fontWeight={600}>
                Showing only available parking spaces
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleShowAll}
                sx={{
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': {
                    borderColor: 'success.dark',
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                  },
                }}
              >
                Show All
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Distance Sort Banner */}
        {sortByDistance && userLocation && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              mb:  3, 
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
              bgcolor: alpha(theme.palette.secondary.main, 0.05),
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
              <Navigation sx={{ color: 'secondary.main', fontSize: 20 }} />
              <Typography variant="body2" color="secondary.main" fontWeight={600}>
                Listings sorted by distance from your current location
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSortByDistance(false);
                  setUserLocation(null);
                  toast.success('Distance sorting disabled');
                }}
                sx={{
                  borderColor: 'secondary.main',
                  color: 'secondary.main',
                  '&:hover': {
                    borderColor: 'secondary.dark',
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  },
                }}
              >
                Clear Sort
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Listings Grid */}
        <Grid container spacing={3}>
          {loading ? (
            [...Array(6)].map((_, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={i}>
                <Card sx={{ height: '100%' }}>
                  <Skeleton variant="rectangular" height={240} />
                  <CardContent>
                    <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} />
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            filteredListings.map((listing, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={listing.id}>
                <Zoom in timeout={300 + index * 100}>
                  <Card 
                    onClick={() => handleCardClick(listing.id)}
                    onMouseEnter={() => handleListingHover(listing.id)}
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <PrivateImage
                        listing={listing}
                        height="240"
                        alt={listing.title}
                        showPrivacyIndicator={true}
                        sx={{ 
                          objectFit: 'cover',
                          filter: 'brightness(0.95)',
                        }}
                      />
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click when favorite is clicked
                          handleHeartClick(listing.id);
                        }}
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          bgcolor: 'white',
                          backdropFilter: 'blur(10px)',
                          '&:hover': {
                            bgcolor: 'white',
                            transform: 'scale(1.1)',
                          },
                        }}
                        size="small"
                      >
                        {favorites.includes(listing.id) ? (
                          <Favorite sx={{ color: 'error.main', fontSize: 20 }} />
                        ) : (
                          <FavoriteBorder sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                      {(() => {
                        const availabilityInfo = getAvailabilityInfo(listing.id);
                        return (
                          <Chip
                            icon={availabilityInfo.icon}
                            label={availabilityInfo.label}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 12,
                              left: 8,
                              bgcolor: availabilityInfo.bgColor,
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              '& .MuiChip-icon': {
                                color: 'white',
                              },
                            }}
                          />
                        );
                      })()}
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Stack spacing={1.5}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography 
                            variant="h6" 
                            fontWeight={600} 
                            color="text.primary"
                            sx={{ 
                              fontSize: '1.1rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.3,
                              flex: 1,
                              mr: 1,
                            }}
                          >
                            {listing.title}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                              {(() => {
                                // Check if listing was created within the last 30 days
                                const thirtyDaysAgo = new Date();
                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                const createdDate = new Date(listing.created_at);
                                const isNewListing = createdDate > thirtyDaysAgo;
                                
                                // Show "New" if created within 30 days and no reviews, otherwise show rating
                                const ratingValue = (() => {
                                  const rating = listing.rating_average;
                                  if (rating === null || rating === undefined) return 0;
                                  if (typeof rating === 'number') return rating;
                                  const parsed = parseFloat(rating);
                                  return isNaN(parsed) ? 0 : parsed;
                                })();
                                
                                if (isNewListing && ratingValue === 0) {
                                  return 'New';
                                } else if (ratingValue > 0) {
                                  return ratingValue.toFixed(1);
                                } else {
                                  // Older than 30 days with no reviews - show dash instead of "New"
                                  return '—';
                                }
                              })()}
                            </Typography>
                            {(listing.total_reviews || 0) > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                ({listing.total_reviews || 0})
                              </Typography>
                            )}
                          </Stack>
                        </Box>

                        <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {listing.is_instant_book && (
                            <Chip
                              icon={<CheckCircle sx={{ fontSize: 16 }} />}
                              label="Instant Book"
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.success.main, 0.1),
                                color: 'success.main',
                                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                                fontWeight: 600,
                                '& .MuiChip-icon': {
                                  color: 'success.main',
                                }
                              }}
                            />
                          )}
                          
                          {(() => {
                            const availabilityInfo = getAvailabilityInfo(listing.id);
                            const status = availabilityStatuses[listing.id];
                            
                            // Always show availability info (clickable if not checked)
                            return (
                              <Chip
                                icon={availabilityInfo.icon}
                                label={availabilityInfo.label}
                                size="small"
                                variant="outlined"
                                clickable={!status || !status.lastChecked}
                                onClick={(e) => {
                                  if (!status || !status.lastChecked) {
                                    e.stopPropagation(); // Prevent card click
                                    checkCurrentAvailability(listing.id);
                                  }
                                }}
                                sx={{
                                  bgcolor: alpha(theme.palette[availabilityInfo.color]?.main || theme.palette.primary.main, 0.1),
                                  color: `${availabilityInfo.color}.main`,
                                  borderColor: alpha(theme.palette[availabilityInfo.color]?.main || theme.palette.primary.main, 0.3),
                                  fontWeight: 600,
                                  cursor: (!status || !status.lastChecked) ? 'pointer' : 'default',
                                  '& .MuiChip-icon': {
                                    color: `${availabilityInfo.color}.main`,
                                  },
                                  '&:hover': (!status || !status.lastChecked) ? {
                                    bgcolor: alpha(theme.palette[availabilityInfo.color]?.main || theme.palette.primary.main, 0.2),
                                  } : {},
                                }}
                              />
                            );
                          })()}
                        </Box>

                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {getListingDisplayLocation(
                              listing.address || '',
                              listing.borough || 'NYC',
                              listing.neighborhood
                            )} • {listing.space_type}
                            {sortByDistance && listing.distance !== undefined && listing.distance !== Infinity && (
                              <Typography component="span" sx={{ ml: 1, fontWeight: 600, color: 'secondary.main' }}>
                                • {listing.distance.toFixed(1)} mi away
                              </Typography>
                            )}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center">
                          {getAmenityIcon(listing)}
                          <Typography variant="caption" color="text.secondary">
                            {listing.has_ev_charging && 'EV Charging • '}
                            {listing.has_security && 'Security • '}
                            {listing.is_covered ? 'Covered' : 'Outdoor'}
                          </Typography>
                        </Stack>

                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'baseline',
                          mt: 'auto',
                          pt: 1,
                        }}>
                          <Box>
                            <Typography variant="h6" component="span" fontWeight={700} >
                              ${listing.hourly_rate}
                            </Typography>
                            <Typography variant="body2" component="span" color="text.secondary">
                              /hour
                            </Typography>
                          </Box>
                          {listing.daily_rate > 0 && (
                            <Typography variant="caption" color="text.secondary">
                              ${listing.daily_rate}/day
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Zoom>
              </Grid>
            ))
          )}
        </Grid>

        {/* Empty State */}
        {filteredListings.length === 0 && !loading && (
          <Paper 
            elevation={0} 
            sx={{ 
              py: 8, 
              px: 4, 
              textAlign: 'center',
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <LocationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              No parking spaces found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Try adjusting your search filters or browse all available listings
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => {
                setSearchQuery('');
                setPriceFilter('');
                setParkingTypeFilter('');
                setSelectedBorough('');
                setSelectedNeighborhood('');
                setAdvancedFilters({
                  priceRange: [0, 50],
                  spaceTypes: [],
                  amenities: [],
                  vehicleTypes: [],
                  availability: 'any',
                  distance: 10,
                  rating: 0,
                  accessibleParking: false,
                });
              }}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              }}
            >
              Clear Filters
            </Button>
          </Paper>
        )}
      </Container>

      {/* Advanced Filters Drawer */}
      <AdvancedFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onApplyFilters={() => {
          // Filters are automatically applied via state change
          loadListings(); // Reload listings with new filters
          toast.success('Filters applied successfully');
        }}
        onClearFilters={() => {
          setAdvancedFilters({
            priceRange: [0, 50],
            spaceTypes: [],
            amenities: [],
            vehicleTypes: [],
            availability: 'any',
            distance: 10,
            rating: 0,
            accessibleParking: false,
          });
          loadListings(); // Reload listings without filters
          toast.success('Filters cleared');
        }}
      />
    </Box>
  );
}