import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  LinearProgress,
  useTheme,
  alpha,
  Fade,
  Zoom,
  Stack,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Dashboard as DashboardIcon,
  ListAlt as ListIcon,
  BookOnline as BookingIcon,
  AccountBalanceWallet as WalletIcon,
  Star as StarIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingsContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import AvailabilityCalendar from '../components/common/AvailabilityCalendar';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  CheckCircle,
  Cancel,
  Pending,
} from '@mui/icons-material';
import { formatAddressForDisplay } from '../utils/locationUtils';

// Check if user is new (created recently - within last 24 hours)
const isNewUser = (user: any) => {
  if (!user?.created_at) return true; // Assume new if no creation date
  
  const createdAt = new Date(user.created_at);
  const now = new Date();
  const timeDiff = now.getTime() - createdAt.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);
  
  return daysDiff < 1; // Consider user new if created within last 24 hours
};

// Mini HostBookings component for dashboard requests tab
interface HostBooking {
  id: number;
  booking_id: string;
  user: number;
  user_name: string;
  user_email: string;
  parking_space: {
    id: number;
    title: string;
    address: string;
    hourly_rate: number;
  };
  start_time: string;
  end_time: string;
  vehicle_license_plate: string;
  vehicle_make_model: string;
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
    case 'active': return <ScheduleIcon />;
    default: return <ScheduleIcon />;
  }
};

const MiniHostBookings: React.FC = () => {
  const { user } = useAuth();
  const { bookings: allBookings, refreshBookings } = useBookings();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (user && allBookings.length > 0 && !dataLoaded) {
      loadHostBookings();
    }
  }, [user?.id, allBookings.length, dataLoaded]);

  const loadHostBookings = async () => {
    setLoading(true);
    try {
      if (!user) {
        setBookings([]);
        return;
      }

      // Get user's listings to determine which bookings are for their properties
      const listingsResponse = await api.get('/listings/my-listings/');
      const userListings = listingsResponse.data.results || listingsResponse.data || [];
      const userListingIds = userListings.map((listing: any) => listing.id);
      
      // Get unique parking space IDs that need details
      const parkingSpaceIds = new Set();
      const bookingsToProcess = [];
      
      for (const booking of allBookings) {
        // Check if booking.parking_space is an ID (number) or object
        let parkingSpaceId;
        if (typeof booking.parking_space === 'number') {
          parkingSpaceId = booking.parking_space;
        } else if (booking.parking_space?.id) {
          parkingSpaceId = booking.parking_space.id;
        }
        
        // If this booking is for one of the user's listings, include it
        if (parkingSpaceId && userListingIds.includes(parkingSpaceId)) {
          bookingsToProcess.push(booking);
          
          // If we only have the ID, add it to the set for batch fetching
          if (typeof booking.parking_space === 'number') {
            parkingSpaceIds.add(booking.parking_space);
          }
        }
      }
      
      // Batch fetch all parking space details we need
      const parkingSpaceDetails = new Map();
      if (parkingSpaceIds.size > 0) {
        try {
          // Use the user's listings data we already have
          for (const listing of userListings) {
            if (parkingSpaceIds.has(listing.id)) {
              parkingSpaceDetails.set(listing.id, listing);
            }
          }
        } catch (error) {
          console.error('Error loading parking space details:', error);
        }
      }
      
      // Filter bookings with enriched parking space data
      const hostBookings = [];
      for (const booking of bookingsToProcess) {
        let parkingSpaceData = booking.parking_space;
        
        if (typeof booking.parking_space === 'number') {
          parkingSpaceData = parkingSpaceDetails.get(booking.parking_space);
          if (!parkingSpaceData) {
            continue; // Skip this booking if we can't get space details
          }
        }
        
        hostBookings.push({
          ...booking,
          parking_space: parkingSpaceData
        });
      }
      
      setBookings(hostBookings);
      setDataLoaded(true);
    } catch (error: any) {
      console.error('Error loading host bookings:', error);
      if (error.response?.status === 401) {
        setBookings([]);
        return;
      }
      toast.error('Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (booking: HostBooking) => {
    try {
      await api.post(`/bookings/bookings/${booking.id}/confirm/`);
      toast.success('Booking confirmed!');
      setDataLoaded(false); // Reset to allow reload
      await refreshBookings(); // Refresh bookings from context
      loadHostBookings(); // Reload host bookings
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Failed to confirm booking');
    }
  };

  const handleCancelBooking = async (booking: HostBooking) => {
    try {
      await api.post(`/bookings/bookings/${booking.id}/cancel/`);
      toast.success('Booking cancelled!');
      setDataLoaded(false); // Reset to allow reload
      await refreshBookings(); // Refresh bookings from context
      loadHostBookings(); // Reload host bookings
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const recentBookings = bookings
    .filter(b => b.status !== 'pending')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Pending sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={600} sx={{ color: 'warning.main' }}>
                {pendingBookings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Requests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={600} sx={{ color: 'success.main' }}>
                {bookings.filter(b => b.status === 'confirmed').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Confirmed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={600} >
                ${Number(bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0)).toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Earned
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Requests */}
      {pendingBookings.length > 0 && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Pending Requests ({pendingBookings.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/host-bookings')}
                sx={{ borderRadius: 2 }}
              >
                View All
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {pendingBookings.slice(0, 2).map((booking) => (
                <Grid size={{ xs: 12, md: 6 }} key={booking.id}>
                  <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip
                        icon={getStatusIcon(booking.status)}
                        label={booking.status}
                        color={getStatusColor(booking.status)}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        #{booking.booking_id}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {booking.user_name || 'Customer'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {booking.parking_space?.title || 'Parking Space'}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(booking.start_time), 'MMM d, yyyy')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Amount:
                      </Typography>
                      <Typography variant="h6" fontWeight={600} >
                        ${typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : parseFloat(booking.total_amount || '0').toFixed(2)}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        fullWidth
                        onClick={() => handleConfirmBooking(booking)}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        fullWidth
                        onClick={() => handleCancelBooking(booking)}
                      >
                        Decline
                      </Button>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            
            {pendingBookings.length > 2 && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/host-bookings')}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  View All {pendingBookings.length} Pending Requests
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentBookings.length > 0 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Recent Bookings
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/host-bookings')}
                sx={{ borderRadius: 2 }}
              >
                View All
              </Button>
            </Box>
            
            <Stack spacing={2}>
              {recentBookings.map((booking) => (
                <Box 
                  key={booking.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bg, width: 32, height: 32 }}>
                      {booking.user_name?.charAt(0) || 'U'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {booking.user_name || 'Customer'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {booking.parking_space?.title || 'Parking Space'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={booking.status}
                      size="small"
                      color={getStatusColor(booking.status)}
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      ${typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : parseFloat(booking.total_amount || '0').toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {bookings.length === 0 && (
        <Card sx={{
          borderRadius: 3,
          border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          p: 6,
          textAlign: 'center',
        }}>
          <ScheduleIcon sx={{ fontSize: 64, color: 'action', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No Booking Requests Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Once you create parking listings, booking requests from renters will appear here.
          </Typography>
          <Button
            component={Link}
            to="/create-listing"
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Create Your First Listing
          </Button>
        </Card>
      )}

      {/* View All Button */}
      {bookings.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/host-bookings')}
            sx={{ borderRadius: 2, fontWeight: 600, px: 4 }}
          >
            View Full Host Bookings Page
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Mini MyListings component for dashboard listings tab
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
  rating_average: number;
  total_reviews: number;
  images: any[];
}

const MiniMyListings: React.FC = () => {
  const { user } = useAuth();
  const { bookings: allBookings } = useBookings();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMyListings();
    }
  }, [user?.id]);

  const loadMyListings = async () => {
    setLoading(true);
    try {
      if (!user) {
        setListings([]);
        return;
      }
      
      const response = await api.get('/listings/my-listings/');
      const listingsData = response.data.results || response.data || [];
      setListings(listingsData);
    } catch (error: any) {
      console.error('Error loading my listings:', error);
      if (error.response?.status === 401) {
        setListings([]);
        return;
      }
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  // Get bookings for a specific listing
  const getListingBookings = (listingId: number) => {
    return allBookings.filter(booking => {
      let parkingSpaceId;
      if (typeof booking.parking_space === 'number') {
        parkingSpaceId = booking.parking_space;
      } else if (booking.parking_space?.id) {
        parkingSpaceId = booking.parking_space.id;
      }
      return parkingSpaceId === listingId;
    });
  };

  // Get upcoming bookings for a listing
  const getUpcomingBookings = (listingId: number) => {
    const now = new Date();
    return getListingBookings(listingId).filter(booking => 
      new Date(booking.start_time) > now && 
      ['confirmed', 'pending'].includes(booking.status)
    );
  };

  // Get active bookings for a listing
  const getActiveBookings = (listingId: number) => {
    const now = new Date();
    return getListingBookings(listingId).filter(booking => 
      new Date(booking.start_time) <= now && 
      new Date(booking.end_time) > now && 
      ['confirmed', 'active'].includes(booking.status)
    );
  };

  // Handle message initiation
  const handleMessage = (booking: any) => {
    navigate('/messages', { 
      state: { 
        selectedBookingId: booking.id,
        bookingConversation: {
          id: `booking-${booking.id}`,
          conversation_id: `booking-${booking.booking_id}`,
          conversation_type: 'booking',
          status: 'active',
          title: `Booking: ${booking.parking_space?.title || 'Parking Space'}`,
          is_group: false,
          booking_id: booking.id,
          booking: booking,
          other_participant: booking.user || { id: booking.user, username: booking.user_name || 'Renter' },
          last_message_preview: null,
          unread_count: 0,
          last_activity_at: booking.created_at
        }
      } 
    });
  };

  const handleToggleStatus = async (listingId: number) => {
    const listing = listings.find(l => l.id === listingId);
    if (!listing) {
      toast.error('Listing not found. Please refresh the page.');
      loadMyListings();
      return;
    }
    
    const originalStatus = listing.is_active;
    
    try {
      // Optimistically update the UI
      setListings(prevListings => 
        prevListings.map(l => 
          l.id === listingId 
            ? { ...l, is_active: !l.is_active }
            : l
        )
      );
      
      const response = await api.post(`/listings/${listingId}/toggle_status/`);
      
      // Update with the server response to ensure consistency
      if (response.data) {
        setListings(prevListings => 
          prevListings.map(l => 
            l.id === listingId 
              ? { ...l, is_active: response.data.is_active }
              : l
          )
        );
      }
      
      toast.success(`Listing ${!originalStatus ? 'activated' : 'paused'} successfully!`);
    } catch (error: any) {
      console.error('Error toggling listing status:', error);
      
      // Revert the optimistic update on error
      setListings(prevListings => 
        prevListings.map(l => 
          l.id === listingId 
            ? { ...l, is_active: originalStatus }
            : l
        )
      );
      
      if (error.response?.status === 404) {
        toast.error('Listing not found. Please refresh the page.');
        loadMyListings();
      } else if (error.response?.status === 403) {
        toast.error('You do not have permission to modify this listing.');
      } else {
        toast.error('Failed to update listing status. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <LocationIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={600} >
                {listings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Listings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={600} sx={{ color: 'success.main' }}>
                {listings.filter(l => l.is_active).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Listings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={600} sx={{ color: 'warning.main' }}>
                ${listings.length > 0 ? (listings.reduce((sum, l) => sum + l.hourly_rate, 0) / listings.length).toFixed(0) : '0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg. Hourly Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <StarIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={600} sx={{ color: 'info.main' }}>
                {listings.length > 0 ? (listings.reduce((sum, l) => sum + Number(l.rating_average), 0) / listings.length).toFixed(1) : '0.0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg. Rating
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Listings */}
      {listings.length > 0 && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Your Listings ({listings.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/my-listings')}
                sx={{ borderRadius: 2 }}
              >
                View All
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {listings.slice(0, 4).map((listing) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={listing.id}>
                  <Card 
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    sx={{
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                      },
                    }}
                  >
                    <Box sx={{
                      height: 120,
                      background: listing.images?.length > 0 
                        ? `url(${listing.images[0].image_url})` 
                        : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: listing.images?.length > 0 ? 'flex-end' : 'center',
                      color: 'white',
                      position: 'relative',
                    }}>
                      {!listing.images?.length && (
                        <LocationIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
                      )}
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <Chip
                          label={listing.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={listing.is_active ? 'success' : 'default'}
                          sx={{ 
                            fontWeight: 500,
                            bgcolor: listing.is_active ? 'success.main' : 'grey.500',
                            color: 'white'
                          }}
                        />
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ mb: 1 }}>
                        {listing.title}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {listing.address}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          ${listing.hourly_rate}/hr
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarIcon sx={{ fontSize: 14, color: 'warning.main' }} />
                          <Typography variant="caption" fontWeight={600}>
                            {Number(listing.rating_average) > 0 ? Number(listing.rating_average).toFixed(1) : 'New'}
                          </Typography>
                        </Box>
                      </Box>

                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/create-listing?edit=${listing.id}`);
                          }}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={listing.is_active ? "outlined" : "contained"}
                          size="small"
                          fullWidth
                          color={listing.is_active ? "error" : "success"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(listing.id);
                          }}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {listing.is_active ? 'Pause' : 'Activate'}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {listings.length > 4 && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/my-listings')}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  View All {listings.length} Listings
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Bookings */}
      {listings.some(listing => getActiveBookings(listing.id).length > 0) && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3, color: 'success.main' }}>
              🟢 Active Bookings
            </Typography>
            
            {listings.map(listing => {
              const activeBookings = getActiveBookings(listing.id);
              if (activeBookings.length === 0) return null;
              
              return (
                <Box key={listing.id} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
                    {listing.title}
                  </Typography>
                  
                  <Stack spacing={2}>
                    {activeBookings.map(booking => (
                      <Paper 
                        key={booking.id} 
                        elevation={1} 
                        sx={{ 
                          p: 3, 
                          borderRadius: 2,
                          border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
                          bgcolor: alpha(theme.palette.success.main, 0.05)
                        }}
                      >
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                              {booking.user_name || 'Renter'} • {booking.vehicle_license_plate}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {formatAddressForDisplay(
                                listing.address,
                                listing.address?.split(',').slice(-2).join(', ') || '',
                                true, // is host
                                true // always show for host
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(booking.start_time), 'MMM d, h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'row', sm: 'column' } }}>
                            <Chip
                              label={booking.status}
                              color="success"
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<MessageIcon />}
                              onClick={() => handleMessage(booking)}
                              sx={{ minWidth: 'auto' }}
                            >
                              Message
                            </Button>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Bookings */}
      {listings.some(listing => getUpcomingBookings(listing.id).length > 0) && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 3,  }}>
              📅 Upcoming Bookings
            </Typography>
            
            {listings.map(listing => {
              const upcomingBookings = getUpcomingBookings(listing.id);
              if (upcomingBookings.length === 0) return null;
              
              return (
                <Box key={listing.id} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 2 }}>
                    {listing.title}
                  </Typography>
                  
                  <Stack spacing={2}>
                    {upcomingBookings.slice(0, 3).map(booking => (
                      <Paper 
                        key={booking.id} 
                        elevation={1} 
                        sx={{ 
                          p: 3, 
                          borderRadius: 2,
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          bgcolor: alpha(theme.palette.primary.main, 0.05)
                        }}
                      >
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>
                              {booking.user_name || 'Renter'} • {booking.vehicle_license_plate}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {formatAddressForDisplay(
                                listing.address,
                                listing.address?.split(',').slice(-2).join(', ') || '',
                                true, // is host
                                true // always show for host
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {format(new Date(booking.start_time), 'MMM d, h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'row', sm: 'column' } }}>
                            <Chip
                              label={booking.status}
                              color={booking.status === 'confirmed' ? 'success' : 'warning'}
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<MessageIcon />}
                              onClick={() => handleMessage(booking)}
                              sx={{ minWidth: 'auto' }}
                            >
                              Message
                            </Button>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
            Quick Actions
          </Typography>
          
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<AddIcon />}
                onClick={() => navigate('/create-listing')}
                sx={{ py: 2, borderRadius: 2, fontWeight: 600 }}
              >
                Add New Listing
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ViewIcon />}
                onClick={() => navigate('/my-listings')}
                sx={{ py: 2, borderRadius: 2, fontWeight: 600 }}
              >
                Manage All
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<TrendingIcon />}
                onClick={() => navigate('/earnings')}
                sx={{ py: 2, borderRadius: 2, fontWeight: 600 }}
              >
                View Earnings
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<StarIcon />}
                onClick={() => navigate('/reviews')}
                sx={{ py: 2, borderRadius: 2, fontWeight: 600 }}
              >
                View Reviews
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Empty State */}
      {listings.length === 0 && (
        <Card sx={{
          borderRadius: 3,
          border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          p: 6,
          textAlign: 'center',
        }}>
          <LocationIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No Listings Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first parking listing to start earning money from your space.
          </Typography>
          <Button
            component={Link}
            to="/create-listing"
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Create Your First Listing
          </Button>
        </Card>
      )}

      {/* View All Button */}
      {listings.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/my-listings')}
            sx={{ borderRadius: 2, fontWeight: 600, px: 4 }}
          >
            View Full My Listings Page
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Mini MyBookings component for dashboard bookings tab
interface UserBooking {
  id: number;
  booking_id: string;
  parking_space: {
    id: number;
    title: string;
    address: string;
    hourly_rate: number;
  };
  start_time: string;
  end_time: string;
  total_amount: number;
  status: string;
  created_at: string;
  vehicle_license_plate?: string;
  vehicle_make_model?: string;
}

const MiniMyBookings: React.FC = () => {
  const { user } = useAuth();
  const { bookings: allBookings, refreshBookings } = useBookings();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && allBookings.length >= 0) {
      loadMyBookings();
    }
  }, [user?.id, allBookings.length]);

  const loadMyBookings = async () => {
    setLoading(true);
    try {
      if (!user) {
        setBookings([]);
        return;
      }

      // Filter bookings made by the current user (not hosting)
      const userBookings = allBookings.filter(booking => booking.user === user.id);
      
      // Get unique parking space IDs that need details
      const spaceIds = new Set();
      const bookingsToProcess = [];
      
      for (const booking of userBookings) {
        if (typeof booking.parking_space === 'number') {
          spaceIds.add(booking.parking_space);
        }
        bookingsToProcess.push(booking);
      }
      
      // Batch fetch all parking space details we need
      const spaceDetails = new Map();
      if (spaceIds.size > 0) {
        try {
          // Get user's listings (which includes spaces they book from)
          const listingsResponse = await api.get('/listings/');
          const allListings = listingsResponse.data.results || listingsResponse.data || [];
          
          for (const listing of allListings) {
            if (spaceIds.has(listing.id)) {
              spaceDetails.set(listing.id, listing);
            }
          }
        } catch (error) {
          console.error('Error loading parking space details:', error);
        }
      }
      
      // Enrich bookings with parking space details
      const enrichedBookings = [];
      for (const booking of bookingsToProcess) {
        let parkingSpaceData = booking.parking_space;
        
        if (typeof booking.parking_space === 'number') {
          parkingSpaceData = spaceDetails.get(booking.parking_space);
          if (!parkingSpaceData) {
            // Fallback: create a minimal space object
            parkingSpaceData = {
              id: booking.parking_space,
              title: 'Parking Space',
              address: 'Location',
              hourly_rate: 0
            };
          }
        }
        
        enrichedBookings.push({
          ...booking,
          parking_space: parkingSpaceData
        });
      }
      
      setBookings(enrichedBookings);
    } catch (error: any) {
      console.error('Error loading my bookings:', error);
      if (error.response?.status === 401) {
        setBookings([]);
        return;
      }
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  
  const upcomingBookings = bookings.filter(b => 
    new Date(b.start_time) > now && 
    ['confirmed', 'pending'].includes(b.status)
  );
  
  const activeBookings = bookings.filter(b => 
    new Date(b.start_time) <= now && 
    new Date(b.end_time) > now && 
    ['confirmed', 'active'].includes(b.status)
  );
  
  const pastBookings = bookings
    .filter(b => new Date(b.end_time) < now)
    .sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime())
    .slice(0, 3);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <BookingIcon sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={600} >
                {bookings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Bookings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={600} sx={{ color: 'success.main' }}>
                {upcomingBookings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upcoming
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={600} sx={{ color: 'info.main' }}>
                {activeBookings.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Now
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 32, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" fontWeight={600} sx={{ color: 'warning.main' }}>
                ${Number(bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0)).toFixed(0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Spent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <Card sx={{ borderRadius: 3, mb: 3, border: '2px solid', borderColor: 'info.main' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: 'info.main' }} />
                Active Bookings ({activeBookings.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/my-bookings')}
                sx={{ borderRadius: 2 }}
              >
                View All
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {activeBookings.slice(0, 2).map((booking) => (
                <Grid size={{ xs: 12, md: 6 }} key={booking.id}>
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: 2, 
                    border: '2px solid', 
                    borderColor: 'info.main',
                    bgcolor: alpha(theme.palette.info.main, 0.02)
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip
                        icon={<CheckCircle />}
                        label="Active Now"
                        color="info"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        #{booking.booking_id}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {booking.parking_space?.title || 'Parking Space'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {booking.parking_space?.address 
                          ? formatAddressForDisplay(
                              booking.parking_space.address,
                              booking.parking_space.address.split(',').slice(-2).join(', '),
                              false,
                              !!booking.actual_start_time
                            )
                          : 'Location'
                        }
                      </Typography>
                      {booking.parking_space?.address && !booking.actual_start_time && (
                        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                          📍 Full address available after check-in
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Started: {format(new Date(booking.start_time), 'MMM d, h:mm a')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ends: {format(new Date(booking.end_time), 'MMM d, h:mm a')}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Amount:
                      </Typography>
                      <Typography variant="h6" fontWeight={600} >
                        ${typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : parseFloat(booking.total_amount || '0').toFixed(2)}
                      </Typography>
                    </Box>

                    {/* Single Action Button */}
                    {(() => {
                      const now = new Date();
                      const startTime = new Date(booking.start_time);
                      const endTime = new Date(booking.end_time);
                      
                      // Single button logic
                      if (booking.status === 'active') {
                        // Already checked in, show only checkout
                        return (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            fullWidth
                            onClick={async () => {
                              try {
                                console.log('🔄 Starting check-out process...');
                                const response = await api.post(`/bookings/bookings/${booking.id}/complete/`);
                                console.log('✅ Check-out API response:', response.data);
                                toast.success('Checked out successfully!');
                                
                                // Force refresh all booking data
                                console.log('🔄 Refreshing booking data...');
                                await refreshBookings(); // Refresh context bookings first
                                await loadMyBookings(); // Then refresh local bookings
                                console.log('✅ Booking data refreshed');
                              } catch (error) {
                                console.error('❌ Check-out error:', error);
                                toast.error('Failed to check out');
                              }
                            }}
                            sx={{ mt: 2 }}
                          >
                            Check Out
                          </Button>
                        );
                      } else if (booking.status === 'confirmed' && now >= startTime && now <= endTime) {
                        // Within booking window, show only checkin
                        return (
                          <Button
                            variant="contained"
                            
                            size="small"
                            fullWidth
                            onClick={async () => {
                              try {
                                console.log('🔄 Starting check-in process...');
                                console.log('📍 Booking ID:', booking.id);
                                console.log('📍 API URL:', `/bookings/bookings/${booking.id}/start/`);
                                
                                const response = await api.post(`/bookings/bookings/${booking.id}/start/`);
                                console.log('✅ Check-in API response:', response);
                                console.log('✅ Response data:', response.data);
                                toast.success('Checked in successfully!');
                                
                                // Force refresh all booking data
                                console.log('🔄 Refreshing booking data...');
                                await refreshBookings(); // Refresh context bookings first
                                await loadMyBookings(); // Then refresh local bookings
                                console.log('✅ Booking data refreshed');
                              } catch (error: any) {
                                console.error('❌ Check-in error:', error);
                                console.error('❌ Error response:', error.response);
                                console.error('❌ Error status:', error.response?.status);
                                console.error('❌ Error data:', error.response?.data);
                                toast.error(`Failed to check in: ${error.response?.data?.error || error.message}`);
                              }
                            }}
                            sx={{ mt: 2 }}
                          >
                            Check In
                          </Button>
                        );
                      } else {
                        // No action available
                        return null;
                      }
                    })()}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Upcoming Bookings ({upcomingBookings.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/my-bookings')}
                sx={{ borderRadius: 2 }}
              >
                View All
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              {upcomingBookings.slice(0, 2).map((booking) => (
                <Grid size={{ xs: 12, md: 6 }} key={booking.id}>
                  <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip
                        icon={getStatusIcon(booking.status)}
                        label={booking.status}
                        color={getStatusColor(booking.status)}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        #{booking.booking_id}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {booking.parking_space?.title || 'Parking Space'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {booking.parking_space?.address 
                          ? formatAddressForDisplay(
                              booking.parking_space.address,
                              booking.parking_space.address.split(',').slice(-2).join(', '),
                              false,
                              !!booking.actual_start_time
                            )
                          : 'Location'
                        }
                      </Typography>
                      {booking.parking_space?.address && !booking.actual_start_time && (
                        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                          📍 Full address available after check-in
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(booking.start_time), 'MMM d, yyyy')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Amount:
                      </Typography>
                      <Typography variant="h6" fontWeight={600} >
                        ${typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : parseFloat(booking.total_amount || '0').toFixed(2)}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Recent Bookings */}
      {pastBookings.length > 0 && (
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={600}>
                Recent Bookings
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/my-bookings')}
                sx={{ borderRadius: 2 }}
              >
                View All
              </Button>
            </Box>
            
            <Stack spacing={2}>
              {pastBookings.map((booking) => (
                <Box 
                  key={booking.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bg, width: 32, height: 32 }}>
                      <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {booking.parking_space?.title || 'Parking Space'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(booking.start_time), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={booking.status}
                      size="small"
                      color={getStatusColor(booking.status)}
                      sx={{ mb: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      ${typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : parseFloat(booking.total_amount || '0').toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {bookings.length === 0 && (
        <Card sx={{
          borderRadius: 3,
          border: `2px dashed ${alpha(theme.palette.success.main, 0.3)}`,
          bgcolor: alpha(theme.palette.success.main, 0.02),
          p: 6,
          textAlign: 'center',
        }}>
          <BookingIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No Bookings Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Browse parking spots in your area and make your first booking!
          </Typography>
          <Button
            component={Link}
            to="/listings"
            variant="contained"
            size="large"
            color="success"
            startIcon={<LocationIcon />}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Find Parking Spots
          </Button>
        </Card>
      )}

      {/* View All Button */}
      {bookings.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/my-bookings')}
            sx={{ borderRadius: 2, fontWeight: 600, px: 4 }}
          >
            View Full My Bookings Page
          </Button>
        </Box>
      )}
    </Box>
  );
};

// Mock data for testing/demo accounts
const mockListings = [
  {
    id: 1,
    title: 'Secure Garage Space in Manhattan',
    address: '123 Main St, Manhattan, NY',
    hourlyRate: 15,
    dailyRate: 120,
    isActive: true,
    bookings: 5,
    rating: 4.8,
    image: '/api/placeholder/300/200',
  },
  {
    id: 2,
    title: 'Covered Parking Near Brooklyn Bridge',
    address: '456 Bridge St, Brooklyn, NY',
    hourlyRate: 8,
    dailyRate: 60,
    isActive: true,
    bookings: 3,
    rating: 4.6,
    image: '/api/placeholder/300/200',
  },
];

const mockBookings = [
  {
    id: 1,
    listingTitle: 'Secure Garage Space in Manhattan',
    renterName: 'John Smith',
    renterAvatar: '/api/placeholder/40/40',
    startDate: '2024-12-20',
    endDate: '2024-12-20',
    amount: 120,
    status: 'confirmed',
  },
  {
    id: 2,
    listingTitle: 'Covered Parking Near Brooklyn Bridge',
    renterName: 'Jane Doe',
    renterAvatar: '/api/placeholder/40/40',
    startDate: '2024-12-21',
    endDate: '2024-12-21',
    amount: 60,
    status: 'pending',
  },
];

const stats = [
  { name: 'Total Listings', value: '2', icon: LocationIcon, change: '+12%', color: 'primary', route: '/my-listings' },
  { name: 'This Month Bookings', value: '8', icon: ScheduleIcon, change: '+23%', color: 'success', route: '/my-bookings' },
  { name: 'Total Earnings', value: '$1,240', icon: MoneyIcon, change: '+18%', color: 'warning', route: '/earnings' },
  { name: 'Avg. Rating', value: '4.8', icon: StarIcon, change: '+5%', color: 'info', route: '/reviews' },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Fresh Dashboard for New Users - Now using same layout as existing users
const NewUserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const navigate = useNavigate();
  const theme = useTheme();
  const [listingsCount, setListingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showGettingStarted, setShowGettingStarted] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load user's listings count
      const listingsResponse = await api.get('/listings/my-listings/');
      const listings = listingsResponse.data.results || listingsResponse.data || [];
      setListingsCount(listings.length);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setListingsCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  // Create stats for new user with zero values
  const newUserStats = [
    { name: 'Total Listings', value: loading ? '...' : listingsCount.toString(), icon: LocationIcon, change: 'Start hosting!', color: 'primary', route: '/create-listing' },
    { name: 'This Month Bookings', value: loading ? '...' : bookings.length.toString(), icon: ScheduleIcon, change: 'Coming soon', color: 'success', route: '/my-bookings' },
    { name: 'Total Earnings', value: loading ? '...' : '$0', icon: MoneyIcon, change: 'Get started', color: 'warning', route: '/earnings' },
    { name: 'Avg. Rating', value: loading ? '...' : '—', icon: StarIcon, change: 'Build reputation', color: 'info', route: '/reviews' },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
    }}>
      {/* Hero Header */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        py: 6,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in timeout={800}>
            <Box>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
                    Welcome to Parking in a Pinch, {user?.first_name}! 🎉
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                    Your parking journey starts here. Let's get you set up!
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'right' }, mt: { xs: 3, md: 0 } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'flex-end' }}>
                    <Button
                      component={Link}
                      to="/listings"
                      variant="contained"
                      size="large"
                      startIcon={<LocationIcon />}
                      sx={{
                        bgcolor: 'success.main',
                        color: 'white',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: 'success.dark',
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[8],
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Browse Spots
                    </Button>
                    <Button
                      component={Link}
                      to="/create-listing"
                      variant="contained"
                      size="large"
                      startIcon={<AddIcon />}
                      sx={{
                        bgcolor: 'white',
                        color: 'primary.main',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.common.white, 0.9),
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[8],
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Add New Listing
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                minHeight: 60,
                px: 3,
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 2,
              },
            }}
          >
            <Tab icon={<DashboardIcon />} iconPosition="start" label="Overview" />
            <Tab icon={<ListIcon />} iconPosition="start" label="My Listings" />
            <Tab icon={<BookingIcon />} iconPosition="start" label="Bookings" />
            <Tab icon={<WalletIcon />} iconPosition="start" label="Earnings" />
            <Tab icon={<ScheduleIcon />} iconPosition="start" label="Requests" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <CustomTabPanel value={activeTab} index={0}>
          <Box sx={{ space: 4 }}>
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {newUserStats.map((stat, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.name}>
                  <Zoom in timeout={500 + index * 100}>
                    <Card 
                      onClick={() => navigate(stat.route)}
                      sx={{
                        borderRadius: 3,
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <stat.icon sx={{ fontSize: 32, color: `${stat.color}.main`, mb: 1 }} />
                        <Typography variant="h5" fontWeight={600} sx={{ color: `${stat.color}.main` }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>

            {/* Calendar and Getting Started Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Availability Calendar */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <AvailabilityCalendar
                  parkingSpaceId={null} // New users don't have listings yet
                  existingBookings={[]} // No bookings for new users
                  onDateSelect={(date) => {
                    console.log('Selected date:', date);
                    setSelectedDate(date);
                  }}
                  onBookingClick={(booking) => {
                    console.log('Clicked booking:', booking);
                    navigate('/my-bookings');
                  }}
                />
              </Grid>

              {/* Getting Started Guide or Recent Activity */}
              <Grid size={{ xs: 12, lg: 4 }}>
                {showGettingStarted ? (
                  <Card sx={{
                    borderRadius: 3,
                    boxShadow: theme.shadows[4],
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    height: 'fit-content',
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Getting Started
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Follow these steps to get the most out of Parking in a Pinch
                      </Typography>
                      
                      <Stack spacing={2}>
                        {[
                          { step: 1, text: 'Create your first parking listing', action: () => navigate('/create-listing'), color: 'primary.main', done: listingsCount > 0 },
                          { step: 2, text: 'Browse available parking spots', action: () => navigate('/listings'), color: 'success.main', done: false },
                          { step: 3, text: 'Complete your profile', action: () => navigate('/profile'), color: 'info.main', done: false },
                          { step: 4, text: 'Start earning from bookings', action: () => navigate('/earnings'), color: 'warning.main', done: false },
                          { step: 5, text: 'I got it!', action: () => setShowGettingStarted(false), color: 'secondary.main', done: false },
                        ].map((item, index) => (
                          <Box 
                            key={index}
                            onClick={item.action}
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 2,
                              p: 2,
                              borderRadius: 2,
                              bgcolor: alpha(theme.palette.primary.main, 0.02),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                transform: 'translateY(-2px)',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                bgcolor: item.done ? 'success.main' : item.color,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                flexShrink: 0,
                              }}
                            >
                              {item.done ? '✓' : item.step}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {item.text}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ) : (
                  <Card sx={{
                    borderRadius: 3,
                    boxShadow: theme.shadows[4],
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    height: 'fit-content',
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" fontWeight={600}>
                          Recent Activity
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setShowGettingStarted(true)}
                          sx={{ borderRadius: 2 }}
                        >
                          Show Guide
                        </Button>
                      </Box>
                      
                      {bookings.length > 0 ? (
                        <Stack spacing={2}>
                          {bookings.slice(0, 3).map((booking, index) => (
                            <Box 
                              key={booking.id}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.02),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bg, width: 32, height: 32 }}>
                                  <ScheduleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={500}>
                                    Booking #{booking.booking_id || booking.id}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {format(new Date(booking.created_at || new Date()), 'MMM d, yyyy')}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Chip
                                  label={booking.status}
                                  size="small"
                                  color={getStatusColor(booking.status)}
                                  sx={{ mb: 0.5 }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  ${typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : parseFloat(booking.total_amount || '0').toFixed(2)}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="body2" color="text.secondary">
                            No activity yet. Start by creating a listing or booking a space!
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>

            {/* Welcome Message */}
            <Card sx={{
              borderRadius: 3,
              boxShadow: theme.shadows[4],
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Welcome to the Community!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  You're part of a growing community of parking space hosts and seekers. Start by listing your first parking space or browsing available spots in your area.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/create-listing')}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  >
                    List Your Space
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<LocationIcon />}
                    onClick={() => navigate('/listings')}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  >
                    Find Parking
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </CustomTabPanel>

        {/* My Listings Tab */}
        <CustomTabPanel value={activeTab} index={1}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            My Listings
          </Typography>
          
          <MiniMyListings />
        </CustomTabPanel>

        {/* Bookings Tab */}
        <CustomTabPanel value={activeTab} index={2}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            My Bookings
          </Typography>
          
          <MiniMyBookings />
        </CustomTabPanel>

        {/* Earnings Tab */}
        <CustomTabPanel value={activeTab} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={600}>
              Earnings Overview
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/earnings')}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              View Full Earnings
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {/* Earnings Summary */}
            <Grid size={12}>
              <Card sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                mb: 3,
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight={700}>
                          $0
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Total Earnings
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight={700}>
                          $0
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          This Month
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight={700}>
                          —
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Average per Booking
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Earning Potential */}
            <Grid size={12}>
              <Card sx={{
                borderRadius: 3,
                boxShadow: theme.shadows[4],
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    Start Earning Today
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    List your parking space and start earning passive income. Many hosts earn $200-500 per month!
                  </Typography>
                  <Button
                    component={Link}
                    to="/create-listing"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                  >
                    Create Your First Listing
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CustomTabPanel>

        {/* Requests Tab */}
        <CustomTabPanel value={activeTab} index={4}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Booking Requests
          </Typography>
          
          <MiniHostBookings />
        </CustomTabPanel>
      </Container>
    </Box>
  );
};

// Existing Dashboard for Users with Data
const ExistingUserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { bookings } = useBookings();
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [listings, setListings] = useState<any[]>([]);
  const [hostBookings, setHostBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalListings: 0,
    thisMonthBookings: 0,
    thisMonthBookingsChange: 0,
    totalEarnings: 0,
    totalEarningsChange: 0,
    avgRating: 0,
    avgRatingChange: 0,
  });

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id, bookings]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load user's listings
      const listingsResponse = await api.get('/listings/my-listings/');
      const userListings = listingsResponse.data.results || listingsResponse.data || [];
      setListings(userListings);

      // Load user's host bookings (bookings for their listings)
      const userListingIds = userListings.map(listing => listing.id);
      const allBookings = Array.isArray(bookings) ? bookings : [];
      
      const hostBookings = allBookings.filter(booking => {
        let parkingSpaceId;
        if (typeof booking.parking_space === 'number') {
          parkingSpaceId = booking.parking_space;
        } else if (booking.parking_space?.id) {
          parkingSpaceId = booking.parking_space.id;
        }
        return parkingSpaceId && userListingIds.includes(parkingSpaceId);
      });
      
      setHostBookings(hostBookings);
      
      // Calculate dashboard statistics
      calculateDashboardStats(userListings, hostBookings);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDashboardStats = (userListings: any[], hostBookings: any[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Total Listings
    const totalListings = userListings.length;

    // This Month Bookings
    const thisMonthBookings = hostBookings.filter(booking => {
      const bookingDate = new Date(booking.created_at || booking.start_time);
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    });

    const lastMonthBookings = hostBookings.filter(booking => {
      const bookingDate = new Date(booking.created_at || booking.start_time);
      return bookingDate.getMonth() === lastMonth && bookingDate.getFullYear() === lastMonthYear;
    });

    const thisMonthBookingsChange = lastMonthBookings.length > 0 
      ? ((thisMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100
      : thisMonthBookings.length > 0 ? 100 : 0;

    // Total Earnings (from completed bookings)
    const completedBookings = hostBookings.filter(b => b.status === 'COMPLETED');
    const totalEarnings = completedBookings.reduce((sum, booking) => {
      const amount = booking.total_amount || 0;
      const fee = booking.platform_fee || 0;
      return sum + (amount - fee);
    }, 0);

    const thisMonthEarnings = thisMonthBookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, booking) => {
        const amount = booking.total_amount || 0;
        const fee = booking.platform_fee || 0;
        return sum + (amount - fee);
      }, 0);

    const lastMonthEarnings = lastMonthBookings
      .filter(b => b.status === 'COMPLETED')
      .reduce((sum, booking) => {
        const amount = booking.total_amount || 0;
        const fee = booking.platform_fee || 0;
        return sum + (amount - fee);
      }, 0);

    const totalEarningsChange = lastMonthEarnings > 0 
      ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
      : thisMonthEarnings > 0 ? 100 : 0;

    // Average Rating
    const listingsWithRatings = userListings.filter(l => l.rating_average && Number(l.rating_average) > 0);
    const avgRating = listingsWithRatings.length > 0 
      ? listingsWithRatings.reduce((sum, l) => sum + (Number(l.rating_average) || 0), 0) / listingsWithRatings.length 
      : 0;

    // For rating change, we'll use a simple calculation (could be enhanced with historical data)
    const avgRatingChange = avgRating >= 4.5 ? 5 : avgRating >= 4.0 ? 2 : 0;

    setDashboardStats({
      totalListings,
      thisMonthBookings: thisMonthBookings.length,
      thisMonthBookingsChange,
      totalEarnings,
      totalEarningsChange,
      avgRating,
      avgRatingChange,
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
    }}>
      {/* Hero Header */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        py: 6,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in timeout={800}>
            <Box>
              <Grid container alignItems="center" justifyContent="space-between">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="h3" component="h1" fontWeight={700} gutterBottom>
                    Welcome back, {user?.first_name}! 👋
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                    Manage your parking spaces and track your earnings
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: { xs: 'left', md: 'right' }, mt: { xs: 3, md: 0 } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'flex-end' }}>
                    <Button
                      component={Link}
                      to="/listings"
                      variant="contained"
                      size="large"
                      startIcon={<LocationIcon />}
                      sx={{
                        bgcolor: 'success.main',
                        color: 'white',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: 'success.dark',
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[8],
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Browse Spots
                    </Button>
                    <Button
                      component={Link}
                      to="/create-listing"
                      variant="contained"
                      size="large"
                      startIcon={<AddIcon />}
                      sx={{
                        bgcolor: 'white',
                        color: 'primary.main',
                        fontWeight: 600,
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.common.white, 0.9),
                          transform: 'translateY(-2px)',
                          boxShadow: theme.shadows[8],
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Add New Listing
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                minHeight: 60,
                px: 3,
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 2,
              },
            }}
          >
            <Tab icon={<DashboardIcon />} iconPosition="start" label="Overview" />
            <Tab icon={<ListIcon />} iconPosition="start" label="My Listings" />
            <Tab icon={<BookingIcon />} iconPosition="start" label="Bookings" />
            <Tab icon={<WalletIcon />} iconPosition="start" label="Earnings" />
            <Tab icon={<ScheduleIcon />} iconPosition="start" label="Requests" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <CustomTabPanel value={activeTab} index={0}>
          <Box sx={{ space: 4 }}>
            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                { 
                  name: 'Total Listings', 
                  value: dashboardStats.totalListings.toString(), 
                  icon: LocationIcon, 
                  change: dashboardStats.totalListings > 0 ? `+${dashboardStats.totalListings}` : '0', 
                  color: 'primary', 
                  route: '/my-listings' 
                },
                { 
                  name: 'This Month Bookings', 
                  value: dashboardStats.thisMonthBookings.toString(), 
                  icon: ScheduleIcon, 
                  change: `${dashboardStats.thisMonthBookingsChange >= 0 ? '+' : ''}${Math.round(dashboardStats.thisMonthBookingsChange)}%`, 
                  color: 'success', 
                  route: '/my-bookings' 
                },
                { 
                  name: 'Total Earnings', 
                  value: `$${Math.round(dashboardStats.totalEarnings).toLocaleString()}`, 
                  icon: MoneyIcon, 
                  change: `${dashboardStats.totalEarningsChange >= 0 ? '+' : ''}${Math.round(dashboardStats.totalEarningsChange)}%`, 
                  color: 'warning', 
                  route: '/earnings' 
                },
                { 
                  name: 'Avg. Rating', 
                  value: dashboardStats.avgRating > 0 ? dashboardStats.avgRating.toFixed(1) : 'N/A', 
                  icon: StarIcon, 
                  change: dashboardStats.avgRating > 0 ? `+${Math.round(dashboardStats.avgRatingChange)}%` : '0%', 
                  color: 'info', 
                  route: '/reviews' 
                },
              ].map((stat, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.name}>
                  <Zoom in timeout={500 + index * 100}>
                    <Card 
                      onClick={() => navigate(stat.route)}
                      sx={{
                        borderRadius: 3,
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <stat.icon sx={{ fontSize: 32, color: `${stat.color}.main`, mb: 1 }} />
                        <Typography variant="h5" fontWeight={600} sx={{ color: `${stat.color}.main` }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Zoom>
                </Grid>
              ))}
            </Grid>

            {/* Calendar and Bookings Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Availability Calendar */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <EnhancedAvailabilityCalendar />
              </Grid>

              {/* Recent Activity */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <EnhancedRecentActivity />
              </Grid>
            </Grid>

            {/* Recent Bookings Table */}
            <EnhancedRecentBookings />
          </Box>
        </CustomTabPanel>

        {/* My Listings Tab */}
        <CustomTabPanel value={activeTab} index={1}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            My Listings
          </Typography>
          
          <MiniMyListings />
        </CustomTabPanel>

        {/* Bookings Tab */}
        <CustomTabPanel value={activeTab} index={2}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            My Bookings
          </Typography>
          
          <MiniMyBookings />
        </CustomTabPanel>

        {/* Earnings Tab */}
        <CustomTabPanel value={activeTab} index={3}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Earnings Overview
          </Typography>
          
          <Grid container spacing={3}>
            {/* Earnings Summary */}
            <Grid size={12}>
              <Card sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                mb: 3,
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight={700}>
                          $1,240
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Total Earnings
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight={700}>
                          $320
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          This Month
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight={700}>
                          $85
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Average per Booking
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Payouts */}
            <Grid size={12}>
              <Card sx={{
                borderRadius: 3,
                boxShadow: theme.shadows[4],
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    Recent Payouts
                  </Typography>
                  <Stack spacing={2}>
                    {[
                      { date: 'December 15, 2024', amount: 180 },
                      { date: 'December 8, 2024', amount: 140 },
                      { date: 'December 1, 2024', amount: 95 },
                    ].map((payout, index) => (
                      <Box 
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.02),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          {payout.date}
                        </Typography>
                        <Typography variant="body1" fontWeight={600} color="success.main">
                          +${payout.amount}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                  
                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Button
                      variant="contained"
                      startIcon={<WalletIcon />}
                      onClick={() => navigate('/earnings')}
                      sx={{ borderRadius: 2 }}
                    >
                      View Full Earnings
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CustomTabPanel>

        {/* Requests Tab */}
        <CustomTabPanel value={activeTab} index={4}>
          <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
            Booking Requests
          </Typography>
          
          <MiniHostBookings />
        </CustomTabPanel>
      </Container>
    </Box>
  );
};

// Enhanced Calendar Component with Real Data
const EnhancedAvailabilityCalendar: React.FC = () => {
  const { bookings } = useBookings();
  const navigate = useNavigate();
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      const response = await api.get('/listings/my-listings/');
      const listingsData = response.data.results || response.data || [];
      setListings(listingsData);
      if (listingsData.length > 0) {
        setSelectedListing(listingsData[0]);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  // Convert bookings to calendar format
  const calendarBookings = bookings
    .filter(booking => {
      if (!selectedListing) return false;
      const parkingSpaceId = typeof booking.parking_space === 'number' 
        ? booking.parking_space 
        : booking.parking_space?.id;
      return parkingSpaceId === selectedListing.id;
    })
    .map(booking => ({
      id: booking.id,
      start_time: booking.start_time,
      end_time: booking.end_time,
      status: booking.status as 'confirmed' | 'pending' | 'cancelled',
      renter_name: booking.user_name || 'Customer'
    }));

  return (
    <Box>
      {/* Listing Selector */}
      {listings.length > 1 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Select Parking Space:
          </Typography>
          <Grid container spacing={1}>
            {listings.map((listing) => (
              <Grid key={listing.id}>
                <Chip
                  label={listing.title}
                  onClick={() => setSelectedListing(listing)}
                  color={selectedListing?.id === listing.id ? 'primary' : 'default'}
                  variant={selectedListing?.id === listing.id ? 'filled' : 'outlined'}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <AvailabilityCalendar
        parkingSpaceId={selectedListing?.id || null}
        existingBookings={calendarBookings}
        onDateSelect={(date) => {
          console.log('Selected date:', date);
          setSelectedDate(date);
        }}
        onBookingClick={(booking) => {
          console.log('Clicked booking:', booking);
          navigate('/host-bookings');
        }}
      />
    </Box>
  );
};

// Enhanced Recent Activity Component with Notification, Booking and Listing Data
const EnhancedRecentActivity: React.FC = () => {
  const { notifications, markAsRead } = useNotifications();
  const { bookings } = useBookings();
  const theme = useTheme();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    loadListings();
  }, []);

  useEffect(() => {
    generateRecentActivities();
  }, [notifications, bookings, listings]);

  const loadListings = async () => {
    try {
      const response = await api.get('/listings/my-listings/');
      const listingsData = response.data.results || response.data || [];
      setListings(listingsData);
    } catch (error) {
      console.error('Error loading listings for activity feed:', error);
    }
  };

  const generateRecentActivities = () => {
    const allActivities: any[] = [];

    // 1. Add notification activities
    const notificationActivities = notifications
      .filter(notification => {
        const relevantTypes = [
          'booking_confirmed',
          'booking_cancelled', 
          'payment_received',
          'new_message',
          'listing_approved',
          'listing_rejected',
          'review_received'
        ];
        return relevantTypes.includes(notification.type);
      })
      .map(notification => ({
        id: `notification-${notification.id}`,
        type: notification.type,
        title: notification.title,
        text: notification.message,
        time: getTimeAgo(notification.created_at),
        timestamp: new Date(notification.created_at),
        color: getActivityColor(notification.type),
        isRead: notification.is_read,
        action: () => handleActivityClick(notification)
      }));

    allActivities.push(...notificationActivities);

    // 2. Add upcoming bookings (next 24-48 hours)
    const now = new Date();
    const upcomingCutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
    
    const upcomingBookings = bookings
      .filter(booking => {
        const startTime = new Date(booking.start_time);
        return startTime > now && 
               startTime <= upcomingCutoff && 
               ['confirmed', 'pending'].includes(booking.status);
      })
      .map(booking => {
        const startTime = new Date(booking.start_time);
        const listingTitle = typeof booking.parking_space === 'object' 
          ? booking.parking_space?.title 
          : listings.find(l => l.id === booking.parking_space)?.title || 'Parking Space';
        
        return {
          id: `booking-upcoming-${booking.id}`,
          type: 'booking_upcoming',
          title: '📅 Upcoming Booking',
          text: `${booking.user_name || 'Guest'} - ${listingTitle} (${startTime.toLocaleString()})`,
          time: getTimeAgo(booking.created_at),
          timestamp: startTime, // Use start time for sorting
          color: getActivityColor('booking_upcoming'),
          isRead: true,
          action: () => navigate('/host-bookings')
        };
      });

    allActivities.push(...upcomingBookings);

    // 3. Add active bookings
    const activeBookings = bookings
      .filter(booking => {
        const startTime = new Date(booking.start_time);
        const endTime = new Date(booking.end_time);
        return startTime <= now && 
               endTime > now && 
               ['confirmed', 'active'].includes(booking.status);
      })
      .map(booking => {
        const listingTitle = typeof booking.parking_space === 'object' 
          ? booking.parking_space?.title 
          : listings.find(l => l.id === booking.parking_space)?.title || 'Parking Space';
        
        return {
          id: `booking-active-${booking.id}`,
          type: 'booking_active',
          title: '🚗 Active Booking',
          text: `${booking.user_name || 'Guest'} is currently parked at ${listingTitle}`,
          time: getTimeAgo(booking.start_time),
          timestamp: new Date(booking.start_time),
          color: getActivityColor('booking_active'),
          isRead: true,
          action: () => navigate('/host-bookings')
        };
      });

    allActivities.push(...activeBookings);

    // 4. Add active listings status
    const activeListings = listings
      .filter(listing => listing.is_active && listing.approval_status === 'approved')
      .slice(0, 2) // Limit to prevent overwhelming the feed
      .map(listing => ({
        id: `listing-active-${listing.id}`,
        type: 'listing_active',
        title: '🏠 Active Listing',
        text: `"${listing.title}" is live and accepting bookings`,
        time: getTimeAgo(listing.updated_at || listing.created_at),
        timestamp: new Date(listing.updated_at || listing.created_at),
        color: getActivityColor('listing_active'),
        isRead: true,
        action: () => navigate(`/my-listings`)
      }));

    // Only add active listings if there aren't many other activities
    if (allActivities.length < 3) {
      allActivities.push(...activeListings);
    }

    // 5. Sort all activities by timestamp (most recent first) and take top 8
    const sortedActivities = allActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8);

    setActivities(sortedActivities);
  };

  const getActivityColor = (notificationType: string) => {
    switch (notificationType) {
      case 'booking_confirmed':
        return 'success.main';
      case 'booking_cancelled':
        return 'error.main';
      case 'booking_upcoming':
        return 'warning.main';
      case 'booking_active':
        return 'primary.main';
      case 'payment_received':
        return 'primary.main';
      case 'new_message':
        return 'info.main';
      case 'listing_approved':
        return 'success.main';
      case 'listing_rejected':
        return 'error.main';
      case 'listing_active':
        return 'success.light';
      case 'review_received':
        return 'secondary.main';
      default:
        return 'text.secondary';
    }
  };

  const handleActivityClick = async (notification: any) => {
    // Mark notification as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.action_url) {
      navigate(notification.action_url);
    } else {
      // Default navigation based on type
      switch (notification.type) {
        case 'booking_confirmed':
        case 'booking_cancelled':
        case 'booking_upcoming':
        case 'booking_active':
          navigate('/host-bookings');
          break;
        case 'payment_received':
          navigate('/earnings');
          break;
        case 'new_message':
          navigate('/messages');
          break;
        case 'listing_approved':
        case 'listing_rejected':
        case 'listing_active':
          navigate('/my-listings');
          break;
        case 'review_received':
          navigate('/reviews');
          break;
        default:
          // Stay on dashboard
          break;
      }
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else if (diffInMinutes < 10080) {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } else {
      return new Date(dateString).toLocaleDateString();
    }
  };

  if (activities.length === 0) {
    return (
      <Card sx={{
        borderRadius: 3,
        boxShadow: theme.shadows[4],
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        height: 'fit-content',
      }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Recent Activity
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your bookings, listings, and notifications will appear here
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-listing')}
          >
            Create First Listing
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{
      borderRadius: 3,
      boxShadow: theme.shadows[4],
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      height: 'fit-content',
    }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Recent Activity
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Latest bookings, listings, and notifications
        </Typography>
        
        <Stack spacing={2}>
          {activities.map((activity, index) => (
            <Box 
              key={activity.id || index}
              onClick={activity.action}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: activity.isRead 
                  ? alpha(theme.palette.primary.main, 0.02)
                  : alpha(theme.palette.primary.main, 0.08),
                border: activity.isRead
                  ? `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  transform: 'translateY(-1px)',
                  boxShadow: theme.shadows[2],
                },
              }}
            >
              {!activity.isRead && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bg,
                  }}
                />
              )}
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: activity.color,
                  mt: 0.5,
                  flexShrink: 0,
                  border: `2px solid ${alpha(activity.color, 0.3)}`,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  fontWeight={activity.isRead ? 400 : 600}
                  sx={{ 
                    lineHeight: 1.4,
                    color: activity.isRead ? 'text.primary' : 'text.primary'
                  }}
                >
                  {activity.title}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    display: 'block',
                    mt: 0.5,
                    lineHeight: 1.3,
                    opacity: 0.8
                  }}
                >
                  {activity.text}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    display: 'block',
                    mt: 0.5,
                    fontSize: '0.7rem',
                    opacity: 0.6
                  }}
                >
                  {activity.time}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/notifications')}
          >
            View All Notifications
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Enhanced Recent Bookings Component with Real Data  
const EnhancedRecentBookings: React.FC = () => {
  const { bookings } = useBookings();
  const theme = useTheme();
  const navigate = useNavigate();

  const recentBookings = bookings
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning'; 
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  if (recentBookings.length === 0) {
    return (
      <Card sx={{
        borderRadius: 3,
        boxShadow: theme.shadows[4],
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <BookingIcon sx={{ fontSize: 64, color: 'info.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No Recent Bookings
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your recent booking activity will appear here
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/create-listing')}
          >
            Create Listing
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{
      borderRadius: 3,
      boxShadow: theme.shadows[4],
      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
    }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Recent Bookings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Latest parking reservations
          </Typography>
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentBookings.map((booking) => (
                <TableRow 
                  key={booking.id} 
                  sx={{ 
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate('/host-bookings')}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bg }}>
                        {(booking.user_name || 'U').charAt(0)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {booking.user_name || 'Customer'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(booking.start_time), 'MMM d, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="success.main">
                      ${typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : parseFloat(booking.total_amount || '0').toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status}
                      size="small"
                      color={getStatusColor(booking.status) as any}
                      sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/host-bookings')}
          >
            View All Bookings
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component that chooses between new user and existing user experience
export default function Dashboard() {
  const { user } = useAuth();

  // Check if user is new (or for demo purposes, if they have specific emails for testing)
  const isTestAccount = user?.email?.includes('test') || user?.email?.includes('demo');
  const userIsNew = isNewUser(user) && !isTestAccount;

  // Show fresh dashboard for new users, existing dashboard for others
  return userIsNew ? <NewUserDashboard /> : <ExistingUserDashboard />;
}