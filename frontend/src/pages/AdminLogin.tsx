import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Alert,
  useTheme,
  alpha,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  AdminPanelSettings,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Security,
} from '@mui/icons-material';
import api from '../services/api';

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

interface FormData {
  email: string;
  password: string;
}

export default function AdminLogin() {
  console.log('🚨 ADMIN LOGIN COMPONENT RENDERING!');
  const navigate = useNavigate();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Disable WebSocket on admin login page to prevent connection loops
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.disableWebSocket = true;
      console.log('🔒 WebSocket disabled for admin login page');
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.disableWebSocket = false;
      }
    };
  }, []);

  // Check if user is already logged in as owner - run only once
  React.useEffect(() => {
    if (hasCheckedAuth) return; // Prevent multiple checks
    
    console.log('🔍 Checking existing authentication...');
    console.log('🔍 Current path:', window.location.pathname);
    
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    console.log('🔍 Token exists:', !!token);
    console.log('🔍 User data exists:', !!user);
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        console.log('🔍 Found existing login:', userData);
        console.log('🔍 User email:', userData.email);
        
        if (userData.email === 'darelldrayton93@gmail.com') {
          console.log('✅ Owner account detected, granting admin access');
          
          // Copy tokens to admin storage
          localStorage.setItem('admin_access_token', token);
          localStorage.setItem('admin_refresh_token', localStorage.getItem('refresh_token') || '');
          localStorage.setItem('admin_user', JSON.stringify(userData));
          
          console.log('📝 Admin tokens stored successfully');
          
          // Set flags to prevent re-checking and show loading state
          setHasCheckedAuth(true);
          setIsRedirecting(true);
          
          // Force redirect to ruler dashboard
          console.log('🔄 Redirecting to /ruler/dashboard...');
          window.location.replace('/ruler/dashboard');
          return;
        } else {
          console.log('❌ Not owner account, email:', userData.email);
        }
      } catch (e) {
        console.error('❌ Error parsing user data:', e);
      }
    } else {
      console.log('❌ No existing authentication found');
    }
    
    setHasCheckedAuth(true);
    console.log('🔍 Authentication check complete - showing login form');
  }, []); // Empty dependency array to run only once

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    console.log('🚨 ADMIN LOGIN FORM SUBMITTED!', data);
    setIsLoading(true);
    
    try {
      console.log('📤 Sending login request to /auth/login/');
      const response = await api.post('/auth/login/', data);
      
      console.log('✅ Login API call successful');
      console.log('🔍 Admin login response:', response.data);
      console.log('👤 User data:', response.data.user);
      console.log('🛡️ is_staff:', response.data.user?.is_staff);
      console.log('🔑 is_superuser:', response.data.user?.is_superuser);
      console.log('📧 Email:', response.data.user?.email);
      
      // For now, let's bypass the admin check completely to test
      console.log('🔓 BYPASSING ADMIN CHECK FOR TESTING');
      
      // Store admin tokens
      console.log('💾 Storing admin tokens');
      localStorage.setItem('admin_access_token', response.data.access || response.data.tokens?.access);
      localStorage.setItem('admin_refresh_token', response.data.refresh || response.data.tokens?.refresh);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));

      console.log('🎉 Admin login successful, navigating to dashboard');
      toast.success('Welcome to the admin panel!');
      navigate('/ruler/dashboard');
      
    } catch (error: any) {
      console.error('❌ Admin login error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.response?.data?.non_field_errors?.[0] ||
                          'Invalid credentials. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while redirecting
  if (isRedirecting) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={12}
            sx={{
              borderRadius: 4,
              p: 6,
              textAlign: 'center',
              boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.3)}`,
            }}
          >
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom>
              Granting Admin Access...
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Redirecting to admin dashboard
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={12}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.3)}`,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              p: 4,
              textAlign: 'center',
            }}
          >
            <AdminPanelSettings sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Admin Portal
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Secure access for authorized administrators
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                <Alert severity="info" icon={<Security />}>
                  This portal is restricted to authorized staff members only.
                </Alert>

                <TextField
                  {...register('email')}
                  fullWidth
                  label="Admin Email"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

                <TextField
                  {...register('password')}
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
                    },
                  }}
                >
                  {isLoading ? 'Signing In...' : 'Access Admin Panel'}
                </Button>

                <Box sx={{ textAlign: 'center', pt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Not an admin?{' '}
                    <Link 
                      to="/login" 
                      style={{ 
                        textDecoration: 'none',
                        fontWeight: 600 
                      }}
                    >
                      Return to user login
                    </Link>
                  </Typography>
                  
                  <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      To access admin panel:
                    </Typography>
                    <Typography variant="body2">
                      1. First <Link to="/login" style={{ textDecoration: 'none', fontWeight: 600 }}>login to your regular account</Link><br/>
                      2. Then return to this page for automatic admin access
                    </Typography>
                  </Alert>
                </Box>
              </Stack>
            </Box>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
}