import React, { useEffect } from 'react';
import api from '../../services/api';

interface TermsAcceptanceTrackerProps {
  userId?: number;
  action: 'signup' | 'booking' | 'listing' | 'checkout';
  version?: string;
  metadata?: any;
}

/**
 * Component to track and log terms acceptance for legal compliance
 * This component should be used whenever a user accepts terms or conditions
 */
export const TermsAcceptanceTracker: React.FC<TermsAcceptanceTrackerProps> = ({
  userId,
  action,
  version = '2025-01-15',
  metadata = {}
}) => {
  
  useEffect(() => {
    const recordAcceptance = async () => {
      try {
        // Record the terms acceptance for legal compliance
        const acceptanceData = {
          user_id: userId,
          action_type: action,
          terms_version: version,
          timestamp: new Date().toISOString(),
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          page_url: window.location.href,
          metadata: {
            ...metadata,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language
          }
        };

        // Store locally for immediate compliance
        const localAcceptances = JSON.parse(
          localStorage.getItem('terms_acceptances') || '[]'
        );
        localAcceptances.push(acceptanceData);
        localStorage.setItem('terms_acceptances', JSON.stringify(localAcceptances));

        // Send to server for permanent record
        try {
          await api.post('/api/v1/legal/terms-acceptance/', acceptanceData);
        } catch (serverError) {
          console.warn('Failed to record terms acceptance on server:', serverError);
          // Store in queue for later retry
          const pendingAcceptances = JSON.parse(
            localStorage.getItem('pending_terms_acceptances') || '[]'
          );
          pendingAcceptances.push(acceptanceData);
          localStorage.setItem('pending_terms_acceptances', JSON.stringify(pendingAcceptances));
        }

      } catch (error) {
        console.error('Error recording terms acceptance:', error);
      }
    };

    recordAcceptance();
  }, [userId, action, version, metadata]);

  // Helper function to get client IP (approximation)
  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  // This component doesn't render anything visible
  return null;
};

/**
 * Hook to manually trigger terms acceptance recording
 */
export const useTermsAcceptanceTracking = () => {
  const recordAcceptance = async (
    action: 'signup' | 'booking' | 'listing' | 'checkout',
    userId?: number,
    metadata?: any
  ) => {
    try {
      const acceptanceData = {
        user_id: userId,
        action_type: action,
        terms_version: '2025-01-15',
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        metadata: {
          ...metadata,
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language
        }
      };

      // Store locally
      const localAcceptances = JSON.parse(
        localStorage.getItem('terms_acceptances') || '[]'
      );
      localAcceptances.push(acceptanceData);
      localStorage.setItem('terms_acceptances', JSON.stringify(localAcceptances));

      // Send to server
      try {
        await api.post('/api/v1/legal/terms-acceptance/', acceptanceData);
        console.log('Terms acceptance recorded successfully');
      } catch (error) {
        console.warn('Failed to record terms acceptance on server:', error);
      }

    } catch (error) {
      console.error('Error in terms acceptance tracking:', error);
    }
  };

  return { recordAcceptance };
};

/**
 * Component to retry failed terms acceptance submissions
 */
export const TermsAcceptanceRetry: React.FC = () => {
  useEffect(() => {
    const retryPendingAcceptances = async () => {
      try {
        const pending = JSON.parse(
          localStorage.getItem('pending_terms_acceptances') || '[]'
        );

        if (pending.length === 0) return;

        const successful: any[] = [];
        const stillPending: any[] = [];

        for (const acceptance of pending) {
          try {
            await api.post('/api/v1/legal/terms-acceptance/', acceptance);
            successful.push(acceptance);
          } catch {
            stillPending.push(acceptance);
          }
        }

        // Update pending list
        localStorage.setItem('pending_terms_acceptances', JSON.stringify(stillPending));

        if (successful.length > 0) {
          console.log(`Successfully submitted ${successful.length} pending terms acceptances`);
        }

      } catch (error) {
        console.error('Error retrying terms acceptances:', error);
      }
    };

    // Retry on component mount and periodically
    retryPendingAcceptances();
    const interval = setInterval(retryPendingAcceptances, 60000); // Retry every minute

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default TermsAcceptanceTracker;