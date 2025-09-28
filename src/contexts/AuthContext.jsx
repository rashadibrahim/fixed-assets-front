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
  }, []);

  const initializeAuth = async () => {
    try {
      setConnectionError(false);
      const token = localStorage.getItem('authToken');
      if (token) {
        apiClient.setToken(token);
        // Try to get user profile to validate token
        try {
          const userProfile = await apiClient.getUserProfile();
          setUser(userProfile);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token validation failed:', error);
          // Check if it's a connection error
          if (error.message.includes('Cannot connect to server')) {
            setConnectionError(true);
            // Keep the token, user might be able to work offline or backend might come back
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
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
        localStorage.setItem('authToken', response.access_token);
        apiClient.setToken(response.access_token);
        
        // Get user profile
        const userData = await apiClient.getUserProfile();
        setUser(userData);
        setIsAuthenticated(true);
        setConnectionError(false);
        
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
      apiClient.setToken(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    connectionError,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};