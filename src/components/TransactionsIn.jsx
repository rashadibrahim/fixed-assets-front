import React, { useState, useEffect } from 'react';
import {
  ArrowUpCircle,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  Warehouse,
  FileText,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  LogOut,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import AddTransaction from './AddTransaction';
import ViewTransaction from './ViewTransaction';
import apiClient from '../utils/api';
import { useErrorHandler } from '../hooks/useErrorHandler';

const TransactionsIn = () => {
  const { user, logout } = useAuth();
  const { handleError, handleSuccess } = useErrorHandler();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    per_page: 25
  });

  // Filter states
  const [filters, setFilters] = useState({
    page: 1,
    per_page: 25,
    branch_id: '',
    warehouse_id: '',
    date_from: '',
    date_to: '',
    search: '',
    transaction_type: 'IN' // Fixed to IN transactions only
  });

  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showViewTransaction, setShowViewTransaction] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);

  // Permission checks
  const isAdmin = () => user?.role?.toLowerCase() === 'admin';
  const canReadAssets = () => isAdmin() || user?.can_read_asset;

  // Check and validate token
  const getValidToken = () => {
    let token = localStorage.getItem('authToken');
    if (!token) {
      console.error('No token found in localStorage');
      return null;
    }
    return token;
  };

  useEffect(() => {
    if (canReadAssets()) {
      const token = getValidToken();
      if (token) {
        loadTransactions();
        loadBranches();
        loadWarehouses();
      } else {
        console.log('No token found, skipping API calls');
      }
    }
  }, [filters.page, filters.per_page]);

  useEffect(() => {
    // Reset to page 1 when filters change (except pagination)
    if (filters.page !== 1) {
      setFilters(prev => ({ ...prev, page: 1 }));
    } else {
      if (canReadAssets()) {
        const token = getValidToken();
        if (token) {
          loadTransactions();
        } else {
          console.log('No token found, skipping transaction load');
        }
      }
    }
  }, [filters.branch_id, filters.warehouse_id, filters.date_from, filters.date_to, filters.search]);

  const handleAuthError = (response, errorData) => {
    if (response.status === 401) {
      console.error('401 Unauthorized - clearing tokens');
      localStorage.removeItem('authToken');
      setAuthError(true);
      toast.error('Session expired. Please log in again.');
      return true;
    }
    if (response.status === 422 && errorData.msg && errorData.msg.includes('segments')) {
      console.error('JWT Token format error - clearing tokens');
      localStorage.removeItem('authToken');
      setAuthError(true);
      toast.error('Token format invalid. Please log in again.');
      return true;
    }
    return false;
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      setAuthError(false);

      const token = getValidToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Build query parameters - only include non-empty values and force transaction_type to 'IN'
      const params = new URLSearchParams();
      Object.entries({...filters, transaction_type: 'IN'}).forEach(([key, value]) => {
        if (value && value !== '' && value !== 0) {
          params.append(key, value.toString());
        }
      });

      const data = await apiClient.getTransactions(Object.fromEntries(params));

      if (data) {
        const items = data.items || [];
        // Additional filtering on frontend to ensure only IN transactions
        const inTransactions = items.filter(transaction => transaction.transaction_type === true);
        setTransactions(inTransactions);
        setPagination({
          total: data.total || 0,
          page: data.page || 1,
          pages: data.pages || 1,
          per_page: data.per_page || 25
        });
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError(error.message || 'Failed to load transactions');
      handleError(error, 'Failed to load incoming transactions');
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const data = await apiClient.getBranches({ per_page: 100 });
      setBranches(data.items || data || []);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const loadWarehouses = async () => {
    try {
      const data = await apiClient.getWarehouses({ per_page: 100 });
      setWarehouses(data.items || data || []);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      per_page: 25,
      branch_id: '',
      warehouse_id: '',
      date_from: '',
      date_to: '',
      search: '',
      transaction_type: 'IN' // Keep IN filter
    });
  };

  const handleSearch = () => {
    // Trigger search by resetting to page 1
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = () => {
    logout();
  };

  const handleTransactionAdded = () => {
    handleSuccess('Incoming transaction added successfully!');
    loadTransactions(); // Refresh the transactions list
  };

  const handleViewTransaction = (transactionId) => {
    setSelectedTransactionId(transactionId);
    setShowViewTransaction(true);
  };

  // Check permissions
  if (!canReadAssets()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to view transactions.</p>
        </div>
      </div>
    );
  }

  // Show authentication error
  if (authError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
          <p className="text-gray-600 mb-4">
            Your session has expired or your authentication token is invalid. Please log in again to continue.
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mx-auto"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Login Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Incoming Transactions</h1>
          <p className="text-sm text-gray-600">Track all incoming asset transactions</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddTransaction(true)}
            className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add IN Transaction
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-3 py-1.5 rounded-md border transition-colors text-sm ${showFilters
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Filter className="w-3 h-3 mr-1" />
            Filters
          </button>
          <button
            onClick={loadTransactions}
            disabled={loading}
            className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-2">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Filters Panel */}
      {showFilters && (
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Filter Incoming Transactions</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            {/* Search */}
            <div>
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Branch Filter */}
            <div>
              <select
                value={filters.branch_id}
                onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name_en || branch.name_ar || `Branch ${branch.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Warehouse Filter */}
            <div>
              <select
                value={filters.warehouse_id}
                onChange={(e) => handleFilterChange('warehouse_id', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name_en || warehouse.name_ar || `Warehouse ${warehouse.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Date To */}
            <div>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={clearFilters}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-xs"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Compact Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading incoming transactions...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">Failed to Load Transactions</h3>
            <button
              onClick={loadTransactions}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Try Again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center">
            <ArrowUpCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No incoming transactions found</h3>
            <button
              onClick={() => setShowAddTransaction(true)}
              className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add First IN Transaction
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction, index) => (
                    <tr
                      key={transaction.id}
                      className={`hover:bg-green-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500">
                              <ArrowUpCircle className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-xs font-medium text-gray-900">
                              {transaction.custom_id}
                            </div>
                            <div className="flex items-center space-x-1 text-xs">
                              <div className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                IN
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-start">
                          <Calendar className="w-3 h-3 text-blue-500 mt-0.5 mr-1.5 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-medium text-gray-900">
                              {formatDate(transaction.date)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(transaction.date)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-xs">
                            <Building2 className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-gray-900">
                              {transaction.branch?.name_en || transaction.branch?.name_ar || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center text-xs">
                            <Warehouse className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-gray-500">
                              {transaction.warehouse?.name_en || transaction.warehouse?.name_ar || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-gray-900">
                            {transaction.description || 'No description'}
                          </div>
                          {transaction.notes && (
                            <div className="text-xs text-gray-500 truncate max-w-48">
                              {transaction.notes}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-xs">
                          <div className="font-medium text-gray-900">
                            {transaction.reference_number || 'N/A'}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        {transaction.file_path ? (
                          <div className="flex items-center text-xs">
                            <FileText className="w-3 h-3 text-green-500 mr-1" />
                            <a
                              href={transaction.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 truncate max-w-20"
                            >
                              View File
                            </a>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">No file</div>
                        )}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          onClick={() => handleViewTransaction(transaction.id)}
                          className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Showing {((pagination.page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} incoming transactions
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-xs text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddTransaction && (
        <AddTransaction
          onClose={() => setShowAddTransaction(false)}
          onTransactionAdded={handleTransactionAdded}
          defaultTransactionType="IN"
        />
      )}

      {/* View Transaction Modal */}
      {showViewTransaction && selectedTransactionId && (
        <ViewTransaction
          transactionId={selectedTransactionId}
          onClose={() => setShowViewTransaction(false)}
        />
      )}
    </div>
  );
};

export default TransactionsIn;