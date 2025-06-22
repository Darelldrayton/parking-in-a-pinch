// SMS Notification Service
export interface SMSTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: 'booking' | 'payment' | 'reminder' | 'emergency' | 'marketing';
  active: boolean;
}

export interface SMSMessage {
  id: string;
  to: string;
  from: string;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered';
  error_code?: string;
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  price?: number;
  direction: 'outbound' | 'inbound';
  template_id?: string;
}

export interface SMSPreferences {
  enabled: boolean;
  phone_number: string;
  verified: boolean;
  opt_in_marketing: boolean;
  categories: {
    booking_confirmations: boolean;
    payment_updates: boolean;
    check_in_reminders: boolean;
    emergency_alerts: boolean;
    marketing_offers: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string;
    end_time: string;
    timezone: string;
  };
}

class SMSNotificationService {
  private readonly baseUrl = '/api/v1/sms';

  async sendSMS(
    to: string,
    message: string,
    templateId?: string,
    variables?: Record<string, any>
  ): Promise<SMSMessage> {
    try {
      const response = await fetch(`${this.baseUrl}/send/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          to,
          message,
          template_id: templateId,
          variables,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send SMS');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async sendTemplatedSMS(
    to: string,
    templateId: string,
    variables: Record<string, any>
  ): Promise<SMSMessage> {
    try {
      const response = await fetch(`${this.baseUrl}/send-template/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          to,
          template_id: templateId,
          variables,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send templated SMS');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending templated SMS:', error);
      throw error;
    }
  }

