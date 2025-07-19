import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { 
  Apple, 
  Android,
  CreditCard, 
  Security,
  CheckCircle 
} from '@mui/icons-material';
import { loadStripe } from '@stripe/stripe-js';
import toast from 'react-hot-toast';
import mobilePaymentService from '../../services/mobilePayments';

interface EnhancedDigitalWalletProps {
  amount: number;
  bookingId: number;
  description: string;
  onSuccess: () => void;
  onFallback: () => void;
}

const EnhancedDigitalWallet: React.FC<EnhancedDigitalWalletProps> = ({
  amount,
  bookingId,
  description,
  onSuccess,
  onFallback,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePayments, setAvailablePayments] = useState({
    applePay: false,
    googlePay: false,
    webPayments: false,
  });
  const [checking, setChecking] = useState(true);
  
  // Check if digital wallets are enabled via environment variables
  const isApplePayEnabled = import.meta.env.VITE_APPLE_PAY_ENABLED === 'true';
  const isGooglePayEnabled = import.meta.env.VITE_GOOGLE_PAY_ENABLED === 'true';
  const hasApplePayCredentials = !!import.meta.env.VITE_APPLE_PAY_MERCHANT_ID;
  const hasGooglePayCredentials = !!import.meta.env.VITE_GOOGLE_PAY_MERCHANT_ID;

  // Check available payment methods
  useEffect(() => {
    const checkPaymentMethods = async () => {
      try {
        // Only check actual availability if credentials are provided and enabled
        if (isApplePayEnabled && hasApplePayCredentials && isGooglePayEnabled && hasGooglePayCredentials) {
          const methods = await mobilePaymentService.getAvailablePaymentMethods();
          setAvailablePayments(methods);
        } else {
          // Show as available for UI purposes, but we'll handle the "coming soon" state
          setAvailablePayments({
            applePay: true, // Always show as available for UI
            googlePay: true, // Always show as available for UI
            webPayments: !!window.PaymentRequest,
          });
        }
        
        console.log('Payment method check complete');
      } catch (error) {
        console.error('Error checking payment methods:', error);
        // Fallback to showing options anyway
        setAvailablePayments({
          applePay: true,
          googlePay: true,
          webPayments: !!window.PaymentRequest,
        });
      } finally {
        setChecking(false);
      }
    };

    checkPaymentMethods();
  }, [isApplePayEnabled, hasApplePayCredentials, isGooglePayEnabled, hasGooglePayCredentials]);

  const handleApplePay = async () => {
    // Check if Apple Pay is fully configured
    if (!isApplePayEnabled || !hasApplePayCredentials) {
      toast.info('Apple Pay is coming soon! We\'re working on adding this payment option.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config = mobilePaymentService.createBookingPaymentConfig(
        amount,
        'USD',
        description
      );

      const initialized = await mobilePaymentService.initializeApplePay(config);
      
      if (!initialized) {
        throw new Error('Failed to initialize Apple Pay');
      }

      const result = await mobilePaymentService.processPayment();
      
      if (result.success) {
        toast.success('Apple Pay payment successful!');
        onSuccess();
      } else {
        throw new Error(result.error || 'Apple Pay payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Apple Pay payment failed');
      toast.error('Apple Pay payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePay = async () => {
    // Check if Google Pay is fully configured
    if (!isGooglePayEnabled || !hasGooglePayCredentials) {
      toast.info('Google Pay is coming soon! We\'re working on adding this payment option.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const config = mobilePaymentService.createBookingPaymentConfig(
        amount,
        'USD',
        description
      );

      const initialized = await mobilePaymentService.initializeGooglePay(config);
      
      if (!initialized) {
        throw new Error('Failed to initialize Google Pay');
      }

      const result = await mobilePaymentService.processPayment();
      
      if (result.success) {
        toast.success('Google Pay payment successful!');
        onSuccess();
      } else {
        throw new Error(result.error || 'Google Pay payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Google Pay payment failed');
      toast.error('Google Pay payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStripePaymentRequest = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load Stripe
      const stripe = await loadStripe(
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
        'pk_test_51RZFGKIn7MlQnCgsh4RzLG68rWHCR3zh08NWEVfvm3kZh8M2i4jOvIOR7tFgMFlbdsBUbFohFqemLZ3k4FnhOhXT00krFrBl5c'
      );

      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // Create payment request
      const paymentRequest = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: description,
          amount: Math.round(amount * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      // Check if payment request is available
      const result = await paymentRequest.canMakePayment();
      
      if (!result) {
        throw new Error('Payment Request API not supported');
      }

      // Show payment sheet
      const { paymentMethod, error: pmError } = await new Promise<any>((resolve) => {
        paymentRequest.on('paymentmethod', (ev) => {
          resolve({ paymentMethod: ev.paymentMethod, error: null });
        });
        
        paymentRequest.show().catch((error) => {
          resolve({ paymentMethod: null, error });
        });
      });

      if (pmError) {
        throw new Error(pmError.message || 'Payment cancelled');
      }

      // Process payment on backend
      const apiUrl = import.meta.env.VITE_API_BASE_URL 
        ? `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_VERSION || 'v1'}`
        : '/api/v1';

      const response = await fetch(`${apiUrl}/payments/v2/create-payment-intent/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();

      // Confirm payment
      const { error: confirmError } = await stripe.confirmCardPayment(client_secret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment confirmation failed');
      }

      toast.success('Payment successful!');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Card sx={{ borderRadius: 3, maxWidth: 500, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Checking available payment methods...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const hasDigitalWallets = availablePayments.applePay || availablePayments.googlePay || availablePayments.webPayments;

  if (!hasDigitalWallets) {
    return (
      <Card sx={{ borderRadius: 3, maxWidth: 500, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Payment Options
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Digital wallets are not available on this device
              </Typography>
            </Box>
            
            <Divider />
            
            <Button
              variant="contained"
              fullWidth
              onClick={onFallback}
              startIcon={<CreditCard />}
              size="large"
            >
              Pay with Card
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, maxWidth: 500, mx: 'auto' }}>
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={3}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Express Checkout
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pay quickly with your digital wallet
            </Typography>
          </Box>

          <Divider />

          {/* Amount */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              ${amount.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            {/* Apple Pay */}
            {availablePayments.applePay && (
              <Button
                variant="contained"
                fullWidth
                onClick={handleApplePay}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Apple />}
                sx={{
                  bgcolor: isApplePayEnabled && hasApplePayCredentials ? '#000' : '#999',
                  color: 'white',
                  py: 1.5,
                  '&:hover': { 
                    bgcolor: isApplePayEnabled && hasApplePayCredentials ? '#333' : '#777' 
                  },
                  '&.Mui-disabled': { bgcolor: '#ccc' },
                  position: 'relative',
                }}
                size="large"
              >
                {loading ? 'Processing...' : 
                 isApplePayEnabled && hasApplePayCredentials ? 'Pay with Apple Pay' : 'Apple Pay - Coming Soon'}
                {(!isApplePayEnabled || !hasApplePayCredentials) && (
                  <Chip
                    label="Soon"
                    size="small"
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'warning.main',
                      color: 'white',
                      fontSize: '0.7rem',
                    }}
                  />
                )}
              </Button>
            )}

            {/* Google Pay */}
            {availablePayments.googlePay && (
              <Button
                variant="contained"
                fullWidth
                onClick={handleGooglePay}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Android />}
                sx={{
                  bgcolor: isGooglePayEnabled && hasGooglePayCredentials ? '#4285F4' : '#999',
                  color: 'white',
                  py: 1.5,
                  '&:hover': { 
                    bgcolor: isGooglePayEnabled && hasGooglePayCredentials ? '#3367D6' : '#777' 
                  },
                  '&.Mui-disabled': { bgcolor: '#ccc' },
                  position: 'relative',
                }}
                size="large"
              >
                {loading ? 'Processing...' : 
                 isGooglePayEnabled && hasGooglePayCredentials ? 'Pay with Google Pay' : 'Google Pay - Coming Soon'}
                {(!isGooglePayEnabled || !hasGooglePayCredentials) && (
                  <Chip
                    label="Soon"
                    size="small"
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'warning.main',
                      color: 'white',
                      fontSize: '0.7rem',
                    }}
                  />
                )}
              </Button>
            )}

            {/* Stripe Payment Request (fallback for other digital wallets) */}
            {availablePayments.webPayments && !availablePayments.applePay && !availablePayments.googlePay && (
              <Button
                variant="contained"
                fullWidth
                onClick={handleStripePaymentRequest}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Security />}
                sx={{ py: 1.5 }}
                size="large"
              >
                {loading ? 'Processing...' : 'Pay with Digital Wallet'}
              </Button>
            )}
          </Stack>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          )}

          <Divider>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Button
            variant="outlined"
            fullWidth
            onClick={onFallback}
            startIcon={<CreditCard />}
            size="large"
            disabled={loading}
          >
            Pay with Card Instead
          </Button>

          {/* Security and Features */}
          <Stack spacing={1} sx={{ pt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption" color="text.secondary">
                Secured by Stripe • Touch ID / Face ID
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption" color="text.secondary">
                No payment info stored on this device
              </Typography>
            </Box>
          </Stack>

          {/* Supported Methods */}
          <Stack direction="row" spacing={1} justifyContent="center" sx={{ pt: 1 }}>
            {availablePayments.applePay && (
              <Chip
                icon={<Apple sx={{ fontSize: 16 }} />}
                label={isApplePayEnabled && hasApplePayCredentials ? "Apple Pay" : "Apple Pay (Soon)"}
                size="small"
                variant="outlined"
                color={isApplePayEnabled && hasApplePayCredentials ? "default" : "warning"}
              />
            )}
            {availablePayments.googlePay && (
              <Chip
                icon={<Android sx={{ fontSize: 16 }} />}
                label={isGooglePayEnabled && hasGooglePayCredentials ? "Google Pay" : "Google Pay (Soon)"}
                size="small"
                variant="outlined"
                color={isGooglePayEnabled && hasGooglePayCredentials ? "default" : "warning"}
              />
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default EnhancedDigitalWallet;