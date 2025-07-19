import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Link,
  Typography,
  Collapse,
  IconButton,
  Stack,
} from '@mui/material';
import {
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Gavel as GavelIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

interface LegalDisclaimerProps {
  type: 'booking' | 'listing' | 'signup' | 'checkout' | 'general';
  required?: boolean;
  onAccept?: (accepted: boolean) => void;
  compact?: boolean;
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({
  type,
  required = false,
  onAccept,
  compact = false
}) => {
  const [accepted, setAccepted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);

  const handleAcceptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isAccepted = event.target.checked;
    setAccepted(isAccepted);
    onAccept?.(isAccepted);
  };

  const getDisclaimerContent = () => {
    switch (type) {
      case 'booking':
        return {
          title: 'Booking Agreement & Liability Waiver',
          summary: 'By booking this parking space, you acknowledge the risks and agree to our terms.',
          details: [
            'You understand that parking involves inherent risks of theft, damage, or injury',
            'Parking in a Pinch is not liable for any damages, theft, or incidents',
            'You have valid insurance coverage for your vehicle',
            'You agree to follow all Host rules and local laws',
            'Disputes with Hosts must be resolved directly between parties',
            'You waive rights to class action lawsuits against our platform',
            'All bookings are subject to our Terms and Conditions'
          ]
        };
      
      case 'listing':
        return {
          title: 'Host Listing Agreement & Legal Compliance',
          summary: 'By listing your parking space, you confirm legal authority and accept responsibilities.',
          details: [
            'You have full legal right to rent this parking space',
            'You comply with all local zoning, HOA, and rental laws',
            'You maintain appropriate property and liability insurance',
            'You understand Parking in a Pinch is not liable for incidents on your property',
            'You agree to indemnify Parking in a Pinch from any claims related to your listing',
            'You will not discriminate against Renters based on protected characteristics',
            'All transactions must occur through our platform'
          ]
        };
      
      case 'signup':
        return {
          title: 'User Agreement & Platform Terms',
          summary: 'Creating an account means you accept our comprehensive terms and legal framework.',
          details: [
            'You are at least 18 years old and legally capable of entering contracts',
            'You will provide accurate information and maintain account security',
            'You understand this platform facilitates peer-to-peer transactions',
            'You accept that we are not party to agreements between users',
            'You agree to binding arbitration for disputes with our platform',
            'You waive rights to class action lawsuits',
            'You accept our Privacy Policy and data processing practices'
          ]
        };
      
      case 'checkout':
        return {
          title: 'Payment Authorization & Final Booking Confirmation',
          summary: 'Completing payment confirms your booking and acceptance of all terms.',
          details: [
            'Payment authorizes final booking confirmation',
            'All fees are clearly disclosed and non-refundable except per our policy',
            'You accept cancellation and refund policies',
            'You confirm vehicle information is accurate',
            'You authorize charges for overstays or damages',
            'Payment disputes are handled through our payment processors',
            'This booking constitutes a legally binding agreement'
          ]
        };
      
      default:
        return {
          title: 'Legal Notice & Risk Acknowledgment',
          summary: 'Using our platform involves legal agreements and inherent risks.',
          details: [
            'This platform facilitates transactions between independent parties',
            'We are not liable for user actions or property conditions',
            'All users must maintain appropriate insurance coverage',
            'Disputes are resolved through binding arbitration',
            'Use of this platform is at your own risk'
          ]
        };
    }
  };

  const content = getDisclaimerContent();

  if (compact) {
    return (
      <Alert 
        severity="warning" 
        icon={<WarningIcon />}
        sx={{ mb: 2 }}
      >
        <Typography variant="body2" fontWeight={600}>
          {content.summary}
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          By proceeding, you agree to our{' '}
          <Link href="/terms" target="_blank" color="primary">
            Terms and Conditions
          </Link>
          {' '}and{' '}
          <Link href="/privacy" target="_blank" color="primary">
            Privacy Policy
          </Link>
          .
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Alert 
        severity="warning"
        icon={<GavelIcon />}
        sx={{ mb: 2 }}
        action={
          <IconButton 
            color="inherit" 
            size="small"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        }
      >
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {content.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {content.summary}
        </Typography>
      </Alert>

      <Collapse in={expanded}>
        <Box sx={{ pl: 2, pr: 2, pb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon fontSize="small" />
            Important Legal Requirements:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            {content.details.map((detail, index) => (
              <li key={index}>
                <Typography variant="body2" paragraph>
                  {detail}
                </Typography>
              </li>
            ))}
          </Box>
          
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowFullTerms(true)}
            >
              Read Full Terms
            </Button>
            <Button
              variant="outlined"
              size="small"
              href="/privacy"
              target="_blank"
            >
              Privacy Policy
            </Button>
          </Stack>
        </Box>
      </Collapse>

      {required && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={accepted}
                onChange={handleAcceptChange}
                color="primary"
                required
              />
            }
            label={
              <Typography variant="body2">
                <strong>I acknowledge that I have read and understand the above legal requirements and agree to be bound by them.</strong>
                {' '}I further confirm that I have read and accept the{' '}
                <Link href="/terms" target="_blank" color="primary">
                  complete Terms and Conditions
                </Link>
                {' '}and{' '}
                <Link href="/privacy" target="_blank" color="primary">
                  Privacy Policy
                </Link>
                .
              </Typography>
            }
          />
        </Box>
      )}

      {/* Full Terms Dialog */}
      <Dialog
        open={showFullTerms}
        onClose={() => setShowFullTerms(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Complete Terms and Conditions
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Please review our complete Terms and Conditions for full legal details.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            href="/terms"
            target="_blank"
            sx={{ mb: 2 }}
          >
            Open Full Terms in New Tab
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFullTerms(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LegalDisclaimer;