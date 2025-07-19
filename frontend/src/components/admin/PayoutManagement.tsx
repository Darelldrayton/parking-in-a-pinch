import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Stack,
  Paper,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Visibility,
  Payment,
  AccountBalance,
  TrendingUp,
  FilterList,
  Refresh,
  GetApp,
} from '@mui/icons-material';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Safe number formatting function
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0';
  }
  return `$${amount.toLocaleString()}`;
};

// Safe date formatting function
const formatDate = (dateString: string | undefined | null): string => {
  if (!dateString) {
    return 'N/A';
  }
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return 'Invalid Date';
  }
};

interface PayoutRequest {
  id: number;
  request_id: string;
  requested_amount: number;
  approved_amount?: number;
  final_amount: number;
  payout_method: string;
  payout_method_display: string;
  status: string;
  status_display: string;
  host_name: string;
  host_email: string;
  bank_name: string;
  account_holder_name: string;
  masked_account_number: string;
  routing_number: string;
  payment_count: number;
  host_notes: string;
  admin_notes: string;
  rejection_reason: string;
  can_be_approved: boolean;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
  processed_at?: string;
}

interface PayoutStats {
  total_requests: number;
  pending_requests: number;
  approved_requests: number;
  rejected_requests: number;
  completed_requests: number;
  total_requested_amount: number;
  total_pending_amount: number;
  total_completed_amount: number;
}

interface PayoutManagementProps {
  onRefresh?: () => void;
}

