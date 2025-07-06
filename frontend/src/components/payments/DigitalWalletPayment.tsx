import React, { useState, useEffect } from 'react';
import {
  PaymentRequestButtonElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
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
} from '@mui/material';
import { Apple, Google, CreditCard } from '@mui/icons-material';
import { PaymentRequest } from '@stripe/stripe-js';
import toast from 'react-hot-toast';

interface DigitalWalletPaymentProps {
  amount: number;
  bookingId: number;
  description: string;
  onSuccess: () => void;
  onFallback: () => void;
}

const DigitalWalletPayment: React.FC<DigitalWalletPaymentProps> = ({
  amount,
  bookingId,
  description,
  onSuccess,
  onFallback,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe || !elements) {
      return;
    }

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: description,
        amount: Math.round(amount * 100), // Convert to cents
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    // Check if the browser supports payment request API
    pr.canMakePayment().then(result => {
      if (result) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }
    });

    // Handle payment method
    pr.on('paymentmethod', async (ev) => {
      setLoading(true);
      setError(null);

      try {
        // Get API base URL - always use relative path for production compatibility
        const apiUrl = import.meta.env.VITE_API_BASE_URL 
          ? `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_VERSION || 'v1'}`
          : '/api/v1';  // Always use relative path - works in both dev and production

        // Create payment intent on backend
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

        // Confirm payment with Stripe
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          client_secret,
          {
            payment_method: ev.paymentMethod.id,
          },
          { handleActions: false }
        );

        if (confirmError) {
          // Report to the browser that the payment failed
          ev.complete('fail');
          setError(confirmError.message || 'Payment failed');
          toast.error('Payment failed. Please try again.');
        } else {
          // Report to the browser that the payment was successful
          ev.complete('success');
          
          // Confirm payment on backend
          await fetch(`${apiUrl}/payments/v2/confirm-real-payment/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: JSON.stringify({
              payment_intent_id: paymentIntent!.id,
              booking_id: bookingId,
            }),
          });

          toast.success('Payment successful!');
          onSuccess();
        }
      } catch (err: any) {
        ev.complete('fail');
        setError(err.message || 'Payment failed');
        toast.error('Payment failed. Please try again.');
      } finally {
        setLoading(false);
      }
    });
  }, [stripe, elements, amount, bookingId, description, onSuccess]);

  if (!canMakePayment) {
    return (
      <Card sx={{ borderRadius: 3, maxWidth: 500, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Payment Options
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Apple Pay and Google Pay are not available on this device
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
              Pay quickly with your saved cards
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

          {/* Payment Request Button */}
          {paymentRequest && (
            <Box sx={{ 
              p: 2, 
              border: 1, 
              borderColor: 'divider', 
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}>
              <PaymentRequestButtonElement
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      type: 'default',
                      theme: 'dark',
                      height: '48px',
                    },
                  },
                }}
              />
            </Box>
          )}

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
          >
            Pay with Card Instead
          </Button>

          {/* Device Support Info */}
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ pt: 2 }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Apple sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Apple Pay
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Google sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Google Pay
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default DigitalWalletPayment;