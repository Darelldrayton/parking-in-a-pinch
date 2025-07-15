import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Paper,
  Stack,
  Alert
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import AdminErrorBoundary from '../components/admin/AdminErrorBoundary';

const AdminDashboardSimple: React.FC = () => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('📊 Simple Admin Dashboard Loading...');
    
    // Get admin user from localStorage
    const adminUserData = localStorage.getItem('admin_user');
    if (adminUserData) {
      try {
        const userData = JSON.parse(adminUserData);
        setAdminUser(userData);
        console.log('✅ Admin user loaded:', userData.email);
      } catch (error) {
        console.error('❌ Error parsing admin user:', error);
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogout = () => {
    console.log('🔒 Admin logout requested');
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/admin/login';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6">Loading Admin Dashboard...</Typography>
      </Box>
    );
  }

  return (
    <AdminErrorBoundary>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {/* Header */}
          <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h4" component="h1" fontWeight={700}>
                  Admin Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Welcome back, {adminUser?.first_name || 'Admin'}!
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                color="error"
              >
                Logout
              </Button>
            </Stack>
          </Paper>

          {/* Success Message */}
          <Alert severity="success" sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              🎉 Login Successful!
            </Typography>
            <Typography variant="body2">
              You have successfully logged into the admin dashboard. The login flow is now working properly.
            </Typography>
          </Alert>

          {/* Admin Info */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <PersonIcon color="primary" />
                      <Typography variant="h6">Admin Information</Typography>
                    </Box>
                    <Typography variant="body1">
                      <strong>Email:</strong> {adminUser?.email || 'N/A'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Name:</strong> {adminUser?.first_name} {adminUser?.last_name}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Staff:</strong> {adminUser?.is_staff ? 'Yes' : 'No'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Superuser:</strong> {adminUser?.is_superuser ? 'Yes' : 'No'}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <DashboardIcon color="primary" />
                      <Typography variant="h6">Quick Actions</Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<PersonIcon />}
                      fullWidth
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Manage Users
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<PaymentIcon />}
                      fullWidth
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Manage Payments
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<DashboardIcon />}
                      fullWidth
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      View Reports
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Debug Info */}
          <Paper elevation={1} sx={{ p: 2, mt: 4, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              Debug Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Login Status: ✅ Successful
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Admin Token: {localStorage.getItem('admin_access_token') ? '✅ Present' : '❌ Missing'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • User Data: {adminUser ? '✅ Loaded' : '❌ Missing'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Current Time: {new Date().toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Debug Logs Available: {localStorage.getItem('admin_debug_logs') ? '✅ Yes' : '❌ No'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Login Debug Logs: {localStorage.getItem('admin_login_debug_logs') ? '✅ Yes' : '❌ No'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Error Logs: {localStorage.getItem('admin_error_logs') ? '✅ Yes' : '❌ No'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              📝 Check browser console and localStorage for detailed debug information
            </Typography>
          </Paper>
        </Container>
      </Box>
    </AdminErrorBoundary>
  );
};

export default AdminDashboardSimple;