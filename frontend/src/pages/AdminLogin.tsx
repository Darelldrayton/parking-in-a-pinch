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
      const response = await api.post('/auth/login/', data);
      
      console.log('🔍 Admin login response:', response.data);
      console.log('👤 User data:', response.data.user);
      console.log('🛡️ is_staff:', response.data.user?.is_staff);
      console.log('🔑 is_superuser:', response.data.user?.is_superuser);
      
      // Check if user is admin/staff or is the specific owner account
      const isOwnerAccount = response.data.user?.email === 'darelldrayton93@gmail.com';
      const isAdmin = response.data.user?.is_staff || response.data.user?.is_superuser;
      
      console.log('🔒 Admin access check:', { isOwnerAccount, isAdmin });
      
      if (!isAdmin && !isOwnerAccount) {
        toast.error(`Access denied. Admin privileges required. is_staff: ${response.data.user?.is_staff}, is_superuser: ${response.data.user?.is_superuser}`);
        return;
      }

      // Store admin tokens
      localStorage.setItem('admin_access_token', response.data.access || response.data.tokens?.access);
      localStorage.setItem('admin_refresh_token', response.data.refresh || response.data.tokens?.refresh);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));

      toast.success('Welcome to the admin panel!');
      navigate('/ruler/dashboard');
    } catch (error: any) {
      console.error('Admin login error:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
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
                  <Typography variant="body2" color="text.secondary">
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
                </Box>
              </Stack>
            </Box>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
}