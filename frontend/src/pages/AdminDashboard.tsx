import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Stack,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  useTheme,
  alpha,
  Tab,
  Tabs,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Verified,
  Pending,
  CheckCircle,
  Cancel,
  Visibility,
  Person,
  Security,
  ExitToApp,
  Refresh,
  Search,
  FilterList,
  Download,
  Send,
  BookOnline,
  Close,
  OpenInNew,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../services/api';
import toast from 'react-hot-toast';

interface VerificationRequest {
  id: number;
  user_display_name: string;
  user_email: string;
  verification_type: string;
  status: string;
  document_type: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by_name?: string;
  admin_notes?: string;
  rejection_reason?: string;
}

interface VerificationStats {
  pending_count: number;
  approved_today: number;
  rejected_today: number;
  total_verified_users: number;
  total_users: number;
  by_type: Record<string, {
    pending: number;
    approved: number;
    rejected: number;
  }>;
}

interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

interface ReviewDialogData {
  open: boolean;
  request: VerificationRequest | null;
  action: 'approve' | 'reject' | 'request_revision' | null;
  notes: string;
  reason: string;
}

interface BookingSearchResult {
  booking_id: string;
  user_name: string;
  status: string;
  parking_space: string;
  total_amount: string;
  detail_url: string;
  start_time: string;
  end_time: string;
}

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [reviewDialog, setReviewDialog] = useState<ReviewDialogData>({
    open: false,
    request: null,
    action: null,
    notes: '',
    reason: '',
  });

  // Booking search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BookingSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);

  useEffect(() => {
    checkAdminAuth();
    loadDashboardData();
  }, []);

  const checkAdminAuth = () => {
    const adminUserStr = localStorage.getItem('admin_user');
    const adminToken = localStorage.getItem('admin_access_token');

    if (!adminUserStr || !adminToken) {
      navigate('/admin/login');
      return;
    }

    const user = JSON.parse(adminUserStr);
    if (!user.is_staff && !user.is_superuser) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/admin/login');
      return;
    }

    setAdminUser(user);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('admin_access_token');
      if (!adminToken) return;

      // Set auth header for admin requests
      api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;

      const [statsResponse, requestsResponse] = await Promise.all([
        api.get('/users/admin/verification-requests/stats/'),
        api.get('/users/admin/verification-requests/?status=PENDING'),
      ]);

      setStats(statsResponse.data);
      setVerificationRequests(requestsResponse.data.results || requestsResponse.data);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      if (error.response?.status === 401) {
        navigate('/admin/login');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    delete api.defaults.headers.common['Authorization'];
    navigate('/admin/login');
  };

  const handleReviewAction = (request: VerificationRequest, action: 'approve' | 'reject' | 'request_revision') => {
    setReviewDialog({
      open: true,
      request,
      action,
      notes: '',
      reason: '',
    });
  };

  const submitReview = async () => {
    if (!reviewDialog.request || !reviewDialog.action) return;

    try {
      const payload: any = {
        action: reviewDialog.action,
        notes: reviewDialog.notes,
      };

      if (reviewDialog.action === 'reject' || reviewDialog.action === 'request_revision') {
        if (!reviewDialog.reason.trim()) {
          toast.error('Reason is required for this action');
          return;
        }
        payload.reason = reviewDialog.reason;
      }

      await api.post(`/users/admin/verification-requests/${reviewDialog.request.id}/${reviewDialog.action}/`, payload);

      toast.success(`Verification ${reviewDialog.action}d successfully`);
      setReviewDialog({ open: false, request: null, action: null, notes: '', reason: '' });
      loadDashboardData(); // Reload data
    } catch (error: any) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to submit review';
      toast.error(errorMessage);
    }
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pending', color: 'warning' as const, icon: <Pending /> },
      APPROVED: { label: 'Approved', color: 'success' as const, icon: <CheckCircle /> },
      REJECTED: { label: 'Rejected', color: 'error' as const, icon: <Cancel /> },
      REVISION_REQUESTED: { label: 'Revision Required', color: 'info' as const, icon: <Refresh /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
      />
    );
  };

  // Booking search functions
  const searchBookings = async (term: string) => {
    if (!term.trim() || term.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const adminToken = localStorage.getItem('admin_access_token');
      if (!adminToken) return;

      // Clean search term
      const cleanTerm = term.replace('#', '').replace(/reservation/gi, '').trim();
      
      const response = await api.get(`/bookings/admin/search/?q=${encodeURIComponent(cleanTerm)}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (response.data.success && response.data.results) {
        setSearchResults(response.data.results);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Booking search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchBookings(searchTerm);
      } else {
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle clicking outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-search-container]')) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSearchResults]);

  const handleBookingSelect = (booking: BookingSearchResult) => {
    // Navigate to booking detail page
    window.open(booking.detail_url, '_blank');
  };

  const handleMainSearch = () => {
    if (searchTerm.trim()) {
      // Open dedicated booking search page
      window.open(`/admin/bookings/search/?q=${encodeURIComponent(searchTerm)}`, '_blank');
    }
  };

  if (loading || !adminUser) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LinearProgress sx={{ width: '50%' }} />
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
                  Admin Dashboard
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Welcome back, {adminUser.first_name || adminUser.username}
                </Typography>
              </Box>
            </Stack>
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
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Prominent Booking Search Section */}
        <Card 
          sx={{ 
            mb: 4,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h4" component="h2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Search sx={{ fontSize: 32 }} />
                  Quick Booking Search
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                  Search for any booking instantly by reservation number
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<BookOnline />}
                onClick={() => window.open('/admin/bookings/', '_blank')}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                All Bookings
              </Button>
            </Stack>

            <Box sx={{ position: 'relative' }} data-search-container>
              <TextField
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleMainSearch();
                  }
                }}
                placeholder="Enter reservation # (e.g., BK679E4363)..."
                InputProps={{
                  startAdornment: (
                    <Search sx={{ color: 'action.active', mr: 1 }} />
                  ),
                  endAdornment: searchLoading && (
                    <LinearProgress 
                      sx={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0, 
                        bgcolor: 'transparent' 
                      }} 
                    />
                  ),
                  sx: {
                    bgcolor: 'white',
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      border: `2px solid ${theme.palette.primary.light}`,
                    },
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    padding: '16px 20px',
                    fontSize: '1.1rem',
                  }
                }}
              />

              {/* Search Results Dropdown */}
              {showSearchResults && (
                <Paper
                  elevation={8}
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    maxHeight: 400,
                    overflow: 'auto',
                    borderRadius: 2,
                    mt: 1,
                  }}
                >
                  {searchResults.length > 0 ? (
                    searchResults.map((booking, index) => (
                      <Box
                        key={index}
                        onClick={() => handleBookingSelect(booking)}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                          '&:last-child': {
                            borderBottom: 'none',
                          },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                              {booking.booking_id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {booking.user_name} | {booking.status}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {booking.parking_space} | ${booking.total_amount}
                            </Typography>
                          </Box>
                          <IconButton size="small" >
                            <OpenInNew />
                          </IconButton>
                        </Stack>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No booking found for "{searchTerm}"
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}
            </Box>

            <Stack direction="row" spacing={3} sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ fontSize: 16 }} />
                With or without # prefix
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ fontSize: 16 }} />
                Auto-complete suggestions
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ fontSize: 16 }} />
                Instant results
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                      }}
                    >
                      <Pending sx={{ color: 'warning.main', fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="warning.main">
                        {stats.pending_count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending Reviews
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                      }}
                    >
                      <CheckCircle sx={{ color: 'success.main', fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        {stats.approved_today}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Approved Today
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    >
                      <Verified sx={{ color: 'primary.main', fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="primary.main">
                        {stats.total_verified_users}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Verified Users
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                      }}
                    >
                      <Person sx={{ color: 'info.main', fontSize: 32 }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="info.main">
                        {stats.total_users}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Users
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Main Content */}
        <Card sx={{ borderRadius: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Pending Reviews" icon={<Pending />} />
              <Tab label="All Requests" icon={<Security />} />
              <Tab label="Booking Search" icon={<BookOnline />} />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  Pending Verification Reviews
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadDashboardData}
                >
                  Refresh
                </Button>
              </Stack>

              {verificationRequests.length === 0 ? (
                <>
                  <Alert severity="success">
                    No pending verification requests! All caught up.
                  </Alert>
                  
                  {/* Large Booking Search Section */}
                  <Card 
                    sx={{ 
                      mt: 4,
                      borderRadius: 3,
                      border: `2px solid ${theme.palette.primary.main}`,
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h4" component="h2" fontWeight={700} gutterBottom sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2,
                        color: 'primary.main' 
                      }}>
                        <Search sx={{ fontSize: 32 }} />
                        Booking Search
                      </Typography>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                        Search for any booking or reservation instantly
                      </Typography>

                      <Box sx={{ position: 'relative' }} data-search-container>
                        <TextField
                          fullWidth
                          autoFocus
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (searchResults.length > 0) {
                                window.open(searchResults[0].detail_url, '_blank');
                              }
                            }
                          }}
                          placeholder="Enter booking/reservation number (e.g., BK679E4363)..."
                          size="large"
                          InputProps={{
                            startAdornment: (
                              <Search sx={{ color: 'action.active', mr: 2, fontSize: 28 }} />
                            ),
                            sx: {
                              fontSize: '1.2rem',
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderWidth: 2,
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                                borderWidth: 2,
                              },
                            },
                          }}
                          sx={{
                            '& .MuiInputBase-input': {
                              padding: '20px 24px',
                              fontSize: '1.2rem',
                            }
                          }}
                        />

                        {/* Search Results Dropdown */}
                        {showSearchResults && (
                          <Paper
                            elevation={8}
                            sx={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              zIndex: 1000,
                              maxHeight: 400,
                              overflow: 'auto',
                              borderRadius: 2,
                              mt: 1,
                              border: `1px solid ${theme.palette.primary.main}`,
                            }}
                          >
                            {searchResults.length > 0 ? (
                              searchResults.map((booking, index) => (
                                <Box
                                  key={index}
                                  onClick={() => window.open(booking.detail_url, '_blank')}
                                  sx={{
                                    p: 3,
                                    cursor: 'pointer',
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    },
                                    '&:last-child': {
                                      borderBottom: 'none',
                                    },
                                  }}
                                >
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                      <Typography variant="h6" fontWeight={600} color="primary.main">
                                        {booking.booking_id}
                                      </Typography>
                                      <Typography variant="body1" color="text.secondary">
                                        {booking.user_name} | Status: {booking.status}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {booking.parking_space} | Amount: ${booking.total_amount}
                                      </Typography>
                                      {booking.start_time && (
                                        <Typography variant="caption" color="text.secondary">
                                          {booking.start_time} - {booking.end_time}
                                        </Typography>
                                      )}
                                    </Box>
                                    <IconButton size="large" >
                                      <OpenInNew sx={{ fontSize: 28 }} />
                                    </IconButton>
                                  </Stack>
                                </Box>
                              ))
                            ) : (
                              <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="h6" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  No booking found for "{searchTerm}"
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Try searching with just the booking number or ID
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        )}

                        {searchLoading && (
                          <LinearProgress 
                            sx={{ 
                              position: 'absolute', 
                              bottom: 0, 
                              left: 0, 
                              right: 0,
                              borderRadius: 1,
                            }} 
                          />
                        )}
                      </Box>

                      <Stack direction="row" spacing={3} sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                          Auto-search as you type
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                          Press Enter for first result
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                          Works with or without # prefix
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>User</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Document</TableCell>
                        <TableCell>Submitted</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {verificationRequests.map((request) => (
                        <TableRow key={request.id} hover>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar>
                                {request.user_display_name.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {request.user_display_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {request.user_email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip label={request.verification_type} size="small" />
                          </TableCell>
                          <TableCell>{request.document_type || 'N/A'}</TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {format(new Date(request.created_at), 'MMM d, yyyy')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(request.created_at), 'h:mm a')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getStatusChip(request.status)}
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="View Details">
                                <IconButton size="small">
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleReviewAction(request, 'approve')}
                                >
                                  <CheckCircle />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleReviewAction(request, 'reject')}
                                >
                                  <Cancel />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                All Verification Requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced filtering and management coming soon...
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BookOnline />
                Booking Search & Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                Search, view, and manage all booking reservations in the system.
              </Typography>

              {/* Main Booking Search Interface */}
              <Card 
                sx={{ 
                  borderRadius: 3,
                  border: `2px solid ${theme.palette.primary.main}`,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" component="h3" fontWeight={600} gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    color: 'primary.main' 
                  }}>
                    <Search sx={{ fontSize: 28 }} />
                    Advanced Booking Search
                  </Typography>

                  <Box sx={{ position: 'relative', mb: 3 }} data-search-container>
                    <TextField
                      fullWidth
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (searchResults.length > 0) {
                            window.open(searchResults[0].detail_url, '_blank');
                          }
                        }
                      }}
                      placeholder="Search by booking ID, reservation number, user name, or email..."
                      size="large"
                      InputProps={{
                        startAdornment: (
                          <Search sx={{ color: 'action.active', mr: 2, fontSize: 24 }} />
                        ),
                        sx: {
                          fontSize: '1.1rem',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderWidth: 2,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: 2,
                          },
                        },
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          padding: '16px 20px',
                          fontSize: '1.1rem',
                        }
                      }}
                    />

                    {/* Advanced Search Results */}
                    {showSearchResults && (
                      <Paper
                        elevation={8}
                        sx={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          zIndex: 1000,
                          maxHeight: 500,
                          overflow: 'auto',
                          borderRadius: 2,
                          mt: 1,
                          border: `1px solid ${theme.palette.primary.main}`,
                        }}
                      >
                        {searchResults.length > 0 ? (
                          <>
                            <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), borderBottom: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                                Found {searchResults.length} booking{searchResults.length !== 1 ? 's' : ''}
                              </Typography>
                            </Box>
                            {searchResults.map((booking, index) => (
                              <Box
                                key={index}
                                onClick={() => window.open(booking.detail_url, '_blank')}
                                sx={{
                                  p: 3,
                                  cursor: 'pointer',
                                  borderBottom: '1px solid',
                                  borderColor: 'divider',
                                  '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                  },
                                  '&:last-child': {
                                    borderBottom: 'none',
                                  },
                                }}
                              >
                                <Grid container spacing={2} alignItems="center">
                                  <Grid item xs={12} md={8}>
                                    <Typography variant="h6" fontWeight={600} color="primary.main">
                                      {booking.booking_id}
                                    </Typography>
                                    <Typography variant="body1" color="text.primary">
                                      {booking.user_name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {booking.parking_space}
                                    </Typography>
                                    {booking.start_time && (
                                      <Typography variant="caption" color="text.secondary">
                                        {booking.start_time} - {booking.end_time}
                                      </Typography>
                                    )}
                                  </Grid>
                                  <Grid item xs={12} md={4}>
                                    <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
                                      <Chip 
                                        label={booking.status} 
                                        size="small" 
                                        color={booking.status === 'CONFIRMED' ? 'success' : 'default'}
                                      />
                                      <Typography variant="h6" fontWeight={600} color="success.main">
                                        ${booking.total_amount}
                                      </Typography>
                                      <IconButton size="small" >
                                        <OpenInNew />
                                      </IconButton>
                                    </Stack>
                                  </Grid>
                                </Grid>
                              </Box>
                            ))}
                          </>
                        ) : (
                          <Box sx={{ p: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              No bookings found for "{searchTerm}"
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Try different search terms or check the spelling
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    )}

                    {searchLoading && (
                      <LinearProgress 
                        sx={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0,
                          borderRadius: 1,
                        }} 
                      />
                    )}
                  </Box>

                  <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<BookOnline />}
                      onClick={() => window.open('/admin/bookings/', '_blank')}
                    >
                      View All Bookings
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<FilterList />}
                      onClick={() => window.open('/admin/bookings/?status=pending', '_blank')}
                    >
                      Pending Bookings
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => toast.info('Export functionality coming soon!')}
                    >
                      Export Data
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Grid container spacing={3} sx={{ mt: 4 }}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h4" color="primary.main" fontWeight={700}>
                      {searchResults.length || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Search Results
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                      24/7
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Search Available
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ textAlign: 'center', p: 3 }}>
                    <Typography variant="h4" color="info.main" fontWeight={700}>
                      Instant
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Real-time Results
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </Card>
      </Container>

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog.open}
        onClose={() => setReviewDialog({ open: false, request: null, action: null, notes: '', reason: '' })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Review Verification Request
        </DialogTitle>
        <DialogContent>
          {reviewDialog.request && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  User: {reviewDialog.request.user_display_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email: {reviewDialog.request.user_email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {reviewDialog.request.verification_type}
                </Typography>
              </Box>

              {(reviewDialog.action === 'reject' || reviewDialog.action === 'request_revision') && (
                <TextField
                  fullWidth
                  label="Reason *"
                  value={reviewDialog.reason}
                  onChange={(e) => setReviewDialog(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please provide a reason for this action..."
                  required
                />
              )}

              <TextField
                fullWidth
                label="Admin Notes (Optional)"
                value={reviewDialog.notes}
                onChange={(e) => setReviewDialog(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
                placeholder="Add any additional notes..."
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog({ open: false, request: null, action: null, notes: '', reason: '' })}>
            Cancel
          </Button>
          <Button
            onClick={submitReview}
            variant="contained"
            color={reviewDialog.action === 'approve' ? 'success' : 'error'}
          >
            {reviewDialog.action === 'approve' ? 'Approve' : 
             reviewDialog.action === 'reject' ? 'Reject' : 'Request Revision'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Search Widget */}
      {showFloatingSearch && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            top: 120,
            right: 20,
            width: 320,
            zIndex: 1000,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Search />
              Quick Search
            </Typography>
            <IconButton
              size="small"
              onClick={() => setShowFloatingSearch(false)}
              sx={{ color: 'white' }}
            >
              <Close />
            </IconButton>
          </Box>

          <Box sx={{ p: 3 }} data-search-container>
            <TextField
              fullWidth
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleMainSearch();
                }
              }}
              placeholder="Type reservation #..."
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
              }}
              sx={{ mb: 2 }}
            />

            {/* Floating Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <Box sx={{ mb: 2, maxHeight: 200, overflow: 'auto' }}>
                {searchResults.slice(0, 3).map((booking, index) => (
                  <Box
                    key={index}
                    onClick={() => handleBookingSelect(booking)}
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      '&:last-child': {
                        mb: 0,
                      },
                    }}
                  >
                    <Typography variant="subtitle2" color="primary.main" fontWeight={600}>
                      {booking.booking_id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {booking.user_name} | {booking.status}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ${booking.total_amount}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              startIcon={<Search />}
              onClick={handleMainSearch}
              disabled={!searchTerm.trim()}
            >
              Open Booking Detail
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
              Enter: BK679E4363, #BK679E4363, or just the number
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Show/Hide Floating Search Button */}
      <Box
        sx={{
          position: 'fixed',
          top: 80,
          right: 20,
          zIndex: 1001,
        }}
      >
        <Button
          variant="contained"
          size="small"
          startIcon={<Search />}
          onClick={() => setShowFloatingSearch(!showFloatingSearch)}
          sx={{
            borderRadius: 20,
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
            minWidth: 'auto',
            px: 2,
          }}
        >
          Search
        </Button>
      </Box>
    </Box>
  );
}