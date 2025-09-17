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
  Settings,
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
  FileText
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

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  // Dashboard stats from API
  const [dashboardStats, setDashboardStats] = useState({
    totalAssets: 0,
    totalValue: 0,
    activeAssets: 0,
    warehouses: 0,
    branches: 0,
    users: 0,
    recentAssets: []
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Load both statistics and assets data
      const [statsResponse, assetsResponse] = await Promise.all([
        apiClient.getStatistics().catch(err => {
          console.warn('Failed to load stats:', err);
          return {};
        }),
        apiClient.getAssets().catch(err => {
          console.warn('Failed to load assets:', err);
          return { items: [] };
        })
      ]);
      
      // Process assets data
      const assetsData = assetsResponse?.items || assetsResponse?.data || assetsResponse || [];
      const validAssets = Array.isArray(assetsData) ? assetsData : [];
      
      // Calculate asset statistics
      const totalAssets = validAssets.length;
      
      // Debug: Log all asset statuses to understand the data
      if (validAssets.length > 0) {
        console.log('All asset data found:', validAssets.map(asset => ({
          id: asset.id,
          name: asset.name_en || asset.name_ar || asset.name,
          is_active: asset.is_active,
          status: asset.status
        })));
      }
      
      const activeAssets = validAssets.filter(asset => {
        // Use is_active boolean field instead of status string
        const isActive = asset.is_active === true || asset.is_active === 1 || asset.is_active === "1";
        console.log(`Asset ${asset.id}: is_active=${asset.is_active} -> isActive=${isActive}`);
        return isActive;
      }).length;
      const totalValue = validAssets.reduce((sum, asset) => {
        const value = parseFloat(asset?.value || asset?.price || 0);
        const quantity = parseInt(asset?.quantity || 1);
        return sum + (isNaN(value) ? 0 : value * quantity);
      }, 0);
      
      // Get recent assets (last 5, sorted by creation date or ID)
      const recentAssets = validAssets
        .sort((a, b) => {
          // Sort by created_at if available, otherwise by ID
          const dateA = new Date(a?.created_at || a?.id || 0);
          const dateB = new Date(b?.created_at || b?.id || 0);
          return dateB - dateA;
        })
        .slice(0, 5);
      
      setDashboardStats({
        totalAssets: totalAssets,
        totalValue: totalValue,
        activeAssets: activeAssets,
        warehouses: statsResponse.total_warehouses || 0,
        branches: statsResponse.total_branches || 0,
        users: statsResponse.total_users || 0,
        recentAssets: recentAssets
      });
      
      console.log('Dashboard stats loaded:', {
        totalAssets,
        totalValue,
        activeAssets,
        recentAssetsCount: recentAssets.length,
        sampleAsset: validAssets[0] // Log first asset to see structure
      });
      
      // Debug: Log asset statuses to understand the data
      if (validAssets.length > 0) {
        console.log('Asset statuses found:', [...new Set(validAssets.map(a => a.status))]);
        console.log('Sample asset structure:', validAssets[0]);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast.error('Failed to load dashboard statistics');
      
      // Fallback to empty state on error
      setDashboardStats({
        totalAssets: 0,
        totalValue: 0,
        activeAssets: 0,
        warehouses: 0,
        branches: 0,
        users: 0,
        recentAssets: []
      });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'assets', label: 'Fixed Assets', icon: Package },
    { id: 'transactions', label: 'Transactions', icon: ArrowUpCircle, comingSoon: true },
    { id: 'reports', label: 'Reports', icon: FileText, comingSoon: true },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { id: 'branches', label: 'Branches', icon: Building2 },
    { id: 'categories', label: 'Categories', icon: FolderOpen },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'jobroles', label: 'Job Roles', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
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
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
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
          <StatCard 
            title="Total Assets" 
            value={dashboardStats.totalAssets.toLocaleString()} 
            icon={Package} 
            color="gradient-primary"
            subtitle={`${dashboardStats.activeAssets} active`}
          />
          <StatCard 
            title="Asset Value" 
            value={
              dashboardStats.totalValue > 1000000 
                ? `$${(dashboardStats.totalValue / 1000000).toFixed(1)}M`
                : dashboardStats.totalValue > 1000
                ? `$${(dashboardStats.totalValue / 1000).toFixed(1)}K`
                : `$${dashboardStats.totalValue.toLocaleString()}`
            } 
            icon={DollarSign} 
            color="gradient-success"
            subtitle="Total portfolio"
          />
          <StatCard 
            title="Warehouses" 
            value={dashboardStats.warehouses} 
            icon={Warehouse} 
            color="bg-purple-500"
            subtitle={`${dashboardStats.branches} branches`}
          />
          <StatCard 
            title="Active Users" 
            value={dashboardStats.users} 
            icon={Users} 
            color="bg-orange-500"
            subtitle="System users"
          />
        </div>
      )}

      {/* Recent Assets and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Recent Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : dashboardStats.recentAssets.length > 0 ? (
              <div className="space-y-4">
                {dashboardStats.recentAssets.map(asset => (
                  <div key={asset.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary transition-smooth">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{asset.name_en || asset.name_ar || asset.name || 'Unnamed Asset'}</p>
                        <p className="text-sm text-muted-foreground">
                          {asset.sub_category || asset.category || asset.asset_category || 'Uncategorized'} • 
                          {asset.product_code ? ` Code: ${asset.product_code}` : asset.serial_number ? ` SN: ${asset.serial_number}` : ' No code'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${(parseFloat(asset.value || asset.price || 0) || 0).toLocaleString()} / unit
                      </p>
                      <Badge variant="outline" className="text-xs">
                        Qty: {asset.quantity || 1}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent assets found</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full btn-primary" onClick={() => setActiveTab('assets')}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Asset
            </Button>
            <Button className="w-full btn-secondary" onClick={() => setActiveTab('warehouses')}>
              <Warehouse className="h-4 w-4 mr-2" />
              Manage Warehouses
            </Button>
            <Button className="w-full btn-secondary" onClick={() => setActiveTab('branches')}>
              <Building2 className="h-4 w-4 mr-2" />
              Manage Branches
            </Button>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'assets':
        return <ErrorBoundary><AssetManagement /></ErrorBoundary>;
      case 'transactions':
        return <ErrorBoundary><AssetTransactions /></ErrorBoundary>;
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
        return (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Settings</h3>
            <p className="text-muted-foreground">Settings page coming soon...</p>
          </div>
        );
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
                className={`w-full justify-start transition-smooth ${
                  activeTab === item.id ? 'gradient-primary text-primary-foreground shadow-primary' : ''
                } ${item.comingSoon ? 'opacity-75' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon className="h-4 w-4" />
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
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-4 w-4 text-primary" />
            </div>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Header content */}
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;