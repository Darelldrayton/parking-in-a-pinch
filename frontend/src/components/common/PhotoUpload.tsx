import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  Typography,
  Card,
  CardMedia,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PhotoCamera,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

interface Photo {
  id: string;
  url: string;
  file?: File;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 8,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (photos.length + files.length > maxPhotos) {
      setError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newPhotos: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Please select only image files');
        }
        
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Image size must be less than 5MB');
        }

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        newPhotos.push(previewUrl);

        // TODO: Upload to backend/cloud storage
        // const uploadedUrl = await uploadToCloudStorage(file);
        // newPhotos.push(uploadedUrl);
      }

      onPhotosChange([...photos, ...newPhotos]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photos');
    } finally {
      setLoading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0 && fileInputRef.current) {
      fileInputRef.current.files = files;
      handleFileSelect({
        target: { files },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Photos ({photos.length}/{maxPhotos})
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Existing Photos */}
        {photos.map((photo, index) => (
          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
            <Card sx={{ position: 'relative', borderRadius: 2 }}>
              <CardMedia
                component="img"
                height="150"
                image={photo}
                alt={`Photo ${index + 1}`}
                sx={{ objectFit: 'cover' }}
              />
              <IconButton
                onClick={() => handleRemovePhoto(index)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)',
                  },
                }}
                size="small"
                disabled={disabled}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Card>
          </Grid>
        ))}

        {/* Upload Button */}
        {photos.length < maxPhotos && (
          <Grid size={{ xs: 6, sm: 4, md: 3 }}>
            <Paper
              sx={{
                height: 150,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: disabled ? 'default' : 'pointer',
                border: 2,
                borderStyle: 'dashed',
                borderColor: 'primary.main',
                bgcolor: 'primary.50',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': disabled ? {} : {
                  bgcolor: 'primary.100',
                  transform: 'scale(1.02)',
                },
              }}
              onClick={() => !disabled && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {loading ? (
                <CircularProgress size={40} />
              ) : (
                <>
                  <UploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" color="primary.main" fontWeight={500}>
                    Add Photos
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Drag & drop or click
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* Helper Text */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Upload up to {maxPhotos} high-quality photos of your parking space. 
        Supported formats: JPG, PNG, WebP. Max size: 5MB per photo.
      </Typography>
    </Box>
  );
};

export default PhotoUpload;