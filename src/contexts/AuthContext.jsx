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

  const login = async (credentials) => {
    try {
      setLoading(true);
      setConnectionError(false);
      const response = await apiClient.login(credentials);

      if (response.access_token && response.user) {
        localStorage.setItem('authToken', response.access_token);
        apiClient.setToken(response.access_token);

        // Use the user object from login response which includes all permissions
        setUser(response.user);

        // Optionally try to get additional user profile data
        try {
          const userProfile = await apiClient.getUserProfile();
          // Merge profile data with login user data, prioritizing permissions from login
          setUser({
            ...userProfile,
            ...response.user, // This ensures permissions are not overwritten
          });
        } catch (error) {
          console.error('Failed to get user profile:', error);
          // Keep using the user data from login response
        }

        setIsAuthenticated(true);
        return response;
      } else {
        throw new Error('No access token or user data received');
      }
    } catch (error) {
      console.error('Login failed:', error);
      if (error.message.includes('Cannot connect to server')) {
        setConnectionError(true);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local state and token, even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('authToken');
      apiClient.setToken(null);
    }
  };

  // Demo login function for development
  const demoLogin = () => {
    const demoUser = {
      id: 1,
      full_name: 'Demo Admin',
      email: 'admin@demo.com',
      role: 'admin',
      can_read_branch: true,
      can_edit_branch: true,
      can_delete_branch: true,
      can_read_warehouse: true,
      can_edit_warehouse: true,
      can_delete_warehouse: true,
      can_read_asset: true,
      can_edit_asset: true,
      can_delete_asset: true,
      can_print_barcode: true
    };
    setUser(demoUser);
    setIsAuthenticated(true);
    localStorage.setItem('authToken', 'demo-token-123');
    apiClient.setToken('demo-token-123');
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    connectionError,
    login,
    logout,
    demoLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};