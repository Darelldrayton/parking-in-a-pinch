import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  MoneyOff,
  Warning,
  Info,
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface RefundRequestDialogProps {
  open: boolean;
  onClose: () => void;
  booking: any;
  payment: any;
  onRefundRequested?: () => void;
}

const REFUND_REASONS = [
  { value: 'cancelled_by_user', label: 'I need to cancel my booking' },
  { value: 'cancelled_by_host', label: 'Host cancelled the booking' },
  { value: 'no_show', label: 'I could not access the parking space' },
  { value: 'space_unavailable', label: 'Parking space was not available' },
  { value: 'emergency', label: 'Emergency situation' },
  { value: 'weather', label: 'Weather-related cancellation' },
  { value: 'payment_issue', label: 'Payment processing issue' },
  { value: 'dispute', label: 'Dispute with host' },
  { value: 'other', label: 'Other reason' },
];

export default function RefundRequestDialog({
  open,
  onClose,
  booking,
  payment,
  onRefundRequested
}: RefundRequestDialogProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimatedRefund, setEstimatedRefund] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason for the refund');
      return;
    }

    setLoading(true);
    try {
      // Create a refund request that requires admin approval
      const response = await api.post('/payments/admin/refund-requests/', {
        booking: booking.id,
        payment: payment?.id || booking.payment?.id,
        reason: reason,
        requested_amount: calculateEstimatedRefund(),
        customer_notes: description.trim() || undefined,
      });

      toast.success('Refund request submitted for review!');
      onRefundRequested?.();
      onClose();
    } catch (error: any) {
      console.error('Error requesting refund:', error);
      
      // If the admin endpoint fails, try creating a user refund request
      if (error.response?.status === 403) {
        try {
          // Alternative: Create through booking refund request endpoint
          const response = await api.post(`/bookings/bookings/${booking.id}/request_refund/`, {
            reason: reason,
            description: description.trim() || undefined,
            requested_amount: calculateEstimatedRefund(),
          });
          
          toast.success('Refund request submitted for review!');
          onRefundRequested?.();
          onClose();
        } catch (fallbackError: any) {
          const errorMessage = fallbackError.response?.data?.error || 
                              fallbackError.response?.data?.detail ||
                              'Failed to submit refund request';
          toast.error(errorMessage);
        }
      } else {
        const errorMessage = error.response?.data?.error || 
                            error.response?.data?.detail ||
                            'Failed to submit refund request';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedRefund = () => {
    if (!booking) return 0;
    
    // Get payment amount from multiple sources for sandbox testing
    let paymentAmount = 0;
    if (payment?.amount && parseFloat(payment.amount) > 0) {
      paymentAmount = parseFloat(payment.amount);
    } else if (booking?.total_amount) {
      paymentAmount = parseFloat(booking.total_amount);
    } else {
      paymentAmount = 25.00; // Default test amount for sandbox
    }
    
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const minutesUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60);
    
    // Updated refund policy:
    // Note: This dialog is only shown after check-in, so automatic 100% refunds are no longer available
    // All refunds at this point require admin review
    
    // Since user has already checked in, refunds are discretionary and require admin approval
    // Show estimated amount but note it needs admin review
    return paymentAmount * 0.75; // Suggest 75% as typical post-check-in refund amount
  };

  const getRefundPolicyMessage = () => {
    if (!booking) return '';
    
    // Since this dialog only shows after check-in, provide appropriate messaging
    return 'Post check-in refund request - requires admin review and approval';
  };

  const estimatedAmount = calculateEstimatedRefund();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <MoneyOff color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Request Refund
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={3}>
          {/* Booking Summary */}
          <Box sx={{ 
            p: 2, 
            bgcolor: 'grey.50', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'grey.200'
          }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Booking Details
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Location:</strong> {booking?.parking_space?.title}
              </Typography>
              <Typography variant="body2">
                <strong>Date:</strong> {booking ? format(new Date(booking.start_time), 'EEEE, MMMM d, yyyy') : ''}
              </Typography>
              <Typography variant="body2">
                <strong>Time:</strong> {booking ? `${format(new Date(booking.start_time), 'h:mm a')} - ${format(new Date(booking.end_time), 'h:mm a')}` : ''}
              </Typography>
              <Typography variant="body2">
                <strong>Amount Paid:</strong> ${payment?.amount && parseFloat(payment.amount) > 0 
                  ? parseFloat(payment.amount).toFixed(2) 
                  : booking?.total_amount 
                    ? parseFloat(booking.total_amount).toFixed(2)
                    : '25.00' /* Default test amount */}
              </Typography>
            </Stack>
          </Box>

          {/* Refund Policy Info */}
          <Alert 
            severity="warning"
            icon={<Info />}
          >
            <Typography variant="body2" fontWeight={500}>
              {getRefundPolicyMessage()}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontSize: '0.85rem' }}>
              Note: Automatic 100% refunds are only available before check-in (more than 16 minutes before start time)
            </Typography>
          </Alert>

          {/* Refund Reason */}
          <FormControl fullWidth required>
            <InputLabel>Reason for Refund</InputLabel>
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              label="Reason for Refund"
            >
              {REFUND_REASONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Additional Description */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Additional Details (Optional)"
            placeholder="Please provide any additional information about your refund request..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            helperText="Providing more details can help us process your request faster"
          />

          {/* Processing Information */}
          <Alert severity="warning">
            <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
              ⚠️ Refund Approval Required
            </Typography>
            <Typography variant="body2">
              • Your refund request will be reviewed by our admin team
            </Typography>
            <Typography variant="body2">
              • You'll receive an email once your request is reviewed (typically within 24-48 hours)
            </Typography>
            <Typography variant="body2">
              • Approved refunds are processed through Stripe and take 5-10 business days
            </Typography>
            <Typography variant="body2">
              • You can track your refund request status in your booking details
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !reason}
          startIcon={loading ? <CircularProgress size={16} /> : <MoneyOff />}
        >
          {loading ? 'Processing...' : `Request Refund Review`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}