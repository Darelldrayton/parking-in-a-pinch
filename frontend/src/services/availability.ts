import api from './api';

export interface AvailabilityRequest {
  parking_space_id: number;
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
}

export interface ConflictInfo {
  start_time: string;
  end_time: string;
  status: string;
}

export interface AvailabilityResponse {
  available: boolean;
  reason?: string;
  conflicts?: ConflictInfo[];
  parking_space?: {
    id: number;
    title: string;
    hourly_rate: number;
    is_instant_book: boolean;
  };
}

class AvailabilityService {
  async checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
    console.log('AvailabilityService: Checking availability for:', request);
    
    try {
      const response = await api.post('/bookings/bookings/check_availability/', request);
      console.log('AvailabilityService: Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('AvailabilityService: Error checking availability:', error);
      
      // If it's a validation error, return it as unavailable
      if (error.response?.status === 400) {
        return {
          available: false,
          reason: error.response.data.error || 'Invalid request parameters'
        };
      }
      
      // If it's a not found error
      if (error.response?.status === 404) {
        return {
          available: false,
          reason: 'Parking space not found'
        };
      }
      
      // For other errors, rethrow
      throw error;
    }
  }

  /**
   * Suggest alternative time slots when the requested time is unavailable
   */
  async suggestAlternativeSlots(
    parkingSpaceId: number, 
    requestedStart: Date, 
    requestedEnd: Date,
    maxSuggestions: number = 3
  ): Promise<{ start: Date; end: Date; label: string }[]> {
    const suggestions: { start: Date; end: Date; label: string }[] = [];
    const duration = requestedEnd.getTime() - requestedStart.getTime(); // Duration in milliseconds
    
    // Check slots before the requested time
    for (let i = 1; i <= 4; i++) {
      const earlierStart = new Date(requestedStart.getTime() - (i * 60 * 60 * 1000)); // i hours earlier
      const earlierEnd = new Date(earlierStart.getTime() + duration);
      
      try {
        const result = await this.checkAvailability({
          parking_space_id: parkingSpaceId,
          start_time: earlierStart.toISOString(),
          end_time: earlierEnd.toISOString()
        });
        
        if (result.available) {
          suggestions.push({
            start: earlierStart,
            end: earlierEnd,
            label: `${earlierStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${earlierEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
          });
          
          if (suggestions.length >= maxSuggestions) break;
        }
      } catch (error) {
        // Continue checking other slots
      }
    }
    
    // Check slots after the requested time
    for (let i = 1; i <= 4 && suggestions.length < maxSuggestions; i++) {
      const laterStart = new Date(requestedStart.getTime() + (i * 60 * 60 * 1000)); // i hours later
      const laterEnd = new Date(laterStart.getTime() + duration);
      
      try {
        const result = await this.checkAvailability({
          parking_space_id: parkingSpaceId,
          start_time: laterStart.toISOString(),
          end_time: laterEnd.toISOString()
        });
        
        if (result.available) {
          suggestions.push({
            start: laterStart,
            end: laterEnd,
            label: `${laterStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${laterEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
          });
        }
      } catch (error) {
        // Continue checking other slots
      }
    }
    
    return suggestions;
  }

  /**
   * Check availability and return a user-friendly message
   */
  async checkAvailabilityWithMessage(request: AvailabilityRequest): Promise<{
    available: boolean;
    message: string;
    conflicts?: ConflictInfo[];
    suggestions?: { start: Date; end: Date; label: string }[];
  }> {
    try {
      const result = await this.checkAvailability(request);
      
      if (result.available) {
        return {
          available: true,
          message: '✅ This time slot is available!'
        };
      } else {
        let message = result.reason || 'Time slot is not available';
        
        // Enhanced message customization based on specific reasons
        if (result.reason?.includes('conflicts with existing bookings') || result.reason?.includes('conflicts')) {
          const conflictCount = result.conflicts?.length || 1;
          message = `❌ This time slot conflicts with ${conflictCount} existing booking${conflictCount > 1 ? 's' : ''}. Please choose a different time.`;
        } else if (result.reason?.includes('opens at')) {
          // Extract the time and day from the message
          const match = result.reason.match(/opens at (\d{2}:\d{2}) on (\w+)/i);
          if (match) {
            const [, time, day] = match;
            message = `❌ Parking space opens at ${time} on ${day}. Please choose a later start time.`;
          } else {
            message = `❌ ${result.reason}. Please choose a later start time.`;
          }
        } else if (result.reason?.includes('closes at')) {
          // Extract the time and day from the message
          const match = result.reason.match(/closes at (\d{2}:\d{2}) on (\w+)/i);
          if (match) {
            const [, time, day] = match;
            message = `❌ Parking space closes at ${time} on ${day}. Please choose an earlier end time.`;
          } else {
            message = `❌ ${result.reason}. Please choose an earlier end time.`;
          }
        } else if (result.reason?.includes('not available on')) {
          // Extract the day from the message
          const match = result.reason.match(/not available on (\w+)/i);
          if (match) {
            const [, day] = match;
            message = `❌ Parking space is not available on ${day}. Please choose a different day.`;
          } else {
            message = `❌ ${result.reason}. Please choose a different day.`;
          }
        } else if (result.reason?.includes('Start time must be in the future')) {
          message = '⏰ Please select a future start time.';
        } else if (result.reason?.includes('End time must be after start time')) {
          message = '⏰ End time must be after start time. Please adjust your booking duration.';
        } else if (result.reason?.includes('schedule not configured')) {
          message = '⚠️ Parking space schedule is not configured for the selected day. Please contact the host.';
        } else {
          // For any other specific backend messages, preserve them as-is with an icon
          message = `❌ ${result.reason}`;
        }
        
        // Get alternative suggestions but don't add them to the message
        let suggestions: { start: Date; end: Date; label: string }[] = [];
        if (result.reason?.includes('conflict')) {
          try {
            const requestedStart = new Date(request.start_time);
            const requestedEnd = new Date(request.end_time);
            suggestions = await this.suggestAlternativeSlots(
              request.parking_space_id,
              requestedStart,
              requestedEnd,
              3
            );
          } catch (error) {
            console.error('Error getting suggestions:', error);
          }
        }
        
        return {
          available: false,
          message,
          conflicts: result.conflicts,
          suggestions
        };
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      return {
        available: false,
        message: '⚠️ Unable to check availability. Please try again.'
      };
    }
  }

  /**
   * Get unavailable time slots for a parking space for a given date range
   * Useful for calendar/time picker components
   */
  async getUnavailableSlots(parkingSpaceId: number, startDate: Date, endDate: Date): Promise<ConflictInfo[]> {
    try {
      // This would require a separate endpoint, but for now we can approximate
      // by checking availability in hourly increments
      const unavailableSlots: ConflictInfo[] = [];
      
      // For demonstration, we'll just return conflicts from a simple check
      const request: AvailabilityRequest = {
        parking_space_id: parkingSpaceId,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString()
      };
      
      const result = await this.checkAvailability(request);
      
      if (!result.available && result.conflicts) {
        return result.conflicts;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting unavailable slots:', error);
      return [];
    }
  }

  /**
   * Debounced availability check to avoid too many API calls
   */
  private debounceTimer: NodeJS.Timeout | null = null;
  
  checkAvailabilityDebounced(
    request: AvailabilityRequest, 
    callback: (result: AvailabilityResponse) => void,
    delay: number = 500
  ): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(async () => {
      try {
        const result = await this.checkAvailability(request);
        callback(result);
      } catch (error) {
        console.error('Debounced availability check failed:', error);
        callback({
          available: false,
          reason: 'Failed to check availability'
        });
      }
    }, delay);
  }
}

export default new AvailabilityService();