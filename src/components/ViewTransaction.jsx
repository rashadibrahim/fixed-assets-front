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
  Download,
  FileDown
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

  const generatePDF = () => {
    if (!transaction) {
      toast.error('No transaction data to export');
      return;
    }

    try {
      const reportDate = new Date().toLocaleDateString();
      const isInTransaction = transaction.transaction_type === true;

      // Create the PDF window
      const pdfWindow = window.open('', '_blank', 'width=1000,height=800');

      // Prepare table data
      const tableData = [];
      let totalValue = 0;
      let hasValues = false;

      if (transaction.asset_transactions && transaction.asset_transactions.length > 0) {
        // If transaction has assets, create a row for each asset
        transaction.asset_transactions.forEach(assetTransaction => {
          const asset = assetTransaction.asset || {};
          // Fix: Use the correct property names from the actual data structure
          const unitPrice = assetTransaction.amount || 0; // Changed from unit_price to amount
          const quantity = assetTransaction.quantity || 0;
          const lineTotal = assetTransaction.total_value || (unitPrice * quantity); // Use total_value directly
          totalValue += lineTotal;
          hasValues = true;

          tableData.push({
            id: transaction.custom_id || transaction.id,
            date: new Date(transaction.date).toLocaleDateString(),
            assetName: asset.name_en || asset.name_ar || 'N/A',
            warehouse: transaction.warehouse?.name_en || transaction.warehouse?.name_ar || 'N/A',
            // Fix: Use the correct asset code property
            assetCode: asset.product_code || asset.asset_code || 'N/A', // Changed to product_code first
            quantity: quantity.toString(),
            unitPrice: `$${unitPrice.toFixed(2)}`,
            totalValue: `$${lineTotal.toFixed(2)}`
          });
        });
      } else {
        // If no assets, create a single row with transaction info
        tableData.push({
          id: transaction.custom_id || transaction.id,
          date: new Date(transaction.date).toLocaleDateString(),
          assetName: transaction.description || 'N/A',
          warehouse: transaction.warehouse?.name_en || transaction.warehouse?.name_ar || 'N/A',
          assetCode: 'N/A',
          quantity: 'N/A',
          unitPrice: 'N/A',
          totalValue: 'N/A'
        });
      }

      const themeColor = isInTransaction ? '#22c55e' : '#ef4444'; // Green for IN, Red for OUT
      const transactionType = isInTransaction ? 'Incoming' : 'Outgoing';

      // Generate the HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${transactionType} Transaction ${transaction.custom_id || transaction.id} - ${reportDate}</title>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: white;
                padding: 20px;
              }
              
              .container {
                max-width: 1000px;
                margin: 0 auto;
                background: white;
              }
              
              .report-title {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 3px solid ${themeColor};
              }
              
              .report-title h1 {
                font-size: 24px;
                color: #333;
                margin-bottom: 8px;
              }
              
              .report-title .transaction-id {
                font-size: 18px;
                color: ${themeColor};
                font-weight: bold;
                margin-bottom: 8px;
              }
              
              .report-title p {
                font-size: 12px;
                color: #666;
                margin: 3px 0;
              }
              
              .transaction-info {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 5px solid ${themeColor};
              }
              
              .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
              }
              
              .info-item {
                background: white;
                padding: 12px;
                border-radius: 6px;
                border: 1px solid #e5e7eb;
              }
              
              .info-label {
                font-size: 10px;
                color: #6b7280;
                text-transform: uppercase;
                margin-bottom: 4px;
                font-weight: 600;
              }
              
              .info-value {
                font-size: 14px;
                color: #111827;
                font-weight: 600;
              }
              
              .transaction-type {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                color: white;
                background-color: ${themeColor};
              }
              
              .table-container {
                margin: 20px 0;
                overflow-x: auto;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
              }
              
              th, td {
                padding: 12px 8px;
                text-align: left;
                border-bottom: 1px solid #e5e7eb;
              }
              
              th {
                background-color: ${themeColor};
                color: white;
                font-weight: bold;
                text-align: center;
                font-size: 12px;
              }
              
              td {
                background-color: white;
              }
              
              tr:nth-child(even) td {
                background-color: #f9fafb;
              }
              
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              
              .summary-section {
                margin-top: 30px;
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 5px solid ${themeColor};
              }
              
              .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
              }
              
              .summary-item {
                background: white;
                padding: 15px;
                border-radius: 6px;
                text-align: center;
                border: 1px solid ${themeColor};
              }
              
              .summary-value {
                font-size: 20px;
                font-weight: bold;
                color: ${themeColor};
                display: block;
                margin-bottom: 5px;
              }
              
              .summary-label {
                font-size: 11px;
                color: #6b7280;
                text-transform: uppercase;
                font-weight: 600;
              }
              
              .print-controls {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 1000;
              }
              
              .btn {
                background: ${themeColor};
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                margin: 0 5px;
                font-size: 12px;
                font-weight: 600;
              }
              
              .btn:hover {
                opacity: 0.9;
              }
              
              .btn-secondary {
                background: #6b7280;
              }
              
              .btn-secondary:hover {
                background: #4b5563;
              }
              
              @media print {
                .print-controls {
                  display: none;
                }
                
                body {
                  padding: 0;
                }
                
                .container {
                  max-width: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-controls">
              <button class="btn" onclick="window.print()">Print PDF</button>
              <button class="btn btn-secondary" onclick="window.close()">Close</button>
            </div>
            
            <div class="container">
              <!-- Report Title -->
              <div class="report-title">
                <h1>${transactionType} Transaction Details</h1>
                <div class="transaction-id">Transaction ID: ${transaction.custom_id || transaction.id}</div>
                <p>Generated on ${reportDate} at ${new Date().toLocaleTimeString()}</p>
              </div>
              
              <!-- Transaction Info -->
              <div class="transaction-info">
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Transaction Type</div>
                    <div class="info-value">
                      <span class="transaction-type">${transactionType.toUpperCase()}</span>
                    </div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-label">Date</div>
                    <div class="info-value">${new Date(transaction.date).toLocaleDateString()}</div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-label">Warehouse</div>
                    <div class="info-value">${transaction.warehouse?.name_en || transaction.warehouse?.name_ar || 'N/A'}</div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-label">Reference Number</div>
                    <div class="info-value">${transaction.reference_number || 'N/A'}</div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-label">Description</div>
                    <div class="info-value">${transaction.description || 'N/A'}</div>
                  </div>
                  
                  <div class="info-item">
                    <div class="info-label">Created At</div>
                    <div class="info-value">${new Date(transaction.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
              
              <!-- Assets Table -->
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Date</th>
                      <th>Asset Name</th>
                      <th>Warehouse</th>
                      <th>Asset Code</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableData.length === 0 ?
          `<tr><td colspan="8" class="text-center">No assets found for this transaction.</td></tr>` :
          tableData.map(row => `
                        <tr>
                          <td class="text-center">${row.id}</td>
                          <td class="text-center">${row.date}</td>
                          <td>${row.assetName}</td>
                          <td>${row.warehouse}</td>
                          <td class="text-center">${row.assetCode}</td>
                          <td class="text-right">${row.quantity}</td>
                          <td class="text-right">${row.unitPrice}</td>
                          <td class="text-right">${row.totalValue}</td>
                        </tr>
                      `).join('')
        }
                  </tbody>
                </table>
              </div>
              
              <!-- Summary Section -->
              ${hasValues ? `
                <div class="summary-section">
                  <h3 style="text-align: center; margin-bottom: 20px; color: #333;">Transaction Summary</h3>
                  <div class="summary-grid">
                    <div class="summary-item">
                      <span class="summary-value">${transaction.asset_transactions?.length || 0}</span>
                      <div class="summary-label">Total Assets</div>
                    </div>
                    
                    <div class="summary-item">
                      <span class="summary-value">$${totalValue.toLocaleString()}</span>
                      <div class="summary-label">Total Value</div>
                    </div>
                    
                    <div class="summary-item">
                      <span class="summary-value">$${(totalValue / (transaction.asset_transactions?.length || 1)).toFixed(2)}</span>
                      <div class="summary-label">Average Value per Asset</div>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
          </body>
        </html>
      `;

      pdfWindow.document.write(htmlContent);
      pdfWindow.document.close();

      // Auto-focus the window for better user experience
      pdfWindow.focus();

      toast.success('PDF report opened successfully! Use your browser\'s print function to save as PDF.');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    }
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
            <div className="flex items-center space-x-2">
              <button
                onClick={generatePDF}
                disabled={!transaction || loading}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
              >
                <FileDown className="w-4 h-4 mr-1" />
                Export PDF
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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