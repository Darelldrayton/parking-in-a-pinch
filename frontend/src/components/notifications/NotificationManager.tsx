import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Stack,
  Alert,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  alpha,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,
  Schedule,
  Message,
  Payment,
  DirectionsCar,
  Security,
  Settings,
  VolumeUp,
  Vibration,
  Smartphone,
  Computer,
  Email,
  Info,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import notificationService from '../../services/notifications';
import toast from 'react-hot-toast';

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  categories: {
    bookingUpdates: boolean;
    paymentActivity: boolean;
    messageNotifications: boolean;
    timeReminders: boolean;
    accountSecurity: boolean;
    promotionalOffers: boolean;
    systemUpdates: boolean;
    hostNotifications: boolean;
  };
  schedule: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  sound: {
    enabled: boolean;
    volume: number;
  };
  vibration: {
    enabled: boolean;
    pattern: 'light' | 'medium' | 'strong';
  };
}

const NotificationManager: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { 
    preferences, 
    settings: contextSettings, 
    updatePreferences, 
    updateSettings,
    subscribeToNotifications,
    unsubscribeFromNotifications
  } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'subscribed' | 'unsubscribed' | 'unknown'>('unknown');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: false,
    emailEnabled: true,
    categories: {
      bookingUpdates: true,
      paymentActivity: true,
      messageNotifications: true,
      timeReminders: true,
      accountSecurity: true,
      promotionalOffers: false,
      systemUpdates: true,
      hostNotifications: true,
    },
    schedule: {
      enabled: false,
      startTime: '08:00',
      endTime: '22:00',
    },
    sound: {
      enabled: true,
      volume: 50,
    },
    vibration: {
      enabled: true,
      pattern: 'medium',
    },
  });

  useEffect(() => {
    initializeNotifications();
    loadSettings();
  }, []);

  const initializeNotifications = async () => {
    const initialized = await notificationService.initialize();
    if (initialized) {
      setPermissionStatus(Notification.permission);
      
      const subscription = await notificationService.getSubscription();
      setSubscriptionStatus(subscription ? 'subscribed' : 'unsubscribed');
    }
  };

  const loadSettings = () => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem(`notification_settings_${user?.id}`);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse notification settings:', error);
      }
    }
  };

  const saveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    localStorage.setItem(`notification_settings_${user?.id}`, JSON.stringify(newSettings));
    
    // In a real app, this would also sync with the backend
    toast.success('Notification settings saved');
  };

  const handleEnablePushNotifications = async () => {
    setLoading(true);
    try {
      const permission = await notificationService.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        const subscription = await notificationService.subscribeToPush();
        if (subscription) {
          setSubscriptionStatus('subscribed');
          saveSettings({
            ...settings,
            pushEnabled: true,
          });
          toast.success('Push notifications enabled!');
        } else {
          toast.error('Failed to enable push notifications');
        }
      } else {
        toast.error('Permission denied for push notifications');
      }
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      toast.error('Failed to enable push notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDisablePushNotifications = async () => {
    setLoading(true);
    try {
      const unsubscribed = await notificationService.unsubscribeFromPush();
      if (unsubscribed) {
        setSubscriptionStatus('unsubscribed');
        saveSettings({
          ...settings,
          pushEnabled: false,
        });
        toast.success('Push notifications disabled');
      } else {
        toast.error('Failed to disable push notifications');
      }
    } catch (error) {
      console.error('Failed to disable push notifications:', error);
      toast.error('Failed to disable push notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await notificationService.showLocalNotification({
        title: 'Test Notification',
        body: 'This is a test notification from Parking in a Pinch',
        icon: '/favicon.ico',
        tag: 'test-notification',
        actions: [
          { action: 'view', title: 'View Details' },
        ],
      });
      setTestNotificationSent(true);
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  const getPermissionStatusColor = (status: NotificationPermission) => {
    switch (status) {
      case 'granted':
        return 'success';
      case 'denied':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getPermissionStatusIcon = (status: NotificationPermission) => {
    switch (status) {
      case 'granted':
        return <CheckCircle />;
      case 'denied':
        return <Error />;
      default:
        return <Warning />;
    }
  };

  const notificationCategories = [
    {
      key: 'bookingUpdates' as keyof typeof settings.categories,
      title: 'Booking Updates',
      description: 'Booking confirmations, requests, cancellations, and modifications',
      icon: <DirectionsCar />,
    },
    {
      key: 'paymentActivity' as keyof typeof settings.categories,
      title: 'Payment Activity',
      description: 'Payment confirmations, refunds, and transaction updates',
      icon: <Payment />,
    },
    {
      key: 'messageNotifications' as keyof typeof settings.categories,
      title: 'Messages',
      description: 'New messages from hosts, renters, and support team',
      icon: <Message />,
    },
    {
      key: 'timeReminders' as keyof typeof settings.categories,
      title: 'Time Reminders',
      description: 'Check-in, check-out, and booking expiration reminders',
      icon: <Schedule />,
    },
    {
      key: 'accountSecurity' as keyof typeof settings.categories,
      title: 'Account Security',
      description: 'Login alerts, password changes, and security notifications',
      icon: <Security />,
    },
    {
      key: 'promotionalOffers' as keyof typeof settings.categories,
      title: 'Promotional Offers',
      description: 'Special deals, discounts, and promotional campaigns',
      icon: <Info />,
    },
    {
      key: 'systemUpdates' as keyof typeof settings.categories,
      title: 'System Updates',
      description: 'App updates, maintenance notifications, and feature announcements',
      icon: <Settings />,
    },
    {
      key: 'hostNotifications' as keyof typeof settings.categories,
      title: 'Host Activities',
      description: 'Notifications related to hosting parking spaces (for hosts only)',
      icon: <CheckCircle />,
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Notifications sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Notification Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage how you receive updates and alerts
            </Typography>
          </Box>
        </Stack>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setSettingsOpen(true)}
          >
            Advanced Settings
          </Button>
          
          {settings.pushEnabled && (
            <Button
              variant="outlined"
              startIcon={<Notifications />}
              onClick={handleTestNotification}
              disabled={testNotificationSent}
            >
              {testNotificationSent ? 'Test Sent' : 'Test Notification'}
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Permission Status */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Notification Status
          </Typography>
          
          <Stack spacing={3}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                  {getPermissionStatusIcon(permissionStatus)}
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Browser Permissions
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {permissionStatus}
                    </Typography>
                  </Box>
                </Stack>
                
                <Chip
                  label={permissionStatus}
                  color={getPermissionStatusColor(permissionStatus) as any}
                  sx={{ textTransform: 'capitalize' }}
                />
              </Stack>
            </Paper>

            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Smartphone />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Push Notifications
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Real-time notifications to this device
                    </Typography>
                  </Box>
                </Stack>
                
                {permissionStatus === 'granted' ? (
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Chip
                      label={subscriptionStatus}
                      color={subscriptionStatus === 'subscribed' ? 'success' : 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                    <Button
                      variant={settings.pushEnabled ? 'outlined' : 'contained'}
                      onClick={settings.pushEnabled ? handleDisablePushNotifications : handleEnablePushNotifications}
                      disabled={loading}
                      startIcon={settings.pushEnabled ? <NotificationsOff /> : <NotificationsActive />}
                    >
                      {settings.pushEnabled ? 'Disable' : 'Enable'}
                    </Button>
                  </Stack>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleEnablePushNotifications}
                    disabled={loading || permissionStatus === 'denied'}
                    startIcon={<NotificationsActive />}
                  >
                    Enable Push Notifications
                  </Button>
                )}
              </Stack>
            </Paper>

            {permissionStatus === 'denied' && (
              <Alert severity="warning">
                Push notifications are blocked. To enable them, click the lock icon in your browser's address bar and allow notifications for this site.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Notification Categories
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose which types of notifications you want to receive
          </Typography>
          
          <List disablePadding>
            {notificationCategories.map((category, index) => (
              <React.Fragment key={category.key}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>{category.icon}</ListItemIcon>
                  <ListItemText
                    primary={category.title}
                    secondary={category.description}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.categories[category.key]}
                      onChange={(e) => {
                        const newSettings = {
                          ...settings,
                          categories: {
                            ...settings.categories,
                            [category.key]: e.target.checked,
                          },
                        };
                        saveSettings(newSettings);
                      }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                {index < notificationCategories.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Alternative Channels */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Alternative Notification Channels
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Backup notification methods when push notifications aren't available
          </Typography>
          
          <Stack spacing={2}>
            <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailEnabled}
                    onChange={(e) => saveSettings({ ...settings, emailEnabled: e.target.checked })}
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Email />
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Email Notifications
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Receive notifications via email
                      </Typography>
                    </Box>
                  </Stack>
                }
              />
            </Paper>

          </Stack>
        </CardContent>
      </Card>

      {/* Advanced Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Settings />
            <Typography variant="h6">Advanced Notification Settings</Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={4} sx={{ mt: 1 }}>
            {/* Quiet Hours */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Quiet Hours
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.schedule.enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule, enabled: e.target.checked }
                    }))}
                  />
                }
                label="Enable quiet hours"
              />
              
              {settings.schedule.enabled && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <FormControl size="small">
                    <InputLabel>Start Time</InputLabel>
                    <Select
                      value={settings.schedule.startTime}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, startTime: e.target.value }
                      }))}
                      label="Start Time"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <MenuItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {`${i.toString().padStart(2, '0')}:00`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small">
                    <InputLabel>End Time</InputLabel>
                    <Select
                      value={settings.schedule.endTime}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, endTime: e.target.value }
                      }))}
                      label="End Time"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <MenuItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                          {`${i.toString().padStart(2, '0')}:00`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              )}
            </Box>

            {/* Sound Settings */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Sound
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sound.enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      sound: { ...prev.sound, enabled: e.target.checked }
                    }))}
                  />
                }
                label="Enable notification sounds"
              />
              
              {settings.sound.enabled && (
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <VolumeUp />
                    <Slider
                      value={settings.sound.volume}
                      onChange={(_, value) => setSettings(prev => ({
                        ...prev,
                        sound: { ...prev.sound, volume: value as number }
                      }))}
                      min={0}
                      max={100}
                      valueLabelDisplay="auto"
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                </Box>
              )}
            </Box>

            {/* Vibration Settings */}
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Vibration
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.vibration.enabled}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      vibration: { ...prev.vibration, enabled: e.target.checked }
                    }))}
                  />
                }
                label="Enable vibration"
              />
              
              {settings.vibration.enabled && (
                <FormControl size="small" sx={{ mt: 2, minWidth: 120 }}>
                  <InputLabel>Pattern</InputLabel>
                  <Select
                    value={settings.vibration.pattern}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      vibration: { ...prev.vibration, pattern: e.target.value as any }
                    }))}
                    label="Pattern"
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="strong">Strong</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              saveSettings(settings);
              setSettingsOpen(false);
            }}
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationManager;