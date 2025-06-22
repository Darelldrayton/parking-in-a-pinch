import React, { useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogContent,
  Alert,
  Stack,
} from '@mui/material';
import PaymentForm from '../components/payments/PaymentForm';

const PaymentDebug: React.FC = () => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [testData, setTestData] = useState({
    amount: 25.50,
    bookingId: 123,
    description: 'Test Parking Payment'
  });

  const handlePaymentSuccess = () => {
    console.log('Payment succeeded!');
    setShowPaymentForm(false);
    alert('Payment succeeded!');
  };

  const handlePaymentCancel = () => {
    console.log('Payment cancelled');
    setShowPaymentForm(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Payment Debug Page
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This page is for debugging the PaymentForm component.
      </Alert>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="h6">Test Payment Form</Typography>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Amount: ${testData.amount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Booking ID: {testData.bookingId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Description: {testData.description}
              </Typography>
            </Box>

            <Button 
              variant="contained" 
              onClick={() => setShowPaymentForm(true)}
              sx={{ alignSelf: 'flex-start' }}
            >
              Open Payment Form
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog 
        open={showPaymentForm} 
        onClose={() => setShowPaymentForm(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            overflow: 'visible'
          }
        }}
      >
        <DialogContent sx={{ p: 0, overflow: 'visible' }}>
          <PaymentForm
            amount={testData.amount}
            bookingId={testData.bookingId}
            description={testData.description}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default PaymentDebug;