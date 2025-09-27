// Replace the entire AddTransaction component with this enhanced version:
import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Search,
  Calendar,
  FileText,
  Warehouse,
  Package,
  Save,
  ArrowLeft,
  AlertCircle,
  Building2,
  Upload,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/api';

const AddTransaction = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference_number: '',
    warehouse_id: '',
    attached_file: null
  });

  // Asset transactions
  const [assetTransactions, setAssetTransactions] = useState([
    {
      id: Date.now(),
      asset: null,
      asset_id: '',
      quantity: 1,
      amount: 0,
      total: 0,
      transaction_type: true,
      searchQuery: '',
      searchResults: [],
      searchLoading: false
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      loadWarehouses();
    }
  }, [isOpen]);

  const getValidToken = () => {
    return localStorage.getItem('authToken');
  };

  const loadWarehouses = async () => {
    try {
      const token = getValidToken();
      if (!token) return;

      const response = await fetch(`${apiClient.baseURL}/warehouses/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (response.ok) {
        const data = await response.json();
        const warehousesData = data.items || data || [];
        await loadBranches(warehousesData);
      }
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const loadBranches = async (warehousesData) => {
    try {
      const token = getValidToken();
      if (!token) return;

      const response = await fetch(`${apiClient.baseURL}/branches/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (response.ok) {
        const branchesData = await response.json();
        const branches = branchesData.items || branchesData || [];

        const warehousesWithBranches = warehousesData.map(warehouse => {
          const branch = branches.find(b => b.id === warehouse.branch_id);
          return {
            ...warehouse,
            branch_name: branch ? (branch.name_en || branch.name_ar) : `Branch ${warehouse.branch_id}`
          };
        });

        setWarehouses(warehousesWithBranches);
      } else {
        setWarehouses(warehousesData);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      setWarehouses(warehousesData);
    }
  };

  const searchAssets = async (query, transactionIndex) => {
    if (!query || query.length < 1) {
      updateAssetTransaction(transactionIndex, { searchResults: [], searchLoading: false });
      return;
    }

    updateAssetTransaction(transactionIndex, { searchLoading: true });

    try {
      const token = getValidToken();
      if (!token) return;

      const response = await fetch(`${apiClient.baseURL}/assets/search?per_page=10&page=1&q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (response.ok) {
        const data = await response.json();
        updateAssetTransaction(transactionIndex, {
          searchResults: data.items || [],
          searchLoading: false
        });
      } else {
        updateAssetTransaction(transactionIndex, {
          searchResults: [],
          searchLoading: false
        });
      }
    } catch (error) {
      console.error('Error searching assets:', error);
      updateAssetTransaction(transactionIndex, {
        searchResults: [],
        searchLoading: false
      });
    }
  };

  const updateAssetTransaction = (index, updates) => {
    setAssetTransactions(prev =>
      prev.map((transaction, i) => {
        if (i === index) {
          const updatedTransaction = {
            ...transaction,
            ...updates,
            total: updates.quantity !== undefined || updates.amount !== undefined
              ? (updates.quantity || transaction.quantity) * (updates.amount || transaction.amount)
              : transaction.total
          };

          // If transaction_type is being updated, sync it to all transactions
          if (updates.transaction_type !== undefined) {
            // This will be handled by the radio button change handler instead
          }

          return updatedTransaction;
        }
        return transaction;
      })
    );
  };

  const handleAssetSelect = (transactionIndex, asset) => {
    updateAssetTransaction(transactionIndex, {
      asset,
      asset_id: asset.id,
      searchQuery: `${asset.name_en || asset.name_ar} (${asset.product_code})`,
      searchResults: []
    });
  };

  const addAssetTransaction = () => {
    setAssetTransactions(prev => [
      ...prev,
      {
        id: Date.now(),
        asset: null,
        asset_id: '',
        quantity: 1,
        amount: 0,
        total: 0,
        transaction_type: true,
        searchQuery: '',
        searchResults: [],
        searchLoading: false
      }
    ]);
  };

  const removeAssetTransaction = (index) => {
    if (assetTransactions.length > 1) {
      setAssetTransactions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.warehouse_id) {
      toast.error('Please select a warehouse');
      return;
    }

    if (assetTransactions.some(t => !t.asset_id)) {
      toast.error('Please select assets for all transaction items');
      return;
    }

    if (assetTransactions.some(t => t.quantity <= 0 || t.amount < 0)) {
      toast.error('Please enter valid quantity and amount for all items');
      return;
    }

    // Validate out transactions don't exceed available quantity
    const invalidOutTransactions = assetTransactions.filter(transaction =>
      transaction.transaction_type === false &&
      transaction.asset &&
      transaction.quantity > transaction.asset.quantity
    );

    if (invalidOutTransactions.length > 0) {
      const invalidAssets = invalidOutTransactions.map(t =>
        `${t.asset.name_en || t.asset.name_ar} (Available: ${t.asset.quantity}, Requested: ${t.quantity})`
      ).join(', ');

      toast.error(`Out transaction quantity exceeds available stock for: ${invalidAssets}`);
      return;
    }

    setLoading(true);

    try {
      const token = getValidToken();
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const formDataToSend = new FormData();

      if (formData.attached_file) {
        formDataToSend.append('attached_file', formData.attached_file);
      }

      const transactionData = {
        date: formData.date,
        description: formData.description,
        reference_number: formData.reference_number,
        warehouse_id: parseInt(formData.warehouse_id),
        transaction_type: assetTransactions[0]?.transaction_type ?? true, // Use nullish coalescing instead of ||
        asset_transactions: assetTransactions.map(transaction => ({
          asset_id: transaction.asset_id,
          quantity: parseInt(transaction.quantity),
          amount: parseFloat(transaction.amount)
        }))
      };

      formDataToSend.append('data', JSON.stringify(transactionData));

      const response = await fetch(`${apiClient.baseURL}/transactions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create transaction';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success('Transaction created successfully!');
      onSuccess && onSuccess();
      onClose();

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference_number: '',
        warehouse_id: '',
        attached_file: null
      });
      setAssetTransactions([{
        id: Date.now(),
        asset: null,
        asset_id: '',
        quantity: 1,
        amount: 0,
        total: 0,
        transaction_type: true,
        searchQuery: '',
        searchResults: [],
        searchLoading: false
      }]);

    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedWarehouseInfo = () => {
    if (!formData.warehouse_id) return null;
    return warehouses.find(w => w.id === parseInt(formData.warehouse_id));
  };

  const calculateGrandTotal = () => {
    return assetTransactions.reduce((total, transaction) => total + transaction.total, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white w-[1400px] h-[640px] rounded-xl shadow-2xl overflow-y-auto">
        <div className="p-6">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-8 mb-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-white/20 rounded-xl transition-colors duration-200"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Add New Transaction</h1>
                    <p className="text-indigo-100 text-lg">Create a comprehensive asset transaction record</p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/20 rounded-xl transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Enhanced Transaction Details */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="ml-3">
                  <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                  <p className="text-blue-600 text-sm">Basic transaction information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
                    <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center mr-2">
                      <Calendar className="w-3 h-3 text-green-600" />
                    </div>
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Reference Number */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center mr-2">
                      <FileText className="w-3 h-3 text-purple-600" />
                    </div>
                    Reference
                  </label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter reference"
                  />
                </div>

                {/* Warehouse */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
                    <div className="w-6 h-6 bg-indigo-100 rounded-md flex items-center justify-center mr-2">
                      <Warehouse className="w-3 h-3 text-indigo-600" />
                    </div>
                    Warehouse *
                  </label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, warehouse_id: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name_en || warehouse.name_ar || `Warehouse ${warehouse.id}`}
                      </option>
                    ))}
                  </select>
                  {getSelectedWarehouseInfo() && (
                    <div className="mt-2 p-2 bg-indigo-50 rounded text-xs text-indigo-700">
                      <Building2 className="w-3 h-3 inline mr-1" />
                      {getSelectedWarehouseInfo().branch_name}
                    </div>
                  )}
                </div>

                {/* Transaction Type */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center mr-2">
                      <Package className="w-3 h-3 text-orange-600" />
                    </div>
                    Type *
                  </label>
                  <div className="flex space-x-2">
                    <label className={`flex-1 flex items-center justify-center p-2 rounded-md border cursor-pointer text-xs font-medium transition-all ${assetTransactions[0]?.transaction_type === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-300'
                      }`}>
                      <input
                        type="radio"
                        checked={assetTransactions[0]?.transaction_type === true}
                        onChange={() => {
                          setAssetTransactions(prev =>
                            prev.map(t => ({ ...t, transaction_type: true }))
                          );
                        }}
                        className="sr-only"
                      />
                      In
                    </label>
                    <label className={`flex-1 flex items-center justify-center p-2 rounded-md border cursor-pointer text-xs font-medium transition-all ${assetTransactions[0]?.transaction_type === false
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-red-300'
                      }`}>
                      <input
                        type="radio"
                        checked={assetTransactions[0]?.transaction_type === false}
                        onChange={() => {
                          setAssetTransactions(prev =>
                            prev.map(t => ({ ...t, transaction_type: false }))
                          );
                        }}
                        className="sr-only"
                      />
                      Out
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2 bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
                    <div className="w-6 h-6 bg-yellow-100 rounded-md flex items-center justify-center mr-2">
                      <FileText className="w-3 h-3 text-yellow-600" />
                    </div>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="Enter transaction description..."
                  />
                </div>

                {/* File Upload */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <label className="flex items-center text-xs font-semibold text-gray-700 mb-2">
                    <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center mr-2">
                      <Upload className="w-3 h-3 text-red-600" />
                    </div>
                    File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFormData(prev => ({ ...prev, attached_file: e.target.files[0] }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {formData.attached_file && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs text-green-700">
                      <FileText className="w-3 h-3 inline mr-1" />
                      {formData.attached_file.name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Asset Transactions */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Asset Items</h2>
                      <p className="text-sm text-gray-600">Add assets to this transaction</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addAssetTransaction}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all text-sm font-medium shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Asset
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Asset</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Unit Amount</div>
                  <div className="col-span-2">Total</div>
                </div>

                {/* Asset Transaction Rows */}
                <div className="space-y-3 mt-4">
                  {assetTransactions.map((transaction, index) => (
                    <div key={transaction.id} className="grid grid-cols-12 gap-4 items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {/* Row Number */}
                      <div className="col-span-1 flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        {assetTransactions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAssetTransaction(index)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Asset Search */}
                      <div className="col-span-5 relative">
                        <input
                          type="text"
                          value={transaction.searchQuery}
                          onChange={(e) => {
                            const query = e.target.value;
                            updateAssetTransaction(index, { searchQuery: query });
                            searchAssets(query, index);
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Search asset name or barcode..."
                        />
                        <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

                        {/* Search Results */}
                        {(transaction.searchResults.length > 0 || transaction.searchLoading) && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {transaction.searchLoading ? (
                              <div className="p-3 text-center text-sm text-gray-500">
                                <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-1"></div>
                                Searching...
                              </div>
                            ) : (
                              transaction.searchResults.map((asset) => (
                                <button
                                  key={asset.id}
                                  type="button"
                                  onClick={() => handleAssetSelect(index, asset)}
                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-sm text-gray-900">
                                    {asset.name_en || asset.name_ar}
                                  </div>
                                  <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                    <span className="bg-gray-100 px-1 py-0.5 rounded font-mono">
                                      {asset.product_code}
                                    </span>
                                    <span className="text-green-600">Qty: {asset.quantity}</span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          max={transaction.transaction_type === false && transaction.asset ? transaction.asset.quantity : undefined}
                          value={transaction.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 0;
                            updateAssetTransaction(index, { quantity: newQuantity });
                          }}
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${transaction.transaction_type === false &&
                            transaction.asset &&
                            transaction.quantity > transaction.asset.quantity
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                            }`}
                          required
                        />
                        {transaction.asset && transaction.transaction_type === false && (
                          <div className="text-xs text-gray-500 mt-1">
                            Max: {transaction.asset.quantity}
                          </div>
                        )}
                        {transaction.transaction_type === false &&
                          transaction.asset &&
                          transaction.quantity > transaction.asset.quantity && (
                            <div className="text-xs text-red-600 mt-1">
                              Exceeds stock
                            </div>
                          )}
                      </div>

                      {/* Unit Amount */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={transaction.amount}
                          onChange={(e) => updateAssetTransaction(index, { amount: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="0.00"
                          required
                        />
                      </div>

                      {/* Total */}
                      <div className="col-span-2">
                        <div className="px-3 py-2 text-sm bg-indigo-50 border border-indigo-200 rounded-lg font-bold text-indigo-900">
                          ${transaction.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grand Total */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg p-4 text-white">
                      <div className="text-sm opacity-90">Grand Total</div>
                      <div className="text-2xl font-bold">
                        ${calculateGrandTotal().toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Transaction
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;