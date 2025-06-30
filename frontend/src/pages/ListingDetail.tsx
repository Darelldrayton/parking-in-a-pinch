import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Stack,
  Chip,
  IconButton,
  Paper,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Fade,
  LinearProgress,
  ImageList,
  ImageListItem,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Breadcrumbs,
  Link,
  Rating,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  AttachMoney,
  Schedule,
  Star,
  Security,
  ElectricBolt,
  LocalParking,
  DirectionsCar,
  Accessible,
  LocalCarWash,
  PersonPin,
  Lightbulb,
  Videocam,
  Lock,
  CheckCircle,
  Cancel,
  Phone,
  Email,
  Message,
  Favorite,
  FavoriteBorder,
  Share,
  NavigateNext,
  CalendarToday,
  AccessTime,
  Info,
  Warning,
  NightShelter,
  WbSunny,
  Garage,
  Landscape,
  Traffic,
  Home,
  Block,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingsContext';
import { formatAddressForDisplay, getMapDisplayCoordinates, getMapZoomLevel } from '../utils/locationUtils';
import { PrivateImageGallery } from '../components/common/PrivateImage';
import GoogleMap from '../components/maps/GoogleMap';
import { bookingsService } from '../services/listings';
import toast from 'react-hot-toast';

interface Listing {
  id: number;
  title: string;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  borough: string;
  space_type: string;
  hourly_rate: number;
  daily_rate: number;
  weekly_rate: number;
  is_covered: boolean;
  has_ev_charging: boolean;
  has_security: boolean;
  has_lighting?: boolean;
  has_cctv?: boolean;
  has_gated_access?: boolean;
  is_handicap_accessible?: boolean;
  has_valet_service?: boolean;
  has_car_wash?: boolean;
  is_instant_book?: boolean;
  max_vehicle_size: string;
  instructions: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  availability_schedule?: {
    [key: string]: {
      available: boolean;
      start: string;
      end: string;
    };
  };
  images: Array<{
    id: number;
    image_url: string;
    alt_text: string;
    display_order: number;
  }>;
  host?: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  rating_average?: number;
  total_reviews?: number;
}

interface AvailabilityStatus {
  isChecking: boolean;
  isAvailable: boolean | null;
  reason?: string;
  lastChecked?: Date;
}

const parkingTypeIcons: Record<string, React.ReactNode> = {
  garage: <Garage />,
  driveway: <Home />,
  lot: <LocalParking />,
  street: <Traffic />,
  covered: <NightShelter />,
};

const vehicleTypeLabels: Record<string, string> = {
  car: 'Car',
  suv: 'SUV',
  truck: 'Truck',
  van: 'Van',
  motorcycle: 'Motorcycle',
};

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const { bookings: contextBookings } = useBookings();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [availabilitySchedule, setAvailabilitySchedule] = useState<any>(null);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>({
    isChecking: false,
    isAvailable: null
  });
  const [reviewData, setReviewData] = useState({
    overall_rating: 0,
    cleanliness_rating: 0,
    location_rating: 0,
    value_rating: 0,
    communication_rating: 0,
    title: '',
    comment: ''
  });

  useEffect(() => {
    if (id) {
      loadListing();
      loadReviews();
      checkIfFavorite();
      if (user) {
        loadUserBookings();
      }
    }
  }, [id, user]);

  // Check availability after listing loads
  useEffect(() => {
    if (listing && listing.id) {
      checkCurrentAvailability();
    }
  }, [listing]);

  // Reload user bookings when context bookings change (for address privacy updates)
  useEffect(() => {
    if (user && id) {
      loadUserBookings();
    }
  }, [contextBookings]);

  const checkIfFavorite = () => {
    if (user && id) {
      const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
      if (storedFavorites) {
        const favoriteIds = JSON.parse(storedFavorites);
        setIsFavorite(favoriteIds.includes(parseInt(id)));
      }
    }
  };

  const loadListing = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/listings/${id}/`);
      console.log('Listing detail response:', response.data);
      setListing(response.data);
    } catch (error) {
      console.error('Error loading listing:', error);
      toast.error('Failed to load listing details');
      navigate('/listings');
    } finally {
      setLoading(false);
    }
  };

  // Check availability for current time (next 2 hours)
  const checkCurrentAvailability = async () => {
    if (!listing?.id) return;

    // Start from 5 minutes in the future to ensure it's valid but still "now"
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);
    
    const startDate = fiveMinutesFromNow.toISOString().split('T')[0];
    const endDate = twoHoursFromNow.toISOString().split('T')[0];
    const startTime = fiveMinutesFromNow.toTimeString().slice(0, 5);
    const endTime = twoHoursFromNow.toTimeString().slice(0, 5);

    // Update status to show we're checking
    setAvailabilityStatus(prev => ({
      ...prev,
      isChecking: true,
    }));

    try {
      const availabilityResult = await bookingsService.checkAvailability(
        listing.id,
        startDate,
        endDate,
        startTime,
        endTime
      );

      setAvailabilityStatus({
        isChecking: false,
        isAvailable: availabilityResult.available,
        reason: availabilityResult.reason,
        lastChecked: new Date(),
      });

    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityStatus({
        isChecking: false,
        isAvailable: null,
        lastChecked: new Date(),
      });
    }
  };

  const loadUserBookings = async () => {
    if (!user || !id) return;
    
    try {
      const response = await api.get('/bookings/bookings/', {
        params: {
          parking_space: id
        }
      });
      setUserBookings(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading user bookings:', error);
    }
  };

  const hasConfirmedBooking = () => {
    return userBookings.some(booking => 
      booking.guest?.id === user?.id && 
      ['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(booking.status)
    );
  };

  const hasCheckedIn = () => {
    return userBookings.some(booking => 
      booking.guest?.id === user?.id && 
      ['ACTIVE', 'COMPLETED'].includes(booking.status)
    );
  };

  const getDisplayAddress = () => {
    if (!listing) return '';
    
    const isHost = user && listing.host?.id === user.id;
    const userHasCheckedIn = hasCheckedIn();
    
    return formatAddressForDisplay(
      listing.address,
      listing.borough || 'NYC',
      !!isHost,
      userHasCheckedIn
    );
  };

  const handleBooking = () => {
    if (!user) {
      toast.error('Please login to book this parking space');
      navigate('/login');
      return;
    }
    // Navigate to booking page with listing ID
    navigate(`/book/${listing?.id}`);
  };

  const handleInstantBook = () => {
    if (!user) {
      toast.error('Please login to book this parking space');
      navigate('/login');
      return;
    }

    if (!user.is_verified) {
      toast.error('Only verified users can use instant booking. Please verify your account.');
      navigate('/profile');
      return;
    }

    // Navigate directly to booking form with instant book flag
    navigate(`/book/${listing?.id}?instant=true`);
  };

  const canUseInstantBook = () => {
    console.log('Checking instant book eligibility:', {
      hasUser: !!user,
      userIsVerified: user?.is_verified,
      listingInstantBook: listing?.is_instant_book,
      canUse: user && listing?.is_instant_book && user.is_verified
    });
    return user && 
           listing?.is_instant_book && 
           user.is_verified;
  };

  const loadReviews = async () => {
    if (!id) return;
    
    setReviewsLoading(true);
    try {
      const response = await api.get(`/reviews/reviews/listing_reviews/?listing_id=${id}`);
      const reviewsData = response.data.results || response.data || [];
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleRatingChange = (field: string, value: number | null) => {
    setReviewData(prev => ({
      ...prev,
      [field]: value || 0
    }));
  };

  const handleFavoriteClick = () => {
    if (!user) {
      toast.error('Please login to view favorites');
      navigate('/login');
      return;
    }
    
    if (!id) return;
    
    const listingId = parseInt(id);
    const storedFavorites = localStorage.getItem(`favorites_${user.id}`);
    let favoriteIds: number[] = storedFavorites ? JSON.parse(storedFavorites) : [];
    
    // Add to favorites if not already favorited
    if (!isFavorite) {
      favoriteIds.push(listingId);
      setIsFavorite(true);
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(favoriteIds));
      toast.success('Added to favorites');
    }
    
    // Navigate to favorites page
    navigate('/favorites');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing?.title,
        text: listing?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const getVehicleTypes = () => {
    if (!listing?.max_vehicle_size) return [];
    return listing.max_vehicle_size.split(',').map(v => v.trim());
  };

  // Get availability display info
  const getAvailabilityInfo = () => {
    if (!listing?.is_active) {
      return {
        label: 'Inactive',
        color: 'error' as const,
        icon: <Block sx={{ fontSize: 16 }} />,
      };
    }

    if (availabilityStatus.isChecking) {
      return {
        label: 'Checking...',
        color: 'default' as const,
        icon: <CircularProgress size={16} />,
      };
    }

    if (availabilityStatus.isAvailable === true) {
      return {
        label: 'Available Now',
        color: 'success' as const,
        icon: <CheckCircle sx={{ fontSize: 16 }} />,
      };
    }

    if (availabilityStatus.isAvailable === false) {
      // Parse the reason to show a more specific message
      const reason = availabilityStatus.reason || '';
      if (reason.includes('opens at') || reason.includes('closes at')) {
        // Extract time from reason like "Parking space opens at 06:00 on Friday"
        const timeMatch = reason.match(/(\d{1,2}:\d{2})/);
        if (timeMatch) {
          const time = timeMatch[1];
          if (reason.includes('opens at')) {
            return {
              label: `Opens at ${time}`,
              color: 'warning' as const,
              icon: <Schedule sx={{ fontSize: 16 }} />,
            };
          } else if (reason.includes('closes at')) {
            return {
              label: `Closes at ${time}`,
              color: 'warning' as const,
              icon: <Schedule sx={{ fontSize: 16 }} />,
            };
          }
        }
        return {
          label: 'Outside Hours',
          color: 'warning' as const,
          icon: <Schedule sx={{ fontSize: 16 }} />,
        };
      } else if (reason.includes('conflict') || reason.includes('booking')) {
        return {
          label: 'Currently Booked',
          color: 'error' as const,
          icon: <AccessTime sx={{ fontSize: 16 }} />,
        };
      } else {
        return {
          label: 'Not Available',
          color: 'error' as const,
          icon: <Cancel sx={{ fontSize: 16 }} />,
        };
      }
    }

    return {
      label: 'Check Availability',
      color: 'info' as const,
      icon: <Schedule sx={{ fontSize: 16 }} />,
    };
  };

  const getBookingButtonText = () => {
    if (!listing?.is_active) {
      return 'Not Available';
    }

    if (availabilityStatus.isChecking) {
      return 'Checking Availability...';
    }

    // Always show "Book This Space" regardless of current availability
    return 'Book This Space';
  };

  const isBookingAllowed = () => {
    return listing?.is_active && !availabilityStatus.isChecking;
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  if (!listing) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Listing not found</Typography>
      </Box>
    );
  }

  // Default image if no images available
  const defaultImage = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&h=600&fit=crop';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      {/* Breadcrumbs */}
      <Box sx={{ bgcolor: 'background.paper', py: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Link 
              component="button"
              variant="body2"
              onClick={() => navigate('/listings')}
              sx={{ cursor: 'pointer' }}
            >
              Listings
            </Link>
            <Typography color="text.primary" variant="body2">{listing.title}</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* Image Gallery */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ position: 'relative' }}>
                {/* Private Image Gallery */}
                <PrivateImageGallery
                  listing={listing}
                  height={{ xs: 300, md: 500 }}
                  showThumbnails={true}
                  showPrivacyIndicator={true}
                />
                
                {/* Action Buttons */}
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                  }}
                >
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteClick();
                      }}
                      sx={{
                        bgcolor: 'white',
                        '&:hover': { bgcolor: 'white' },
                      }}
                    >
                      {isFavorite ? (
                        <Favorite sx={{ color: 'error.main' }} />
                      ) : (
                        <FavoriteBorder />
                      )}
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
                      }}
                      sx={{
                        bgcolor: 'white',
                        '&:hover': { bgcolor: 'white' },
                      }}
                    >
                      <Share />
                    </IconButton>
                  </Stack>

                  {/* Back Button */}
                  <IconButton
                    onClick={() => navigate(-1)}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      bgcolor: 'white',
                      '&:hover': { bgcolor: 'white' },
                    }}
                  >
                    <ArrowBack />
                  </IconButton>
              </Box>

              {/* Thumbnail Strip */}
              {listing.images?.length > 1 && (
                <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <ImageList sx={{ m: 0 }} cols={6} rowHeight={80} gap={8}>
                    {listing.images.map((image, index) => (
                      <ImageListItem
                        key={image.id}
                        sx={{
                          cursor: 'pointer',
                          opacity: selectedImage === index ? 1 : 0.6,
                          border: selectedImage === index ? 2 : 0,
                          borderColor: 'primary.main',
                          borderRadius: 1,
                          overflow: 'hidden',
                          '&:hover': { opacity: 1 },
                        }}
                        onClick={() => setSelectedImage(index)}
                      >
                        <img
                          src={image.image_url}
                          alt={image.alt_text}
                          loading="lazy"
                          style={{ height: '100%', objectFit: 'cover' }}
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Box>
              )}
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* Title and Basic Info */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="h4" fontWeight={700} color="text.primary">
                          {listing.title}
                        </Typography>
                        {(() => {
                          const availabilityInfo = getAvailabilityInfo();
                          return (
                            <Chip
                              icon={availabilityInfo.icon}
                              label={availabilityInfo.label}
                              color={availabilityInfo.color}
                              clickable={!availabilityStatus.isChecking && availabilityStatus.isAvailable === null}
                              onClick={availabilityStatus.isAvailable === null ? checkCurrentAvailability : undefined}
                            />
                          );
                        })()}
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                        <LocationOn sx={{ fontSize: 20, color: 'text.secondary' }} />
                        <Typography variant="body1" color="text.secondary">
                          {getDisplayAddress()}
                        </Typography>
                        {!hasCheckedIn() && user && listing.host?.id !== user.id && (
                          <Info sx={{ fontSize: 16, color: 'text.secondary' }} />
                        )}
                      </Stack>
                      {!hasCheckedIn() && user && listing.host?.id !== user.id && (
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                          📍 Exact address will be revealed after check-in
                        </Typography>
                      )}
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          icon={parkingTypeIcons[listing.space_type] || <LocalParking />}
                          label={listing.space_type.charAt(0).toUpperCase() + listing.space_type.slice(1)}
                          variant="outlined"
                        />
                        {listing.rating_average && parseFloat(listing.rating_average) > 0 && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Star sx={{ fontSize: 20, color: 'warning.main' }} />
                            <Typography variant="body2" fontWeight={600}>
                              {parseFloat(listing.rating_average).toFixed(1)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              ({listing.total_reviews} reviews)
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Box>

                    <Divider />

                    {/* Description */}
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                        About this space
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {listing.description}
                      </Typography>
                    </Box>

                    {/* Vehicle Types */}
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                        Accepted Vehicles
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {getVehicleTypes().map((type) => (
                          <Chip
                            key={type}
                            label={vehicleTypeLabels[type] || type}
                            icon={<DirectionsCar />}
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                        ))}
                      </Stack>
                    </Box>

                    {/* Special Instructions */}
                    {listing.instructions && (
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Info  />
                          <Typography variant="h6" fontWeight={600} color="text.primary">
                            Parking Instructions
                          </Typography>
                        </Stack>
                        <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                          <Typography variant="body2">
                            {listing.instructions}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Amenities */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                    Amenities & Features
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            {listing.is_covered ? (
                              <CheckCircle color="success" />
                            ) : (
                              <Cancel color="error" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary="Covered/Indoor"
                            secondary={listing.is_covered ? 'Protected from weather' : 'Outdoor parking'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            {listing.has_security ? (
                              <CheckCircle color="success" />
                            ) : (
                              <Cancel color="error" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary="Security"
                            secondary={listing.has_security ? 'Secured area' : 'No security'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            {listing.has_ev_charging ? (
                              <CheckCircle color="success" />
                            ) : (
                              <Cancel color="error" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary="EV Charging"
                            secondary={listing.has_ev_charging ? 'Electric vehicle charging available' : 'No EV charging'}
                          />
                        </ListItem>
                        {listing.has_lighting && (
                          <ListItem>
                            <ListItemIcon>
                              <CheckCircle color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Well Lit"
                              secondary="Good lighting for safety"
                            />
                          </ListItem>
                        )}
                        {listing.has_cctv && (
                          <ListItem>
                            <ListItemIcon>
                              <CheckCircle color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary="CCTV Monitoring"
                              secondary="Video surveillance"
                            />
                          </ListItem>
                        )}
                      </List>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <List dense>
                        {listing.has_gated_access && (
                          <ListItem>
                            <ListItemIcon>
                              <CheckCircle color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Gated Access"
                              secondary="Controlled/gated access"
                            />
                          </ListItem>
                        )}
                        {listing.is_handicap_accessible && (
                          <ListItem>
                            <ListItemIcon>
                              <CheckCircle color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Wheelchair Accessible"
                              secondary="ADA compliant"
                            />
                          </ListItem>
                        )}
                        {listing.has_valet_service && (
                          <ListItem>
                            <ListItemIcon>
                              <CheckCircle color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Valet Service"
                              secondary="Valet parking service"
                            />
                          </ListItem>
                        )}
                        {listing.has_car_wash && (
                          <ListItem>
                            <ListItemIcon>
                              <CheckCircle color="success" />
                            </ListItemIcon>
                            <ListItemText
                              primary="Car Wash"
                              secondary="Car washing services"
                            />
                          </ListItem>
                        )}
                      </List>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

            </Stack>
          </Grid>

          {/* Sidebar - Booking Card */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                borderRadius: 3,
                position: 'sticky',
                top: 80,
                boxShadow: theme.shadows[4],
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                  {/* Pricing */}
                  <Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom color="text.primary">
                      Pricing
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <Typography variant="body1" color="text.secondary">
                          Hourly Rate
                        </Typography>
                        <Typography variant="h6" fontWeight={600} color="text.primary">
                          ${listing.hourly_rate}/hr
                        </Typography>
                      </Box>
                      {listing.daily_rate > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <Typography variant="body1" color="text.secondary">
                            Daily Rate
                          </Typography>
                          <Typography variant="h6" fontWeight={600} color="text.primary">
                            ${listing.daily_rate}/day
                          </Typography>
                        </Box>
                      )}
                      {listing.weekly_rate > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <Typography variant="body1" color="text.secondary">
                            Weekly Rate
                          </Typography>
                          <Typography variant="h6" fontWeight={600} color="text.primary">
                            ${listing.weekly_rate}/week
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Host Info */}
                  {listing.host && (
                    <Box>
                      <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                        Host
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                          {listing.host.first_name?.[0] || listing.host.username[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {listing.host.first_name || listing.host.username}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Member since {new Date(listing.created_at).getFullYear()}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  )}

                  <Divider />

                  {/* Availability Schedule */}
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                      📅 Availability Schedule
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      This space is available during these hours:
                    </Typography>
                    <Stack spacing={1}>
                      {listing.availability_schedule ? (() => {
                        // Get current day of the week
                        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                        const currentDay = dayNames[new Date().getDay()];
                        
                        // Find today's schedule
                        const todaySchedule = listing.availability_schedule[currentDay];
                        
                        const formatTime = (time: string) => {
                          const [hours, minutes] = time.split(':');
                          const hour = parseInt(hours);
                          const ampm = hour >= 12 ? 'PM' : 'AM';
                          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                          return `${displayHour}:${minutes} ${ampm}`;
                        };
                        
                        if (todaySchedule && todaySchedule.available) {
                          return (
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              p: 1.5,
                              bgcolor: alpha(theme.palette.primary.main, 0.05),
                              borderRadius: 1,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                            }}>
                              <Typography variant="body2" fontWeight={500} textTransform="capitalize">
                                Today ({currentDay})
                              </Typography>
                              <Typography variant="body2" color="primary.main" fontWeight={600}>
                                {formatTime(todaySchedule.start)} - {formatTime(todaySchedule.end)}
                              </Typography>
                            </Box>
                          );
                        } else {
                          return (
                            <Box sx={{ 
                              p: 1.5,
                              bgcolor: alpha(theme.palette.error.main, 0.05),
                              borderRadius: 1,
                              border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                              textAlign: 'center'
                            }}>
                              <Typography variant="body2" color="error.main" fontWeight={500}>
                                Not available today
                              </Typography>
                            </Box>
                          );
                        }
                      })() : (
                        // Default schedule if none provided
                        [
                          { day: 'Monday-Friday', hours: '6:00 AM - 10:00 PM' },
                          { day: 'Saturday-Sunday', hours: '8:00 AM - 8:00 PM' }
                        ].map((schedule, index) => (
                          <Box key={index} sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            p: 1.5,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: 1,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                          }}>
                            <Typography variant="body2" fontWeight={500}>
                              {schedule.day}
                            </Typography>
                            <Typography variant="body2" color="primary.main" fontWeight={600}>
                              {schedule.hours}
                            </Typography>
                          </Box>
                        ))
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      ⚠️ Booking times outside these hours may require host approval
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Booking Buttons */}
                  {listing.is_instant_book && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.3)}` }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                        <Typography variant="h6" color="success.main" fontWeight="bold">
                          Instant Book Available
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Skip the wait! Verified users can book this space immediately.
                      </Typography>
                    </Box>
                  )}

                  {canUseInstantBook() ? (
                    <Stack spacing={2}>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleInstantBook}
                        disabled={!isBookingAllowed()}
                        sx={{
                          py: 2,
                          borderRadius: 2,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.light} 90%)`,
                          '&:hover': {
                            background: `linear-gradient(45deg, ${theme.palette.success.dark} 30%, ${theme.palette.success.main} 90%)`,
                          }
                        }}
                        startIcon={<CheckCircle />}
                      >
                        {getBookingButtonText()}
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        fullWidth
                        onClick={handleBooking}
                        disabled={!isBookingAllowed()}
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          fontSize: '1rem',
                          fontWeight: 500,
                          textTransform: 'none',
                        }}
                      >
                        Regular Booking
                      </Button>
                    </Stack>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleBooking}
                        disabled={!isBookingAllowed()}
                        sx={{
                          py: 2,
                          borderRadius: 2,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          textTransform: 'none',
                        }}
                      >
                        {getBookingButtonText()}
                      </Button>
                      {listing.is_instant_book && user && !user.is_verified && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}` }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Info sx={{ color: 'warning.main', fontSize: 20 }} />
                            <Typography variant="body2" color="warning.main" fontWeight="bold">
                              Verify your account for instant booking
                            </Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            Complete account verification to use instant booking on this space.
                          </Typography>
                          <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            onClick={() => navigate('/profile')}
                            sx={{ mt: 1, textTransform: 'none' }}
                          >
                            Verify Account
                          </Button>
                        </Box>
                      )}
                    </>
                  )}

                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Reviews Section */}
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={600} color="text.primary">
                  Reviews & Ratings
                </Typography>
                {listing?.rating_average && Number(listing.rating_average) > 0 && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Rating value={Number(listing.rating_average)} readOnly precision={0.1} />
                    <Typography variant="h6" fontWeight={600}>
                      {Number(listing.rating_average).toFixed(1)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({listing.total_reviews} reviews)
                    </Typography>
                  </Stack>
                )}
              </Stack>

              {reviewsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <LinearProgress sx={{ width: '50%' }} />
                </Box>
              ) : reviews.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Star sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No reviews yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Be the first to book and review this parking space!
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  {reviews.slice(0, 5).map((review) => (
                    <Paper key={review.id} elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar 
                              src={review.reviewer_avatar} 
                              sx={{ bgcolor: 'primary.main' }}
                            >
                              {review.reviewer_name?.[0] || 'R'}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {review.reviewer_name || 'Reviewer'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(review.created_at).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </Typography>
                            </Box>
                          </Stack>
                          <Rating value={review.overall_rating} readOnly size="small" />
                        </Stack>
                        
                        {review.title && (
                          <Typography variant="subtitle1" fontWeight={500}>
                            {review.title}
                          </Typography>
                        )}
                        
                        <Typography variant="body2" color="text.secondary">
                          {review.comment}
                        </Typography>

                        {(review.cleanliness_rating || review.location_rating || review.value_rating || review.communication_rating) && (
                          <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                            {review.cleanliness_rating && (
                              <Stack alignItems="center" spacing={0.5}>
                                <Typography variant="caption" color="text.secondary">Cleanliness</Typography>
                                <Rating value={review.cleanliness_rating} readOnly size="small" />
                              </Stack>
                            )}
                            {review.location_rating && (
                              <Stack alignItems="center" spacing={0.5}>
                                <Typography variant="caption" color="text.secondary">Location</Typography>
                                <Rating value={review.location_rating} readOnly size="small" />
                              </Stack>
                            )}
                            {review.value_rating && (
                              <Stack alignItems="center" spacing={0.5}>
                                <Typography variant="caption" color="text.secondary">Value</Typography>
                                <Rating value={review.value_rating} readOnly size="small" />
                              </Stack>
                            )}
                            {review.communication_rating && (
                              <Stack alignItems="center" spacing={0.5}>
                                <Typography variant="caption" color="text.secondary">Communication</Typography>
                                <Rating value={review.communication_rating} readOnly size="small" />
                              </Stack>
                            )}
                          </Stack>
                        )}
                      </Stack>
                    </Paper>
                  ))}
                  
                  {reviews.length > 5 && (
                    <Box sx={{ textAlign: 'center', pt: 2 }}>
                      <Button variant="outlined" onClick={() => navigate(`/listings/${id}/reviews`)}>
                        View All Reviews ({reviews.length})
                      </Button>
                    </Box>
                  )}
                </Stack>
              )}

            </CardContent>
          </Card>
        </Container>

      </Container>

      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <Box
            component="img"
            src={listing.images?.[selectedImage]?.image_url || defaultImage}
            alt={listing.images?.[selectedImage]?.alt_text}
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '80vh',
              objectFit: 'contain',
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}