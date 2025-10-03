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
  LogOut,
  Menu,
  X,
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

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

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
      toast.error('Failed to load transaction summary');
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

      // Load statistics from the auth/stats endpoint
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
      toast.error('Failed to load dashboard statistics');

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
      toast.success('Dashboard data refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast.error('Failed to refresh dashboard data');
    } finally {
      setLoading(false);
    }
  };

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
    ...(canMakeReports() ? [{ id: 'reports', label: 'Reports', icon: FileText, comingSoon: true }] : []),
    // Only show warehouses if user can read warehouses
    ...(canReadWarehouses() ? [{ id: 'warehouses', label: 'Warehouses', icon: Warehouse }] : []),
    // Only show branches if user can read branches
    ...(canReadBranches() ? [{ id: 'branches', label: 'Branches', icon: Building2 }] : []),
    // Only show categories, users, and job roles for admin users
    ...(isAdmin() ? [
      { id: 'categories', label: 'Categories', icon: FolderOpen },
      { id: 'users', label: 'Users', icon: Users },
      { id: 'jobroles', label: 'Job Roles', icon: Shield },
      { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ] : []),
  ];

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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          {canEditAssets() && (
            <Button className="btn-primary" onClick={() => setActiveTab('assets')}>
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
                  <Button className="w-full btn-primary" onClick={() => setActiveTab('assets')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Asset
                  </Button>
                )}
                {canEditWarehouses() && (
                  <Button className="w-full btn-secondary" onClick={() => setActiveTab('warehouses')}>
                    <Warehouse className="h-4 w-4 mr-2" />
                    Manage Warehouses
                  </Button>
                )}
                {canEditBranches() && (
                  <Button className="w-full btn-secondary" onClick={() => setActiveTab('branches')}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Manage Branches
                  </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => setActiveTab('transactions')}>
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  View Transactions
                </Button>
                <Button variant="outline" className="w-full">
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
                    {user?.can_edit_asset && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Edit3 className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Edit Assets</span>
                      </div>
                    )}
                    {user?.can_edit_warehouse && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Edit3 className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Edit Warehouses</span>
                      </div>
                    )}
                    {user?.can_edit_branch && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Edit3 className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Edit Branches</span>
                      </div>
                    )}
                    {user?.can_print_barcode && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Download className="h-4 w-4 mr-2 text-purple-500" />
                        <span>Print Barcodes</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('reports')}>
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
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'transactions-in':
        return <ErrorBoundary><TransactionsIn /></ErrorBoundary>;
      case 'transactions-out':
        return <ErrorBoundary><TransactionsOut /></ErrorBoundary>;
      case 'assets':
        return <ErrorBoundary><AssetManagement /></ErrorBoundary>;
      case 'reports':
        return <ErrorBoundary><Reports /></ErrorBoundary>;
      case 'warehouses':
        return <ErrorBoundary><WarehouseManagement /></ErrorBoundary>;
      case 'branches':
        return <ErrorBoundary><BranchManagement /></ErrorBoundary>;
      case 'categories':
        return <ErrorBoundary><CategoryManagement /></ErrorBoundary>;
      case 'users':
        return <ErrorBoundary><UserManagement /></ErrorBoundary>;
      case 'jobroles':
        return <ErrorBoundary><JobRoleManagement /></ErrorBoundary>;
      case 'settings':
        return <ErrorBoundary><Settings /></ErrorBoundary>;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-smooth bg-card border-r border-border flex flex-col`}>
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
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full transition-smooth ${sidebarOpen
                  ? 'justify-start'
                  : 'justify-center px-0'
                  } ${activeTab === item.id
                    ? 'gradient-primary text-primary-foreground shadow-primary'
                    : ''
                  } ${item.comingSoon ? 'opacity-75' : ''}`}
                onClick={() => setActiveTab(item.id)}
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

        <div className="p-4 border-t border-border">
          <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
            <div className={`p-2 bg-primary/10 rounded-lg ${!sidebarOpen ? 'mx-auto' : ''}`}>
              <User className="h-4 w-4 text-primary" />
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{user?.full_name || user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              title="Logout"
              className={!sidebarOpen ? 'absolute bottom-4 right-2' : ''}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;