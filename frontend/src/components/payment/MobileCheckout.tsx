import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Divider,
  Avatar,
  IconButton,
  useTheme,
  alpha,
  Dialog,
  DialogContent,
  CircularProgress,
  Paper,
  useMediaQuery,
  Chip,
  Collapse,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Schedule,
  DirectionsCar,
  CheckCircle,
  Star,
  Lock,
  CreditCard,
  Info,
  Payment as PaymentIcon,
  ExpandMore,
  ExpandLess,
  Phone,
  Message,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PaymentForm from '../payments/PaymentForm';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface MobileCheckoutProps {
  bookingData: {
    listing: {
      id: number;
      title: string;
      description: string;
      address: string;
      space_type: string;
      hourly_rate: number;
      host: {
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        phone_number?: string;
      };
      images: Array<{
        id: number;
        image_url: string;
        alt_text: string;
      }>;
      rating_average: number;
      total_reviews: number;
    };
    formData: {
      start_time: Date;
      end_time: Date;
      vehicle_license_plate: string;
      vehicle_make_model: string;
      special_instructions: string;
    };
    pricing: {
      duration: number;
      hourlyRate: number;
      subtotal: number;
      platformFee: number;
      total: number;
    };
  };
  onBack: () => void;
  onSuccess: () => void;
  onCancel: () => void;
}

