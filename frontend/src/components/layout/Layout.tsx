import React from 'react';
import { Box, Container } from '@mui/material';
import Navigation from './Navigation';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disablePadding?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, maxWidth = 'lg', disablePadding = false }) => {
  const { user } = useAuth();
  const isHost = user?.userType === 'host';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation isHost={isHost} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          py: disablePadding ? 0 : { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Container maxWidth={maxWidth} sx={{ px: disablePadding ? 0 : undefined }}>
          {children}
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;