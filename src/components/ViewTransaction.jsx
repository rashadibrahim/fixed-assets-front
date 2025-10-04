// Create a new file: src/components/ViewTransaction.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Calendar,
  Warehouse,
  FileText,
  Package,
  User,
  Building2,
  Hash,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/api';

const ViewTransaction = ({ isOpen, onClose, transactionId }) => {
  const { user } = useAuth();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getValidToken = () => {
    return localStorage.getItem('authToken');
  };

  useEffect(() => {
    if (isOpen && transactionId) {
      loadTransaction();
    }
  }, [isOpen, transactionId]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiClient.getTransaction(transactionId);
      setTransaction(data);
      console.log('Transaction data loaded:', data);
    } catch (error) {
      console.error('Error loading transaction:', error);
      setError(error.message || 'Failed to load transaction');
      toast.error('Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatDateOnly = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const downloadAttachment = async () => {
    if (transaction?.attached_file && transaction?.id) {
      try {
        const blob = await apiClient.downloadTransactionFile(transaction.id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = transaction.attached_file;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('File downloaded successfully');
      } catch (error) {
        console.error('Error downloading file:', error);
        toast.error('Failed to download file');
      }
    }
  };

  const calculateTotalTransactionValue = () => {
    if (!transaction?.asset_transactions) return 0;
    return transaction.asset_transactions.reduce((total, item) => total + (item.total_value || 0), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white w-full h-full flex flex-col shadow-xl">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Transaction Details
                </h1>
                <p className="text-xs text-gray-600">
                  {transaction ? `${transaction.custom_id} - ${transaction.transaction_type ? 'INBOUND' : 'OUTBOUND'}` : 'Loading...'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="w-6 h-6 mx-auto text-gray-400 animate-spin mb-2" />
                  <p className="text-sm text-gray-600">Loading transaction details...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-400 text-3xl mb-2">⚠️</div>
                  <h3 className="text-base font-medium text-gray-900 mb-2">Error Loading Transaction</h3>
                  <p className="text-sm text-gray-600 mb-3">{error}</p>
                  <button
                    onClick={loadTransaction}
                    className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : transaction ? (
              <div className="space-y-4">
                {/* Transaction Overview */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${transaction.transaction_type
                          ? 'bg-green-500'
                          : 'bg-red-500'
                          }`}>
                          {transaction.transaction_type ? (
                            <ArrowUpCircle className="w-3 h-3 text-white" />
                          ) : (
                            <ArrowDownCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-gray-900">Transaction Information</h2>
                          <p className="text-xs text-gray-600">Detailed transaction overview</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${transaction.transaction_type
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {transaction.transaction_type ? 'INBOUND' : 'OUTBOUND'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                      {/* Transaction ID */}
                      <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                        <div className="flex items-center space-x-1 mb-1">
                          <Hash className="w-3 h-3 text-blue-500" />
                          <dt className="text-xs font-medium text-blue-600 uppercase tracking-wide">ID</dt>
                        </div>
                        <dd className="text-sm font-bold text-gray-900">{transaction.custom_id}</dd>
                        <dd className="text-xs text-gray-600">#{transaction.id}</dd>
                      </div>

                      {/* Date */}
                      <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                        <div className="flex items-center space-x-1 mb-1">
                          <Calendar className="w-3 h-3 text-green-500" />
                          <dt className="text-xs font-medium text-green-600 uppercase tracking-wide">Date</dt>
                        </div>
                        <dd className="text-sm font-bold text-gray-900">{formatDateOnly(transaction.date)}</dd>
                        <dd className="text-xs text-gray-600">Created: {formatDate(transaction.created_at)}</dd>
                      </div>

                      {/* User */}
                      <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
                        <div className="flex items-center space-x-1 mb-1">
                          <User className="w-3 h-3 text-orange-500" />
                          <dt className="text-xs font-medium text-orange-600 uppercase tracking-wide">Created By</dt>
                        </div>
                        <dd className="text-sm font-bold text-gray-900">
                          {transaction.user?.full_name || 'Unknown'}
                        </dd>
                        <dd className="text-xs text-gray-600 truncate">{transaction.user?.email}</dd>
                        <dd className="text-xs text-gray-600">{transaction.user?.role}</dd>
                      </div>

                      {/* Warehouse */}
                      <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-200">
                        <div className="flex items-center space-x-1 mb-1">
                          <Warehouse className="w-3 h-3 text-indigo-500" />
                          <dt className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Warehouse</dt>
                        </div>
                        <dd className="text-sm font-bold text-gray-900 truncate">
                          {transaction.warehouse?.name_en || transaction.warehouse?.name_ar || 'Unknown'}
                        </dd>
                        <dd className="text-xs text-gray-600 flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          B:{transaction.warehouse?.branch_id} W:{transaction.warehouse?.id}
                        </dd>
                      </div>

                      {/* Reference */}
                      <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                        <div className="flex items-center space-x-1 mb-1">
                          <FileText className="w-3 h-3 text-purple-500" />
                          <dt className="text-xs font-medium text-purple-600 uppercase tracking-wide">Reference</dt>
                        </div>
                        <dd className="text-sm font-bold text-gray-900 truncate">
                          {transaction.reference_number || 'N/A'}
                        </dd>
                      </div>

                      {/* Attachment */}
                      <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                        <div className="flex items-center space-x-1 mb-1">
                          <Download className="w-3 h-3 text-red-500" />
                          <dt className="text-xs font-medium text-red-600 uppercase tracking-wide">File</dt>
                        </div>
                        {transaction.attached_file ? (
                          <button
                            onClick={downloadAttachment}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Download
                          </button>
                        ) : (
                          <dd className="text-sm text-gray-400">No File</dd>
                        )}
                      </div>

                      {/* Description - Full Width */}
                      <div className="md:col-span-2 lg:col-span-4 xl:col-span-6 bg-yellow-50 rounded-lg p-2 border border-yellow-200">
                        <div className="flex items-center space-x-1 mb-1">
                          <FileText className="w-3 h-3 text-yellow-500" />
                          <dt className="text-xs font-medium text-yellow-600 uppercase tracking-wide">Description</dt>
                        </div>
                        <dd className="text-sm text-gray-900 leading-relaxed">
                          {transaction.description || 'No description provided'}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Asset Transactions */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                          <Package className="w-3 h-3 text-green-600" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-gray-900">Asset Transactions</h2>
                          <p className="text-xs text-gray-600">Asset movements and values</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {transaction.asset_transactions?.length || 0}
                        </div>
                        <div className="text-xs text-gray-600">Items</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    {transaction.asset_transactions && transaction.asset_transactions.length > 0 ? (
                      <div className="space-y-2">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 uppercase tracking-wide">
                          <div className="col-span-4">Asset Information</div>
                          <div className="col-span-2">Code</div>
                          <div className="col-span-2">Quantity</div>
                          <div className="col-span-2">Unit Price</div>
                          <div className="col-span-2">Total Value</div>
                        </div>

                        {/* Asset Rows */}
                        {transaction.asset_transactions.map((assetTransaction, index) => (
                          <div key={assetTransaction.id} className="grid grid-cols-12 gap-2 px-2 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            {/* Asset Name & Status */}
                            <div className="col-span-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                                  <Package className="w-3 h-3 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-gray-900 truncate">
                                    {assetTransaction.asset?.name_en || assetTransaction.asset?.name_ar || 'Unknown Asset'}
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                                    <span>Stock: {assetTransaction.asset?.quantity}</span>
                                    <span className={`px-1 py-0.5 rounded text-xs font-medium ${assetTransaction.asset?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                      {assetTransaction.asset?.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Product Code */}
                            <div className="col-span-2 flex items-center">
                              <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded font-medium truncate">
                                {assetTransaction.asset?.product_code || 'N/A'}
                              </span>
                            </div>

                            {/* Quantity */}
                            <div className="col-span-2 flex items-center">
                              <span className="text-sm font-semibold text-gray-900">
                                {assetTransaction.quantity}
                              </span>
                            </div>

                            {/* Unit Price */}
                            <div className="col-span-2 flex items-center">
                              <span className="text-sm font-semibold text-gray-900">
                                ${assetTransaction.amount?.toFixed(2) || '0.00'}
                              </span>
                            </div>

                            {/* Total Value */}
                            <div className="col-span-2 flex items-center">
                              <span className="text-sm font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
                                ${assetTransaction.total_value?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Total Summary */}
                        <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center">
                                {transaction.transaction_type ? (
                                  <ArrowUpCircle className="w-3 h-3 text-white" />
                                ) : (
                                  <ArrowDownCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div>
                                <span className="text-sm font-bold text-indigo-900">Transaction Total Value</span>
                                <p className="text-xs text-indigo-700">Sum of all asset transaction values</p>
                              </div>
                            </div>
                            <span className="text-lg font-bold text-indigo-900">
                              ${calculateTotalTransactionValue().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">No Asset Transactions</h3>
                        <p className="text-xs text-gray-500">This transaction has no associated asset transactions.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-2">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTransaction;