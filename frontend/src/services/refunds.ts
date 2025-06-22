// Refund Management Service
export interface CancellationPolicy {
  id: string;
  name: string;
  description: string;
  rules: CancellationRule[];
  is_default: boolean;
}

export interface CancellationRule {
  hours_before: number;
  refund_percentage: number;
  description: string;
}

export interface RefundRequest {
  id: string;
  booking_id: number;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  requested_by: 'renter' | 'host' | 'admin';
  created_at: string;
  processed_at?: string;
  stripe_refund_id?: string;
  admin_notes?: string;
}

export interface RefundCalculation {
  original_amount: number;
  cancellation_fee: number;
  platform_fee_refund: number;
  stripe_fee_refund: number;
  refund_amount: number;
  policy_applied: string;
  hours_before_start: number;
}

class RefundService {
  private readonly defaultPolicies: CancellationPolicy[] = [
    {
      id: 'flexible',
      name: 'Flexible',
      description: 'Full refund until 24 hours before start time',
      is_default: false,
      rules: [
        { hours_before: 24, refund_percentage: 100, description: 'Full refund' },
        { hours_before: 1, refund_percentage: 50, description: '50% refund' },
        { hours_before: 0, refund_percentage: 0, description: 'No refund' },
      ],
    },
    {
      id: 'moderate',
      name: 'Moderate',
      description: 'Full refund until 48 hours before start time',
      is_default: true,
      rules: [
        { hours_before: 48, refund_percentage: 100, description: 'Full refund' },
        { hours_before: 24, refund_percentage: 75, description: '75% refund' },
        { hours_before: 6, refund_percentage: 25, description: '25% refund' },
        { hours_before: 0, refund_percentage: 0, description: 'No refund' },
      ],
    },
    {
      id: 'strict',
      name: 'Strict',
      description: 'Full refund until 7 days before start time',
      is_default: false,
      rules: [
        { hours_before: 168, refund_percentage: 100, description: 'Full refund (7+ days)' },
        { hours_before: 48, refund_percentage: 50, description: '50% refund (2-7 days)' },
        { hours_before: 0, refund_percentage: 0, description: 'No refund (less than 2 days)' },
      ],
    },
  ];

