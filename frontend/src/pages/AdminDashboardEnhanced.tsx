import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Chip,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Badge,
  IconButton,
  Tooltip,
  Stack,
  Avatar,
  LinearProgress,
  CircularProgress,
  useTheme,
  alpha,
  Checkbox
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
  AccountBalance,
  Work,
  Star,
  StarBorder,
  LinkedIn,
  Web
} from '@mui/icons-material';
import { format } from 'date-fns';
import api, { adminTokenUtils } from '../services/api';
import PayoutManagement from '../components/admin/PayoutManagement';
import AdminErrorBoundary from '../components/admin/AdminErrorBoundary';
import AdminLoadingScreen from '../components/admin/AdminLoadingScreen';
import { careersService, type JobApplication, type JobApplicationStats } from '../services/careers';

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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface VerificationRequest {
  id: number;
  user_display_name: string;
  user_email: string;
  verification_type: string;
  verification_type_display: string;
  status: string;
  status_display: string;
  created_at: string;
  id_document_front?: string;
  id_document_back?: string;
  selfie_with_id?: string;
  document_type?: string;
  can_be_reviewed: boolean;
}

interface RefundRequest {
  id: number;
  request_id: string;
  requested_amount: number;
  reason: string;
  reason_display: string;
  status: string;
  status_display: string;
  requested_by_name: string;
  booking_details: {
    booking_id: string;
    start_time: string;
    parking_space: {
      title: string;
      address: string;
    };
  };
  created_at: string;
  final_amount: number;
  can_be_approved: boolean;
}

interface Listing {
  id: number;
  title: string;
  address: string;
  host_name: string;
  host_email: string;
  approval_status: string;
  approval_status_display: string;
  borough: string;
  space_type: string;
  hourly_rate: string;  // API returns as string like "40.00"
  daily_rate?: string;
  weekly_rate?: string;
  images_count: number;
  created_at: string;
  can_be_reviewed: boolean;
}

interface DashboardStats {
  // User stats
  total_users: number;
  active_users: number;
  verified_users: number;
  recent_signups: number;
  monthly_signups: number;
  
  // Verification stats  
  pending_verifications: number;
  total_verifications: number;
  
  // Listing stats
  pending_listings: number;
  total_listings: number;
  approved_listings: number;
  
  // Refund stats
  pending_refunds: number;
  total_refunds: number;
  total_refund_amount: number;
  
  // Payout stats
  pending_payouts: number;
  total_payouts: number;
  total_payout_amount: number;
  
  // Dispute stats
  open_disputes: number;
  total_disputes: number;
}

interface BookingSearchResult {
  booking_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  status: string;
  status_display: string;
  parking_space: string;
  parking_address: string;
  total_amount: string;
  payment_status: string;
  vehicle_info: string;
  check_in_code: string;
  detail_url: string;
  admin_url: string;
  start_time: string;
  end_time: string;
  created_at: string;
  duration_hours: number;
}

interface Dispute {
  id: number;
  dispute_id: string;
  complainant_name: string;
  complainant_email: string;
  respondent_name?: string;
  respondent_email?: string;
  dispute_type: string;
  dispute_type_display: string;
  subject: string;
  description: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  disputed_amount?: number;
  refund_requested: boolean;
  refund_amount?: number;
  booking_id?: string;
  assigned_to_name?: string;
  admin_notes: string;
  resolution: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  messages: DisputeMessage[];
  can_be_resolved: boolean;
}

