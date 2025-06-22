import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Stack,
  Divider,
  IconButton,
  useTheme,
  alpha,
  Fade,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Switch,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack,
  AccountBalance as BankIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CheckCircle,
  Info,
  AttachMoney,
  Schedule,
  Verified,
  Warning,
  Payment,
  PhoneAndroid,
  Email,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

// Form validation schema
const payoutSchema = yup.object({
  payout_method: yup.string().required('Payout method is required'),
  amount: yup
    .number()
    .required('Amount is required')
    .min(5, 'Minimum payout amount is $5')
    .max(10000, 'Maximum payout amount is $10,000'),
  instant_payout: yup.boolean(),
  // Payout account fields
  payout_username: yup.string().when('payout_method', {
    is: (val: string) => ['cashapp', 'paypal', 'venmo', 'zelle'].includes(val),
    then: (schema) => schema.required('Username/email is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  payout_username_confirm: yup.string().when('payout_method', {
    is: (val: string) => ['cashapp', 'paypal', 'venmo', 'zelle'].includes(val),
    then: (schema) => schema
      .required('Please confirm your username/email')
      .oneOf([yup.ref('payout_username')], 'Username/email must match'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

interface PayoutFormData {
  payout_method: string;
  amount: number;
  instant_payout: boolean;
  payout_username?: string;
  payout_username_confirm?: string;
}

interface EarningsData {
  total_earnings: number;
  available_balance: number;
  pending_amount: number;
  instant_payout_enabled: boolean;
}

interface SavedPaymentMethod {
  id: string;
  type: 'cashapp' | 'paypal' | 'venmo' | 'zelle';
  platform_name: string;
  username: string;
  is_default: boolean;
}

export default function Payout() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [useNewAccount, setUseNewAccount] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<PayoutFormData>({
    resolver: yupResolver(payoutSchema),
    defaultValues: {
      payout_method: '',
      amount: 0,
      instant_payout: false,
    },
  });

  const watchedPayoutMethod = watch('payout_method');
  const watchedAmount = watch('amount');
  const watchedInstantPayout = watch('instant_payout');

  useEffect(() => {
    loadEarningsData();
    loadSavedPaymentMethods();
  }, [user?.id]);

  const loadEarningsData = async () => {
    try {
      const response = await api.get('/payments/v2/earnings-summary/');
      const data = response.data;
      setEarnings({
        total_earnings: data.total_earnings || 0,
        available_balance: data.pending_earnings || 0, // Use pending_earnings as available
        pending_amount: data.this_month_earnings || 0,
        instant_payout_enabled: data.instant_payout_enabled || false,
      });
      
      // Let user set the amount instead of pre-filling
      setValue('amount', '');
    } catch (error) {
      console.error('Error loading earnings:', error);
      toast.error('Failed to load earnings data');
    }
  };

  const loadSavedPaymentMethods = async () => {
    try {
      // Mock saved payment methods for now - empty by default
      const mockMethods: SavedPaymentMethod[] = [];
      setSavedMethods(mockMethods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePayoutFee = (amount: number, isInstant: boolean): number => {
    if (isInstant) {
      return Math.max(0.50, amount * 0.015); // 1.5% fee for instant, minimum $0.50
    }
    return 0; // Standard payouts are free
  };

  const getPayoutTiming = (isInstant: boolean): string => {
    return isInstant ? 'Within 30 minutes' : '1-2 business days';
  };

  const onSubmit = async (data: PayoutFormData) => {
    setSubmitting(true);
    try {
      console.log('Submitting payout request:', data);

      const payoutPayload = {
        amount: data.amount,
        payout_method: data.payout_method,
        instant_payout: data.instant_payout,
        ...((['cashapp', 'paypal', 'venmo', 'zelle'].includes(data.payout_method)) && useNewAccount && {
          payout_account: {
            platform: data.payout_method,
            username: data.payout_username,
          },
        }),
      };

      const response = await api.post('/payments/v2/request-instant-payout/', payoutPayload);
      
      toast.success('Payout request submitted successfully!');
      console.log('Payout response:', response.data);
      
      // Navigate back to earnings page
      navigate('/earnings');
    } catch (error: any) {
      console.error('Error submitting payout:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to submit payout request';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  const payoutFee = calculatePayoutFee(watchedAmount || 0, watchedInstantPayout);
  const netAmount = (watchedAmount || 0) - payoutFee;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
      py: 4,
    }}>
      {/* Header */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
        color: 'white',
        py: 4,
        mb: 4,
      }}>
        <Container maxWidth="lg">
          <Fade in timeout={800}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <IconButton 
                  onClick={() => navigate('/earnings')} 
                  sx={{ color: 'white', bgcolor: alpha(theme.palette.common.white, 0.1) }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="h4" component="h1" fontWeight={700}>
                  Request Payout
                </Typography>
              </Stack>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                Transfer your earnings to your preferred payment app
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Payout Form */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Payout Details
                </Typography>
                
                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                  <Grid container spacing={3}>
                    {/* Available Balance Info */}
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          Available Balance: <strong>${earnings?.available_balance?.toFixed(2) || '0.00'}</strong>
                        </Typography>
                      </Alert>
                    </Grid>

                    {/* Payout Amount */}
                    <Grid item xs={12} md={6}>
                      <TextField
                        {...register('amount')}
                        fullWidth
                        label="Payout Amount"
                        type="number"
                        inputProps={{ 
                          min: 5, 
                          max: earnings?.available_balance || 0,
                          step: 0.01 
                        }}
                        error={!!errors.amount}
                        helperText={errors.amount?.message}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </Grid>

                    {/* Instant Payout Toggle */}
                    <Grid item xs={12} md={6}>
                      <Stack spacing={2}>
                        <Controller
                          name="instant_payout"
                          control={control}
                          render={({ field }) => (
                            <FormControlLabel
                              control={
                                <Switch
                                  {...field}
                                  checked={field.value}
                                  disabled={!earnings?.instant_payout_enabled}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2" fontWeight={500}>
                                    Instant Payout
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {earnings?.instant_payout_enabled 
                                      ? 'Receive funds within 30 minutes'
                                      : 'Not available for your account'
                                    }
                                  </Typography>
                                </Box>
                              }
                            />
                          )}
                        />
                      </Stack>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider />
                    </Grid>

                    {/* Payment Method Selection */}
                    <Grid item xs={12}>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        Payment Method
                      </Typography>
                    </Grid>

                    {/* Saved Payment Methods */}
                    {savedMethods.length > 0 && (
                      <Grid item xs={12}>
                        <FormControl component="fieldset">
                          <FormLabel component="legend">Select Payment Method</FormLabel>
                          <RadioGroup
                            value={useNewAccount ? 'new' : 'saved'}
                            onChange={(e) => setUseNewAccount(e.target.value === 'new')}
                          >
                            {savedMethods.map((method) => (
                              <Stack
                                key={method.id}
                                direction="row"
                                alignItems="center"
                                spacing={2}
                                sx={{ mb: 2 }}
                              >
                                <Radio value="saved" />
                                <Paper sx={{ p: 2, flex: 1, border: `1px solid ${theme.palette.divider}` }}>
                                  <Stack direction="row" alignItems="center" spacing={2}>
                                    {method.type === 'cashapp' && <PhoneAndroid color="primary" />}
                                    {method.type === 'paypal' && <Payment color="primary" />}
                                    {method.type === 'venmo' && <PhoneAndroid color="primary" />}
                                    <Box flex={1}>
                                      <Typography variant="body2" fontWeight={500}>
                                        {method.platform_name}: {method.username}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {method.type} account
                                      </Typography>
                                    </Box>
                                    {method.is_default && (
                                      <Chip label="Default" size="small" color="primary" />
                                    )}
                                  </Stack>
                                </Paper>
                              </Stack>
                            ))}
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Radio value="new" />
                              <Typography variant="body2">Add new payout account</Typography>
                            </Stack>
                          </RadioGroup>
                        </FormControl>
                      </Grid>
                    )}

                    {/* New Payout Account Form */}
                    {(useNewAccount || savedMethods.length === 0) && (
                      <>
                        <Grid item xs={12}>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              Your payment information is encrypted and securely stored.
                            </Typography>
                          </Alert>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth error={!!errors.payout_method}>
                            <InputLabel>Payment App</InputLabel>
                            <Controller
                              name="payout_method"
                              control={control}
                              render={({ field }) => (
                                <Select {...field} label="Payment App">
                                  <MenuItem value="cashapp">
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <PhoneAndroid fontSize="small" />
                                      <span>CashApp</span>
                                    </Stack>
                                  </MenuItem>
                                  <MenuItem value="paypal">
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Payment fontSize="small" />
                                      <span>PayPal</span>
                                    </Stack>
                                  </MenuItem>
                                  <MenuItem value="venmo">
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <PhoneAndroid fontSize="small" />
                                      <span>Venmo</span>
                                    </Stack>
                                  </MenuItem>
                                  <MenuItem value="zelle">
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <BankIcon fontSize="small" />
                                      <span>Zelle</span>
                                    </Stack>
                                  </MenuItem>
                                </Select>
                              )}
                            />
                          </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            {...register('payout_username')}
                            fullWidth
                            label={watchedPayoutMethod === 'paypal' || watchedPayoutMethod === 'zelle' ? 'Email Address' : 'Username'}
                            placeholder={
                              watchedPayoutMethod === 'cashapp' ? '$username' : 
                              watchedPayoutMethod === 'paypal' ? 'email@example.com' : 
                              watchedPayoutMethod === 'zelle' ? 'email@example.com' :
                              '@username'
                            }
                            error={!!errors.payout_username}
                            helperText={errors.payout_username?.message}
                            InputProps={{
                              startAdornment: watchedPayoutMethod === 'paypal' ? (
                                <InputAdornment position="start">
                                  <Email fontSize="small" />
                                </InputAdornment>
                              ) : undefined,
                            }}
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <TextField
                            {...register('payout_username_confirm')}
                            fullWidth
                            label={`Confirm ${watchedPayoutMethod === 'paypal' || watchedPayoutMethod === 'zelle' ? 'Email Address' : 'Username'}`}
                            placeholder="Re-enter to confirm"
                            error={!!errors.payout_username_confirm}
                            helperText={errors.payout_username_confirm?.message}
                          />
                        </Grid>
                      </>
                    )}

                    <Grid item xs={12}>
                      <Divider />
                    </Grid>

                    {/* Submit Button */}
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={submitting || !watchedAmount || watchedAmount <= 0}
                        startIcon={submitting ? undefined : <CheckCircle />}
                        sx={{
                          py: 2,
                          borderRadius: 2,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                        }}
                      >
                        {submitting ? 'Processing Payout...' : `Request Payout`}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Payout Summary */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Payout Summary */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Payout Summary
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Payout Amount
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ${(watchedAmount && typeof watchedAmount === 'number' ? watchedAmount.toFixed(2) : '0.00')}
                      </Typography>
                    </Box>
                    
                    {watchedInstantPayout && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Instant Payout Fee
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          ${(payoutFee && typeof payoutFee === 'number' ? payoutFee.toFixed(2) : '0.00')}
                        </Typography>
                      </Box>
                    )}
                    
                    <Divider />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight={700}>
                        You'll Receive
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary">
                        ${(netAmount && typeof netAmount === 'number' ? netAmount.toFixed(2) : '0.00')}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {getPayoutTiming(watchedInstantPayout)}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Payout Information */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Payout Information
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <SpeedIcon sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          Instant Payouts
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          1.5% fee, funds in 30 minutes
                        </Typography>
                      </Box>
                    </Stack>
                    
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Payment sx={{ color: 'success.main' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          Standard Payouts
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Free, 1-2 business days
                        </Typography>
                      </Box>
                    </Stack>
                    
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <SecurityIcon sx={{ color: 'info.main' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          Secure Payments
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          256-bit SSL encryption
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card sx={{ borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.02) }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Verified sx={{ color: 'success.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                      Account Verified
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Your account is verified and eligible for payouts to payment apps. 
                    {earnings?.instant_payout_enabled 
                      ? ' Instant payouts are enabled.'
                      : ' Contact support to enable instant payouts.'
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}