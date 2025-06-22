import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Stack,
  Avatar,
  Divider,
  useTheme,
  alpha,
  LinearProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Pending,
  Schedule,
  LocationOn,
  DirectionsCar,
  AttachMoney,
  CalendarToday,
  AccessTime,
  Person,
  Phone,
  Email,
  ArrowBack,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingsContext';
import api from '../services/api';
import toast from 'react-hot-toast';

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
    case 'active': return <Schedule />;
    default: return <Schedule />;
  }
};

const HostBookings: React.FC = () => {
  const { user } = useAuth();
  const { bookings: allBookings, refreshBookings } = useBookings();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    booking: HostBooking | null;
    action: 'confirm' | 'cancel';
  }>({
    open: false,
    booking: null,
    action: 'confirm',
  });

  useEffect(() => {
    if (user && allBookings.length > 0 && !dataLoaded) {
      loadHostBookings();
    }
  }, [user?.id, allBookings.length, dataLoaded]); // Only re-run when user ID or bookings change and data isn't loaded

  const loadHostBookings = async () => {
    setLoading(true);
    try {
      if (!user) {
        console.log('User not authenticated, skipping bookings load');
        setBookings([]);
        return;
      }

      console.log('Host bookings from context:', allBookings.length);
      console.log('All bookings before filtering:', allBookings);
      console.log('Current user ID:', user.id);
      
      // Get user's listings to determine which bookings are for their properties
      const listingsResponse = await api.get('/listings/my-listings/');
      const userListings = listingsResponse.data.results || listingsResponse.data || [];
      const userListingIds = userListings.map((listing: any) => listing.id);
      console.log('User listing IDs:', userListingIds);
      
      // Get unique parking space IDs that need details
      const parkingSpaceIds = new Set();
      const bookingsToProcess = [];
      
      for (const booking of allBookings) {
        console.log('Processing booking:', booking);
        
        // Check if booking.parking_space is an ID (number) or object
        let parkingSpaceId;
        if (typeof booking.parking_space === 'number') {
          parkingSpaceId = booking.parking_space;
        } else if (booking.parking_space?.id) {
          parkingSpaceId = booking.parking_space.id;
        }
        
        console.log('Parking space ID for booking:', parkingSpaceId);
        
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
          // Use the user's listings data we already have instead of making more API calls
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
            console.warn(`Could not find parking space details for ID ${booking.parking_space}`);
            continue; // Skip this booking if we can't get space details
          }
        }
        
        hostBookings.push({
          ...booking,
          parking_space: parkingSpaceData
        });
      }
      
      console.log('Filtered host bookings:', hostBookings);
      setBookings(hostBookings);
      setDataLoaded(true);
    } catch (error: any) {
      console.error('Error loading host bookings:', error);
      if (error.response?.status === 401) {
        console.log('Authentication error - user needs to log in');
        setBookings([]);
        return;
      }
      toast.error('Failed to load booking requests');
    } finally {
      setLoading(false);
    }
  };

  const sendNotificationMessage = async (booking: HostBooking, action: 'confirm' | 'cancel') => {
    try {
      const parkingSpaceTitle = booking.parking_space?.title || 'Parking Space';
      const bookingDate = format(new Date(booking.start_time), 'MMM d, yyyy');
      const bookingTime = `${format(new Date(booking.start_time), 'h:mm a')} - ${format(new Date(booking.end_time), 'h:mm a')}`;
      
      let messageContent;
      if (action === 'confirm') {
        messageContent = `Great news! Your booking request has been ACCEPTED! 🎉

📍 Parking Space: ${parkingSpaceTitle}
📅 Date: ${bookingDate}
🕐 Time: ${bookingTime}
💰 Amount: $${typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : parseFloat(booking.total_amount || '0').toFixed(2)}

Your parking spot is now reserved. Please arrive on time and follow any special instructions provided. Have a great day!`;
      } else {
        messageContent = `We regret to inform you that your booking request has been declined. 😔

📍 Parking Space: ${parkingSpaceTitle}
📅 Date: ${bookingDate}
🕐 Time: ${bookingTime}

We apologize for any inconvenience. Please feel free to browse other available parking spaces or try booking for a different time. Thank you for understanding!`;
      }

      // Create a simple message API call - this might need to be adjusted based on your backend API
      const messageData = {
        booking_id: booking.id,
        recipient_id: booking.user,
        content: messageContent,
        message_type: 'booking_status'
      };

      // Send via correct DRF router URL for messages endpoint
      await api.post('/messages/', messageData);
      console.log(`${action === 'confirm' ? 'Acceptance' : 'Denial'} message sent to renter`);
    } catch (error) {
      console.error('Error sending notification message:', error);
      // Don't show error to user as this is a nice-to-have feature
    }
  };

  const handleConfirmBooking = async (booking: HostBooking) => {
    try {
      await api.post(`/bookings/bookings/${booking.id}/confirm/`);
      
      // Send notification message to renter
      await sendNotificationMessage(booking, 'confirm');
      
      toast.success('Booking confirmed and renter notified!');
      setDataLoaded(false); // Reset to allow reload
      await refreshBookings(); // Refresh bookings from context
      loadHostBookings(); // Reload host bookings
      setConfirmDialog({ open: false, booking: null, action: 'confirm' });
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Failed to confirm booking');
    }
  };

  const handleCancelBooking = async (booking: HostBooking) => {
    try {
      await api.post(`/bookings/bookings/${booking.id}/cancel/`);
      
      // Send notification message to renter
      await sendNotificationMessage(booking, 'cancel');
      
      toast.success('Booking cancelled and renter notified!');
      setDataLoaded(false); // Reset to allow reload
      await refreshBookings(); // Refresh bookings from context
      loadHostBookings(); // Reload host bookings
      setConfirmDialog({ open: false, booking: null, action: 'cancel' });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const openConfirmDialog = (booking: HostBooking, action: 'confirm' | 'cancel') => {
    setConfirmDialog({ open: true, booking, action });
  };

  const filteredBookings = () => {
    switch (selectedTab) {
      case 0: // Pending
        return bookings.filter(b => b.status === 'pending');
      case 1: // Confirmed
        return bookings.filter(b => b.status === 'confirmed');
      case 2: // Active
        return bookings.filter(b => b.status === 'active');
      case 3: // Completed
        return bookings.filter(b => b.status === 'completed');
      case 4: // Cancelled
        return bookings.filter(b => b.status === 'cancelled');
      default:
        return bookings;
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Host Booking Management
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Please log in to manage your booking requests
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Host Booking Management
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Container>
    );
  }

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
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard')}
              sx={{ color: 'white' }}
            >
              Back to Dashboard
            </Button>
          </Stack>
          <Typography variant="h3" component="h1" fontWeight={700}>
            Host Booking Management
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
            Manage parking requests for your listings
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Summary Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Pending sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" fontWeight={700} sx={{ color: 'warning.main' }}>
                  {bookings.filter(b => b.status === 'pending').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Requests
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" fontWeight={700} sx={{ color: 'success.main' }}>
                  {bookings.filter(b => b.status === 'confirmed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Confirmed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Schedule sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight={700} sx={{ color: 'primary.main' }}>
                  {bookings.filter(b => b.status === 'active').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Now
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" fontWeight={700} sx={{ color: 'info.main' }}>
                  {bookings.filter(b => b.status === 'completed').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <AttachMoney sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" fontWeight={700} sx={{ color: 'warning.main' }}>
                  ${bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.total_amount || 0), 0).toFixed(0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Earned
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <Tabs
            value={selectedTab}
            onChange={(_, newValue) => setSelectedTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Pending (${bookings.filter(b => b.status === 'pending').length})`} />
            <Tab label={`Confirmed (${bookings.filter(b => b.status === 'confirmed').length})`} />
            <Tab label={`Active (${bookings.filter(b => b.status === 'active').length})`} />
            <Tab label={`Completed (${bookings.filter(b => b.status === 'completed').length})`} />
            <Tab label={`Cancelled (${bookings.filter(b => b.status === 'cancelled').length})`} />
          </Tabs>
        </Card>

        {/* Bookings List */}
        {filteredBookings().length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No bookings in this category
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedTab === 0 
                ? 'No pending booking requests at the moment.' 
                : `No ${['pending', 'confirmed', 'active', 'completed', 'cancelled'][selectedTab]} bookings.`
              }
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredBookings().map((booking) => (
              <Grid item xs={12} md={6} lg={4} key={booking.id}>
                <Card sx={{ 
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-2px)',
                  },
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

                      {/* Customer Info */}
                      <Box>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {booking.user_name?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {booking.user_name || 'Customer'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {booking.user_email}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      <Divider />

                      {/* Parking Space */}
                      <Box>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {booking.parking_space?.title || 'Parking Space'}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {booking.parking_space?.address || 'Address not available'}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Time & Duration */}
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" fontWeight={500}>
                            {format(new Date(booking.start_time), 'MMM d, yyyy')}
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Vehicle */}
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <DirectionsCar sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {booking.vehicle_license_plate}
                            {booking.vehicle_make_model && ` (${booking.vehicle_make_model})`}
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Special Instructions */}
                      {booking.special_instructions && (
                        <Box>
                          <Typography variant="body2" fontWeight={500} gutterBottom>
                            Special Instructions:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {booking.special_instructions}
                          </Typography>
                        </Box>
                      )}

                      {/* Price */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Amount:
                        </Typography>
                        <Typography variant="h6" fontWeight={600} color="primary">
                          ${typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : parseFloat(booking.total_amount || '0').toFixed(2)}
                        </Typography>
                      </Box>

                      {/* Action Buttons */}
                      {booking.status === 'pending' && (
                        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                          <Button
                            variant="contained"
                            color="success"
                            fullWidth
                            onClick={() => openConfirmDialog(booking, 'confirm')}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            fullWidth
                            onClick={() => openConfirmDialog(booking, 'cancel')}
                          >
                            Decline
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, booking: null, action: 'confirm' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {confirmDialog.action === 'confirm' ? 'Confirm Booking Request' : 'Decline Booking Request'}
        </DialogTitle>
        <DialogContent>
          {confirmDialog.booking && (
            <Box>
              <Alert 
                severity={confirmDialog.action === 'confirm' ? 'info' : 'warning'} 
                sx={{ mb: 2 }}
              >
                {confirmDialog.action === 'confirm' 
                  ? 'Are you sure you want to accept this booking request? The customer will be notified and able to use your parking space.'
                  : 'Are you sure you want to decline this booking request? This action cannot be undone.'
                }
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Booking Details:
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  <strong>Customer:</strong> {confirmDialog.booking.user_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {format(new Date(confirmDialog.booking.start_time), 'MMM d, yyyy')}
                </Typography>
                <Typography variant="body2">
                  <strong>Time:</strong> {format(new Date(confirmDialog.booking.start_time), 'h:mm a')} - {format(new Date(confirmDialog.booking.end_time), 'h:mm a')}
                </Typography>
                <Typography variant="body2">
                  <strong>Vehicle:</strong> {confirmDialog.booking.vehicle_license_plate}
                </Typography>
                <Typography variant="body2">
                  <strong>Amount:</strong> ${parseFloat(confirmDialog.booking.total_amount?.toString() || '0').toFixed(2)}
                </Typography>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, booking: null, action: 'confirm' })}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (confirmDialog.booking) {
                if (confirmDialog.action === 'confirm') {
                  handleConfirmBooking(confirmDialog.booking);
                } else {
                  handleCancelBooking(confirmDialog.booking);
                }
              }
            }}
            variant="contained"
            color={confirmDialog.action === 'confirm' ? 'success' : 'error'}
          >
            {confirmDialog.action === 'confirm' ? 'Accept Booking' : 'Decline Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HostBookings;