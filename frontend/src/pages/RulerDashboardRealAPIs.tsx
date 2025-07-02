import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  Badge,
  IconButton,
  Tooltip,
  Stack,
  Avatar,
  LinearProgress,
  useTheme,
  alpha,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Edit,
  Visibility,
  Person,
  Home,
  Payment,
  Assessment,
  Dashboard as DashboardIcon,
  Verified,
  GetApp,
  Email,
  Pending,
  ExitToApp,
  Refresh,
  Security,
  Search,
  BookOnline,
  Close,
  OpenInNew,
  Gavel,
  Send,
  Reply,
  Block,
  PlayArrow
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ruler-tabpanel-${index}`}
      aria-labelledby={`ruler-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const RulerDashboardRealAPIs: React.FC = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authenticationVerified, setAuthenticationVerified] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  
  // Real data state - starts at zero
  const [stats, setStats] = useState({
    // User stats
    total_users: 0,
    active_users: 0,
    verified_users: 0,
    recent_signups: 0,
    monthly_signups: 0,
    hosts: 0,
    seekers: 0,
    staff_users: 0,
    
    // Verification stats
    pending_verifications: 0,
    total_verifications: 0,
    approved_verifications: 0,
    rejected_verifications: 0,
    recent_verification_requests: 0,
    
    // Listing stats
    pending_listings: 0,
    total_listings: 0,
    approved_listings: 0,
    rejected_listings: 0,
    active_approved_listings: 0,
    recent_listings: 0,
    
    // Refund stats
    pending_refunds: 0,
    total_refunds: 0,
    approved_refunds: 0,
    processed_refunds: 0,
    total_requested_amount: 0,
    total_approved_amount: 0,
    recent_refund_requests: 0,
  });
  
  // Data arrays
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [refundRequests, setRefundRequests] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [bookingSearchResults, setBookingSearchResults] = useState<any[]>([]);
  
  // UI state
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Authentication enforcement
  useEffect(() => {
    const enforceAuthentication = async () => {
      console.log('🔐 REAL APIs: Enforcing authentication...');
      const adminUserStr = localStorage.getItem('admin_user');
      const adminToken = localStorage.getItem('admin_access_token');
      
      if (!adminUserStr || !adminToken) {
        console.log('🚨 SECURITY: No credentials');
        alert('SECURITY: Unauthorized access blocked. Redirecting to login.');
        window.location.replace('/ruler/login');
        return;
      }
      
      try {
        const user = JSON.parse(adminUserStr);
        console.log('🔐 Verifying user:', user.email);
        
        if (user.email === 'darelldrayton93@gmail.com' || user.is_staff || user.is_superuser) {
          console.log('✅ SECURITY: Admin access verified for user:', user.email);
          console.log('✅ User privileges:', { is_staff: user.is_staff, is_superuser: user.is_superuser });
          setAdminUser(user);
          setAuthenticationVerified(true);
          loadRealData();
          return;
        }
        
        console.log('🚨 SECURITY: Non-admin user blocked:', user.email);
        console.log('🚨 User privileges:', { is_staff: user.is_staff, is_superuser: user.is_superuser });
        alert('SECURITY: Insufficient privileges. Admin access required.');
        localStorage.clear();
        window.location.replace('/ruler/login');
        return;
        
      } catch (e) {
        console.error('🚨 SECURITY: Error parsing admin user data:', e);
        alert('SECURITY: Invalid session data. Please log in again.');
        localStorage.clear();
        window.location.replace('/ruler/login');
      }
    };

    enforceAuthentication();
  }, []);

  // Load real data from all APIs
  const loadRealData = async () => {
    console.log('📡 Loading REAL data from all APIs...');
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('admin_access_token');
      console.log('🔑 Admin token found:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      if (!token) {
        throw new Error('No admin access token found. Please log in again.');
      }
      
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('📡 Making API calls with headers:', {
        'Authorization': `Bearer ${token.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      });

      // Load all data in parallel
      const [
        userStatsRes,
        verificationStatsRes,
        refundStatsRes,
        listingStatsRes,
        pendingVerificationsRes,
        pendingRefundsRes,
        pendingListingsRes
      ] = await Promise.allSettled([
        fetch('/api/v1/users/admin/users/stats/', { headers }),
        fetch('/api/v1/users/admin/verification-requests/stats/', { headers }),
        fetch('/api/v1/payments/admin/refund-requests/stats/', { headers }),
        fetch('/api/v1/listings/admin/stats/', { headers }),
        fetch('/api/v1/users/admin/verification-requests/pending/', { headers }),
        fetch('/api/v1/payments/admin/refund-requests/pending/', { headers }),
        fetch('/api/v1/listings/admin/pending/', { headers })
      ]);

      // Process user stats
      if (userStatsRes.status === 'fulfilled' && userStatsRes.value.ok) {
        const userStats = await userStatsRes.value.json();
        console.log('✅ User stats loaded:', userStats);
        setStats(prev => ({
          ...prev,
          total_users: userStats.total_users || 0,
          active_users: userStats.active_users || 0,
          verified_users: userStats.verified_users || 0,
          recent_signups: userStats.recent_signups || 0,
          monthly_signups: userStats.monthly_signups || 0,
          hosts: userStats.hosts || 0,
          seekers: userStats.seekers || 0,
          staff_users: userStats.staff_users || 0,
        }));
      } else {
        console.error('❌ User stats API failed:', userStatsRes);
        if (userStatsRes.status === 'fulfilled') {
          const errorText = await userStatsRes.value.text();
          console.error('❌ User stats error response:', errorText);
        }
      }

      // Process verification stats
      if (verificationStatsRes.status === 'fulfilled' && verificationStatsRes.value.ok) {
        const verificationStats = await verificationStatsRes.value.json();
        console.log('✅ Verification stats loaded:', verificationStats);
        setStats(prev => ({
          ...prev,
          pending_verifications: verificationStats.pending_requests || 0,
          total_verifications: verificationStats.total_requests || 0,
          approved_verifications: verificationStats.approved_requests || 0,
          rejected_verifications: verificationStats.rejected_requests || 0,
          recent_verification_requests: verificationStats.recent_requests || 0,
        }));
      }

      // Process refund stats
      if (refundStatsRes.status === 'fulfilled' && refundStatsRes.value.ok) {
        const refundStats = await refundStatsRes.value.json();
        console.log('✅ Refund stats loaded:', refundStats);
        setStats(prev => ({
          ...prev,
          pending_refunds: refundStats.pending_requests || 0,
          total_refunds: refundStats.total_requests || 0,
          approved_refunds: refundStats.approved_requests || 0,
          processed_refunds: refundStats.processed_requests || 0,
          total_requested_amount: refundStats.total_requested_amount || 0,
          total_approved_amount: refundStats.total_approved_amount || 0,
          recent_refund_requests: refundStats.recent_requests || 0,
        }));
      }

      // Process listing stats
      if (listingStatsRes.status === 'fulfilled' && listingStatsRes.value.ok) {
        const listingStats = await listingStatsRes.value.json();
        console.log('✅ Listing stats loaded:', listingStats);
        setStats(prev => ({
          ...prev,
          pending_listings: listingStats.pending_listings || 0,
          total_listings: listingStats.total_listings || 0,
          approved_listings: listingStats.approved_listings || 0,
          rejected_listings: listingStats.rejected_listings || 0,
          active_approved_listings: listingStats.active_approved_listings || 0,
          recent_listings: listingStats.recent_listings || 0,
        }));
      }

      // Process pending data
      if (pendingVerificationsRes.status === 'fulfilled' && pendingVerificationsRes.value.ok) {
        const pendingVerifications = await pendingVerificationsRes.value.json();
        console.log('✅ Pending verifications loaded:', pendingVerifications);
        setVerificationRequests(pendingVerifications.results || []);
      }

      if (pendingRefundsRes.status === 'fulfilled' && pendingRefundsRes.value.ok) {
        const pendingRefunds = await pendingRefundsRes.value.json();
        console.log('✅ Pending refunds loaded:', pendingRefunds);
        setRefundRequests(pendingRefunds.results || []);
      }

      if (pendingListingsRes.status === 'fulfilled' && pendingListingsRes.value.ok) {
        const pendingListings = await pendingListingsRes.value.json();
        console.log('✅ Pending listings loaded:', pendingListings);
        setListings(pendingListings.results || []);
      }

    } catch (error) {
      console.error('❌ Error loading data:', error);
      setError('Some features may be limited due to connectivity issues.');
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!authenticationVerified || !autoRefresh) return;

    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      loadRealData();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [authenticationVerified, autoRefresh]);

  // API action handlers
  const handleVerificationAction = async (verificationId: number, action: 'approve' | 'reject' | 'request_revision') => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('admin_access_token');
      
      const payload: any = { admin_notes: notes };
      if (action === 'reject' || action === 'request_revision') {
        payload.rejection_reason = reason;
        payload.revision_reason = reason;
      }

      const response = await fetch(`/api/v1/users/admin/verification-requests/${verificationId}/${action}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Verification ${action}:`, result);
        toast.success(result.message);
        setDialogOpen(false);
        setNotes('');
        setReason('');
        loadRealData(); // Refresh data
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} verification`);
      }
    } catch (error: any) {
      console.error(`❌ Error ${action} verification:`, error);
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleRefundAction = async (refundId: number, action: 'approve' | 'reject') => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('admin_access_token');
      
      const payload: any = { admin_notes: notes };
      if (action === 'reject') {
        payload.rejection_reason = reason;
      }

      const response = await fetch(`/api/v1/payments/admin/refund-requests/${refundId}/${action}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Refund ${action}:`, result);
        toast.success(result.message);
        setDialogOpen(false);
        setNotes('');
        setReason('');
        loadRealData(); // Refresh data
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} refund`);
      }
    } catch (error: any) {
      console.error(`❌ Error ${action} refund:`, error);
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleListingAction = async (listingId: number, action: 'approve' | 'reject' | 'request_revision') => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('admin_access_token');
      
      const payload: any = { admin_notes: notes };
      if (action === 'reject') {
        payload.rejection_reason = reason;
      } else if (action === 'request_revision') {
        payload.revision_reason = reason;
      }

      const response = await fetch(`/api/v1/listings/admin/${listingId}/${action}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Listing ${action}:`, result);
        toast.success(result.message);
        setDialogOpen(false);
        setNotes('');
        setReason('');
        loadRealData(); // Refresh data
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} listing`);
      }
    } catch (error: any) {
      console.error(`❌ Error ${action} listing:`, error);
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleUserAction = async (userId: number, action: 'suspend' | 'activate') => {
    try {
      setProcessing(true);
      const token = localStorage.getItem('admin_access_token');
      
      const response = await fetch(`/api/v1/users/admin/users/${userId}/${action}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_notes: notes, reason: reason })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ User ${action}:`, result);
        toast.success(result.message);
        setDialogOpen(false);
        setNotes('');
        setReason('');
        loadRealData(); // Refresh data
      } else {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} user`);
      }
    } catch (error: any) {
      console.error(`❌ Error ${action} user:`, error);
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const searchBookings = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('admin_access_token');
      
      const response = await fetch(`/api/v1/bookings/admin/search-api/?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Booking search results:', result);
        setBookingSearchResults(result.results || []);
        if (result.results.length === 0) {
          toast.info('No bookings found for the search term');
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search bookings');
      }
    } catch (error: any) {
      console.error('❌ Error searching bookings:', error);
      toast.error(error.message);
      setBookingSearchResults([]);
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.replace('/ruler/login');
  };

  const openActionDialog = (item: any, action: string, type: string) => {
    setSelectedItem(item);
    setActionType(action);
    setDialogOpen(true);
    setNotes('');
    setReason('');
  };

  const handleDialogAction = () => {
    if (!selectedItem || !actionType) return;

    const itemId = selectedItem.id;
    
    if (actionType.includes('verification')) {
      const action = actionType.replace('verification_', '') as 'approve' | 'reject' | 'request_revision';
      handleVerificationAction(itemId, action);
    } else if (actionType.includes('refund')) {
      const action = actionType.replace('refund_', '') as 'approve' | 'reject';
      handleRefundAction(itemId, action);
    } else if (actionType.includes('listing')) {
      const action = actionType.replace('listing_', '') as 'approve' | 'reject' | 'request_revision';
      handleListingAction(itemId, action);
    } else if (actionType.includes('user')) {
      const action = actionType.replace('user_', '') as 'suspend' | 'activate';
      handleUserAction(itemId, action);
    }
  };

  // Don't render until authenticated
  if (!authenticationVerified || loading || !adminUser) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Typography variant="h5" gutterBottom color="primary.main">
          🔐 Verifying Admin Authentication
        </Typography>
        <LinearProgress sx={{ width: '50%', mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          {!authenticationVerified ? 'Checking credentials and permissions...' : 'Loading admin dashboard...'}
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
            <Stack direction="row" alignItems="center" spacing={2}>
              <DashboardIcon sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h4" component="h1" fontWeight={700}>
                  ✅ Admin Dashboard - Real APIs Connected
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  All functions connected to live backend APIs
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

        {/* Real Stats Dashboard */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'primary.main', color: 'white' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Person sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.total_users}
                    </Typography>
                    <Typography variant="h6">
                      Total Users
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {stats.recent_signups} new this week • {stats.verified_users} verified
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'warning.main', color: 'white' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Verified sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.pending_verifications}
                    </Typography>
                    <Typography variant="h6">
                      Pending Verifications
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {stats.approved_verifications} approved • {stats.rejected_verifications} rejected
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'info.main', color: 'white' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Home sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.pending_listings}
                    </Typography>
                    <Typography variant="h6">
                      Pending Listings
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {stats.approved_listings} approved • {stats.active_approved_listings} active
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', bgcolor: 'error.main', color: 'white' }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Payment sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.pending_refunds}
                    </Typography>
                    <Typography variant="h6">
                      Pending Refunds
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      ${stats.total_approved_amount.toFixed(2)} approved
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Status and Controls Bar */}
        <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Last Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dashboard Status: {loading ? 'Refreshing...' : 'Live Data Connected'} • Auto-refresh: {autoRefresh ? 'On' : 'Off'}
                </Typography>
              </Box>
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Auto-refresh"
                />
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadRealData}
                  disabled={loading}
                  size="small"
                >
                  Refresh Now
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={currentTab} 
              onChange={(e, newValue) => setCurrentTab(newValue)}
              aria-label="admin tabs"
            >
              <Tab label={`Verifications (${stats.pending_verifications})`} />
              <Tab label={`Refunds (${stats.pending_refunds})`} />
              <Tab label={`Listings (${stats.pending_listings})`} />
              <Tab label="Booking Search" />
            </Tabs>
          </Box>

          {/* Verification Requests Tab */}
          <TabPanel value={currentTab} index={0}>
            <Typography variant="h6" gutterBottom>
              Pending Identity Verifications ({verificationRequests.length})
            </Typography>
            
            {verificationRequests.length === 0 ? (
              <Alert severity="info">
                ✅ No pending verification requests found.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {verificationRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {request.user_display_name || 'Unknown User'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {request.user_email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={request.verification_type_display} 
                            size="small" 
                            color="primary" 
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={request.status} 
                            size="small" 
                            color={request.status === 'PENDING' ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => openActionDialog(request, 'verification_approve', 'verification')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => openActionDialog(request, 'verification_reject', 'verification')}
                            >
                              Reject
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => openActionDialog(request, 'verification_request_revision', 'verification')}
                            >
                              Request Revision
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Refund Requests Tab */}
          <TabPanel value={currentTab} index={1}>
            <Typography variant="h6" gutterBottom>
              Pending Refund Requests ({refundRequests.length})
            </Typography>
            
            {refundRequests.length === 0 ? (
              <Alert severity="info">
                ✅ No pending refund requests found.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Request ID</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {refundRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {request.request_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {request.requested_by?.first_name} {request.requested_by?.last_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {request.requested_by?.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            ${request.requested_amount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={request.reason} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => openActionDialog(request, 'refund_approve', 'refund')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => openActionDialog(request, 'refund_reject', 'refund')}
                            >
                              Reject
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Pending Listings Tab */}
          <TabPanel value={currentTab} index={2}>
            <Typography variant="h6" gutterBottom>
              Pending Listing Approvals ({listings.length})
            </Typography>
            
            {listings.length === 0 ? (
              <Alert severity="info">
                ✅ No pending listings found. All listings have been processed.
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Host</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Rate</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {listings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {listing.title || `Listing #${listing.id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {listing.space_type}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {listing.host?.first_name || listing.host?.username || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {listing.host?.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {listing.address || 'No address provided'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            ${listing.hourly_rate || 0}/hour
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {listing.created_at && new Date(listing.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => openActionDialog(listing, 'listing_approve', 'listing')}
                            >
                              ✅ Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => openActionDialog(listing, 'listing_request_revision', 'listing')}
                            >
                              🔄 Request Revision
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => openActionDialog(listing, 'listing_reject', 'listing')}
                            >
                              ❌ Reject
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Booking Search Tab */}
          <TabPanel value={currentTab} index={3}>
            <Typography variant="h6" gutterBottom>
              Booking Search
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <TextField
                label="Search bookings"
                placeholder="Enter booking ID, user name, or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1 }}
                onKeyPress={(e) => e.key === 'Enter' && searchBookings()}
              />
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={searchBookings}
                disabled={processing}
              >
                Search
              </Button>
            </Stack>

            {bookingSearchResults.length > 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Booking ID</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Parking Space</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bookingSearchResults.map((booking) => (
                      <TableRow key={booking.booking_id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {booking.booking_id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {booking.user_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {booking.user_email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {booking.parking_space}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {booking.parking_address}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={booking.status_display || booking.status} 
                            size="small" 
                            color={booking.status === 'CONFIRMED' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            ${booking.total_amount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {booking.start_time}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => window.open(booking.detail_url, '_blank')}
                          >
                            <OpenInNew />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </Card>
      </Container>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {actionType.includes('approve') && 'Approve Item'}
          {actionType.includes('reject') && 'Reject Item'}
          {actionType.includes('request_revision') && 'Request Revision'}
          {actionType.includes('suspend') && 'Suspend User'}
          {actionType.includes('activate') && 'Activate User'}
        </DialogTitle>
        <DialogContent>
          {(actionType.includes('reject') || actionType.includes('request_revision') || actionType.includes('suspend')) && (
            <TextField
              label="Reason"
              multiline
              rows={3}
              fullWidth
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              sx={{ mb: 2 }}
              required
            />
          )}
          <TextField
            label="Admin Notes (optional)"
            multiline
            rows={3}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDialogAction} 
            variant="contained"
            disabled={processing || ((actionType.includes('reject') || actionType.includes('request_revision') || actionType.includes('suspend')) && !reason.trim())}
          >
            {processing ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RulerDashboardRealAPIs;