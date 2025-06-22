import React from 'react';
import {
  Alert,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import {
  Info,
  Speed,
  AdminPanelSettings,
} from '@mui/icons-material';

interface RefundSettingsInfoProps {
  requiresApproval?: boolean;
}

export default function RefundSettingsInfo({ requiresApproval = false }: RefundSettingsInfoProps) {
  return (
    <Alert 
      severity="info" 
      icon={<Info />}
      sx={{ mb: 2 }}
    >
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="body2" fontWeight={500}>
            Refund Processing:
          </Typography>
          <Chip
            icon={requiresApproval ? <AdminPanelSettings /> : <Speed />}
            label={requiresApproval ? "Requires Approval" : "Automatic"}
            color={requiresApproval ? "warning" : "success"}
            size="small"
          />
        </Stack>
        
        {requiresApproval ? (
          <Typography variant="body2">
            • Your refund request will be reviewed by our support team<br />
            • You'll receive email updates on the status of your request<br />
            • Typical review time: 1-2 business days<br />
            • Approved refunds are processed through Stripe (5-10 business days)
          </Typography>
        ) : (
          <Typography variant="body2">
            • Refunds are processed automatically based on our cancellation policy<br />
            • Eligible refunds are sent to Stripe immediately<br />
            • Refunds typically appear in your account within 5-10 business days<br />
            • No manual approval required for policy-compliant refunds
          </Typography>
        )}
      </Box>
    </Alert>
  );
}