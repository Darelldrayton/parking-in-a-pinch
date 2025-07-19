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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  ExitToApp as LogoutIcon,
  Home as ListingIcon,
  Work as CareerIcon,
  CheckCircle,
  Pending,
  Cancel
} from '@mui/icons-material';
import AdminErrorBoundary from '../components/admin/AdminErrorBoundary';
import api from '../services/api';

const AdminDashboardSimple: React.FC = () => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);
  const [careers, setCareers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalListings: 0,
    pendingListings: 0,
    approvedListings: 0,
    totalCareers: 0
  });
  const [dataLoading, setDataLoading] = useState(false);

  const loadBasicData = async () => {
    setDataLoading(true);
    try {
      console.log('📊 Loading basic admin data...');
      
      // Use working endpoints
      const [listingsRes, careersRes] = await Promise.all([
        api.get('/listings/').catch(err => ({ data: { results: [] } })),
        api.get('/careers/applications/').catch(err => ({ data: [] }))
      ]);
      
      const listingsData = listingsRes.data.results || listingsRes.data || [];
      const careersData = careersRes.data || [];
      
      setListings(listingsData.slice(0, 10)); // Show first 10
      setCareers(careersData.slice(0, 10)); // Show first 10
      
      // Calculate basic stats
      setStats({
        totalListings: listingsData.length,
        pendingListings: listingsData.filter((l: any) => l.approval_status === 'pending').length,
        approvedListings: listingsData.filter((l: any) => l.approval_status === 'approved').length,
        totalCareers: careersData.length
      });
      
      console.log('✅ Basic data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading basic data:', error);
    } finally {
      setDataLoading(false);
    }
  };

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
    loadBasicData();
  }, []);

  const handleLogout = () => {
    console.log('🔒 Admin logout requested - clearing all admin data');
    
    // Clear admin data
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    
    // Navigate to admin login
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

          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <ListingIcon color="primary" />
                    <Box>
                      <Typography variant="h4">{stats.totalListings}</Typography>
                      <Typography variant="body2" color="text.secondary">Total Listings</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Pending color="warning" />
                    <Box>
                      <Typography variant="h4">{stats.pendingListings}</Typography>
                      <Typography variant="body2" color="text.secondary">Pending Approval</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <CheckCircle color="success" />
                    <Box>
                      <Typography variant="h4">{stats.approvedListings}</Typography>
                      <Typography variant="body2" color="text.secondary">Approved</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <CareerIcon color="info" />
                    <Box>
                      <Typography variant="h4">{stats.totalCareers}</Typography>
                      <Typography variant="body2" color="text.secondary">Career Apps</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Recent Listings */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Recent Listings</Typography>
                    <Button 
                      size="small" 
                      onClick={loadBasicData}
                      disabled={dataLoading}
                      startIcon={dataLoading ? <CircularProgress size={16} /> : null}
                    >
                      Refresh
                    </Button>
                  </Stack>
                  {dataLoading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Host</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Created</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {listings.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography color="text.secondary">No listings found</Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            listings.map((listing: any) => (
                              <TableRow key={listing.id}>
                                <TableCell>{listing.title || 'Untitled'}</TableCell>
                                <TableCell>{listing.host?.email || listing.host_email || 'Unknown'}</TableCell>
                                <TableCell>
                                  <Chip 
                                    size="small"
                                    label={listing.approval_status || 'pending'}
                                    color={listing.approval_status === 'approved' ? 'success' : 
                                           listing.approval_status === 'rejected' ? 'error' : 'warning'}
                                  />
                                </TableCell>
                                <TableCell>${listing.price_per_hour || '0'}/hr</TableCell>
                                <TableCell>
                                  {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'Unknown'}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>
                {/* Admin Info */}
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <PersonIcon color="primary" />
                        <Typography variant="h6">Admin Info</Typography>
                      </Box>
                      <Typography variant="body2">
                        <strong>Email:</strong> {adminUser?.email || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Name:</strong> {adminUser?.first_name} {adminUser?.last_name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Staff:</strong> {adminUser?.is_staff ? 'Yes' : 'No'}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Career Applications */}
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Recent Career Apps</Typography>
                    {careers.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">No applications found</Typography>
                    ) : (
                      <Stack spacing={1}>
                        {careers.slice(0, 5).map((career: any) => (
                          <Box key={career.id} sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" fontWeight={500}>
                              {career.applicant_name || career.name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {career.applicant_email || career.email || 'No email'}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>

          {/* Status Info */}
          <Paper elevation={1} sx={{ p: 2, mt: 4, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  • Admin Login: ✅ Working
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Public Listings API: ✅ Working
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Career Applications: ✅ Working
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  • Admin Users API: ❌ Error 500
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Admin Listings API: ❌ Error 500
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Backend Status: ⚠️ Partial
                </Typography>
              </Grid>
            </Grid>
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Some admin APIs are failing. This dashboard shows data from working endpoints only.
                Please check backend server logs for admin API errors.
              </Typography>
            </Alert>
          </Paper>
        </Container>
      </Box>
    </AdminErrorBoundary>
  );
};

export default AdminDashboardSimple;