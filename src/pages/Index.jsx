import React, { useState } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Dashboard from '../components/Dashboard';
import AppLayout from '../components/AppLayout';
import Login from '../components/Login';

const DashboardContainer = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <AppLayout activeTab={activeTab} onTabChange={handleTabChange}>
      <Dashboard activeTab={activeTab} onTabChange={handleTabChange} />
    </AppLayout>
  );
};

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen gradient-secondary flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading Assets Pro...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardContainer /> : <Login />;
};

const Index = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
