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
      <div className="bg-white w-[1400px] h-[640px] flex flex-col rounded-lg shadow-xl">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Transaction Details
                </h1>
                <p className="text-sm text-gray-600">
                  {transaction ? `${transaction.custom_id} - ${transaction.transaction_type ? 'INBOUND' : 'OUTBOUND'}` : 'Loading...'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-3" />
                  <p className="text-gray-600">Loading transaction details...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-red-400 text-4xl mb-3">⚠️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transaction</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={loadTransaction}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : transaction ? (
              <div className="space-y-6">
                {/* Transaction Overview */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${transaction.transaction_type
                          ? 'bg-green-500'
                          : 'bg-red-500'
                          }`}>
                          {transaction.transaction_type ? (
                            <ArrowUpCircle className="w-5 h-5 text-white" />
                          ) : (
                            <ArrowDownCircle className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">Transaction Information</h2>
                          <p className="text-sm text-gray-600">Detailed transaction overview and summary</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${transaction.transaction_type
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {transaction.transaction_type ? 'INBOUND' : 'OUTBOUND'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Transaction ID */}
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Hash className="w-4 h-4 text-blue-500" />
                          <dt className="text-xs font-medium text-blue-600 uppercase tracking-wide">Transaction ID</dt>
                        </div>
                        <dd className="text-lg font-bold text-gray-900 mb-1">{transaction.custom_id}</dd>
                        <dd className="text-xs text-gray-600">System ID: {transaction.id}</dd>
                      </div>

                      {/* Date */}
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="w-4 h-4 text-green-500" />
                          <dt className="text-xs font-medium text-green-600 uppercase tracking-wide">Transaction Date</dt>
                        </div>
                        <dd className="text-lg font-bold text-gray-900 mb-1">{formatDateOnly(transaction.date)}</dd>
                        <dd className="text-xs text-gray-600">Created: {formatDate(transaction.created_at)}</dd>
                      </div>

                      {/* User */}
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4 text-orange-500" />
                          <dt className="text-xs font-medium text-orange-600 uppercase tracking-wide">Created By</dt>
                        </div>
                        <dd className="text-lg font-bold text-gray-900 mb-1">
                          {transaction.user?.full_name || 'Unknown User'}
                        </dd>
                        <dd className="text-xs text-gray-600">{transaction.user?.email}</dd>
                        <dd className="text-xs text-gray-600">
                          {transaction.user?.role} • ID: {transaction.user_id}
                        </dd>
                      </div>

                      {/* Warehouse */}
                      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Warehouse className="w-4 h-4 text-indigo-500" />
                          <dt className="text-xs font-medium text-indigo-600 uppercase tracking-wide">Warehouse</dt>
                        </div>
                        <dd className="text-lg font-bold text-gray-900 mb-1">
                          {transaction.warehouse?.name_en || transaction.warehouse?.name_ar || 'Unknown Warehouse'}
                        </dd>
                        <dd className="text-xs text-gray-600 flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          Branch ID: {transaction.warehouse?.branch_id} • Warehouse ID: {transaction.warehouse?.id}
                        </dd>
                      </div>

                      {/* Reference */}
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-purple-500" />
                          <dt className="text-xs font-medium text-purple-600 uppercase tracking-wide">Reference Number</dt>
                        </div>
                        <dd className="text-lg font-bold text-gray-900">
                          {transaction.reference_number || 'Not Specified'}
                        </dd>
                      </div>

                      {/* Attachment */}
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Download className="w-4 h-4 text-red-500" />
                          <dt className="text-xs font-medium text-red-600 uppercase tracking-wide">Attachment</dt>
                        </div>
                        {transaction.attached_file ? (
                          <button
                            onClick={downloadAttachment}
                            className="text-base font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Download File
                          </button>
                        ) : (
                          <dd className="text-base font-medium text-gray-400">No File Attached</dd>
                        )}
                      </div>

                      {/* Description - Full Width */}
                      <div className="md:col-span-2 lg:col-span-3 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-yellow-500" />
                          <dt className="text-xs font-medium text-yellow-600 uppercase tracking-wide">Description</dt>
                        </div>
                        <dd className="text-base text-gray-900 leading-relaxed">
                          {transaction.description || 'No description provided'}
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Asset Transactions */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">Asset Transactions</h2>
                          <p className="text-sm text-gray-600">Detailed breakdown of asset movements and values</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {transaction.asset_transactions?.length || 0}
                        </div>
                        <div className="text-xs text-gray-600">Items</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {transaction.asset_transactions && transaction.asset_transactions.length > 0 ? (
                      <div className="space-y-4">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-100 rounded-lg text-xs font-medium text-gray-600 uppercase tracking-wide">
                          <div className="col-span-4">Asset Information</div>
                          <div className="col-span-2">Product Code</div>
                          <div className="col-span-2">Quantity</div>
                          <div className="col-span-2">Unit Price</div>
                          <div className="col-span-2">Total Value</div>
                        </div>

                        {/* Asset Rows */}
                        {transaction.asset_transactions.map((assetTransaction, index) => (
                          <div key={assetTransaction.id} className="grid grid-cols-12 gap-4 px-4 py-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            {/* Asset Name & Status */}
                            <div className="col-span-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Package className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 mb-1">
                                    {assetTransaction.asset?.name_en || assetTransaction.asset?.name_ar || 'Unknown Asset'}
                                  </div>
                                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                                    <span>Stock: <span className="font-medium">{assetTransaction.asset?.quantity}</span></span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${assetTransaction.asset?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                      {assetTransaction.asset?.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Product Code */}
                            <div className="col-span-2 flex items-center">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded font-medium">
                                {assetTransaction.asset?.product_code || 'N/A'}
                              </span>
                            </div>

                            {/* Quantity */}
                            <div className="col-span-2 flex items-center">
                              <span className="text-base font-semibold text-gray-900">
                                {assetTransaction.quantity}
                              </span>
                            </div>

                            {/* Unit Price */}
                            <div className="col-span-2 flex items-center">
                              <span className="text-base font-semibold text-gray-900">
                                ${assetTransaction.amount?.toFixed(2) || '0.00'}
                              </span>
                            </div>

                            {/* Total Value */}
                            <div className="col-span-2 flex items-center">
                              <span className="text-base font-bold text-indigo-900 bg-indigo-100 px-3 py-1 rounded-lg">
                                ${assetTransaction.total_value?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Total Summary */}
                        <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                                {transaction.transaction_type ? (
                                  <ArrowUpCircle className="w-5 h-5 text-white" />
                                ) : (
                                  <ArrowDownCircle className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div>
                                <span className="text-lg font-bold text-indigo-900">Transaction Total Value</span>
                                <p className="text-sm text-indigo-700">Sum of all asset transaction values</p>
                              </div>
                            </div>
                            <span className="text-2xl font-bold text-indigo-900">
                              ${calculateTotalTransactionValue().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Asset Transactions</h3>
                        <p className="text-gray-500">This transaction has no associated asset transactions.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
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