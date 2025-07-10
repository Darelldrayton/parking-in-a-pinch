import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Alert,
  Paper,
  Chip,
  Grid,
} from '@mui/material';
import {
  Apple,
  Android,
  CreditCard,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import EnhancedDigitalWallet from '../components/payments/EnhancedDigitalWallet';
import PaymentForm from '../components/payments/PaymentForm';
import mobilePaymentService from '../services/mobilePayments';

const PaymentTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDigitalWallet, setShowDigitalWallet] = useState(false);

  const runPaymentMethodTests = async () => {
    const results = [];
    
    try {
      // Test 1: Check if Payment Request API is available
      const hasPaymentRequest = !!window.PaymentRequest;
      results.push({
        test: 'Payment Request API',
        result: hasPaymentRequest,
        message: hasPaymentRequest ? 'Available' : 'Not supported in this browser'
      });

      // Test 2: Check Apple Pay availability
      const applePayAvailable = await mobilePaymentService.isApplePayAvailable();
      results.push({
        test: 'Apple Pay',
        result: applePayAvailable,
        message: applePayAvailable ? 'Available' : 'Not available on this device'
      });

      // Test 3: Check Google Pay availability
      const googlePayAvailable = await mobilePaymentService.isGooglePayAvailable();
      results.push({
        test: 'Google Pay',
        result: googlePayAvailable,
        message: googlePayAvailable ? 'Available' : 'Not available on this device'
      });

      // Test 4: Get all available methods
      const availableMethods = await mobilePaymentService.getAvailablePaymentMethods();
      results.push({
        test: 'Available Methods',
        result: true,
        message: `Apple Pay: ${availableMethods.applePay}, Google Pay: ${availableMethods.googlePay}, Web Payments: ${availableMethods.webPayments}`
      });

      // Test 5: Check device type
      const isMobile = mobilePaymentService.isMobileDevice();
      const recommended = mobilePaymentService.getRecommendedPaymentMethod();
      results.push({
        test: 'Device Detection',
        result: true,
        message: `Mobile: ${isMobile}, Recommended: ${recommended}`
      });

    } catch (error) {
      results.push({
        test: 'Error',
        result: false,
        message: error.message
      });
    }

    setTestResults(results);
  };

  const mockBookingData = {
    amount: 25.99,
    bookingId: 123,
    description: 'Test Parking Booking - Downtown Spot'
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Apple Pay & Google Pay Test Page
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Test the enhanced digital wallet payment functionality
      </Typography>

      <Grid container spacing={3}>
        {/* Test Results */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Payment Method Tests
              </Typography>
              
              <Button 
                variant="contained" 
                onClick={runPaymentMethodTests}
                sx={{ mb: 3 }}
              >
                Run Tests
              </Button>

              <Stack spacing={2}>
                {testResults.map((result, index) => (
                  <Paper key={index} sx={{ p: 2 }} variant="outlined">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {result.result ? (
                        <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                      ) : (
                        <Error sx={{ color: 'error.main', fontSize: 20 }} />
                      )}
                      <Typography variant="subtitle2" fontWeight="bold">
                        {result.test}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {result.message}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Components Test */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Payment Components
              </Typography>
              
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => setShowDigitalWallet(true)}
                  startIcon={<Apple />}
                >
                  Test Enhanced Digital Wallet
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => setShowPaymentForm(true)}
                  startIcon={<CreditCard />}
                >
                  Test Full Payment Form
                </Button>

                {/* Mock booking info */}
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Mock Booking Data:
                  </Typography>
                  <Typography variant="body2">Amount: ${mockBookingData.amount}</Typography>
                  <Typography variant="body2">Booking ID: {mockBookingData.bookingId}</Typography>
                  <Typography variant="body2">Description: {mockBookingData.description}</Typography>
                </Paper>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Environment Variables */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Configuration Status
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Chip
                    label={`Stripe Key: ${import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? '✓ Set' : '✗ Missing'}`}
                    color={import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Chip
                    label={`Apple Pay ID: ${import.meta.env.VITE_APPLE_PAY_MERCHANT_ID ? '✓ Set' : '✗ Missing'}`}
                    color={import.meta.env.VITE_APPLE_PAY_MERCHANT_ID ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Chip
                    label={`Google Pay ID: ${import.meta.env.VITE_GOOGLE_PAY_MERCHANT_ID ? '✓ Set' : '✗ Missing'}`}
                    color={import.meta.env.VITE_GOOGLE_PAY_MERCHANT_ID ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Chip
                    label={`API Base: ${import.meta.env.VITE_API_BASE_URL ? '✓ Set' : '✗ Missing'}`}
                    color={import.meta.env.VITE_API_BASE_URL ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Digital Wallet Modal */}
      {showDigitalWallet && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            p: 2,
          }}
          onClick={() => setShowDigitalWallet(false)}
        >
          <Box onClick={(e) => e.stopPropagation()}>
            <EnhancedDigitalWallet
              {...mockBookingData}
              onSuccess={() => {
                setShowDigitalWallet(false);
                alert('Payment successful!');
              }}
              onFallback={() => {
                setShowDigitalWallet(false);
                setShowPaymentForm(true);
              }}
            />
          </Box>
        </Box>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            p: 2,
          }}
          onClick={() => setShowPaymentForm(false)}
        >
          <Box onClick={(e) => e.stopPropagation()}>
            <PaymentForm
              {...mockBookingData}
              onSuccess={() => {
                setShowPaymentForm(false);
                alert('Payment successful!');
              }}
              onCancel={() => setShowPaymentForm(false)}
              isMobile={window.innerWidth < 768}
            />
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default PaymentTest;