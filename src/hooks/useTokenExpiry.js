import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Hook to handle token expiry warnings and automatic validation
 * Can be used in components that need to be aware of token status
 */
export const useTokenExpiry = () => {
  const { getTokenRemainingTime, validateTokenExpiry, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenStatus = () => {
      const remainingTime = getTokenRemainingTime();
      const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

      if (remainingTime <= 0) {
        // Token has expired
        toast.error('Your session has expired. Please log in again.');
        validateTokenExpiry();
      } else if (remainingTime <= fiveMinutes) {
        // Warn user when 5 minutes left
        const minutes = Math.ceil(remainingTime / (60 * 1000));
        toast.warning(`Your session will expire in ${minutes} minute${minutes > 1 ? 's' : ''}. Please save your work.`);
      } else if (remainingTime <= fifteenMinutes) {
        // Warn user when 15 minutes left
        const minutes = Math.ceil(remainingTime / (60 * 1000));
        toast.info(`Your session will expire in ${minutes} minutes.`);
      }
    };

    // Check immediately
    checkTokenStatus();

    // Set up interval to check every minute
    const interval = setInterval(checkTokenStatus, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, getTokenRemainingTime, validateTokenExpiry]);

  return {
    getRemainingTime: getTokenRemainingTime,
    validateToken: validateTokenExpiry,
  };
};

/**
 * Hook for components that make API calls to validate token before requests
 */
export const useApiWithTokenValidation = () => {
  const { checkTokenValidity, validateTokenExpiry } = useAuth();

  const makeApiCall = async (apiCall) => {
    // Check token validity before making API call
    if (!checkTokenValidity()) {
      console.log('Token appears expired, validating...');
      await validateTokenExpiry();
    }

    // Proceed with API call
    return await apiCall();
  };

  return { makeApiCall };
};