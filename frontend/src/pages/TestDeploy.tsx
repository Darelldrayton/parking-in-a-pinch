import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TestDeploy: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h2">🚀 Deployment Test Page</Typography>
      <Typography variant="h5" sx={{ mt: 2 }}>
        Timestamp: {new Date().toLocaleString()}
      </Typography>
      <Typography variant="h6" sx={{ mt: 2, color: 'success.main' }}>
        ✅ If you can see this, deployment is working!
      </Typography>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Test the fixes:</Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/ruler/login')}
          sx={{ m: 1 }}
        >
          Test /ruler/login Route
        </Button>
        <Button 
          variant="contained" 
          onClick={() => navigate('/book/1')}
          sx={{ m: 1 }}
        >
          Test Booking Times
        </Button>
        <Button 
          variant="contained" 
          onClick={() => navigate('/listings')}
          sx={{ m: 1 }}
        >
          Test Neighborhood Display
        </Button>
      </Box>
      
      <Typography variant="body2" sx={{ mt: 4 }}>
        Build ID: DEPLOY_TEST_2024_12_23_18_05
      </Typography>
    </Box>
  );
};

export default TestDeploy;