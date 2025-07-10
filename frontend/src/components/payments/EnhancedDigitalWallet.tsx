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

  // Check available payment methods
  useEffect(() => {
    const checkPaymentMethods = async () => {
      try {
        const methods = await mobilePaymentService.getAvailablePaymentMethods();
        setAvailablePayments(methods);
        
        console.log('Available payment methods:', methods);
      } catch (error) {
        console.error('Error checking payment methods:', error);
      } finally {
        setChecking(false);
      }
    };

    checkPaymentMethods();
  }, []);

  const handleApplePay = async () => {
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
                  bgcolor: '#000',
                  color: 'white',
                  py: 1.5,
                  '&:hover': { bgcolor: '#333' },
                  '&.Mui-disabled': { bgcolor: '#ccc' },
                }}
                size="large"
              >
                {loading ? 'Processing...' : 'Pay with Apple Pay'}
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
                  bgcolor: '#4285F4',
                  color: 'white',
                  py: 1.5,
                  '&:hover': { bgcolor: '#3367D6' },
                  '&.Mui-disabled': { bgcolor: '#ccc' },
                }}
                size="large"
              >
                {loading ? 'Processing...' : 'Pay with Google Pay'}
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
                label="Apple Pay"
                size="small"
                variant="outlined"
              />
            )}
            {availablePayments.googlePay && (
              <Chip
                icon={<Android sx={{ fontSize: 16 }} />}
                label="Google Pay"
                size="small"
                variant="outlined"
              />
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default EnhancedDigitalWallet;