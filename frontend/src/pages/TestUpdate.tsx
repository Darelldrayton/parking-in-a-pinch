import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const TestUpdate: React.FC = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h3">🎉 Update Test Page</Typography>
        <Typography variant="h5" sx={{ mt: 2 }}>
          Deployment Time: {new Date().toLocaleString()}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          If you can see this page, the deployment pipeline is working!
        </Typography>
      </Paper>
    </Box>
  );
};

export default TestUpdate;