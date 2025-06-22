import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Stack,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  CircularProgress,
} from '@mui/material';
import {
  LocationOn,
  MyLocation,
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Close,
  GpsFixed,
  GpsNotFixed,
  Place,
  Navigation,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface GPSLocationVerifierProps {
  targetLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  accuracyThreshold?: number; // in meters
  onVerificationComplete: (verified: boolean, data: LocationVerificationData) => void;
  onClose?: () => void;
  autoStart?: boolean;
  showMap?: boolean;
}

interface LocationVerificationData {
  userLocation: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  targetLocation: {
    lat: number;
    lng: number;
  };
  distance: number;
  verified: boolean;
  timestamp: Date;
  attempts: number;
}

interface GeolocationData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

const GPSLocationVerifier: React.FC<GPSLocationVerifierProps> = ({
  targetLocation,
  accuracyThreshold = 50, // 50 meters default
  onVerificationComplete,
  onClose,
  autoStart = false,
  showMap = true,
}) => {
  const theme = useTheme();
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<GeolocationData | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'locating' | 'verified' | 'failed' | 'denied'>('idle');
  const [distance, setDistance] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoStart) {
      handleStartVerification();
    }
    
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [autoStart]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const handleStartVerification = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      setVerificationStatus('failed');
      setError('Geolocation not supported');
      return;
    }

    setIsLocating(true);
    setVerificationStatus('locating');
    setError(null);
    setAttempts(prev => prev + 1);

    const options = {
      enableHighAccuracy: true,
      timeout: 30000, // 30 seconds
      maximumAge: 0, // Don't use cached position
    };

    // Start watching position for continuous updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    );

    // Set timeout for verification process
    timeoutRef.current = setTimeout(() => {
      if (verificationStatus === 'locating') {
        handleLocationError({
          code: 3,
          message: 'Location verification timeout',
        } as GeolocationPositionError);
      }
    }, 45000); // 45 seconds total timeout
  };

  const handleLocationSuccess = (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy: positionAccuracy } = position.coords;
    
    const newLocation: GeolocationData = {
      lat: latitude,
      lng: longitude,
      accuracy: positionAccuracy,
      timestamp: Date.now(),
    };

    setUserLocation(newLocation);
    setAccuracy(positionAccuracy);

    // Calculate distance to target
    const calculatedDistance = calculateDistance(
      latitude,
      longitude,
      targetLocation.lat,
      targetLocation.lng
    );

    setDistance(calculatedDistance);

    // Check if verification is successful
    const isVerified = calculatedDistance <= accuracyThreshold && positionAccuracy <= 100;

    if (isVerified) {
      setVerificationStatus('verified');
      setIsLocating(false);
      
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const verificationData: LocationVerificationData = {
        userLocation: {
          lat: latitude,
          lng: longitude,
          accuracy: positionAccuracy,
        },
        targetLocation,
        distance: calculatedDistance,
        verified: true,
        timestamp: new Date(),
        attempts,
      };

      toast.success('Location verified successfully!');
      onVerificationComplete(true, verificationData);
    } else if (positionAccuracy > 100) {
      setError(`GPS accuracy too low (${Math.round(positionAccuracy)}m). Move to an area with better GPS signal.`);
    } else {
      setError(`You are ${Math.round(calculatedDistance)}m away from the parking location. You need to be within ${accuracyThreshold}m.`);
    }
  };

  const handleLocationError = (error: GeolocationPositionError) => {
    setIsLocating(false);
    let errorMessage = '';

    switch (error.code) {
      case 1: // PERMISSION_DENIED
        errorMessage = 'Location access denied. Please enable location permissions and try again.';
        setVerificationStatus('denied');
        break;
      case 2: // POSITION_UNAVAILABLE
        errorMessage = 'Location information is unavailable. Please check your GPS settings.';
        setVerificationStatus('failed');
        break;
      case 3: // TIMEOUT
        errorMessage = 'Location request timed out. Please try again.';
        setVerificationStatus('failed');
        break;
      default:
        errorMessage = 'An unknown error occurred while retrieving location.';
        setVerificationStatus('failed');
        break;
    }

    setError(errorMessage);
    toast.error(errorMessage);

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const verificationData: LocationVerificationData = {
      userLocation: userLocation || { lat: 0, lng: 0, accuracy: 0 },
      targetLocation,
      distance: distance || 0,
      verified: false,
      timestamp: new Date(),
      attempts,
    };

    onVerificationComplete(false, verificationData);
  };

  const handleRetry = () => {
    setVerificationStatus('idle');
    setError(null);
    setUserLocation(null);
    setDistance(null);
    setAccuracy(null);
    handleStartVerification();
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'success';
      case 'failed':
      case 'denied':
        return 'error';
      case 'locating':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'verified':
        return <CheckCircle />;
      case 'failed':
      case 'denied':
        return <Error />;
      case 'locating':
        return <GpsNotFixed />;
      default:
        return <GpsFixed />;
    }
  };

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'Location Verified';
      case 'failed':
        return 'Verification Failed';
      case 'denied':
        return 'Permission Denied';
      case 'locating':
        return 'Locating...';
      default:
        return 'Ready to Verify';
    }
  };

  return (
    <Box>
      <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[4] }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <LocationOn sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  GPS Location Verification
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verify you're at the parking location
                </Typography>
              </Box>
            </Stack>
            
            {onClose && (
              <IconButton onClick={onClose} size="small">
                <Close />
              </IconButton>
            )}
          </Stack>

          {/* Target Location */}
          <Box sx={{ mb: 3, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Place color="primary" />
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  Target Location
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {targetLocation.address}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Status */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Chip
                icon={getStatusIcon()}
                label={getStatusText()}
                color={getStatusColor() as any}
                variant="outlined"
                size="medium"
              />
              
              {verificationStatus !== 'locating' && verificationStatus !== 'verified' && (
                <Button
                  variant="contained"
                  startIcon={<MyLocation />}
                  onClick={handleStartVerification}
                  disabled={isLocating}
                >
                  Start Verification
                </Button>
              )}
              
              {verificationStatus === 'locating' && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (watchIdRef.current) {
                      navigator.geolocation.clearWatch(watchIdRef.current);
                    }
                    setIsLocating(false);
                    setVerificationStatus('idle');
                  }}
                >
                  Cancel
                </Button>
              )}
            </Stack>

            {isLocating && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Acquiring GPS location... This may take a few moments.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Location Details */}
          {(userLocation || error) && (
            <Box sx={{ mb: 3 }}>
              {error && (
                <Alert 
                  severity={verificationStatus === 'denied' ? 'warning' : 'error'} 
                  sx={{ mb: 2 }}
                  action={
                    verificationStatus !== 'verified' && (
                      <Button
                        color="inherit"
                        size="small"
                        startIcon={<Refresh />}
                        onClick={handleRetry}
                      >
                        Retry
                      </Button>
                    )
                  }
                >
                  {error}
                </Alert>
              )}
              
              {userLocation && (
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Location Details
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setShowDetails(true)}
                      variant="outlined"
                    >
                      View Details
                    </Button>
                  </Box>
                  
                  <Stack direction="row" spacing={3}>
                    {distance !== null && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Distance
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {Math.round(distance)}m
                        </Typography>
                      </Box>
                    )}
                    
                    {accuracy !== null && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          GPS Accuracy
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          ±{Math.round(accuracy)}m
                        </Typography>
                      </Box>
                    )}
                    
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Required Range
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {accuracyThreshold}m
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              )}
            </Box>
          )}

          {/* Success Message */}
          {verificationStatus === 'verified' && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Location verified! You are at the correct parking location.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Navigation />
            <Typography variant="h6">Location Details</Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Your Location
              </Typography>
              {userLocation && (
                <Stack spacing={1}>
                  <Typography variant="body2">
                    Latitude: {userLocation.lat.toFixed(6)}
                  </Typography>
                  <Typography variant="body2">
                    Longitude: {userLocation.lng.toFixed(6)}
                  </Typography>
                  <Typography variant="body2">
                    Accuracy: ±{Math.round(userLocation.accuracy)}m
                  </Typography>
                  <Typography variant="body2">
                    Timestamp: {new Date(userLocation.timestamp).toLocaleString()}
                  </Typography>
                </Stack>
              )}
            </Box>
            
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Target Location
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  Latitude: {targetLocation.lat.toFixed(6)}
                </Typography>
                <Typography variant="body2">
                  Longitude: {targetLocation.lng.toFixed(6)}
                </Typography>
                <Typography variant="body2">
                  Address: {targetLocation.address}
                </Typography>
              </Stack>
            </Box>
            
            {distance !== null && (
              <Box>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Verification Results
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    Distance: {Math.round(distance)}m
                  </Typography>
                  <Typography variant="body2">
                    Required Range: Within {accuracyThreshold}m
                  </Typography>
                  <Typography variant="body2">
                    Status: {verificationStatus === 'verified' ? 'Verified' : 'Not Verified'}
                  </Typography>
                  <Typography variant="body2">
                    Attempts: {attempts}
                  </Typography>
                </Stack>
              </Box>
            )}
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GPSLocationVerifier;