  async calculateRefund(
    bookingId: number,
    cancellationTime?: Date
  ): Promise<RefundCalculation> {
    try {
      const response = await fetch(`/api/v1/bookings/bookings/${bookingId}/refund_eligibility/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to calculate refund');
      }

      const data = await response.json();
      
      // Convert to our RefundCalculation format
      return {
        original_amount: data.original_amount,
        cancellation_fee: data.original_amount - data.refund_amount,
        platform_fee_refund: data.refund_amount * 0.05, // Estimate
        stripe_fee_refund: data.refund_amount * 0.029, // Estimate
        refund_amount: data.refund_amount,
        policy_applied: data.cancellation_policy,
        hours_before_start: data.hours_until_booking,
      };
    } catch (error) {
      console.error('Error calculating refund:', error);
      throw error;
    }
  }

  async requestRefund(
    bookingId: number,
    reason: string,
    requestedBy: 'renter' | 'host' = 'renter'
  ): Promise<RefundRequest> {
    try {
      // Use the cancel endpoint which will automatically process refunds
      const response = await fetch(`/api/v1/bookings/bookings/${bookingId}/cancel/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel booking and process refund');
      }

      const data = await response.json();
      
      // Return a mock RefundRequest object since our API doesn't return this format
      return {
        id: `refund_${bookingId}_${Date.now()}`,
        booking_id: bookingId,
        amount: 0, // We'd need to calculate this
        reason,
        status: 'processed',
        requested_by: requestedBy,
        created_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error requesting refund:', error);
      throw error;
    }
  }

  async getRefundRequests(status?: string): Promise<RefundRequest[]> {
    try {
      const params = new URLSearchParams();
      if (status) {
        params.set('status', status);
      }

      const response = await fetch(`/api/v1/refunds/?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch refund requests');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      throw error;
    }
  }

  async processRefund(
    refundId: string,
    approved: boolean,
    adminNotes?: string
  ): Promise<RefundRequest> {
    try {
      const response = await fetch(`/api/v1/refunds/${refundId}/process/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          approved,
          admin_notes: adminNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process refund');
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  async getCancellationPolicies(): Promise<CancellationPolicy[]> {
    try {
      const response = await fetch('/api/v1/cancellation-policies/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        // Return default policies if API fails
        return this.defaultPolicies;
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching cancellation policies:', error);
      return this.defaultPolicies;
    }
  }

  async updateCancellationPolicy(
    listingId: number,
    policyId: string
  ): Promise<void> {
    try {
      const response = await fetch(`/api/v1/listings/${listingId}/cancellation-policy/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          policy_id: policyId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update cancellation policy');
      }
    } catch (error) {
      console.error('Error updating cancellation policy:', error);
      throw error;
    }
  }

  calculateRefundLocal(
    originalAmount: number,
    startTime: Date,
    cancellationTime: Date = new Date(),
    policy: CancellationPolicy
  ): RefundCalculation {
    const hoursBeforeStart = (startTime.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60);
    
    // Find applicable rule
    let applicableRule = policy.rules[policy.rules.length - 1]; // Default to last rule (most restrictive)
    
    for (const rule of policy.rules) {
      if (hoursBeforeStart >= rule.hours_before) {
        applicableRule = rule;
        break;
      }
    }

    const refundPercentage = applicableRule.refund_percentage / 100;
    const cancellationFee = originalAmount * (1 - refundPercentage);
    const refundAmount = originalAmount * refundPercentage;

    // Calculate fee refunds (simplified)
    const platformFeeRefund = refundPercentage > 0 ? originalAmount * 0.05 * refundPercentage : 0;
    const stripeFeeRefund = refundPercentage > 0 ? originalAmount * 0.029 * refundPercentage : 0;

    return {
      original_amount: originalAmount,
      cancellation_fee: Math.round(cancellationFee * 100) / 100,
      platform_fee_refund: Math.round(platformFeeRefund * 100) / 100,
      stripe_fee_refund: Math.round(stripeFeeRefund * 100) / 100,
      refund_amount: Math.round(refundAmount * 100) / 100,
      policy_applied: policy.name,
      hours_before_start: Math.round(hoursBeforeStart * 10) / 10,
    };
  }

  getRefundReasons(): { value: string; label: string }[] {
    return [
      { value: 'host_cancelled', label: 'Host cancelled the booking' },
      { value: 'renter_cancelled', label: 'Renter cancelled the booking' },
      { value: 'space_unavailable', label: 'Parking space became unavailable' },
      { value: 'emergency', label: 'Emergency situation' },
      { value: 'weather', label: 'Weather-related cancellation' },
      { value: 'no_show', label: 'Renter did not show up' },
      { value: 'payment_issue', label: 'Payment processing issue' },
      { value: 'dispute', label: 'Booking dispute' },
      { value: 'other', label: 'Other reason' },
    ];
  }

  formatRefundStatus(status: string): { label: string; color: string } {
    switch (status) {
      case 'pending':
        return { label: 'Pending Review', color: 'warning' };
      case 'approved':
        return { label: 'Approved', color: 'success' };
      case 'rejected':
        return { label: 'Rejected', color: 'error' };
      case 'processed':
        return { label: 'Processed', color: 'info' };
      default:
        return { label: 'Unknown', color: 'default' };
    }
  }

  getRefundTimeline(refund: RefundRequest): Array<{
    status: string;
    label: string;
    date?: string;
    completed: boolean;
  }> {
    const timeline = [
      {
        status: 'requested',
        label: 'Refund Requested',
        date: refund.created_at,
        completed: true,
      },
      {
        status: 'pending',
        label: 'Under Review',
        completed: refund.status !== 'pending',
      },
      {
        status: 'approved',
        label: refund.status === 'rejected' ? 'Rejected' : 'Approved',
        date: refund.processed_at,
        completed: refund.status === 'approved' || refund.status === 'rejected' || refund.status === 'processed',
      },
    ];

    if (refund.status === 'processed') {
      timeline.push({
        status: 'processed',
        label: 'Refund Processed',
        date: refund.processed_at,
        completed: true,
      });
    }

    return timeline;
  }
}

export default new RefundService();