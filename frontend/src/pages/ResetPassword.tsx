import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Alert,
  Fade,
  useTheme,
} from '@mui/material';
import {
  Lock,
  LocalParking,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import authService from '../services/auth';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const schema = yup.object({
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

const ResetPassword: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const navigate = useNavigate();
  const { uid, token } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!uid || !token) {
      enqueueSnackbar('Invalid reset link', { variant: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      await authService.confirmResetPassword({
        uid,
        token,
        new_password: data.password,
        new_password2: data.confirmPassword,
      });
      setResetSuccess(true);
      enqueueSnackbar('Password reset successful!', { variant: 'success' });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.error || 'Failed to reset password. The link may be invalid or expired.',
        { variant: 'error' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
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

              <Box sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Password Reset Successful!
                  </Typography>
                  <Typography variant="body2">
                    Your password has been reset successfully. You will be redirected to the login page in a few seconds...
                  </Typography>
                </Alert>

                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={() => navigate('/login')}
                >
                  Go to Login Now
                </Button>
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
                  Reset Your Password
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Enter your new password below
                </Typography>
              </Box>

              {/* Reset Password Form */}
              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <TextField
                  {...register('password')}
                  margin="normal"
                  fullWidth
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoFocus
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

                <TextField
                  {...register('confirmPassword')}
                  margin="normal"
                  fullWidth
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2">
                    Your new password must be at least 8 characters long
                  </Typography>
                </Alert>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default ResetPassword;