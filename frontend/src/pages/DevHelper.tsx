import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Divider,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import authService from '../services/auth';

const DevHelper: React.FC = () => {
  const [email, setEmail] = useState('darelldrayton93@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handlePasswordReset = async () => {
    setIsLoading(true);
    try {
      await authService.resetPassword(email);
      enqueueSnackbar(
        'Password reset request sent! Check the Django console for the reset link.',
        { variant: 'success' }
      );
    } catch (error: any) {
      enqueueSnackbar('Failed to send reset email', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Development Helper
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          This page helps with testing password reset functionality during development.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>How to test password reset:</strong>
            <br />
            1. Enter an email below and click "Send Reset Email"
            <br />
            2. Check the Django server console for the password reset link
            <br />
            3. Copy and paste the reset URL into your browser
            <br />
            4. Enter a new password on the reset page
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Password Reset
          </Typography>
          <TextField
            fullWidth
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handlePasswordReset}
            disabled={isLoading || !email}
            size="large"
          >
            {isLoading ? 'Sending...' : 'Send Reset Email'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Alert severity="warning">
          <Typography variant="body2">
            <strong>Note:</strong> This page is only for development purposes. 
            In production, password reset emails would be sent to the user's actual email address.
          </Typography>
        </Alert>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Accounts
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Test User:</strong> testuser@example.com (Password: securepassword123)
          </Typography>
          <Typography variant="body2">
            <strong>Your Account:</strong> darelldrayton93@gmail.com (Use password reset to access)
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default DevHelper;