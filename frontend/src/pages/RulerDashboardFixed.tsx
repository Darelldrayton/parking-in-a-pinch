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

      // TRY TO FETCH PENDING LISTINGS AND STATS
      try {
        // Fetch pending listings that need approval
        const pendingListingsResponse = await fetch('/api/v1/listings/admin/pending/', { headers });
        
        if (pendingListingsResponse.ok) {
          const pendingData = await pendingListingsResponse.json();
          console.log('✅ Pending listings loaded:', pendingData);
          setListings(pendingData.results || []);
          
          // Update pending listings count in stats
          setStats(prevStats => ({
            ...prevStats,
            pending_listings: pendingData.count || pendingData.results?.length || 0
          }));
        } else {
          console.log('⚠️ Pending listings API not available, showing empty');
          setListings([]); // EMPTY ARRAY - NO FAKE DATA
        }
        
        // Also fetch listing stats if available
        try {
          const statsResponse = await fetch('/api/v1/listings/admin/stats/', { headers });
          if (statsResponse.ok) {
            const listingStats = await statsResponse.json();
            console.log('✅ Listing stats loaded:', listingStats);
            setStats(prevStats => ({
              ...prevStats,
              total_listings: listingStats.total_listings || 0,
              approved_listings: listingStats.approved_listings || 0,
              pending_listings: listingStats.pending_listings || prevStats.pending_listings
            }));
          }
        } catch (statsErr) {
          console.log('⚠️ Listing stats API not available:', statsErr);
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

  // LISTING APPROVAL HANDLERS
  const handleApproveListing = async (listingId: number) => {
    try {
      const token = localStorage.getItem('admin_access_token');
      const response = await fetch(`/api/v1/listings/admin/${listingId}/approve/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_notes: 'Approved via ruler dashboard'
        })
      });

      if (response.ok) {
        console.log('✅ Listing approved successfully');
        // Refresh the data to remove the approved listing from pending list
        loadRealData();
      } else {
        console.error('❌ Failed to approve listing:', response.statusText);
        setError('Failed to approve listing. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error approving listing:', error);
      setError('Error approving listing. Please check your connection.');
    }
  };

  const handleRejectListing = async (listingId: number) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('admin_access_token');
      const response = await fetch(`/api/v1/listings/admin/${listingId}/reject/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rejection_reason: reason,
          admin_notes: 'Rejected via ruler dashboard'
        })
      });

      if (response.ok) {
        console.log('✅ Listing rejected successfully');
        // Refresh the data to remove the rejected listing from pending list
        loadRealData();
      } else {
        console.error('❌ Failed to reject listing:', response.statusText);
        setError('Failed to reject listing. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error rejecting listing:', error);
      setError('Error rejecting listing. Please check your connection.');
    }
  };

  const handleRequestRevision = async (listingId: number) => {
    const reason = prompt('Please provide a reason for requesting revision:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('admin_access_token');
      const response = await fetch(`/api/v1/listings/admin/${listingId}/request_revision/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          revision_reason: reason,
          admin_notes: 'Revision requested via ruler dashboard'
        })
      });

      if (response.ok) {
        console.log('✅ Revision requested successfully');
        // Refresh the data to remove the listing from pending list
        loadRealData();
      } else {
        console.error('❌ Failed to request revision:', response.statusText);
        setError('Failed to request revision. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error requesting revision:', error);
      setError('Error requesting revision. Please check your connection.');
    }
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

        {/* PENDING LISTINGS - REAL DATA ONLY */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Pending Listing Requests ({listings.length})
            </Typography>
            
            {listings.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                ✅ No pending listings found. All listings have been processed.
              </Alert>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  📋 {listings.length} listing request(s) need your review and approval
                </Alert>
                
                {listings.map((listing, index) => (
                  <Card key={listing.id || index} sx={{ mb: 2, border: 1, borderColor: 'warning.light' }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 8 }}>
                          <Typography variant="h6" fontWeight="bold" color="primary.main">
                            {listing.title || `Listing #${listing.id}`}
                          </Typography>
                          <Typography variant="body1" color="text.secondary" gutterBottom>
                            📍 {listing.address || 'No address provided'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Host: {listing.host?.first_name || listing.host?.username || 'Unknown'} 
                            {listing.host?.email && ` (${listing.host.email})`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Rate: ${listing.hourly_rate || 0}/hour | 
                            Type: {listing.space_type || 'Not specified'} |
                            Status: {listing.approval_status || 'PENDING'}
                          </Typography>
                          {listing.created_at && (
                            <Typography variant="caption" color="text.secondary">
                              Submitted: {new Date(listing.created_at).toLocaleDateString()}
                            </Typography>
                          )}
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                          <Stack spacing={1}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleApproveListing(listing.id)}
                              fullWidth
                            >
                              ✅ Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="warning"
                              size="small"
                              onClick={() => handleRequestRevision(listing.id)}
                              fullWidth
                            >
                              🔄 Request Revision
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleRejectListing(listing.id)}
                              fullWidth
                            >
                              ❌ Reject
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
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