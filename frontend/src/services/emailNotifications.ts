// Email Notification Service
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string[];
  category: 'booking' | 'payment' | 'reminder' | 'emergency' | 'marketing' | 'welcome';
  active: boolean;
  preview_text?: string;
}

export interface EmailMessage {
  id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  from: string;
  subject: string;
  html_content?: string;
  text_content?: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked';
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  template_id?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string;
  type: string;
  disposition: 'inline' | 'attachment';
  content_id?: string;
}

export interface EmailPreferences {
  enabled: boolean;
  email_address: string;
  verified: boolean;
  categories: {
    booking_confirmations: boolean;
    payment_updates: boolean;
    check_in_reminders: boolean;
    emergency_alerts: boolean;
    marketing_newsletters: boolean;
    host_communications: boolean;
    platform_updates: boolean;
  };
  frequency: {
    immediate: boolean;
    daily_digest: boolean;
    weekly_summary: boolean;
  };
  unsubscribe_all: boolean;
}

class EmailNotificationService {
  private readonly baseUrl = '/api/v1/email';

  async sendEmail(emailData: {
    to: string[];
    subject: string;
    html_content?: string;
    text_content?: string;
    template_id?: string;
    variables?: Record<string, any>;
    attachments?: EmailAttachment[];
  }): Promise<EmailMessage> {
    try {
      const response = await fetch(`${this.baseUrl}/send/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendTemplatedEmail(
    to: string[],
    templateId: string,
    variables: Record<string, any>,
    attachments?: EmailAttachment[]
  ): Promise<EmailMessage> {
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
          attachments,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send templated email');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending templated email:', error);
      throw error;
    }
  }

  async getEmailHistory(limit = 20, offset = 0): Promise<{
    messages: EmailMessage[];
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
        throw new Error('Failed to fetch email history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching email history:', error);
      throw error;
    }
  }

  async getEmailPreferences(): Promise<EmailPreferences> {
    try {
      const response = await fetch(`${this.baseUrl}/preferences/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        return this.getDefaultPreferences();
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching email preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  async updateEmailPreferences(preferences: Partial<EmailPreferences>): Promise<EmailPreferences> {
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
        throw new Error(error.message || 'Failed to update email preferences');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating email preferences:', error);
      throw error;
    }
  }

  async getTemplates(): Promise<EmailTemplate[]> {
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
      console.error('Error fetching email templates:', error);
      return this.getDefaultTemplates();
    }
  }

  async previewTemplate(
    templateId: string,
    variables: Record<string, any>
  ): Promise<{ subject: string; html_content: string; text_content: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/templates/${templateId}/preview/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ variables }),
      });

      if (!response.ok) {
        throw new Error('Failed to preview template');
      }

      return await response.json();
    } catch (error) {
      console.error('Error previewing template:', error);
      throw error;
    }
  }

  // Booking-specific email methods
  async sendBookingConfirmation(
    email: string,
    bookingData: {
      booking_id: string;
      user_name: string;
      space_title: string;
      host_name: string;
      start_time: string;
      end_time: string;
      address: string;
      total_amount: number;
      vehicle_info: string;
    }
  ): Promise<EmailMessage> {
    return this.sendTemplatedEmail(
      [email],
      'booking_confirmation',
      bookingData
    );
  }

  async sendBookingReminder(
    email: string,
    bookingData: {
      user_name: string;
      space_title: string;
      start_time: string;
      address: string;
      booking_id: string;
    }
  ): Promise<EmailMessage> {
    return this.sendTemplatedEmail(
      [email],
      'booking_reminder',
      bookingData
    );
  }

  async sendPaymentReceipt(
    email: string,
    paymentData: {
      user_name: string;
      booking_id: string;
      amount: number;
      transaction_id: string;
      payment_method: string;
      space_title: string;
      date: string;
    }
  ): Promise<EmailMessage> {
    return this.sendTemplatedEmail(
      [email],
      'payment_receipt',
      paymentData
    );
  }

  async sendHostEarningsReport(
    email: string,
    reportData: {
      host_name: string;
      period: string;
      total_earnings: number;
      total_bookings: number;
      payout_amount: number;
      payout_date: string;
    }
  ): Promise<EmailMessage> {
    return this.sendTemplatedEmail(
      [email],
      'host_earnings_report',
      reportData
    );
  }

  async sendWelcomeEmail(
    email: string,
    userData: {
      user_name: string;
      user_type: string;
    }
  ): Promise<EmailMessage> {
    return this.sendTemplatedEmail(
      [email],
      'welcome_email',
      userData
    );
  }

  async sendPasswordResetEmail(
    email: string,
    resetData: {
      user_name: string;
      reset_link: string;
      expiry_time: string;
    }
  ): Promise<EmailMessage> {
    return this.sendTemplatedEmail(
      [email],
      'password_reset',
      resetData
    );
  }

  async sendEmergencyAlert(
    emails: string[],
    alertData: {
      user_name: string;
      contact_name: string;
      location: string;
      message: string;
      timestamp: string;
    }
  ): Promise<EmailMessage> {
    return this.sendTemplatedEmail(
      emails,
      'emergency_alert',
      alertData
    );
  }

  // Utility methods
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  generateUnsubscribeLink(email: string, category?: string): string {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      email,
      ...(category && { category }),
    });
    return `${baseUrl}/unsubscribe?${params}`;
  }

  private getDefaultPreferences(): EmailPreferences {
    return {
      enabled: true,
      email_address: '',
      verified: false,
      categories: {
        booking_confirmations: true,
        payment_updates: true,
        check_in_reminders: true,
        emergency_alerts: true,
        marketing_newsletters: false,
        host_communications: true,
        platform_updates: true,
      },
      frequency: {
        immediate: true,
        daily_digest: false,
        weekly_summary: false,
      },
      unsubscribe_all: false,
    };
  }

  private getDefaultTemplates(): EmailTemplate[] {
    return [
      {
        id: 'booking_confirmation',
        name: 'Booking Confirmation',
        subject: 'Booking Confirmed - {{space_title}}',
        preview_text: 'Your parking reservation has been confirmed',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Booking Confirmed!</h2>
            <p>Hi {{user_name}},</p>
            <p>Your parking reservation has been confirmed. Here are the details:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>{{space_title}}</h3>
              <p><strong>Host:</strong> {{host_name}}</p>
              <p><strong>Address:</strong> {{address}}</p>
              <p><strong>Date & Time:</strong> {{start_time}} - {{end_time}}</p>
              <p><strong>Vehicle:</strong> {{vehicle_info}}</p>
              <p><strong>Total Amount:</strong> ${{total_amount}}</p>
              <p><strong>Booking ID:</strong> {{booking_id}}</p>
            </div>
            
            <p>Please arrive on time and follow any special instructions from your host.</p>
            <p>Have a great parking experience!</p>
            
            <p>Best regards,<br>Parking in a Pinch Team</p>
          </div>
        `,
        text_content: `
          Booking Confirmed!
          
          Hi {{user_name}},
          
          Your parking reservation has been confirmed:
          
          Space: {{space_title}}
          Host: {{host_name}}
          Address: {{address}}
          Date & Time: {{start_time}} - {{end_time}}
          Vehicle: {{vehicle_info}}
          Total: ${{total_amount}}
          Booking ID: {{booking_id}}
          
          Please arrive on time and follow any special instructions.
          
          Best regards,
          Parking in a Pinch Team
        `,
        variables: ['user_name', 'space_title', 'host_name', 'address', 'start_time', 'end_time', 'vehicle_info', 'total_amount', 'booking_id'],
        category: 'booking',
        active: true,
      },
      {
        id: 'booking_reminder',
        name: 'Booking Reminder',
        subject: 'Parking Reminder - {{space_title}} in 1 hour',
        preview_text: 'Your parking reservation starts soon',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Parking Reminder</h2>
            <p>Hi {{user_name}},</p>
            <p>This is a friendly reminder that your parking reservation starts in 1 hour:</p>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>{{space_title}}</h3>
              <p><strong>Address:</strong> {{address}}</p>
              <p><strong>Start Time:</strong> {{start_time}}</p>
              <p><strong>Booking ID:</strong> {{booking_id}}</p>
            </div>
            
            <p>Please allow extra time for travel and finding the exact location.</p>
            
            <p>Safe travels!</p>
            <p>Parking in a Pinch Team</p>
          </div>
        `,
        text_content: `
          Parking Reminder
          
          Hi {{user_name}},
          
          Your parking reservation starts in 1 hour:
          
          Space: {{space_title}}
          Address: {{address}}
          Start Time: {{start_time}}
          Booking ID: {{booking_id}}
          
          Please allow extra time for travel.
          
          Safe travels!
          Parking in a Pinch Team
        `,
        variables: ['user_name', 'space_title', 'address', 'start_time', 'booking_id'],
        category: 'reminder',
        active: true,
      },
      {
        id: 'payment_receipt',
        name: 'Payment Receipt',
        subject: 'Payment Receipt - ${{amount}}',
        preview_text: 'Your payment has been processed successfully',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Payment Receipt</h2>
            <p>Hi {{user_name}},</p>
            <p>Thank you for your payment. Here's your receipt:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Payment Details</h3>
              <p><strong>Amount:</strong> ${{amount}}</p>
              <p><strong>Booking:</strong> {{space_title}}</p>
              <p><strong>Date:</strong> {{date}}</p>
              <p><strong>Payment Method:</strong> {{payment_method}}</p>
              <p><strong>Transaction ID:</strong> {{transaction_id}}</p>
              <p><strong>Booking ID:</strong> {{booking_id}}</p>
            </div>
            
            <p>Keep this receipt for your records.</p>
            
            <p>Best regards,<br>Parking in a Pinch Team</p>
          </div>
        `,
        text_content: `
          Payment Receipt
          
          Hi {{user_name}},
          
          Payment Details:
          Amount: ${{amount}}
          Booking: {{space_title}}
          Date: {{date}}
          Payment Method: {{payment_method}}
          Transaction ID: {{transaction_id}}
          Booking ID: {{booking_id}}
          
          Keep this receipt for your records.
          
          Best regards,
          Parking in a Pinch Team
        `,
        variables: ['user_name', 'amount', 'space_title', 'date', 'payment_method', 'transaction_id', 'booking_id'],
        category: 'payment',
        active: true,
      },
      {
        id: 'welcome_email',
        name: 'Welcome Email',
        subject: 'Welcome to Parking in a Pinch!',
        preview_text: 'Welcome to the community!',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to Parking in a Pinch!</h2>
            <p>Hi {{user_name}},</p>
            <p>Welcome to the Parking in a Pinch community! We're excited to have you on board.</p>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>What's next?</h3>
              <ul>
                <li>Complete your profile for better matches</li>
                <li>{{#if (eq user_type "host")}}List your first parking space{{else}}Find your perfect parking spot{{/if}}</li>
                <li>Join our community and start earning/saving!</li>
              </ul>
            </div>
            
            <p>If you have any questions, our support team is here to help.</p>
            
            <p>Happy parking!</p>
            <p>The Parking in a Pinch Team</p>
          </div>
        `,
        text_content: `
          Welcome to Parking in a Pinch!
          
          Hi {{user_name}},
          
          Welcome to the community! We're excited to have you.
          
          What's next?
          - Complete your profile
          - List your space or find parking
          - Join our community!
          
          Questions? Our support team is here to help.
          
          Happy parking!
          The Parking in a Pinch Team
        `,
        variables: ['user_name', 'user_type'],
        category: 'welcome',
        active: true,
      },
      {
        id: 'emergency_alert',
        name: 'Emergency Alert',
        subject: 'URGENT: Emergency Alert from {{user_name}}',
        preview_text: 'Emergency assistance needed',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #d32f2f; margin: 0;">EMERGENCY ALERT</h2>
            </div>
            
            <p>Dear {{contact_name}},</p>
            <p><strong>{{user_name}}</strong> has triggered an emergency alert and may need immediate assistance.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Alert Details</h3>
              <p><strong>Time:</strong> {{timestamp}}</p>
              <p><strong>Location:</strong> {{location}}</p>
              <p><strong>Message:</strong> {{message}}</p>
            </div>
            
            <p style="color: #d32f2f; font-weight: bold;">Please contact {{user_name}} immediately or call emergency services if needed.</p>
            
            <p>This alert was sent automatically by Parking in a Pinch's safety system.</p>
          </div>
        `,
        text_content: `
          EMERGENCY ALERT
          
          Dear {{contact_name}},
          
          {{user_name}} has triggered an emergency alert and may need assistance.
          
          Alert Details:
          Time: {{timestamp}}
          Location: {{location}}
          Message: {{message}}
          
          Please contact {{user_name}} immediately or call emergency services if needed.
          
          This alert was sent automatically by Parking in a Pinch.
        `,
        variables: ['contact_name', 'user_name', 'timestamp', 'location', 'message'],
        category: 'emergency',
        active: true,
      },
    ];
  }
}

export default new EmailNotificationService();