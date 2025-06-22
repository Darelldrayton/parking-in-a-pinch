import React, { useState } from 'react';
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
  TextField,
} from '@mui/material';
import { Lock as LockIcon, CreditCard as CreditCardIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';

interface MockPaymentFormProps {
  amount: number;
  bookingId: number;
  description: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const MockPaymentForm: React.FC<MockPaymentFormProps> = ({
  amount,
  bookingId,
  description,
  onSuccess,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('4242424242424242');
  const [expiryDate, setExpiryDate] = useState('12/34');
  const [cvc, setCvc] = useState('123');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create payment intent
      const paymentIntentResponse = await fetch('http://127.0.0.1:8000/api/v1/payments/v2/create-payment-intent/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
          amount: amount,
          currency: 'usd',
          description,
        }),
      });

      if (!paymentIntentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const paymentIntentData = await paymentIntentResponse.json();
      console.log('Payment intent created:', paymentIntentData);

      // Step 2: Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Confirm mock payment
      const confirmResponse = await fetch('http://127.0.0.1:8000/api/v1/payments/v2/confirm-mock-payment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
          payment_intent_id: paymentIntentData.payment_intent_id,
        }),
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm payment');
      }

      const confirmData = await confirmResponse.json();
      console.log('Payment confirmed:', confirmData);

      toast.success('Payment successful! (Mock)');
      onSuccess();

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed');
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 3, maxWidth: 500, mx: 'auto', boxShadow: 'none' }}>
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={3}>
          {/* Header */}
          <Box sx={{ textAlign: 'center' }}>
            <CreditCardIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Complete Payment (Development Mode)
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

          {/* Development Notice */}
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Typography variant="body2">
              <strong>Development Mode:</strong> This is a mock payment system. 
              Use the pre-filled test card details or any valid format.
            </Typography>
          </Alert>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Payment Form */}
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 4242 4242 4242"
                fullWidth
                disabled={loading}
              />
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Expiry Date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="MM/YY"
                  fullWidth
                  disabled={loading}
                />
                <TextField
                  label="CVC"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder="123"
                  fullWidth
                  disabled={loading}
                />
              </Box>

              {/* Security Note */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockIcon sx={{ fontSize: 16, color: 'success.main' }} />
                <Typography variant="caption" color="text.secondary">
                  Mock payment system - no real charges will be made
                </Typography>
              </Box>

              {/* Buttons */}
              <Stack direction="row" spacing={2}>
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
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
                </Button>
              </Stack>
            </Stack>
          </form>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default MockPaymentForm;