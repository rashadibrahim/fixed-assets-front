import { useCallback } from 'react';
import { toast } from 'sonner';

export const useErrorHandler = () => {
  const handleError = useCallback((error, defaultMessage = 'An error occurred') => {
    console.error('Error occurred:', error);

    let message = defaultMessage;
    
    if (error?.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Handle specific error types
    if (error?.status === 401) {
      message = 'Session expired. Please log in again.';
      localStorage.removeItem('authToken');
      // You might want to redirect to login here
      window.location.reload();
    } else if (error?.status === 403) {
      message = 'You don\'t have permission to do this action.';
    } else if (error?.status === 404) {
      message = 'The requested resource was not found.';
    } else if (error?.status === 422) {
      // Validation errors are already parsed in API client
      message = error.message;
    } else if (error?.status >= 500) {
      message = 'Internal server error. Please try again later.';
    } else if (error?.isNetworkError) {
      message = 'Network error: Please check your internet connection';
    }

    toast.error(message);
    return message;
  }, []);

  const handleSuccess = useCallback((message) => {
    toast.success(message);
  }, []);

  return { handleError, handleSuccess };
};