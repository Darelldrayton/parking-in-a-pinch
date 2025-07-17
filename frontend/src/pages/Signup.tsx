import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
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
  Checkbox,
  FormControlLabel,
  Grid,
  useTheme,
  useMediaQuery,
  Fade,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  FormHelperText,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  LocalParking,
  Search,
  Home,
  SwapHoriz,
  CheckCircle,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from 'notistack';
import { LegalDisclaimer } from '../components/legal/LegalDisclaimer';

interface SignupFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  user_type: 'seeker' | 'host' | 'both';
  agreeToTerms: boolean;
  subscribeToNewsletter: boolean;
}

const schema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])/,
      'Password must contain at least one uppercase letter and one lowercase letter'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  user_type: yup
    .string()
    .oneOf(['seeker', 'host', 'both'])
    .required('Please select a user type'),
  agreeToTerms: yup
    .boolean()
    .oneOf([true], 'You must agree to the terms and conditions'),
  subscribeToNewsletter: yup.boolean().default(false),
});

const Signup: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const { signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const defaultUserType = searchParams.get('type') === 'host' ? 'host' : 'seeker';

  // Clear any invalid tokens when landing on signup page
  React.useEffect(() => {
    // Don't clear if we just signed up
    const justLoggedIn = sessionStorage.getItem('just_logged_in');
    if (justLoggedIn) {
      console.log('🛑 Signup page mounted but user just signed up - NOT clearing tokens');
      return;
    }
    
    // Clear any existing tokens for fresh signup
    const hasTokens = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (hasTokens) {
      console.log('🗑️ Clearing existing tokens on signup page');
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }, []);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    trigger,
    setValue,
  } = useForm<SignupFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      user_type: defaultUserType,
      agreeToTerms: false,
      subscribeToNewsletter: true,
    },
    mode: 'onChange',
  });

  const watchedUserType = watch('user_type');
  const formValues = watch();

  const steps = ['Account Info', 'User Type', 'Security'];

  const handleNext = async () => {
    // Validate current step fields
    let fieldsToValidate: (keyof SignupFormData)[] = [];
    
    if (activeStep === 0) {
      fieldsToValidate = ['first_name', 'last_name', 'email'];
    } else if (activeStep === 1) {
      fieldsToValidate = ['user_type'];
    } else if (activeStep === 2) {
      fieldsToValidate = ['password', 'confirmPassword', 'agreeToTerms'];
    }

    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup({
        email: data.email,
        password: data.password,
        password2: data.confirmPassword,
        first_name: data.first_name,
        last_name: data.last_name,
        user_type: data.user_type,
        subscribe_to_newsletter: data.subscribeToNewsletter,
      });
      
      // Set flag to prevent token clearing during redirect
      sessionStorage.setItem('just_logged_in', 'true');
      
      enqueueSnackbar('Account created successfully!', { variant: 'success' });
      
      // Clear the flag after navigation completes
      setTimeout(() => {
        sessionStorage.removeItem('just_logged_in');
      }, 3000);
      
      navigate('/dashboard');
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Signup failed', { variant: 'error' });
    }
  };

  const userTypeOptions = [
    {
      value: 'seeker',
      label: 'Find Parking',
      icon: <Search />,
      description: 'Search and book parking spaces',
      color: theme.palette.info.main,
    },
    {
      value: 'host',
      label: 'List My Space',
      icon: <Home />,
      description: 'Rent out your parking space',
      color: theme.palette.success.main,
    },
    {
      value: 'both',
      label: 'Both',
      icon: <SwapHoriz />,
      description: 'Find parking and list spaces',
      color: theme.palette.secondary.main,
    },
  ];

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
      <Container component="main" maxWidth="md">
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
                  Create Your Account
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Join Parking in a Pinch today
                </Typography>
              </Box>

              {/* Progress Stepper */}
              {!isMobile && (
                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              )}

              {/* Signup Form */}
              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                
                {/* Step 1: Account Info */}
                {activeStep === 0 && (
                  <Fade in timeout={300}>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <Typography variant="h6" gutterBottom>
                          Let's start with your basic information
                        </Typography>
                      </Grid>
                      
                      {/* Name Fields */}
                      <Grid size={6}>
                        <TextField
                          {...register('first_name')}
                          fullWidth
                          label="First Name"
                          autoComplete="given-name"
                          error={!!errors.first_name}
                          helperText={errors.first_name?.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          {...register('last_name')}
                          fullWidth
                          label="Last Name"
                          autoComplete="family-name"
                          error={!!errors.last_name}
                          helperText={errors.last_name?.message}
                        />
                      </Grid>

                      {/* Email Field */}
                      <Grid size={12}>
                        <TextField
                          {...register('email')}
                          fullWidth
                          label="Email Address"
                          autoComplete="email"
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
                      </Grid>
                    </Grid>
                  </Fade>
                )}

                {/* Step 2: User Type */}
                {activeStep === 1 && (
                  <Fade in timeout={300}>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <FormControl component="fieldset" error={!!errors.user_type} fullWidth>
                          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500 }}>
                            How do you want to use Parking in a Pinch?
                          </FormLabel>
                          <Controller
                            name="user_type"
                            control={control}
                            render={({ field }) => (
                              <RadioGroup {...field} row>
                                {userTypeOptions.map((option) => (
                                  <Grid size={4} key={option.value}>
                                    <Paper
                                      elevation={field.value === option.value ? 8 : 1}
                                      sx={{
                                        p: 2,
                                        m: 0.5,
                                        cursor: 'pointer',
                                        border: 2,
                                        borderColor: field.value === option.value ? option.color : 'transparent',
                                        transition: 'all 0.3s',
                                        '&:hover': {
                                          transform: 'translateY(-4px)',
                                          boxShadow: theme.shadows[4],
                                        },
                                      }}
                                      onClick={() => field.onChange(option.value)}
                                    >
                                      <FormControlLabel
                                        value={option.value}
                                        control={<Radio sx={{ display: 'none' }} />}
                                        label={
                                          <Box sx={{ textAlign: 'center' }}>
                                            <Box
                                              sx={{
                                                width: 60,
                                                height: 60,
                                                borderRadius: '50%',
                                                bgcolor: `${option.color}20`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mx: 'auto',
                                                mb: 1,
                                                color: option.color,
                                              }}
                                            >
                                              {option.icon}
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                              {option.label}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                              {option.description}
                                            </Typography>
                                          </Box>
                                        }
                                        sx={{ m: 0, width: '100%' }}
                                      />
                                    </Paper>
                                  </Grid>
                                ))}
                              </RadioGroup>
                            )}
                          />
                          {errors.user_type && (
                            <FormHelperText>{errors.user_type.message}</FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Fade>
                )}

                {/* Step 3: Security */}
                {activeStep === 2 && (
                  <Fade in timeout={300}>
                    <Grid container spacing={2}>
                      <Grid size={12}>
                        <Typography variant="h6" gutterBottom>
                          Secure your account
                        </Typography>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Your password must contain:
                          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                            <li>At least 8 characters</li>
                            <li>One uppercase letter (A-Z)</li>
                            <li>One lowercase letter (a-z)</li>
                          </ul>
                        </Alert>
                      </Grid>

                      {/* Password Fields */}
                      <Grid size={6}>
                        <TextField
                          {...register('password')}
                          fullWidth
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
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
                      </Grid>
                      <Grid size={6}>
                        <TextField
                          {...register('confirmPassword')}
                          fullWidth
                          label="Confirm Password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          error={!!errors.confirmPassword}
                          helperText={errors.confirmPassword?.message}
                          InputProps={{
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
                      </Grid>

                      {/* Legal Terms Agreement */}
                      <Grid size={12}>
                        <LegalDisclaimer
                          type="signup"
                          required={true}
                          onAccept={(accepted) => {
                            setValue('agreeToTerms', accepted);
                          }}
                        />
                        {errors.agreeToTerms && (
                          <FormHelperText error>{errors.agreeToTerms.message}</FormHelperText>
                        )}
                      </Grid>

                      {/* Newsletter Subscription */}
                      <Grid size={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              {...register('subscribeToNewsletter')}
                              
                              defaultChecked
                            />
                          }
                          label={
                            <Typography variant="body2">
                              Subscribe to our newsletter for exclusive parking deals, tips, and updates
                              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                You can unsubscribe at any time from your account settings
                              </Typography>
                            </Typography>
                          }
                        />
                      </Grid>
                    </Grid>
                  </Fade>
                )}

                {/* Navigation Buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                  >
                    Back
                  </Button>
                  
                  {activeStep === steps.length - 1 ? (
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={isLoading}
                      startIcon={isLoading ? null : <CheckCircle />}
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                    >
                      Next
                    </Button>
                  )}
                </Box>

                {/* Login Link */}
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      style={{
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      Sign in
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Signup;