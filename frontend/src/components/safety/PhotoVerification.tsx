import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Grid,
  Paper,
} from '@mui/material';
import {
  PhotoCamera,
  CameraAlt,
  FlipCameraAndroid,
  Close,
  Check,
  Warning,
  Visibility,
  Download,
  Compare,
  AccessTime,
  LocationOn,
  DirectionsCar,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

interface PhotoVerificationProps {
  bookingId: number;
  stage: 'check-in' | 'check-out';
  onPhotosUploaded: (photos: VerificationPhoto[]) => void;
  onComplete: () => void;
  required?: boolean;
}

interface VerificationPhoto {
  id: string;
  type: 'arrival' | 'departure' | 'vehicle' | 'space' | 'damage';
  file: File;
  url: string;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
  };
  metadata: {
    size: number;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

interface PhotoRequirement {
  type: 'arrival' | 'departure' | 'vehicle' | 'space' | 'damage';
  label: string;
  description: string;
  required: boolean;
  icon: React.ReactNode;
  tips: string[];
}

const PhotoVerification: React.FC<PhotoVerificationProps> = ({
  bookingId,
  stage,
  onPhotosUploaded,
  onComplete,
  required = true,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [photos, setPhotos] = useState<VerificationPhoto[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [currentRequirement, setCurrentRequirement] = useState<PhotoRequirement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [uploading, setUploading] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<VerificationPhoto | null>(null);

  const requirements: PhotoRequirement[] = stage === 'check-in' ? [
    {
      type: 'arrival',
      label: 'Arrival Photo',
      description: 'Overall view of the parking space upon arrival',
      required: true,
      icon: <LocationOn />,
      tips: [
        'Show the entire parking space',
        'Include surrounding area for context',
        'Ensure good lighting',
        'Take from a distance to show the full space',
      ],
    },
    {
      type: 'vehicle',
      label: 'Vehicle Photo',
      description: 'Clear photo of your vehicle in the space',
      required: true,
      icon: <DirectionsCar />,
      tips: [
        'Show your license plate clearly',
        'Include the vehicle model and color',
        'Take from the front or rear',
        'Ensure vehicle is properly parked',
      ],
    },
    {
      type: 'space',
      label: 'Space Condition',
      description: 'Document the condition of the parking space',
      required: false,
      icon: <PhotoCamera />,
      tips: [
        'Note any existing damage or issues',
        'Show parking markers or boundaries',
        'Document any debris or obstacles',
        'Include nearby fixtures (meters, signs)',
      ],
    },
  ] : [
    {
      type: 'departure',
      label: 'Departure Photo',
      description: 'Overall view of the parking space after departure',
      required: true,
      icon: <LocationOn />,
      tips: [
        'Show the space is clean and empty',
        'Capture the same angle as arrival photo',
        'Ensure no damage is visible',
        'Show any items left behind',
      ],
    },
    {
      type: 'vehicle',
      label: 'Vehicle Before Leaving',
      description: 'Final photo of your vehicle before departure',
      required: false,
      icon: <DirectionsCar />,
      tips: [
        'Show vehicle is undamaged',
        'Document any new scratches or dents',
        'Take from multiple angles if needed',
        'Include license plate for verification',
      ],
    },
    {
      type: 'damage',
      label: 'Damage Report',
      description: 'Document any damage to vehicle or property',
      required: false,
      icon: <Warning />,
      tips: [
        'Only required if damage occurred',
        'Take close-up photos of any damage',
        'Show damage in context',
        'Include multiple angles',
      ],
    },
  ];

  const openCamera = useCallback(async (requirement: PhotoRequirement) => {
    setCurrentRequirement(requirement);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      
      setStream(mediaStream);
      setCameraOpen(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  }, [facingMode]);

  const closeCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
    setCurrentRequirement(null);
  }, [stream]);

  const switchCamera = useCallback(async () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (stream) {
      closeCamera();
      setTimeout(() => {
        if (currentRequirement) {
          openCamera(currentRequirement);
        }
      }, 100);
    }
  }, [facingMode, stream, closeCamera, openCamera, currentRequirement]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !currentRequirement) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], `${currentRequirement.type}-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      const url = URL.createObjectURL(file);

      // Get current location
      let location: { lat: number; lng: number } | undefined;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      } catch (error) {
        console.warn('Could not get location:', error);
      }

      const newPhoto: VerificationPhoto = {
        id: `photo-${Date.now()}`,
        type: currentRequirement.type,
        file,
        url,
        timestamp: new Date(),
        location,
        metadata: {
          size: file.size,
          dimensions: {
            width: canvas.width,
            height: canvas.height,
          },
        },
      };

      setPhotos(prev => [...prev, newPhoto]);
      closeCamera();
      toast.success(`${currentRequirement.label} captured successfully!`);
    }, 'image/jpeg', 0.9);
  }, [currentRequirement, closeCamera]);

  const handleFileInput = useCallback((requirement: PhotoRequirement) => {
    setCurrentRequirement(requirement);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentRequirement) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Image size must be less than 10MB');
      return;
    }

    const url = URL.createObjectURL(file);

    const newPhoto: VerificationPhoto = {
      id: `photo-${Date.now()}`,
      type: currentRequirement.type,
      file,
      url,
      timestamp: new Date(),
      metadata: {
        size: file.size,
      },
    };

    setPhotos(prev => [...prev, newPhoto]);
    setCurrentRequirement(null);
    toast.success(`${currentRequirement.label} added successfully!`);
  }, [currentRequirement]);

  const removePhoto = useCallback((photoId: string) => {
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== photoId);
      const photoToRemove = prev.find(p => p.id === photoId);
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.url);
      }
      return updated;
    });
  }, []);

  const uploadPhotos = useCallback(async () => {
    if (photos.length === 0) {
      toast.error('Please take at least one photo');
      return;
    }

    const requiredPhotos = requirements.filter(req => req.required);
    const missingRequired = requiredPhotos.filter(req => 
      !photos.some(photo => photo.type === req.type)
    );

    if (missingRequired.length > 0) {
      toast.error(`Missing required photos: ${missingRequired.map(req => req.label).join(', ')}`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('booking_id', bookingId.toString());
      formData.append('stage', stage);

      photos.forEach((photo, index) => {
        formData.append(`photos[${index}]`, photo.file);
        formData.append(`types[${index}]`, photo.type);
        formData.append(`timestamps[${index}]`, photo.timestamp.toISOString());
        if (photo.location) {
          formData.append(`locations[${index}]`, JSON.stringify(photo.location));
        }
      });

      const response = await fetch('/api/v1/photo-verification/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        onPhotosUploaded(result.photos);
        onComplete();
        toast.success('Photos uploaded successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to upload photos');
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  }, [photos, requirements, bookingId, stage, onPhotosUploaded, onComplete]);

  const getCompletionStatus = () => {
    const requiredPhotos = requirements.filter(req => req.required);
    const completedRequired = requiredPhotos.filter(req => 
      photos.some(photo => photo.type === req.type)
    );
    
    return {
      completed: completedRequired.length,
      total: requiredPhotos.length,
      percentage: (completedRequired.length / requiredPhotos.length) * 100,
    };
  };

  const status = getCompletionStatus();

  return (
    <Box>
      {/* Header */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              {stage === 'check-in' ? 'Check-in' : 'Check-out'} Photo Verification
            </Typography>
            <Chip
              label={`${status.completed}/${status.total} Required`}
              color={status.completed === status.total ? 'success' : 'warning'}
              variant="outlined"
            />
          </Stack>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Document your parking experience for safety and accountability
          </Typography>
          
          <LinearProgress 
            variant="determinate" 
            value={status.percentage} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </CardContent>
      </Card>

      {/* Photo Requirements */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {requirements.map((requirement) => {
          const hasPhoto = photos.some(photo => photo.type === requirement.type);
          
          return (
            <Grid key={requirement.type} item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  borderRadius: 3,
                  border: hasPhoto ? `2px solid ${theme.palette.success.main}` : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    {requirement.icon}
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {requirement.label}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {requirement.required && (
                          <Chip label="Required" size="small" color="error" />
                        )}
                        {hasPhoto && (
                          <Chip label="Complete" size="small" color="success" />
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {requirement.description}
                  </Typography>
                  
                  <Stack spacing={1}>
                    <Button
                      variant="contained"
                      startIcon={<CameraAlt />}
                      onClick={() => openCamera(requirement)}
                      fullWidth
                      disabled={uploading}
                    >
                      Take Photo
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<PhotoCamera />}
                      onClick={() => handleFileInput(requirement)}
                      fullWidth
                      disabled={uploading}
                    >
                      Upload Photo
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Captured Photos */}
      {photos.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Captured Photos ({photos.length})
            </Typography>
            
            <Grid container spacing={2}>
              {photos.map((photo) => (
                <Grid key={photo.id} item xs={6} sm={4} md={3}>
                  <Paper
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      aspectRatio: '1',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPreviewPhoto(photo)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.type}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 1,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPhoto(photo);
                        }}
                        sx={{
                          bgcolor: alpha(theme.palette.common.white, 0.9),
                          '&:hover': {
                            bgcolor: theme.palette.common.white,
                          },
                        }}
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePhoto(photo.id);
                        }}
                        sx={{
                          bgcolor: alpha(theme.palette.error.main, 0.9),
                          color: 'white',
                          '&:hover': {
                            bgcolor: theme.palette.error.main,
                          },
                        }}
                      >
                        <Close />
                      </IconButton>
                    </Box>
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        bgcolor: alpha(theme.palette.common.black, 0.7),
                        color: 'white',
                        p: 1,
                      }}
                    >
                      <Typography variant="caption" fontWeight={500}>
                        {requirements.find(req => req.type === photo.type)?.label}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', opacity: 0.8 }}>
                        {photo.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          onClick={uploadPhotos}
          disabled={photos.length === 0 || uploading || status.completed < status.total}
          startIcon={uploading ? null : <Check />}
          fullWidth
        >
          {uploading ? 'Uploading...' : `Complete ${stage === 'check-in' ? 'Check-in' : 'Check-out'}`}
        </Button>
        {!required && (
          <Button
            variant="outlined"
            onClick={onComplete}
            disabled={uploading}
            sx={{ minWidth: 120 }}
          >
            Skip
          </Button>
        )}
      </Stack>

      {uploading && <LinearProgress sx={{ mt: 2 }} />}

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onClose={closeCamera} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {currentRequirement?.label}
            </Typography>
            <IconButton onClick={closeCamera}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {currentRequirement && (
            <Box>
              <Alert severity="info" sx={{ m: 2 }}>
                <Typography variant="body2" fontWeight={500} gutterBottom>
                  Tips for a good photo:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {currentRequirement.tips.map((tip, index) => (
                    <li key={index}>
                      <Typography variant="body2">{tip}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
              
              <Box sx={{ position: 'relative', bgcolor: 'black' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '60vh',
                  }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={switchCamera} color="primary">
              <FlipCameraAndroid />
            </IconButton>
            <Button
              variant="contained"
              onClick={capturePhoto}
              size="large"
              sx={{ borderRadius: '50%', minWidth: 64, height: 64 }}
            >
              <PhotoCamera />
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Photo Preview Dialog */}
      <Dialog 
        open={!!previewPhoto} 
        onClose={() => setPreviewPhoto(null)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {requirements.find(req => req.type === previewPhoto?.type)?.label}
            </Typography>
            <IconButton onClick={() => setPreviewPhoto(null)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {previewPhoto && (
            <img
              src={previewPhoto.url}
              alt={previewPhoto.type}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          )}
        </DialogContent>
        
        <DialogActions>
          <Button
            startIcon={<Download />}
            onClick={() => {
              if (previewPhoto) {
                const link = document.createElement('a');
                link.href = previewPhoto.url;
                link.download = `${previewPhoto.type}-${previewPhoto.timestamp.getTime()}.jpg`;
                link.click();
              }
            }}
          >
            Download
          </Button>
          <Button
            color="error"
            onClick={() => {
              if (previewPhoto) {
                removePhoto(previewPhoto.id);
                setPreviewPhoto(null);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default PhotoVerification;