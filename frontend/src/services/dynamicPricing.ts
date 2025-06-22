// Dynamic Pricing Engine
export interface PricingFactor {
  type: 'time' | 'demand' | 'event' | 'weather' | 'location' | 'duration';
  name: string;
  multiplier: number;
  active: boolean;
  description: string;
}

export interface PricingRule {
  id: string;
  name: string;
  description: string;
  conditions: PricingCondition[];
  multiplier: number;
  priority: number;
  active: boolean;
  valid_from?: string;
  valid_until?: string;
}

export interface PricingCondition {
  field: string;
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';
  value: any;
  description: string;
}

export interface PriceCalculation {
  base_price: number;
  applied_factors: PricingFactor[];
  applied_rules: PricingRule[];
  total_multiplier: number;
  final_price: number;
  surge_active: boolean;
  savings?: number;
  breakdown: PriceBreakdownItem[];
}

export interface PriceBreakdownItem {
  label: string;
  amount: number;
  type: 'base' | 'surcharge' | 'discount' | 'fee';
  description?: string;
}

export interface EventData {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  location: {
    lat: number;
    lng: number;
    radius: number; // km
  };
  expected_attendance: number;
  price_multiplier: number;
}

export interface DemandData {
  hour: number;
  day_of_week: number;
  occupancy_rate: number;
  booking_velocity: number; // bookings per hour
  average_duration: number; // hours
}

class DynamicPricingService {
  private readonly SURGE_THRESHOLD = 0.8; // 80% occupancy triggers surge
  private readonly MAX_SURGE_MULTIPLIER = 3.0;
  private readonly MIN_SURGE_MULTIPLIER = 0.7;

