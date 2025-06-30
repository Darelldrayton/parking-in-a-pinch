import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  Paper,
  Stack,
  Chip,
  useTheme,
  alpha,
  LinearProgress,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assessment,
  People,
  LocalParking,
  Payment,
  Security,
  AdminPanelSettings,
  ExitToApp,
  Refresh,
  Home,
} from '@mui/icons-material';

const AdminDashboardSimple: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🛡️ Simple Admin Dashboard: Checking authentication...');
    const adminUserStr = localStorage.getItem('admin_user');
    const adminToken = localStorage.getItem('admin_access_token');
    
    if (!adminUserStr || !adminToken) {
      console.log('❌ No admin credentials found, redirecting to login');
      window.location.href = '/ruler/login';
      return;
    }
    
    try {
      const user = JSON.parse(adminUserStr);
      console.log('✅ Admin user loaded:', user.email);
      setAdminUser(user);
    } catch (e) {
      console.error('❌ Error parsing admin user data:', e);
      window.location.href = '/ruler/login';
      return;
    }
    
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    navigate('/ruler/login');
  };

  if (loading || !adminUser) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Loading Admin Dashboard...
        </Typography>
        <LinearProgress sx={{ width: '50%', mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Initializing admin panel
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          py: 3,
          px: 3,
        }}
      >
        <Container maxWidth="xl">
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                🛡️ Admin Dashboard
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                Welcome back, {adminUser?.first_name || adminUser?.email}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Home />}
                onClick={() => navigate('/dashboard')}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Main Dashboard
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExitToApp />}
                onClick={handleLogout}
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Logout
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Success Alert */}
        <Alert severity="success" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            🎯 Admin Panel Access Confirmed
          </Typography>
          <Typography variant="body2">
            You have successfully accessed the admin dashboard as the owner account ({adminUser.email}).
            Admin privileges are fully active.
          </Typography>
        </Alert>

        {/* Admin Status Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'success.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AdminPanelSettings sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Admin Panel Successfully Loaded
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  All admin functionalities are available. You can now manage users, listings, and system settings.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label="Owner Account" color="success" />
                  <Chip label="Full Access" color="primary" />
                  <Chip label="All Permissions" color="secondary" />
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Admin Features Grid */}
        <Grid container spacing={4}>
          {[
            {
              title: 'User Management',
              description: 'Manage user accounts, verification, and permissions',
              icon: <People sx={{ fontSize: 40 }} />,
              color: 'primary',
              action: () => navigate('/admin/users'),
            },
            {
              title: 'Listing Management',
              description: 'Review and manage parking space listings',
              icon: <LocalParking sx={{ fontSize: 40 }} />,
              color: 'secondary',
              action: () => navigate('/admin/listings'),
            },
            {
              title: 'Payment Oversight',
              description: 'Monitor payments, refunds, and financial data',
              icon: <Payment sx={{ fontSize: 40 }} />,
              color: 'success',
              action: () => navigate('/admin/payments'),
            },
            {
              title: 'System Analytics',
              description: 'View comprehensive system statistics and reports',
              icon: <Assessment sx={{ fontSize: 40 }} />,
              color: 'info',
              action: () => navigate('/admin/analytics'),
            },
            {
              title: 'Security Center',
              description: 'Monitor system security and user safety',
              icon: <Security sx={{ fontSize: 40 }} />,
              color: 'warning',
              action: () => navigate('/admin/security'),
            },
            {
              title: 'System Settings',
              description: 'Configure system-wide settings and preferences',
              icon: <DashboardIcon sx={{ fontSize: 40 }} />,
              color: 'error',
              action: () => navigate('/admin/settings'),
            },
          ].map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
                onClick={feature.action}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: `${feature.color}.light`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      color: `${feature.color}.main`,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Paper sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Quick Actions
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Refresh Dashboard
            </Button>
            <Button
              variant="outlined"
              startIcon={<Home />}
              onClick={() => navigate('/dashboard')}
            >
              Return to Main Dashboard
            </Button>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={() => navigate('/system-monitoring')}
            >
              System Monitoring
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminDashboardSimple;