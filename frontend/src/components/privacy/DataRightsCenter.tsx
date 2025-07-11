import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  useTheme,
  alpha,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Security as SecurityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  Help as HelpIcon,
  Flag as FlagIcon,
  Check as CheckIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface DataRequest {
  id: string;
  type: 'access' | 'deletion' | 'rectification' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  jurisdiction: 'gdpr' | 'ccpa' | 'general';
  created_at: string;
  description?: string;
  response?: string;
}

interface UserJurisdiction {
  region: 'eu' | 'california' | 'other';
  country?: string;
  state?: string;
  applicableRights: string[];
}

export const DataRightsCenter: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [jurisdiction, setJurisdiction] = useState<UserJurisdiction | null>(null);
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedRightType, setSelectedRightType] = useState<string>('');
  const [requestDescription, setRequestDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    detectUserJurisdiction();
    loadDataRequests();
  }, []);

  const detectUserJurisdiction = async () => {
    try {
      // Try to detect user's location based on IP or account information
      const response = await api.get('/api/v1/privacy/jurisdiction/');
      setJurisdiction(response.data);
    } catch (error) {
      // Default to general rights if detection fails
      setJurisdiction({
        region: 'other',
        applicableRights: ['access', 'deletion', 'rectification']
      });
    }
  };

  const loadDataRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/privacy/data-requests/');
      setRequests(response.data);
    } catch (error) {
      console.error('Error loading data requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitDataRequest = async () => {
    if (!selectedRightType || !requestDescription.trim()) {
      toast.error('Please select a request type and provide a description');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/api/v1/privacy/data-requests/', {
        type: selectedRightType,
        description: requestDescription,
        jurisdiction: jurisdiction?.region || 'general'
      });
      
      setRequests(prev => [response.data, ...prev]);
      setShowRequestDialog(false);
      setSelectedRightType('');
      setRequestDescription('');
      
      toast.success('Data rights request submitted successfully');
    } catch (error) {
      console.error('Error submitting data request:', error);
      toast.error('Failed to submit data request');
    } finally {
      setSubmitting(false);
    }
  };

  const getJurisdictionInfo = () => {
    if (!jurisdiction) return null;

    switch (jurisdiction.region) {
      case 'eu':
        return {
          name: 'European Union (GDPR)',
          law: 'General Data Protection Regulation',
          authority: 'Local Data Protection Authority',
          rights: [
            { id: 'access', name: 'Right of Access', description: 'Obtain a copy of your personal data' },
            { id: 'rectification', name: 'Right to Rectification', description: 'Correct inaccurate personal data' },
            { id: 'deletion', name: 'Right to Erasure', description: 'Request deletion of your data' },
            { id: 'restriction', name: 'Right to Restriction', description: 'Limit how we process your data' },
            { id: 'portability', name: 'Right to Data Portability', description: 'Receive your data in a portable format' },
            { id: 'objection', name: 'Right to Object', description: 'Object to certain processing activities' }
          ]
        };
      
      case 'california':
        return {
          name: 'California (CCPA)',
          law: 'California Consumer Privacy Act',
          authority: 'California Attorney General',
          rights: [
            { id: 'access', name: 'Right to Know', description: 'Know what personal information is collected' },
            { id: 'deletion', name: 'Right to Delete', description: 'Request deletion of personal information' },
            { id: 'portability', name: 'Right to Data Portability', description: 'Receive a copy of your data' },
            { id: 'objection', name: 'Right to Opt-Out', description: 'Opt-out of sale of personal information' }
          ]
        };
      
      default:
        return {
          name: 'General Privacy Rights',
          law: 'Platform Privacy Policy',
          authority: 'Data Protection Officer',
          rights: [
            { id: 'access', name: 'Data Access', description: 'Request access to your data' },
            { id: 'rectification', name: 'Data Correction', description: 'Correct your personal information' },
            { id: 'deletion', name: 'Account Deletion', description: 'Delete your account and data' }
          ]
        };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'rejected': return 'error';
      default: return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckIcon />;
      case 'processing': return <LinearProgress />;
      case 'rejected': return <BlockIcon />;
      default: return <HelpIcon />;
    }
  };

  const jurisdictionInfo = getJurisdictionInfo();

  if (!jurisdictionInfo) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Detecting your privacy rights...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <GavelIcon color="primary" />
        Data Rights Center
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Exercise your privacy rights under applicable data protection laws.
      </Typography>

      {/* Jurisdiction Information */}
      <Card sx={{ mb: 4, border: `2px solid ${theme.palette.primary.main}` }}>
        <CardHeader
          avatar={<FlagIcon color="primary" />}
          title={`Your Rights Under ${jurisdictionInfo.name}`}
          subheader={`Protected by ${jurisdictionInfo.law}`}
          sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Based on your location, you have the following privacy rights:
          </Typography>
          
          <Grid container spacing={2}>
            {jurisdictionInfo.rights.map((right) => (
              <Grid item xs={12} md={6} key={right.id}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {right.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {right.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>Supervisory Authority:</strong> {jurisdictionInfo.authority}
              <br />
              You have the right to lodge a complaint with your local data protection authority.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Submit New Request */}
      <Card sx={{ mb: 4 }}>
        <CardHeader
          avatar={<SecurityIcon color="primary" />}
          title="Submit a Data Rights Request"
          subheader="Exercise your privacy rights"
        />
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            You can request access to your data, ask for corrections, or request deletion. We will respond within 30 days.
          </Typography>
          
          <Button
            variant="contained"
            size="large"
            onClick={() => setShowRequestDialog(true)}
            startIcon={<GavelIcon />}
          >
            Submit Data Rights Request
          </Button>
        </CardContent>
      </Card>

      {/* Request History */}
      <Card>
        <CardHeader
          avatar={<VisibilityIcon color="primary" />}
          title="Your Request History"
          subheader={`${requests.length} requests submitted`}
        />
        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : requests.length === 0 ? (
            <Alert severity="info">
              <Typography variant="body2">
                You haven't submitted any data rights requests yet.
              </Typography>
            </Alert>
          ) : (
            <List>
              {requests.map((request, index) => (
                <React.Fragment key={request.id}>
                  <ListItem sx={{ alignItems: 'flex-start' }}>
                    <ListItemIcon sx={{ mt: 1 }}>
                      {getStatusIcon(request.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Request
                          </Typography>
                          <Chip
                            label={request.status}
                            size="small"
                            color={getStatusColor(request.status) as any}
                          />
                        </Stack>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {request.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Submitted: {new Date(request.created_at).toLocaleDateString()}
                          </Typography>
                          {request.response && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                              <Typography variant="body2">
                                <strong>Response:</strong> {request.response}
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < requests.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Request Dialog */}
      <Dialog
        open={showRequestDialog}
        onClose={() => setShowRequestDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          Submit Data Rights Request
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the type of request you'd like to make and provide details about what you need.
          </Typography>

          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend">Request Type</FormLabel>
            <RadioGroup
              value={selectedRightType}
              onChange={(e) => setSelectedRightType(e.target.value)}
            >
              {jurisdictionInfo.rights.map((right) => (
                <FormControlLabel
                  key={right.id}
                  value={right.id}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        {right.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {right.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            label="Request Details"
            multiline
            rows={4}
            value={requestDescription}
            onChange={(e) => setRequestDescription(e.target.value)}
            placeholder="Please provide specific details about your request..."
            helperText="Be as specific as possible to help us process your request efficiently"
          />

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              We will respond to your request within 30 days. You may be asked to verify your identity before we process certain requests.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setShowRequestDialog(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitDataRequest}
            disabled={!selectedRightType || !requestDescription.trim() || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataRightsCenter;