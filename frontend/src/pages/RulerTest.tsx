import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const RulerTest: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h2">👑 Ruler Routes Test</Typography>
      <Typography variant="h5" sx={{ mt: 2, mb: 4 }}>
        This page confirms /ruler routes are working
      </Typography>
      
      <Stack spacing={2} sx={{ maxWidth: 400, mx: 'auto' }}>
        <Button 
          variant="contained" 
          size="large"
          onClick={() => navigate('/ruler/login')}
        >
          Go to /ruler/login
        </Button>
        
        <Button 
          variant="contained" 
          size="large"
          onClick={() => navigate('/ruler/dashboard')}
        >
          Go to /ruler/dashboard
        </Button>
        
        <Button 
          variant="contained" 
          size="large"
          onClick={() => navigate('/ruler/cleanup-listings')}
        >
          Go to /ruler/cleanup-listings
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={() => navigate('/admin/login')}
        >
          Try /admin/login (comparison)
        </Button>
      </Stack>
      
      <Typography variant="body2" sx={{ mt: 4 }}>
        Current path: {window.location.pathname}
      </Typography>
    </Box>
  );
};

export default RulerTest;