interface DisputeMessage {
  id: number;
  sender_name: string;
  sender_email: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

const AdminDashboardEnhanced: React.FC = () => {
  const theme = useTheme();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revision'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedListing, setEditedListing] = useState<any>(null);
  
  // Booking search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BookingSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);
  
  // User management state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [exportingUsers, setExportingUsers] = useState(false);
  
  // Disputes state
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [disputesLoading, setDisputesLoading] = useState(false);
  const [replyDialog, setReplyDialog] = useState<{
    open: boolean;
    dispute: Dispute | null;
    message: string;
    isInternal: boolean;
  }>({ open: false, dispute: null, message: '', isInternal: false });

  // Career Applications state
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [applicationStats, setApplicationStats] = useState<JobApplicationStats | null>(null);
  const [applicationFilter, setApplicationFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [applicationDetailsDialog, setApplicationDetailsDialog] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<(string | number)[]>([]);

  // Track unavailable features for user feedback
  
  // Track if we've already loaded data to prevent multiple calls
  const hasLoadedDataRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Career Applications Functions
  const fetchJobApplications = useCallback(async () => {
    if (applicationsLoading) return;
    
    console.log('🔍 AdminDashboard: Starting to fetch job applications');
    setApplicationsLoading(true);
    try {
      // Always fetch applications, but make stats optional
      const applications = await careersService.getAllApplications();
      console.log('🔍 AdminDashboard: Successfully loaded', applications.length, 'applications');
      setJobApplications(applications);
      
      // Try to fetch stats, but don't fail if it doesn't work
      try {
        const stats = await careersService.getApplicationStats();
        console.log('🔍 AdminDashboard: Application stats:', stats);
        setApplicationStats(stats);
      } catch (statsError) {
        console.warn('⚠️ AdminDashboard: Stats endpoint not available, using default stats');
        // Set default stats if endpoint doesn't exist
        setApplicationStats({
          total: applications.length,
          new: applications.filter(app => app.status === 'new').length,
          reviewing: applications.filter(app => app.status === 'reviewing').length,
          interview: applications.filter(app => app.status === 'interview').length,
          hired: applications.filter(app => app.status === 'hired').length,
          rejected: applications.filter(app => app.status === 'rejected').length,
        });
      }
    } catch (error) {
      console.error('❌ AdminDashboard: Error fetching job applications:', error);
      toast.error('Failed to load job applications');
      setJobApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  }, [applicationsLoading]);

  const handleStatusChange = async (applicationId: string | number, newStatus: JobApplication['status']) => {
    try {
      await careersService.updateApplicationStatus(applicationId, newStatus);
      
      // Update local state
      setJobApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      
      // Refresh stats
      const newStats = await careersService.getApplicationStats();
      setApplicationStats(newStats);
      
      toast.success('Application status updated successfully');
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };

  const handleRatingChange = async (applicationId: string | number, newRating: number) => {
    try {
      await careersService.updateApplicationRating(applicationId, newRating);
      
      // Update local state
      setJobApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, rating: newRating } : app
        )
      );
      
      toast.success('Application rating updated successfully');
    } catch (error) {
      console.error('Error updating application rating:', error);
      toast.error('Failed to update application rating');
    }
  };

  const handleBulkStatusChange = async (newStatus: JobApplication['status']) => {
    if (selectedApplicationIds.length === 0) return;
    
    try {
      await careersService.bulkUpdateStatus(selectedApplicationIds, newStatus);
      
      // Update local state
      setJobApplications(prev => 
        prev.map(app => 
          selectedApplicationIds.includes(app.id) 
            ? { ...app, status: newStatus }
            : app
        )
      );
      
      // Refresh stats
      const newStats = await careersService.getApplicationStats();
      setApplicationStats(newStats);
      
      // Clear selection
      setSelectedApplicationIds([]);
      
      toast.success(`${selectedApplicationIds.length} applications updated successfully`);
    } catch (error) {
      console.error('Error bulk updating applications:', error);
      toast.error('Failed to update applications');
    }
  };

  const handleExportApplications = async () => {
    try {
      const csvContent = await careersService.exportApplicationsToCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `job_applications_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Applications exported successfully');
    } catch (error) {
      console.error('Error exporting applications:', error);
      toast.error('Failed to export applications');
    }
  };

  // Check admin auth from localStorage
  useEffect(() => {
    // CRITICAL FIX: Prevent multiple initializations
    if (hasInitialized) {
      console.log('🔍 AdminDashboard: Already initialized (state check), skipping...');
      return;
    }
    
    console.log('🔍 AdminDashboard: useEffect triggered - checking authentication (ONE TIME ONLY)...');
    console.log('🔍 Path:', window.location.pathname);
    console.log('🔍 Timestamp:', new Date().toISOString());
    console.log('🔍 Current loading state:', loading);
    console.log('🔍 Current adminUser state:', adminUser);
    
    // Disable WebSocket for admin pages to prevent infinite loops
    if (typeof window !== 'undefined') {
      (window as any).disableWebSocket = true;
      console.log('🔒 WebSocket disabled for admin dashboard');
    }
    
    // CRITICAL FIX: Completely separate admin auth from regular auth
    // Only clear regular auth tokens if they exist and admin tokens are present
    // This prevents clearing tokens during initial login
    const hasAdminTokens = localStorage.getItem('admin_access_token');
    if (hasAdminTokens && (localStorage.getItem('access_token') || localStorage.getItem('refresh_token'))) {
      console.log('🔄 Clearing regular auth tokens to prevent JWT refresh loops');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    
    const initDashboard = async () => {
      try {
        // Admin auth - only use DRF tokens (admin_access_token)
        const adminToken = localStorage.getItem('admin_access_token');
        const adminUserData = localStorage.getItem('admin_user');
        
        if (!adminToken || !adminUserData) {
          console.log('❌ No admin credentials found, redirecting to login');
          window.location.href = '/admin/login';
          return;
        }
        
        // Skip complex token validation to prevent loops
        console.log('✅ Admin credentials found, proceeding with dashboard');
        
        // Parse user data directly without complex validation
        const userData = JSON.parse(adminUserData);
        console.log('✅ Admin user loaded:', userData.email);
        console.log('✅ Setting adminUser state...');
        setAdminUser(userData);
        console.log('✅ Admin user state should be set now');
        
        // Only load data if we haven't already loaded it
        if (!hasLoadedDataRef.current) {
          console.log('📊 Loading data for first time...');
          hasLoadedDataRef.current = true;
          
          // Add timeout to prevent infinite loading
          const loadingTimeout = setTimeout(() => {
            console.log('⏰ Loading timeout - forcing loading to false');
            setLoading(false);
          }, 10000); // 10 second timeout
          
          try {
            await loadDataSafely();
          } finally {
            clearTimeout(loadingTimeout);
          }
        } else {
          console.log('📊 Data already loaded, skipping...');
          setLoading(false); // Make sure loading is false when data is already loaded
        }
      } catch (error) {
        console.error('❌ Error parsing admin user data:', error);
        window.location.href = '/admin/login';
        return;
      } finally {
        console.log('🔍 Setting hasInitialized to true');
        setHasInitialized(true);
        // Don't set loading to false here - let loadDataSafely handle it
      }
    };
    
    initDashboard();
    
    // Cleanup function to re-enable WebSocket when leaving admin dashboard
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).disableWebSocket = false;
        console.log('🔓 WebSocket re-enabled when leaving admin dashboard');
      }
    };
  }, [hasInitialized]);
  
  const loadDataSafely = async () => {
    console.log('📊 Loading dashboard data...');
    console.log('📊 Loading state before:', loading);
    setLoading(true);
    setError(null);
    
    try {
      // Add timeout to API calls to prevent hanging
      const apiCallsWithTimeout = Promise.race([
        Promise.allSettled([
          fetchStats(),
          fetchVerificationRequests(),
          fetchRefundRequests(),
          fetchListings(),
          fetchDisputes(),
          fetchJobApplications()
        ]),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('API calls timeout')), 8000)
        )
      ]);
      
      const results = await apiCallsWithTimeout as PromiseSettledResult<any>[];
      
      // Log which APIs failed but don't block the dashboard
      results.forEach((result, index) => {
        const apiNames = ['Stats', 'Verification Requests', 'Refund Requests', 'Listings', 'Disputes', 'Job Applications'];
        if (result.status === 'rejected') {
          console.warn(`❌ ${apiNames[index]} API failed:`, result.reason);
        } else {
          console.log(`✅ ${apiNames[index]} API succeeded`);
        }
      });
      
      console.log('📊 Dashboard data loading complete');
    } catch (error) {
      console.error('❌ Critical dashboard error:', error);
      setError('Some dashboard features may be limited due to connectivity issues.');
    } finally {
      // CRITICAL: Always stop loading, even if APIs fail
      console.log('📊 Setting loading to false in finally block');
      setLoading(false);
      console.log('📊 Loading state after setLoading(false):', false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Fetch data for the selected tab if needed
    switch(newValue) {
      case 0: // Identity Verification
        if (verificationRequests.length === 0) fetchVerificationRequests();
        break;
      case 1: // Refund Requests
        if (refundRequests.length === 0) fetchRefundRequests();
        break;
      case 2: // Payout Management
        // Payout data is handled by the PayoutManagement component
        break;
      case 3: // Listing Approvals
        if (listings.length === 0) fetchListings();
        break;
      case 4: // Booking Search
        // Booking search is handled by the search input
        break;
      case 5: // User Management
        if (users.length === 0) fetchUsers();
        break;
      case 6: // Disputes
        if (disputes.length === 0) fetchDisputes();
        break;
      case 7: // Career Applications
        console.log('🔍 AdminDashboard: Switching to careers tab, current applications:', jobApplications.length);
        if (jobApplications.length === 0) {
          console.log('🔍 AdminDashboard: No applications cached, fetching from API');
          fetchJobApplications();
        } else {
          console.log('🔍 AdminDashboard: Using cached applications');
        }
        break;
    }
  };

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching real data from admin APIs with correct endpoints...');
      
      // Use the correct admin endpoints that exist in the backend
      const [adminStatsRes, usersRes, verificationsRes, listingsRes, refundsRes, payoutsRes, disputesRes] = await Promise.all([
        api.get('/admin/dashboard-stats/').catch(e => {
          console.warn('Admin stats API not available:', e);
          return { data: null, status: e.response?.status || 503 };
        }),
        api.get('/users/admin/stats/').catch(e => {
          console.warn('Users stats API not available:', e);
          return { data: null, status: e.response?.status || 503 };
        }),
        api.get('/users/admin/verification-requests/stats/').catch(e => {
          console.warn('Verification stats API not available:', e);
          return { data: null, status: e.response?.status || 503 };
        }),
        api.get('/listings/admin/stats/').catch(e => {
          console.warn('Listings stats API not available:', e);
          return { data: null, status: e.response?.status || 503 };
        }),
        api.get('/payments/admin/refund-requests/stats/').catch(e => {
          console.warn('Refunds stats API not available:', e);
          return { data: null, status: e.response?.status || 503 };
        }),
        api.get('/payments/admin/payout-requests/stats/').catch(e => {
          console.warn('Payouts stats API not available:', e);
          return { data: null, status: e.response?.status || 503 };
        }),
        api.get('/disputes/admin/stats/').catch(e => {
          console.warn('Disputes stats API not available:', e);
          return { data: null, status: e.response?.status || 503 };
        })
      ]);

      let realStats = null;

      // If the consolidated admin stats endpoint works, use it
      console.log('🔍 Admin stats response status:', adminStatsRes.status);
      console.log('🔍 Admin stats response data:', adminStatsRes.data);
      if (adminStatsRes.status === 200 && adminStatsRes.data) {
        realStats = adminStatsRes.data;
        console.log('✅ Admin stats loaded from consolidated endpoint:', realStats);
      } else {
        // Otherwise, compile stats from individual endpoints
        console.log('📊 Compiling stats from individual endpoints...');
        console.log('📊 Individual API responses:', {
          refunds: { status: refundsRes.status, hasData: !!refundsRes.data },
          payouts: { status: payoutsRes.status, hasData: !!payoutsRes.data },
          users: { status: usersRes.status, hasData: !!usersRes.data },
          listings: { status: listingsRes.status, hasData: !!listingsRes.data },
          disputes: { status: disputesRes.status, hasData: !!disputesRes.data }
        });
        
        const users = (usersRes.status === 200 && usersRes.data) ? usersRes.data : { total_users: 0, verified_users: 0, recent_signups: 0 };
        const verifications = (verificationsRes.status === 200 && verificationsRes.data) ? verificationsRes.data : { pending_requests: 0, total_requests: 0 };
        const listings = (listingsRes.status === 200 && listingsRes.data) ? listingsRes.data : { pending_listings: 0, total_listings: 0, approved_listings: 0 };
        const refunds = (refundsRes.status === 200 && refundsRes.data) ? refundsRes.data : { pending_requests: 0, total_requests: 0, total_requested_amount: 0 };
        const payouts = (payoutsRes.status === 200 && payoutsRes.data) ? payoutsRes.data : { pending_requests: 0, total_requests: 0, total_pending_amount: 0 };
        const disputes = (disputesRes.status === 200 && disputesRes.data) ? disputesRes.data : { open_disputes: 0, total_disputes: 0, unassigned_disputes: 0 };

        realStats = {
          // User stats
          total_users: users.total_users || 0,
          active_users: users.active_users || 0,
          verified_users: users.verified_users || 0,
          recent_signups: users.recent_signups || 0,
          monthly_signups: users.monthly_signups || 0,
          
          // Verification stats
          pending_verifications: verifications.pending_requests || 0,
          total_verifications: verifications.total_requests || 0,
          
          // Listing stats
          pending_listings: listings.pending_listings || 0,
          total_listings: listings.total_listings || 0,
          approved_listings: listings.approved_listings || 0,
          
          // Refund stats
          pending_refunds: refunds.pending_requests || 0,
          total_refunds: refunds.total_requests || 0,
          total_refund_amount: refunds.total_requested_amount || 0,
          
          // Payout stats
          pending_payouts: payouts.pending_requests || 0,
          total_payouts: payouts.total_requests || 0,
          total_payout_amount: payouts.total_pending_amount || 0,
          
          // Dispute stats
          open_disputes: disputes.open_disputes || 0,
          total_disputes: disputes.total_disputes || 0
        };
        
        console.log('✅ Stats compiled from individual endpoints:', realStats);
      }

      setStats(realStats);

    } catch (err: any) {
      console.error('Stats fetch error:', err);
      // No fallback stats - show zeros if APIs fail
      const emptyStats = {
        total_users: 0,
        active_users: 0,
        verified_users: 0,
        recent_signups: 0,
        monthly_signups: 0,
        pending_verifications: 0,
        total_verifications: 0,
        pending_listings: 0,
        total_listings: 0,
        approved_listings: 0,
        pending_refunds: 0,
        total_refunds: 0,
        total_refund_amount: 0,
        pending_payouts: 0,
        total_payouts: 0,
        total_payout_amount: 0,
        open_disputes: 0,
        total_disputes: 0
      };
      console.log('📊 Using empty stats due to API errors - no demo data');
      setStats(emptyStats);
    }
  };

  const fetchVerificationRequests = async () => {
    try {
      console.log('🔍 Fetching verification requests from: /users/admin/verification-requests/');
      const response = await api.get('/users/admin/verification-requests/');
      console.log('✅ Verification requests loaded:', response.data);
      setVerificationRequests(response.data.results || []);
    } catch (err: any) {
      console.warn('Verification requests fetch error:', err);
      if (err.response?.status === 401) {
        console.warn('⚠️ Admin session expired for verification requests');
      } else if (err.response?.status === 404) {
        console.warn('⚠️ Admin verification API not available (404) - endpoint might not exist');
      } else {
        console.warn(`⚠️ Admin verification API not available (${err.response?.status || 'unknown'})`);
      }
      setVerificationRequests([]);
    }
  };

  const fetchRefundRequests = async () => {
    try {
      console.log('🔍 Fetching refund requests from: /payments/admin/refund-requests/');
      const response = await api.get('/payments/admin/refund-requests/');
      console.log('✅ Refund requests loaded:', response.data);
      setRefundRequests(response.data.results || []);
    } catch (err: any) {
      console.warn('Refund requests fetch error:', err);
      if (err.response?.status === 401) {
        console.warn('⚠️ Admin session expired for refund requests');
      } else if (err.response?.status === 404) {
        console.warn('⚠️ Admin refund API not available (404) - this endpoint should exist!');
      } else {
        console.warn(`⚠️ Admin refund API failed (${err.response?.status || 'unknown'})`);
      }
      setRefundRequests([]);
    }
  };

  const fetchListings = async () => {
    try {
      // Try admin endpoint first, fall back to regular listings API
      let response;
      try {
        response = await api.get('/listings/admin/');
      } catch (err: any) {
        console.warn(`⚠️ Admin listings API not available (${err.response?.status}), trying regular listings API`);
        response = await api.get('/listings/');
      }
      
      const data = response.data;
      const allListings = data.results || data || [];
      console.log('📊 All listings loaded:', allListings.length);
      
      // For admin purposes, show listings that need review (pending or recently created)
      const adminListings = allListings.map((listing: any) => ({
        ...listing,
        approval_status: listing.approval_status || 'PENDING',
        approval_status_display: listing.approval_status_display || 'Pending Approval',
        host_name: listing.host?.first_name + ' ' + listing.host?.last_name || 'N/A',
        host_email: listing.host?.email || 'N/A',
        borough: listing.borough || 'N/A',
        space_type: listing.space_type || 'N/A',
        hourly_rate: listing.hourly_rate || '0.00',
        images_count: listing.images?.length || 0,
        can_be_reviewed: true
      }));
      
      console.log('📋 Admin listings processed:', adminListings.length);
      setListings(adminListings); // Show all listings from API
    } catch (err: any) {
      console.warn('Listings fetch error:', err);
      if (err.response?.status === 401) {
        console.warn('⚠️ Admin session expired for listings');
      }
      setListings([]);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      console.log('🔍 Fetching users from: /users/admin/users/');
      const response = await api.get('/users/admin/users/');
      console.log('✅ Users loaded:', response.data);
      setUsers(response.data.results || response.data || []);
    } catch (err: any) {
      console.error('Users fetch error:', err);
      if (err.response?.status === 401) {
        setError('⚠️ Session expired. Your admin login session has expired. Please log in again to continue.');
        setTimeout(() => {
          adminTokenUtils.clearAdminSession();
        }, 3000);
        return;
      } else if (err.response?.status === 404) {
        console.warn('⚠️ Admin users API not available (404) - endpoint might not exist');
      }
      setError(`Failed to fetch users: ${err.message}`);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchDisputes = async () => {
    setDisputesLoading(true);
    try {
      console.log('📋 Fetching disputes from /disputes/admin/');
      
      const response = await api.get('/disputes/admin/');
      const data = response.data;
      
      console.log('📋 Disputes API response data:', data);
      console.log('📋 Disputes count from API:', data.results ? data.results.length : 'NO_RESULTS_FIELD');
      
      setDisputes(data.results || data || []); // Try both data.results and direct data
    } catch (err: any) {
      console.warn('Disputes fetch error:', err);
      if (err.response?.status === 401) {
        console.warn('⚠️ Admin session expired for disputes');
      } else if (err.response?.status === 404) {
        console.warn('⚠️ Disputes API not available (404)');
      } else {
        console.warn(`⚠️ Disputes API failed (${err.response?.status || 'unknown'})`);
      }
      setDisputes([]);
    } finally {
      setDisputesLoading(false);
    }
  };

  const exportAllUsers = async () => {
    setExportingUsers(true);
    try {
      const token = localStorage.getItem('admin_access_token') || localStorage.getItem('access_token');
      if (!token) {
        toast.error('No admin token found. Please log in again.');
        return;
      }

      // Create CSV content
      const csvHeaders = [
        'ID', 'Email', 'First Name', 'Last Name', 'Username',
        'Phone Number', 'User Type', 'Email Verified', 'Identity Verified',
        'Newsletter Subscriber', 'Created Date', 'Active'
      ];

      const csvRows = users.map(user => [
        user.id,
        user.email,
        user.first_name || '',
        user.last_name || '',
        user.username || '',
        user.phone_number || '',
        user.user_type || '',
        user.is_email_verified ? 'Yes' : 'No',
        user.is_verified ? 'Yes' : 'No',
        user.subscribe_to_newsletter ? 'Yes' : 'No',
        user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
        user.is_active ? 'Yes' : 'No'
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${users.length} users to CSV`);
    } catch (err: any) {
      toast.error(`Failed to export users: ${err.message}`);
      console.error('Export error:', err);
    } finally {
      setExportingUsers(false);
    }
  };

