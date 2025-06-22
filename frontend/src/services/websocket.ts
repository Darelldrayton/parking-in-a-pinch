/**
 * WebSocket service for real-time notifications
 */

// Import from types to avoid circular dependency
import { type AppNotification } from '../types';

interface WebSocketMessage {
  type: 'notification' | 'message' | 'booking_update' | 'ping';
  data: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private pingInterval: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  
  // Event handlers
  private onNotificationReceived: ((notification: AppNotification) => void) | null = null;
  private onConnectionStatusChange: ((status: 'connected' | 'disconnected' | 'reconnecting') => void) | null = null;
  private onMessageReceived: ((message: any) => void) | null = null;

  /**
   * Connect to WebSocket server
   */
  connect(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Don't try to connect if no token is available
    if (!token) {
      console.warn('⚠️ No authentication token available, skipping WebSocket connection');
      this.onConnectionStatusChange?.('disconnected');
      return;
    }

    this.isIntentionallyClosed = false;
    const wsUrl = this.getWebSocketUrl(token);
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    
    try {
      this.ws = new WebSocket(wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    this.isIntentionallyClosed = true;
    
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.reconnectAttempts = 0;
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(token: string): string {
    const host = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const port = process.env.NODE_ENV === 'development' ? ':8000' : '';
    
    // For now, use a mock WebSocket server for demonstration
    // In production, this would connect to your Django Channels WebSocket endpoint
    return `${protocol}//${host}${port}/ws/notifications/?token=${token}`;
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.onConnectionStatusChange?.('connected');
      
      // Start ping interval to keep connection alive
      this.startPingInterval();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.warn('⚠️ WebSocket connection failed (server may not be running)');
    };

    this.ws.onclose = (event) => {
      if (event.code !== 1006) {  // Don't log expected connection failures
        console.log('🔌 WebSocket closed:', event.code, event.reason);
      }
      this.stopPingInterval();
      
      if (!this.isIntentionallyClosed) {
        this.onConnectionStatusChange?.('disconnected');
        this.scheduleReconnect();
      }
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage) {
    console.log('📨 WebSocket message received:', message);

    switch (message.type) {
      case 'notification':
        this.handleNotification(message.data);
        break;
      
      case 'message':
        this.onMessageReceived?.(message.data);
        break;
      
      case 'booking_update':
        // Handle booking updates
        this.handleBookingUpdate(message.data);
        break;
      
      case 'ping':
        // Respond to ping with pong
        this.send({ type: 'pong' });
        break;
    }
  }

  /**
   * Handle notification message
   */
  private handleNotification(notification: AppNotification) {
    console.log('🔔 New notification:', notification);
    
    // Call the notification handler
    this.onNotificationReceived?.(notification);
    
    // Show browser notification if permitted
    this.showBrowserNotification(notification);
  }

  /**
   * Handle booking update message
   */
  private handleBookingUpdate(data: any) {
    console.log('📅 Booking update:', data);
    
    // Create a notification for the booking update
    const notification: AppNotification = {
      id: Date.now(),
      user: data.user_id,
      type: data.update_type,
      title: data.title || 'Booking Update',
      message: data.message || 'Your booking has been updated',
      is_read: false,
      created_at: new Date().toISOString(),
      data: data,
      action_url: data.action_url
    };
    
    this.onNotificationReceived?.(notification);
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: AppNotification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `notification-${notification.id}`,
        requireInteraction: false,
        silent: false
      });

      browserNotification.onclick = () => {
        window.focus();
        // Don't redirect for message notifications, just focus the window
        if (notification.action_url && !['new_message', 'host_message', 'guest_message'].includes(notification.type)) {
          window.location.href = notification.action_url;
        }
        browserNotification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => browserNotification.close(), 5000);
    }
  }

  /**
   * Send message through WebSocket
   */
  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(`⚠️ Max reconnection attempts (${this.maxReconnectAttempts}) reached. WebSocket will remain disconnected.`);
      this.onConnectionStatusChange?.('disconnected');
      return;
    }

    // Skip reconnection if intentionally closed
    if (this.isIntentionallyClosed) {
      return;
    }

    this.onConnectionStatusChange?.('reconnecting');
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`⏳ Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectInterval = setTimeout(() => {
      this.reconnectAttempts++;
      const token = localStorage.getItem('access_token') || '';
      
      // Don't try to reconnect if no token
      if (!token) {
        console.warn('⚠️ No token available for reconnection, stopping reconnect attempts');
        this.onConnectionStatusChange?.('disconnected');
        return;
      }
      
      this.connect(token);
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Set notification handler
   */
  onNotification(handler: (notification: AppNotification) => void) {
    this.onNotificationReceived = handler;
  }

  /**
   * Remove notification handler
   */
  removeNotificationListener(handler: (notification: AppNotification) => void) {
    if (this.onNotificationReceived === handler) {
      this.onNotificationReceived = null;
    }
  }

  /**
   * Set connection status handler
   */
  onConnectionStatus(handler: (status: 'connected' | 'disconnected' | 'reconnecting') => void) {
    this.onConnectionStatusChange = handler;
  }

  /**
   * Set message handler
   */
  onMessage(handler: (message: any) => void) {
    this.onMessageReceived = handler;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return 'connected';
    }
    if (this.reconnectInterval) {
      return 'reconnecting';
    }
    return 'disconnected';
  }

  /**
   * Simulate notification for testing
   */
  simulateNotification() {
    const mockNotifications = [
      {
        id: Date.now(),
        user: 1,
        type: 'booking_confirmed',
        title: '🎉 Booking Confirmed!',
        message: 'Your parking reservation at Broadway & 42nd St has been confirmed.',
        is_read: false,
        created_at: new Date().toISOString(),
        action_url: '/my-bookings'
      },
      {
        id: Date.now() + 1,
        user: 1,
        type: 'payment_received',
        title: '💰 Payment Received',
        message: 'We\'ve received your payment of $25.00 for your parking booking.',
        is_read: false,
        created_at: new Date().toISOString(),
        action_url: '/my-bookings'
      },
      {
        id: Date.now() + 2,
        user: 1,
        type: 'new_message',
        title: '💬 New Message',
        message: 'John: Hi! I wanted to let you know that the parking entrance is around the back of the building.',
        is_read: false,
        created_at: new Date().toISOString(),
        action_url: null
      },
      {
        id: Date.now() + 3,
        user: 1,
        type: 'booking_reminder',
        title: '⏰ Booking Reminder',
        message: 'Your parking reservation starts in 1 hour at Main St & 1st Ave',
        is_read: false,
        created_at: new Date().toISOString(),
        action_url: '/my-bookings'
      }
    ];

    const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
    this.handleNotification(randomNotification as AppNotification);
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;