import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import webSocketService from '../services/websocket';
import {
  NotificationType,
  AppNotification,
  NotificationPreference,
  NotificationSettings,
  NotificationContextType
} from '../types';

// Re-export types for convenience
export {
  NotificationType,
  type AppNotification,
  type NotificationPreference,
  type NotificationSettings,
  type NotificationContextType
} from '../types';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    soundEnabled: true,
    vibrationEnabled: true,
    emailDigestFrequency: 'daily'
  });
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Setup WebSocket connection and auto-refresh
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Skip WebSocket setup on admin pages to prevent infinite loops
    const isAdminPage = window.location.pathname.includes('/admin');
    if (isAdminPage) {
      console.log('🔒 Skipping WebSocket setup on admin page');
      return;
    }

    // Only fetch on initial load, not on every navigation
    if (!hasInitiallyLoaded) {
      fetchNotifications();
      fetchPreferences();
      fetchSettings();
      setHasInitiallyLoaded(true);
    }

    // Connect to WebSocket for real-time notifications
    const token = localStorage.getItem('access_token') || '';
    webSocketService.connect(token);

    // Handle incoming notifications
    webSocketService.onNotification((notification) => {
      console.log('🔔 Real-time notification received:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      
      // Play notification sound if enabled
      if (settings.soundEnabled) {
        playNotificationSound();
      }
    });

    // Handle connection status changes
    webSocketService.onConnectionStatus((status) => {
      setConnectionStatus(status);
    });

    // TEMPORARILY DISABLED auto-refresh to test notification read functionality
    // const interval = setInterval(() => {
    //   fetchNotifications();
    // }, 30000); // Refresh every 30 seconds

    return () => {
      // clearInterval(interval); // DISABLED
      webSocketService.disconnect();
    };
  }, [isAuthenticated, user, settings.soundEnabled, hasInitiallyLoaded]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      const response = await api.get('/notifications/', {
        params: {
          ordering: '-created_at',
          limit: 50
        }
      });
      setNotifications(response.data.notifications || response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show error to user for background fetches
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchPreferences = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await api.get('/notifications/preferences/');
      setPreferences(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    }
  }, [isAuthenticated, user]);

  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      // Settings endpoint doesn't exist in backend, use default settings
      console.log('Using default notification settings');
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  }, [isAuthenticated, user]);

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`/notifications/${notificationId}/read/`);

      // Update local state immediately
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );

      // Unread count will be automatically recalculated from the updated notifications

      // Don't refresh immediately to avoid overriding the local state
      // The 30-second auto-refresh will sync with backend later
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      await api.post('/notifications/mark-all-read/');

      setNotifications(prev =>
        prev.map(notification => ({
          ...notification,
          is_read: true,
          read_at: new Date().toISOString()
        }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await api.delete(`/notifications/${notificationId}/`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreference>[]) => {
    try {
      await api.patch('/notifications/preferences/', {
        preferences: newPreferences
      });
      await fetchPreferences(); // Refresh preferences
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      // Settings endpoint doesn't exist in backend
      console.log('Updated settings locally:', updatedSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const subscribeToNotifications = async () => {
    try {
      // Request notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      // Register service worker and create push subscription
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
        });

        // Send subscription to backend
        await api.post('/notifications/push/subscribe/', {
          endpoint: subscription.endpoint,
          p256dh_key: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth_key: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          user_agent: navigator.userAgent
        });
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      throw error;
    }
  };

  const unsubscribeFromNotifications = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            
            // Remove subscription from backend
            await api.post('/notifications/push/unsubscribe/', {
              endpoint: subscription.endpoint
            });
          }
        }
      }
    } catch (error) {
      console.error('Error unsubscribing from notifications:', error);
      throw error;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Failed to play notification sound:', err));
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Simulate notification for testing
  const simulateNotification = () => {
    webSocketService.simulateNotification();
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    settings,
    loading,
    connectionStatus,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    updateSettings,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    simulateNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};