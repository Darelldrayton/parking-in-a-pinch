import React from 'react';
import { Typography, Container } from '@mui/material';

const Bookings: React.FC = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Bookings Management
      </Typography>
      <Typography variant="body1">
        Coming soon - View and manage bookings for your listings.
      </Typography>
    </Container>
  );
};

export default Bookings;