import React from 'react';
import {
  Box,
  Container,
  Typography,
  useTheme,
  alpha,
  IconButton,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  Repeat,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RecurringBookingsComponent from '../components/subscriptions/RecurringBookings';

export default function RecurringBookings() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  const userType = user?.user_type === 'host' ? 'host' : 'renter';

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
      py: 4,
    }}>
      {/* Header */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
        color: 'white',
        py: 6,
        mb: 4,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <IconButton 
              onClick={() => navigate('/dashboard')} 
              sx={{ color: 'white', bgcolor: alpha(theme.palette.common.white, 0.1) }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h3" component="h1" fontWeight={700}>
              Recurring Bookings
            </Typography>
          </Stack>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
            Set up automatic parking reservations for your regular parking needs
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <RecurringBookingsComponent
          userType={userType}
          onBookingCreate={(booking) => {
            console.log('New recurring booking created:', booking);
          }}
          onBookingUpdate={(id, updates) => {
            console.log('Recurring booking updated:', id, updates);
          }}
          onBookingCancel={(id) => {
            console.log('Recurring booking cancelled:', id);
          }}
        />
      </Container>
    </Box>
  );
}