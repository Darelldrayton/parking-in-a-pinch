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

  // CRITICAL FIX: Clear ALL tokens on component mount to prevent conflicts
  React.useEffect(() => {
    console.log('🔄 Clearing all auth tokens for fresh login');
    const keysToRemove = [
      'admin_access_token',
      'admin_refresh_token', 
      'admin_user',
      'access_token',
      'refresh_token',
      'token'
    ];
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`🗑️ Removing ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    console.log('✅ All auth tokens cleared for fresh login');
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
    
    try {
      console.log('About to call login...');
      await login(data.email, data.password);
    // ... rest of the function
      
      // Check if user is admin and store admin tokens
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.is_staff || user.is_superuser) {
        // Copy tokens to admin keys for admin dashboard
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        if (accessToken) localStorage.setItem('admin_access_token', accessToken);
        if (refreshToken) localStorage.setItem('admin_refresh_token', refreshToken);
        localStorage.setItem('admin_user', JSON.stringify(user));
        
        enqueueSnackbar('Welcome to admin dashboard!', { variant: 'success' });
        navigate('/admin/dashboard', { replace: true });
      } else {
        enqueueSnackbar('Welcome back!', { variant: 'success' });
        navigate(from, { replace: true });
      }
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

                <Grid container justifyContent="center">
                  <Grid size="auto">
                    <Typography variant="body2" color="text.secondary">
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
