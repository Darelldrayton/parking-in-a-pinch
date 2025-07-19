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
  Stack,
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
  // Cache bust: v2.0 - 2025-01-18-16:00
  console.log('🆕 NEW AdminLogin component v2.0 loaded');
  
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if already logged in
  React.useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    const user = localStorage.getItem('admin_user');
    
    if (token && user) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    try {
      const response = await api.post('/auth/login/', data);
      
      // Check if user is admin
      const user = response.data.user;
      if (!user.is_staff && !user.is_superuser) {
        toast.error('Access denied. Admin privileges required.');
        return;
      }
      
      // CRITICAL: Clear any regular user auth data to prevent conflicts
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Store JWT tokens for admin use only
      const accessToken = response.data.access;
      const refreshToken = response.data.refresh;
      
      console.log('🔐 AdminLogin: Storing admin credentials...');
      console.log('🔐 AdminLogin: Access token exists:', !!accessToken);
      console.log('🔐 AdminLogin: User data:', user);
      
      localStorage.setItem('admin_access_token', accessToken);
      localStorage.setItem('admin_refresh_token', refreshToken);
      localStorage.setItem('admin_user', JSON.stringify(user));
      
      // Verify storage worked
      console.log('🔐 AdminLogin: Verification after storage:');
      console.log('🔐 Stored admin token:', !!localStorage.getItem('admin_access_token'));
      console.log('🔐 Stored admin user:', !!localStorage.getItem('admin_user'));
      
      // Set flag for AdminProtectedRoute to handle authentication properly
      sessionStorage.setItem('just_logged_in', 'true');
      
      toast.success('Welcome to the admin panel!');
      
      console.log('🔐 AdminLogin: Navigating to /admin/dashboard...');
      navigate('/admin/dashboard', { replace: true });
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.response?.data?.non_field_errors?.[0] ||
                          'Invalid credentials. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Card elevation={24} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3} alignItems="center">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <AdminPanelSettings sx={{ fontSize: 40 }} />
              </Box>
              
              <Typography variant="h4" component="h1" fontWeight="bold" align="center">
                Admin Login
              </Typography>
              
              <Typography variant="body1" color="text.secondary" align="center">
                Access the admin dashboard
              </Typography>
            </Stack>

            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 4 }}>
              <TextField
                {...register('email')}
                margin="normal"
                fullWidth
                label="Email Address"
                autoComplete="email"
                autoFocus
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                {...register('password')}
                margin="normal"
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
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
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 3, mb: 2, py: 1.5 }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Sign In'
                )}
              </Button>

              <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Typography variant="body2" color="primary">
                    ← Back to regular login
                  </Typography>
                </Link>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}