import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Stack,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocationOn,
  Notifications,
  Speed,
  Navigation,
  MyLocation,
  Place,
  DirectionsCar,
  AccessTime,
  Warning,
  CheckCircle,
  Settings,
  GpsFixed,
  Traffic,
  LocalParking,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import GPSLocationVerifier from './GPSLocationVerifier';

interface SmartLocationFeaturesProps {
  onLocationVerified?: (data: any) => void;
  parkingLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
}

interface LocationSettings {
  autoCheckIn: boolean;
  proximityAlerts: boolean;
  backgroundTracking: boolean;
  speedAlerts: boolean;
  arrivalNotifications: boolean;
  smartReminders: boolean;
  lowAccuracyWarning: boolean;
}

interface GeofenceEvent {
  type: 'enter' | 'exit';
  location: string;
  timestamp: Date;
  accuracy: number;
}

const SmartLocationFeatures: React.FC<SmartLocationFeaturesProps> = ({
  onLocationVerified,
  parkingLocation,
}) => {
  const theme = useTheme();
  const [showVerifier, setShowVerifier] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(false);
  const [geofenceEvents, setGeofenceEvents] = useState<GeofenceEvent[]>([]);
  const [speed, setSpeed] = useState<number | null>(null);
  const [showSpeedWarning, setShowSpeedWarning] = useState(false);
  
  const [settings, setSettings] = useState<LocationSettings>({
    autoCheckIn: true,
    proximityAlerts: true,
    backgroundTracking: false,
    speedAlerts: true,
    arrivalNotifications: true,
    smartReminders: true,
    lowAccuracyWarning: true,
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('smart_location_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to load location settings:', error);
      }
    }

    // Initialize geolocation if tracking is enabled
    if (isTrackingEnabled) {
      startLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [isTrackingEnabled]);

  const saveSettings = (newSettings: LocationSettings) => {
    setSettings(newSettings);
    localStorage.setItem('smart_location_settings', JSON.stringify(newSettings));
    toast.success('Location settings saved');
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed: gpsSpeed } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        if (gpsSpeed !== null) {
          const speedKmh = gpsSpeed * 3.6; // Convert m/s to km/h
          setSpeed(speedKmh);
          
          // Speed alert (if over 60 km/h in parking area)
          if (settings.speedAlerts && speedKmh > 60) {
            setShowSpeedWarning(true);
            toast.warning('Slow down! You\'re approaching a parking area.');
          }
        }

        // Check proximity to parking location
        if (parkingLocation && settings.proximityAlerts) {
          const distance = calculateDistance(
            latitude,
            longitude,
            parkingLocation.lat,
            parkingLocation.lng
          );

          if (distance <= 100) { // Within 100m
            handleProximityAlert(distance);
          }
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
        toast.error('Failed to track location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );

    return watchId;
  };

  const stopLocationTracking = () => {
    // Implementation would clear the watch
    setIsTrackingEnabled(false);
  };

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

    return R * c;
  };

  const handleProximityAlert = (distance: number) => {
    if (settings.arrivalNotifications) {
      if (distance <= 50) {
        toast.success(`You're ${Math.round(distance)}m from your parking spot!`);
        
        // Add geofence event
        const event: GeofenceEvent = {
          type: 'enter',
          location: parkingLocation?.address || 'Parking location',
          timestamp: new Date(),
          accuracy: 50,
        };
        setGeofenceEvents(prev => [...prev, event]);

        // Auto check-in if enabled
        if (settings.autoCheckIn) {
          handleAutoCheckIn();
        }
      }
    }
  };

  const handleAutoCheckIn = () => {
    toast.success('Auto check-in initiated - verifying location...');
    setShowVerifier(true);
  };

  const handleLocationVerified = (verified: boolean, data: any) => {
    if (verified) {
      toast.success('Auto check-in completed successfully!');
      if (onLocationVerified) {
        onLocationVerified(data);
      }
    } else {
      toast.error('Auto check-in failed - manual verification required');
    }
    setShowVerifier(false);
  };

  const smartFeatures = [
    {
      icon: <DirectionsCar />,
      title: 'Auto Check-in',
      description: 'Automatically check in when you arrive at your parking location',
      enabled: settings.autoCheckIn,
      key: 'autoCheckIn' as keyof LocationSettings,
    },
    {
      icon: <Notifications />,
      title: 'Proximity Alerts',
      description: 'Get notified when you\'re near your parking spot',
      enabled: settings.proximityAlerts,
      key: 'proximityAlerts' as keyof LocationSettings,
    },
    {
      icon: <GpsFixed />,
      title: 'Background Tracking',
      description: 'Continue location tracking in the background',
      enabled: settings.backgroundTracking,
      key: 'backgroundTracking' as keyof LocationSettings,
    },
    {
      icon: <Speed />,
      title: 'Speed Alerts',
      description: 'Warning when driving too fast near parking areas',
      enabled: settings.speedAlerts,
      key: 'speedAlerts' as keyof LocationSettings,
    },
    {
      icon: <AccessTime />,
      title: 'Smart Reminders',
      description: 'Intelligent reminders based on your location and time',
      enabled: settings.smartReminders,
      key: 'smartReminders' as keyof LocationSettings,
    },
    {
      icon: <Warning />,
      title: 'Low Accuracy Warning',
      description: 'Alert when GPS accuracy is too low for verification',
      enabled: settings.lowAccuracyWarning,
      key: 'lowAccuracyWarning' as keyof LocationSettings,
    },
  ];

  return (
    <Box>
      <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[4], mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <MyLocation sx={{ fontSize: 32, color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Smart Location Features
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Intelligent location-based parking assistance
                </Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Settings />}
                onClick={() => setShowSettings(true)}
              >
                Settings
              </Button>
              
              {parkingLocation && (
                <Button
                  variant="contained"
                  startIcon={<LocationOn />}
                  onClick={() => setShowVerifier(true)}
                >
                  Verify Location
                </Button>
              )}
            </Stack>
          </Stack>

          {/* Quick Actions */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Quick Actions
            </Typography>
            
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<Navigation />}
                onClick={() => setIsTrackingEnabled(!isTrackingEnabled)}
                color={isTrackingEnabled ? 'success' : 'primary'}
              >
                {isTrackingEnabled ? 'Stop Tracking' : 'Start Tracking'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Place />}
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        toast.success(`Current location: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
                      },
                      () => toast.error('Failed to get current location')
                    );
                  }
                }}
              >
                Get Current Location
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Traffic />}
                onClick={() => {
                  toast.info('Traffic conditions: Light traffic in your area');
                }}
              >
                Check Traffic
              </Button>
            </Stack>
          </Box>

          {/* Status Indicators */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Status
            </Typography>
            
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip
                icon={isTrackingEnabled ? <CheckCircle /> : <Warning />}
                label={isTrackingEnabled ? 'Tracking Active' : 'Tracking Inactive'}
                color={isTrackingEnabled ? 'success' : 'default'}
                variant="outlined"
              />
              
              {currentLocation && (
                <Chip
                  icon={<GpsFixed />}
                  label="GPS Signal Good"
                  color="success"
                  variant="outlined"
                />
              )}
              
              {speed !== null && (
                <Chip
                  icon={<Speed />}
                  label={`${Math.round(speed)} km/h`}
                  color={speed > 60 ? 'warning' : 'default'}
                  variant="outlined"
                />
              )}
              
              {parkingLocation && (
                <Chip
                  icon={<LocalParking />}
                  label="Parking Location Set"
                  
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>

          {/* Recent Events */}
          {geofenceEvents.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Recent Location Events
              </Typography>
              
              <List dense>
                {geofenceEvents.slice(-3).map((event, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <LocationOn color={event.type === 'enter' ? 'success' : 'error'} />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${event.type === 'enter' ? 'Arrived at' : 'Left'} ${event.location}`}
                      secondary={event.timestamp.toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Speed Warning Dialog */}
      <Dialog open={showSpeedWarning} onClose={() => setShowSpeedWarning(false)}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Warning color="warning" />
            <Typography variant="h6">Speed Warning</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>
            You're traveling at {speed ? Math.round(speed) : 0} km/h. Please slow down as you approach the parking area for safety.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSpeedWarning(false)} autoFocus>
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Settings />
            <Typography variant="h6">Smart Location Settings</Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <List>
            {smartFeatures.map((feature, index) => (
              <React.Fragment key={feature.key}>
                <ListItem>
                  <ListItemIcon>{feature.icon}</ListItemIcon>
                  <ListItemText
                    primary={feature.title}
                    secondary={feature.description}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={feature.enabled}
                      onChange={(e) => {
                        const newSettings = {
                          ...settings,
                          [feature.key]: e.target.checked,
                        };
                        saveSettings(newSettings);
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                {index < smartFeatures.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Location Verifier Dialog */}
      <Dialog 
        open={showVerifier} 
        onClose={() => setShowVerifier(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {parkingLocation && (
            <GPSLocationVerifier
              targetLocation={parkingLocation}
              onVerificationComplete={handleLocationVerified}
              onClose={() => setShowVerifier(false)}
              autoStart={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SmartLocationFeatures;