  async verifyPhoneNumber(phoneNumber: string): Promise<{ verification_sid: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/verify/start/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start phone verification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error starting phone verification:', error);
      throw error;
    }
  }

  async confirmPhoneVerification(
    verificationSid: string,
    code: string
  ): Promise<{ verified: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/verify/check/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          verification_sid: verificationSid,
          code,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to verify phone number');
      }

      return await response.json();
    } catch (error) {
      console.error('Error confirming phone verification:', error);
      throw error;
    }
  }

  async getSMSHistory(limit = 20, offset = 0): Promise<{
    messages: SMSMessage[];
    total: number;
    has_more: boolean;
  }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`${this.baseUrl}/history/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch SMS history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching SMS history:', error);
      throw error;
    }
  }

  async getSMSPreferences(): Promise<SMSPreferences> {
    try {
      const response = await fetch(`${this.baseUrl}/preferences/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        // Return default preferences if none exist
        return this.getDefaultPreferences();
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching SMS preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  async updateSMSPreferences(preferences: Partial<SMSPreferences>): Promise<SMSPreferences> {
    try {
      const response = await fetch(`${this.baseUrl}/preferences/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update SMS preferences');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating SMS preferences:', error);
      throw error;
    }
  }

  async getTemplates(): Promise<SMSTemplate[]> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        return this.getDefaultTemplates();
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching SMS templates:', error);
      return this.getDefaultTemplates();
    }
  }

  async createTemplate(template: Omit<SMSTemplate, 'id'>): Promise<SMSTemplate> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create SMS template');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating SMS template:', error);
      throw error;
    }
  }

  // Booking-specific SMS methods
  async sendBookingConfirmation(
    phoneNumber: string,
    bookingData: {
      booking_id: string;
      space_title: string;
      start_time: string;
      end_time: string;
      address: string;
      total_amount: number;
    }
  ): Promise<SMSMessage> {
    const message = `Booking confirmed! ${bookingData.space_title} on ${new Date(bookingData.start_time).toLocaleDateString()} at ${new Date(bookingData.start_time).toLocaleTimeString()}. Address: ${bookingData.address}. Total: $${bookingData.total_amount}. Booking ID: ${bookingData.booking_id}`;

    return this.sendSMS(phoneNumber, message, 'booking_confirmation', bookingData);
  }

  async sendCheckInReminder(
    phoneNumber: string,
    bookingData: {
      booking_id: string;
      space_title: string;
      start_time: string;
      address: string;
    }
  ): Promise<SMSMessage> {
    const startTime = new Date(bookingData.start_time);
    const message = `Reminder: Your parking at ${bookingData.space_title} starts in 30 minutes (${startTime.toLocaleTimeString()}). Address: ${bookingData.address}. Have a safe trip!`;

    return this.sendSMS(phoneNumber, message, 'check_in_reminder', bookingData);
  }

  async sendCheckOutReminder(
    phoneNumber: string,
    bookingData: {
      booking_id: string;
      space_title: string;
      end_time: string;
    }
  ): Promise<SMSMessage> {
    const endTime = new Date(bookingData.end_time);
    const message = `Reminder: Your parking at ${bookingData.space_title} ends in 15 minutes (${endTime.toLocaleTimeString()}). Please return to your vehicle soon.`;

    return this.sendSMS(phoneNumber, message, 'check_out_reminder', bookingData);
  }

  async sendPaymentConfirmation(
    phoneNumber: string,
    paymentData: {
      amount: number;
      booking_id: string;
      transaction_id: string;
    }
  ): Promise<SMSMessage> {
    const message = `Payment of $${paymentData.amount} confirmed for booking ${paymentData.booking_id}. Transaction ID: ${paymentData.transaction_id}. Thank you!`;

    return this.sendSMS(phoneNumber, message, 'payment_confirmation', paymentData);
  }

  async sendEmergencyAlert(
    phoneNumber: string,
    alertData: {
      user_name: string;
      location: string;
      message: string;
    }
  ): Promise<SMSMessage> {
    const message = `EMERGENCY ALERT: ${alertData.user_name} needs help. Location: ${alertData.location}. Message: ${alertData.message}. Please contact them immediately.`;

    return this.sendSMS(phoneNumber, message, 'emergency_alert', alertData);
  }

  // Utility methods
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    
    return phoneNumber;
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    return /^\+1\d{10}$/.test(formatted);
  }

  private getDefaultPreferences(): SMSPreferences {
    return {
      enabled: false,
      phone_number: '',
      verified: false,
      opt_in_marketing: false,
      categories: {
        booking_confirmations: true,
        payment_updates: true,
        check_in_reminders: true,
        emergency_alerts: true,
        marketing_offers: false,
      },
      quiet_hours: {
        enabled: false,
        start_time: '22:00',
        end_time: '08:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  }

  private getDefaultTemplates(): SMSTemplate[] {
    return [
      {
        id: 'booking_confirmation',
        name: 'Booking Confirmation',
        subject: 'Booking Confirmed',
        body: 'Booking confirmed! {{space_title}} on {{date}} at {{time}}. Address: {{address}}. Total: ${{amount}}. Booking ID: {{booking_id}}',
        variables: ['space_title', 'date', 'time', 'address', 'amount', 'booking_id'],
        category: 'booking',
        active: true,
      },
      {
        id: 'check_in_reminder',
        name: 'Check-in Reminder',
        subject: 'Parking Reminder',
        body: 'Reminder: Your parking at {{space_title}} starts in 30 minutes ({{time}}). Address: {{address}}. Have a safe trip!',
        variables: ['space_title', 'time', 'address'],
        category: 'reminder',
        active: true,
      },
      {
        id: 'check_out_reminder',
        name: 'Check-out Reminder',
        subject: 'Parking Ending Soon',
        body: 'Reminder: Your parking at {{space_title}} ends in 15 minutes ({{time}}). Please return to your vehicle soon.',
        variables: ['space_title', 'time'],
        category: 'reminder',
        active: true,
      },
      {
        id: 'payment_confirmation',
        name: 'Payment Confirmation',
        subject: 'Payment Confirmed',
        body: 'Payment of ${{amount}} confirmed for booking {{booking_id}}. Transaction ID: {{transaction_id}}. Thank you!',
        variables: ['amount', 'booking_id', 'transaction_id'],
        category: 'payment',
        active: true,
      },
      {
        id: 'emergency_alert',
        name: 'Emergency Alert',
        subject: 'Emergency Alert',
        body: 'EMERGENCY ALERT: {{user_name}} needs help. Location: {{location}}. Message: {{message}}. Please contact them immediately.',
        variables: ['user_name', 'location', 'message'],
        category: 'emergency',
        active: true,
      },
    ];
  }

  isQuietHours(preferences: SMSPreferences): boolean {
    if (!preferences.quiet_hours.enabled) return false;

    const now = new Date();
    const startTime = new Date();
    const endTime = new Date();

    const [startHours, startMinutes] = preferences.quiet_hours.start_time.split(':').map(Number);
    const [endHours, endMinutes] = preferences.quiet_hours.end_time.split(':').map(Number);

    startTime.setHours(startHours, startMinutes, 0, 0);
    endTime.setHours(endHours, endMinutes, 0, 0);

    // Handle quiet hours that span midnight
    if (startTime > endTime) {
      return now >= startTime || now <= endTime;
    } else {
      return now >= startTime && now <= endTime;
    }
  }
}

export default new SMSNotificationService();