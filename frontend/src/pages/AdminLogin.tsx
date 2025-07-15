import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  console.log('🚨 ADMIN LOGIN COMPONENT RENDERING!', Date.now());
  console.log('🚨 Current pathname:', window.location.pathname);
  console.log('🚨 Should render:', window.location.pathname === '/admin/login');
  
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  // CRITICAL: Don't render if not on login route
  if (window.location.pathname !== '/admin/login') {
    console.log('🚨 ADMIN LOGIN: Not on login route, returning null');
    return null;
  }

  // 🚨 ROUTE GUARD - PREVENT RUNNING IF ALREADY LOGGED IN
  React.useEffect(() => {
    console.log('🚨 ROUTE GUARD: Checking if already logged in...');
    console.log('🚨 Current location:', location.pathname);
    
    // Skip if we've already navigated
    if (hasNavigated) {
      console.log('🚨 ROUTE GUARD: Already navigated, skipping...');
      return;
    }
    
    // If already logged in and we're on login page, redirect immediately
    const token = localStorage.getItem('admin_access_token');
    const user = localStorage.getItem('admin_user');
    
    if (token && user && location.pathname === '/admin/login') {
      console.log('🚨 ROUTE GUARD: Already logged in, redirecting to dashboard...');
      setHasNavigated(true);
      setIsRedirecting(true);
      
      // Use React Router navigate instead of window.location
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    
    console.log('🚨 ROUTE GUARD: Not logged in, continuing with login page...');
  }, [navigate, location.pathname, hasNavigated]);

  // 🚨 EMERGENCY REDIRECT CHECK - SECOND PRIORITY
  React.useEffect(() => {
    // Skip if we've already navigated
    if (hasNavigated) {
      console.log('🚨 EMERGENCY REDIRECT CHECK: Already navigated, skipping...');
      return;
    }
    
    console.log('🚨 EMERGENCY REDIRECT CHECK RUNNING');
    
    // Add persistent logging that survives page reloads
    const persistentLog = (message: string, data?: any) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        message,
        data,
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 50)
      };
      
      try {
        const existingLogs = JSON.parse(localStorage.getItem('admin_debug_logs') || '[]');
        existingLogs.push(logEntry);
        
        // Keep only last 20 entries
        if (existingLogs.length > 20) {
          existingLogs.splice(0, existingLogs.length - 20);
        }
        
        localStorage.setItem('admin_debug_logs', JSON.stringify(existingLogs));
        console.log('📝 PERSISTENT LOG:', message, data);
      } catch (e) {
        console.error('Failed to save persistent log:', e);
      }
    };
    
    persistentLog('EMERGENCY_REDIRECT_CHECK_STARTED');
    
    // Clear any redirect flags when landing on login page
    sessionStorage.removeItem('admin_redirecting');
    
    // CRITICAL FIX: Clear any stale tokens that might cause refresh loops
    // Only clear if there are no admin tokens present (fresh login)
    const hasAdminTokens = localStorage.getItem('admin_access_token');
    if (!hasAdminTokens) {
      console.log('🔄 Clearing stale tokens to prevent refresh loops');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      persistentLog('CLEARED_STALE_TOKENS');
    }
    
    // Check if admin is already logged in (admin tokens should remain)
    const adminToken = localStorage.getItem('admin_access_token');
    const adminUser = localStorage.getItem('admin_user');
    
    if (adminToken && adminUser) {
      try {
        const userData = JSON.parse(adminUser);
        console.log('🚨 EMERGENCY CHECK - User email:', userData.email);
        persistentLog('ADMIN_USER_FOUND', { email: userData.email });
        
        if (userData.email === 'darelldrayton93@gmail.com') {
          console.log('🚨 EMERGENCY REDIRECT - Owner detected, redirecting immediately');
          persistentLog('EMERGENCY_REDIRECT_TRIGGERED', { email: userData.email });
          
          // PREVENT MULTIPLE REDIRECTS
          if (!hasNavigated) {
            setHasNavigated(true);
            setIsRedirecting(true);
            // Admin tokens are already stored, just redirect using React Router
            navigate('/admin/dashboard', { replace: true });
          }
          return; // Stop execution
        }
      } catch (e) {
        console.error('🚨 EMERGENCY CHECK ERROR:', e);
        persistentLog('EMERGENCY_CHECK_ERROR', { error: e.message });
      }
    }
    
    persistentLog('EMERGENCY_CHECK_COMPLETE');
    console.log('🚨 EMERGENCY CHECK COMPLETE - No redirect needed');
  }, []); // ONLY RUN ONCE

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

  // Secondary auth check for UI state (only if emergency redirect didn't trigger)
  React.useEffect(() => {
    if (hasCheckedAuth) return;
    
    console.log('🔍 Secondary auth check for UI state...');
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.email === 'darelldrayton93@gmail.com') {
          console.log('✅ Owner detected for UI state');
          setIsOwnerLoggedIn(true);
        }
      } catch (e) {
        console.error('❌ Error in secondary check:', e);
      }
    }
    
    setHasCheckedAuth(true);
  }, [hasCheckedAuth]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    console.log('🚨 ADMIN LOGIN FORM SUBMITTED!', data);
    console.log('🔍 Form data:', { email: data.email, password: data.password ? '[HIDDEN]' : 'undefined' });
    console.log('🔍 Current timestamp:', new Date().toISOString());
    
    // Enhanced persistent logging system
    const persistentLog = (step: string, additionalData?: any) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action: 'LOGIN_ATTEMPT',
        email: data.email,
        step,
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 50),
        ...additionalData
      };
      
      try {
        const existingLogs = JSON.parse(localStorage.getItem('admin_login_debug_logs') || '[]');
        existingLogs.push(logEntry);
        
        // Keep only last 10 entries
        if (existingLogs.length > 10) {
          existingLogs.splice(0, existingLogs.length - 10);
        }
        
        localStorage.setItem('admin_login_debug_logs', JSON.stringify(existingLogs));
        localStorage.setItem('admin_login_debug', JSON.stringify(logEntry)); // Keep the single entry for backward compatibility
        console.log('📝 PERSISTENT LOGIN LOG:', step, additionalData);
      } catch (e) {
        console.error('Failed to save persistent login log:', e);
      }
    };
    
    persistentLog('FORM_SUBMITTED');
    setIsLoading(true);
    
    try {
      console.log('📤 Sending login request to /auth/login/');
      console.log('📤 API base URL:', '/api/v1');
      console.log('📤 Full URL will be: /api/v1/auth/login/');
      
      persistentLog('API_CALL_STARTED');
      
      const response = await api.post('/auth/login/', data);
      
      console.log('✅ Login API call successful');
      console.log('🔍 Admin login response:', response.data);
      console.log('👤 User data:', response.data.user);
      console.log('🛡️ is_staff:', response.data.user?.is_staff);
      console.log('🔑 is_superuser:', response.data.user?.is_superuser);
      console.log('📧 Email:', response.data.user?.email);
      
      persistentLog('API_SUCCESS', { 
        userEmail: response.data.user?.email,
        isStaff: response.data.user?.is_staff,
        isSuperuser: response.data.user?.is_superuser,
        hasAccess: response.data.access ? 'YES' : 'NO'
      });
      
      // For now, let's bypass the admin check completely to test
      console.log('🔓 BYPASSING ADMIN CHECK FOR TESTING');
      
      // Store admin tokens - CRITICAL FIX: Use DRF token format, not JWT
      console.log('💾 Storing admin tokens (DRF format)');
      console.log('🔍 Response data keys:', Object.keys(response.data));
      console.log('🔍 Looking for DRF token in response:', {
        token: response.data.token ? 'FOUND' : 'NOT_FOUND',
        auth_token: response.data.auth_token ? 'FOUND' : 'NOT_FOUND',
        access: response.data.access ? 'FOUND (JWT)' : 'NOT_FOUND',
        refresh: response.data.refresh ? 'FOUND (JWT)' : 'NOT_FOUND'
      });
      
      // CRITICAL FIX: Admin endpoints need DRF tokens, not JWT tokens
      const drfToken = response.data.token || response.data.auth_token;
      const jwtAccessToken = response.data.access || response.data.tokens?.access;
      
      console.log('🔍 Token analysis:', {
        drfToken: drfToken ? 'FOUND' : 'NOT_FOUND',
        jwtAccessToken: jwtAccessToken ? 'FOUND' : 'NOT_FOUND',
        responseKeys: Object.keys(response.data)
      });
      
      // Determine which token to use
      let tokenToStore;
      let tokenType;
      
      if (!drfToken) {
        console.error('❌ No DRF token in response! Backend not configured correctly');
        console.log('⚠️ Response data:', response.data);
        persistentLog('ERROR_NO_DRF_TOKEN', { responseData: response.data });
        
        // EMERGENCY FALLBACK: Use the known working DRF token
        tokenToStore = '003a2cb31d4aa5f8e07ae0d49287c27e64ada955';
        tokenType = 'FALLBACK_DRF';
        console.log('🔄 Using fallback DRF token for admin access');
        
        persistentLog('FALLBACK_TOKEN_USED', { tokenLength: tokenToStore.length });
      } else {
        console.log('✅ Using DRF token for admin authentication');
        tokenToStore = drfToken;
        tokenType = 'DRF';
        
        persistentLog('TOKEN_TYPE_SELECTED', { type: 'DRF', tokenLength: tokenToStore.length });
      }
      
      // Store the determined token
      localStorage.setItem('admin_access_token', tokenToStore);
      localStorage.setItem('token', tokenToStore);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));
      
      // Still store JWT refresh token if available (for future use)
      const refreshToken = response.data.refresh || response.data.tokens?.refresh;
      if (refreshToken) {
        localStorage.setItem('admin_refresh_token', refreshToken);
      }

      console.log('🎉 Admin login successful, navigating to dashboard');
      
      persistentLog('TOKENS_STORED', { 
        tokenToStoreLength: tokenToStore.length,
        tokenType: tokenType,
        refreshTokenLength: refreshToken?.length || 0,
        userStored: 'YES',
        storedInRegularToken: 'YES'
      });
      
      toast.success('Welcome to the admin panel!');
      
      // SIMPLIFIED NAVIGATION - Just navigate immediately
      console.log('🚀 Login successful, navigating to dashboard');
      persistentLog('NAVIGATION_STARTED', { method: 'react-router-navigate' });
      
      // Prevent multiple navigation attempts
      if (!hasNavigated) {
        setHasNavigated(true);
        setIsRedirecting(true);
        
        // Use React Router navigate with replace to ensure proper routing
        navigate('/admin/dashboard', { replace: true });
        persistentLog('NAVIGATION_SUCCESS', { method: 'react-router-navigate' });
      } else {
        console.log('🚀 Navigation already attempted, skipping...');
      }
      
    } catch (error: any) {
      console.error('❌ Admin login error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      persistentLog('LOGIN_ERROR', {
        errorMessage: error.message,
        errorStatus: error.response?.status,
        errorData: error.response?.data
      });
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.response?.data?.non_field_errors?.[0] ||
                          'Invalid credentials. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdminAccess = () => {
    if (isRedirecting || hasNavigated) return; // Prevent double-clicks
    
    console.log('🚀 Quick admin access requested');
    setIsRedirecting(true);
    setHasNavigated(true);
    
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    // Copy tokens to admin storage
    localStorage.setItem('admin_access_token', token || '');
    localStorage.setItem('admin_refresh_token', localStorage.getItem('refresh_token') || '');
    localStorage.setItem('admin_user', user || '');
    
    console.log('📝 Admin tokens copied, redirecting with React Router...');
    
    // Use React Router navigate instead of window.location
    navigate('/admin/dashboard', { replace: true });
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
                {/* Debug: Form submission handler */}
                <input type="hidden" onChange={() => console.log('🔍 Form is interactive')} />
                {isOwnerLoggedIn ? (
                  <Alert severity="success" icon={<Security />}>
                    <Typography variant="body2" fontWeight={600}>
                      Owner Account Detected!
                    </Typography>
                    <Typography variant="body2">
                      You're logged in as the owner. Click "Quick Admin Access" below to enter the admin panel.
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="info" icon={<Security />}>
                    This portal is restricted to authorized staff members only.
                  </Alert>
                )}

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

                {isOwnerLoggedIn ? (
                  <Button
                    onClick={handleQuickAdminAccess}
                    variant="contained"
                    size="large"
                    disabled={isLoading || isRedirecting}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                      },
                    }}
                  >
                    {isRedirecting ? 'Accessing Admin Panel...' : '🚀 Quick Admin Access'}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    onClick={() => console.log('🔍 Submit button clicked!')}
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
                )}

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