const MobileCheckout: React.FC<MobileCheckoutProps> = ({
  bookingData,
  onBack,
  onSuccess,
  onCancel,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeStep, setActiveStep] = useState(0);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const { listing, formData, pricing } = bookingData;
  const defaultImage = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&h=600&fit=crop';

  // Auto-expand sections on mobile for better UX
  useEffect(() => {
    if (isMobile) {
      setShowDetails(true);
      setShowPricing(true);
    }
  }, [isMobile]);

  const handleProceedToPayment = async () => {
    setIsCreatingBooking(true);
    setActiveStep(1);

    try {
      const bookingPayload = {
        parking_space: listing.id,
        start_time: formData.start_time.toISOString(),
        end_time: formData.end_time.toISOString(),
        vehicle_license_plate: formData.vehicle_license_plate,
        vehicle_make_model: formData.vehicle_make_model || '',
        special_instructions: formData.special_instructions || '',
        status: 'pending', // Create with pending status until payment succeeds
      };

      const response = await api.post('/bookings/bookings/', bookingPayload);
      const booking = response.data;
      setBookingId(booking.id);
      setShowPaymentForm(true);
      toast.success('Booking created! Now proceeding to payment...');
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
      setActiveStep(0);
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentForm(false);
    
    // Update booking status to confirmed after successful payment
    if (bookingId) {
      try {
        await api.patch(`/bookings/bookings/${bookingId}/`, { status: 'confirmed' });
        setPaymentCompleted(true);
        setActiveStep(2);
        toast.success('Payment successful! Your parking is confirmed.');
        onSuccess();
      } catch (error) {
        console.error('Error confirming booking:', error);
        toast.error('Payment succeeded but booking confirmation failed. Please contact support.');
      }
    } else {
      setPaymentCompleted(true);
      setActiveStep(2);
      toast.success('Payment successful! Your parking is reserved.');
      onSuccess();
    }
  };

  const handlePaymentCancel = async () => {
    setShowPaymentForm(false);
    
    // Cancel the pending booking since payment was cancelled
    if (bookingId) {
      try {
        await api.patch(`/bookings/bookings/${bookingId}/`, { status: 'cancelled' });
        toast.info('Booking cancelled due to payment cancellation.');
      } catch (error) {
        console.error('Error cancelling booking:', error);
        // Continue with cancellation flow even if API call fails
      }
    }
    
    onCancel();
  };

  const handlePaymentFailure = async (failedBookingId: number) => {
    // Cancel the booking when payment fails
    try {
      await api.patch(`/bookings/bookings/${failedBookingId}/`, { status: 'cancelled' });
      toast.error('Payment failed. Booking has been cancelled.');
    } catch (error) {
      console.error('Error cancelling failed booking:', error);
      toast.error('Payment failed and booking cancellation failed. Please contact support.');
    }
  };

  const handleCallHost = () => {
    if (listing.host.phone_number) {
      window.location.href = `tel:${listing.host.phone_number}`;
    } else {
      toast.error('Host phone number not available');
    }
  };

  const handleMessageHost = () => {
    // Navigate to messaging - this would be implemented with the messaging system
    toast.info('Messaging feature coming soon!');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      position: 'relative',
    }}>
      {/* Mobile Header - Fixed */}
      <Paper
        elevation={2}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          borderRadius: 0,
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          py: 1,
        }}
      >
        <Container maxWidth="sm">
          <Stack direction="row" alignItems="center" spacing={2}>
            <IconButton 
              onClick={onBack} 
              sx={{ color: 'white' }}
              size="small"
            >
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600} noWrap color="text.primary">
                Secure Checkout
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Step {activeStep + 1} of 3
              </Typography>
            </Box>
            <Chip
              label={`$${pricing.total.toFixed(2)}`}
              sx={{
                bgcolor: alpha(theme.palette.common.white, 0.2),
                color: 'white',
                fontWeight: 700,
              }}
            />
          </Stack>
        </Container>
      </Paper>

      {/* Progress Indicator */}
      <Box sx={{ px: 2, py: 1, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[0, 1, 2].map((step) => (
            <Box
              key={step}
              sx={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                bgcolor: step <= activeStep ? 'primary.main' : alpha(theme.palette.primary.main, 0.2),
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Stack spacing={2}>
          {/* Listing Summary Card */}
          <Card sx={{ borderRadius: 3 }}>
            <Box sx={{ position: 'relative', height: 120, overflow: 'hidden' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url(${listing.images?.[0]?.image_url || defaultImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'brightness(0.8)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                  color: 'white',
                  p: 2,
                }}
              >
                <Typography variant="h6" fontWeight={600} noWrap color="white">
                  {listing.title}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocationOn sx={{ fontSize: 14 }} />
                  <Typography variant="caption">
                    {listing.address}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </Card>

          {/* Booking Details */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Button
                fullWidth
                onClick={() => setShowDetails(!showDetails)}
                sx={{ 
                  justifyContent: 'space-between',
                  textTransform: 'none',
                  color: 'text.primary',
                  p: 0,
                  mb: showDetails ? 2 : 0,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Booking Details
                </Typography>
                {showDetails ? <ExpandLess /> : <ExpandMore />}
              </Button>
              
              <Collapse in={showDetails}>
                <Stack spacing={2}>
                  {/* Time */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Schedule sx={{ color: 'primary.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {format(formData.start_time, 'MMM d, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(formData.start_time, 'h:mm a')} - {format(formData.end_time, 'h:mm a')}
                      </Typography>
                    </Box>
                    <Typography variant="caption" >
                      {pricing.duration.toFixed(1)} hrs
                    </Typography>
                  </Box>

                  {/* Vehicle */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DirectionsCar sx={{ color: 'success.main' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {formData.vehicle_license_plate}
                      </Typography>
                      {formData.vehicle_make_model && (
                        <Typography variant="caption" color="text.secondary">
                          {formData.vehicle_make_model}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Special Instructions */}
                  {formData.special_instructions && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Info sx={{ color: 'info.main', mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          Special Instructions
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formData.special_instructions}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Collapse>
            </CardContent>
          </Card>

          {/* Pricing Breakdown */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Button
                fullWidth
                onClick={() => setShowPricing(!showPricing)}
                sx={{ 
                  justifyContent: 'space-between',
                  textTransform: 'none',
                  color: 'text.primary',
                  p: 0,
                  mb: showPricing ? 2 : 0,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  Price Breakdown
                </Typography>
                {showPricing ? <ExpandLess /> : <ExpandMore />}
              </Button>
              
              <Collapse in={showPricing}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {pricing.duration.toFixed(1)} hours × ${pricing.hourlyRate}/hr
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ${pricing.subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Platform Fee (5%)
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ${pricing.platformFee.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Divider />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight={700}>
                      Total
                    </Typography>
                    <Typography variant="h6" fontWeight={700} >
                      ${pricing.total.toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </Collapse>
            </CardContent>
          </Card>

          {/* Host Contact */}
          <Card sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                Your Host
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                  {listing.host.first_name?.[0] || listing.host.username[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" fontWeight={500}>
                    {listing.host.first_name || listing.host.username}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Star sx={{ fontSize: 14, color: 'warning.main' }} />
                    <Typography variant="caption">
                      {Number(listing.rating_average) > 0 ? Number(listing.rating_average).toFixed(1) : 'New'}
                    </Typography>
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1}>
                  {listing.host.phone_number && (
                    <IconButton 
                      size="small" 
                      onClick={handleCallHost}
                      sx={{ bgcolor: 'success.main', color: 'white' }}
                    >
                      <Phone sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                  <IconButton 
                    size="small" 
                    onClick={handleMessageHost}
                    sx={{ bgcolor: 'primary.main', color: 'white' }}
                  >
                    <Message sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Lock sx={{ color: 'success.main' }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Secure Payment
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Your payment is protected by 256-bit SSL encryption
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* Fixed Bottom Action */}
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          borderRadius: '16px 16px 0 0',
          p: 2,
        }}
      >
        <Container maxWidth="sm">
          {activeStep === 0 && (
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleProceedToPayment}
              disabled={isCreatingBooking}
              startIcon={isCreatingBooking ? <CircularProgress size={20} /> : <PaymentIcon />}
              sx={{
                borderRadius: 3,
                py: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                fontSize: '1.1rem',
                fontWeight: 700,
              }}
            >
              {isCreatingBooking ? 'Creating Booking...' : `Pay $${pricing.total.toFixed(2)}`}
            </Button>
          )}

          {activeStep === 1 && !paymentCompleted && (
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => setShowPaymentForm(true)}
              startIcon={<CreditCard />}
              sx={{
                borderRadius: 3,
                py: 1.5,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                fontSize: '1.1rem',
                fontWeight: 700,
              }}
            >
              Complete Payment
            </Button>
          )}

          {paymentCompleted && (
            <Stack spacing={1} alignItems="center">
              <CheckCircle sx={{ color: 'success.main', fontSize: 40 }} />
              <Typography variant="h6" fontWeight={600} color="success.main">
                Booking Confirmed!
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Your parking space is reserved. You'll receive a confirmation email shortly.
              </Typography>
            </Stack>
          )}
        </Container>
      </Paper>

      {/* Payment Dialog */}
      <Dialog 
        open={showPaymentForm} 
        onClose={() => setShowPaymentForm(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          <PaymentForm
            amount={pricing.total}
            bookingId={bookingId || 0}
            description={`Parking at ${listing.title}`}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
            onFailure={handlePaymentFailure}
            isMobile={isMobile}
          />
        </DialogContent>
      </Dialog>

      {/* Add bottom padding to account for fixed button */}
      <Box sx={{ height: 80 }} />
    </Box>
  );
};

export default MobileCheckout;