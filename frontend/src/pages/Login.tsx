import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  Checkbox,
  FormControlLabel,
  Grid,
  useTheme,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  LocalParking,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from 'notistack';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  rememberMe: yup.boolean().default(false),
});

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const from = location.state?.from?.pathname || '/dashboard';

  // Clear any invalid tokens when landing on login page
  React.useEffect(() => {
    // CRITICAL: Don't clear tokens if we just logged in!
    const justLoggedIn = sessionStorage.getItem('just_logged_in');
    if (justLoggedIn) {
      console.log('🛑 Login page mounted but user just logged in - NOT clearing tokens');
      return;
    }
    
    console.log('🔄 Login page mounted - checking for invalid tokens');
    
    // If we're on the login page and didn't just login, clear any existing tokens that might be invalid
    const currentToken = localStorage.getItem('token');
    const currentAccessToken = localStorage.getItem('access_token');
    
    if (currentToken || currentAccessToken) {
      console.log('🗑️ Found existing tokens on login page - clearing to start fresh');
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
    
    // Clear admin tokens too (but only if we didn't just login)
    const adminKeysToRemove = [
      'admin_access_token',
      'admin_refresh_token', 
      'admin_user'
    ];
    
    adminKeysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`🗑️ Removing admin token: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ All tokens cleared for fresh login');
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('Form submitted:', data);
    console.log('📱 Mobile device detected:', isMobile);
    console.log('📱 User agent:', navigator.userAgent);
    
    try {
      console.log('About to call login...');
      await login(data.email, data.password);
      
      // Check if user is admin and redirect to admin login page
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('🔍 Login successful, checking user type:', { 
        email: user.email, 
        is_staff: user.is_staff, 
        is_superuser: user.is_superuser 
      });
      
      if (user.is_staff || user.is_superuser || user.email === 'darelldrayton93@gmail.com') {
        console.log('🚨 Admin user detected on regular login page - copying tokens to admin storage');
        
        // Copy tokens to admin storage (don't clear regular tokens!)
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const userJson = localStorage.getItem('user');
        
        if (accessToken) {
          localStorage.setItem('admin_access_token', accessToken);
          console.log('✅ Copied access token to admin storage');
        }
        if (refreshToken) {
          localStorage.setItem('admin_refresh_token', refreshToken);
          console.log('✅ Copied refresh token to admin storage');
        }
        if (userJson) {
          localStorage.setItem('admin_user', userJson);
          console.log('✅ Copied user data to admin storage');
        }
        
        enqueueSnackbar('Admin account detected. Redirecting to admin portal...', { variant: 'info' });
        
        // Redirect to admin dashboard directly (not login page)
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      
      // Continue with regular user login
      enqueueSnackbar('Welcome back!', { variant: 'success' });
      
      // Clear the just_logged_in flag after a longer delay to ensure navigation completes
      // This is especially important for admin redirects which may take longer
      setTimeout(() => {
        console.log('🧹 Clearing just_logged_in flag after successful navigation');
        sessionStorage.removeItem('just_logged_in');
      }, 3000);
      
      navigate(from, { replace: true });
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Login failed', { variant: 'error' });
    }
  };

  const handleSocialLogin = (provider: string) => {
    enqueueSnackbar(`${provider} login coming soon!`, { variant: 'info' });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
        py: 4,
      }}
    >
      <Container component="main" maxWidth="sm">
        <Fade in timeout={500}>
          <Paper
            elevation={24}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Purple decoration */}
            <Box
              sx={{
                height: 8,
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              }}
            />

            <Box sx={{ p: { xs: 3, sm: 5 } }}>
              {/* Logo and Title */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: 'primary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    boxShadow: theme.shadows[4],
                  }}
                >
                  <LocalParking sx={{ fontSize: 40 }} />
                </Box>
                <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
                  Welcome Back
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Sign in to your Parking in a Pinch account
                </Typography>
              </Box>

              {/* Login Form */}
              <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
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
                  sx={{ '& .MuiInputLabel-root': { color: 'text.primary' } }}
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

                <Grid container alignItems="center" sx={{ mt: 1, mb: 2 }}>
                  <Grid size="grow">
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...register('rememberMe')}
                          
                        />
                      }
                      label="Remember me"
                      sx={{ '& .MuiFormControlLabel-label': { color: 'text.primary' } }}
                    />
                  </Grid>
                  <Grid size="auto">
                    <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                      <Typography variant="body2" sx={{ color: 'text.primary', '&:hover': { textDecoration: 'underline' } }}>
                        Forgot password?
                      </Typography>
                    </Link>
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                <Grid container justifyContent="center" spacing={2}>
                  <Grid size={12}>
                    <Typography variant="body2" color="text.secondary" align="center">
                      Don't have an account?{' '}
                      <Link
                        to="/signup"
                        style={{
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                      >
                        Sign up
                      </Link>
                    </Typography>
                  </Grid>
                </Grid>


              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;
