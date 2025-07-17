/**
 * User Validation Service - Prevents data leakage between users
 * 
 * This service provides runtime validation to ensure that all data
 * displayed to the user belongs to the currently authenticated user.
 */

interface ValidationResult {
  isValid: boolean;
  violations: string[];
  validData: any[];
}

class UserValidationService {
  /**
   * Validate that all items in an array belong to the current user
   */
  validateUserData(data: any[], currentUserId: number, userFieldNames: string[] = ['user', 'user_id', 'host', 'host_id']): ValidationResult {
    const violations: string[] = [];
    const validData: any[] = [];

    data.forEach((item, index) => {
      let belongsToUser = false;
      
      // Check all possible user field names
      for (const fieldName of userFieldNames) {
        if (item[fieldName] && item[fieldName] === currentUserId) {
          belongsToUser = true;
          break;
        }
      }
      
      if (belongsToUser) {
        validData.push(item);
      } else {
        const userFieldValue = userFieldNames.find(field => item[field]) || 'unknown';
        violations.push(`Item ${index} (ID: ${item.id}) belongs to user ${item[userFieldValue]} but current user is ${currentUserId}`);
      }
    });

    return {
      isValid: violations.length === 0,
      violations,
      validData
    };
  }

  /**
   * Validate and log security violations for user data
   */
  validateAndFilterUserData(data: any[], currentUserId: number, context: string, userFieldNames?: string[]): any[] {
    if (!currentUserId) {
      console.warn(`🔐 UserValidation: No current user ID provided for ${context}`);
      return [];
    }

    const result = this.validateUserData(data, currentUserId, userFieldNames);
    
    if (!result.isValid) {
      console.error(`🚨 SECURITY VIOLATION in ${context}:`, result.violations);
      console.error(`🚨 Filtered out ${result.violations.length} items that belonged to other users`);
      
      // Log each violation for debugging
      result.violations.forEach(violation => {
        console.error(`🔐 ${context}: ${violation}`);
      });
    }

    return result.validData;
  }

  /**
   * Validate that API response data belongs to the current user
   */
  validateApiResponse(response: any, currentUserId: number, context: string): void {
    if (response.user_id && response.user_id !== currentUserId) {
      console.error(`🚨 SECURITY ALERT: API response for ${context} returned data for user ${response.user_id} but current user is ${currentUserId}`);
      throw new Error(`Authentication token mismatch in ${context} - user data isolation violation`);
    }
  }

  /**
   * Clear all user-specific cached data
   */
  clearUserCachedData(): void {
    const userDataKeys = [
      'user_preferences',
      'draft_listings', 
      'booking_drafts',
      'listings_cache',
      'bookings_cache',
      'user_profile_cache',
      'search_cache',
      'messages_cache',
      'parking_performance_metrics',
      'cachedUnreadCount',
      'parking_app_backup',
      'user_search_history',
      'user_favorites',
      'user_settings'
    ];
    
    userDataKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear any cache keys that might contain user data
    Object.keys(localStorage).forEach(key => {
      if (key.includes('cache') || key.includes('draft') || key.includes('user_')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('🔐 UserValidation: Cleared all user cached data');
  }

  /**
   * Validate user session and clear stale data if needed
   */
  validateUserSession(expectedUserId: number): void {
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      console.warn('🔐 UserValidation: No stored user found');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      
      if (user.id !== expectedUserId) {
        console.error(`🚨 SECURITY ALERT: Stored user ID ${user.id} does not match expected user ID ${expectedUserId}`);
        console.error('🔐 UserValidation: Clearing all user data due to session mismatch');
        this.clearUserCachedData();
        throw new Error('User session validation failed - clearing cached data');
      }
    } catch (error) {
      console.error('🔐 UserValidation: Error parsing stored user:', error);
      this.clearUserCachedData();
    }
  }
}

export default new UserValidationService();