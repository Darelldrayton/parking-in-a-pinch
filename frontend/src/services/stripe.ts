import { loadStripe } from '@stripe/stripe-js';

// Production Stripe configuration - key must be provided via environment variables
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripeKey || stripeKey.includes('YOUR_PRODUCTION_KEY_HERE')) {
  console.error('🚨 PRODUCTION ERROR: Stripe publishable key not configured. Please add your production Stripe key to environment variables.');
  console.error('💡 Set VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here in your .env file');
}

const stripePromise = loadStripe(stripeKey);

export default stripePromise;

export interface PaymentData {
  amount: number;
  currency: string;
  bookingId: number;
  description: string;
}

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

// Get API base URL - always use relative path for production compatibility
const getApiUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return `${import.meta.env.VITE_API_BASE_URL}/${import.meta.env.VITE_API_VERSION || 'v1'}`;
  }
  return '/api/v1';  // Always use relative path - works in both dev and production
};

export const createPaymentIntent = async (paymentData: PaymentData): Promise<PaymentIntent> => {
  // Backend expects only booking_id
  const backendPayload = {
    booking_id: paymentData.bookingId,
  };

  // Use Token format for DRF compatibility (same as api.ts)
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');

  const response = await fetch(`${getApiUrl()}/payments/v2/create-payment-intent/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    },
    body: JSON.stringify(backendPayload),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
};

export const confirmPayment = async (paymentIntentId: string, bookingId: number) => {
  // Use Token format for DRF compatibility (same as api.ts)
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');

  const response = await fetch(`${getApiUrl()}/payments/v2/confirm-real-payment/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    },
    body: JSON.stringify({ 
      payment_intent_id: paymentIntentId,
      booking_id: bookingId 
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to confirm payment');
  }

  return response.json();
};