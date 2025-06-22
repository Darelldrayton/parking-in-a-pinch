/**
 * Push Notification Service
 */
import { api } from './api';

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class PushNotificationService {
  private vapidPublicKey: string | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  /**
   * Initialize push notification service
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service workers not supported');
        return false;
      }

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.warn('Push messaging not supported');
        return false;
      }

      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);

      // Get VAPID public key
      await this.getVapidPublicKey();

      // Check for existing subscription
      await this.checkExistingSubscription();

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Get VAPID public key from server
   */
  private async getVapidPublicKey(): Promise<void> {
    try {
      const response = await api.get('/notifications/push/vapid-key/');
      this.vapidPublicKey = response.data.public_key;
    } catch (error) {
      console.error('Failed to get VAPID public key:', error);
      throw new Error('Failed to get VAPID public key');
    }
  }

  /**
   * Check for existing push subscription
   */
  private async checkExistingSubscription(): Promise<void> {
    if (!this.registration) return;

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      console.log('Existing subscription:', this.subscription);
    } catch (error) {
      console.error('Failed to check existing subscription:', error);
    }
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<boolean> {
    try {
      // Check permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      if (!this.registration || !this.vapidPublicKey) {
        console.error('Service worker or VAPID key not available');
        return false;
      }

      // Subscribe to push manager
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      console.log('Push subscription:', this.subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      return true;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.subscription) {
        console.log('No active subscription to unsubscribe');
        return true;
      }

      // Unsubscribe from push manager
      const success = await this.subscription.unsubscribe();
      
      if (success) {
        // Notify server
        await this.removeSubscriptionFromServer(this.subscription);
        this.subscription = null;
        console.log('Successfully unsubscribed from push notifications');
      }

      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  /**
   * Send subscription data to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionData = this.getSubscriptionData(subscription);
      
      const response = await api.post('/notifications/push/subscribe/', subscriptionData);
      console.log('Subscription sent to server:', response.data);
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await api.post('/notifications/push/unsubscribe/', {
        endpoint: subscription.endpoint,
      });
      console.log('Subscription removed from server');
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  /**
   * Get subscription data in the format expected by server
   */
  private getSubscriptionData(subscription: PushSubscription): PushSubscriptionData {
    const keys = subscription.getKey ? {
      p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
      auth: this.arrayBufferToBase64(subscription.getKey('auth')),
    } : { p256dh: '', auth: '' };

    return {
      endpoint: subscription.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    };
  }

  /**
   * Send a test push notification
   */
  async sendTestNotification(options: NotificationOptions): Promise<boolean> {
    try {
      const response = await api.post('/notifications/push/send/', options);
      console.log('Test notification sent:', response.data);
      return response.data.success;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  /**
   * Get user's push subscriptions
   */
  async getSubscriptions(): Promise<any[]> {
    try {
      const response = await api.get('/notifications/push/subscriptions/');
      return response.data.subscriptions;
    } catch (error) {
      console.error('Failed to get subscriptions:', error);
      return [];
    }
  }

  /**
   * Check if push notifications are supported and permission is granted
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Check if user is currently subscribed
   */
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Show a local notification (fallback when push isn't available)
   */
  async showLocalNotification(options: NotificationOptions): Promise<void> {
    try {
      if (Notification.permission === 'granted') {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon,
          badge: options.badge,
          tag: options.tag,
          requireInteraction: options.requireInteraction,
          silent: options.silent,
          data: options.data,
        });

        // Handle notification click
        notification.onclick = () => {
          notification.close();
          // Handle click based on notification data
          this.handleNotificationClick(options.data);
        };

        // Auto-close after 5 seconds unless requireInteraction is true
        if (!options.requireInteraction) {
          setTimeout(() => {
            notification.close();
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Failed to show local notification:', error);
    }
  }

  /**
   * Handle notification click events
   */
  private handleNotificationClick(data: any): void {
    if (data && data.url) {
      window.open(data.url, '_blank');
    } else if (data && data.booking_id) {
      window.open(`/bookings/${data.booking_id}`, '_blank');
    } else {
      window.open('/dashboard', '_blank');
    }
  }

  /**
   * Convert VAPID key from URL base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Listen for service worker messages
   */
  setupMessageListener(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Received message from service worker:', event.data);
        
        const { type, data } = event.data;
        
        switch (type) {
          case 'NOTIFICATION_CLICK':
            this.handleNotificationClick(data);
            break;
          case 'NOTIFICATION_ACTION':
            this.handleNotificationAction(data.action, data.notificationData);
            break;
          default:
            console.log('Unknown message type:', type);
        }
      });
    }
  }

  /**
   * Handle notification action events
   */
  private handleNotificationAction(action: string, data: any): void {
    console.log('Notification action:', action, data);
    
    // Handle different actions based on your app's needs
    switch (action) {
      case 'view_booking':
      case 'checkin':
      case 'checkout':
        if (data.booking_id) {
          window.open(`/bookings/${data.booking_id}`, '_blank');
        }
        break;
      case 'get_directions':
        if (data.booking_id) {
          window.open(`/bookings/${data.booking_id}/directions`, '_blank');
        }
        break;
      case 'retry_payment':
        window.open('/payments/retry', '_blank');
        break;
      default:
        console.log('Unhandled notification action:', action);
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export types
export type { PushSubscriptionData, NotificationOptions, NotificationAction };