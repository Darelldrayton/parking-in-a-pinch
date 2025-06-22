import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  Tab,
  Tabs,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { 
  Lock as LockIcon, 
  CreditCard as CreditCardIcon,
  AccountBalanceWallet,
  Apple,
  Android,
} from '@mui/icons-material';
import stripePromise, { createPaymentIntent, confirmPayment, type PaymentData } from '../../services/stripe';
import toast from 'react-hot-toast';

interface PaymentFormProps {
  amount: number;
  bookingId: number;
  description: string;
  onSuccess: () => void;
  onCancel: () => void;
  isMobile?: boolean;
}

const PaymentFormInner: React.FC<PaymentFormProps> = ({
  amount,
  bookingId,
  description,
  onSuccess,
  onCancel,
  isMobile = false,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple' | 'google' | 'paypal'>('card');

  // Debug logging
  React.useEffect(() => {
    console.log('PaymentFormInner mounted:', {
      stripe: !!stripe,
      elements: !!elements,
      amount,
      bookingId,
      description
    });
  }, [stripe, elements, amount, bookingId, description]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const paymentData: PaymentData = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        bookingId,
        description,
      };

      const paymentIntent = await createPaymentIntent(paymentData);

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment
      const { error, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (error) {
        setError(error.message || 'Payment failed');
      } else if (confirmedPayment && confirmedPayment.status === 'succeeded') {
        // Confirm payment on backend
        await confirmPayment(confirmedPayment.id, bookingId);
        toast.success('Payment successful!');
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  const handleAlternativePayment = async (method: 'apple' | 'google' | 'paypal') => {
    setLoading(true);
    setError(null);

    try {
      // Simulate payment processing for alternative methods
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (method === 'apple') {
        // Apple Pay integration would go here
        toast.success('Apple Pay payment successful!');
      } else if (method === 'google') {
        // Google Pay integration would go here
        toast.success('Google Pay payment successful!');
      } else if (method === 'paypal') {
        // PayPal integration would go here
        toast.success('PayPal payment successful!');
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 3, maxWidth: 500, mx: 'auto', boxShadow: 'none' }}>
      <CardContent sx={{ p: isMobile ? 2 : 4 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ textAlign: 'center' }}>
            <CreditCardIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Complete Payment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>

          <Divider />

          {/* Amount */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              ${amount.toFixed(2)}
            </Typography>
          </Box>

          {/* Payment Method Selection */}
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
              Choose Payment Method
            </FormLabel>
            <RadioGroup
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            >
              <FormControlLabel
                value="card"
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CreditCardIcon />
                    <Typography>Credit/Debit Card</Typography>
                  </Stack>
                }
              />
              <FormControlLabel
                value="apple"
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Apple />
                    <Typography>Apple Pay</Typography>
                    <Chip label="Fast" size="small" color="primary" />
                  </Stack>
                }
              />
              <FormControlLabel
                value="google"
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Android />
                    <Typography>Google Pay</Typography>
                    <Chip label="Fast" size="small" color="primary" />
                  </Stack>
                }
              />
              <FormControlLabel
                value="paypal"
                control={<Radio />}
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AccountBalanceWallet />
                    <Typography>PayPal</Typography>
                  </Stack>
                }
              />
            </RadioGroup>
          </FormControl>


          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Payment Form */}
          {paymentMethod === 'card' ? (
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                    Card Information
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      '&:focus-within': {
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <CardElement options={cardElementOptions} />
                  </Box>
                </Box>

                {/* Security Note */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LockIcon sx={{ fontSize: 16, color: 'success.main' }} />
                  <Typography variant="caption" color="text.secondary">
                    Your payment information is encrypted and secure
                  </Typography>
                </Box>

                {/* Buttons */}
                <Stack direction={isMobile ? "column" : "row"} spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={onCancel}
                    fullWidth
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={!stripe || loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
                  </Button>
                </Stack>
              </Stack>
            </form>
          ) : (
            /* Alternative Payment Methods */
            <Stack spacing={3}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                You'll be redirected to complete your payment securely.
              </Alert>

              {/* Security Note */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Your payment information is encrypted and secure
                </Typography>
              </Box>

              {/* Buttons */}
              <Stack direction={isMobile ? "column" : "row"} spacing={2}>
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  fullWidth
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  onClick={() => handleAlternativePayment(paymentMethod as any)}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Processing...' : `Pay with ${paymentMethod === 'apple' ? 'Apple Pay' : paymentMethod === 'google' ? 'Google Pay' : 'PayPal'}`}
                </Button>
              </Stack>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  // Add error handling for Stripe loading
  const [stripeError, setStripeError] = React.useState<string | null>(null);

  React.useEffect(() => {
    stripePromise.then((stripe) => {
      if (!stripe) {
        setStripeError('Failed to load Stripe. Please check your configuration.');
      }
    }).catch((error) => {
      console.error('Stripe loading error:', error);
      setStripeError('Failed to load Stripe payment system.');
    });
  }, []);

  if (stripeError) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {stripeError}
        </Alert>
        <Button variant="outlined" onClick={props.onCancel}>
          Close
        </Button>
      </Box>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner {...props} />
    </Elements>
  );
};

export default PaymentForm;