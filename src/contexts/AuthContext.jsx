import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    initializeAuth();
    
    // Set up token validation interval (every 1 hour = 3600000 ms)
    const tokenCheckInterval = setInterval(() => {
      validateTokenExpiry();
    }, 3600000); // 1 hour

    // Also check every 5 minutes for more responsive validation
    const frequentCheckInterval = setInterval(() => {
      validateTokenExpiry();
    }, 300000); // 5 minutes

    return () => {
      clearInterval(tokenCheckInterval);
      clearInterval(frequentCheckInterval);
    };
  }, []);

  const validateTokenExpiry = async () => {
    const token = localStorage.getItem('authToken');
    const tokenTimestamp = localStorage.getItem('authTokenTimestamp');
    
    if (!token || !tokenTimestamp) {
      return;
    }

    const tokenAge = Date.now() - parseInt(tokenTimestamp);
    const oneHour = 3600000; // 1 hour in milliseconds

    // If token is older than 1 hour, validate with backend
    if (tokenAge >= oneHour) {
      console.log('Token is older than 1 hour, validating with backend...');
      try {
        await apiClient.getUserProfile();
        // Token is still valid, update timestamp
        localStorage.setItem('authTokenTimestamp', Date.now().toString());
        console.log('Token validated and timestamp updated');
      } catch (error) {
        console.error('Token validation failed after 1 hour:', error);
        // Token is invalid, force logout
        await forceLogout();
      }
    }
  };

  const forceLogout = async () => {
    console.log('Forcing logout due to token expiry');
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authTokenTimestamp');
    apiClient.setToken(null);
    // Optionally show a notification to user
    if (window.location.pathname !== '/') {
      window.location.reload(); // Refresh to show login screen
    }
  };

  const initializeAuth = async () => {
    try {
      setConnectionError(false);
      const token = localStorage.getItem('authToken');
      const tokenTimestamp = localStorage.getItem('authTokenTimestamp');
      
      if (token) {
        // Check if token timestamp exists and if token is not expired
        if (tokenTimestamp) {
          const tokenAge = Date.now() - parseInt(tokenTimestamp);
          const oneHour = 3600000; // 1 hour in milliseconds
          
          if (tokenAge >= oneHour) {
            console.log('Token expired on app initialization, clearing...');
            localStorage.removeItem('authToken');
            localStorage.removeItem('authTokenTimestamp');
            setLoading(false);
            return;
          }
        } else {
          // Old token without timestamp, add timestamp
          localStorage.setItem('authTokenTimestamp', Date.now().toString());
        }

        apiClient.setToken(token);
        // Try to get user profile to validate token
        try {
          const userProfile = await apiClient.getUserProfile();
          setUser(userProfile);
          setIsAuthenticated(true);
          // Update timestamp on successful validation
          localStorage.setItem('authTokenTimestamp', Date.now().toString());
        } catch (error) {
          console.error('Token validation failed:', error);
          // Check if it's a connection error
          if (error.message.includes('Cannot connect to server')) {
            setConnectionError(true);
            // Keep the token, user might be able to work offline or backend might come back
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
            localStorage.removeItem('authTokenTimestamp');
            apiClient.setToken(null);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      if (error.message.includes('Cannot connect to server')) {
        setConnectionError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      setConnectionError(false);
      
      const response = await apiClient.login({ email, password });
      
      if (response.access_token) {
        const currentTime = Date.now().toString();
        localStorage.setItem('authToken', response.access_token);
        localStorage.setItem('authTokenTimestamp', currentTime);
        apiClient.setToken(response.access_token);
        
        // Get user profile
        const userData = await apiClient.getUserProfile();
        setUser(userData);
        setIsAuthenticated(true);
        setConnectionError(false);
        
        console.log('Login successful, token timestamp set:', new Date(parseInt(currentTime)).toLocaleString());
        return response;
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setConnectionError(true);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state and token, even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authTokenTimestamp');
      apiClient.setToken(null);
      console.log('Logout completed, all tokens cleared');
    }
  };

  const checkTokenValidity = () => {
    const token = localStorage.getItem('authToken');
    const tokenTimestamp = localStorage.getItem('authTokenTimestamp');
    
    if (!token || !tokenTimestamp) {
      return false;
    }

    const tokenAge = Date.now() - parseInt(tokenTimestamp);
    const oneHour = 3600000; // 1 hour in milliseconds
    
    return tokenAge < oneHour;
  };

  const getTokenRemainingTime = () => {
    const tokenTimestamp = localStorage.getItem('authTokenTimestamp');
    if (!tokenTimestamp) return 0;
    
    const tokenAge = Date.now() - parseInt(tokenTimestamp);
    const oneHour = 3600000; // 1 hour in milliseconds
    const remaining = oneHour - tokenAge;
    
    return Math.max(0, remaining);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    connectionError,
    login,
    logout,
    checkTokenValidity,
    getTokenRemainingTime,
    validateTokenExpiry,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};