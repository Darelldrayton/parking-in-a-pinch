import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Button,
  Divider,
  Alert,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import {
  MoneyOff,
  CheckCircle,
  HourglassTop,
  Error,
  Cancel,
  Refresh,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface RefundStatusProps {
  bookingId: number;
  paymentId?: string;
  onRefundRequested?: () => void;
}

interface Refund {
  id: number;
  refund_id: string;
  stripe_refund_id: string;
  amount: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  reason: string;
  description?: string;
  created_at: string;
  processed_at?: string;
  failure_reason?: string;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'succeeded':
      return {
        color: 'success' as const,
        icon: <CheckCircle />,
        label: 'Completed',
        description: 'Refund has been processed successfully'
      };
    case 'pending':
      return {
        color: 'warning' as const,
        icon: <HourglassTop />,
        label: 'Processing',
        description: 'Refund is being processed by Stripe'
      };
    case 'failed':
      return {
        color: 'error' as const,
        icon: <Error />,
        label: 'Failed',
        description: 'Refund processing failed'
      };
    case 'canceled':
      return {
        color: 'default' as const,
        icon: <Cancel />,
        label: 'Cancelled',
        description: 'Refund was cancelled'
      };
    default:
      return {
        color: 'default' as const,
        icon: <HourglassTop />,
        label: 'Unknown',
        description: 'Unknown status'
      };
  }
};

const getReasonLabel = (reason: string) => {
  const reasons: Record<string, string> = {
    'duplicate': 'Duplicate Payment',
    'fraudulent': 'Fraudulent Payment',
    'requested_by_customer': 'Customer Request',
    'booking_canceled': 'Booking Cancelled',
    'host_canceled': 'Host Cancelled',
    'no_show': 'Customer No Show',
    'other': 'Other'
  };
  return reasons[reason] || reason;
};

export default function RefundStatus({ 
  bookingId, 
  paymentId, 
  onRefundRequested 
}: RefundStatusProps) {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (bookingId) {
      loadRefunds();
    }
  }, [bookingId]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const response = await api.get('/payments/refunds/', {
        params: {
          booking_id: bookingId,
          ordering: '-created_at'
        }
      });
      setRefunds(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading refunds:', error);
      // Don't show error toast for missing refunds
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRefunds();
    setRefreshing(false);
    toast.success('Refund status updated');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Loading refund information...
        </Typography>
      </Box>
    );
  }

  if (refunds.length === 0) {
    return null; // No refunds to display
  }

  const totalRefunded = refunds
    .filter(r => r.status === 'succeeded')
    .reduce((sum, r) => sum + parseFloat(r.amount), 0);

  const hasPendingRefunds = refunds.some(r => r.status === 'pending');

  return (
    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <MoneyOff color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Refund Information
            </Typography>
          </Stack>
          <Button
            size="small"
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Stack>

        {totalRefunded > 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={500}>
              Total Refunded: ${totalRefunded.toFixed(2)}
            </Typography>
          </Alert>
        )}

        {hasPendingRefunds && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Your refund is being processed. This typically takes 5-10 business days to appear in your account.
            </Typography>
          </Alert>
        )}

        <Stack spacing={2}>
          {refunds.map((refund, index) => {
            const statusInfo = getStatusInfo(refund.status);
            
            return (
              <Box key={refund.id}>
                {index > 0 && <Divider sx={{ my: 2 }} />}
                
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        icon={statusInfo.icon}
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                      />
                      <Typography variant="body2" fontWeight={500}>
                        ${parseFloat(refund.amount).toFixed(2)}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(refund.created_at), 'MMM d, yyyy h:mm a')}
                    </Typography>
                  </Stack>

                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Reason:</strong> {getReasonLabel(refund.reason)}
                    </Typography>
                    
                    {refund.description && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Details:</strong> {refund.description}
                      </Typography>
                    )}

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Refund ID:</strong> {refund.refund_id}
                    </Typography>

                    {refund.processed_at && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Processed:</strong> {format(new Date(refund.processed_at), 'MMM d, yyyy h:mm a')}
                      </Typography>
                    )}

                    {refund.failure_reason && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          <strong>Failure Reason:</strong> {refund.failure_reason}
                        </Typography>
                      </Alert>
                    )}

                    {refund.status === 'pending' && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress sx={{ height: 4, borderRadius: 1 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Processing refund... This may take a few minutes.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Stack>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="caption" color="text.secondary">
          • Refunds are processed through Stripe<br />
          • It typically takes 5-10 business days for refunds to appear in your account<br />
          • Contact support if you have questions about your refund
        </Typography>
      </CardContent>
    </Card>
  );
}