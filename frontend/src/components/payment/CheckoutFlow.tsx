import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Stack,
  Divider,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  Fade,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogContent,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Schedule,
  AttachMoney,
  DirectionsCar,
  CheckCircle,
  Star,
  Lock,
  CreditCard,
  Info,
  Payment as PaymentIcon,
  Apple,
  Google,
  Speed,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PaymentForm from '../payments/PaymentForm';
import MobileCheckout from './MobileCheckout';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface CheckoutFlowProps {
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

const CheckoutFlow: React.FC<CheckoutFlowProps> = ({
  bookingData,
  onBack,
  onSuccess,
  onCancel,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeStep, setActiveStep] = useState(0);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  const { listing, formData, pricing } = bookingData;
  const defaultImage = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&h=600&fit=crop';

  const steps = [
    {
      label: 'Review Details',
      description: 'Confirm your booking information',
    },
    {
      label: 'Create Booking & Payment',
      description: 'Generate reservation and complete payment',
    },
    {
      label: 'Confirmation',
      description: 'Your parking is reserved!',
    },
  ];

  const handleProceedToPayment = async () => {
    // Create booking with pending status, then proceed to payment
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

  const handleCreateBooking = async () => {
    setIsCreatingBooking(true);
    setActiveStep(2);

    try {
      const bookingPayload = {
        parking_space: listing.id,
        start_time: formData.start_time.toISOString(),
        end_time: formData.end_time.toISOString(),
        vehicle_license_plate: formData.vehicle_license_plate,
        vehicle_make_model: formData.vehicle_make_model || '',
        special_instructions: formData.special_instructions || '',
      };

      const response = await api.post('/bookings/bookings/', bookingPayload);
      const booking = response.data;
      setBookingId(booking.id);
      toast.success('Booking created successfully! Your parking is reserved.');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
      setActiveStep(1);
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

  // Use mobile checkout for mobile devices
  if (isMobile) {
    return (
      <MobileCheckout
        bookingData={bookingData}
        onBack={onBack}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
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
          <Fade in timeout={800}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <IconButton 
                  onClick={onBack} 
                  sx={{ color: 'white', bgcolor: alpha(theme.palette.common.white, 0.1) }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="h4" component="h1" fontWeight={700}>
                  Checkout
                </Typography>
              </Stack>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                Complete your parking reservation
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Booking Details Card */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Booking Details
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Date & Time */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <Schedule sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" fontWeight={600}>
                          Parking Time
                        </Typography>
                      </Stack>
                      <Typography variant="body1" fontWeight={500}>
                        {format(formData.start_time, 'MMM d, yyyy')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {format(formData.start_time, 'h:mm a')} - {format(formData.end_time, 'h:mm a')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {pricing.duration.toFixed(1)} hours
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Vehicle Info */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <DirectionsCar sx={{ color: 'success.main' }} />
                        <Typography variant="h6" fontWeight={600}>
                          Vehicle
                        </Typography>
                      </Stack>
                      <Typography variant="body1" fontWeight={500}>
                        {formData.vehicle_license_plate}
                      </Typography>
                      {formData.vehicle_make_model && (
                        <Typography variant="body2" color="text.secondary">
                          {formData.vehicle_make_model}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>

                  {/* Special Instructions */}
                  {formData.special_instructions && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.02) }}>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                          <Info sx={{ color: 'info.main' }} />
                          <Typography variant="h6" fontWeight={600}>
                            Special Instructions
                          </Typography>
                        </Stack>
                        <Typography variant="body2">
                          {formData.special_instructions}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Booking Summary */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Parking Space Info */}
              <Card sx={{ borderRadius: 3 }}>
                <Box
                  sx={{
                    height: 200,
                    backgroundImage: `url(${listing.images?.[0]?.image_url || defaultImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                    {listing.title}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {listing.borough || 'Location'} • Full address provided after payment
                    </Typography>
                  </Stack>
                  {Number(listing.rating_average) > 0 && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                      <Typography variant="body2" fontWeight={600}>
                        {Number(listing.rating_average).toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({listing.total_reviews} reviews)
                      </Typography>
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {/* Pricing Summary */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                    Pricing Summary
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {pricing.duration.toFixed(1)} hours
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Rate
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ${pricing.hourlyRate}/hour
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal
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
                      <Typography variant="h6" fontWeight={700} color="text.primary">
                        Total
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="text.primary">
                        ${pricing.total.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Lock sx={{ color: 'success.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Secure Payment
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Your payment information is encrypted and processed securely through Stripe. 
                    We never store your card details.
                  </Typography>
                </CardContent>
              </Card>

              {/* Host Info */}
              {listing.host && (
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                      Your Host
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
                          Parking Host
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Booking Progress */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                    Booking Progress
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Stepper activeStep={activeStep} orientation="vertical">
                      {steps.map((step, index) => (
                        <Step key={step.label}>
                          <StepLabel>
                            <Typography variant="body2" fontWeight={500}>
                              {step.label}
                            </Typography>
                          </StepLabel>
                          <StepContent>
                            <Typography variant="body2" color="text.secondary">
                              {step.description}
                            </Typography>
                            {index === 0 && activeStep === 0 && (
                              <Button
                                variant="contained"
                                sx={{ mt: 2 }}
                                onClick={handleProceedToPayment}
                                disabled={isCreatingBooking}
                                startIcon={isCreatingBooking ? <CircularProgress size={20} /> : <PaymentIcon />}
                              >
                                {isCreatingBooking ? 'Creating Booking...' : 'Proceed to Payment'}
                              </Button>
                            )}
                            {index === 2 && activeStep === 2 && (
                              <Stack spacing={1} sx={{ mt: 2 }}>
                                <Typography variant="body2" color="success.main" fontWeight={500}>
                                  ✓ Booking confirmed!
                                </Typography>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => onSuccess()}
                                >
                                  View My Bookings
                                </Button>
                              </Stack>
                            )}
                          </StepContent>
                        </Step>
                      ))}
                    </Stepper>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Payment Dialog */}
      <Dialog 
        open={showPaymentForm} 
        onClose={() => setShowPaymentForm(false)}
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
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CheckoutFlow;