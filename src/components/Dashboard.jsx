import React, { useState, useEffect } from 'react';
import {
  Building2,
  Warehouse,
  Package,
  Users,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Filter,
  Download,
  Upload,
  BarChart3,
  Settings as SettingsIcon,
  User,
  ChevronRight,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Shield,
  FolderOpen,
  ArrowUpCircle,
  ArrowDownCircle,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/api';
import { toast } from 'sonner';
import { useErrorHandler } from '../hooks/useErrorHandler';
import AssetManagement from './AssetManagement';
import AssetTransactions from './AssetTransactions';
import Reports from './Reports';
import WarehouseManagement from './WarehouseManagement';
import BranchManagement from './BranchManagement';
import UserManagement from './UserManagement';
import JobRoleManagement from './JobRoleManagement';
import CategoryManagement from './CategoryManagement';
import ErrorBoundary from './ErrorBoundary';
import TransactionsIn from './TransactionsIn';
import TransactionsOut from './TransactionsOut';
import Settings from './Settings';

const Dashboard = ({ activeTab = 'dashboard', onTabChange }) => {
  const { user } = useAuth();
  const { handleError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(true);
  
  // State for managing different views within each tab (list, add, edit, etc.)
  const [currentView, setCurrentView] = useState('list');
  const [selectedItem, setSelectedItem] = useState(null);

  // Reset view when tab changes
  useEffect(() => {
    setCurrentView('list');
    setSelectedItem(null);
  }, [activeTab]);

  // Handle view changes (list, add, edit, etc.)
  const handleViewChange = (view, item = null) => {
    setCurrentView(view);
    setSelectedItem(item);
  };

  // Permission helper functions
  const isAdmin = () => user?.role?.toLowerCase() === 'admin';
  const canReadAssets = () => isAdmin() || user?.can_read_asset;
  const canReadWarehouses = () => isAdmin() || user?.can_read_warehouse;
  const canReadBranches = () => isAdmin() || user?.can_read_branch;
  const canEditAssets = () => isAdmin() || user?.can_edit_asset;
  const canEditWarehouses = () => isAdmin() || user?.can_edit_warehouse;
  const canEditBranches = () => isAdmin() || user?.can_edit_branch;
  const canMakeReports = () => isAdmin() || user?.can_make_report;
  const canMakeTransactions = () => isAdmin() || user?.can_make_transaction;
  const canPrintBarcode = () => isAdmin() || user?.can_print_barcode;
  const canAccessSettings = () => isAdmin() || user?.can_print_barcode;

  // Dashboard stats from API
  const [dashboardStats, setDashboardStats] = useState({
    totalAssets: 0,
    activeAssets: 0,
    warehouses: 0,
    branches: 0,
    users: 0,
    totalJobs: 0
  });

  // Transaction summary data
  const [transactionSummary, setTransactionSummary] = useState({
    total_transactions: 0,
    total_in_transactions: 0,
    total_out_transactions: 0,
    total_in_value: 0,
    total_out_value: 0,
    net_value: 0
  });

  useEffect(() => {
    loadDashboardStats();
    loadTransactionSummary();
  }, []);

  const loadTransactionSummary = async () => {
    try {
      // Only load transaction summary if user can read assets (since transactions are asset-related)
      if (canReadAssets()) {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('No token found for transaction summary');
          return;
        }

        const response = await fetch(`${apiClient.baseURL}/transactions/summary`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setTransactionSummary(data || {
          total_transactions: 0,
          total_in_transactions: 0,
          total_out_transactions: 0,
          total_in_value: 0,
          total_out_value: 0,
          net_value: 0
        });

        console.log('Transaction summary loaded:', data);
      }
    } catch (error) {
      console.error('Error loading transaction summary:', error);
      // Silently handle the error - don't show error toast to user
      // Set default values on error
      setTransactionSummary({
        total_transactions: 0,
        total_in_transactions: 0,
        total_out_transactions: 0,
        total_in_value: 0,
        total_out_value: 0,
        net_value: 0
      });
    }
  };

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No token found for dashboard stats');
        setLoading(false);
        return;
      }

      // Only attempt to load stats if user has some permissions
      if (!canReadAssets() && !canReadWarehouses() && !canReadBranches() && !isAdmin()) {
        console.log('User has no permissions to view statistics');
        setDashboardStats({
          totalAssets: 0,
          totalJobs: 0,
          activeAssets: 0,
          warehouses: 0,
          branches: 0,
          users: 0
        });
        setLoading(false);
        return;
      }

      // Try to load statistics from the auth/stats endpoint
      const response = await fetch(`${apiClient.baseURL}/auth/stats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('Dashboard stats loaded:', data);

      // Map the API response to our dashboard stats structure
      setDashboardStats({
        totalAssets: canReadAssets() ? (data.total_assets || 0) : 0,
        activeAssets: canReadAssets() ? (data.active_assets || 0) : 0,
        warehouses: canReadWarehouses() ? (data.total_warehouses || 0) : 0,
        branches: canReadBranches() ? (data.total_branches || 0) : 0,
        users: isAdmin() ? (data.total_users || 0) : 0,
        totalJobs: isAdmin() ? (data.job_roles_count || 0) : 0
      });

    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      handleError(error, 'Failed to load dashboard statistics');

      // Fallback to empty state on error
      setDashboardStats({
        totalAssets: 0,
        totalJobs: 0,
        activeAssets: 0,
        warehouses: 0,
        branches: 0,
        users: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDashboardStats(),
        loadTransactionSummary()
      ]);
      // Only show success toast if user has some permissions to view data
      if (canReadAssets() || canReadWarehouses() || canReadBranches() || isAdmin()) {
        handleSuccess('Dashboard data refreshed successfully!');
      }
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      // Only show error toast if user should have access to data
      if (canReadAssets() || canReadWarehouses() || canReadBranches() || isAdmin()) {
        handleError(error, 'Failed to refresh some dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };



  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <Card className="glass-card hover:shadow-primary transition-smooth">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        {trend && (
          <div className="flex items-center mt-4 text-sm">
            <TrendingUp className="h-4 w-4 text-success mr-1" />
            <span className="text-success font-medium">{trend}</span>
            <span className="text-muted-foreground ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.full_name || user?.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Only show refresh button if user has access to some stats */}
          {(canReadAssets() || canReadWarehouses() || canReadBranches() || isAdmin()) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center"
            >
              <ArrowUpCircle className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
          {canMakeReports() && (
            <Button variant="outline" size="sm" onClick={() => onTabChange('reports')}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          )}
          {canEditAssets() && (
            <Button className="btn-primary" onClick={() => onTabChange('assets')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Check if user has any permissions to show stats */}
          {!canReadAssets() && !canReadWarehouses() && !canReadBranches() && !isAdmin() ? (
            // Welcome message for users with no stat permissions
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <div className="p-4 bg-primary/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Welcome to Assets Pro
                </h2>
                <p className="text-muted-foreground mb-4">
                  Your account is set up and ready to use. Use the menu to navigate to the features you have access to.
                </p>
                <div className="flex justify-center">
                  <Badge variant="secondary" className="text-sm">
                    {user?.role || 'User'} Account
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Show stats cards for users with permissions
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {canReadAssets() && (
                <StatCard
                  title="Total Assets"
                  value={dashboardStats.totalAssets.toLocaleString()}
                  icon={Package}
                  color="gradient-primary"
                  subtitle={`${dashboardStats.activeAssets} active`}
                />
              )}
              {isAdmin() && (
                <StatCard
                  title="Job Roles"
                  value={dashboardStats.totalJobs.toLocaleString()}
                  icon={User}
                  color="bg-blue-500"
                  subtitle="Defined roles"
                />
              )}
              {canReadWarehouses() && (
                <StatCard
                  title="Warehouses"
                  value={dashboardStats.warehouses}
                  icon={Warehouse}
                  color="bg-purple-500"
                  subtitle={canReadBranches() ? `${dashboardStats.branches} branches` : ""}
                />
              )}
              {isAdmin() && (
                <StatCard
                  title="Active Users"
                  value={dashboardStats.users}
                  icon={Users}
                  color="bg-orange-500"
                  subtitle="System users"
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Transaction Summary and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {canReadAssets() && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowUpCircle className="h-5 w-5 mr-2" />
                Transaction Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Total Transactions */}
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary transition-smooth">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <ArrowUpCircle className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">Total Transactions</p>
                        <p className="text-sm text-muted-foreground">All transaction records</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{transactionSummary.total_transactions.toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs">
                        Total Count
                      </Badge>
                    </div>
                  </div>

                  {/* In Transactions */}
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary transition-smooth">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">Incoming Transactions</p>
                        <p className="text-sm text-muted-foreground">Assets received</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-green-600">
                        {transactionSummary.total_in_transactions.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${transactionSummary.total_in_value.toLocaleString()} value
                      </p>
                    </div>
                  </div>

                  {/* Out Transactions */}
                  <div className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary transition-smooth">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <ArrowUpCircle className="h-5 w-5 text-red-500 rotate-180" />
                      </div>
                      <div>
                        <p className="font-medium">Outgoing Transactions</p>
                        <p className="text-sm text-muted-foreground">Assets transferred out</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-red-600">
                        {transactionSummary.total_out_transactions.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${transactionSummary.total_out_value.toLocaleString()} value
                      </p>
                    </div>
                  </div>

                  {/* Net Value */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Net Value</p>
                        <p className="text-sm text-muted-foreground">Total asset value balance</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${transactionSummary.net_value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${transactionSummary.net_value.toLocaleString()}
                      </p>
                      <Badge
                        variant={transactionSummary.net_value >= 0 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {transactionSummary.net_value >= 0 ? 'Positive' : 'Negative'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions for Admin or User Information for Normal Users */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>{isAdmin() ? 'Quick Actions' : 'User Information'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin() ? (
              // Quick Actions for Admin
              <>
                {canEditAssets() && (
                  <Button className="w-full btn-primary" onClick={() => onTabChange('assets')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Asset
                  </Button>
                )}
                {canEditWarehouses() && (
                  <Button className="w-full btn-secondary" onClick={() => onTabChange('warehouses')}>
                    <Warehouse className="h-4 w-4 mr-2" />
                    Manage Warehouses
                  </Button>
                )}
                {canEditBranches() && (
                  <Button className="w-full btn-secondary" onClick={() => onTabChange('branches')}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Manage Branches
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => onTabChange('transactions-in')}>
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  View Transactions
                </Button>
                <Button variant="outline" className="w-full" onClick={() => onTabChange('reports')}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </>
            ) : (
              // User Information for Normal Users
              <div className="space-y-4">
                <div className="text-center">
                  <div className="p-4 bg-primary/10 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {user?.full_name || user?.name || 'User'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="secondary" className="mt-2">
                    {user?.role || 'User'}
                  </Badge>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Your Permissions</h4>
                  <div className="space-y-2">
                    {canReadAssets() && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Package className="h-4 w-4 mr-2 text-green-500" />
                        <span>View Assets</span>
                      </div>
                    )}
                    {canReadWarehouses() && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Warehouse className="h-4 w-4 mr-2 text-green-500" />
                        <span>View Warehouses</span>
                      </div>
                    )}
                    {canReadBranches() && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4 mr-2 text-green-500" />
                        <span>View Branches</span>
                      </div>
                    )}
                    {canEditAssets() && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Edit3 className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Edit Assets</span>
                      </div>
                    )}
                    {canEditWarehouses() && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Edit3 className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Edit Warehouses</span>
                      </div>
                    )}
                    {canEditBranches() && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Edit3 className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Edit Branches</span>
                      </div>
                    )}
                    {canMakeTransactions() && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <ArrowUpCircle className="h-4 w-4 mr-2 text-orange-500" />
                        <span>Make Transactions</span>
                      </div>
                    )}
                    {canMakeReports() && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 mr-2 text-indigo-500" />
                        <span>Generate Reports</span>
                      </div>
                    )}
                    {canPrintBarcode() && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Download className="h-4 w-4 mr-2 text-purple-500" />
                        <span>Print Barcodes</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full" onClick={() => onTabChange('reports')}>
                    <FileText className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    const commonProps = {
      currentView,
      onViewChange: handleViewChange,
      selectedItem
    };

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'transactions-in':
        return <ErrorBoundary><TransactionsIn {...commonProps} /></ErrorBoundary>;
      case 'transactions-out':
        return <ErrorBoundary><TransactionsOut {...commonProps} /></ErrorBoundary>;
      case 'assets':
        return <ErrorBoundary><AssetManagement {...commonProps} /></ErrorBoundary>;
      case 'reports':
        return <ErrorBoundary><Reports {...commonProps} /></ErrorBoundary>;
      case 'warehouses':
        return <ErrorBoundary><WarehouseManagement {...commonProps} /></ErrorBoundary>;
      case 'branches':
        return <ErrorBoundary><BranchManagement {...commonProps} /></ErrorBoundary>;
      case 'categories':
        return <ErrorBoundary><CategoryManagement {...commonProps} /></ErrorBoundary>;
      case 'users':
        return <ErrorBoundary><UserManagement {...commonProps} /></ErrorBoundary>;
      case 'jobroles':
        return <ErrorBoundary><JobRoleManagement {...commonProps} /></ErrorBoundary>;
      case 'settings':
        return <ErrorBoundary><Settings {...commonProps} /></ErrorBoundary>;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="p-6 max-w-full overflow-x-hidden">
      {renderContent()}
    </div>
  );
};

export default Dashboard;