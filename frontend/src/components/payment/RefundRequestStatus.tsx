import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Button,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  HourglassTop,
  CheckCircle,
  Cancel,
  RequestQuote,
  AdminPanelSettings,
  MoneyOff,
  Email,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';

interface RefundRequestStatusProps {
  bookingId: number;
  onStatusUpdate?: () => void;
}

interface RefundRequest {
  id: number;
  request_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requested_amount: string;
  approved_amount?: string;
  reason: string;
  customer_notes?: string;
  admin_notes?: string;
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  processed_at?: string;
  reviewed_by?: {
    username: string;
    email: string;
  };
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        color: 'warning' as const,
        icon: <HourglassTop />,
        label: 'Pending Review',
        description: 'Your refund request is awaiting admin review'
      };
    case 'approved':
      return {
        color: 'info' as const,
        icon: <AdminPanelSettings />,
        label: 'Approved',
        description: 'Your refund has been approved and will be processed'
      };
    case 'rejected':
      return {
        color: 'error' as const,
        icon: <Cancel />,
        label: 'Rejected',
        description: 'Your refund request was not approved'
      };
    case 'processed':
      return {
        color: 'success' as const,
        icon: <CheckCircle />,
        label: 'Processed',
        description: 'Your refund has been sent to your payment method'
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

export default function RefundRequestStatus({ 
  bookingId, 
  onStatusUpdate 
}: RefundRequestStatusProps) {
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      loadRefundRequests();
    }
  }, [bookingId]);

  const loadRefundRequests = async () => {
    try {
      setLoading(true);
      // Try to load refund requests for this booking
      const response = await api.get('/payments/admin/refund-requests/', {
        params: {
          booking: bookingId,
          ordering: '-created_at'
        }
      });
      setRefundRequests(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading refund requests:', error);
      // Don't show error toast for missing refund requests
      setRefundRequests([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (refundRequests.length === 0) {
    return null; // No refund requests to display
  }

  const latestRequest = refundRequests[0]; // Show the most recent request
  const statusInfo = getStatusInfo(latestRequest.status);

  return (
    <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <RequestQuote color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Refund Request Status
            </Typography>
          </Stack>
          <Chip
            icon={statusInfo.icon}
            label={statusInfo.label}
            color={statusInfo.color}
            size="small"
          />
        </Stack>

        {/* Status Alert */}
        <Alert 
          severity={
            latestRequest.status === 'processed' ? 'success' :
            latestRequest.status === 'rejected' ? 'error' :
            latestRequest.status === 'approved' ? 'info' :
            'warning'
          }
          sx={{ mb: 3 }}
        >
          <Typography variant="body2" fontWeight={500}>
            {statusInfo.description}
          </Typography>
          {latestRequest.status === 'pending' && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Expected review time: 24-48 hours
            </Typography>
          )}
          {latestRequest.status === 'rejected' && latestRequest.rejection_reason && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Reason:</strong> {latestRequest.rejection_reason}
            </Typography>
          )}
        </Alert>

        {/* Request Details */}
        <Box sx={{ mb: 3 }}>
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Request ID:</strong> {latestRequest.request_id}
            </Typography>
            <Typography variant="body2">
              <strong>Requested Amount:</strong> ${parseFloat(latestRequest.requested_amount).toFixed(2)}
            </Typography>
            {latestRequest.approved_amount && (
              <Typography variant="body2" color="success.main">
                <strong>Approved Amount:</strong> ${parseFloat(latestRequest.approved_amount).toFixed(2)}
              </Typography>
            )}
            <Typography variant="body2">
              <strong>Reason:</strong> {latestRequest.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Typography>
            {latestRequest.customer_notes && (
              <Typography variant="body2">
                <strong>Your Notes:</strong> {latestRequest.customer_notes}
              </Typography>
            )}
            {latestRequest.admin_notes && latestRequest.status !== 'pending' && (
              <Typography variant="body2">
                <strong>Admin Notes:</strong> {latestRequest.admin_notes}
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Timeline */}
        <Timeline position="alternate" sx={{ p: 0 }}>
          <TimelineItem>
            <TimelineOppositeContent sx={{ flex: 0.3 }}>
              <Typography variant="caption" color="text.secondary">
                {format(new Date(latestRequest.created_at), 'MMM d, h:mm a')}
              </Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
              <TimelineDot color="primary">
                <RequestQuote fontSize="small" />
              </TimelineDot>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="body2" fontWeight={500}>
                Request Submitted
              </Typography>
            </TimelineContent>
          </TimelineItem>

          {latestRequest.reviewed_at && (
            <TimelineItem>
              <TimelineOppositeContent sx={{ flex: 0.3 }}>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(latestRequest.reviewed_at), 'MMM d, h:mm a')}
                </Typography>
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={latestRequest.status === 'rejected' ? 'error' : 'info'}>
                  <AdminPanelSettings fontSize="small" />
                </TimelineDot>
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body2" fontWeight={500}>
                  {latestRequest.status === 'rejected' ? 'Request Rejected' : 'Request Approved'}
                </Typography>
                {latestRequest.reviewed_by && (
                  <Typography variant="caption" color="text.secondary">
                    by {latestRequest.reviewed_by.username}
                  </Typography>
                )}
              </TimelineContent>
            </TimelineItem>
          )}

          {latestRequest.processed_at && (
            <TimelineItem>
              <TimelineOppositeContent sx={{ flex: 0.3 }}>
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(latestRequest.processed_at), 'MMM d, h:mm a')}
                </Typography>
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color="success">
                  <MoneyOff fontSize="small" />
                </TimelineDot>
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body2" fontWeight={500}>
                  Refund Processed
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Sent to Stripe
                </Typography>
              </TimelineContent>
            </TimelineItem>
          )}
        </Timeline>

        {/* Next Steps */}
        {latestRequest.status === 'pending' && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Email fontSize="small" />
              <Typography variant="body2">
                You'll receive an email notification once your request is reviewed
              </Typography>
            </Stack>
          </Alert>
        )}

        {latestRequest.status === 'processed' && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2">
              Your refund has been processed and will appear in your account within 5-10 business days
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}