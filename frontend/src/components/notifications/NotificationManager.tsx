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
  Smartphone,
  Email,
  Info,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';
import notificationService from '../../services/notifications';
import toast from 'react-hot-toast';
import api from '../../services/api';

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
  
  // Add error boundary for useNotifications hook
  const [contextError, setContextError] = React.useState<string | null>(null);
  
  let notificationContext;
  try {
    notificationContext = useNotifications();
  } catch (error) {
    console.error('NotificationContext error:', error);
    setContextError(error instanceof Error ? error.message : 'Failed to load notification context');
  }
  
  const { 
    preferences, 
    settings: contextSettings, 
    updatePreferences, 
    updateSettings,
    subscribeToNotifications,
    unsubscribeFromNotifications
  } = notificationContext || {};
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'subscribed' | 'unsubscribed' | 'unknown'>('unknown');
  
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
    // Only initialize if we have a valid user and no context error
    if (!user || contextError) {
      console.warn('Skipping notification initialization:', { user: !!user, contextError });
      return;
    }

    const initializeAsync = async () => {
      try {
        // Initialize notifications and load settings sequentially to avoid race conditions
        await initializeNotifications();
        await loadSettings();
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        // Don't throw error to prevent component crash
      }
    };

    initializeAsync();
  }, [user, contextError]);

  const initializeNotifications = async () => {
    try {
      const initialized = await notificationService.initialize();
      
      // Even if service worker is disabled, we can still check browser notification support
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
      
      if (initialized) {
        const subscription = await notificationService.getSubscription();
        setSubscriptionStatus(subscription ? 'subscribed' : 'unsubscribed');
      } else {
        // Service worker not available/disabled
        setSubscriptionStatus('unknown');
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      setPermissionStatus('denied');
      setSubscriptionStatus('unknown');
    }
  };

  const loadSettings = async () => {
    try {
      // Load from backend
      const response = await api.get('/notifications/preferences/');
      
      if (response.data) {
        const backendData = response.data;
        
        // Use the categories directly from backend response
        const categories = backendData.categories || {
          bookingUpdates: true,
          paymentActivity: true,
          messageNotifications: true,
          timeReminders: true,
          accountSecurity: true,
          promotionalOffers: false,
          systemUpdates: true,
          hostNotifications: true,
        };
        
        const newSettings = {
          ...settings,
          emailEnabled: backendData.email_enabled ?? true,
          pushEnabled: backendData.push_enabled ?? false,
          categories: categories,
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
            pattern: 'medium' as const,
          },
        };
        
        setSettings(newSettings);
        localStorage.setItem(`notification_settings_${user?.id}`, JSON.stringify(newSettings));
      }
    } catch (error) {
      console.error('Failed to load notification settings from backend:', error);
      
      // Fall back to localStorage
      const savedSettings = localStorage.getItem(`notification_settings_${user?.id}`);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (parseError) {
          console.error('Failed to parse notification settings:', parseError);
        }
      }
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      // Update local state immediately for responsive UI
      setSettings(newSettings);
      
      // Guard against missing user
      if (!user?.id) {
        console.warn('Cannot save settings: user ID not available');
        toast.error('Unable to save settings: user not found');
        return;
      }
      
      localStorage.setItem(`notification_settings_${user.id}`, JSON.stringify(newSettings));
      
      // Prepare preferences array for backend
      const preferences = Object.entries(newSettings.categories).map(([key, enabled]) => ({
        notification_type: key,
        enabled: enabled
      }));
      
      // Send to backend with proper structure
      const response = await api.patch('/notifications/preferences/', {
        preferences: preferences,
        email_enabled: newSettings.emailEnabled,
        push_enabled: newSettings.pushEnabled
      });
      
      console.log('Settings saved successfully:', response.data);
      toast.success('Notification settings saved');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      toast.error('Failed to save settings. Please try again.');
      // Revert to previous state on error
      await loadSettings();
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!subscribeToNotifications) {
      toast.error('Notification service unavailable');
      return;
    }
    
    setLoading(true);
    try {
      const permission = await notificationService.requestPermission();
      setPermissionStatus(permission);

      if (permission === 'granted') {
        const subscription = await notificationService.subscribeToPush();
        if (subscription) {
          setSubscriptionStatus('subscribed');
          await saveSettings({
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
    if (!unsubscribeFromNotifications) {
      toast.error('Notification service unavailable');
      return;
    }
    
    setLoading(true);
    try {
      const unsubscribed = await notificationService.unsubscribeFromPush();
      if (unsubscribed) {
        setSubscriptionStatus('unsubscribed');
        await saveSettings({
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

  // Show error state if context is not available
  if (contextError) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Notification Settings Unavailable
          </Typography>
          <Typography variant="body2">
            {contextError}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please refresh the page or contact support if this issue persists.
          </Typography>
        </Alert>
      </Box>
    );
  }

  // Show loading state if user is not available
  if (!user) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography>Loading user information...</Typography>
      </Box>
    );
  }

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
                      onChange={async (e) => {
                        const newSettings = {
                          ...settings,
                          categories: {
                            ...settings.categories,
                            [category.key]: e.target.checked,
                          },
                        };
                        await saveSettings(newSettings);
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
                    onChange={async (e) => await saveSettings({ ...settings, emailEnabled: e.target.checked })}
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

    </Box>
  );
};

export default NotificationManager;