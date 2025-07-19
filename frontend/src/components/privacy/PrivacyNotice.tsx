import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Stack,
  Typography,
  useTheme,
  alpha,
  Chip,
} from '@mui/material';
import {
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Security as SecurityIcon,
  Visibility as VisibilityIcon,
  LocationOn as LocationIcon,
  Camera as CameraIcon,
  Payment as PaymentIcon,
  Contact as ContactIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface PrivacyNoticeProps {
  type: 'location' | 'camera' | 'payment' | 'contact' | 'profile' | 'booking' | 'communication' | 'analytics';
  context?: string;
  required?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
  compact?: boolean;
  showDialog?: boolean;
  autoShow?: boolean;
}

interface NoticeContent {
  title: string;
  icon: React.ReactNode;
  summary: string;
  details: string[];
  dataTypes: string[];
  purpose: string[];
  retention: string;
  legalBasis: string;
  rights: string[];
}

export const PrivacyNotice: React.FC<PrivacyNoticeProps> = ({
  type,
  context,
  required = false,
  onAccept,
  onDecline,
  compact = false,
  showDialog = false,
  autoShow = false
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(showDialog);

  const getNoticeContent = (): NoticeContent => {
    switch (type) {
      case 'location':
        return {
          title: 'Location Data Collection',
          icon: <LocationIcon color="primary" />,
          summary: 'We need to access your location to show nearby parking spaces and navigate to your bookings.',
          details: [
            'Precise GPS coordinates when booking parking',
            'Approximate location for search results',
            'Navigation data during active bookings',
            'Check-in/check-out location verification'
          ],
          dataTypes: ['GPS coordinates', 'IP-based location', 'Navigation history'],
          purpose: ['Find nearby parking', 'Verify bookings', 'Improve recommendations', 'Fraud prevention'],
          retention: '2 years or until account deletion',
          legalBasis: 'Legitimate interest for service provision',
          rights: ['Withdraw consent', 'Request deletion', 'Restrict processing']
        };
      
      case 'camera':
        return {
          title: 'Camera and Photo Access',
          icon: <CameraIcon color="primary" />,
          summary: 'Camera access is needed for profile photos, parking space images, and damage documentation.',
          details: [
            'Profile photo capture and upload',
            'Parking space condition documentation',
            'Vehicle damage reporting photos',
            'Identity verification photos'
          ],
          dataTypes: ['Photos and images', 'Camera metadata', 'Timestamp and location data'],
          purpose: ['User verification', 'Property documentation', 'Dispute resolution', 'Trust and safety'],
          retention: '7 years for legal compliance',
          legalBasis: 'Contract performance and legal obligations',
          rights: ['Access photos', 'Delete images', 'Restrict usage']
        };
      
      case 'payment':
        return {
          title: 'Payment Information Processing',
          icon: <PaymentIcon color="primary" />,
          summary: 'Payment data is processed securely through encrypted payment processors to complete transactions.',
          details: [
            'Credit/debit card information (tokenized)',
            'Banking details for payouts',
            'Transaction history and receipts',
            'Fraud detection and prevention data'
          ],
          dataTypes: ['Payment card tokens', 'Bank account details', 'Transaction records'],
          purpose: ['Process payments', 'Fraud prevention', 'Tax compliance', 'Dispute resolution'],
          retention: '7 years for tax and legal requirements',
          legalBasis: 'Contract performance and legal obligations',
          rights: ['Access transaction data', 'Request corrections', 'Data portability']
        };
      
      case 'contact':
        return {
          title: 'Contact Information Usage',
          icon: <ContactIcon color="primary" />,
          summary: 'We use your contact information to communicate about bookings, account updates, and platform notifications.',
          details: [
            'Email address for notifications and support',
            'Phone number for SMS alerts and verification',
            'Emergency contact information',
            'Communication preferences and history'
          ],
          dataTypes: ['Email address', 'Phone number', 'Communication logs'],
          purpose: ['Account notifications', 'Booking confirmations', 'Customer support', 'Emergency contact'],
          retention: 'Duration of account plus 2 years',
          legalBasis: 'Contract performance and legitimate interest',
          rights: ['Update information', 'Opt-out of marketing', 'Data portability']
        };
      
      case 'profile':
        return {
          title: 'Profile Data Collection',
          icon: <VisibilityIcon color="primary" />,
          summary: 'Profile information helps create your account, verify identity, and personalize your experience.',
          details: [
            'Personal information (name, age, photo)',
            'Identity verification documents',
            'User preferences and settings',
            'Account activity and usage patterns'
          ],
          dataTypes: ['Personal identifiers', 'Verification documents', 'Preferences', 'Activity logs'],
          purpose: ['Account creation', 'Identity verification', 'Personalization', 'Trust and safety'],
          retention: 'Duration of account plus 90 days',
          legalBasis: 'Contract performance and consent',
          rights: ['Access profile data', 'Update information', 'Request deletion']
        };
      
      case 'booking':
        return {
          title: 'Booking Data Processing',
          icon: <InfoIcon color="primary" />,
          summary: 'Booking information is shared between hosts and renters to facilitate parking arrangements.',
          details: [
            'Vehicle information and license plate',
            'Booking dates, times, and location',
            'Host and renter contact details',
            'Payment and billing information'
          ],
          dataTypes: ['Vehicle details', 'Booking information', 'Contact details', 'Payment data'],
          purpose: ['Facilitate bookings', 'Enable communication', 'Process payments', 'Dispute resolution'],
          retention: '7 years for legal and tax compliance',
          legalBasis: 'Contract performance',
          rights: ['Access booking data', 'Request corrections', 'Data portability']
        };
      
      case 'communication':
        return {
          title: 'Communication Monitoring',
          icon: <ContactIcon color="primary" />,
          summary: 'Platform communications are monitored for safety, legal compliance, and quality assurance.',
          details: [
            'In-app messages between users',
            'Customer support conversations',
            'Review and rating content',
            'Automated content filtering'
          ],
          dataTypes: ['Message content', 'Communication metadata', 'User interactions'],
          purpose: ['Safety monitoring', 'Legal compliance', 'Quality assurance', 'Dispute resolution'],
          retention: '2 years or as required by law',
          legalBasis: 'Legitimate interest and legal obligations',
          rights: ['Access communications', 'Request deletion', 'Object to processing']
        };
      
      default:
        return {
          title: 'Data Collection Notice',
          icon: <SecurityIcon color="primary" />,
          summary: 'We collect and process certain information to provide and improve our services.',
          details: [
            'Information necessary for platform functionality',
            'Data to improve user experience',
            'Analytics and performance metrics'
          ],
          dataTypes: ['Usage data', 'Device information', 'Performance metrics'],
          purpose: ['Service provision', 'Platform improvement', 'Analytics'],
          retention: 'Varies by data type',
          legalBasis: 'Legitimate interest',
          rights: ['Access data', 'Request deletion', 'Object to processing']
        };
    }
  };

  const content = getNoticeContent();

  const handleAccept = () => {
    setDialogOpen(false);
    onAccept?.();
  };

  const handleDecline = () => {
    setDialogOpen(false);
    onDecline?.();
  };

  if (compact) {
    return (
      <Alert 
        severity="info" 
        icon={content.icon}
        sx={{ mb: 2 }}
        action={
          <Button
            size="small"
            onClick={() => setDialogOpen(true)}
          >
            Details
          </Button>
        }
      >
        <Typography variant="body2">
          <strong>{content.title}:</strong> {content.summary}
        </Typography>
      </Alert>
    );
  }

  return (
    <>
      <Alert
        severity="info"
        icon={content.icon}
        sx={{ mb: 2 }}
        action={
          <IconButton
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
        
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Data We Collect:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2, mt: 0 }}>
              {content.details.map((detail, index) => (
                <li key={index}>
                  <Typography variant="body2">{detail}</Typography>
                </li>
              ))}
            </Box>
            
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Data Types:
              </Typography>
              {content.dataTypes.map((type, index) => (
                <Chip key={index} label={type} size="small" variant="outlined" />
              ))}
            </Stack>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Retention:</strong> {content.retention}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Legal Basis:</strong> {content.legalBasis}
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setDialogOpen(true)}
              >
                Full Details
              </Button>
              <Link href="/privacy" target="_blank" color="primary">
                <Button variant="text" size="small">
                  Privacy Policy
                </Button>
              </Link>
            </Stack>
          </Box>
        </Collapse>
      </Alert>

      {/* Detailed Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {content.icon}
            <Typography variant="h5" fontWeight={600}>
              {content.title}
            </Typography>
          </Stack>
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body1" paragraph>
            {content.summary}
          </Typography>
          
          <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
            Information We Collect
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            {content.details.map((detail, index) => (
              <li key={index}>
                <Typography variant="body2" paragraph>
                  {detail}
                </Typography>
              </li>
            ))}
          </Box>
          
          <Typography variant="h6" fontWeight={600} gutterBottom>
            How We Use This Information
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            {content.purpose.map((purpose, index) => (
              <li key={index}>
                <Typography variant="body2" paragraph>
                  {purpose}
                </Typography>
              </li>
            ))}
          </Box>
          
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Your Rights
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            {content.rights.map((right, index) => (
              <li key={index}>
                <Typography variant="body2" paragraph>
                  {right}
                </Typography>
              </li>
            ))}
          </Box>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Data Retention:</strong> {content.retention}<br />
              <strong>Legal Basis:</strong> {content.legalBasis}
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          {required ? (
            <>
              <Button
                variant="outlined"
                onClick={handleDecline}
                color="error"
              >
                Decline
              </Button>
              <Button
                variant="contained"
                onClick={handleAccept}
              >
                Accept & Continue
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={() => setDialogOpen(false)}
            >
              Understood
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PrivacyNotice;