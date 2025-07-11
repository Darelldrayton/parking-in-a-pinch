import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  useTheme,
  alpha,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Notifications as NotificationsIcon,
  LocationOn as LocationIcon,
  Cookie as CookieIcon,
  Shield as ShieldIcon,
  History as HistoryIcon,
  CloudDownload as CloudDownloadIcon,
  PersonRemove as PersonRemoveIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface PrivacySettings {
  marketing_emails: boolean;
  newsletter_subscription: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  location_sharing: boolean;
  profile_visibility: 'public' | 'private' | 'verified_only';
  data_sharing_analytics: boolean;
  data_sharing_partners: boolean;
  cookie_preferences: {
    performance: boolean;
    functional: boolean;
    targeting: boolean;
  };
}

interface DataExportRequest {
  status: 'pending' | 'processing' | 'ready' | 'downloaded' | 'expired';
  created_at: string;
  expires_at?: string;
  download_url?: string;
}

interface DeletionRequest {
  status: 'pending' | 'processing' | 'completed';
  created_at: string;
  reason?: string;
  confirmation_required: boolean;
}

export const PrivacyDashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    marketing_emails: false,
    newsletter_subscription: true,
    sms_notifications: true,
    push_notifications: true,
    location_sharing: true,
    profile_visibility: 'public',
    data_sharing_analytics: true,
    data_sharing_partners: false,
    cookie_preferences: {
      performance: true,
      functional: true,
      targeting: false,
    },
  });
  
  const [exportRequest, setExportRequest] = useState<DataExportRequest | null>(null);
  const [deletionRequest, setDeletionRequest] = useState<DeletionRequest | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
    loadDataRequests();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/privacy/settings/');
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const loadDataRequests = async () => {
    try {
      const [exportResponse, deletionResponse] = await Promise.all([
        api.get('/api/v1/privacy/data-export/'),
        api.get('/api/v1/privacy/deletion-request/')
      ]);
      
      if (exportResponse.data) {
        setExportRequest(exportResponse.data);
      }
      
      if (deletionResponse.data) {
        setDeletionRequest(deletionResponse.data);
      }
    } catch (error) {
      console.error('Error loading data requests:', error);
    }
  };

  const savePrivacySettings = async () => {
    try {
      setSaving(true);
      await api.put('/api/v1/privacy/settings/', settings);
      toast.success('Privacy settings updated successfully');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const requestDataExport = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/v1/privacy/data-export/');
      setExportRequest(response.data);
      toast.success('Data export request submitted. You will receive an email when ready.');
    } catch (error) {
      console.error('Error requesting data export:', error);
      toast.error('Failed to request data export');
    } finally {
      setLoading(false);
    }
  };

  const downloadDataExport = async () => {
    if (!exportRequest?.download_url) return;
    
    try {
      const response = await fetch(exportRequest.download_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parking-data-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Data export downloaded successfully');
    } catch (error) {
      console.error('Error downloading data export:', error);
      toast.error('Failed to download data export');
    }
  };

  const requestAccountDeletion = async () => {
    if (deleteConfirmation !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/v1/privacy/deletion-request/', {
        reason: deleteReason,
        confirmation: deleteConfirmation
      });
      
      setDeletionRequest(response.data);
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
      setDeleteReason('');
      
      toast.success('Account deletion request submitted. You will receive an email with next steps.');
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      toast.error('Failed to request account deletion');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof PrivacySettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: event.target.checked
    }));
  };

  const handleCookiePreferenceChange = (key: keyof PrivacySettings['cookie_preferences']) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSettings(prev => ({
      ...prev,
      cookie_preferences: {
        ...prev.cookie_preferences,
        [key]: event.target.checked
      }
    }));
  };

  const getExportStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'success';
      case 'processing': return 'warning';
      case 'expired': return 'error';
      default: return 'info';
    }
  };

  const getExportStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Request Submitted';
      case 'processing': return 'Preparing Export';
      case 'ready': return 'Ready for Download';
      case 'downloaded': return 'Downloaded';
      case 'expired': return 'Link Expired';
      default: return status;
    }
  };

  if (loading && !settings) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Loading privacy settings...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Typography variant="h4" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SecurityIcon color="primary" />
        Privacy Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your privacy settings, data export, and account deletion options.
      </Typography>

      <Grid container spacing={3}>
        {/* Communication Preferences */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<EmailIcon color="primary" />}
              title="Communication Preferences"
              subheader="Control how we communicate with you"
            />
            <CardContent>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.marketing_emails}
                      onChange={handleSettingChange('marketing_emails')}
                    />
                  }
                  label="Marketing Emails"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.newsletter_subscription}
                      onChange={handleSettingChange('newsletter_subscription')}
                    />
                  }
                  label="Newsletter Subscription"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.sms_notifications}
                      onChange={handleSettingChange('sms_notifications')}
                    />
                  }
                  label="SMS Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.push_notifications}
                      onChange={handleSettingChange('push_notifications')}
                    />
                  }
                  label="Push Notifications"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<ShieldIcon color="primary" />}
              title="Privacy Controls"
              subheader="Control your data sharing and visibility"
            />
            <CardContent>
              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.location_sharing}
                      onChange={handleSettingChange('location_sharing')}
                    />
                  }
                  label="Location Sharing"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.data_sharing_analytics}
                      onChange={handleSettingChange('data_sharing_analytics')}
                    />
                  }
                  label="Analytics Data Sharing"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.data_sharing_partners}
                      onChange={handleSettingChange('data_sharing_partners')}
                    />
                  }
                  label="Partner Data Sharing"
                />
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Profile Visibility
                  </Typography>
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={settings.profile_visibility}
                      onChange={(e) => setSettings(prev => ({ ...prev, profile_visibility: e.target.value as any }))}
                    >
                      <FormControlLabel value="public" control={<Radio size="small" />} label="Public" />
                      <FormControlLabel value="verified_only" control={<Radio size="small" />} label="Verified Users Only" />
                      <FormControlLabel value="private" control={<Radio size="small" />} label="Private" />
                    </RadioGroup>
                  </FormControl>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Cookie Preferences */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<CookieIcon color="primary" />}
              title="Cookie Preferences"
              subheader="Manage your cookie settings"
            />
            <CardContent>
              <Stack spacing={2}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Essential cookies are always enabled and cannot be disabled.
                  </Typography>
                </Alert>
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.cookie_preferences.performance}
                      onChange={handleCookiePreferenceChange('performance')}
                    />
                  }
                  label="Performance Cookies"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.cookie_preferences.functional}
                      onChange={handleCookiePreferenceChange('functional')}
                    />
                  }
                  label="Functional Cookies"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.cookie_preferences.targeting}
                      onChange={handleCookiePreferenceChange('targeting')}
                    />
                  }
                  label="Targeting Cookies"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Data Export */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<DownloadIcon color="primary" />}
              title="Data Export"
              subheader="Download a copy of your data"
            />
            <CardContent>
              {exportRequest ? (
                <Box>
                  <Chip
                    label={getExportStatusText(exportRequest.status)}
                    color={getExportStatusColor(exportRequest.status) as any}
                    icon={<HistoryIcon />}
                    sx={{ mb: 2 }}
                  />
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Request created: {new Date(exportRequest.created_at).toLocaleDateString()}
                  </Typography>
                  
                  {exportRequest.status === 'ready' && (
                    <Button
                      variant="contained"
                      startIcon={<CloudDownloadIcon />}
                      onClick={downloadDataExport}
                      sx={{ mt: 2 }}
                    >
                      Download Data
                    </Button>
                  )}
                  
                  {exportRequest.status === 'expired' && (
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={requestDataExport}
                      sx={{ mt: 2 }}
                    >
                      Request New Export
                    </Button>
                  )}
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Download a complete copy of all your data in a portable format.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={requestDataExport}
                    disabled={loading}
                    sx={{ mt: 2 }}
                  >
                    Request Data Export
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Save Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" fontWeight={600}>
                Save Your Privacy Settings
              </Typography>
              <Button
                variant="contained"
                onClick={savePrivacySettings}
                disabled={saving}
                startIcon={saving ? <LinearProgress /> : <CheckIcon />}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Account Deletion */}
        <Grid item xs={12}>
          <Card sx={{ border: `2px solid ${theme.palette.error.main}` }}>
            <CardHeader
              avatar={<PersonRemoveIcon color="error" />}
              title="Delete Account"
              subheader="Permanently delete your account and all associated data"
              sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}
            />
            <CardContent>
              {deletionRequest ? (
                <Alert severity="warning" icon={<WarningIcon />}>
                  <Typography variant="body2">
                    Account deletion request is {deletionRequest.status}. 
                    Submitted on {new Date(deletionRequest.created_at).toLocaleDateString()}.
                  </Typography>
                </Alert>
              ) : (
                <Box>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Warning:</strong> This action cannot be undone. All your data, bookings, and account information will be permanently deleted.
                    </Typography>
                  </Alert>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Request Account Deletion
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Account Deletion Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle color="error.main">
          Delete Account Permanently
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This action will permanently delete your account and all associated data. This cannot be undone.
            </Typography>
          </Alert>

          <TextField
            fullWidth
            label="Reason for deletion (optional)"
            multiline
            rows={3}
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            sx={{ mb: 3 }}
          />

          <TextField
            fullWidth
            label='Type "DELETE MY ACCOUNT" to confirm'
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            error={deleteConfirmation !== '' && deleteConfirmation !== 'DELETE MY ACCOUNT'}
            helperText="This confirmation is required for account deletion"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={requestAccountDeletion}
            disabled={deleteConfirmation !== 'DELETE MY ACCOUNT' || loading}
          >
            {loading ? 'Processing...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrivacyDashboard;