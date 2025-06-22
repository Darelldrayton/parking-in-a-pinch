// Push Notification Service
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BMxJe2fkTjw7X8zB9cK5mL3nP7qR8sT9uV0wX1yZ2aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8g';

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported');
      return false;
    }

    try {
      // Disable service worker registration during development to avoid conflicts
      console.log('Service Worker registration disabled during development');
      return false;
      
      // Register service worker
      // this.registration = await navigator.serviceWorker.register('/sw.js');
      // console.log('Service Worker registered successfully');

      // Listen for service worker messages
      // navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);

      // return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('Service Worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      });

      const pushSubscription: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      // Send subscription to server
      await this.sendSubscriptionToServer(pushSubscription);

      return pushSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (!subscription) {
        return null;
      }

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };
    } catch (error) {
      console.error('Failed to get push subscription:', error);
      return null;
    }
  }

  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (!this.registration) {
      console.error('Service Worker not registered');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        badge: payload.badge || '/favicon.ico',
        tag: payload.tag,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  private handleServiceWorkerMessage = (event: MessageEvent) => {
    const { type, data } = event.data;

    switch (type) {
      case 'NOTIFICATION_CLICK':
        this.handleNotificationClick(data);
        break;
      case 'NOTIFICATION_ACTION':
        this.handleNotificationAction(data);
        break;
      default:
        console.log('Unknown service worker message:', event.data);
    }
  };

  private handleNotificationClick(data: any) {
    console.log('Notification clicked:', data);
    
    // Navigate to relevant page based on notification type
    if (data.bookingId) {
      window.location.href = `/booking/${data.bookingId}`;
    } else if (data.url) {
      window.location.href = data.url;
    }
  }

  private handleNotificationAction(data: any) {
    console.log('Notification action:', data);
    
    const { action, notificationData } = data;
    
    switch (action) {
      case 'view':
        if (notificationData.bookingId) {
          window.location.href = `/booking/${notificationData.bookingId}`;
        }
        break;
      case 'accept':
        // Handle booking acceptance
        this.handleBookingAction(notificationData.bookingId, 'accept');
        break;
      case 'decline':
        // Handle booking decline
        this.handleBookingAction(notificationData.bookingId, 'decline');
        break;
      default:
        console.log('Unknown notification action:', action);
    }
  }

  private async handleBookingAction(bookingId: string, action: 'accept' | 'decline') {
    try {
      const response = await fetch(`/api/v1/bookings/${bookingId}/${action}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await this.showLocalNotification({
          title: 'Action Completed',
          body: `Booking ${action}ed successfully`,
          tag: 'booking-action',
        });
      }
    } catch (error) {
      console.error('Failed to handle booking action:', error);
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/v1/notifications/subscribe/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/v1/notifications/unsubscribe/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Predefined notification templates
  static templates = {
    bookingRequest: (renterName: string, spaceTitle: string): NotificationPayload => ({
      title: 'New Booking Request',
      body: `${renterName} wants to book your ${spaceTitle}`,
      icon: '/icons/booking-request.png',
      tag: 'booking-request',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'accept', title: 'Accept' },
        { action: 'decline', title: 'Decline' },
      ],
    }),

    bookingConfirmed: (spaceTitle: string): NotificationPayload => ({
      title: 'Booking Confirmed!',
      body: `Your booking for ${spaceTitle} has been confirmed`,
      icon: '/icons/booking-confirmed.png',
      tag: 'booking-confirmed',
      actions: [
        { action: 'view', title: 'View Booking' },
      ],
    }),

    checkInReminder: (spaceTitle: string, time: string): NotificationPayload => ({
      title: 'Check-in Reminder',
      body: `Your parking at ${spaceTitle} starts at ${time}`,
      icon: '/icons/check-in-reminder.png',
      tag: 'check-in-reminder',
      actions: [
        { action: 'view', title: 'Open QR Code' },
      ],
    }),

    checkOutReminder: (spaceTitle: string, time: string): NotificationPayload => ({
      title: 'Check-out Reminder',
      body: `Your parking at ${spaceTitle} ends at ${time}`,
      icon: '/icons/check-out-reminder.png',
      tag: 'check-out-reminder',
      actions: [
        { action: 'view', title: 'Check Out' },
      ],
    }),

    paymentReceived: (amount: number, spaceTitle: string): NotificationPayload => ({
      title: 'Payment Received',
      body: `You received $${amount} for ${spaceTitle}`,
      icon: '/icons/payment-received.png',
      tag: 'payment-received',
      actions: [
        { action: 'view', title: 'View Earnings' },
      ],
    }),

    messageReceived: (senderName: string): NotificationPayload => ({
      title: 'New Message',
      body: `${senderName} sent you a message`,
      icon: '/icons/message-received.png',
      tag: 'message-received',
      actions: [
        { action: 'view', title: 'View Message' },
      ],
    }),

    recurringBookingFailed: (spaceTitle: string): NotificationPayload => ({
      title: 'Recurring Booking Failed',
      body: `Your recurring booking for ${spaceTitle} could not be processed`,
      icon: '/icons/booking-failed.png',
      tag: 'recurring-failed',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'Manage Subscriptions' },
      ],
    }),
  };
}

export default new NotificationService();