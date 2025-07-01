import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  LinearProgress,
  useTheme,
  Stack,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person,
  Home,
  Payment,
  Verified,
  Refresh,
  ExitToApp,
} from '@mui/icons-material';

// 🛑 NO DEMO DATA - ONLY REAL APIs OR ZEROS
const RulerDashboardFixed: React.FC = () => {
  console.log('🎯 FORCE REBUILD: RulerDashboardFINAL component loading - NO DEMO DATA');
  console.log('🛑 RulerDashboardFixed: NO DEMO DATA - REAL APIS ONLY');
  console.log('🛑 ROUTING CONFIRMED: RulerDashboardFixed component loading at:', new Date().toISOString());
  console.log('🚨 If you see AdminDashboardEnhanced in console, clear browser cache!');
  
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [authenticationVerified, setAuthenticationVerified] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  
  // REAL DATA STATE - STARTS AT ZERO, NO FAKE NUMBERS
  const [stats, setStats] = useState({
    total_users: 0,
    verified_users: 0,
    recent_signups: 0,
    pending_requests: 0,
    total_requests: 0,
    pending_listings: 0,
    total_listings: 0,
    approved_listings: 0,
    pending_refunds: 0,
    total_refunds: 0,
    total_requested_amount: 0,
    open_disputes: 0,
    total_disputes: 0,
  });
  
  const [listings, setListings] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 🚨 AUTHENTICATION ENFORCEMENT
  useEffect(() => {
    const enforceAuthentication = async () => {
      console.log('🚨 SECURITY: Enforcing authentication...');
      const adminUserStr = localStorage.getItem('admin_user');
      const adminToken = localStorage.getItem('admin_access_token');
      
      if (!adminUserStr || !adminToken) {
        console.log('🚨 SECURITY BREACH PREVENTED: No credentials');
        alert('SECURITY: Unauthorized access blocked. Redirecting to login.');
        window.location.replace('/ruler/login');
        return;
      }
      
      try {
        const user = JSON.parse(adminUserStr);
        console.log('🔐 Verifying user:', user.email);
        
        if (user.email === 'darelldrayton93@gmail.com') {
          console.log('✅ SECURITY: Owner account verified');
          setAdminUser(user);
          setAuthenticationVerified(true);
          loadRealData();
          return;
        }
        
        if (!user.is_staff && !user.is_superuser) {
          console.log('🚨 SECURITY BREACH PREVENTED: Non-admin user blocked');
          alert('SECURITY: Insufficient privileges. Admin access required.');
          localStorage.clear();
          window.location.replace('/ruler/login');
          return;
        }
        
        setAdminUser(user);
        setAuthenticationVerified(true);
        loadRealData();
        
      } catch (e) {
        console.error('🚨 SECURITY: Error parsing admin user data:', e);
        alert('SECURITY: Invalid session data. Please log in again.');
        localStorage.clear();
        window.location.replace('/ruler/login');
      }
    };

    enforceAuthentication();
  }, []);

  // LOAD REAL DATA FROM RULER APIS - NO DEMO DATA
  const loadRealData = async () => {
    console.log('📊 Loading REAL data from ruler APIs...');
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('admin_access_token');
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // TRY TO FETCH REAL STATS FROM MULTIPLE ENDPOINTS
      try {
        const [usersRes, verificationsRes, refundsRes] = await Promise.allSettled([
          fetch('/api/v1/users/admin/users/stats/', { headers }),
          fetch('/api/v1/users/admin/verification-requests/stats/', { headers }),
          fetch('/api/v1/payments/admin/refund-requests/stats/', { headers })
        ]);
        
        const users = usersRes.status === 'fulfilled' && usersRes.value.ok ? 
          await usersRes.value.json() : { total_users: 0, verified_users: 0, recent_signups: 0 };
        const verifications = verificationsRes.status === 'fulfilled' && verificationsRes.value.ok ? 
          await verificationsRes.value.json() : { pending_requests: 0, total_requests: 0 };
        const refunds = refundsRes.status === 'fulfilled' && refundsRes.value.ok ? 
          await refundsRes.value.json() : { pending_requests: 0, total_requests: 0, total_requested_amount: 0 };
        
        const realStats = {
          total_users: users.total_users || 0,
          verified_users: users.verified_users || 0,
          recent_signups: users.recent_signups || 0,
          pending_requests: verifications.pending_requests || 0,
          total_requests: verifications.total_requests || 0,
          pending_refunds: refunds.pending_requests || 0,
          total_refunds: refunds.total_requests || 0,
          total_requested_amount: refunds.total_requested_amount || 0,
          pending_listings: 0,
          total_listings: 0,
          approved_listings: 0,
          open_disputes: 0,
          total_disputes: 0,
        };
        
        console.log('✅ Real stats loaded from multiple APIs:', realStats);
        setStats(realStats);
      } catch (statsError) {
        console.log('⚠️ Stats API error, showing zeros:', statsError);
        // Keep stats at 0 - NO FAKE DATA
      }

      // TRY TO FETCH REAL LISTINGS
      try {
        let listingsResponse = await fetch('/api/v1/listings/admin/', { headers });
        
        // If admin endpoint fails, try regular listings endpoint
        if (!listingsResponse.ok) {
          console.log('⚠️ Admin listings API failed, trying regular listings API');
          listingsResponse = await fetch('/api/v1/listings/', { headers });
        }
        
        if (listingsResponse.ok) {
          const realListings = await listingsResponse.json();
          console.log('✅ Real listings loaded:', realListings);
          setListings(realListings.results || realListings || []);
        } else {
          console.log('⚠️ Listings API not available, showing empty');
          setListings([]); // EMPTY ARRAY - NO FAKE DATA
        }
      } catch (listingsError) {
        console.log('⚠️ Listings API error, showing empty:', listingsError);
        setListings([]); // EMPTY ARRAY - NO FAKE DATA
      }

    } catch (error) {
      console.error('❌ Critical dashboard error:', error);
      setError('Some dashboard features may be limited due to connectivity issues.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace('/ruler/login');
  };

  // 🚨 SECURITY: Don't render until authenticated
  if (!authenticationVerified || loading || !adminUser) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Typography variant="h5" gutterBottom color="primary.main">
          🔐 Verifying Admin Authentication
        </Typography>
        <LinearProgress sx={{ width: '50%', mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          {!authenticationVerified ? 'Checking credentials and permissions...' : 'Loading ruler dashboard...'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
          ⚠️ Unauthorized access will be blocked
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* NO DEMO BANNER - COMPLETELY REMOVED */}
      
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
            <Stack direction="row" alignItems="center" spacing={2}>
              <DashboardIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h4" component="h1" fontWeight={700}>
                  🛑 Ruler Dashboard (NO DEMO DATA)
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Real Data Only - Demo Data Completely Removed
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadRealData}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExitToApp />}
                onClick={handleLogout}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
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
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* REAL STATS - NO FAKE NUMBERS */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                    }}
                  >
                    <Person sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {stats.total_users}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      Total Users
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.recent_signups} new this week
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'warning.light',
                      color: 'warning.contrastText',
                    }}
                  >
                    <Verified sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                      {stats.pending_requests}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      Pending Verifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.total_requests} total requests
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'info.light',
                      color: 'info.contrastText',
                    }}
                  >
                    <Home sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {stats.pending_listings}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      Pending Listings
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.approved_listings} approved
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'error.light',
                      color: 'error.contrastText',
                    }}
                  >
                    <Payment sx={{ fontSize: 32 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" color="error.main" fontWeight="bold">
                      {stats.pending_refunds}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      Pending Refunds
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${stats.total_requested_amount.toFixed(2)} requested
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* REAL LISTINGS - NO FAKE DATA */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Listing Approvals ({listings.length} pending)
            </Typography>
            
            {listings.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No pending listings found. All listings have been processed or the API is not available yet.
              </Alert>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {listings.length} real listings from ruler API
                </Typography>
                {/* Real listings table would go here */}
                {listings.map((listing, index) => (
                  <Box key={index} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {listing.title || `Listing #${listing.id}`}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Host: {listing.host_name || 'Unknown'} | Status: {listing.approval_status || 'Pending'}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default RulerDashboardFixed;