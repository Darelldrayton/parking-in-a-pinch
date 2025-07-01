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
  useTheme,
  alpha,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Schedule,
  DirectionsCar,
  AttachMoney,
  CalendarToday,
  AccessTime,
  CheckCircle,
  Cancel,
  Pending,
  Person,
  Phone,
  Email,
  Print,
  Share,
  Edit,
  Message,
  Star,
  StarBorder,
  RateReview,
  QrCode,
  Login,
  Logout,
  MoneyOff,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingsContext';
import QRCheckInSystem from '../components/checkin/QRCheckInSystem';
import GPSLocationVerifier from '../components/location/GPSLocationVerifier';
import RefundRequestDialog from '../components/payment/RefundRequestDialog';
import RefundStatus from '../components/payment/RefundStatus';
import RefundRequestStatus from '../components/payment/RefundRequestStatus';
import { formatAddressForDisplay, getMapDisplayCoordinates, getMapZoomLevel } from '../utils/locationUtils';
import GoogleMap from '../components/maps/GoogleMap';
import { PrivateImageGallery } from '../components/common/PrivateImage';

interface BookingDetail {
  id: number;
  booking_id: string;
  parking_space: {
    id: number;
    title: string;
    address: string;
    hourly_rate: number;
    host: {
      id: number;
      username: string;
      first_name: string;
      last_name: string;
      phone_number?: string;
      email?: string;
    };
  };
  parking_space_latitude?: number;
  parking_space_longitude?: number;
  start_time: string;
  end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  auto_checkout?: boolean;
  vehicle_license_plate: string;
  vehicle_state: string;
  special_instructions: string;
  status: string;
  total_amount: number;
  created_at: string;
  confirmed_at?: string;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'confirmed': return 'success';
    case 'pending': return 'warning';
    case 'cancelled': return 'error';
    case 'completed': return 'info';
    case 'active': return 'primary';
    default: return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'confirmed': return <CheckCircle />;
    case 'pending': return <Pending />;
    case 'cancelled': return <Cancel />;
    case 'completed': return <CheckCircle />;
    case 'active': return <Schedule />;
    default: return <Schedule />;
  }
};

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const { refreshBookings } = useBookings();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  
  // Review state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
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
      loadBooking();
      loadExistingReview();
    }
  }, [id]);

  const loadBooking = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/bookings/bookings/${id}/`);
      const bookingData = response.data;
      console.log('Booking detail response:', bookingData);
      console.log('Parking space data:', bookingData.parking_space);
      
      // If parking_space is just an ID, fetch the full parking space details
      if (typeof bookingData.parking_space === 'number') {
        try {
          const parkingSpaceResponse = await api.get(`/listings/${bookingData.parking_space}/`);
          const parkingSpace = parkingSpaceResponse.data;
          console.log('Full parking space data:', parkingSpace);
          console.log('Host data:', parkingSpace.host);
          
          // Update booking data with full parking space object
          bookingData.parking_space = parkingSpace;
        } catch (spaceError) {
          console.error('Error loading parking space details:', spaceError);
        }
      }
      
      setBooking(bookingData);
    } catch (error) {
      console.error('Error loading booking:', error);
      toast.error('Failed to load booking details');
      navigate('/my-bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;
    
    try {
      await api.post(`/bookings/bookings/${booking.id}/cancel/`);
      toast.success('Booking cancelled successfully');
      loadBooking(); // Reload to get updated status
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const handleCancelWithRefund = async () => {
    if (!booking) return;
    
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const minutesUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60);
    
    if (minutesUntilStart <= 16) {
      toast.error('Automatic refund is only available more than 16 minutes before your booking starts');
      return;
    }
    
    try {
      // Cancel booking and request automatic refund
      await api.post(`/bookings/bookings/${booking.id}/cancel/`, {
        reason: 'cancelled_by_user',
        automatic_refund: true
      });
      
      toast.success('Booking cancelled and 100% refund processed automatically!');
      loadBooking(); // Reload to get updated status
    } catch (error) {
      console.error('Error cancelling booking with refund:', error);
      toast.error('Failed to cancel booking and process refund');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Booking ${booking?.booking_id}`,
        text: `Parking reservation at ${booking?.parking_space.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Booking link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMessage = () => {
    // Navigate to messages page with this booking conversation
    navigate('/messages', { 
      state: { 
        selectedBookingId: booking?.id,
        bookingConversation: {
          id: `booking-${booking?.id}`,
          conversation_id: `booking-${booking?.booking_id}`,
          conversation_type: 'booking',
          status: 'active',
          title: `Booking: ${booking?.parking_space?.title || 'Parking Space'}`,
          is_group: false,
          booking_id: booking?.id,
          booking: booking,
          other_participant: booking?.parking_space?.host,
          last_message_preview: null,
          unread_count: 0,
          last_activity_at: booking?.created_at
        }
      } 
    });
  };

  const handleVerifyLocation = () => {
    if (!booking) return;
    
    // Get coordinates from parking_space object first, then fallback to booking level coordinates
    const lat = booking.parking_space?.latitude || booking.parking_space_latitude;
    const lng = booking.parking_space?.longitude || booking.parking_space_longitude;
    const address = booking.parking_space?.address;
    
    if (!lat || !lng) {
      toast.error('Location coordinates not available');
      return;
    }

    // Detect platform
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let mapsUrl;
    
    // Priority: Waze (universal) > Platform-specific default
    // Try Waze first as it's available on all platforms
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    
    // Platform-specific fallbacks
    if (isIOS) {
      // iOS: Apple Maps with MKMapItem or URL scheme
      const appleUrl = `maps://maps.apple.com/?daddr=${lat},${lng}`;
      mapsUrl = appleUrl;
    } else if (isAndroid) {
      // Android: Google Maps intent
      const googleUrl = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(address || 'Parking Space')})`;
      mapsUrl = googleUrl;
    } else {
      // Web/Desktop: Google Maps web
      const webUrl = `https://maps.google.com/maps?daddr=${lat},${lng}`;
      mapsUrl = webUrl;
    }
    
    // Try Waze first, fallback to platform default if Waze isn't available
    try {
      window.open(wazeUrl, '_blank');
      // Small delay to check if Waze opened successfully
      setTimeout(() => {
        // If user is still on page, they might not have Waze - open platform default
        window.open(mapsUrl, '_blank');
      }, 500);
    } catch (error) {
      // If Waze fails, open platform default immediately
      window.open(mapsUrl, '_blank');
    }
  };

  const loadExistingReview = async () => {
    try {
      // Check if user has already reviewed this booking
      const response = await api.get(`/reviews/reviews/?booking=${id}&reviewer=${user?.id}`);
      if (response.data.results && response.data.results.length > 0) {
        setExistingReview(response.data.results[0]);
      }
    } catch (error) {
      console.error('Error loading existing review:', error);
    }
  };

  const handleReviewSubmit = async () => {
    if (!booking || reviewData.overall_rating === 0) {
      toast.error('Please provide at least an overall rating');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to submit a review');
      navigate('/login');
      return;
    }

    setReviewLoading(true);
    try {
      // Remove is_anonymous from payload
      const { is_anonymous, ...reviewPayloadData } = reviewData;
      
      const reviewPayload = {
        ...reviewPayloadData,
        review_type: 'listing',
        booking_id: booking.booking_id,  // Use booking_id string instead of numeric id
        listing_id: booking.parking_space.id
      };

      console.log('Submitting review with payload:', reviewPayload);

      if (existingReview) {
        // Update existing review
        await api.put(`/reviews/reviews/${existingReview.id}/`, reviewPayload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        toast.success('Review updated successfully!');
      } else {
        // Create new review - use FormData for backend compatibility
        const formData = new FormData();
        Object.keys(reviewPayload).forEach(key => {
          if (reviewPayload[key] !== null && reviewPayload[key] !== undefined) {
            formData.append(key, reviewPayload[key]);
          }
        });
        
        await api.post('/reviews/reviews/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Review submitted successfully!');
      }
      
      setShowReviewDialog(false);
      loadExistingReview(); // Reload to show updated review
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.response?.data?.non_field_errors?.[0] ||
                          'Failed to submit review. Please try again.';
      toast.error(errorMessage);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleRatingChange = (field: string, value: number | null) => {
    setReviewData(prev => ({
      ...prev,
      [field]: value || 0
    }));
  };

  const openReviewDialog = () => {
    if (existingReview) {
      // Pre-fill form with existing review data
      setReviewData({
        overall_rating: existingReview.overall_rating || 0,
        cleanliness_rating: existingReview.cleanliness_rating || 0,
        location_rating: existingReview.location_rating || 0,
        value_rating: existingReview.value_rating || 0,
        communication_rating: existingReview.communication_rating || 0,
        title: existingReview.title || '',
        comment: existingReview.comment || ''
      });
    }
    setShowReviewDialog(true);
  };

  const handleCheckIn = async () => {
    try {
      await api.post(`/bookings/bookings/${booking?.id}/start/`);
      toast.success('Checked in successfully!');
      loadBooking(); // Reload local data
      refreshBookings(); // Refresh context data
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post(`/bookings/bookings/${booking?.id}/complete/`);
      toast.success('Checked out successfully!');
      loadBooking(); // Reload local data
      refreshBookings(); // Refresh context data
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error('Failed to check out');
    }
  };

  const canCheckIn = () => {
    if (!booking) return false;
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const startWindow = new Date(startTime.getTime() - 15 * 60 * 1000); // 15 minutes before start time
    return now >= startWindow && booking.status === 'confirmed';
  };

  const canCheckOut = () => {
    if (!booking) return false;
    return booking.status === 'active';
  };

  const canRequestRefund = () => {
    if (!booking) return false;
    // Can only request refund after check-in (since check-in is available 15 minutes before start time)
    return !!booking.actual_start_time && ['active', 'completed'].includes(booking.status);
  };

  const canCancelWithAutomaticRefund = () => {
    if (!booking) return false;
    
    // Only for confirmed bookings that haven't started yet
    if (booking.status !== 'confirmed' || booking.actual_start_time) return false;
    
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const minutesUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60);
    
    // Automatic 100% refund until 16 minutes before start time
    return minutesUntilStart > 16;
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  if (!booking) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography>Booking not found</Typography>
      </Box>
    );
  }

  const duration = (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / (1000 * 60 * 60);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
      py: 4,
    }}>
      {/* Header */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: 'white',
        py: 4,
        mb: 4,
      }}>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <IconButton 
              onClick={() => navigate('/my-bookings')} 
              sx={{ color: 'white', bgcolor: alpha(theme.palette.common.white, 0.1) }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1" fontWeight={700} color="white">
              Booking Details
            </Typography>
          </Stack>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }} color="white">
            Reservation #{booking.booking_id || booking.id}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Main Booking Info */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              {/* Status Card */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight={600} color="text.primary">
                      Booking Status
                    </Typography>
                    <Chip
                      icon={getStatusIcon(booking.status)}
                      label={booking.status || 'Pending'}
                      color={getStatusColor(booking.status)}
                      size="large"
                    />
                  </Box>

                  {booking.status === 'pending' && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      Your booking is pending host confirmation. You'll receive a notification once confirmed.
                    </Alert>
                  )}

                  {booking.status === 'confirmed' && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                      Your booking is confirmed! You can arrive any time during your reserved period.
                    </Alert>
                  )}

                  {/* Refund Policy Information */}
                  {booking.status === 'confirmed' && canCancelWithAutomaticRefund() && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <Typography variant="body2" fontWeight={500} gutterBottom>
                        💰 Refund Policy
                      </Typography>
                      <Typography variant="body2">
                        Get 100% automatic refund by cancelling more than 16 minutes before your booking starts. After check-in, refunds require admin review.
                      </Typography>
                    </Alert>
                  )}

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <CalendarToday sx={{ color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Date
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {format(new Date(booking.start_time), 'EEEE, MMMM d, yyyy')}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <AccessTime sx={{ color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Time
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Schedule sx={{ color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Duration
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {duration.toFixed(1)} hours
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <AttachMoney sx={{ color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Total Cost
                          </Typography>
                          <Typography variant="body1" fontWeight={600} >
                            ${typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : parseFloat(booking.total_amount || '0').toFixed(2)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Check-in/Check-out Times */}
                  {(booking.actual_start_time || booking.actual_end_time) && (
                    <>
                      <Divider sx={{ my: 3 }} />
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Check-in/Check-out Times
                      </Typography>
                      <Grid container spacing={3}>
                        {booking.actual_start_time && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Login sx={{ color: 'success.main' }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Checked In
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="success.main">
                                  {format(new Date(booking.actual_start_time), 'MMM d, yyyy h:mm a')}
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>
                        )}

                        {booking.actual_end_time && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Logout sx={{ color: 'warning.main' }} />
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  Checked Out
                                </Typography>
                                <Typography variant="body1" fontWeight={600} color="warning.main">
                                  {format(new Date(booking.actual_end_time), 'MMM d, yyyy h:mm a')}
                                  {booking.auto_checkout && (
                                    <Typography component="span" variant="body2" sx={{ ml: 1, fontWeight: 500, color: 'text.secondary' }}>
                                      AUTO
                                    </Typography>
                                  )}
                                </Typography>
                              </Box>
                            </Stack>
                          </Grid>
                        )}
                      </Grid>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Parking Space Info */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                    Parking Space
                  </Typography>
                  
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} color="text.primary">
                        {booking.parking_space.title}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatAddressForDisplay(
                            booking.parking_space.address,
                            booking.parking_space.address.split(',').slice(-2).join(', '), // borough/city
                            false, // not a host
                            !!booking.actual_start_time // has checked in
                          )}
                        </Typography>
                      </Stack>
                      {!booking.actual_start_time && (
                        <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                          📍 Full address will be available after check-in
                        </Typography>
                      )}
                    </Box>

                    {/* Parking Space Photos - show real photos after payment confirmation */}
                    {['confirmed', 'active', 'completed'].includes(booking.status) && (
                      <>
                        <Divider />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600} gutterBottom color="text.primary">
                            Parking Space Photos
                          </Typography>
                          <PrivateImageGallery
                            listing={booking.parking_space}
                            height={250}
                            showThumbnails={true}
                            showPrivacyIndicator={true}
                          />
                        </Box>
                      </>
                    )}

                    <Divider />

                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Rate: ${booking.parking_space.hourly_rate}/hour
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Vehicle Info */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                    Vehicle Information
                  </Typography>
                  
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <DirectionsCar sx={{ color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {booking.vehicle_license_plate}
                      </Typography>
                      {booking.vehicle_state && (
                        <Typography variant="body2" color="text.secondary">
                          Registered in {booking.vehicle_state}
                        </Typography>
                      )}
                    </Box>
                  </Stack>

                  {booking.special_instructions && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Special Instructions
                        </Typography>
                        <Typography variant="body1">
                          {booking.special_instructions}
                        </Typography>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Location & Map */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                    Location & Directions
                  </Typography>
                  
                  <Stack spacing={3}>
                    {/* Address Display */}
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <LocationOn sx={{ fontSize: 20, color: 'primary.main' }} />
                        <Typography variant="body1" fontWeight={500}>
                          {formatAddressForDisplay(
                            booking.parking_space.address,
                            booking.parking_space.address.split(',').slice(-2).join(', '), // borough/city
                            false, // not a host
                            !!booking.actual_start_time // has checked in
                          )}
                        </Typography>
                      </Stack>
                      {!booking.actual_start_time && (
                        <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                          📍 Exact address and map will be available after check-in for security
                        </Typography>
                      )}
                    </Box>

                    {/* Map Display - only show after check-in */}
                    {booking.actual_start_time && booking.parking_space.latitude && booking.parking_space.longitude && (
                      <Box>
                        <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
                          Map & Navigation
                        </Typography>
                        <Box sx={{ 
                          height: 300, 
                          borderRadius: 2, 
                          overflow: 'hidden',
                          border: `1px solid ${theme.palette.divider}`
                        }}>
                          {(() => {
                            const coordinates = getMapDisplayCoordinates(
                              parseFloat(booking.parking_space.latitude), 
                              parseFloat(booking.parking_space.longitude), 
                              !!booking.actual_start_time
                            );
                            
                            return (
                              <GoogleMap
                                lat={coordinates.lat}
                                lng={coordinates.lng}
                                zoom={getMapZoomLevel(!!booking.actual_start_time)}
                                markers={[{
                                  id: booking.parking_space.id,
                                  location: {
                                    latitude: coordinates.lat,
                                    longitude: coordinates.lng,
                                    address: formatAddressForDisplay(
                                      booking.parking_space.address,
                                      booking.parking_space.address.split(',').slice(-2).join(', '),
                                      false,
                                      !!booking.actual_start_time
                                    )
                                  },
                                  title: booking.parking_space.title,
                                  status: 'available',
                                  pricing: {
                                    hourly_rate: booking.parking_space.hourly_rate
                                  }
                                }]}
                                style={{ width: '100%', height: '100%' }}
                              />
                            );
                          })()}
                        </Box>
                        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.parking_space.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Get Directions
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            href={`https://maps.apple.com/?daddr=${encodeURIComponent(booking.parking_space.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Apple Maps
                          </Button>
                        </Stack>
                      </Box>
                    )}

                    {/* Pre-check-in location info */}
                    {!booking.actual_start_time && (
                      <Box sx={{ 
                        p: 3, 
                        bgcolor: alpha(theme.palette.info.main, 0.05),
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                      }}>
                        <Typography variant="body2" color="info.main" fontWeight={500} sx={{ mb: 1 }}>
                          🗺️ Location Privacy Notice
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          For security reasons, the exact address and interactive map will be revealed after you check in. 
                          The general area shown above gives you an idea of the location.
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Refund Request Status (Approval Required) */}
              <RefundRequestStatus 
                bookingId={booking.id}
                onStatusUpdate={() => {
                  // Refresh booking data after status update
                  loadBooking();
                }}
              />

              {/* Refund Information (Processed Refunds) */}
              <RefundStatus 
                bookingId={booking.id}
                paymentId={booking.payment?.payment_id}
                onRefundRequested={() => {
                  // Refresh booking data after refund request
                  loadBooking();
                  setRefundDialogOpen(false);
                }}
              />
            </Stack>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              {/* Actions */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                    Actions
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      startIcon={<Share />}
                      onClick={handleShare}
                      fullWidth
                    >
                      Share Booking
                    </Button>
                    
                    <Button
                      variant="outlined"
                      startIcon={<Print />}
                      onClick={handlePrint}
                      fullWidth
                    >
                      Print Details
                    </Button>

                    {(booking.status === 'confirmed' || booking.status === 'active') && (
                      <>
                        <Button
                          variant="contained"
                          startIcon={<QrCode />}
                          onClick={() => setQrDialogOpen(true)}
                          fullWidth
                          color="secondary"
                        >
                          QR Check-In
                        </Button>
                        
                        <Button
                          variant="outlined"
                          startIcon={<LocationOn />}
                          onClick={handleVerifyLocation}
                          fullWidth
                        >
                          Verify Location
                        </Button>
                      </>
                    )}

                    {/* Check-in/Check-out buttons */}
                    {canCheckIn() && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<Login />}
                        onClick={handleCheckIn}
                        fullWidth
                      >
                        Check In
                      </Button>
                    )}

                    {canCheckOut() && (
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<Logout />}
                        onClick={handleCheckOut}
                        fullWidth
                      >
                        Check Out
                      </Button>
                    )}

                    {/* Automatic refund cancellation - available until 16 minutes before start time */}
                    {canCancelWithAutomaticRefund() && (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<MoneyOff />}
                        onClick={handleCancelWithRefund}
                        fullWidth
                      >
                        Cancel & Get 100% Refund
                      </Button>
                    )}

                    {/* Manual refund request - only after check-in */}
                    {canRequestRefund() && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<MoneyOff />}
                        onClick={() => setRefundDialogOpen(true)}
                        fullWidth
                      >
                        Request Refund
                      </Button>
                    )}

                    {/* Regular cancellation for pending bookings (no refund expected) */}
                    {booking.status === 'pending' && (
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={handleCancel}
                        fullWidth
                      >
                        Cancel Booking
                      </Button>
                    )}

                    {/* Cancellation without automatic refund for confirmed bookings within 16 minutes */}
                    {booking.status === 'confirmed' && !canCancelWithAutomaticRefund() && !booking.actual_start_time && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={handleCancel}
                        fullWidth
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Host Info */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                    Host Information
                  </Typography>
                  
                  {booking.parking_space?.host ? (
                    <>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                          {booking.parking_space.host.first_name?.[0] || booking.parking_space.host.username?.[0] || 'H'}
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {booking.parking_space.host.first_name || booking.parking_space.host.username || 'Host'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Parking Host
                          </Typography>
                        </Box>
                      </Stack>

                      {booking.status === 'confirmed' && (
                        <Stack spacing={1}>
                          {booking.parking_space.host.phone_number && (
                            <Button
                              variant="outlined"
                              startIcon={<Phone />}
                              size="small"
                              href={`tel:${booking.parking_space.host.phone_number}`}
                            >
                              Call Host
                            </Button>
                          )}
                          <Button
                            variant="contained"
                            startIcon={<Message />}
                            onClick={handleMessage}
                            size="small"
                            
                          >
                            Message {booking.parking_space.host.first_name || 'Host'}
                          </Button>
                        </Stack>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Host information not available
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Booking Timeline */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                    Booking Timeline
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        Booking Created
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(booking.created_at), 'MMM d, yyyy h:mm a')}
                      </Typography>
                    </Box>

                    {booking.confirmed_at && (
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          Confirmed
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(booking.confirmed_at), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                    )}

                    {booking.actual_start_time && (
                      <Box>
                        <Typography variant="body2" fontWeight={500} color="success.main">
                          Checked In
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(booking.actual_start_time), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </Box>
                    )}

                    {booking.status === 'active' && (
                      <Box>
                        <Typography variant="body2" fontWeight={500} color="success.main">
                          Active
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Booking is currently active
                        </Typography>
                      </Box>
                    )}

                    {booking.actual_end_time && (
                      <Box>
                        <Typography variant="body2" fontWeight={500} color="warning.main">
                          Checked Out{booking.auto_checkout ? ' (Auto)' : ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(booking.actual_end_time), 'MMM d, yyyy h:mm a')}
                          {booking.auto_checkout && ' AUTO'}
                        </Typography>
                      </Box>
                    )}

                    {booking.status === 'completed' && (
                      <Box>
                        <Typography variant="body2" fontWeight={500} color="info.main">
                          Completed
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Booking has been completed
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Review Section - show only for completed bookings */}
              {booking.status === 'completed' && (
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
                      <Typography variant="h6" fontWeight={600}>
                        Review this parking space
                      </Typography>
                      <Button
                        variant={existingReview ? "outlined" : "contained"}
                        startIcon={<RateReview />}
                        onClick={openReviewDialog}
                        
                      >
                        {existingReview ? 'Edit Review' : 'Write Review'}
                      </Button>
                    </Stack>
                    
                    {existingReview ? (
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                          <Rating value={existingReview.overall_rating} readOnly />
                          <Typography variant="body2" color="text.secondary">
                            {existingReview.overall_rating}/5 stars
                          </Typography>
                        </Stack>
                        {existingReview.title && (
                          <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 1 }}>
                            {existingReview.title}
                          </Typography>
                        )}
                        {existingReview.comment && (
                          <Typography variant="body2" color="text.secondary">
                            {existingReview.comment}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Alert severity="info">
                        Share your experience to help other users find great parking spaces!
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onClose={() => setShowReviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {existingReview ? 'Edit Your Review' : 'Write a Review'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {/* Overall Rating */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Overall Rating *
              </Typography>
              <Rating
                value={reviewData.overall_rating}
                onChange={(_, value) => handleRatingChange('overall_rating', value)}
                size="large"
              />
            </Box>

            {/* Detailed Ratings */}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Cleanliness
                </Typography>
                <Rating
                  value={reviewData.cleanliness_rating}
                  onChange={(_, value) => handleRatingChange('cleanliness_rating', value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Location
                </Typography>
                <Rating
                  value={reviewData.location_rating}
                  onChange={(_, value) => handleRatingChange('location_rating', value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Value for Money
                </Typography>
                <Rating
                  value={reviewData.value_rating}
                  onChange={(_, value) => handleRatingChange('value_rating', value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Communication
                </Typography>
                <Rating
                  value={reviewData.communication_rating}
                  onChange={(_, value) => handleRatingChange('communication_rating', value)}
                />
              </Grid>
            </Grid>

            {/* Review Title */}
            <TextField
              label="Review Title (Optional)"
              value={reviewData.title}
              onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              placeholder="Summarize your experience"
            />

            {/* Review Comment */}
            <TextField
              label="Review Comment"
              value={reviewData.comment}
              onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              placeholder="Tell other users about your experience with this parking space..."
            />

          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReviewDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleReviewSubmit}
            variant="contained"
            disabled={reviewLoading || reviewData.overall_rating === 0}
          >
            {reviewLoading ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Check-In Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          QR Check-In System
        </DialogTitle>
        <DialogContent>
          <QRCheckInSystem
            bookingId={booking?.id}
            userType="renter"
            onCheckIn={(bookingId, timestamp) => {
              console.log('Checked in:', bookingId, timestamp);
              toast.success('Successfully checked in!');
              // Update booking status if needed
            }}
            onCheckOut={(bookingId, timestamp) => {
              console.log('Checked out:', bookingId, timestamp);
              toast.success('Successfully checked out!');
              // Update booking status if needed
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>


      {/* Refund Request Dialog */}
      <RefundRequestDialog
        open={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        booking={booking}
        payment={booking?.payment}
        onRefundRequested={() => {
          // Refresh booking data after refund request
          loadBooking();
          setRefundDialogOpen(false);
          toast.success('Refund request submitted successfully!');
        }}
      />

    </Box>
  );
}