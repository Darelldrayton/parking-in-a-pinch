import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import CheckoutFlow from '../components/payment/CheckoutFlow';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Paper,
  Stack,
  Divider,
  Avatar,
  IconButton,
  useTheme,
  alpha,
  Fade,
  LinearProgress,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  LocationOn,
  Schedule,
  AttachMoney,
  DirectionsCar,
  CalendarToday,
  AccessTime,
  CheckCircle,
  Cancel,
  LocalParking,
  Star,
  Info,
  Payment,
  Security,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { addHours, addMinutes, addDays, format } from 'date-fns';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import availabilityService from '../services/availability';
import AvailabilityTimeline from '../components/common/AvailabilityTimeline';
import { LegalDisclaimer } from '../components/legal/LegalDisclaimer';

// Availability types
interface AvailabilityRequest {
  parking_space_id: number;
  start_time: string;
  end_time: string;
}

// US States list for dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

// Form validation schema
const schema = yup.object({
  start_time: yup
    .date()
    .required('Start time is required')
    .min(new Date(), 'Start time must be in the future'),
  end_time: yup
    .date()
    .required('End time is required')
    .test('is-after-start', 'End time must be after start time', function(value) {
      const { start_time } = this.parent;
      return !start_time || !value || value > start_time;
    }),
  vehicle_license_plate: yup
    .string()
    .required('License plate is required')
    .min(2, 'License plate must be at least 2 characters')
    .max(20, 'License plate must be less than 20 characters'),
  vehicle_state: yup
    .string()
    .required('Vehicle state is required'),
  vehicle_make: yup
    .string()
    .required('Vehicle make is required')
    .min(2, 'Vehicle make must be at least 2 characters')
    .max(50, 'Vehicle make must be less than 50 characters'),
  vehicle_model: yup
    .string()
    .required('Vehicle model is required')
    .min(2, 'Vehicle model must be at least 2 characters')
    .max(50, 'Vehicle model must be less than 50 characters'),
  vehicle_year: yup
    .number()
    .required('Vehicle year is required')
    .min(1900, 'Vehicle year must be 1900 or later')
    .max(new Date().getFullYear() + 1, `Vehicle year cannot be more than ${new Date().getFullYear() + 1}`),
  special_instructions: yup
    .string()
    .max(500, 'Instructions must be less than 500 characters'),
});

interface FormData {
  start_time: Date;
  end_time: Date;
  vehicle_license_plate: string;
  vehicle_state: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  special_instructions: string;
}

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
  availability_schedule?: {
    [key: string]: {
      available: boolean;
      start: string;
      end: string;
    };
  };
}

export default function BookingForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [legalTermsAccepted, setLegalTermsAccepted] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    loading: boolean;
    available: boolean | null;
    message: string;
    conflicts?: Array<{
      start_time: string;
      end_time: string;
      status: string;
    }>;
    suggestions?: Array<{
      start: Date;
      end: Date;
      label: string;
    }>;
  }>({
    loading: false,
    available: null,
    message: ''
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      start_time: addMinutes(new Date(), 5), // Default to 5 minutes from now
      end_time: addHours(addMinutes(new Date(), 5), 1), // Default to 1 hour from start time
      vehicle_license_plate: '',
      vehicle_state: '',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_year: new Date().getFullYear(),
      special_instructions: '',
    },
  });

  const watchedStartTime = watch('start_time');
  const watchedEndTime = watch('end_time');

  useEffect(() => {
    if (id) {
      loadListing();
    }
  }, [id]);

  // Auto-fill vehicle information from user profile
  useEffect(() => {
    if (user?.profile) {
      const { 
        primary_vehicle_license_plate, 
        primary_vehicle_state, 
        primary_vehicle_make, 
        primary_vehicle_model, 
        primary_vehicle_year 
      } = user.profile;
      
      if (primary_vehicle_license_plate) {
        setValue('vehicle_license_plate', primary_vehicle_license_plate);
      }
      
      if (primary_vehicle_state) {
        setValue('vehicle_state', primary_vehicle_state);
      }
      
      if (primary_vehicle_make) {
        setValue('vehicle_make', primary_vehicle_make);
      }
      
      if (primary_vehicle_model) {
        setValue('vehicle_model', primary_vehicle_model);
      }
      
      if (primary_vehicle_year) {
        setValue('vehicle_year', parseInt(primary_vehicle_year));
      }
    }
  }, [user, setValue]);

  // Real-time availability checking when times change
  useEffect(() => {
    if (listing && watchedStartTime && watchedEndTime && watchedStartTime < watchedEndTime) {
      const checkAvailability = async () => {
        setAvailabilityStatus(prev => ({ ...prev, loading: true }));
        
        try {
          const request: AvailabilityRequest = {
            parking_space_id: listing.id,
            start_time: watchedStartTime.toISOString(),
            end_time: watchedEndTime.toISOString()
          };

          const result = await availabilityService.checkAvailabilityWithMessage(request);
          
          setAvailabilityStatus({
            loading: false,
            available: result.available,
            message: result.message,
            conflicts: result.conflicts,
            suggestions: result.suggestions
          });
        } catch (error) {
          console.error('Error checking availability:', error);
          setAvailabilityStatus({
            loading: false,
            available: false,
            message: 'Unable to check availability. Please try again.'
          });
        }
      };

      // Debounce the availability check
      const timeoutId = setTimeout(checkAvailability, 1000);
      return () => clearTimeout(timeoutId);
    } else {
      setAvailabilityStatus({
        loading: false,
        available: null,
        message: ''
      });
    }
  }, [listing, watchedStartTime, watchedEndTime]);

  const loadListing = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/listings/${id}/`);
      console.log('Listing response:', response.data);
      setListing(response.data);
    } catch (error) {
      console.error('Error loading listing:', error);
      toast.error('Failed to load parking space details');
      navigate('/listings');
    } finally {
      setLoading(false);
    }
  };

  const validateBookingTime = (startTime: Date, endTime: Date): string | null => {
    if (!listing?.availability_schedule) return null;
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Check each day the booking spans
    const currentDate = new Date(startTime);
    while (currentDate <= endTime) {
      const dayName = dayNames[currentDate.getDay()];
      const schedule = listing.availability_schedule[dayName];
      
      if (!schedule || !schedule.available) {
        return `❌ Parking space is not available on ${dayName.charAt(0).toUpperCase() + dayName.slice(1)}. Please choose a different day.`;
      }
      
      // Check if booking time is within available hours for this day
      const bookingStartHour = currentDate.getHours();
      const bookingStartMinute = currentDate.getMinutes();
      const bookingTime = `${String(bookingStartHour).padStart(2, '0')}:${String(bookingStartMinute).padStart(2, '0')}`;
      
      // For multi-day bookings, check if it starts after opening time and ends before closing time
      if (currentDate.toDateString() === startTime.toDateString()) {
        // First day - check if it starts after opening time
        if (bookingTime < schedule.start) {
          const friendlyDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
          return `❌ Parking space opens at ${schedule.start} on ${friendlyDay}. Please choose a later start time.`;
        }
      }
      
      if (currentDate.toDateString() === endTime.toDateString()) {
        // Last day - check if it ends before closing time
        const endHour = endTime.getHours();
        const endMinute = endTime.getMinutes();
        const endTimeStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
        
        if (endTimeStr > schedule.end) {
          const friendlyDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
          return `❌ Your booking ends at ${endTimeStr} but parking closes at ${schedule.end} on ${friendlyDay}. Please select an earlier end time.`;
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }
    
    return null; // Booking time is valid
  };

  const calculateDuration = () => {
    if (watchedStartTime && watchedEndTime) {
      const diffMs = watchedEndTime.getTime() - watchedStartTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return Math.max(0, diffHours);
    }
    return 0;
  };

  const calculateTotal = () => {
    const duration = calculateDuration();
    if (listing && duration > 0) {
      const hourlyRate = listing.hourly_rate;
      const subtotal = duration * hourlyRate;
      const platformFee = subtotal * 0.05; // 5% platform fee
      return {
        duration,
        hourlyRate,
        subtotal,
        platformFee,
        total: subtotal + platformFee,
      };
    }
    return {
      duration: 0,
      hourlyRate: 0,
      subtotal: 0,
      platformFee: 0,
      total: 0,
    };
  };

  const onSubmit = async (data: FormData) => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('⚠️ Form already submitting, ignoring duplicate submission');
      return;
    }

    if (!listing) {
      console.error('❌ No listing found');
      return;
    }

    console.log('🚀 BookingForm onSubmit called with data:', data);
    console.log('🔍 Form errors:', errors);
    
    // Validate booking time against availability
    console.log('🔍 Validating booking time...');
    const validationError = validateBookingTime(data.start_time, data.end_time);
    console.log('🔍 Validation result:', validationError);
    if (validationError) {
      console.log('❌ Validation failed:', validationError);
      toast.error(validationError);
      return;
    }
    console.log('✅ Validation passed, proceeding to checkout...');
    
    setIsSubmitting(true);
    try {
      // Prepare checkout data
      const pricing = calculateTotal();
      const checkoutData = {
        listing,
        formData: data,
        pricing,
      };

      console.log('✅ Navigating to checkout page with data:', checkoutData);
      // Navigate to checkout page immediately
      navigate('/checkout', { state: checkoutData });
    } catch (error: any) {
      console.error('Error preparing checkout:', error);
      toast.error('Failed to prepare checkout');
    } finally {
      // Reset submitting state after a brief delay to prevent double-click issues
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const handleCheckoutSuccess = () => {
    toast.success('Booking completed successfully!');
    navigate('/my-bookings');
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    setCheckoutData(null);
  };

  const handleCheckoutBack = () => {
    setShowCheckout(false);
    setCheckoutData(null);
  };

  const handleQuickDuration = (hours: number) => {
    if (watchedStartTime) {
      setValue('end_time', addHours(watchedStartTime, hours));
    }
  };

  // Function to check if a time should be disabled
  const shouldDisableTime = (date: Date, timeType: 'start' | 'end') => {
    if (!listing?.availability_schedule) return false;
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const schedule = listing.availability_schedule[dayName];
    
    if (!schedule || !schedule.available) {
      return true; // Disable all times if day is not available
    }
    
    const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    if (timeType === 'start') {
      return timeStr < schedule.start;
    } else {
      return timeStr > schedule.end;
    }
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
        <Typography>Parking space not found</Typography>
      </Box>
    );
  }

  const pricing = calculateTotal();
  const defaultImage = 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&h=600&fit=crop';

  // Checkout flow is now handled by navigation to /checkout page

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                  onClick={() => navigate(-1)} 
                  sx={{ color: 'white', bgcolor: alpha(theme.palette.common.white, 0.1) }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="h4" component="h1" fontWeight={700} sx={{ color: 'white' }}>
                  Book Parking Space
                </Typography>
              </Stack>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300, color: 'white' }}>
                Complete your reservation for {listing.title}
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Booking Form */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom color="text.primary">
                  Booking Details
                </Typography>
                
                <Box 
                  component="form" 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(onSubmit)(e);
                  }}
                >
                  <Grid container spacing={3}>
                    {/* Date and Time Selection */}
                    <Grid item xs={12}>
                      <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                        When do you need parking?
                      </Typography>
                      {listing.availability_schedule && (
                        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Available hours:
                          </Typography>
                          <Stack direction="row" spacing={2} flexWrap="wrap">
                            {Object.entries(listing.availability_schedule)
                              .filter(([_, schedule]) => schedule.available)
                              .map(([day, schedule]) => (
                                <Chip
                                  key={day}
                                  label={`${day.charAt(0).toUpperCase() + day.slice(1)}: ${schedule.start} - ${schedule.end}`}
                                  size="small"
                                  variant="outlined"
                                  
                                />
                              ))}
                          </Stack>
                        </Paper>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="start_time"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            {...field}
                            label="Start Time"
                            minDateTime={new Date()}
                            maxDateTime={addDays(new Date(), 30)}
                            shouldDisableTime={(date) => shouldDisableTime(date, 'start')}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.start_time,
                                helperText: errors.start_time?.message,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="end_time"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            {...field}
                            label="End Time"
                            minDateTime={watchedStartTime || new Date()}
                            maxDateTime={addDays(new Date(), 30)}
                            shouldDisableTime={(date) => shouldDisableTime(date, 'end')}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.end_time,
                                helperText: errors.end_time?.message,
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>

                    {/* Quick Duration Buttons */}
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Quick duration:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {[1, 2, 4, 8, 24].map((hours) => (
                          <Button
                            key={hours}
                            variant="outlined"
                            size="small"
                            onClick={() => handleQuickDuration(hours)}
                            sx={{ mb: 1 }}
                          >
                            {hours} {hours === 1 ? 'hour' : 'hours'}
                          </Button>
                        ))}
                      </Stack>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider />
                    </Grid>

                    {/* Vehicle Information */}
                    <Grid item xs={12}>
                      <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                        Vehicle Information
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        {...register('vehicle_make')}
                        fullWidth
                        label="Vehicle Make *"
                        placeholder="e.g. Toyota, Honda, Ford"
                        error={!!errors.vehicle_make}
                        helperText={errors.vehicle_make?.message || (user?.profile?.primary_vehicle_make ? 'Auto-filled from your profile' : 'Add to your profile for auto-fill')}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <DirectionsCar />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        {...register('vehicle_model')}
                        fullWidth
                        label="Vehicle Model *"
                        placeholder="e.g. Camry, Civic, Explorer"
                        error={!!errors.vehicle_model}
                        helperText={errors.vehicle_model?.message || (user?.profile?.primary_vehicle_model ? 'Auto-filled from your profile' : 'Add to your profile for auto-fill')}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        {...register('vehicle_year', { valueAsNumber: true })}
                        fullWidth
                        label="Vehicle Year *"
                        type="number"
                        placeholder="e.g. 2020"
                        error={!!errors.vehicle_year}
                        helperText={errors.vehicle_year?.message || (user?.profile?.primary_vehicle_year ? 'Auto-filled from your profile' : 'Add to your profile for auto-fill')}
                        InputProps={{
                          inputProps: {
                            min: 1900,
                            max: new Date().getFullYear() + 1
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        {...register('vehicle_license_plate')}
                        fullWidth
                        label="License Plate Number *"
                        placeholder="ABC-1234"
                        error={!!errors.vehicle_license_plate}
                        helperText={errors.vehicle_license_plate?.message || (user?.profile?.primary_vehicle_license_plate ? 'Auto-filled from your profile' : 'Add to your profile for auto-fill')}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Controller
                        name="vehicle_state"
                        control={control}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.vehicle_state}>
                            <InputLabel>Vehicle Registration State *</InputLabel>
                            <Select
                              {...field}
                              label="Vehicle Registration State *"
                              displayEmpty
                            >
                              {US_STATES.map((state) => (
                                <MenuItem key={state.value} value={state.value}>
                                  {state.label}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.vehicle_state && (
                              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                                {errors.vehicle_state?.message}
                              </Typography>
                            )}
                          </FormControl>
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        {...register('special_instructions')}
                        fullWidth
                        multiline
                        rows={3}
                        label="Special Instructions (Optional)"
                        placeholder="Any special instructions for the host..."
                        error={!!errors.special_instructions}
                        helperText={errors.special_instructions?.message}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Divider />
                    </Grid>

                    {/* Availability Status */}
                    {(availabilityStatus.loading || availabilityStatus.message) && (
                      <Grid item xs={12}>
                        <Paper 
                          elevation={2}
                          sx={{ 
                            p: 2.5, 
                            borderRadius: 2,
                            bgcolor: availabilityStatus.available === true 
                              ? alpha(theme.palette.success.main, 0.1) 
                              : availabilityStatus.available === false 
                                ? alpha(theme.palette.error.main, 0.1)
                                : alpha(theme.palette.info.main, 0.1),
                            border: `2px solid ${
                              availabilityStatus.available === true 
                                ? alpha(theme.palette.success.main, 0.3)
                                : availabilityStatus.available === false 
                                  ? alpha(theme.palette.error.main, 0.3)
                                  : alpha(theme.palette.info.main, 0.3)
                            }`
                          }}
                        >
                          <Stack direction="row" alignItems="flex-start" spacing={2}>
                            {availabilityStatus.loading ? (
                              <Box sx={{ pt: 0.5 }}>
                                <LinearProgress sx={{ width: 24, height: 3, borderRadius: 1 }} />
                              </Box>
                            ) : availabilityStatus.available === true ? (
                              <CheckCircle sx={{ color: 'success.main', fontSize: 24, mt: 0.25 }} />
                            ) : availabilityStatus.available === false ? (
                              <Cancel sx={{ color: 'error.main', fontSize: 24, mt: 0.25 }} />
                            ) : (
                              <Info sx={{ color: 'info.main', fontSize: 24, mt: 0.25 }} />
                            )}
                            <Box sx={{ flex: 1 }}>
                              <Typography 
                                variant="body1" 
                                color={
                                  availabilityStatus.available === true 
                                    ? 'success.main'
                                    : availabilityStatus.available === false 
                                      ? 'error.main'
                                      : 'info.main'
                                }
                                fontWeight={600}
                                sx={{ lineHeight: 1.4 }}
                              >
                                {availabilityStatus.loading 
                                  ? 'Checking availability...' 
                                  : availabilityStatus.message
                                }
                              </Typography>
                              {availabilityStatus.available === false && !availabilityStatus.loading && (
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary" 
                                  sx={{ mt: 0.5, display: 'block' }}
                                >
                                  💡 Tip: Try adjusting your start or end time to find an available slot.
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>
                    )}

                    {/* Legal Disclaimer */}
                    <Grid item xs={12}>
                      <LegalDisclaimer
                        type="booking"
                        required={true}
                        onAccept={setLegalTermsAccepted}
                      />
                    </Grid>

                    {/* Submit Button */}
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={
                          isSubmitting || 
                          !listing.is_active || 
                          availabilityStatus.loading ||
                          availabilityStatus.available === false ||
                          !legalTermsAccepted
                        }
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                        sx={{
                          py: 2,
                          borderRadius: 2,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                        }}
                      >
                        {isSubmitting 
                          ? 'Preparing Checkout...' 
                          : availabilityStatus.available === false
                            ? 'Time Slot Unavailable'
                            : !legalTermsAccepted
                              ? 'Accept Terms to Continue'
                              : 'Proceed to Checkout'
                        }
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
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
                      {listing.borough || 'Location'} • Address shown after booking
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

              {/* Host Info */}
              {listing.host && (
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                      Your Host
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ width: 48, height: 48 }}>
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
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
    </LocalizationProvider>
  );
}