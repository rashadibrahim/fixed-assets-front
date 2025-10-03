import React, { useState, useEffect } from 'react';
import {
  ArrowDownCircle,
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
  Plus,
  Edit3,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import AddTransaction from './AddTransaction';
import ViewTransaction from './ViewTransaction';
import apiClient from '../utils/api';
import { useErrorHandler } from '../hooks/useErrorHandler';

const TransactionsOut = () => {
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
    transaction_type: 'OUT' // Fixed to OUT transactions only
  });

  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showViewTransaction, setShowViewTransaction] = useState(false);
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(false);

  // Permission checks
  const isAdmin = () => user?.role?.toLowerCase() === 'admin';
  const canReadAssets = () => isAdmin() || user?.can_read_asset;
  const canEditTransactions = () => isAdmin() || user?.can_write_asset;
  const canDeleteTransactions = () => isAdmin() || user?.can_delete_asset;

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

      // Build query parameters - only include non-empty values and force transaction_type to 'OUT'
      const params = new URLSearchParams();
      Object.entries({...filters, transaction_type: 'OUT'}).forEach(([key, value]) => {
        if (value && value !== '' && value !== 0) {
          params.append(key, value.toString());
        }
      });

      const data = await apiClient.getTransactions(Object.fromEntries(params));

      if (data) {
        const items = data.items || [];
        // Additional filtering on frontend to ensure only OUT transactions
        const outTransactions = items.filter(transaction => transaction.transaction_type === false);
        setTransactions(outTransactions);
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
      handleError(error, 'Failed to load outgoing transactions');
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
      transaction_type: 'OUT' // Keep OUT filter
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
    handleSuccess('Outgoing transaction added successfully!');
    loadTransactions(); // Refresh the transactions list
  };

  const handleViewTransaction = (transactionId) => {
    setSelectedTransactionId(transactionId);
    setShowViewTransaction(true);
  };

  const handleEditTransaction = (transactionId) => {
    setSelectedTransactionId(transactionId);
    setShowEditTransaction(true);
  };

  const handleDeleteTransaction = (transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      setDeletingTransaction(true);
      await apiClient.deleteTransaction(transactionToDelete.id);
      handleSuccess('Transaction deleted successfully!');
      loadTransactions(); // Refresh the transactions list
      setShowDeleteDialog(false);
      setTransactionToDelete(null);
    } catch (error) {
      handleError(error, 'Failed to delete transaction');
    } finally {
      setDeletingTransaction(false);
    }
  };

  const handleTransactionUpdated = () => {
    handleSuccess('Transaction updated successfully!');
    setShowEditTransaction(false);
    loadTransactions(); // Refresh the transactions list
  };

  const handleDownloadFile = async (transactionId, fileName) => {
    try {
      const blob = await apiClient.downloadTransactionFile(transactionId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `transaction_${transactionId}_file`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      handleSuccess('File downloaded successfully');
    } catch (error) {
      handleError(error, 'Failed to download file');
    }
  };

  // Helper function to get branch name by ID
  const getBranchName = (branchId) => {
    if (!branchId) return 'N/A';
    const branch = branches.find(b => b.id === branchId);
    return branch?.name_en || branch?.name_ar || 'N/A';
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
          <h1 className="text-xl font-semibold text-gray-900">Outgoing Transactions</h1>
          <p className="text-sm text-gray-600">Track all outgoing asset transactions</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAddTransaction(true)}
            className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add OUT Transaction
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
            <h3 className="text-sm font-medium text-gray-900">Filter Outgoing Transactions</h3>
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
            <p className="text-sm text-gray-600">Loading outgoing transactions...</p>
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
            <ArrowDownCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No outgoing transactions found</h3>
            <button
              onClick={() => setShowAddTransaction(true)}
              className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add First OUT Transaction
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
                      className={`hover:bg-red-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                        }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500">
                              <ArrowDownCircle className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <div className="ml-2">
                            <div className="text-xs font-medium text-gray-900">
                              {transaction.custom_id}
                            </div>
                            <div className="flex items-center space-x-1 text-xs">
                              <div className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                OUT
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
                              {getBranchName(transaction.warehouse?.branch_id)}
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
                        {transaction.attached_file ? (
                          <div className="flex items-center text-xs">
                            <FileText className="w-3 h-3 text-red-500 mr-1" />
                            <button
                              onClick={() => handleDownloadFile(transaction.id, transaction.attached_file)}
                              className="text-red-600 hover:text-red-800 truncate max-w-20 underline cursor-pointer"
                            >
                              View File
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">No file</div>
                        )}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleViewTransaction(transaction.id)}
                            className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            title="View Transaction"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </button>
                          
                          {canEditTransactions() && (
                            <button
                              onClick={() => handleEditTransaction(transaction.id)}
                              className="inline-flex items-center px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                              title="Edit Transaction"
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              Edit
                            </button>
                          )}
                          
                          {canDeleteTransactions() && (
                            <button
                              onClick={() => handleDeleteTransaction(transaction)}
                              className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </button>
                          )}
                        </div>
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
                  {pagination.total} outgoing transactions
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
      <AddTransaction
        isOpen={showAddTransaction}
        onClose={() => setShowAddTransaction(false)}
        onTransactionAdded={handleTransactionAdded}
        defaultTransactionType="OUT"
      />

      {/* View Transaction Modal */}
      {showViewTransaction && selectedTransactionId && (
        <ViewTransaction
          isOpen={showViewTransaction}
          transactionId={selectedTransactionId}
          onClose={() => setShowViewTransaction(false)}
        />
      )}

      {/* Edit Transaction Modal */}
      {showEditTransaction && selectedTransactionId && (
        <AddTransaction
          isOpen={showEditTransaction}
          onClose={() => setShowEditTransaction(false)}
          onTransactionAdded={handleTransactionUpdated}
          editTransactionId={selectedTransactionId}
          defaultTransactionType="OUT"
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && transactionToDelete && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Transaction</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this transaction? This action cannot be undone.
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Transaction: {transactionToDelete.custom_id}
                </div>
                <div className="text-sm text-gray-600">
                  Date: {formatDate(transactionToDelete.date)}
                </div>
                <div className="text-sm text-gray-600">
                  Description: {transactionToDelete.description || 'No description'}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setTransactionToDelete(null);
                }}
                disabled={deletingTransaction}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTransaction}
                disabled={deletingTransaction}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {deletingTransaction ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Transaction
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsOut;