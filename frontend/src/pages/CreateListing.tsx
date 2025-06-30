import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Chip,
  IconButton,
  useTheme,
  alpha,
  Fade,
  Stack,
  Divider,
  LinearProgress,
  Select,
  MenuItem,
  InputLabel,
  Switch,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
  FormHelperText,
} from '@mui/material';
import {
  LocationOn,
  PhotoCamera,
  Schedule,
  AttachMoney,
  CheckCircle,
  Close,
  ArrowBack,
  ArrowForward,
  Info,
  Home,
  DirectionsCar,
  Security,
  ElectricBolt,
  Accessible,
  LocalCarWash,
  PersonPin,
  Lightbulb,
  Videocam,
  Lock,
  GpsFixed,
  Upload,
  Delete,
  CalendarToday,
  MonetizationOn,
  StarBorder,
  Wifi,
  AcUnit,
  LocalGasStation,
  LocalParking,
  Garage,
  Business,
  NightShelter,
} from '@mui/icons-material';

import { listingsService } from '../services/listings'
import api from '../services/api'
import {
  type CreateListingData,
  PARKING_TYPE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  BOROUGH_OPTIONS,
  type VehicleType,
} from '../types/parking'
import LocationPicker from '../components/maps/LocationPicker'
import PhotoUpload from '../components/common/PhotoUpload'
import { NYC_NEIGHBORHOODS } from '../utils/locationUtils'

// Form validation schema
const schema = yup.object({
  title: yup
    .string()
    .required('Nearest street corner/intersection is required')
    .max(100, 'Must be less than 100 characters'),
  description: yup
    .string()
    .required('Description is required')
    .max(500, 'Description must be less than 500 characters'),
  parking_type: yup
    .string()
    .required('Parking type is required'),
  vehicle_types: yup
    .array()
    .of(yup.string())
    .min(1, 'Select at least one vehicle type'),
  location: yup.object({
    address: yup.string().required('Street address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    zipCode: yup
      .string()
      .required('ZIP code is required')
      .matches(/^\d{5}$/, 'ZIP code must be 5 digits'),
    borough: yup.string().when('state', {
      is: 'NY',
      then: (schema) => schema.required('Borough is required for New York listings'),
      otherwise: (schema) => schema
    }),
    neighborhood: yup.string().when(['state', 'borough'], {
      is: (state, borough) => state === 'NY' && borough,
      then: (schema) => schema.required('Neighborhood is required when borough is selected'),
      otherwise: (schema) => schema
    }),
    latitude: yup.number().notRequired(),
    longitude: yup.number().notRequired(),
  }),
  pricing: yup.object({
    hourly_rate: yup
      .number()
      .required('Hourly rate is required')
      .min(1, 'Hourly rate must be at least $1')
      .max(100, 'Hourly rate cannot exceed $100'),
    daily_rate: yup
      .number()
      .min(0, 'Daily rate must be at least $0')
      .max(500, 'Daily rate cannot exceed $500'),
    weekly_rate: yup
      .number()
      .min(0, 'Weekly rate must be at least $0')
      .max(2000, 'Weekly rate cannot exceed $2000'),
    monthly_rate: yup
      .number()
      .min(0, 'Monthly rate must be at least $0')
      .max(5000, 'Monthly rate cannot exceed $5000'),
  }),
});

interface FormData {
  title: string
  description: string
  parking_type: string
  vehicle_types: string[]
  location: {
    address: string
    city: string
    state: string
    zipCode: string
    borough: string
    neighborhood: string
    latitude: number
    longitude: number
  }
  pricing: {
    hourly_rate: number
    daily_rate?: number
    weekly_rate?: number
    monthly_rate?: number
  }
  amenities: {
    covered: boolean
    security: boolean
    lighting: boolean
    cctv: boolean
    gated: boolean
    electric_charging: boolean
    handicap_accessible: boolean
    valet: boolean
    car_wash: boolean
  }
  availability: {
    monday: { start: string; end: string; available: boolean }
    tuesday: { start: string; end: string; available: boolean }
    wednesday: { start: string; end: string; available: boolean }
    thursday: { start: string; end: string; available: boolean }
    friday: { start: string; end: string; available: boolean }
    saturday: { start: string; end: string; available: boolean }
    sunday: { start: string; end: string; available: boolean }
  }
}

const steps = [
  'Basic Information',
  'Location Details', 
  'Amenities & Features',
  'Pricing Strategy',
  'Availability Schedule',
  'Photos & Gallery'
];

export default function CreateListing() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editListingId, setEditListingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      parking_type: '',
      vehicle_types: [],
      location: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        borough: '',
        neighborhood: '',
        latitude: 0,
        longitude: 0,
      },
      pricing: {
        hourly_rate: 0,
        daily_rate: 0,
        weekly_rate: 0,
        monthly_rate: 0,
      },
      amenities: {
        covered: false,
        security: false,
        lighting: false,
        cctv: false,
        gated: false,
        electric_charging: false,
        handicap_accessible: false,
        valet: false,
        car_wash: false,
      },
      availability: {
        monday: { start: '00:00', end: '23:59', available: true },
        tuesday: { start: '00:00', end: '23:59', available: true },
        wednesday: { start: '00:00', end: '23:59', available: true },
        thursday: { start: '00:00', end: '23:59', available: true },
        friday: { start: '00:00', end: '23:59', available: true },
        saturday: { start: '00:00', end: '23:59', available: true },
        sunday: { start: '00:00', end: '23:59', available: true },
      },
    },
  });

  // Check for edit mode and load existing listing
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId) {
      setIsEditMode(true);
      setEditListingId(editId);
      loadExistingListing(editId);
    }
  }, [searchParams]);

  const loadExistingListing = async (listingId: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/listings/${listingId}/`);
      const listing = response.data;
      console.log('Loaded existing listing:', listing);

      // Populate form with existing data
      setValue('title', listing.title || '');
      setValue('description', listing.description || '');
      setValue('parking_type', listing.space_type || '');
      
      // Parse vehicle types from max_vehicle_size
      const vehicleTypes = listing.max_vehicle_size ? listing.max_vehicle_size.split(', ').map((v: string) => v.trim()) : [];
      setValue('vehicle_types', vehicleTypes);

      // Parse address into components
      const addressParts = listing.address ? listing.address.split(', ') : [];
      setValue('location.address', addressParts[0] || '');
      setValue('location.city', addressParts[1] || '');
      setValue('location.state', addressParts[2]?.split(' ')[0] || '');
      setValue('location.zipCode', addressParts[2]?.split(' ')[1] || '');
      setValue('location.borough', listing.borough || '');
      setValue('location.neighborhood', listing.neighborhood || '');
      setValue('location.latitude', parseFloat(listing.latitude) || 0);
      setValue('location.longitude', parseFloat(listing.longitude) || 0);

      // Set pricing
      setValue('pricing.hourly_rate', listing.hourly_rate || 0);
      setValue('pricing.daily_rate', listing.daily_rate || 0);
      setValue('pricing.weekly_rate', listing.weekly_rate || 0);

      // Set amenities
      setValue('amenities.covered', listing.is_covered || false);
      setValue('amenities.security', listing.has_security || false);
      setValue('amenities.electric_charging', listing.has_ev_charging || false);
      setValue('amenities.lighting', listing.has_lighting || false);
      setValue('amenities.cctv', listing.has_cctv || false);
      setValue('amenities.gated', listing.has_gated_access || false);
      setValue('amenities.handicap_accessible', listing.is_handicap_accessible || false);
      setValue('amenities.valet', listing.has_valet_service || false);
      setValue('amenities.car_wash', listing.has_car_wash || false);

      toast.success('Listing loaded for editing');
    } catch (error) {
      console.error('Error loading listing for edit:', error);
      toast.error('Failed to load listing for editing');
      navigate('/my-listings');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation functions
  const handleNext = async () => {
    const isStepValid = await validateCurrentStep();
    if (isStepValid) {
      setActiveStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  const validateCurrentStep = async () => {
    let fieldsToValidate: string[] = [];
    
    switch (activeStep) {
      case 0: // Basic Information
        fieldsToValidate = ['title', 'description', 'parking_type', 'vehicle_types'];
        break;
      case 1: // Location Details
        fieldsToValidate = ['location.address', 'location.city', 'location.state', 'location.zipCode'];
        // Add borough and neighborhood validation for NY state
        const currentState = watch('location.state');
        if (currentState === 'NY') {
          fieldsToValidate.push('location.borough', 'location.neighborhood');
        }
        break;
      case 2: // Amenities & Features (no validation needed)
        return true;
      case 3: // Pricing Strategy
        fieldsToValidate = ['pricing.hourly_rate'];
        break;
      case 4: // Availability Schedule (no validation needed)
        return true;
      case 5: // Photos & Gallery (no validation needed)
        return true;
      default:
        return true;
    }

    return await trigger(fieldsToValidate as any);
  };

  const validateAllSteps = async () => {
    console.log('Validating all steps...');
    
    // Validate all required fields across all steps
    const allRequiredFields = [
      'title', 
      'description', 
      'parking_type', 
      'vehicle_types',
      'location.address', 
      'location.city', 
      'location.state', 
      'location.zipCode',
      'pricing.hourly_rate'
    ];
    
    // Add borough and neighborhood for NY state
    const currentState = watch('location.state');
    if (currentState === 'NY') {
      allRequiredFields.push('location.borough', 'location.neighborhood');
    }
    
    const isValid = await trigger(allRequiredFields as any);
    console.log('All steps validation result:', isValid);
    
    if (!isValid) {
      const currentErrors = Object.keys(errors);
      console.log('Validation errors:', currentErrors, errors);
      
      // Find which step has errors and navigate to it
      if (errors.title || errors.description || errors.parking_type || errors.vehicle_types) {
        setActiveStep(0);
        toast.error('Please complete all fields in Basic Information');
      } else if (errors.location) {
        setActiveStep(1);
        const locationErrorMessage = currentState === 'NY' 
          ? 'Please complete all location details including borough and neighborhood'
          : 'Please complete all location details';
        toast.error(locationErrorMessage);
      } else if (errors.pricing) {
        setActiveStep(3);
        toast.error('Please set an hourly rate');
      } else {
        toast.error('Please complete all required fields');
      }
    }
    
    return isValid;
  };

  const watchedVehicleTypes = watch('vehicle_types');
  const watchedParkingType = watch('parking_type');
  const watchedLocation = watch('location');

  // Auto-geocode address when location fields change
  useEffect(() => {
    const geocodeAddress = async () => {
      const address = watchedLocation?.address;
      const city = watchedLocation?.city;
      const state = watchedLocation?.state;
      const zipCode = watchedLocation?.zipCode;
      
      // Only geocode if we have enough address information and coordinates are missing
      if (address && city && state && zipCode && 
          (!watchedLocation?.latitude || !watchedLocation?.longitude || 
           watchedLocation?.latitude === 0 || watchedLocation?.longitude === 0)) {
        
        const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
        console.log('Auto-geocoding address:', fullAddress);
        
        try {
          // Use a simple geocoding service (you can replace this with Google Maps API if needed)
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`);
          const data = await response.json();
          
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            
            console.log('Geocoded coordinates:', lat, lng);
            setValue('location.latitude', lat);
            setValue('location.longitude', lng);
            toast.success('Address location found automatically!');
          } else {
            console.log('No geocoding results found for:', fullAddress);
            // Set default coordinates for NYC if geocoding fails
            if (state === 'NY') {
              setValue('location.latitude', 40.7128);
              setValue('location.longitude', -74.0060);
              console.log('Using default NYC coordinates');
            }
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          // Set default coordinates for NYC if geocoding fails
          if (state === 'NY') {
            setValue('location.latitude', 40.7128);
            setValue('location.longitude', -74.0060);
            console.log('Using default NYC coordinates due to geocoding error');
          }
        }
      }
    };

    // Debounce geocoding to avoid too many requests
    const timeoutId = setTimeout(geocodeAddress, 1000);
    return () => clearTimeout(timeoutId);
  }, [watchedLocation?.address, watchedLocation?.city, watchedLocation?.state, watchedLocation?.zipCode, setValue]);

  // Form submission
  const onSubmit = async (data: FormData) => {
    console.log('onSubmit function called!');
    console.log('Form submission started with data:', data);
    console.log('Is edit mode:', isEditMode, 'Edit listing ID:', editListingId);
    setIsSubmitting(true);
    try {
      // Helper function to map city to NYC borough
      const mapToBorough = (city: string, state: string): string => {
        const cityLower = city.toLowerCase();
        const stateLower = state.toLowerCase();
        
        // If not in NY/NYC area, default to Manhattan
        if (stateLower !== 'ny' && stateLower !== 'new york') {
          return 'Manhattan';
        }
        
        // Map common city names to boroughs
        if (cityLower.includes('manhattan') || cityLower.includes('new york')) return 'Manhattan';
        if (cityLower.includes('brooklyn')) return 'Brooklyn';
        if (cityLower.includes('queens')) return 'Queens';
        if (cityLower.includes('bronx')) return 'Bronx';
        if (cityLower.includes('staten') || cityLower.includes('island')) return 'Staten Island';
        
        // Default to Manhattan for NYC area
        return 'Manhattan';
      };

      // Helper function to validate space type
      const validateSpaceType = (parkingType: string): string => {
        const validTypes = ['driveway', 'garage', 'lot', 'street'];
        if (validTypes.includes(parkingType)) {
          return parkingType;
        }
        // If 'covered' was selected, map to 'garage' as a reasonable default
        if (parkingType === 'covered') {
          return 'garage';
        }
        // Default fallback
        return 'driveway';
      };

      // Convert form data to match backend API format
      const createData = {
        title: data.title,
        description: data.description,
        address: `${data.location.address}, ${data.location.city}, ${data.location.state} ${data.location.zipCode}`,
        latitude: data.location.latitude ? parseFloat(parseFloat(data.location.latitude.toString()).toFixed(8)) : null,
        longitude: data.location.longitude ? parseFloat(parseFloat(data.location.longitude.toString()).toFixed(8)) : null,
        borough: data.location.borough || mapToBorough(data.location.city || '', data.location.state || ''),
        neighborhood: data.location.neighborhood || '',
        space_type: validateSpaceType(data.parking_type),
        max_vehicle_size: data.vehicle_types.join(', '),
        hourly_rate: parseFloat(data.pricing.hourly_rate.toString()),
        // All rate fields are required by the backend model - use hourly rate as fallback
        daily_rate: data.pricing.daily_rate ? parseFloat(data.pricing.daily_rate.toString()) : parseFloat(data.pricing.hourly_rate.toString()) * 8,
        weekly_rate: data.pricing.weekly_rate ? parseFloat(data.pricing.weekly_rate.toString()) : parseFloat(data.pricing.hourly_rate.toString()) * 40,
        is_covered: data.amenities.covered || (data.parking_type === 'covered'),
        has_ev_charging: data.amenities.electric_charging || false,
        has_security: data.amenities.security || false,
        has_lighting: data.amenities.lighting || false,
        has_cctv: data.amenities.cctv || false,
        has_gated_access: data.amenities.gated || false,
        is_handicap_accessible: data.amenities.handicap_accessible || false,
        has_valet_service: data.amenities.valet || false,
        has_car_wash: data.amenities.car_wash || false,
        instructions: 'Please follow the parking instructions provided.',
        availability_schedule: data.availability,
      };

      console.log('Location data:', data.location);
      console.log('Sending data to backend:', createData);

      // Create or update listing
      let response;
      if (isEditMode && editListingId) {
        response = await api.put(`/listings/${editListingId}/`, createData);
        console.log('Listing updated, response:', response.data);
      } else {
        response = await api.post('/listings/', createData);
        console.log('Listing created, response:', response.data);
      }
      
      // Upload images if any
      if (selectedImages.length > 0) {
        // The backend might return the ID in different ways
        const listingId = response.data.id || response.data.pk || response.data.listing_id;
        console.log('Listing ID for images:', listingId);
        console.log('Full response data:', response.data);
        
        if (!listingId) {
          console.warn('No listing ID found in response, skipping image upload');
          toast.success(`Listing ${isEditMode ? 'updated' : 'created'} successfully! (Images could not be uploaded)`);
          navigate(isEditMode ? '/my-listings' : '/dashboard');
          return;
        }
        
        // Upload each image separately
        for (let i = 0; i < selectedImages.length; i++) {
          const imageFormData = new FormData();
          imageFormData.append('image', selectedImages[i]);
          imageFormData.append('alt_text', `Parking space photo ${i + 1}`);
          imageFormData.append('display_order', i.toString());
          
          try {
            await api.post(`/listings/${listingId}/images/`, imageFormData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
          } catch (imageError) {
            console.warn(`Failed to upload image ${i + 1}:`, imageError);
          }
        }
      }

      if (isEditMode) {
        toast.success('Listing updated successfully!');
      } else {
        toast.success('Listing created successfully! It will be reviewed by our admin team within 24 hours before going live.', {
          duration: 6000
        });
      }
      navigate(isEditMode ? '/my-listings' : '/dashboard');
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} listing:`, error);
      toast.error(error.response?.data?.message || error.message || `Failed to ${isEditMode ? 'update' : 'create'} listing`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image handling
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(prev => [...prev, ...files].slice(0, 8)); // Max 8 images
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Step Components
  const renderBasicInformation = () => (
    <Fade in timeout={300}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
            Tell us about your parking space
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Provide basic details to help renters understand what you're offering.
          </Typography>
        </Grid>

        {/* Title */}
        <Grid size={12}>
          <TextField
            {...register('title')}
            fullWidth
            label="Nearest Street Corner/Intersection"
            placeholder="e.g., Broadway & 42nd Street, Main St & 1st Ave"
            error={!!errors.title}
            helperText={errors.title?.message || 'Enter the nearest street corner or intersection to help renters locate your space'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Home color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Description */}
        <Grid size={12}>
          <TextField
            {...register('description')}
            fullWidth
            multiline
            rows={4}
            label="Description"
            placeholder="Describe your parking space, its location benefits, any special features..."
            error={!!errors.description}
            helperText={errors.description?.message || 'Provide details about size, accessibility, nearby landmarks, and what makes your space special'}
          />
        </Grid>

        {/* Parking Type */}
        <Grid size={12}>
          <FormControl component="fieldset" error={!!errors.parking_type} fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500 }}>
              What type of parking space is this?
            </FormLabel>
            <Controller
              name="parking_type"
              control={control}
              render={({ field }) => (
                <Grid container spacing={2}>
                  {PARKING_TYPE_OPTIONS.map((option) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={option.value}>
                      <Box
                        onClick={() => field.onChange(option.value)}
                        sx={{
                          cursor: 'pointer',
                          p: 3,
                          border: 2,
                          borderColor: field.value === option.value ? 'primary.main' : 'grey.300',
                          borderRadius: 2,
                          textAlign: 'center',
                          backgroundColor: field.value === option.value ? 'primary.light' : 'background.paper',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'primary.light',
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        <Box sx={{ fontSize: 60, mb: 2 }}>
                          {option.value === 'garage' && '🏢'}
                          {option.value === 'driveway' && '🏠'}
                          {option.value === 'lot' && '🅿️'}
                          {option.value === 'street' && '🛣️'}
                          {option.value === 'covered' && '🏗️'}
                        </Box>
                        <Typography variant="h6" fontWeight="bold">
                          {option.label}
                        </Typography>
                        <Radio
                          checked={field.value === option.value}
                          value={option.value}
                          sx={{ display: 'none' }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            />
            {errors.parking_type && (
              <FormHelperText>{errors.parking_type.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        {/* Vehicle Types */}
        <Grid size={12}>
          <FormControl component="fieldset" error={!!errors.vehicle_types} fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500 }}>
              What types of vehicles can park here?
            </FormLabel>
            <Controller
              name="vehicle_types"
              control={control}
              render={({ field }) => (
                <Grid container spacing={2}>
                  {VEHICLE_TYPE_OPTIONS.map((option) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={option.value}>
                      <Box
                        onClick={() => {
                          const isSelected = field.value?.includes(option.value) || false;
                          const newValue = isSelected
                            ? field.value?.filter(v => v !== option.value) || []
                            : [...(field.value || []), option.value];
                          field.onChange(newValue);
                        }}
                        sx={{
                          cursor: 'pointer',
                          p: 3,
                          border: 2,
                          borderColor: field.value?.includes(option.value) ? 'primary.main' : 'grey.300',
                          borderRadius: 2,
                          textAlign: 'center',
                          backgroundColor: field.value?.includes(option.value) ? 'primary.light' : 'background.paper',
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: 'primary.light',
                          },
                          transition: 'all 0.2s',
                        }}
                      >
                        <Box sx={{ fontSize: 50, mb: 2 }}>
                          {option.value === 'car' && '🚗'}
                          {option.value === 'suv' && '🚙'}
                          {option.value === 'truck' && '🚛'}
                          {option.value === 'van' && '🚐'}
                          {option.value === 'motorcycle' && '🏍️'}
                        </Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {option.label}
                        </Typography>
                        <Checkbox
                          checked={field.value?.includes(option.value) || false}
                          value={option.value}
                          sx={{ display: 'none' }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            />
            {errors.vehicle_types && (
              <FormHelperText>{errors.vehicle_types.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>
      </Grid>
    </Fade>
  );

  const renderLocationDetails = () => (
    <Fade in timeout={300}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
            Where is your parking space located?
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Help renters find your space with accurate location details.
            {watch('location.state') === 'NY' && (
              <span style={{ color: '#d32f2f', fontWeight: 500 }}>
                <br />* Borough and neighborhood are required for New York listings.
              </span>
            )}
          </Typography>
        </Grid>

        {/* Street Address */}
        <Grid size={12}>
          <TextField
            {...register('location.address')}
            fullWidth
            label="Street Address"
            placeholder="e.g., 123 Main Street, Apt 2B"
            error={!!errors.location?.address}
            helperText={errors.location?.address?.message || 'Enter the complete street address including apartment/unit number if applicable'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOn color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* City, State, ZIP */}
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            {...register('location.city')}
            fullWidth
            label="City"
            placeholder="e.g., New York"
            error={!!errors.location?.city}
            helperText={errors.location?.city?.message}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth error={!!errors.location?.state}>
            <InputLabel>State</InputLabel>
            <Controller
              name="location.state"
              control={control}
              render={({ field }) => (
                <Select {...field} label="State">
                  <MenuItem value="AL">Alabama</MenuItem>
                  <MenuItem value="AK">Alaska</MenuItem>
                  <MenuItem value="AZ">Arizona</MenuItem>
                  <MenuItem value="AR">Arkansas</MenuItem>
                  <MenuItem value="CA">California</MenuItem>
                  <MenuItem value="CO">Colorado</MenuItem>
                  <MenuItem value="CT">Connecticut</MenuItem>
                  <MenuItem value="DE">Delaware</MenuItem>
                  <MenuItem value="FL">Florida</MenuItem>
                  <MenuItem value="GA">Georgia</MenuItem>
                  <MenuItem value="HI">Hawaii</MenuItem>
                  <MenuItem value="ID">Idaho</MenuItem>
                  <MenuItem value="IL">Illinois</MenuItem>
                  <MenuItem value="IN">Indiana</MenuItem>
                  <MenuItem value="IA">Iowa</MenuItem>
                  <MenuItem value="KS">Kansas</MenuItem>
                  <MenuItem value="KY">Kentucky</MenuItem>
                  <MenuItem value="LA">Louisiana</MenuItem>
                  <MenuItem value="ME">Maine</MenuItem>
                  <MenuItem value="MD">Maryland</MenuItem>
                  <MenuItem value="MA">Massachusetts</MenuItem>
                  <MenuItem value="MI">Michigan</MenuItem>
                  <MenuItem value="MN">Minnesota</MenuItem>
                  <MenuItem value="MS">Mississippi</MenuItem>
                  <MenuItem value="MO">Missouri</MenuItem>
                  <MenuItem value="MT">Montana</MenuItem>
                  <MenuItem value="NE">Nebraska</MenuItem>
                  <MenuItem value="NV">Nevada</MenuItem>
                  <MenuItem value="NH">New Hampshire</MenuItem>
                  <MenuItem value="NJ">New Jersey</MenuItem>
                  <MenuItem value="NM">New Mexico</MenuItem>
                  <MenuItem value="NY">New York</MenuItem>
                  <MenuItem value="NC">North Carolina</MenuItem>
                  <MenuItem value="ND">North Dakota</MenuItem>
                  <MenuItem value="OH">Ohio</MenuItem>
                  <MenuItem value="OK">Oklahoma</MenuItem>
                  <MenuItem value="OR">Oregon</MenuItem>
                  <MenuItem value="PA">Pennsylvania</MenuItem>
                  <MenuItem value="RI">Rhode Island</MenuItem>
                  <MenuItem value="SC">South Carolina</MenuItem>
                  <MenuItem value="SD">South Dakota</MenuItem>
                  <MenuItem value="TN">Tennessee</MenuItem>
                  <MenuItem value="TX">Texas</MenuItem>
                  <MenuItem value="UT">Utah</MenuItem>
                  <MenuItem value="VT">Vermont</MenuItem>
                  <MenuItem value="VA">Virginia</MenuItem>
                  <MenuItem value="WA">Washington</MenuItem>
                  <MenuItem value="WV">West Virginia</MenuItem>
                  <MenuItem value="WI">Wisconsin</MenuItem>
                  <MenuItem value="WY">Wyoming</MenuItem>
                </Select>
              )}
            />
            {errors.location?.state && (
              <FormHelperText>{errors.location.state.message}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            {...register('location.zipCode')}
            fullWidth
            label="ZIP Code"
            placeholder="10001"
            error={!!errors.location?.zipCode}
            helperText={errors.location?.zipCode?.message}
          />
        </Grid>

        {/* Borough and Neighborhood Selection - Required for NY state */}
        {watch('location.state') === 'NY' && (
          <>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth error={!!errors.location?.borough}>
                <InputLabel>Borough *</InputLabel>
                <Controller
                  name="location.borough"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      {...field} 
                      label="Borough *"
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        // Clear neighborhood when borough changes
                        setValue('location.neighborhood', '');
                      }}
                    >
                      <MenuItem value="">Select Borough</MenuItem>
                      {Object.keys(NYC_NEIGHBORHOODS).map((borough) => (
                        <MenuItem key={borough} value={borough}>
                          {borough}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.location?.borough ? (
                  <FormHelperText>{errors.location.borough.message}</FormHelperText>
                ) : (
                  <FormHelperText>Select the NYC borough (required for NY listings)</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth disabled={!watch('location.borough')} error={!!errors.location?.neighborhood}>
                <InputLabel>Neighborhood *</InputLabel>
                <Controller
                  name="location.neighborhood"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      {...field} 
                      label="Neighborhood *"
                    >
                      <MenuItem value="">Select Neighborhood</MenuItem>
                      {watch('location.borough') && NYC_NEIGHBORHOODS[watch('location.borough') as keyof typeof NYC_NEIGHBORHOODS]?.sort().map((neighborhood) => (
                        <MenuItem key={neighborhood} value={neighborhood}>
                          {neighborhood}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.location?.neighborhood ? (
                  <FormHelperText>{errors.location.neighborhood.message}</FormHelperText>
                ) : (
                  <FormHelperText>
                    {watch('location.borough') 
                      ? 'Select the specific neighborhood (required)'
                      : 'Select a borough first to choose a neighborhood'
                    }
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>
          </>
        )}

        {/* Auto-geocoding status and optional map */}
        <Grid size={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              📍 Location Verification
            </Typography>
            {watchedLocation?.latitude && watchedLocation?.longitude && 
             watchedLocation.latitude !== 0 && watchedLocation.longitude !== 0 ? (
              <Box>
                <Typography color="success.main" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  ✅ Location found automatically! 
                  <Typography component="span" variant="body2" color="text.secondary">
                    Coordinates: {watchedLocation.latitude.toFixed(6)}, {watchedLocation.longitude.toFixed(6)}
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your address has been automatically located. You can optionally fine-tune the pin location below for more precise directions.
                </Typography>
                <Box sx={{ height: 300, borderRadius: 1, overflow: 'hidden' }}>
                  <LocationPicker
                    onLocationSelect={(location) => {
                      setValue('location.latitude', location.lat);
                      setValue('location.longitude', location.lng);
                    }}
                    initialLocation={
                      watchedLocation?.latitude && watchedLocation?.longitude
                        ? { lat: watchedLocation.latitude, lng: watchedLocation.longitude }
                        : undefined
                    }
                  />
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  📍 We'll automatically find your location once you complete the address fields above.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No manual pin placement required! Just fill in your address, city, state, and ZIP code.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Fade>
  );

  const renderAmenitiesAndFeatures = () => {
    const amenityOptions = [
      { key: 'covered', label: 'Covered/Indoor', icon: <NightShelter />, description: 'Protected from weather' },
      { key: 'security', label: 'Security', icon: <Security />, description: 'Secured area or security guard' },
      { key: 'electric_charging', label: 'EV Charging', icon: <ElectricBolt />, description: 'Electric vehicle charging' },
      { key: 'lighting', label: 'Well Lit', icon: <Lightbulb />, description: 'Good lighting for safety' },
      { key: 'cctv', label: 'CCTV Monitoring', icon: <Videocam />, description: 'Video surveillance' },
      { key: 'gated', label: 'Gated Access', icon: <Lock />, description: 'Controlled/gated access' },
      { key: 'handicap_accessible', label: 'Wheelchair Accessible', icon: <Accessible />, description: 'ADA compliant' },
      { key: 'valet', label: 'Valet Service', icon: <PersonPin />, description: 'Valet parking service' },
      { key: 'car_wash', label: 'Car Wash', icon: <LocalCarWash />, description: 'Car washing services' },
    ];

    return (
      <Fade in timeout={300}>
        <Grid container spacing={3}>
          <Grid size={12}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
              What amenities and features does your space offer?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Highlight the features that make your parking space special and attract more renters.
            </Typography>
          </Grid>

          {amenityOptions.map((amenity) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={amenity.key}>
              <Controller
                name={`amenities.${amenity.key}` as any}
                control={control}
                render={({ field }) => (
                  <Paper
                    elevation={field.value ? 4 : 1}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      border: 2,
                      borderColor: field.value ? 'primary.main' : 'transparent',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4],
                      },
                    }}
                    onClick={() => field.onChange(!field.value)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ color: field.value ? 'primary.main' : 'text.secondary', mr: 2 }}>
                        {amenity.icon}
                      </Box>
                      <Switch
                        checked={field.value || false}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {amenity.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {amenity.description}
                    </Typography>
                  </Paper>
                )}
              />
            </Grid>
          ))}
        </Grid>
      </Fade>
    );
  };

  const renderPricingStrategy = () => (
    <Fade in timeout={300}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
            Set your pricing strategy
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Price your space competitively to attract more bookings.
          </Typography>
        </Grid>

        {/* Hourly Rate */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            {...register('pricing.hourly_rate')}
            fullWidth
            type="number"
            label="Hourly Rate"
            error={!!errors.pricing?.hourly_rate}
            helperText={errors.pricing?.hourly_rate?.message || 'Required - base rate for hourly bookings'}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              endAdornment: <InputAdornment position="end">/hour</InputAdornment>,
            }}
          />
        </Grid>

        {/* Daily Rate */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            {...register('pricing.daily_rate')}
            fullWidth
            type="number"
            label="Daily Rate (Optional)"
            helperText="Offer a discounted rate for full-day bookings"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              endAdornment: <InputAdornment position="end">/day</InputAdornment>,
            }}
          />
        </Grid>

        {/* Weekly Rate */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            {...register('pricing.weekly_rate')}
            fullWidth
            type="number"
            label="Weekly Rate (Optional)"
            helperText="Attract longer stays with weekly discounts"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              endAdornment: <InputAdornment position="end">/week</InputAdornment>,
            }}
          />
        </Grid>

        {/* Monthly Rate */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            {...register('pricing.monthly_rate')}
            fullWidth
            type="number"
            label="Monthly Rate (Optional)"
            helperText="Best value for regular commuters"
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
              endAdornment: <InputAdornment position="end">/month</InputAdornment>,
            }}
          />
        </Grid>

      </Grid>
    </Fade>
  );

  const renderAvailabilitySchedule = () => {
    const days = [
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' },
    ];

    return (
      <Fade in timeout={300}>
        <Grid container spacing={3}>
          <Grid size={12}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              When is your space available?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Set your availability schedule to let renters know when they can book your space.
            </Typography>
          </Grid>

          {days.map((day) => (
            <Grid size={12} key={day.key}>
              <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                <Stack 
                  direction={{ xs: 'column', md: 'row' }} 
                  alignItems={{ xs: 'stretch', md: 'center' }} 
                  spacing={3}
                >
                  <Box sx={{ minWidth: { xs: 'auto', md: 120 } }}>
                    <Typography variant="h6" fontWeight="bold">
                      {day.label}
                    </Typography>
                  </Box>
                  
                  <Controller
                    name={`availability.${day.key}.available` as any}
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={field.value || false}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        }
                        label="Available"
                        sx={{ alignSelf: { xs: 'flex-start', md: 'center' } }}
                      />
                    )}
                  />

                  {watch(`availability.${day.key}.available` as any) && (
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      alignItems={{ xs: 'stretch', sm: 'center' }} 
                      spacing={2}
                      sx={{ width: { xs: '100%', md: 'auto' } }}
                    >
                      <Controller
                        name={`availability.${day.key}.start` as any}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="time"
                            label="Start Time"
                            size="small"
                            sx={{ 
                              minWidth: { xs: 'auto', sm: 120 },
                              width: { xs: '100%', sm: 'auto' }
                            }}
                          />
                        )}
                      />
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          alignSelf: 'center',
                          textAlign: { xs: 'center', sm: 'left' },
                          py: { xs: 0.5, sm: 0 }
                        }}
                      >
                        to
                      </Typography>
                      
                      <Controller
                        name={`availability.${day.key}.end` as any}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            type="time"
                            label="End Time"
                            size="small"
                            sx={{ 
                              minWidth: { xs: 'auto', sm: 120 },
                              width: { xs: '100%', sm: 'auto' }
                            }}
                          />
                        )}
                      />
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Fade>
    );
  };

  const renderPhotosAndGallery = () => (
    <Fade in timeout={300}>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'primary.main' }}>
            Add photos of your parking space
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Great photos help your listing stand out and give renters confidence in booking your space.
          </Typography>
        </Grid>

        {/* Photo Upload Component */}
        <Grid size={12}>
          <PhotoUpload
            photos={photoUrls}
            onPhotosChange={(newPhotos) => {
              setPhotoUrls(newPhotos);
              // Convert blob URLs to actual files for submission
              // This is a simplified approach - in production you'd want to handle this more robustly
            }}
            maxPhotos={8}
            disabled={isSubmitting}
          />
        </Grid>

        {/* Admin Approval Notice */}
        <Grid size={12}>
          <Paper elevation={2} sx={{ p: 3, backgroundColor: alpha(theme.palette.warning.main, 0.05), border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}` }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'warning.main' }}>
              ⏳ Admin Review Required
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {isEditMode 
                ? "Any changes to your listing will require admin review before they go live. This process typically takes up to 24 hours."
                : "Before your listing goes live, our admin team will review it to ensure it meets our quality and safety standards. This process typically takes up to 24 hours."
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You'll receive an email notification once your listing has been {isEditMode ? 'reviewed and approved' : 'approved and is live on the platform'}.
            </Typography>
          </Paper>
        </Grid>

        {/* Photography Tips */}
        <Grid size={12}>
          <Paper elevation={1} sx={{ p: 3, backgroundColor: alpha(theme.palette.info.main, 0.05) }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'info.main' }}>
              📸 Photography Tips
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="info" />
                </ListItemIcon>
                <ListItemText primary="Take photos during daylight for best quality" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="info" />
                </ListItemIcon>
                <ListItemText primary="Show the entire parking space and its boundaries" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="info" />
                </ListItemIcon>
                <ListItemText primary="Include photos of the entrance and access route" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle color="info" />
                </ListItemIcon>
                <ListItemText primary="Highlight special features like security or charging stations" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Fade>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInformation();
      case 1:
        return renderLocationDetails();
      case 2:
        return renderAmenitiesAndFeatures();
      case 3:
        return renderPricingStrategy();
      case 4:
        return renderAvailabilitySchedule();
      case 5:
        return renderPhotosAndGallery();
      default:
        return null;
    }
  };

  // Show loading while loading existing listing data
  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack alignItems="center" spacing={2}>
          <LinearProgress sx={{ width: '50%' }} />
          <Typography>Loading listing for editing...</Typography>
        </Stack>
      </Box>
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
        py: 6,
        mb: 4,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in timeout={800}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h2" component="h1" fontWeight={700} gutterBottom color="white">
                {isEditMode ? 'Edit Your Parking Space' : 'List Your Parking Space'}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300, maxWidth: 600, mx: 'auto' }} color="white">
                {isEditMode 
                  ? 'Update your listing details to keep your parking space information current.'
                  : 'Join thousands of hosts earning money from their unused parking spaces. Create your listing in just a few simple steps.'
                }
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Stepper */}
        <Card sx={{ 
          mb: 4, 
          borderRadius: 3,
          boxShadow: theme.shadows[4],
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}>
          <CardContent sx={{ p: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    StepIconProps={{
                      style: {
                        color: index <= activeStep ? theme.palette.primary.main : theme.palette.grey[400],
                      },
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      color={index <= activeStep ? 'primary' : 'text.secondary'}
                      fontWeight={index === activeStep ? 'bold' : 'normal'}
                    >
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Form */}
        <Card sx={{ 
          borderRadius: 3,
          boxShadow: theme.shadows[4],
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          mb: 4,
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              {getStepContent(activeStep)}
            </Box>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            startIcon={<ArrowBack />}
            size="large"
            sx={{ px: 4 }}
          >
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                variant="contained"
                endIcon={<ArrowForward />}
                size="large"
                sx={{ px: 4 }}
              >
                Next Step
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  console.log('Create listing button clicked');
                  // Validate all steps before submission
                  const allStepsValid = await validateAllSteps();
                  if (allStepsValid) {
                    console.log('Validation passed, calling onSubmit directly');
                    const formData = watch(); // Get current form data
                    await onSubmit(formData as any);
                  } else {
                    console.log('Validation failed');
                  }
                }}
                variant="contained"
                endIcon={<CheckCircle />}
                size="large"
                disabled={isSubmitting}
                sx={{ px: 4 }}
              >
                {isSubmitting 
                  ? (isEditMode ? 'Updating...' : 'Creating...') 
                  : (isEditMode ? 'Update Listing' : 'Create Listing')
                }
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}