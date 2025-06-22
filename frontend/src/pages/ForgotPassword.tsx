import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Alert,
  Fade,
  useTheme,
} from '@mui/material';
import {
  Email,
  LocalParking,
  ArrowBack,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import authService from '../services/auth';

interface ForgotPasswordFormData {
  email: string;
}

const schema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
});

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      console.log('ForgotPassword: Submitting reset request for:', data.email);
      await authService.resetPassword(data.email);
      setEmailSent(true);
      enqueueSnackbar('Password reset instructions sent to your email', { variant: 'success' });
    } catch (error: any) {
      console.error('ForgotPassword: Error occurred:', error);
      console.error('ForgotPassword: Error response:', error.response);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.response?.data) {
        const data = error.response.data;
        errorMessage = data.message || data.detail || data.error || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('ForgotPassword: Final error message:', errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
              <Box
                sx={{
                  height: 8,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                }}
              />

              <Box sx={{ p: { xs: 3, sm: 5 } }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
                    Check Your Email
                  </Typography>
                  <Typography variant="body1" color="text.secondary" mb={3}>
                    We've sent password reset instructions to your email address.
                  </Typography>
                  
                  <Alert severity="info" sx={{ mt: 3, mb: 3 }}>
                    <Typography variant="body2">
                      If you don't receive an email within a few minutes, please check your spam folder
                      or try again with a different email address.
                    </Typography>
                  </Alert>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{ mb: 2 }}
                  >
                    Return to Login
                  </Button>

                  <Typography variant="body2" color="text.secondary">
                    Didn't receive the email?{' '}
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setEmailSent(false);
                      }}
                      style={{
                        textDecoration: 'none',
                        color: theme.palette.primary.main,
                        fontWeight: 500,
                      }}
                    >
                      Try again
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Fade>
        </Container>
      </Box>
    );
  }

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
                  <LocalParking sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
                <Typography component="h1" variant="h4" fontWeight="bold" gutterBottom>
                  Forgot Password?
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Enter your email address and we'll send you instructions to reset your password
                </Typography>
              </Box>

              {/* Forgot Password Form */}
              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
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
                    startAdornment: <Email color="action" sx={{ mr: 1 }} />,
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
                  {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  startIcon={<ArrowBack />}
                  onClick={() => navigate('/login')}
                  sx={{ mb: 2 }}
                >
                  Back to Login
                </Button>

                <Typography variant="body2" align="center" color="text.secondary">
                  Remember your password?{' '}
                  <Link
                    to="/login"
                    style={{
                      textDecoration: 'none',
                      color: theme.palette.primary.main,
                      fontWeight: 500,
                    }}
                  >
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default ForgotPassword;