import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import CheckoutFlow from '../components/payment/CheckoutFlow';
import toast from 'react-hot-toast';

interface CheckoutData {
  listing: any;
  formData: any;
  pricing: any;
}

const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);

  useEffect(() => {
    // Get checkout data from navigation state
    const data = location.state as CheckoutData;
    
    if (!data || !data.listing || !data.formData || !data.pricing) {
      toast.error('Missing checkout data. Please try booking again.');
      navigate('/listings');
      return;
    }

    setCheckoutData(data);
  }, [location.state, navigate]);

  const handleBack = () => {
    navigate(-1); // Go back to the booking form
  };

  const handleSuccess = () => {
    toast.success('Booking created successfully!');
    navigate('/my-bookings');
  };

  const handleCancel = () => {
    navigate('/listings');
  };

  if (!checkoutData) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography>Loading checkout...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <CheckoutFlow
        bookingData={checkoutData}
        onBack={handleBack}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </Container>
  );
};

export default Checkout;