import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import NotificationManager from './NotificationManager';
import ErrorBoundary from '../ErrorBoundary';

/**
 * Test wrapper for NotificationManager to help debug the "something went wrong" issue
 * This component helps isolate and test the notifications tab functionality
 */
const NotificationManagerTestWrapper: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Notification Manager Test
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Testing the NotificationManager component for crashes. This should not show "Something went wrong".
      </Alert>
      
      <ErrorBoundary>
        <NotificationManager />
      </ErrorBoundary>
    </Box>
  );
};

export default NotificationManagerTestWrapper;