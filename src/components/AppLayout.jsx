import React, { useState, useEffect } from 'react';
import {
  Building2,
  Warehouse,
  Package,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  User,
  LogOut,
  Menu,
  X,
  Shield,
  FolderOpen,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const AppLayout = ({ children, activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size and handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileScreen = window.innerWidth < 768;
      const wasIsMobile = isMobile;
      setIsMobile(isMobileScreen);
      
      // Auto-collapse sidebar on mobile, but restore on desktop if it was open before
      if (isMobileScreen && !wasIsMobile) {
        // Moving from desktop to mobile - close sidebar
        setSidebarOpen(false);
      } else if (!isMobileScreen && wasIsMobile && localStorage.getItem('sidebarOpen') !== 'false') {
        // Moving from mobile to desktop - restore sidebar if it wasn't explicitly closed
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isMobile]);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  // Load sidebar state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState !== null && window.innerWidth >= 768) {
      setSidebarOpen(savedState === 'true');
    }
  }, []);

  // Permission helper functions
  const isAdmin = () => user?.role?.toLowerCase() === 'admin';
  const canReadAssets = () => isAdmin() || user?.can_read_asset;
  const canReadWarehouses = () => isAdmin() || user?.can_read_warehouse;
  const canReadBranches = () => isAdmin() || user?.can_read_branch;
  const canMakeReports = () => isAdmin() || user?.can_make_report;
  const canAccessSettings = () => isAdmin() || user?.can_print_barcode;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    // Only show assets if user can read assets
    ...(canReadAssets() ? [{ id: 'assets', label: 'Fixed Assets', icon: Package }] : []),
    // Show separated transaction screens for users who can read assets
    ...(canReadAssets() ? [
      { id: 'transactions-in', label: 'Transactions IN', icon: ArrowUpCircle },
      { id: 'transactions-out', label: 'Transactions OUT', icon: ArrowDownCircle },
    ] : []),
    // Only show reports if user can make reports
    ...(canMakeReports() ? [{ id: 'reports', label: 'Reports', icon: FileText }] : []),
    // Only show warehouses if user can read warehouses
    ...(canReadWarehouses() ? [{ id: 'warehouses', label: 'Warehouses', icon: Warehouse }] : []),
    // Only show branches if user can read branches
    ...(canReadBranches() ? [{ id: 'branches', label: 'Branches', icon: Building2 }] : []),
    // Only show categories, users, and job roles for admin users
    ...(isAdmin() ? [
      { id: 'categories', label: 'Categories', icon: FolderOpen },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'jobroles', label: 'Job Roles', icon: Shield },
    ] : []),
    // Show settings for admin users or users with barcode permissions
    ...(canAccessSettings() ? [{ id: 'settings', label: 'Settings', icon: SettingsIcon }] : []),
  ];

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Toggle sidebar with Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        handleSidebarToggle();
      }
      // Close sidebar on Escape when on mobile and sidebar is open
      if (event.key === 'Escape' && isMobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, sidebarOpen]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${sidebarOpen ? 'w-64' : 'w-16'} 
          ${isMobile ? 'fixed left-0 top-0 h-full' : 'relative'}
          ${isMobile && sidebarOpen ? 'z-50' : 'z-30'}
          transition-all duration-300 ease-in-out
          bg-card border-r border-border flex flex-col
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          ${!isMobile ? 'transform-none' : ''}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h2 className="text-lg font-bold text-foreground">Assets Pro</h2>
                <p className="text-xs text-muted-foreground">Management System</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSidebarToggle}
              className="hover:bg-accent"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full transition-all duration-200 ${sidebarOpen
                  ? 'justify-start'
                  : 'justify-center px-0'
                  } ${activeTab === item.id
                    ? 'gradient-primary text-primary-foreground shadow-primary'
                    : 'hover:bg-accent'
                  } ${item.comingSoon ? 'opacity-75' : ''}`}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className={`h-4 w-4 ${sidebarOpen ? '' : 'mx-auto'}`} />
                {sidebarOpen && (
                  <div className="flex items-center justify-between w-full ml-3">
                    <span>{item.label}</span>
                    {item.comingSoon && (
                      <Badge variant="secondary" className="text-xs">Soon</Badge>
                    )}
                  </div>
                )}
                {!sidebarOpen && item.comingSoon && (
                  <div className="absolute -top-1 -right-1">
                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  </div>
                )}
              </Button>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-border">
          <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
            <div className={`p-2 bg-primary/10 rounded-lg ${!sidebarOpen ? 'mx-auto' : ''}`}>
              <User className="h-4 w-4 text-primary" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.full_name || user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              title="Logout"
              className={`hover:bg-destructive/10 hover:text-destructive ${!sidebarOpen ? 'w-8 h-8 p-0' : ''}`}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        {isMobile && !sidebarOpen && (
          <div className="lg:hidden bg-card border-b border-border p-4 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSidebarToggle}
                className="hover:bg-accent"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">Assets Pro</h1>
              <div className="w-8" /> {/* Spacer for centering */}
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
