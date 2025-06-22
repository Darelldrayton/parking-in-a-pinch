export enum NotificationType {
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_REMINDER = 'booking_reminder',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  NEW_MESSAGE = 'new_message',
  LISTING_APPROVED = 'listing_approved',
  LISTING_REJECTED = 'listing_rejected',
  REVIEW_RECEIVED = 'review_received',
  SECURITY_ALERT = 'security_alert',
  SYSTEM_UPDATE = 'system_update',
  PROMOTIONAL = 'promotional'
}

export interface AppNotification {
  id: number;
  user: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  data?: Record<string, any>;
  action_url?: string;
}

export interface NotificationPreference {
  id: number;
  user: number;
  notification_type: NotificationType;
  in_app_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PushSubscription {
  id: number;
  user: number;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent: string;
  is_active: boolean;
  created_at: string;
  last_used: string;
}

export interface NotificationSettings {
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  emailDigestFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

export interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreference[];
  settings: NotificationSettings;
  loading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreference>[]) => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  subscribeToNotifications: () => Promise<void>;
  unsubscribeFromNotifications: () => Promise<void>;
  simulateNotification: () => void;
}

export interface CreateNotificationRequest {
  user: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
}

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  variables: string[];
}