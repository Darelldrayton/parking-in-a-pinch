import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Chip,
  useTheme,
  alpha,
  Fab,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
} from '@mui/material';
import {
  Emergency,
  Add,
  Edit,
  Delete,
  Phone,
  Message,
  LocationOn,
  Security,
  Warning,
  Person,
  LocalHospital,
  LocalPolice,
  ContactEmergency,
  SOS,
  Share,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary: boolean;
  notify_on_checkin: boolean;
  notify_on_emergency: boolean;
  created_at: string;
}

interface EmergencyAlert {
  id: string;
  type: 'panic' | 'late_return' | 'no_show' | 'suspicious_activity';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  booking_id?: number;
  message: string;
  status: 'active' | 'resolved' | 'false_alarm';
  created_at: string;
  resolved_at?: string;
}

const contactSchema = yup.object({
  name: yup.string().required('Name is required'),
  relationship: yup.string().required('Relationship is required'),
  phone: yup.string().required('Phone number is required'),
  email: yup.string().email('Invalid email'),
  is_primary: yup.boolean(),
  notify_on_checkin: yup.boolean(),
  notify_on_emergency: yup.boolean(),
});

type ContactFormData = yup.InferType<typeof contactSchema>;

const EmergencyContacts: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [emergencyType, setEmergencyType] = useState<'panic' | 'help' | 'police' | 'medical'>('panic');
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: yupResolver(contactSchema),
    defaultValues: {
      name: '',
      relationship: '',
      phone: '',
      email: '',
      is_primary: false,
      notify_on_checkin: true,
      notify_on_emergency: true,
    },
  });

  useEffect(() => {
    loadEmergencyContacts();
    loadRecentAlerts();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const loadEmergencyContacts = async () => {
    try {
      const response = await fetch('/api/v1/emergency-contacts/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  };

  const loadRecentAlerts = async () => {
    try {
      const response = await fetch('/api/v1/emergency-alerts/?limit=5', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error loading emergency alerts:', error);
    }
  };

  const handleSaveContact = async (data: ContactFormData) => {
    setLoading(true);
    try {
      const url = editingContact 
        ? `/api/v1/emergency-contacts/${editingContact.id}/`
        : '/api/v1/emergency-contacts/';
      
      const method = editingContact ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(editingContact ? 'Contact updated' : 'Contact added');
        setShowAddDialog(false);
        setEditingContact(null);
        reset();
        loadEmergencyContacts();
      } else {
        toast.error('Failed to save contact');
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const response = await fetch(`/api/v1/emergency-contacts/${contactId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        toast.success('Contact deleted');
        loadEmergencyContacts();
      } else {
        toast.error('Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const handleEmergencyAlert = async (type: string, message: string = '') => {
    if (!currentLocation) {
      toast.error('Location not available');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/emergency-alerts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          type,
          location: {
            lat: currentLocation.lat,
            lng: currentLocation.lng,
            address: 'Current Location', // Would geocode in real app
          },
          message: message || `Emergency alert: ${type}`,
        }),
      });

      if (response.ok) {
        toast.success('Emergency alert sent');
        setShowEmergencyDialog(false);
        loadRecentAlerts();
        
        // Also trigger local emergency actions
        triggerLocalEmergencyActions(type);
      } else {
        toast.error('Failed to send emergency alert');
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      toast.error('Failed to send emergency alert');
    } finally {
      setLoading(false);
    }
  };

  const triggerLocalEmergencyActions = (type: string) => {
    // Share location with contacts
    if (navigator.share && currentLocation) {
      navigator.share({
        title: 'Emergency Alert',
        text: `I need help! My location: https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`,
      });
    }

    // Vibrate device if supported
    if (navigator.vibrate) {
      navigator.vibrate([500, 300, 500, 300, 500]);
    }

    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('Emergency Alert Sent', {
        body: 'Your emergency contacts have been notified',
        icon: '/favicon.ico',
      });
    }
  };

  const quickEmergencyActions = [
    {
      icon: <SOS />,
      name: 'Panic Button',
      color: '#f44336',
      action: () => {
        setEmergencyType('panic');
        setShowEmergencyDialog(true);
      },
    },
    {
      icon: <LocalPolice />,
      name: 'Police',
      color: '#2196f3',
      action: () => {
        window.open('tel:911');
      },
    },
    {
      icon: <LocalHospital />,
      name: 'Medical',
      color: '#4caf50',
      action: () => {
        window.open('tel:911');
      },
    },
    {
      icon: <Share />,
      name: 'Share Location',
      color: '#ff9800',
      action: () => {
        if (currentLocation) {
          const url = `https://maps.google.com/?q=${currentLocation.lat},${currentLocation.lng}`;
          if (navigator.share) {
            navigator.share({
              title: 'My Current Location',
              url,
            });
          } else {
            navigator.clipboard.writeText(url);
            toast.success('Location copied to clipboard');
          }
        }
      },
    },
  ];

  const relationshipOptions = [
    'Spouse/Partner',
    'Parent',
    'Child',
    'Sibling',
    'Friend',
    'Colleague',
    'Other Family',
    'Other',
  ];

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Security sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Emergency & Safety
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your safety contacts and emergency settings
            </Typography>
          </Box>
        </Stack>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowAddDialog(true)}
        >
          Add Contact
        </Button>
      </Stack>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card sx={{ mb: 4, borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Recent Emergency Alerts
            </Typography>
            
            <Stack spacing={2}>
              {alerts.map((alert) => (
                <Alert
                  key={alert.id}
                  severity={alert.status === 'resolved' ? 'success' : 'warning'}
                  action={
                    <Chip
                      label={alert.status}
                      size="small"
                      color={alert.status === 'resolved' ? 'success' : 'warning'}
                    />
                  }
                >
                  <Typography variant="body2" fontWeight={500}>
                    {alert.type.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(alert.created_at).toLocaleString()} • {alert.location.address}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Emergency Contacts List */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Emergency Contacts
          </Typography>
          
          {contacts.length === 0 ? (
            <Alert severity="info">
              No emergency contacts added yet. Add at least one contact for your safety.
            </Alert>
          ) : (
            <List disablePadding>
              {contacts.map((contact, index) => (
                <React.Fragment key={contact.id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Person />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="subtitle1" fontWeight={500}>
                            {contact.name}
                          </Typography>
                          {contact.is_primary && (
                            <Chip label="Primary" size="small"  />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            {contact.relationship} • {contact.phone}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            {contact.notify_on_checkin && (
                              <Chip label="Check-in alerts" size="small" variant="outlined" />
                            )}
                            {contact.notify_on_emergency && (
                              <Chip label="Emergency alerts" size="small" variant="outlined" />
                            )}
                          </Stack>
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          href={`tel:${contact.phone}`}
                          
                        >
                          <Phone />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingContact(contact);
                            reset(contact);
                            setShowAddDialog(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteContact(contact.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < contacts.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Safety Tips */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Safety Tips
          </Typography>
          
          <Stack spacing={2}>
            <Alert severity="info" icon={<Security />}>
              Always let someone know where you're parking, especially in unfamiliar areas.
            </Alert>
            <Alert severity="warning" icon={<Warning />}>
              If you feel unsafe, trust your instincts and contact emergency services immediately.
            </Alert>
            <Alert severity="success" icon={<LocationOn />}>
              Share your live location with trusted contacts when parking in remote areas.
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      {/* Emergency Speed Dial */}
      <SpeedDial
        ariaLabel="Emergency Actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon icon={<Emergency />} />}
        FabProps={{
          sx: {
            bgcolor: '#f44336',
            '&:hover': {
              bgcolor: '#d32f2f',
            },
          },
        }}
      >
        {quickEmergencyActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={action.action}
            FabProps={{
              sx: {
                bgcolor: action.color,
                '&:hover': {
                  bgcolor: action.color,
                  filter: 'brightness(0.9)',
                },
              },
            }}
          />
        ))}
      </SpeedDial>

      {/* Add/Edit Contact Dialog */}
      <Dialog 
        open={showAddDialog} 
        onClose={() => {
          setShowAddDialog(false);
          setEditingContact(null);
          reset();
        }}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
        </DialogTitle>
        
        <form onSubmit={handleSubmit(handleSaveContact)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Full Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              <Controller
                name="relationship"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.relationship}>
                    <InputLabel>Relationship</InputLabel>
                    <Select {...field} label="Relationship">
                      {relationshipOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number"
                    type="tel"
                    fullWidth
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                  />
                )}
              />

              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email (Optional)"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />

              <Stack spacing={2}>
                <Typography variant="subtitle2" fontWeight={500}>
                  Notification Settings
                </Typography>
                
                <Controller
                  name="is_primary"
                  control={control}
                  render={({ field }) => (
                    <FormControl>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2">Primary emergency contact</Typography>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </Stack>
                    </FormControl>
                  )}
                />

                <Controller
                  name="notify_on_checkin"
                  control={control}
                  render={({ field }) => (
                    <FormControl>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2">Notify when I check in to parking</Typography>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </Stack>
                    </FormControl>
                  )}
                />

                <Controller
                  name="notify_on_emergency"
                  control={control}
                  render={({ field }) => (
                    <FormControl>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2">Notify in case of emergency</Typography>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </Stack>
                    </FormControl>
                  )}
                />
              </Stack>
            </Stack>
          </DialogContent>
          
          <DialogActions>
            <Button 
              onClick={() => {
                setShowAddDialog(false);
                setEditingContact(null);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Emergency Alert Dialog */}
      <Dialog 
        open={showEmergencyDialog} 
        onClose={() => setShowEmergencyDialog(false)}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Emergency color="error" />
            <Typography variant="h6">Emergency Alert</Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            This will immediately notify all your emergency contacts and share your current location.
          </Alert>
          
          <Typography variant="body1" gutterBottom>
            Are you sure you want to send an emergency alert?
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowEmergencyDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => handleEmergencyAlert(emergencyType)}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Emergency Alert'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmergencyContacts;