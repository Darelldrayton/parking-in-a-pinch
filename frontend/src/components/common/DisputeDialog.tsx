import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Divider,
  Alert,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Gavel,
  Report,
  Close as CloseIcon,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface DisputeDialogProps {
  open: boolean;
  onClose: () => void;
  bookingId?: string;
  respondentEmail?: string;
}

export default function DisputeDialog({
  open,
  onClose,
  bookingId,
  respondentEmail,
}: DisputeDialogProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dispute_type: '',
    subject: '',
    description: '',
    booking_id: bookingId || '',
    respondent_email: respondentEmail || '',
    priority: 'medium',
    disputed_amount: '',
    refund_requested: false,
    refund_amount: '',
  });

  const disputeTypes = [
    { value: 'host_issue', label: 'Issue with Host' },
    { value: 'renter_issue', label: 'Issue with Renter' },
    { value: 'refund_request', label: 'Refund Request' },
    { value: 'property_damage', label: 'Property Damage' },
    { value: 'no_show', label: 'No Show' },
    { value: 'billing_issue', label: 'Billing Issue' },
    { value: 'other', label: 'Other' },
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.dispute_type || !formData.subject || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.refund_requested && !formData.refund_amount) {
      toast.error('Please specify refund amount when requesting a refund');
      return;
    }

    setLoading(true);
    try {
      // Prepare data, excluding empty optional fields
      const submitData: any = {
        dispute_type: formData.dispute_type,
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority,
      };

      // Only include optional fields if they have values
      if (formData.booking_id && formData.booking_id.trim()) {
        submitData.booking_id = formData.booking_id.trim();
      }
      
      if (formData.respondent_email && formData.respondent_email.trim()) {
        submitData.respondent_email = formData.respondent_email.trim();
      }
      
      if (formData.disputed_amount) {
        submitData.disputed_amount = parseFloat(formData.disputed_amount);
      }
      
      if (formData.refund_requested) {
        submitData.refund_requested = true;
        if (formData.refund_amount) {
          submitData.refund_amount = parseFloat(formData.refund_amount);
        }
      }

      await api.post('/disputes/', submitData);
      
      toast.success('Dispute filed successfully! Our admin team will review it shortly.');
      onClose();
      setFormData({
        dispute_type: '',
        subject: '',
        description: '',
        booking_id: bookingId || '',
        respondent_email: respondentEmail || '',
        priority: 'medium',
        disputed_amount: '',
        refund_requested: false,
        refund_amount: '',
      });
    } catch (error: any) {
      console.error('Error filing dispute:', error);
      
      let errorMessage = 'Failed to file dispute. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors
        if (typeof errorData === 'object') {
          if (errorData.respondent_email) {
            errorMessage = 'Invalid email address for the other party.';
          } else if (errorData.booking_id) {
            errorMessage = 'Invalid booking ID provided.';
          } else if (errorData.dispute_type) {
            errorMessage = 'Please select a dispute type.';
          } else if (errorData.detail || errorData.error) {
            errorMessage = errorData.detail || errorData.error;
          } else if (errorData.non_field_errors) {
            errorMessage = Array.isArray(errorData.non_field_errors) 
              ? errorData.non_field_errors[0] 
              : errorData.non_field_errors;
          } else {
            // Get first validation error
            const firstError = Object.values(errorData)[0];
            if (Array.isArray(firstError)) {
              errorMessage = firstError[0];
            } else if (typeof firstError === 'string') {
              errorMessage = firstError;
            }
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Gavel sx={{ color: 'warning.main' }} />
          <Typography variant="h6" fontWeight="bold">
            File a Dispute
          </Typography>
        </Box>
        <Button
          onClick={handleClose}
          sx={{ ml: 'auto', minWidth: 'auto', p: 0.5 }}
          disabled={loading}
        >
          <CloseIcon />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          Please provide detailed information about your dispute. Our admin team will review and respond within 24-48 hours.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Dispute Type */}
          <FormControl fullWidth required>
            <InputLabel>Dispute Type</InputLabel>
            <Select
              value={formData.dispute_type}
              label="Dispute Type"
              onChange={(e) => handleInputChange('dispute_type', e.target.value)}
            >
              {disputeTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Subject */}
          <TextField
            label="Subject"
            required
            fullWidth
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="Brief description of the issue"
            inputProps={{ maxLength: 200 }}
            helperText={`${formData.subject.length}/200 characters`}
          />

          {/* Description */}
          <TextField
            label="Detailed Description"
            required
            fullWidth
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Please provide a detailed explanation of the issue, including dates, times, and any relevant information..."
            inputProps={{ maxLength: 2000 }}
            helperText={`${formData.description.length}/2000 characters`}
          />

          {/* Booking ID (if not pre-filled) */}
          {!bookingId && (
            <TextField
              label="Booking ID (Optional)"
              fullWidth
              value={formData.booking_id}
              onChange={(e) => handleInputChange('booking_id', e.target.value)}
              placeholder="e.g., BK1234567890"
              helperText="If this dispute relates to a specific booking"
            />
          )}

          {/* Respondent Email (if not pre-filled) */}
          {!respondentEmail && (
            <TextField
              label="Other Party Email (Optional)"
              fullWidth
              type="email"
              value={formData.respondent_email}
              onChange={(e) => handleInputChange('respondent_email', e.target.value)}
              placeholder="email@example.com"
              helperText="Email of the host or renter you have an issue with"
            />
          )}


          <Divider />

          {/* Priority */}
          <FormControl fullWidth>
            <InputLabel>Priority Level</InputLabel>
            <Select
              value={formData.priority}
              label="Priority Level"
              onChange={(e) => handleInputChange('priority', e.target.value)}
            >
              {priorityLevels.map((priority) => (
                <MenuItem key={priority.value} value={priority.value}>
                  {priority.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          gap: 2,
        }}
      >
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{ minWidth: 100 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Report />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Filing...' : 'File Dispute'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}