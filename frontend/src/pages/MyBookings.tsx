import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Box,
  Chip,
  Stack,
  LinearProgress,
  Paper,
  Divider,
  IconButton,
  Button,
} from '@mui/material';
import {
  LocationOn,
  Schedule,
  DirectionsCar,
  AttachMoney,
  CalendarToday,
  AccessTime,
  CheckCircle,
  Cancel,
  Pending,
  Login,
  Logout,
  CancelOutlined,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingsContext';

interface Booking {
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
  vehicle_license_plate: string;
  vehicle_make_model: string;
  special_instructions: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'confirmed': return 'success';
    case 'pending': return 'warning';
    case 'cancelled': return 'error';
    case 'completed': return 'info';
    default: return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'confirmed': return <CheckCircle />;
    case 'pending': return <Pending />;
    case 'cancelled': return <Cancel />;
    case 'completed': return <CheckCircle />;
    default: return <Schedule />;
  }
};

const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const { refreshBookings } = useBookings();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated
      if (!user) {
        console.log('User not authenticated, skipping bookings load');
        setBookings([]);
        return;
      }
      
      const response = await api.get('/bookings/bookings/');
      console.log('Bookings response:', response.data);
      setBookings(response.data.results || response.data || []);
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      if (error.response?.status === 401) {
        console.log('Authentication error - user needs to log in');
        setBookings([]);
        return;
      }
      toast.error('Failed to load your bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = (bookingId: number) => {
    navigate(`/booking/${bookingId}`);
  };

  const handleCheckIn = async (event: React.MouseEvent, bookingId: number) => {
    event.stopPropagation();
    try {
      await api.post(`/bookings/bookings/${bookingId}/start/`);
      toast.success('Checked in successfully!');
      loadBookings(); // Reload local data
      refreshBookings(); // Refresh context data
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to check in');
    }
  };

  const handleCheckOut = async (event: React.MouseEvent, bookingId: number) => {
    event.stopPropagation();
    try {
      await api.post(`/bookings/bookings/${bookingId}/complete/`);
      toast.success('Checked out successfully!');
      loadBookings(); // Reload local data
      refreshBookings(); // Refresh context data
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error('Failed to check out');
    }
  };

  const isBookingActive = (booking: Booking) => {
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    return now >= startTime && now <= endTime && booking.status === 'confirmed';
  };

  // Single button logic - only ONE button per booking
  const getBookingAction = (booking: Booking) => {
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    
    // Priority order: Check Out > Check In > Cancel > None
    if (booking.status === 'active') {
      return 'checkout'; // Already checked in, show only checkout
    } else if (booking.status === 'confirmed' && now >= startTime && now <= endTime) {
      return 'checkin'; // Within booking window, show only checkin
    } else if (['pending', 'confirmed'].includes(booking.status) && startTime > now) {
      return 'cancel'; // Future booking, show only cancel
    } else {
      return 'none'; // Completed, cancelled, or expired - no action
    }
  };

  const canCancel = (booking: Booking) => {
    const now = new Date();
    const startTime = new Date(booking.start_time);
    
    // Can only cancel if:
    // 1. Status is 'pending' or 'confirmed' (not 'active', 'completed', or 'cancelled')
    // 2. Start time is in the future (not already started)
    // 3. Not already checked in
    return (
      ['pending', 'confirmed'].includes(booking.status) &&
      startTime > now &&
      booking.status !== 'active'
    );
  };

  const handleCancelBooking = async (e: React.MouseEvent, bookingId: number) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      await api.patch(`/bookings/bookings/${bookingId}/`, { status: 'cancelled' });
      toast.success('Booking cancelled successfully');
      loadBookings(); // Reload bookings to reflect the change
    } catch (error: any) {
      console.error('Error cancelling booking:', error);
      if (error.response?.status === 400) {
        toast.error('Cannot cancel this booking. It may have already started or been checked in.');
      } else if (error.response?.status === 404) {
        toast.error('Booking not found.');
      } else {
        toast.error('Failed to cancel booking. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Bookings
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Bookings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View and manage your parking reservations
      </Typography>

      {bookings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No bookings found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You haven't made any parking reservations yet.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {bookings.map((booking) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={booking.id}>
              <Card sx={{ 
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                },
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box onClick={() => handleBookingClick(booking.id)} sx={{ cursor: 'pointer' }}>
                  <Stack spacing={2}>
                    {/* Status and Booking ID */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip
                        icon={getStatusIcon(booking.status)}
                        label={booking.status || 'Pending'}
                        color={getStatusColor(booking.status)}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        #{booking.booking_id || booking.id}
                      </Typography>
                    </Box>


                    {/* Location */}
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

                    <Divider />

                    {/* Time */}
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

                    {/* Price */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AttachMoney sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          Total:
                        </Typography>
                      </Stack>
                      <Typography variant="h6" fontWeight={600} color="primary">
                        ${typeof booking.total_amount === 'number' ? booking.total_amount.toFixed(2) : parseFloat(booking.total_amount || '0').toFixed(2)}
                      </Typography>
                    </Box>

                    {/* Special Instructions */}
                    {booking.special_instructions && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Instructions: {booking.special_instructions}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  </Box>

                  {/* Single Action Button */}
                  {(() => {
                    const action = getBookingAction(booking);
                    if (action === 'none') return null;
                    
                    return (
                      <Box sx={{ pt: 2, px: 0 }}>
                        {action === 'checkout' && (
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<Logout />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckOut(e, booking.id);
                            }}
                            fullWidth
                          >
                            Check Out
                          </Button>
                        )}
                        {action === 'checkin' && (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<Login />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckIn(e, booking.id);
                            }}
                            fullWidth
                          >
                            Check In
                          </Button>
                        )}
                        {action === 'cancel' && (
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<CancelOutlined />}
                            onClick={(e) => handleCancelBooking(e, booking.id)}
                            fullWidth
                          >
                            Cancel
                          </Button>
                        )}
                      </Box>
                    );
                  })()}

                  {/* Booking Status */}
                  {(booking.status === 'active' || booking.status === 'completed' || booking.status === 'cancelled') && (
                    <Box sx={{ pt: 2 }}>
                      {booking.status === 'active' && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'block' }}>
                          ✓ Checked in - Booking is active
                        </Typography>
                      )}
                      {booking.status === 'completed' && (
                        <Typography variant="caption" color="info.main" sx={{ display: 'block' }}>
                          ✓ Completed - Thank you!
                        </Typography>
                      )}
                      {booking.status === 'cancelled' && (
                        <Typography variant="caption" color="error.main" sx={{ display: 'block' }}>
                          ✗ Cancelled - This booking was cancelled
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Cancellation Policy Notice */}
                  {canCancel(booking) && (
                    <Box sx={{ pt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                        💡 You can cancel this booking until check-in time
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default MyBookings;