  const exportNewsletterSubscribers = async () => {
    setExportingUsers(true);
    try {
      const subscribers = users.filter(user => user.subscribe_to_newsletter && user.is_active);
      
      if (subscribers.length === 0) {
        toast.info('No newsletter subscribers found');
        return;
      }

      // Create CSV content for subscribers
      const csvHeaders = [
        'Email', 'First Name', 'Last Name', 'User Type',
        'Joined Date', 'Email Verified'
      ];

      const csvRows = subscribers.map(user => [
        user.email,
        user.first_name || '',
        user.last_name || '',
        user.user_type || '',
        user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
        user.is_email_verified ? 'Yes' : 'No'
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${subscribers.length} newsletter subscribers to CSV`);
    } catch (err: any) {
      toast.error(`Failed to export subscribers: ${err.message}`);
      console.error('Export error:', err);
    } finally {
      setExportingUsers(false);
    }
  };

  const handleAction = async () => {
    if (!selectedItem) return;

    setProcessing(true);
    try {
      let endpoint = '';
      let payload: any = {};

      if (selectedItem.verification_type) {
        // Identity verification
        endpoint = `/users/admin/verification-requests/${selectedItem.id}/${actionType}/`;
        payload = {
          admin_notes: actionNotes,
          ...(actionType === 'reject' && { rejection_reason: actionReason }),
          ...(actionType === 'revision' && { revision_reason: actionReason })
        };
      } else if (selectedItem.request_id) {
        // Refund request
        endpoint = `/payments/admin/refund-requests/${selectedItem.id}/${actionType}/`;
        payload = {
          admin_notes: actionNotes,
          ...(actionType === 'reject' && { rejection_reason: actionReason })
        };
      } else {
        // Listing
        endpoint = `/listings/admin/${selectedItem.id}/${actionType === 'revision' ? 'request_revision' : actionType}/`;
        payload = {
          admin_notes: actionNotes,
          ...(actionType === 'reject' && { rejection_reason: actionReason }),
          ...(actionType === 'revision' && { revision_reason: actionReason })
        };
      }

      await api.post(endpoint, payload);

      toast.success(`${actionType === 'approve' ? 'Approved' : actionType === 'reject' ? 'Rejected' : 'Revision requested'} successfully`);
      setActionDialog(false);
      setSelectedItem(null);
      setActionNotes('');
      setActionReason('');
      
      // Refresh data
      await Promise.all([
        fetchStats(),
        fetchVerificationRequests(),
        fetchRefundRequests(),
        fetchListings(),
        fetchDisputes()
      ]);
    } catch (err: any) {
      console.error('Action error:', err);
      if (err.response?.status === 401) {
        setError('⚠️ Session expired. Your admin login session has expired. Please log in again to continue.');
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 3000);
        return;
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Failed to perform action';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = useCallback((item: any, type: 'approve' | 'reject' | 'revision') => {
    setSelectedItem(item);
    setActionType(type);
    setActionDialog(true);
  }, []);

  const openDetailsDialog = useCallback((item: any) => {
    setSelectedItem(item);
    setDetailsDialog(true);
    setEditMode(false);
    setEditedListing(item?.space_type ? { ...item } : null);
  }, []);

  const toggleEditMode = () => {
    if (!editMode && selectedItem?.space_type) {
      setEditedListing({ ...selectedItem });
    }
    setEditMode(!editMode);
  };

  const handleEditChange = (field: string, value: any) => {
    console.log('📝 Field changed:', field, '=', value);
    setEditedListing(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      console.log('📝 Updated listing state:', updated);
      return updated;
    });
  };

  const openReplyDialog = (dispute: Dispute) => {
    setReplyDialog({
      open: true,
      dispute,
      message: '',
      isInternal: false
    });
  };

  const handleSendReply = async () => {
    if (!replyDialog.dispute || !replyDialog.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await api.post(`/disputes/admin/${replyDialog.dispute.id}/add_admin_message/`, {
        message: replyDialog.message,
        is_internal: replyDialog.isInternal
      });

      toast.success('Message sent successfully');
      setReplyDialog({ open: false, dispute: null, message: '', isInternal: false });
      await fetchDisputes(); // Refresh disputes to show new message
    } catch (err: any) {
      console.error('Send reply error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send message';
      toast.error(`Failed to send message: ${errorMessage}`);
    }
  };

  const handleUpdateDisputeStatus = async (dispute: Dispute, newStatus: string) => {
    try {
      await api.post(`/disputes/admin/${dispute.id}/update_status/`, { status: newStatus });

      toast.success('Status updated successfully');
      await fetchDisputes(); // Refresh disputes
    } catch (err: any) {
      console.error('Update dispute status error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update status';
      toast.error(`Failed to update status: ${errorMessage}`);
    }
  };

  const saveListingChanges = async () => {
    if (!editedListing) return;

    try {
      setProcessing(true);
      
      console.log('💾 Saving listing changes:', {
        id: editedListing.id,
        title: editedListing.title,
        changes: editedListing
      });
      
      const payload = {
        title: editedListing.title,
        description: editedListing.description,
        address: editedListing.address,
        borough: editedListing.borough,
        space_type: editedListing.space_type,
        hourly_rate: editedListing.hourly_rate,
        daily_rate: editedListing.daily_rate,
        weekly_rate: editedListing.weekly_rate,
        // Explicitly preserve approval status to prevent auto-approval
        approval_status: selectedItem?.approval_status || 'PENDING'
      };

      const response = await api.patch(`/listings/admin/${editedListing.id}/`, payload);
      const updatedListing = response.data;
      
      console.log('✅ Listing updated successfully:', updatedListing);
      toast.success('Listing updated successfully');
      
      // Update the selectedItem with the response from server
      setSelectedItem(updatedListing);
      setEditMode(false);
      
      // Update the listings array in state to reflect changes immediately
      setListings(prevListings => 
        prevListings.map(listing => 
          listing.id === editedListing.id 
            ? { 
                ...listing, 
                ...updatedListing,
                // Preserve original approval status and reviewability
                approval_status: listing.approval_status,
                can_be_reviewed: listing.can_be_reviewed
              }
            : listing
        )
      );
      
      // Also refresh from server to ensure data consistency
      await fetchListings();
    } catch (err: any) {
      console.error('Save listing changes error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update listing';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // User management functions
  const handleUserAction = async (userId: number, action: 'suspend' | 'activate' | 'verify' | 'unverify') => {
    try {
      let endpoint;
      if (action === 'verify' || action === 'unverify') {
        // Use the verification endpoints
        endpoint = `/users/admin/${userId}/${action}_user/`;
      } else {
        // Use the existing suspend/activate endpoints
        endpoint = `/users/admin/${userId}/${action}/`;
      }

      await api.post(endpoint);

      const actionText = {
        'suspend': 'suspended',
        'activate': 'activated',
        'verify': 'verified',
        'unverify': 'unverified'
      }[action];
      
      toast.success(`User ${actionText} successfully`);
      
      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                is_active: action === 'suspend' ? false : action === 'activate' ? true : user.is_active,
                is_verified: action === 'verify' ? true : action === 'unverify' ? false : user.is_verified
              }
            : user
        )
      );
    } catch (err: any) {
      console.error('User action error:', err);
      const errorMessage = err.response?.data?.message || err.message || `Failed to ${action} user`;
      toast.error(errorMessage);
    }
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
      
      const response = await api.get(`/bookings/admin/search-api/?q=${encodeURIComponent(cleanTerm)}`, {
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
    // Open booking details in the admin details dialog instead of external link
    setSelectedItem({
      ...booking,
      booking_details: {
        booking_id: booking.booking_id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        parking_space: {
          title: booking.parking_space,
          address: booking.parking_address
        }
      }
    });
    setDetailsDialog(true);
  };

  const handleMainSearch = () => {
    if (searchTerm.trim()) {
      window.open(`/admin/bookings/search/?q=${encodeURIComponent(searchTerm)}`, '_blank');
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'primary', onClick }: any) => (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 4 } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette[color].main, 0.1),
            }}
          >
            {React.cloneElement(icon, { 
              sx: { color: `${color}.main`, fontSize: 32 } 
            })}
          </Box>
          <Box>
            <Typography variant="h4" color={`${color}.main`} fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const getStatusChip = (status: string, type: 'verification' | 'refund' | 'listing' = 'verification') => {
    const configs = {
      verification: {
        PENDING: { label: 'Pending', color: 'warning' as const },
        APPROVED: { label: 'Approved', color: 'success' as const },
        REJECTED: { label: 'Rejected', color: 'error' as const },
        REVISION_REQUESTED: { label: 'Revision Required', color: 'info' as const },
      },
      refund: {
        pending: { label: 'Pending', color: 'warning' as const },
        approved: { label: 'Approved', color: 'success' as const },
        rejected: { label: 'Rejected', color: 'error' as const },
        processed: { label: 'Processed', color: 'success' as const },
      },
      listing: {
        PENDING: { label: 'Pending', color: 'warning' as const },
        APPROVED: { label: 'Approved', color: 'success' as const },
        REJECTED: { label: 'Rejected', color: 'error' as const },
        REVISION_REQUESTED: { label: 'Revision Required', color: 'info' as const },
      }
    };

    const config = configs[type][status as keyof typeof configs[typeof type]] || 
                   { label: status, color: 'default' as const };
    
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  console.log('🔍 RENDER CHECK:', { 
    loading, 
    adminUser: !!adminUser, 
    adminUserEmail: adminUser?.email,
    hasInitialized 
  });
  
  if (loading || !adminUser) {
    console.log('🔍 SHOWING LOADING SCREEN:', { 
      loading, 
      adminUser: !!adminUser,
      hasInitialized,
      reason: loading ? 'loading=true' : 'adminUser=null'
    });
    return (
      <AdminLoadingScreen 
        message="Initializing admin panel and loading data..."
        variant="full" 
      />
    );
  }
  
  console.log('🔍 RENDERING FULL DASHBOARD - All conditions met');


  return (
    <AdminErrorBoundary>
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
                  Comprehensive Management Portal
                </Typography>
              </Box>
            </Stack>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={async () => {
                setLoading(true);
                toast.info('Refreshing dashboard data...');
                await Promise.all([
                  fetchStats(),
                  fetchVerificationRequests(),
                  fetchRefundRequests(),
                  fetchListings(),
                  fetchDisputes(),
                  fetchUsers()
                ]);
                setLoading(false);
                toast.success('Dashboard refreshed successfully!');
              }}
              disabled={loading}
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        
        {!error && stats && Object.keys(stats).length > 0 && (
          <>
            
            {/* Large Booking Search Section */}
            <Card 
              sx={{ 
                mb: 4,
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
                    placeholder="Enter booking/reservation number..."
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
                            onClick={() => handleBookingSelect(booking)}
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
                              <Grid size={{ xs: 12, md: 8 }}>
                                <Typography variant="h6" fontWeight={600} color="primary.main" sx={{ mb: 1 }}>
                                  Reservation #{booking.booking_id}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>Guest:</Typography>
                                    <Typography variant="body2" color="text.secondary">{booking.user_name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{booking.user_email}</Typography>
                                    {booking.user_phone !== 'N/A' && (
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        📞 {booking.user_phone}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>Status:</Typography>
                                    <Chip 
                                      label={booking.status_display || booking.status}
                                      size="small"
                                      color={booking.status === 'CONFIRMED' ? 'success' : booking.status === 'CANCELLED' ? 'error' : 'default'}
                                    />
                                    {booking.payment_status !== 'N/A' && (
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        Payment: {booking.payment_status}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>Location:</Typography>
                                    <Typography variant="body2" color="text.secondary">{booking.parking_space}</Typography>
                                    <Typography variant="caption" color="text.secondary">{booking.parking_address}</Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>Duration:</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {booking.duration_hours}h (${booking.total_amount})
                                    </Typography>
                                    {booking.start_time && (
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        {booking.start_time} → {booking.end_time}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                                {booking.vehicle_info !== 'N/A' && (
                                  <Typography variant="caption" color="text.secondary">
                                    🚗 Vehicle: {booking.vehicle_info}
                                  </Typography>
                                )}
                                {booking.check_in_code !== 'N/A' && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    🔑 Check-in Code: {booking.check_in_code}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  📅 Booked: {booking.created_at}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 12, md: 4 }}>
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<Visibility />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleBookingSelect(booking);
                                    }}
                                  >
                                    View Details
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<OpenInNew />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(booking.admin_url, '_blank');
                                    }}
                                  >
                                    Django Admin
                                  </Button>
                                </Stack>
                              </Grid>
                            </Grid>
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
        )}

        {/* Stats Overview - Compact */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  {stats?.total_users || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                  Total Users
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  {stats?.total_bookings || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                  Total Bookings
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  {stats?.total_listings || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                  Total Listings
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, md: 3 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  {stats?.active_users || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                  Active Users
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}


        {/* Main Content */}
        <Card sx={{ borderRadius: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin dashboard tabs">
              <Tab 
                label={
                  <Badge badgeContent={stats?.pending_verifications || 0} color="error">
                    Identity Verification
                  </Badge>
                } 
                icon={<Verified />}
              />
              <Tab 
                label={
                  <Badge badgeContent={stats?.pending_refunds || 0} color="error">
                    Refund Requests
                  </Badge>
                }
                icon={<Payment />}
              />
              <Tab 
                label={
                  <Badge badgeContent={stats?.pending_payouts || 0} color="error">
                    Payout Management
                  </Badge>
                }
                icon={<AccountBalance />}
              />
              <Tab 
                label={
                  <Badge badgeContent={stats?.pending_listings || 0} color="error">
                    Listing Approvals
                  </Badge>
                }
                icon={<Home />}
              />
              <Tab 
                label="Booking Search"
                icon={<BookOnline />}
              />
              <Tab 
                label="User Management"
                icon={<Person />}
              />
              <Tab 
                label={
                  <Badge badgeContent={stats?.open_disputes || 0} color="error">
                    Disputes
                  </Badge>
                }
                icon={<Gavel />}
              />
              <Tab 
                label={
                  <Badge badgeContent={applicationStats?.new || 0} color="primary">
                    Career Applications
                  </Badge>
                }
                icon={<Work />}
              />
            </Tabs>
          </Box>

          {/* Identity Verification Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h5" gutterBottom>
              Identity Verification Requests ({verificationRequests.length} pending)
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Click on the eye icon (👁️) to view details, or use the action buttons (✅❌) to approve/reject verification requests.
            </Alert>
            {verificationRequests.length === 0 ? (
              <Alert severity="success">
                No pending verification requests! All caught up.
              </Alert>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Documents</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {verificationRequests.map((request) => (
                      <TableRow 
                        key={request.id} 
                        hover 
                        sx={{ '& .MuiTableCell-root': { position: 'relative' } }}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar>
                              {request.user_display_name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {request.user_display_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.user_email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={request.verification_type_display} 
                            size="small" 
                            color="info"
                          />
                        </TableCell>
                        <TableCell>
                          {getStatusChip(request.status, 'verification')}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(request.created_at), 'MMM d, yyyy')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(request.created_at), 'h:mm a')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {request.id_document_front && (
                              <Tooltip title="View ID Front">
                                <IconButton 
                                  size="small" 
                                  onClick={() => window.open(request.id_document_front, '_blank')}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            )}
                            {request.id_document_back && (
                              <Tooltip title="View ID Back">
                                <IconButton 
                                  size="small" 
                                  onClick={() => window.open(request.id_document_back, '_blank')}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            )}
                            {request.selfie_with_id && (
                              <Tooltip title="View Selfie">
                                <IconButton 
                                  size="small" 
                                  onClick={() => window.open(request.selfie_with_id, '_blank')}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Stack 
                            direction="row" 
                            spacing={1} 
                            justifyContent="center"
                            sx={{ 
                              '& .MuiIconButton-root': { 
                                zIndex: 1,
                                position: 'relative'
                              }
                            }}
                          >
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('🚀 View Details button clicked (verification)!', request.id);
                                  openDetailsDialog(request);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {request.can_be_reviewed && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('🚀 Approve button clicked (verification)!', request.id);
                                      openActionDialog(request, 'approve');
                                    }}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('🚀 Reject button clicked (verification)!', request.id);
                                      openActionDialog(request, 'reject');
                                    }}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
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
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h5" gutterBottom>
              Refund Requests ({refundRequests.length} pending)
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Click on the eye icon (👁️) to view details, or use the action buttons (✅❌) to approve/reject refund requests.
            </Alert>
            {refundRequests.length === 0 ? (
              <Alert severity="success">
                No pending refund requests! All caught up.
              </Alert>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Booking</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Requested</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {refundRequests.map((request) => (
                      <TableRow 
                        key={request.id} 
                        hover 
                        sx={{ '& .MuiTableCell-root': { position: 'relative' } }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {request.booking_details.booking_id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {request.booking_details.parking_space.title}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{request.requested_by_name}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            ${request.requested_amount.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={request.reason_display} 
                            size="small" 
                            color="info"
                          />
                        </TableCell>
                        <TableCell>
                          {getStatusChip(request.status, 'refund')}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(request.created_at), 'MMM d, yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack 
                            direction="row" 
                            spacing={1} 
                            justifyContent="center"
                            sx={{ 
                              '& .MuiIconButton-root': { 
                                zIndex: 1,
                                position: 'relative'
                              }
                            }}
                          >
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('🚀 View Details button clicked (refund)!', request.id);
                                  openDetailsDialog(request);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {request.can_be_approved && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('🚀 Approve button clicked (refund)!', request.id);
                                      openActionDialog(request, 'approve');
                                    }}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('🚀 Reject button clicked (verification)!', request.id);
                                      openActionDialog(request, 'reject');
                                    }}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Payout Management Tab */}
          <TabPanel value={tabValue} index={2}>
            <PayoutManagement onRefresh={fetchStats} />
          </TabPanel>

          {/* Listing Approvals Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h5" gutterBottom>
              Listing Approvals ({listings.length} pending)
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Click on the eye icon (👁️) to view details and edit listing information, or use the action buttons (✅❌) to approve/reject listings.
            </Alert>
            {process.env.NODE_ENV === 'development' && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                🔧 Debug Mode: Watch the browser console for edit operation logs.
              </Alert>
            )}
            {listings.length === 0 ? (
              <Alert severity="success">
                No pending listing approvals! All caught up.
              </Alert>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Listing</TableCell>
                      <TableCell>Host</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Rate</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {listings.map((listing) => (
                      <TableRow 
                        key={listing.id} 
                        hover 
                        sx={{ '& .MuiTableCell-root': { position: 'relative' } }}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            {listing.images && listing.images.length > 0 ? (
                              <Box sx={{ width: 60, height: 45, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden' }}>
                                <img 
                                  src={listing.images[0].image || listing.images[0]} 
                                  alt="Listing preview" 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                  onClick={() => openDetailsDialog(listing)}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f5f5f5;color:#999;font-size:10px;">No Image</div>';
                                  }}
                                />
                              </Box>
                            ) : (
                              <Box sx={{ width: 60, height: 45, border: 1, borderColor: 'grey.300', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
                                <Typography variant="caption" color="text.secondary">No Image</Typography>
                              </Box>
                            )}
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {listing.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {listing.images_count || listing.images?.length || 0} images
                                {listing.images_count > 1 && (
                                  <Button 
                                    size="small" 
                                    onClick={() => openDetailsDialog(listing)}
                                    sx={{ ml: 1, minWidth: 'auto', p: 0.5, fontSize: '0.7rem' }}
                                  >
                                    View All
                                  </Button>
                                )}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {listing.host_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {listing.host_email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {listing.borough}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {listing.address}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={listing.space_type} 
                            size="small" 
                            color="info"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            ${listing.hourly_rate}/hr
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(listing.approval_status, 'listing')}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {format(new Date(listing.created_at), 'MMM d, yyyy')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack 
                            direction="row" 
                            spacing={1} 
                            justifyContent="center"
                            sx={{ 
                              '& .MuiIconButton-root': { 
                                zIndex: 1,
                                position: 'relative'
                              }
                            }}
                          >
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('🚀 View Details button clicked!', listing.id);
                                  openDetailsDialog(listing);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {listing.can_be_reviewed && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('🚀 Approve button clicked!', listing.id);
                                      openActionDialog(listing, 'approve');
                                    }}
                                  >
                                    <CheckCircle />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('🚀 Reject button clicked!', listing.id);
                                      openActionDialog(listing, 'reject');
                                    }}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
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
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h3" fontWeight={700} gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              color: 'primary.main',
              mb: 2
            }}>
              <BookOnline sx={{ fontSize: 36 }} />
              Booking Search & Management
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem' }}>
              Search, view, and manage all booking reservations in the system. Use the advanced search below to find any booking instantly.
            </Typography>

            {/* Main Booking Search Interface */}
            <Card 
              sx={{ 
                borderRadius: 3,
                border: `2px solid ${theme.palette.primary.main}`,
                boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                width: '95%',
                maxWidth: '1400px',
                minHeight: '600px',
                mx: 'auto',
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
                        <Search sx={{ color: 'action.active', mr: 2, fontSize: 28 }} />
                      ),
                      sx: {
                        fontSize: '1.3rem',
                        minHeight: '70px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: 3,
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                          borderWidth: 3,
                        },
                      },
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        padding: '20px 24px',
                        fontSize: '1.3rem',
                        fontWeight: 500,
                      },
                      mb: 2,
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
                        minHeight: '500px',
                        maxHeight: '70vh',
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
                              onClick={() => handleBookingSelect(booking)}
                              sx={{
                                p: 4,
                                cursor: 'pointer',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                minHeight: '140px',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                },
                                '&:last-child': {
                                  borderBottom: 'none',
                                },
                              }}
                            >
                              <Grid container spacing={3} alignItems="center">
                                <Grid size={{ xs: 12, md: 8 }}>
                                  <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ mb: 2, fontSize: '1.4rem' }}>
                                    Reservation #{booking.booking_id}
                                  </Typography>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 2 }}>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>Guest:</Typography>
                                      <Typography variant="body2" color="text.secondary">{booking.user_name}</Typography>
                                      <Typography variant="caption" color="text.secondary">{booking.user_email}</Typography>
                                      {booking.user_phone !== 'N/A' && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                          📞 {booking.user_phone}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>Status:</Typography>
                                      <Chip 
                                        label={booking.status_display || booking.status}
                                        size="small"
                                        color={booking.status === 'CONFIRMED' ? 'success' : booking.status === 'CANCELLED' ? 'error' : 'default'}
                                      />
                                      {booking.payment_status !== 'N/A' && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                          Payment: {booking.payment_status}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 2 }}>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>Location:</Typography>
                                      <Typography variant="body2" color="text.secondary">{booking.parking_space}</Typography>
                                      <Typography variant="caption" color="text.secondary">{booking.parking_address}</Typography>
                                    </Box>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>Duration:</Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {booking.duration_hours}h (${booking.total_amount})
                                      </Typography>
                                      {booking.start_time && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                          {booking.start_time} → {booking.end_time}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                  {booking.vehicle_info !== 'N/A' && (
                                    <Typography variant="caption" color="text.secondary">
                                      🚗 Vehicle: {booking.vehicle_info}
                                    </Typography>
                                  )}
                                  {booking.check_in_code !== 'N/A' && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      🔑 Check-in Code: {booking.check_in_code}
                                    </Typography>
                                  )}
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    📅 Booked: {booking.created_at}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<Visibility />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleBookingSelect(booking);
                                      }}
                                    >
                                      View Details
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      startIcon={<OpenInNew />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(booking.admin_url, '_blank');
                                      }}
                                    >
                                      Django Admin
                                    </Button>
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
                    startIcon={<Assessment />}
                    onClick={() => window.open('/admin/bookings/?status=pending', '_blank')}
                  >
                    Pending Bookings
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Grid container spacing={3} sx={{ mt: 4 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="h4" color="primary.main" fontWeight={700}>
                    {searchResults.length || '0'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Search Results
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ textAlign: 'center', p: 3 }}>
                  <Typography variant="h4" color="success.main" fontWeight={700}>
                    24/7
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Search Available
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
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
          </TabPanel>

          {/* User Management Tab */}
          <TabPanel value={tabValue} index={5}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Person />
              User Management & Export
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              View all users and export contact lists for marketing purposes.
            </Typography>

            {/* Export Actions */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Export Options
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={exportingUsers ? <CircularProgress size={20} /> : <GetApp />}
                    onClick={exportAllUsers}
                    disabled={exportingUsers || users.length === 0}
                    size="large"
                  >
                    {exportingUsers ? 'Exporting...' : `Export All Users (${users.length})`}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={exportingUsers ? <CircularProgress size={20} /> : <Email />}
                    onClick={exportNewsletterSubscribers}
                    disabled={exportingUsers || users.filter(u => u.subscribe_to_newsletter).length === 0}
                    size="large"
                  >
                    {exportingUsers ? 'Exporting...' : `Export Newsletter Subscribers (${users.filter(u => u.subscribe_to_newsletter && u.is_active).length})`}
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<Refresh />}
                    onClick={fetchUsers}
                    disabled={usersLoading}
                    size="large"
                  >
                    Refresh Data
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  All Users ({users.length})
                </Typography>
                
                {usersLoading ? (
                  <AdminLoadingScreen 
                    message="Loading user management data..." 
                    variant="compact" 
                  />
                ) : users.length === 0 ? (
                  <Alert severity="info" sx={{ my: 2 }}>
                    No users found. Click "Refresh Data" to load users.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>User Type</TableCell>
                          <TableCell>Phone</TableCell>
                          <TableCell>Newsletter</TableCell>
                          <TableCell>Verified</TableCell>
                          <TableCell>Joined</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                  {user.first_name?.[0] || user.email[0]}
                                </Avatar>
                                {user.first_name} {user.last_name}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={user.user_type || 'seeker'}
                                size="small"
                                color={user.user_type === 'host' ? 'success' : user.user_type === 'both' ? 'secondary' : 'default'}
                              />
                            </TableCell>
                            <TableCell>{user.phone_number || 'N/A'}</TableCell>
                            <TableCell>
                              <Chip
                                label={user.subscribe_to_newsletter ? 'Yes' : 'No'}
                                size="small"
                                color={user.subscribe_to_newsletter ? 'success' : 'default'}
                                icon={user.subscribe_to_newsletter ? <Email /> : undefined}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={user.is_verified ? 'Verified' : 'Unverified'}
                                size="small"
                                color={user.is_verified ? 'success' : 'warning'}
                                icon={user.is_verified ? <CheckCircle /> : <Pending />}
                              />
                            </TableCell>
                            <TableCell>
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={user.is_active ? 'Active' : 'Inactive'}
                                size="small"
                                color={user.is_active ? 'success' : 'error'}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center">
                                {user.is_active ? (
                                  <Tooltip title="Suspend User">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleUserAction(user.id, 'suspend')}
                                    >
                                      <Cancel />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Activate User">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleUserAction(user.id, 'activate')}
                                    >
                                      <CheckCircle />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {user.is_verified ? (
                                  <Tooltip title="Remove Verification">
                                    <IconButton
                                      size="small"
                                      color="warning"
                                      onClick={() => handleUserAction(user.id, 'unverify')}
                                    >
                                      <Cancel />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Verify User">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={() => handleUserAction(user.id, 'verify')}
                                    >
                                      <Verified />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => window.open(`/profile?userId=${user.id}`, '_blank')}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {users.length > 100 && (
                      <Alert severity="info" sx={{ m: 2 }}>
                        Showing first 100 users. Use export functions to get complete data.
                      </Alert>
                    )}
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          {/* Disputes Tab */}
          <TabPanel value={tabValue} index={6}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Gavel />
              Disputes Management ({disputes.length} total)
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              View and respond to user disputes. Click reply to send messages to involved parties.
            </Alert>
            
            {disputesLoading ? (
              <AdminLoadingScreen 
                message="Loading dispute management data..." 
                variant="compact" 
              />
            ) : disputes.length === 0 ? (
              <Alert severity="success">
                No disputes found. All issues have been resolved!
              </Alert>
            ) : (
              <Card>
                <CardContent>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Dispute ID</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Complainant</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Priority</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {disputes.map((dispute) => (
                          <TableRow key={dispute.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600} color="primary.main">
                                {dispute.dispute_id}
                              </Typography>
                              {dispute.booking_id && (
                                <Typography variant="caption" color="text.secondary">
                                  Booking: {dispute.booking_id}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={dispute.dispute_type_display} 
                                size="small" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {dispute.complainant_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {dispute.complainant_email}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {dispute.subject}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {dispute.description}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={dispute.status_display} 
                                size="small" 
                                color={dispute.status === 'open' ? 'error' : 
                                       dispute.status === 'in_review' ? 'warning' : 'success'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={dispute.priority_display} 
                                size="small" 
                                color={dispute.priority === 'urgent' ? 'error' : 
                                       dispute.priority === 'high' ? 'warning' : 'default'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {format(new Date(dispute.created_at), 'MMM d, yyyy')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(new Date(dispute.created_at), 'h:mm a')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Reply to Dispute">
                                  <IconButton 
                                    size="small" 
                                    
                                    onClick={() => openReplyDialog(dispute)}
                                  >
                                    <Reply />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="View Details">
                                  <IconButton 
                                    size="small"
                                    onClick={() => {
                                      console.log('🚀 View Details button clicked (dispute)!', dispute.id);
                                      openDetailsDialog(dispute);
                                    }}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                {dispute.status === 'open' && (
                                  <Tooltip title="Mark In Review">
                                    <IconButton 
                                      size="small" 
                                      color="warning"
                                      onClick={() => handleUpdateDisputeStatus(dispute, 'in_review')}
                                    >
                                      <Pending />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {dispute.status !== 'resolved' && (
                                  <Tooltip title="Mark Resolved">
                                    <IconButton 
                                      size="small" 
                                      color="success"
                                      onClick={() => handleUpdateDisputeStatus(dispute, 'resolved')}
                                    >
                                      <CheckCircle />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </TabPanel>

          {/* Career Applications Tab */}
          <TabPanel value={tabValue} index={7}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Work />
              Career Applications ({applicationStats?.total || 0} total)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review and manage job applications from the careers page.
            </Typography>

            {applicationsLoading ? (
              <AdminLoadingScreen message="Loading job applications..." variant="compact" />
            ) : (
              <>
                {/* Filter Controls */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="h6">Filter Applications:</Typography>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={applicationFilter}
                          onChange={(e) => setApplicationFilter(e.target.value)}
                        >
                          <MenuItem value="all">All ({applicationStats?.total || 0})</MenuItem>
                          <MenuItem value="new">New ({applicationStats?.new || 0})</MenuItem>
                          <MenuItem value="reviewing">Reviewing ({applicationStats?.reviewing || 0})</MenuItem>
                          <MenuItem value="interview">Interview ({applicationStats?.interview || 0})</MenuItem>
                          <MenuItem value="hired">Hired ({applicationStats?.hired || 0})</MenuItem>
                          <MenuItem value="rejected">Rejected ({applicationStats?.rejected || 0})</MenuItem>
                        </Select>
                      </FormControl>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Refresh />}
                        onClick={fetchJobApplications}
                        disabled={applicationsLoading}
                      >
                        Refresh
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>

                {/* Applications Statistics */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={2.4}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="primary.main">
                        {applicationStats?.new || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        New Applications
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="warning.main">
                        {applicationStats?.reviewing || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Under Review
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="info.main">
                        {applicationStats?.interview || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Interview Stage
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="success.main">
                        {applicationStats?.hired || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hired
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={2.4}>
                    <Card sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h4" color="error.main">
                        {applicationStats?.rejected || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rejected
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>

                {/* Applications Table */}
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={selectedApplicationIds.length > 0 && selectedApplicationIds.length < jobApplications.length}
                            checked={jobApplications.length > 0 && selectedApplicationIds.length === jobApplications.length}
                            onChange={(event) => {
                              if (event.target.checked) {
                                setSelectedApplicationIds(jobApplications.map(app => app.id));
                              } else {
                                setSelectedApplicationIds([]);
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>Applicant</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell>Applied Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Rating</TableCell>
                        <TableCell>Experience</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {jobApplications
                        .filter(app => applicationFilter === 'all' || app.status === applicationFilter)
                        .map((application) => (
                          <TableRow key={application.id} hover>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedApplicationIds.includes(application.id)}
                                onChange={(event) => {
                                  if (event.target.checked) {
                                    setSelectedApplicationIds([...selectedApplicationIds, application.id]);
                                  } else {
                                    setSelectedApplicationIds(selectedApplicationIds.filter(id => id !== application.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: 'primary.main' }}>
                                  {application.name.charAt(0)}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="bold">
                                    {application.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {application.email}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {application.phone}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {application.position}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={application.department}
                                size="small"
                                color={application.department === 'Engineering' ? 'primary' : 
                                       application.department === 'Design' ? 'secondary' : 
                                       application.department === 'Marketing' ? 'success' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {format(new Date(application.applied_date), 'MMM d, yyyy')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <Select
                                  value={application.status}
                                  onChange={(e) => handleStatusChange(application.id, e.target.value as JobApplication['status'])}
                                  size="small"
                                >
                                  <MenuItem value="new">New</MenuItem>
                                  <MenuItem value="reviewing">Reviewing</MenuItem>
                                  <MenuItem value="interview">Interview</MenuItem>
                                  <MenuItem value="hired">Hired</MenuItem>
                                  <MenuItem value="rejected">Rejected</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                {Array.from({ length: 5 }, (_, i) => (
                                  <IconButton 
                                    key={i} 
                                    size="small" 
                                    onClick={() => handleRatingChange(application.id, i + 1)}
                                  >
                                    {i < application.rating ? <Star sx={{ color: 'warning.main', fontSize: 16 }} /> : <StarBorder sx={{ color: 'text.disabled', fontSize: 16 }} />}
                                  </IconButton>
                                ))}
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                  {application.rating > 0 ? `${application.rating}/5` : 'Not rated'}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={application.experience_level}
                                size="small"
                                variant="outlined"
                                color={application.experience_level === 'Senior' ? 'success' : 
                                       application.experience_level === 'Mid' ? 'primary' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedApplication(application);
                                      setApplicationDetailsDialog(true);
                                    }}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={application.resume_url ? "Download Resume" : "No Resume"}>
                                  <IconButton
                                    size="small"
                                    disabled={!application.resume_url}
                                    onClick={() => {
                                      if (application.resume_url) {
                                        const link = document.createElement('a');
                                        link.href = application.resume_url;
                                        link.download = `${application.name.replace(/\s+/g, '_')}_resume.pdf`;
                                        link.target = '_blank';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }
                                    }}
                                  >
                                    <GetApp />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Send Email">
                                  <IconButton
                                    size="small"
                                    onClick={() => window.open(`mailto:${application.email}`, '_blank')}
                                  >
                                    <Email />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Bulk Actions */}
                {selectedApplicationIds.length > 0 && (
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="h6">
                          {selectedApplicationIds.length} application{selectedApplicationIds.length > 1 ? 's' : ''} selected
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleBulkStatusChange('reviewing')}
                        >
                          Mark as Reviewing
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleBulkStatusChange('interview')}
                        >
                          Move to Interview
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleBulkStatusChange('rejected')}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => setSelectedApplicationIds([])}
                        >
                          Clear Selection
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<GetApp />}
                    onClick={handleExportApplications}
                    disabled={applicationsLoading}
                  >
                    Export All Applications
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Email />}
                    onClick={() => {
                      const newApplicants = jobApplications.filter(app => app.status === 'new');
                      if (newApplicants.length > 0) {
                        const emailList = newApplicants.map(app => app.email).join(';');
                        window.open(`mailto:${emailList}?subject=Thank you for your application&body=Thank you for your interest in joining Parking in a Pinch...`, '_blank');
                      }
                    }}
                    disabled={applicationStats?.new === 0}
                  >
                    Email New Applicants ({applicationStats?.new || 0})
                  </Button>
                </Stack>
              </>
            )}
          </TabPanel>

        </Card>
      </Container>

      {/* Application Details Dialog */}
      <Dialog 
        open={applicationDetailsDialog} 
        onClose={() => setApplicationDetailsDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Application Details - {selectedApplication?.name}
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Name</Typography>
                  <Typography variant="body1">{selectedApplication.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedApplication.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{selectedApplication.phone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Location</Typography>
                  <Typography variant="body1">{selectedApplication.location}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Position</Typography>
                  <Typography variant="body1">{selectedApplication.position}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Department</Typography>
                  <Typography variant="body1">{selectedApplication.department}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Experience Level</Typography>
                  <Typography variant="body1">{selectedApplication.experience_level}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Applied Date</Typography>
                  <Typography variant="body1">{format(new Date(selectedApplication.applied_date), 'MMM d, yyyy')}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <FormControl size="small" sx={{ minWidth: 120, mt: 1 }}>
                    <Select
                      value={selectedApplication.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as JobApplication['status'];
                        handleStatusChange(selectedApplication.id, newStatus);
                        setSelectedApplication({ ...selectedApplication, status: newStatus });
                      }}
                      size="small"
                    >
                      <MenuItem value="new">New</MenuItem>
                      <MenuItem value="reviewing">Reviewing</MenuItem>
                      <MenuItem value="interview">Interview</MenuItem>
                      <MenuItem value="hired">Hired</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Rating</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <IconButton 
                        key={i} 
                        size="small" 
                        onClick={() => {
                          const newRating = i + 1;
                          handleRatingChange(selectedApplication.id, newRating);
                          setSelectedApplication({ ...selectedApplication, rating: newRating });
                        }}
                      >
                        {i < selectedApplication.rating ? <Star sx={{ color: 'warning.main' }} /> : <StarBorder sx={{ color: 'text.disabled' }} />}
                      </IconButton>
                    ))}
                    <Typography variant="body2" color="text.secondary">
                      {selectedApplication.rating > 0 ? `${selectedApplication.rating}/5` : 'Not rated'}
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Cover Letter</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {selectedApplication.cover_letter}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Links</Typography>
                  <Stack direction="row" spacing={2}>
                    {selectedApplication.linkedin && (
                      <Button
                        variant="outlined"
                        startIcon={<LinkedIn />}
                        onClick={() => window.open(selectedApplication.linkedin, '_blank')}
                        size="small"
                      >
                        LinkedIn
                      </Button>
                    )}
                    {selectedApplication.portfolio && (
                      <Button
                        variant="outlined"
                        startIcon={<Web />}
                        onClick={() => window.open(selectedApplication.portfolio, '_blank')}
                        size="small"
                      >
                        Portfolio
                      </Button>
                    )}
                    {selectedApplication.resume_url ? (
                      <Button
                        variant="outlined"
                        startIcon={<GetApp />}
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedApplication.resume_url;
                          link.download = `${selectedApplication.name.replace(/\s+/g, '_')}_resume.pdf`;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        size="small"
                      >
                        Download Resume
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        startIcon={<GetApp />}
                        disabled
                        size="small"
                        sx={{ opacity: 0.5 }}
                      >
                        No Resume Uploaded
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplicationDetailsDialog(false)}>
            Close
          </Button>
          <Button
            onClick={() => window.open(`mailto:${selectedApplication?.email}`, '_blank')}
            variant="contained"
            startIcon={<Email />}
          >
            Send Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedItem?.title && `Listing Details - ${selectedItem.title}`}
          {selectedItem?.user_display_name && `Verification Request - ${selectedItem.user_display_name}`}
          {selectedItem?.request_id && `Refund Request - ${selectedItem.request_id}`}
          {selectedItem?.booking_id && `Booking Details - Reservation #${selectedItem.booking_id}`}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Verification Request Details */}
              {selectedItem.verification_type && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">User</Typography>
                    <Typography variant="body1">{selectedItem.user_display_name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedItem.user_email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Verification Type</Typography>
                    <Typography variant="body1">{selectedItem.verification_type_display}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    {getStatusChip(selectedItem.status, 'verification')}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Document Type</Typography>
                    <Typography variant="body1">{selectedItem.document_type || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Submitted</Typography>
                    <Typography variant="body1">{format(new Date(selectedItem.created_at), 'MMM d, yyyy HH:mm')}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Documents</Typography>
                    {(selectedItem.id_document_front || selectedItem.id_document_back || selectedItem.selfie_with_id) ? (
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        {selectedItem.id_document_front && (
                          <Box>
                            <Typography variant="caption" display="block" gutterBottom>ID Front</Typography>
                            <Box sx={{ width: 200, height: 150, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', cursor: 'pointer' }}>
                              <img 
                                src={selectedItem.id_document_front} 
                                alt="ID Front" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onClick={() => window.open(selectedItem.id_document_front, '_blank')}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f5f5f5;color:#999;">Image not available</div>';
                                }}
                              />
                            </Box>
                          </Box>
                        )}
                        {selectedItem.id_document_back && (
                          <Box>
                            <Typography variant="caption" display="block" gutterBottom>ID Back</Typography>
                            <Box sx={{ width: 200, height: 150, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', cursor: 'pointer' }}>
                              <img 
                                src={selectedItem.id_document_back} 
                                alt="ID Back" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onClick={() => window.open(selectedItem.id_document_back, '_blank')}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f5f5f5;color:#999;">Image not available</div>';
                                }}
                              />
                            </Box>
                          </Box>
                        )}
                        {selectedItem.selfie_with_id && (
                          <Box>
                            <Typography variant="caption" display="block" gutterBottom>Selfie with ID</Typography>
                            <Box sx={{ width: 200, height: 150, border: 1, borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', cursor: 'pointer' }}>
                              <img 
                                src={selectedItem.selfie_with_id} 
                                alt="Selfie with ID" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onClick={() => window.open(selectedItem.selfie_with_id, '_blank')}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f5f5f5;color:#999;">Image not available</div>';
                                }}
                              />
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    ) : (
                      <Alert severity="warning">
                        ⚠️ No documents uploaded yet. The user needs to upload ID photos for verification.
                      </Alert>
                    )}
                  </Grid>
                </Grid>
              )}

              {/* Listing Details */}
              {selectedItem.space_type && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">Listing Information</Typography>
                    <Button
                      startIcon={<Edit />}
                      onClick={toggleEditMode}
                      color={editMode ? "secondary" : "primary"}
                      disabled={processing}
                    >
                      {editMode ? 'Cancel Edit' : 'Edit Listing'}
                    </Button>
                  </Stack>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={editedListing?.title || ''}
                          onChange={(e) => handleEditChange('title', e.target.value)}
                          sx={{ mt: 0.5 }}
                        />
                      ) : (
                        <Typography variant="body1">{selectedItem.title}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Host</Typography>
                      <Typography variant="body1">{selectedItem.host_name}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                          value={editedListing?.description || ''}
                          onChange={(e) => handleEditChange('description', e.target.value)}
                          sx={{ mt: 0.5 }}
                        />
                      ) : (
                        <Typography variant="body1">{selectedItem.description}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={editedListing?.address || ''}
                          onChange={(e) => handleEditChange('address', e.target.value)}
                          sx={{ mt: 0.5 }}
                        />
                      ) : (
                        <Typography variant="body1">{selectedItem.address}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Borough</Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                          <Select
                            value={editedListing?.borough || ''}
                            onChange={(e) => handleEditChange('borough', e.target.value)}
                          >
                            <MenuItem value="Manhattan">Manhattan</MenuItem>
                            <MenuItem value="Brooklyn">Brooklyn</MenuItem>
                            <MenuItem value="Queens">Queens</MenuItem>
                            <MenuItem value="Bronx">Bronx</MenuItem>
                            <MenuItem value="Staten Island">Staten Island</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1">{selectedItem.borough}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="subtitle2" color="text.secondary">Space Type</Typography>
                      {editMode ? (
                        <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                          <Select
                            value={editedListing?.space_type || ''}
                            onChange={(e) => handleEditChange('space_type', e.target.value)}
                          >
                            <MenuItem value="driveway">Driveway</MenuItem>
                            <MenuItem value="garage">Garage</MenuItem>
                            <MenuItem value="lot">Parking Lot</MenuItem>
                            <MenuItem value="street">Street Parking</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography variant="body1">{selectedItem.space_type}</Typography>
                      )}
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="subtitle2" color="text.secondary">Hourly Rate</Typography>
                      {editMode ? (
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: 0.01 }}
                          value={editedListing?.hourly_rate || ''}
                          onChange={(e) => handleEditChange('hourly_rate', e.target.value)}
                          sx={{ mt: 0.5 }}
                          InputProps={{
                            startAdornment: <Typography>$</Typography>,
                            endAdornment: <Typography>/hr</Typography>
                          }}
                        />
                      ) : (
                        <Typography variant="body1" color="success.main" fontWeight="bold">${selectedItem.hourly_rate}/hr</Typography>
                      )}
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="subtitle2" color="text.secondary">Images</Typography>
                      <Typography variant="body1">{selectedItem.images_count} uploaded</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      {getStatusChip(selectedItem.approval_status, 'listing')}
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                      <Typography variant="body1">{format(new Date(selectedItem.created_at), 'MMM d, yyyy HH:mm')}</Typography>
                    </Grid>
                    
                    {editMode && (
                      <Grid item xs={12}>
                        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                          <Button onClick={toggleEditMode} disabled={processing}>
                            Cancel
                          </Button>
                          <Button 
                            variant="contained" 
                            onClick={saveListingChanges}
                            disabled={processing}
                          >
                            {processing ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </Stack>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}

              {/* Refund Request Details */}
              {selectedItem.request_id && (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Request ID</Typography>
                    <Typography variant="body1">{selectedItem.request_id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Requested By</Typography>
                    <Typography variant="body1">{selectedItem.requested_by_name}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                    <Typography variant="body1" color="success.main" fontWeight="bold">${selectedItem.requested_amount?.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Reason</Typography>
                    <Typography variant="body1">{selectedItem.reason_display}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    {getStatusChip(selectedItem.status, 'refund')}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Submitted</Typography>
                    <Typography variant="body1">{format(new Date(selectedItem.created_at), 'MMM d, yyyy HH:mm')}</Typography>
                  </Grid>
                  {selectedItem.customer_explanation && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Customer Explanation</Typography>
                      <Typography variant="body1">{selectedItem.customer_explanation}</Typography>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Booking Details */}
              {selectedItem.booking_id && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BookOnline />
                    Booking Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Booking ID</Typography>
                      <Typography variant="body1" fontWeight="bold" color="primary.main">
                        #{selectedItem.booking_id}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={selectedItem.status_display || selectedItem.status}
                        size="small"
                        color={selectedItem.status === 'CONFIRMED' ? 'success' : selectedItem.status === 'CANCELLED' ? 'error' : 'default'}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Guest</Typography>
                      <Typography variant="body1">{selectedItem.user_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{selectedItem.user_email}</Typography>
                      {selectedItem.user_phone !== 'N/A' && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          📞 {selectedItem.user_phone}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Total Amount</Typography>
                      <Typography variant="body1" color="success.main" fontWeight="bold">
                        ${selectedItem.total_amount}
                      </Typography>
                      {selectedItem.payment_status !== 'N/A' && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Payment: {selectedItem.payment_status}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Parking Location</Typography>
                      <Typography variant="body1" fontWeight={600}>{selectedItem.parking_space}</Typography>
                      <Typography variant="body2" color="text.secondary">{selectedItem.parking_address}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Check-in Time</Typography>
                      <Typography variant="body1">{selectedItem.start_time}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Check-out Time</Typography>
                      <Typography variant="body1">{selectedItem.end_time}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Duration</Typography>
                      <Typography variant="body1">{selectedItem.duration_hours} hours</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Booked On</Typography>
                      <Typography variant="body1">{selectedItem.created_at}</Typography>
                    </Grid>
                    {selectedItem.vehicle_info !== 'N/A' && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Vehicle</Typography>
                        <Typography variant="body1">{selectedItem.vehicle_info}</Typography>
                      </Grid>
                    )}
                    {selectedItem.check_in_code !== 'N/A' && (
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Check-in Code</Typography>
                        <Typography variant="body1" fontWeight="bold" color="primary.main">
                          {selectedItem.check_in_code}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                  
                  {/* Quick Actions for Booking */}
                  <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Admin Actions
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<OpenInNew />}
                        onClick={() => window.open(`${selectedItem.admin_url}`, '_blank')}
                      >
                        Edit in Django Admin
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Assessment />}
                        onClick={() => {
                          navigator.clipboard.writeText(selectedItem.booking_id);
                          toast.success('Booking ID copied to clipboard');
                        }}
                      >
                        Copy Booking ID
                      </Button>
                    </Stack>
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>
            Close
          </Button>
          {(selectedItem?.can_be_reviewed || selectedItem?.can_be_approved) && (
            <>
              <Button 
                onClick={() => { setDetailsDialog(false); openActionDialog(selectedItem, 'approve'); }}
                variant="contained" 
                color="success"
              >
                Approve
              </Button>
              <Button 
                onClick={() => { setDetailsDialog(false); openActionDialog(selectedItem, 'reject'); }}
                variant="contained" 
                color="error"
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Request Revision'}
          {selectedItem?.user_display_name && ` - ${selectedItem.user_display_name}`}
          {selectedItem?.title && ` - ${selectedItem.title}`}
          {selectedItem?.booking_details && ` - ${selectedItem.booking_details.booking_id}`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {actionType !== 'approve' && (
              <TextField
                fullWidth
                label={actionType === 'reject' ? 'Rejection Reason *' : 'Revision Reason *'}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                required
                multiline
                rows={3}
                placeholder="Please provide a clear reason for this action..."
                error={actionType !== 'approve' && !actionReason.trim()}
                helperText={actionType !== 'approve' && !actionReason.trim() ? 'This field is required' : ''}
              />
            )}
            <TextField
              fullWidth
              label="Admin Notes (Optional)"
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              multiline
              rows={3}
              placeholder="Add any additional notes for internal reference..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)} disabled={processing}>
            Cancel
          </Button>
          <Button 
            onClick={handleAction} 
            variant="contained" 
            disabled={processing || (actionType !== 'approve' && !actionReason.trim())}
            color={actionType === 'approve' ? 'success' : actionType === 'reject' ? 'error' : 'warning'}
          >
            {processing ? 'Processing...' : 
             actionType === 'approve' ? 'Approve' : 
             actionType === 'reject' ? 'Reject' : 'Request Revision'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog 
        open={replyDialog.open} 
        onClose={() => setReplyDialog({ open: false, dispute: null, message: '', isInternal: false })} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Reply to Dispute #{replyDialog.dispute?.dispute_id}
        </DialogTitle>
        <DialogContent>
          {replyDialog.dispute && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Subject: {replyDialog.dispute.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Complainant: {replyDialog.dispute.complainant_name} ({replyDialog.dispute.complainant_email})
                </Typography>
                {replyDialog.dispute.respondent_name && (
                  <Typography variant="body2" color="text.secondary">
                    Respondent: {replyDialog.dispute.respondent_name} ({replyDialog.dispute.respondent_email})
                  </Typography>
                )}
              </Box>
              
              {/* Display existing messages */}
              {replyDialog.dispute.messages?.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Previous Messages:
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}>
                    {replyDialog.dispute.messages.map((msg, index) => (
                      <Box key={index} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                        <Typography variant="caption" color="text.secondary">
                          {msg.sender_name} - {format(new Date(msg.created_at), 'MMM d, yyyy h:mm a')}
                          {msg.is_internal && <Chip label="Internal" size="small" sx={{ ml: 1 }} />}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {msg.message}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              
              <TextField
                fullWidth
                label="Your Reply"
                value={replyDialog.message}
                onChange={(e) => setReplyDialog(prev => ({ ...prev, message: e.target.value }))}
                multiline
                rows={4}
                placeholder="Type your reply here..."
                required
              />
              
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="body2">Message Type:</Typography>
                <Button
                  variant={!replyDialog.isInternal ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setReplyDialog(prev => ({ ...prev, isInternal: false }))}
                >
                  Public (visible to all parties)
                </Button>
                <Button
                  variant={replyDialog.isInternal ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setReplyDialog(prev => ({ ...prev, isInternal: true }))}
                >
                  Internal (admin only)
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setReplyDialog({ open: false, dispute: null, message: '', isInternal: false })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendReply}
            variant="contained"
            startIcon={<Send />}
            disabled={!replyDialog.message.trim()}
          >
            Send Reply
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
                {searchResults.map((booking, index) => (
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
                      #{booking.booking_id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {booking.user_name} | {booking.status_display || booking.status}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {booking.parking_space} • ${booking.total_amount} • {booking.duration_hours}h
                    </Typography>
                    {booking.check_in_code !== 'N/A' && (
                      <Typography variant="caption" color="success.main" display="block">
                        🔑 {booking.check_in_code}
                      </Typography>
                    )}
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
              Enter: booking number with or without prefix
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
    </AdminErrorBoundary>
  );
};

export default AdminDashboardEnhanced;