const PayoutManagement: React.FC<PayoutManagementProps> = ({ onRefresh }) => {
  const theme = useTheme();
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'complete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Form states
  const [approvedAmount, setApprovedAmount] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [stripePayoutId, setStripePayoutId] = useState('');

  useEffect(() => {
    fetchPayoutRequests();
    fetchPayoutStats();
  }, [statusFilter]);

  const fetchPayoutRequests = async () => {
    try {
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        console.warn('⚠️ No admin token found for payout requests');
        toast.error('Admin authentication required');
        return;
      }

      const endpoint = statusFilter === 'pending' 
        ? '/api/v1/payments/admin/payout-requests/pending/'
        : '/api/v1/payments/admin/payout-requests/';
        
      const response = await fetch(endpoint, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayoutRequests(data.results || []);
      } else if (response.status === 401) {
        console.warn('⚠️ Admin session expired for payout requests');
        toast.error('Admin session expired. Please log in again.');
      } else {
        console.error('Failed to fetch payout requests:', response.status);
        toast.error('Failed to load payout requests');
      }
    } catch (error) {
      console.error('Error fetching payout requests:', error);
      toast.error('Error loading payout requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchPayoutStats = async () => {
    try {
      const token = localStorage.getItem('admin_access_token');
      if (!token) {
        console.warn('⚠️ No admin token found for payout stats');
        return;
      }

      const response = await fetch('/api/v1/payments/admin/payout-requests/stats/', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        console.warn('⚠️ Admin session expired for payout stats');
      } else {
        console.error('Failed to fetch payout stats:', response.status);
      }
    } catch (error) {
      console.error('Error fetching payout stats:', error);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    const token = localStorage.getItem('admin_access_token');
    if (!token) {
      toast.error('Admin authentication required');
      return;
    }

    setActionLoading(true);
    try {
      let endpoint = `/api/v1/payments/admin/payout-requests/${selectedRequest.id}/${actionType}/`;
      let payload: any = {};

      switch (actionType) {
        case 'approve':
          payload = {
            approved_amount: approvedAmount ? parseFloat(approvedAmount) : undefined,
            admin_notes: adminNotes,
          };
          break;
        case 'reject':
          payload = {
            rejection_reason: rejectionReason,
            admin_notes: adminNotes,
          };
          break;
        case 'complete':
          payload = {
            admin_notes: adminNotes,
            stripe_payout_id: stripePayoutId,
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        closeActionDialog();
        fetchPayoutRequests();
        fetchPayoutStats();
        onRefresh?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || `Failed to ${actionType} payout request`);
      }
    } catch (error) {
      console.error(`Error ${actionType}ing payout request:`, error);
      toast.error(`Error ${actionType}ing payout request`);
    } finally {
      setActionLoading(false);
    }
  };

  const openActionDialog = (request: PayoutRequest, action: 'approve' | 'reject' | 'complete') => {
    setSelectedRequest(request);
    setActionType(action);
    setApprovedAmount(request.requested_amount.toString());
    setAdminNotes('');
    setRejectionReason('');
    setStripePayoutId('');
    setActionDialogOpen(true);
  };

  const closeActionDialog = () => {
    setActionDialogOpen(false);
    setSelectedRequest(null);
    setActionType(null);
    setApprovedAmount('');
    setAdminNotes('');
    setRejectionReason('');
    setStripePayoutId('');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const exportApprovedRequests = async () => {
    try {
      setLoading(true);
      
      // Make request to export endpoint
      const response = await fetch('/api/v1/payments/admin/payout-requests/export_approved/', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${localStorage.getItem('adminToken')}`,
        },
      });

      if (response.ok) {
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `approved_payout_requests_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Export completed successfully');
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error exporting data');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = payoutRequests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status.toLowerCase() === statusFilter.toLowerCase();
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Payment sx={{ color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{stats.pending_requests}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Requests
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AccountBalance sx={{ color: 'warning.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{formatCurrency(stats.total_pending_amount)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Amount
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <CheckCircle sx={{ color: 'success.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{stats.completed_requests}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp sx={{ color: 'info.main', mr: 2 }} />
                  <Box>
                    <Typography variant="h4">{formatCurrency(stats.total_completed_amount)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Paid Out
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Payout Requests</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status Filter"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Export Approved Requests">
                <Button
                  variant="outlined"
                  startIcon={<GetApp />}
                  onClick={exportApprovedRequests}
                  disabled={loading}
                  size="small"
                >
                  Export CSV
                </Button>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton onClick={() => { fetchPayoutRequests(); fetchPayoutStats(); }}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Payout Requests Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request ID</TableCell>
                <TableCell>Host</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Bank Details</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {request.request_id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {request.payment_count} payments
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{request.host_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {request.host_email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
{formatCurrency(request.final_amount)}
                    </Typography>
                    {request.approved_amount && request.approved_amount !== request.requested_amount && (
                      <Typography variant="caption" color="text.secondary">
                        (Requested: {formatCurrency(request.requested_amount)})
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{request.payout_method_display}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{request.bank_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {request.account_holder_name}
                    </Typography>
                    <br />
                    <Typography variant="caption" color="text.secondary">
                      {request.masked_account_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status_display}
                      color={getStatusColor(request.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(request.created_at), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(request.created_at), 'h:mm a')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {request.can_be_approved && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => openActionDialog(request, 'approve')}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openActionDialog(request, 'reject')}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <Tooltip title="Mark as Completed">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openActionDialog(request, 'complete')}
                          >
                            <Payment />
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

        {filteredRequests.length === 0 && (
          <Box p={3} textAlign="center">
            <Typography variant="body1" color="text.secondary">
              No payout requests found for the selected filter.
            </Typography>
          </Box>
        )}
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={closeActionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' && 'Approve Payout Request'}
          {actionType === 'reject' && 'Reject Payout Request'}
          {actionType === 'complete' && 'Mark Payout as Completed'}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 1 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Request:</strong> {selectedRequest.request_id}<br />
                  <strong>Host:</strong> {selectedRequest.host_name} ({selectedRequest.host_email})<br />
                  <strong>Requested Amount:</strong> {formatCurrency(selectedRequest.requested_amount)}<br />
                  <strong>Payment Count:</strong> {selectedRequest.payment_count} payments
                </Typography>
              </Alert>

              {actionType === 'approve' && (
                <>
                  <TextField
                    fullWidth
                    label="Approved Amount"
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    sx={{ mb: 2 }}
                    helperText={`Maximum: $${selectedRequest.requested_amount}`}
                  />
                  <TextField
                    fullWidth
                    label="Admin Notes"
                    multiline
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Optional notes about the approval..."
                  />
                </>
              )}

              {actionType === 'reject' && (
                <>
                  <TextField
                    fullWidth
                    label="Rejection Reason"
                    multiline
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                    placeholder="Please provide a reason for rejection..."
                  />
                  <TextField
                    fullWidth
                    label="Admin Notes"
                    multiline
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Optional internal notes..."
                  />
                </>
              )}

              {actionType === 'complete' && (
                <>
                  <TextField
                    fullWidth
                    label="Stripe Payout ID (Optional)"
                    value={stripePayoutId}
                    onChange={(e) => setStripePayoutId(e.target.value)}
                    sx={{ mb: 2 }}
                    placeholder="Enter Stripe payout ID if processed through Stripe..."
                  />
                  <TextField
                    fullWidth
                    label="Admin Notes"
                    multiline
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Optional notes about completion..."
                  />
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeActionDialog}>Cancel</Button>
          <Button
            onClick={handleAction}
            variant="contained"
            disabled={actionLoading || (actionType === 'reject' && !rejectionReason)}
            color={actionType === 'reject' ? 'error' : 'primary'}
          >
            {actionLoading && <CircularProgress size={20} sx={{ mr: 1 }} />}
            {actionType === 'approve' && 'Approve'}
            {actionType === 'reject' && 'Reject'}
            {actionType === 'complete' && 'Mark Completed'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayoutManagement;