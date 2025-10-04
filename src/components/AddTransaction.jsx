import React, { useState, useEffect } from 'react';
import apiClient from '../utils/api';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { 
  X, 
  Plus, 
  Trash2, 
  FileText, 
  Calendar,
  Package,
  Warehouse,
  Upload,
  Save,
  Search
} from 'lucide-react';

const AddTransaction = ({ isOpen, onClose, onTransactionAdded, defaultTransactionType = 'IN', editTransactionId = null }) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference_number: '',
    warehouse_id: '',
    attached_file: null
  });

  // Fixed transaction type based on the screen that opens the modal
  const transactionType = defaultTransactionType === 'IN' ? true : false;

  const [assetTransactions, setAssetTransactions] = useState([{
    id: Date.now(),
    asset_id: '',
    asset: null,
    quantity: 1,
    amount: 0,
    total: 0,
    transaction_type: transactionType,
    searchQuery: '',
    searchResults: [],
    searchLoading: false,
    loadingAverage: false
  }]);

  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWarehouses();
      if (editTransactionId) {
        setIsEditMode(true);
        loadTransactionForEdit(editTransactionId);
      } else {
        setIsEditMode(false);
        // Reset form when modal opens to ensure correct transaction type
        setFormData({
          date: new Date().toISOString().split('T')[0],
          description: '',
          reference_number: '',
          warehouse_id: '',
          attached_file: null
        });
        setAssetTransactions([{
          id: Date.now(),
          asset_id: '',
          asset: null,
          quantity: 1,
          amount: 0,
          total: 0,
          transaction_type: transactionType,
          searchQuery: '',
          searchResults: [],
          searchLoading: false,
          loadingAverage: false
        }]);
      }
    }
  }, [isOpen, transactionType, editTransactionId]);

  const fetchWarehouses = async () => {
    try {
      const response = await apiClient.getWarehouses();
      setWarehouses(response.items || response.data || response || []);
    } catch (error) {
      handleError(error, 'Failed to load warehouses');
    }
  };

  const loadTransactionForEdit = async (transactionId) => {
    try {
      setLoading(true);
      const transaction = await apiClient.getTransaction(transactionId);
      
      // Set form data
      setFormData({
        date: transaction.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
        description: transaction.description || '',
        reference_number: transaction.reference_number || '',
        warehouse_id: transaction.warehouse_id || '',
        attached_file: null // File will be handled separately for existing transactions
      });

      // Load asset transactions
      if (transaction.asset_transactions && transaction.asset_transactions.length > 0) {
        const editAssetTransactions = transaction.asset_transactions.map((assetTx, index) => ({
          id: assetTx.id || Date.now() + index,
          asset_id: assetTx.asset_id || '',
          asset: assetTx.asset || null,
          quantity: assetTx.quantity || 1,
          amount: assetTx.amount || 0,
          total: assetTx.total_value || (assetTx.quantity * assetTx.amount) || 0,
          transaction_type: transaction.transaction_type,
          searchQuery: assetTx.asset?.name_en || assetTx.asset?.name_ar || '',
          searchResults: [],
          searchLoading: false,
          loadingAverage: false
        }));
        setAssetTransactions(editAssetTransactions);
      } else {
        // If no asset transactions, create one empty
        setAssetTransactions([{
          id: Date.now(),
          asset_id: '',
          asset: null,
          quantity: 1,
          amount: 0,
          total: 0,
          transaction_type: transaction.transaction_type,
          searchQuery: '',
          searchResults: [],
          searchLoading: false,
          loadingAverage: false
        }]);
      }
    } catch (error) {
      handleError(error, 'Failed to load transaction for editing');
    } finally {
      setLoading(false);
    }
  };

  const addAssetTransaction = () => {
    const newTransaction = {
      id: Date.now(),
      asset_id: '',
      asset: null,
      quantity: 1,
      amount: 0,
      total: 0,
      transaction_type: transactionType,
      searchQuery: '',
      searchResults: [],
      searchLoading: false,
      loadingAverage: false
    };
    setAssetTransactions(prev => [...prev, newTransaction]);
  };

  const removeAssetTransaction = (index) => {
    if (assetTransactions.length > 1) {
      setAssetTransactions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateAssetTransaction = (index, updates) => {
    setAssetTransactions(prev => 
      prev.map((transaction, i) => {
        if (i === index) {
          const updated = { ...transaction, ...updates };
          if ('quantity' in updates || 'amount' in updates) {
            updated.total = updated.quantity * updated.amount;
          }
          return updated;
        }
        return transaction;
      })
    );
  };

  const searchAssets = async (query, index) => {
    if (query.length < 1) return;

    updateAssetTransaction(index, { searchLoading: true });

    try {
      const response = await apiClient.searchAssets({ q: query, per_page: 10 });
      updateAssetTransaction(index, {
        searchResults: response.items || response.data || response || [],
        searchLoading: false
      });
    } catch (error) {
      handleError(error, 'Failed to search assets');
      updateAssetTransaction(index, { searchResults: [], searchLoading: false });
    }
  };

  const handleAssetSelect = async (index, asset) => {
    // Set initial values
    updateAssetTransaction(index, {
      asset_id: asset.id,
      asset: asset,
      searchQuery: asset.name_en || asset.name_ar || '',
      searchResults: [],
      amount: 0, // Will be updated below
      loadingAverage: false
    });

    // For OUT transactions, fetch average cost from backend
    if (!transactionType) { // false = OUT transaction
      updateAssetTransaction(index, { loadingAverage: true });
      
      try {
        const averageResponse = await apiClient.getAssetAverage(asset.id);
        const averageCost = typeof averageResponse === 'number' ? averageResponse : (averageResponse.average || 0);
        
        updateAssetTransaction(index, {
          amount: averageCost,
          total: (assetTransactions[index]?.quantity || 1) * averageCost,
          loadingAverage: false
        });
        
        if (averageCost > 0) {
          handleSuccess(`Asset average cost loaded: $${averageCost.toFixed(2)}`);
        } else {
          handleError('No average cost available for this asset');
        }
      } catch (error) {
        console.warn('Could not fetch asset average cost:', error);
        handleError('Could not fetch asset average cost. Please enter amount manually.');
        // Fallback to manual entry
        updateAssetTransaction(index, {
          amount: 0,
          total: 0,
          loadingAverage: false
        });
      }
    } else {
      // For IN transactions, user can enter amount manually
      updateAssetTransaction(index, {
        amount: 0,
        total: 0,
        loadingAverage: false
      });
    }
  };

  const calculateGrandTotal = () => {
    return assetTransactions.reduce((sum, transaction) => sum + transaction.total, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.warehouse_id) {
        handleError('Please select a warehouse');
        return;
      }

      if (assetTransactions.some(at => !at.asset_id)) {
        handleError('Please select assets for all transaction lines');
        return;
      }

      if (isEditMode && editTransactionId) {
        // Update existing transaction - only update transaction metadata
        const updateData = {
          date: formData.date,
          description: formData.description,
          reference_number: formData.reference_number,
          warehouse_id: parseInt(formData.warehouse_id)
        };

        await apiClient.updateTransaction(editTransactionId, updateData);
        handleSuccess('Transaction updated successfully!');
      } else {
        // Create new transaction
        const transactionData = new FormData();
        
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== '') {
            transactionData.append(key, formData[key]);
          }
        });

        transactionData.append('data', JSON.stringify({
          date: formData.date,
          description: formData.description,
          reference_number: formData.reference_number,
          warehouse_id: parseInt(formData.warehouse_id),
          transaction_type: transactionType,
          asset_transactions: assetTransactions.map(transaction => ({
            asset_id: transaction.asset_id,
            quantity: transaction.quantity,
            amount: transaction.amount || 0
          }))
        }));

        await apiClient.createTransaction(transactionData);
        handleSuccess('Transaction created successfully!');
      }
      
      if (onTransactionAdded) {
        onTransactionAdded();
      }
      
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
        asset_id: '',
        asset: null,
        quantity: 1,
        amount: 0,
        total: 0,
        transaction_type: transactionType,
        searchQuery: '',
        searchResults: [],
        searchLoading: false,
        loadingAverage: false
      }]);
      
      onClose();
    } catch (error) {
      handleError(error, `Failed to ${isEditMode ? 'update' : 'create'} transaction`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center z-50 p-2">
      <div className="bg-white w-full max-w-7xl h-[calc(100vh-16px)] rounded-lg shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit' : 'Add New'} {transactionType ? 'In' : 'Out'} Transaction
              </h1>
              <p className="text-sm text-gray-600">
                {isEditMode ? 'Update the' : 'Create a new'} asset {transactionType ? 'incoming' : 'outgoing'} transaction record
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center mb-3">
                <FileText className="w-4 h-4 text-blue-500 mr-2" />
                <h2 className="text-sm font-semibold text-gray-900">Transaction Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Reference Number */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <FileText className="w-3 h-3 inline mr-1" />
                    Reference
                  </label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter reference"
                  />
                </div>

                {/* Warehouse */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Warehouse className="w-3 h-3 inline mr-1" />
                    Warehouse *
                  </label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, warehouse_id: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name_en || warehouse.name_ar || `Warehouse ${warehouse.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transaction Type - Read Only Display */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Package className="w-3 h-3 inline mr-1" />
                    Type
                  </label>
                  <div className={`flex items-center justify-center p-1.5 rounded-md border text-xs font-medium ${
                    transactionType 
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                  }`}>
                    {transactionType ? 'In' : 'Out'}
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    <Upload className="w-3 h-3 inline mr-1" />
                    File
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFormData(prev => ({ ...prev, attached_file: e.target.files[0] }))}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  <FileText className="w-3 h-3 inline mr-1" />
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Enter transaction description..."
                />
              </div>
            </div>

            {/* Asset Transactions */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-green-600" />
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">Asset Items</h2>
                      <p className="text-xs text-gray-600">
                        {isEditMode 
                          ? "Asset transactions cannot be modified in edit mode" 
                          : "Add assets to this transaction"
                        }
                      </p>
                    </div>
                  </div>
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={addAssetTransaction}
                      className="flex items-center px-2 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Asset
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-2 pb-2 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Asset</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Unit Amount</div>
                  <div className="col-span-2">Total</div>
                </div>

                {/* Asset Transaction Rows */}
                <div className="space-y-2 mt-2">
                  {assetTransactions.map((transaction, index) => (
                    <div key={transaction.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-lg">
                      {/* Row Number */}
                      <div className="col-span-1 flex items-center space-x-1">
                        <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        {!isEditMode && assetTransactions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAssetTransaction(index)}
                            className="p-0.5 text-red-500 hover:bg-red-50 rounded transition-colors"
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
                          onChange={isEditMode ? undefined : (e) => {
                            const query = e.target.value;
                            updateAssetTransaction(index, { searchQuery: query });
                            if (query.length >= 1) {
                              searchAssets(query, index);
                            } else {
                              updateAssetTransaction(index, { searchResults: [] });
                            }
                          }}
                          disabled={isEditMode}
                          className={`w-full px-2 py-1.5 text-xs border rounded-md ${isEditMode 
                            ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                            : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                          }`}
                          placeholder={isEditMode ? "Asset cannot be changed in edit mode" : "Search asset name or barcode..."}
                        />
                        <Search className="w-3 h-3 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />

                        {/* Search Results */}
                        {(transaction.searchResults.length > 0 || transaction.searchLoading) && (
                          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                            {transaction.searchLoading ? (
                              <div className="p-2 text-center text-xs text-gray-500">
                                <div className="animate-spin w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-1"></div>
                                Searching...
                              </div>
                            ) : (
                              transaction.searchResults.map((asset) => (
                                <button
                                  key={asset.id}
                                  type="button"
                                  onClick={() => handleAssetSelect(index, asset)}
                                  className="w-full text-left px-2 py-1.5 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-xs text-gray-900">
                                    {asset.name_en || asset.name_ar}
                                  </div>
                                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
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
                          onChange={isEditMode ? undefined : (e) => {
                            const newQuantity = parseInt(e.target.value) || 0;
                            updateAssetTransaction(index, { quantity: newQuantity });
                          }}
                          disabled={isEditMode}
                          className={`w-full px-2 py-1.5 text-xs border rounded-md ${isEditMode 
                            ? 'border-gray-200 bg-gray-50 text-gray-500' 
                            : `focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${transaction.transaction_type === false &&
                            transaction.asset &&
                            transaction.quantity > transaction.asset.quantity
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300'
                            }`}`}
                          required={!isEditMode}
                        />
                        {transaction.asset && transaction.transaction_type === false && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Max: {transaction.asset.quantity}
                          </div>
                        )}
                        {transaction.transaction_type === false &&
                          transaction.asset &&
                          transaction.quantity > transaction.asset.quantity && (
                            <div className="text-xs text-red-600 mt-0.5">
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
                          onChange={isEditMode ? undefined : (e) => updateAssetTransaction(index, { amount: parseFloat(e.target.value) || 0 })}
                          disabled={isEditMode || !transactionType}
                          className={`w-full px-2 py-1.5 text-xs border rounded-md ${
                            isEditMode || !transactionType 
                              ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500' 
                              : 'border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                          }`}
                          placeholder={!transactionType ? "Auto from average" : "0.00"}
                          readOnly={isEditMode || !transactionType}
                          required={!isEditMode}
                        />
                        {!transactionType && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            {transaction.loadingAverage && (
                              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                            )}
                            {transaction.loadingAverage ? 'Loading average cost...' : 'Amount auto-filled from asset average cost'}
                          </div>
                        )}
                      </div>

                      {/* Total */}
                      <div className="col-span-2">
                        <div className="px-2 py-1.5 text-xs bg-indigo-50 border border-indigo-200 rounded-md font-bold text-indigo-900">
                          ${transaction.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grand Total */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 rounded-lg p-3 text-white">
                      <div className="text-xs opacity-90">Grand Total</div>
                      <div className="text-lg font-bold">
                        ${calculateGrandTotal().toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all text-sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 mr-2" />
                      {isEditMode ? 'Update Transaction' : 'Create Transaction'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;