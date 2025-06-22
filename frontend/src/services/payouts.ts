// Stripe Connect Payouts Service
export interface StripeConnectAccount {
  id: string;
  email: string;
  country: string;
  default_currency: string;
  details_submitted: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  };
}

export interface PayoutSchedule {
  delay_days: number;
  interval: 'daily' | 'weekly' | 'monthly' | 'manual';
  weekly_anchor?: string;
  monthly_anchor?: number;
}

export interface Payout {
  id: string;
  amount: number;
  currency: string;
  arrival_date: number;
  created: number;
  description: string;
  destination: string;
  failure_code?: string;
  failure_message?: string;
  livemode: boolean;
  method: 'standard' | 'instant';
  source_type: string;
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
  type: 'bank_account' | 'card';
}

export interface PayoutBreakdown {
  total_earnings: number;
  platform_fee: number;
  stripe_fee: number;
  net_payout: number;
  booking_count: number;
  period_start: string;
  period_end: string;
}

class PayoutService {
  private readonly PLATFORM_FEE_RATE = 0.05; // 5% platform fee
  private readonly STRIPE_FEE_RATE = 0.029; // 2.9% + 30¢ Stripe fee

  async createConnectAccount(hostData: {
    email: string;
    country: string;
    business_type: 'individual' | 'company';
    individual?: {
      first_name: string;
      last_name: string;
      phone: string;
      address: {
        line1: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    };
  }): Promise<StripeConnectAccount> {
    try {
      const response = await fetch('/api/v1/payments/connect/accounts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(hostData),
      });

      if (!response.ok) {
        throw new Error('Failed to create Connect account');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating Connect account:', error);
      throw error;
    }
  }

  async getConnectAccount(): Promise<StripeConnectAccount | null> {
    try {
      const response = await fetch('/api/v1/payments/connect/account/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.status === 404) {
        return null; // No account exists
      }

      if (!response.ok) {
        throw new Error('Failed to fetch Connect account');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Connect account:', error);
      throw error;
    }
  }

  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<string> {
    try {
      const response = await fetch('/api/v1/payments/connect/account-links/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          account: accountId,
          refresh_url: refreshUrl,
          return_url: returnUrl,
          type: 'account_onboarding',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create account link');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error creating account link:', error);
      throw error;
    }
  }

  async getPayoutSchedule(): Promise<PayoutSchedule> {
    try {
      const response = await fetch('/api/v1/payments/payout-schedule/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payout schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payout schedule:', error);
      throw error;
    }
  }

  async updatePayoutSchedule(schedule: Partial<PayoutSchedule>): Promise<PayoutSchedule> {
    try {
      const response = await fetch('/api/v1/payments/payout-schedule/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(schedule),
      });

      if (!response.ok) {
        throw new Error('Failed to update payout schedule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating payout schedule:', error);
      throw error;
    }
  }

  async getPayouts(limit = 20, starting_after?: string): Promise<{ data: Payout[]; has_more: boolean }> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (starting_after) {
        params.set('starting_after', starting_after);
      }

      const response = await fetch(`/api/v1/payments/payouts/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payouts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payouts:', error);
      throw error;
    }
  }

  async getPendingEarnings(): Promise<PayoutBreakdown> {
    try {
      const response = await fetch('/api/v1/payments/pending-earnings/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending earnings');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching pending earnings:', error);
      throw error;
    }
  }

  async requestInstantPayout(amount: number): Promise<Payout> {
    try {
      const response = await fetch('/api/v1/payments/instant-payout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to cents
          currency: 'usd',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request instant payout');
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting instant payout:', error);
      throw error;
    }
  }

  calculateFees(amount: number): {
    platform_fee: number;
    stripe_fee: number;
    net_amount: number;
  } {
    const platform_fee = amount * this.PLATFORM_FEE_RATE;
    const stripe_fee = (amount * this.STRIPE_FEE_RATE) + 0.30; // 2.9% + 30¢
    const net_amount = amount - platform_fee - stripe_fee;

    return {
      platform_fee: Math.round(platform_fee * 100) / 100,
      stripe_fee: Math.round(stripe_fee * 100) / 100,
      net_amount: Math.round(net_amount * 100) / 100,
    };
  }

  formatPayoutStatus(status: string): { label: string; color: string } {
    switch (status) {
      case 'paid':
        return { label: 'Paid', color: 'success' };
      case 'pending':
        return { label: 'Pending', color: 'warning' };
      case 'in_transit':
        return { label: 'In Transit', color: 'info' };
      case 'canceled':
        return { label: 'Canceled', color: 'default' };
      case 'failed':
        return { label: 'Failed', color: 'error' };
      default:
        return { label: 'Unknown', color: 'default' };
    }
  }

  getEstimatedArrival(delay_days: number): Date {
    const arrival = new Date();
    arrival.setDate(arrival.getDate() + delay_days);
    
    // Skip weekends for bank transfers
    while (arrival.getDay() === 0 || arrival.getDay() === 6) {
      arrival.setDate(arrival.getDate() + 1);
    }
    
    return arrival;
  }
}

export default new PayoutService();