  async calculatePrice(
    listingId: number,
    startTime: Date,
    endTime: Date,
    basePrice: number
  ): Promise<PriceCalculation> {
    try {
      const response = await fetch('/api/v1/pricing/calculate/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          listing_id: listingId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          base_price: basePrice,
        }),
      });

      if (!response.ok) {
        // Fallback to local calculation
        return this.calculatePriceLocal(listingId, startTime, endTime, basePrice);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating price:', error);
      return this.calculatePriceLocal(listingId, startTime, endTime, basePrice);
    }
  }

  private calculatePriceLocal(
    listingId: number,
    startTime: Date,
    endTime: Date,
    basePrice: number
  ): PriceCalculation {
    const factors: PricingFactor[] = [];
    const rules: PricingRule[] = [];
    const breakdown: PriceBreakdownItem[] = [];
    
    let totalMultiplier = 1.0;
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

    // Base price
    breakdown.push({
      label: 'Base Rate',
      amount: basePrice,
      type: 'base',
      description: `$${basePrice}/hour × ${duration.toFixed(1)} hours`,
    });

    // Time-based pricing
    const timeMultiplier = this.getTimeBasedMultiplier(startTime);
    if (timeMultiplier !== 1.0) {
      factors.push({
        type: 'time',
        name: this.getTimePeriodName(startTime),
        multiplier: timeMultiplier,
        active: true,
        description: `${timeMultiplier > 1 ? 'Peak' : 'Off-peak'} time pricing`,
      });
      totalMultiplier *= timeMultiplier;
      
      const surcharge = basePrice * duration * (timeMultiplier - 1);
      breakdown.push({
        label: timeMultiplier > 1 ? 'Peak Time Surcharge' : 'Off-Peak Discount',
        amount: surcharge,
        type: timeMultiplier > 1 ? 'surcharge' : 'discount',
        description: `${((timeMultiplier - 1) * 100).toFixed(0)}% ${timeMultiplier > 1 ? 'increase' : 'decrease'}`,
      });
    }

    // Duration-based pricing (longer bookings get discounts)
    const durationMultiplier = this.getDurationMultiplier(duration);
    if (durationMultiplier !== 1.0) {
      factors.push({
        type: 'duration',
        name: 'Duration Discount',
        multiplier: durationMultiplier,
        active: true,
        description: 'Discount for extended parking',
      });
      totalMultiplier *= durationMultiplier;
      
      const discount = basePrice * duration * (1 - durationMultiplier);
      breakdown.push({
        label: 'Extended Stay Discount',
        amount: -discount,
        type: 'discount',
        description: `${((1 - durationMultiplier) * 100).toFixed(0)}% off for ${duration}+ hour booking`,
      });
    }

    // Day of week pricing
    const dayMultiplier = this.getDayOfWeekMultiplier(startTime);
    if (dayMultiplier !== 1.0) {
      factors.push({
        type: 'time',
        name: 'Weekend Pricing',
        multiplier: dayMultiplier,
        active: true,
        description: 'Weekend pricing adjustment',
      });
      totalMultiplier *= dayMultiplier;
      
      const adjustment = basePrice * duration * (dayMultiplier - 1);
      breakdown.push({
        label: 'Weekend Adjustment',
        amount: adjustment,
        type: dayMultiplier > 1 ? 'surcharge' : 'discount',
        description: `${((dayMultiplier - 1) * 100).toFixed(0)}% weekend adjustment`,
      });
    }

    // Simulate demand-based surge pricing
    const demandMultiplier = this.simulateDemandMultiplier(startTime);
    const surgeActive = demandMultiplier > 1.2;
    
    if (surgeActive) {
      factors.push({
        type: 'demand',
        name: 'High Demand',
        multiplier: demandMultiplier,
        active: true,
        description: 'Increased pricing due to high demand',
      });
      totalMultiplier *= demandMultiplier;
      
      const surgeFee = basePrice * duration * (demandMultiplier - 1);
      breakdown.push({
        label: 'Surge Pricing',
        amount: surgeFee,
        type: 'surcharge',
        description: `${((demandMultiplier - 1) * 100).toFixed(0)}% surge due to high demand`,
      });
    }

    const finalPrice = Math.round(basePrice * duration * totalMultiplier * 100) / 100;

    return {
      base_price: basePrice * duration,
      applied_factors: factors,
      applied_rules: rules,
      total_multiplier: Math.round(totalMultiplier * 100) / 100,
      final_price: finalPrice,
      surge_active: surgeActive,
      breakdown,
    };
  }

  private getTimeBasedMultiplier(date: Date): number {
    const hour = date.getHours();
    
    // Peak hours: 7-10 AM, 5-8 PM
    if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      return 1.5; // 50% surcharge
    }
    
    // Late night hours: 10 PM - 6 AM
    if (hour >= 22 || hour <= 6) {
      return 0.8; // 20% discount
    }
    
    return 1.0; // Regular pricing
  }

  private getDurationMultiplier(hours: number): number {
    if (hours >= 24) {
      return 0.7; // 30% discount for 24+ hours
    }
    if (hours >= 8) {
      return 0.85; // 15% discount for 8+ hours
    }
    if (hours >= 4) {
      return 0.95; // 5% discount for 4+ hours
    }
    return 1.0;
  }

  private getDayOfWeekMultiplier(date: Date): number {
    const dayOfWeek = date.getDay();
    
    // Weekend pricing (Friday evening, Saturday, Sunday)
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
      return 1.3; // 30% surcharge
    }
    
    if (dayOfWeek === 5 && date.getHours() >= 17) { // Friday evening
      return 1.2; // 20% surcharge
    }
    
    return 1.0;
  }

  private simulateDemandMultiplier(date: Date): number {
    // Simulate demand based on time patterns
    const hour = date.getHours();
    const dayOfWeek = date.getDay();
    
    // Higher demand during business hours on weekdays
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 8 && hour <= 18) {
      return Math.random() < 0.3 ? 1.5 : 1.0; // 30% chance of surge
    }
    
    // Higher demand on weekend evenings
    if ((dayOfWeek === 5 || dayOfWeek === 6) && hour >= 18 && hour <= 23) {
      return Math.random() < 0.4 ? 1.8 : 1.0; // 40% chance of higher surge
    }
    
    return 1.0;
  }

  private getTimePeriodName(date: Date): string {
    const hour = date.getHours();
    
    if ((hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20)) {
      return 'Peak Hours';
    }
    
    if (hour >= 22 || hour <= 6) {
      return 'Late Night';
    }
    
    return 'Regular Hours';
  }

  async getPricingRules(): Promise<PricingRule[]> {
    try {
      const response = await fetch('/api/v1/pricing/rules/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        return this.getDefaultPricingRules();
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
      return this.getDefaultPricingRules();
    }
  }

  private getDefaultPricingRules(): PricingRule[] {
    return [
      {
        id: 'peak_hours',
        name: 'Peak Hours Surcharge',
        description: 'Higher rates during rush hours',
        conditions: [
          {
            field: 'hour',
            operator: 'in',
            value: [7, 8, 9, 10, 17, 18, 19, 20],
            description: 'Rush hour times',
          },
        ],
        multiplier: 1.5,
        priority: 1,
        active: true,
      },
      {
        id: 'weekend_premium',
        name: 'Weekend Premium',
        description: 'Higher rates on weekends',
        conditions: [
          {
            field: 'day_of_week',
            operator: 'in',
            value: [0, 6],
            description: 'Saturday and Sunday',
          },
        ],
        multiplier: 1.3,
        priority: 2,
        active: true,
      },
      {
        id: 'high_demand_surge',
        name: 'High Demand Surge',
        description: 'Surge pricing when demand is high',
        conditions: [
          {
            field: 'occupancy_rate',
            operator: 'gte',
            value: 0.8,
            description: '80% or higher occupancy',
          },
        ],
        multiplier: 2.0,
        priority: 3,
        active: true,
      },
    ];
  }

  async updatePricingRule(rule: PricingRule): Promise<PricingRule> {
    try {
      const response = await fetch(`/api/v1/pricing/rules/${rule.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        throw new Error('Failed to update pricing rule');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating pricing rule:', error);
      throw error;
    }
  }

  async getDemandForecast(
    listingId: number,
    startDate: Date,
    endDate: Date
  ): Promise<DemandData[]> {
    try {
      const response = await fetch(`/api/v1/pricing/demand-forecast/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          listing_id: listingId,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        }),
      });

      if (!response.ok) {
        return this.generateMockDemandData(startDate, endDate);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching demand forecast:', error);
      return this.generateMockDemandData(startDate, endDate);
    }
  }

  private generateMockDemandData(startDate: Date, endDate: Date): DemandData[] {
    const data: DemandData[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      for (let hour = 0; hour < 24; hour++) {
        const dayOfWeek = current.getDay();
        let occupancyRate = 0.3; // Base 30%
        
        // Higher occupancy during business hours
        if (hour >= 8 && hour <= 18) {
          occupancyRate += 0.4;
        }
        
        // Weekend adjustments
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          occupancyRate *= 0.8;
        }
        
        // Add some randomness
        occupancyRate += (Math.random() - 0.5) * 0.2;
        occupancyRate = Math.max(0, Math.min(1, occupancyRate));
        
        data.push({
          hour,
          day_of_week: dayOfWeek,
          occupancy_rate: Math.round(occupancyRate * 100) / 100,
          booking_velocity: Math.round((occupancyRate * 10 + Math.random() * 5) * 10) / 10,
          average_duration: 2 + Math.random() * 6,
        });
      }
      current.setDate(current.getDate() + 1);
    }
    
    return data;
  }

  formatPriceChange(oldPrice: number, newPrice: number): {
    amount: number;
    percentage: number;
    direction: 'increase' | 'decrease' | 'same';
    label: string;
  } {
    const amount = newPrice - oldPrice;
    const percentage = oldPrice > 0 ? (amount / oldPrice) * 100 : 0;
    
    let direction: 'increase' | 'decrease' | 'same' = 'same';
    if (amount > 0.01) direction = 'increase';
    else if (amount < -0.01) direction = 'decrease';
    
    const label = direction === 'same' 
      ? 'No change'
      : `${direction === 'increase' ? '+' : ''}${amount.toFixed(2)} (${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%)`;
    
    return {
      amount: Math.round(amount * 100) / 100,
      percentage: Math.round(percentage * 10) / 10,
      direction,
      label,
    };
  }
}

export default new DynamicPricingService();