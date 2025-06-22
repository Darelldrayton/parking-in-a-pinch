import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  useTheme,
  alpha,
  IconButton,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  QrCode,
  QrCodeScanner,
  CheckCircle,
  Schedule,
  LocationOn,
  DirectionsCar,
  Close,
  CameraAlt,
  Refresh,
  Timer,
  ExitToApp,
  Login,
  Info,
} from '@mui/icons-material';

interface BookingInfo {
  id: number;
  parkingSpaceTitle: string;
  address: string;
  startTime: string;
  endTime: string;
  renterName: string;
  vehicleInfo: string;
  status: 'active' | 'checked_in' | 'checked_out' | 'expired';
}

interface QRCheckInSystemProps {
  bookingId?: number;
  onCheckIn?: (bookingId: number, timestamp: Date) => void;
  onCheckOut?: (bookingId: number, timestamp: Date) => void;
  userType: 'host' | 'renter';
}

const QRCheckInSystem: React.FC<QRCheckInSystemProps> = ({
  bookingId,
  onCheckIn,
  onCheckOut,
  userType,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [checkInTime, setCheckInTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mock booking data
  const mockBooking: BookingInfo = {
    id: bookingId || 123,
    parkingSpaceTitle: 'Secure Garage Space in Manhattan',
    address: '123 Main St, Manhattan, NY 10001',
    startTime: '2024-12-20T14:00:00Z',
    endTime: '2024-12-20T18:00:00Z',
    renterName: 'John Smith',
    vehicleInfo: 'Blue Honda Civic (ABC-123)',
    status: 'active',
  };

  useEffect(() => {
    // Load booking information
    setBookingInfo(mockBooking);
    
    // Generate QR code data for the booking
    const qrData = JSON.stringify({
      bookingId: mockBooking.id,
      spaceAddress: mockBooking.address,
      timestamp: new Date().toISOString(),
      action: 'check_in',
    });
    setQrCodeData(qrData);
  }, [bookingId]);

  useEffect(() => {
    // Update time remaining
    const interval = setInterval(() => {
      if (bookingInfo) {
        const now = new Date();
        const endTime = new Date(bookingInfo.endTime);
        const remaining = endTime.getTime() - now.getTime();
        
        if (remaining > 0) {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining(`${hours}h ${minutes}m remaining`);
        } else {
          setTimeRemaining('Expired');
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [bookingInfo]);

  const generateQRCode = () => {
    // In a real implementation, this would call a QR code generation library
    // For now, we'll create a simple SVG representation
    return (
      <Box
        sx={{
          width: 200,
          height: 200,
          border: 2,
          borderColor: 'primary.main',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `repeating-linear-gradient(
            45deg,
            ${theme.palette.primary.main}22,
            ${theme.palette.primary.main}22 10px,
            white 10px,
            white 20px
          )`,
        }}
      >
        <Stack alignItems="center" spacing={1}>
          <QrCode sx={{ fontSize: 64, color: 'primary.main' }} />
          <Typography variant="caption" fontWeight={600}>
            QR Code
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Booking #{bookingInfo?.id}
          </Typography>
        </Stack>
      </Box>
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleScanQR = () => {
    setScannerOpen(true);
    setTimeout(() => startCamera(), 100);
  };

  const handleCloseScanneropen = () => {
    stopCamera();
    setScannerOpen(false);
  };

  const simulateQRScan = () => {
    setLoading(true);
    // Simulate scanning process
    setTimeout(() => {
      handleCheckIn();
      setLoading(false);
      handleCloseScanneropen();
    }, 2000);
  };

  const handleCheckIn = () => {
    const now = new Date();
    setCheckInTime(now);
    if (bookingInfo) {
      setBookingInfo({
        ...bookingInfo,
        status: 'checked_in',
      });
    }
    if (onCheckIn && bookingInfo) {
      onCheckIn(bookingInfo.id, now);
    }
  };

  const handleCheckOut = () => {
    const now = new Date();
    if (bookingInfo) {
      setBookingInfo({
        ...bookingInfo,
        status: 'checked_out',
      });
    }
    if (onCheckOut && bookingInfo) {
      onCheckOut(bookingInfo.id, now);
    }
  };

  const handleManualEntry = () => {
    if (manualCode.trim()) {
      // Validate manual code
      if (manualCode === bookingInfo?.id.toString()) {
        handleCheckIn();
      } else {
        // Show error
        console.error('Invalid booking code');
      }
    }
  };

  const renderHostView = () => (
    <Stack spacing={3}>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Booking Information
        </Typography>
        {bookingInfo && (
          <Stack spacing={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Booking ID
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                #{bookingInfo.id}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Renter
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {bookingInfo.renterName}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Vehicle
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {bookingInfo.vehicleInfo}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Time Slot
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {new Date(bookingInfo.startTime).toLocaleTimeString()} - {new Date(bookingInfo.endTime).toLocaleTimeString()}
              </Typography>
            </Box>
            
            <Chip
              label={bookingInfo.status.replace('_', ' ').toUpperCase()}
              color={
                bookingInfo.status === 'checked_in' ? 'success' :
                bookingInfo.status === 'checked_out' ? 'info' :
                bookingInfo.status === 'expired' ? 'error' : 'warning'
              }
              sx={{ alignSelf: 'flex-start' }}
            />
          </Stack>
        )}
      </Paper>

      {/* QR Code for Renter to Scan */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Check-In QR Code
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Show this QR code to the renter for check-in
        </Typography>
        
        <Stack alignItems="center" spacing={2}>
          {generateQRCode()}
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              // Regenerate QR code
              const newQrData = JSON.stringify({
                bookingId: bookingInfo?.id,
                spaceAddress: bookingInfo?.address,
                timestamp: new Date().toISOString(),
                action: 'check_in',
              });
              setQrCodeData(newQrData);
            }}
          >
            Refresh Code
          </Button>
        </Stack>
      </Paper>

      {/* Manual Check-in/out Controls */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Manual Override
        </Typography>
        <Stack direction="row" spacing={2}>
          {bookingInfo?.status === 'active' && (
            <Button
              variant="contained"
              startIcon={<Login />}
              onClick={handleCheckIn}
              color="success"
            >
              Manual Check-In
            </Button>
          )}
          
          {bookingInfo?.status === 'checked_in' && (
            <Button
              variant="contained"
              startIcon={<ExitToApp />}
              onClick={handleCheckOut}
              color="info"
            >
              Manual Check-Out
            </Button>
          )}
        </Stack>
      </Paper>
    </Stack>
  );

  const renderRenterView = () => (
    <Stack spacing={3}>
      {/* Booking Status */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {bookingInfo?.parkingSpaceTitle}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
              <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {bookingInfo?.address}
              </Typography>
            </Stack>
          </Box>
          
          <Stack alignItems="center" spacing={1}>
            <Timer sx={{ fontSize: 24, color: 'primary.main' }} />
            <Typography variant="caption" fontWeight={600}>
              {timeRemaining}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* Check-in Status */}
      {checkInTime && (
        <Alert severity="success" icon={<CheckCircle />}>
          Checked in at {checkInTime.toLocaleTimeString()}
        </Alert>
      )}

      {/* QR Scanner Tab */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab icon={<QrCodeScanner />} label="Scan QR Code" />
          <Tab icon={<Info />} label="Manual Entry" />
        </Tabs>
      </Box>

      {/* Scanner Tab Content */}
      {activeTab === 0 && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
          <Stack alignItems="center" spacing={3}>
            <QrCodeScanner sx={{ fontSize: 64, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              Scan Check-In QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Point your camera at the QR code provided by the host
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<CameraAlt />}
              onClick={handleScanQR}
              disabled={bookingInfo?.status !== 'active'}
            >
              {bookingInfo?.status === 'checked_in' ? 'Already Checked In' : 'Start Scanner'}
            </Button>

            {bookingInfo?.status === 'checked_in' && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<ExitToApp />}
                onClick={handleCheckOut}
                color="info"
              >
                Check Out
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      {/* Manual Entry Tab Content */}
      {activeTab === 1 && (
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Manual Check-In
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the booking code provided by the host
          </Typography>
          
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Booking Code"
              placeholder="Enter booking ID"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              disabled={bookingInfo?.status !== 'active'}
            />
            
            <Button
              variant="contained"
              onClick={handleManualEntry}
              disabled={!manualCode.trim() || bookingInfo?.status !== 'active'}
            >
              Check In Manually
            </Button>
          </Stack>
        </Paper>
      )}
    </Stack>
  );

  return (
    <Box>
      <Card sx={{ borderRadius: 3, maxWidth: 600, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <QrCode sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" fontWeight={700}>
                QR Check-In System
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userType === 'host' ? 'Manage renter check-ins' : 'Check in to your parking space'}
              </Typography>
            </Box>
          </Stack>

          {userType === 'host' ? renderHostView() : renderRenterView()}
        </CardContent>
      </Card>

      {/* QR Scanner Dialog */}
      <Dialog 
        open={scannerOpen} 
        onClose={handleCloseScanneropen}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Scan QR Code</Typography>
            <IconButton onClick={handleCloseScanneropen}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Stack alignItems="center" spacing={2}>
            <Box
              sx={{
                width: '100%',
                maxWidth: 400,
                height: 300,
                border: 2,
                borderColor: 'primary.main',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              
              {/* Scanner overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 200,
                  height: 200,
                  border: 2,
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    right: -2,
                    bottom: -2,
                    border: '2px solid transparent',
                    borderTopColor: theme.palette.primary.main,
                    borderRadius: 2,
                    animation: 'spin 2s linear infinite',
                  },
                }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Position the QR code within the frame above
            </Typography>
            
            {loading && (
              <Stack alignItems="center" spacing={1}>
                <CircularProgress />
                <Typography variant="body2">Processing...</Typography>
              </Stack>
            )}
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseScanneropen}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={simulateQRScan}
            disabled={loading}
          >
            Simulate Scan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRCheckInSystem;