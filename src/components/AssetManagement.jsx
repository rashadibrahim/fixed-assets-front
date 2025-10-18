import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Filter,
  Search,
  Calendar,
  DollarSign,
  AlertCircle,
  Upload,
  FileText,
  QrCode,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import apiClient from '../utils/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { downloadAssetTemplate, parseAssetExcelFile, validateExcelFile, exportBulkResults, downloadAssetUpdateTemplate, parseAssetUpdateExcelFile } from '../utils/excelUtils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useErrorHandler } from '../hooks/useErrorHandler';

import AssetFormView from './AssetFormView';

const AssetManagement = ({ currentView = 'list', onViewChange, selectedItem = null }) => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { handleError, handleSuccess } = useErrorHandler();



  // Asset import states
  const [assetImportDialogOpen, setAssetImportDialogOpen] = useState(false);
  const [assetImportLoading, setAssetImportLoading] = useState(false);
  const [selectedAssetFile, setSelectedAssetFile] = useState(null);
  const [assetPreviewData, setAssetPreviewData] = useState([]);
  const [assetImportResults, setAssetImportResults] = useState(null);
  const [assetImportError, setAssetImportError] = useState(null);
  const assetFileInputRef = useRef(null);

  // Asset update import states
  const [assetUpdateDialogOpen, setAssetUpdateDialogOpen] = useState(false);
  const [assetUpdateLoading, setAssetUpdateLoading] = useState(false);
  const [selectedAssetUpdateFile, setSelectedAssetUpdateFile] = useState(null);
  const [assetUpdatePreviewData, setAssetUpdatePreviewData] = useState([]);
  const [assetUpdateResults, setAssetUpdateResults] = useState(null);
  const [assetUpdateError, setAssetUpdateError] = useState(null);
  const assetUpdateFileInputRef = useRef(null);

  useEffect(() => {
    loadAssets(currentPage, filterCategory);
    loadCategories();
  }, [currentPage, filterCategory]);

  const loadAssets = async (page = 1, category = '') => {
    try {
      setLoading(true);
      
      // Use regular assets API with category filter if provided
      const params = {
        page,
        per_page: itemsPerPage,
        ...(category && category !== 'all' && { category_id: category })
      };
      const response = await apiClient.getAssets(params);
      setAssets(response.items || response || []);
      setPagination({
        page: response.page || 1,
        pages: response.pages || 1,
        total: response.total || 0
      });
    } catch (error) {
      handleError(error, 'Failed to load assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      const categoriesData = response.items || response || [];
      // Ensure it's always an array
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      handleError(error, 'Failed to load categories');
      setCategories([]);
    }
  };

  const getCategoryName = (categoryId) => {
    if (!categoryId || !categories.length) return 'Unknown Category';
    const category = categories.find(cat => cat.id === parseInt(categoryId) || cat.id === categoryId);
    return category ? category.category : 'Unknown Category';
  };

  // Filter assets on client side for search (category filtering is still server-side)
  const filteredAssets = assets.filter(asset => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (asset.name_en && asset.name_en.toLowerCase().includes(searchLower)) ||
      (asset.name_ar && asset.name_ar.includes(searchTerm)) ||
      (asset.product_code && asset.product_code.toLowerCase().includes(searchLower))
    );
  });
  
  const totalPages = pagination.pages;

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [filterCategory]);



  const handleEdit = (asset) => {
    onViewChange('edit', asset);
  };

  const handleAdd = () => {
    onViewChange('add');
  };

  const handleBack = () => {
    onViewChange('list');
  };

  const handleAssetSaved = () => {
    loadAssets(currentPage, filterCategory);
  };

  const handleDelete = async (asset) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await apiClient.deleteAsset(asset.id);
        handleSuccess('Asset deleted successfully');
        loadAssets(currentPage, filterCategory);
      } catch (error) {
        handleError(error, 'Failed to delete asset');
      }
    }
  };

  // Load barcode settings from localStorage
  const loadBarcodeSettings = () => {
    try {
      const saved = localStorage.getItem('barcodeSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading barcode settings:', error);
      // Clear corrupted data
      localStorage.removeItem('barcodeSettings');
    }
    // Return default settings if none saved (values in mm)
    return {
      width: 80,  // mm
      height: 25,  // mm
      fontSize: 4,  // mm
      fontFamily: 'Courier New',
      showText: true,
      textPosition: 'bottom'
    };
  };

  // Helper function to convert mm to px for rendering (96 DPI standard)
  const mmToPx = (mm) => Math.round(mm * 3.7795275591);

  const handleGenerateBarcode = async (asset) => {
    try {
      // Load current barcode settings from localStorage (values in mm)
      const customOptions = loadBarcodeSettings();
      
      // Convert mm to px for rendering
      const widthPx = mmToPx(customOptions.width);
      const heightPx = mmToPx(customOptions.height);
      const fontSizePx = mmToPx(customOptions.fontSize);

      // Ensure product_code is numeric only (6-11 digits)
      let numericCode = asset.product_code?.replace(/\D/g, '') || '';

      // If no numeric code or invalid length, generate one
      if (!numericCode || numericCode.length < 6 || numericCode.length > 11) {
        // Generate a random 8-digit code as default
        numericCode = Math.floor(10000000 + Math.random() * 90000000).toString();
      }

      // Pad to ensure consistent length (8 digits for uniform appearance)
      const paddedCode = numericCode.padStart(8, '0');

      const response = await apiClient.getAssetBarcode(asset.id, {
        product_code: paddedCode,
        barcode_type: 'CODE128',
        width: widthPx,  // Send px to API
        height: heightPx,  // Send px to API
        color: '000000',
        font_size: fontSizePx  // Send px to API
      });

      // Create a new window to display the barcode with custom styling
      const barcodeWindow = window.open('', '_blank', 'width=700,height=600');
      barcodeWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Barcode - ${asset.name_en || asset.name_ar}</title>
            <style>
              body {
                font-family: '${customOptions.fontFamily}', monospace;
                text-align: center;
                padding: 20px;
                margin: 0;
                background: #ffffff;
              }
              .barcode-container {
                max-width: ${widthPx + 100}px;
                margin: 0 auto;
                border: 2px solid #333;
                padding: 30px;
                border-radius: 8px;
                background: #ffffff;
              }
              .asset-name {
                margin-bottom: 20px;
                font-size: ${fontSizePx + 2}px;
                font-weight: bold;
                color: #000000;
                text-transform: uppercase;
                word-wrap: break-word;
                font-family: '${customOptions.fontFamily}', monospace;
              }
              .barcode-image {
                margin: 20px 0;
                background: #ffffff;
                padding: 10px;
                border: 1px solid #ddd;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              .barcode-image img {
                width: ${widthPx}px;
                height: ${heightPx}px;
                max-width: ${widthPx}px;
                max-height: ${heightPx}px;
              }
              .barcode-number {
                font-family: '${customOptions.fontFamily}', monospace;
                font-size: ${fontSizePx}px;
                font-weight: bold;
                color: #000000;
                margin-top: 10px;
                letter-spacing: 2px;
                ${!customOptions.showText || customOptions.textPosition !== 'bottom' ? 'display: none;' : ''}
              }
              .barcode-number-top {
                font-family: '${customOptions.fontFamily}', monospace;
                font-size: ${fontSizePx}px;
                font-weight: bold;
                color: #000000;
                margin-bottom: 10px;
                letter-spacing: 2px;
                ${!customOptions.showText || customOptions.textPosition !== 'top' ? 'display: none;' : ''}
              }
              .buttons {
                margin-top: 30px;
              }
              .btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                cursor: pointer;
                margin: 0 10px;
                font-size: 14px;
                font-weight: bold;
              }
              .btn:hover {
                background: #0056b3;
              }
              .btn-secondary {
                background: #6c757d;
              }
              .btn-secondary:hover {
                background: #545b62;
              }
              @media print {
                * {
                  -webkit-print-color-adjust: exact !important;
                  color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                
                .no-print { display: none; }
                .barcode-container { 
                  border: 2px solid #333 !important;
                  max-width: ${widthPx + 100}px !important;
                  padding: 30px !important;
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  border-radius: 8px !important;
                  page-break-inside: avoid !important;
                  box-shadow: inset 0 0 0 1000px #ffffff !important;
                }
                body { 
                  padding: 0 !important;
                  margin: 0 !important;
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  font-family: '${customOptions.fontFamily}', monospace !important;
                }
                @page {
                  background: #ffffff !important;
                  margin: 0.5in !important;
                }
                .asset-name {
                  font-size: ${fontSizePx + 2}px !important;
                  font-family: '${customOptions.fontFamily}', monospace !important;
                  color: #000000 !important;
                  margin-bottom: 20px !important;
                  font-weight: bold !important;
                  text-transform: uppercase !important;
                }
                .barcode-image {
                  margin: 20px 0 !important;
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  padding: 10px !important;
                  border: 1px solid #ddd !important;
                  display: flex !important;
                  justify-content: center !important;
                  align-items: center !important;
                }
                .barcode-image img {
                  width: ${widthPx}px !important;
                  height: ${heightPx}px !important;
                  max-width: ${widthPx}px !important;
                  max-height: ${heightPx}px !important;
                }
                .barcode-number {
                  font-family: '${customOptions.fontFamily}', monospace !important;
                  font-size: ${fontSizePx}px !important;
                  font-weight: bold !important;
                  color: #000000 !important;
                  margin-top: 10px !important;
                  letter-spacing: 2px !important;
                  ${!customOptions.showText || customOptions.textPosition !== 'bottom' ? 'display: none !important;' : ''}
                }
                .barcode-number-top {
                  font-family: '${customOptions.fontFamily}', monospace !important;
                  font-size: ${fontSizePx}px !important;
                  font-weight: bold !important;
                  color: #000000 !important;
                  margin-bottom: 10px !important;
                  letter-spacing: 2px !important;
                  ${!customOptions.showText || customOptions.textPosition !== 'top' ? 'display: none !important;' : ''}
                }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <div class="asset-name">
                ${asset.name_en || asset.name_ar || 'Unnamed Asset'}
              </div>
              ${customOptions.showText && customOptions.textPosition === 'top' ? `<div class="barcode-number-top">${response.product_code || paddedCode}</div>` : ''}
              <div class="barcode-image">
                <img src="data:image/png;base64,${response.barcode_image}" alt="Barcode" />
              </div>
              ${customOptions.showText && customOptions.textPosition === 'bottom' ? `<div class="barcode-number">${response.product_code || paddedCode}</div>` : ''}
              <div class="buttons no-print">
                <button class="btn" onclick="window.print()">Print Barcode</button>
                <button class="btn btn-secondary" onclick="window.close()">Close</button>
              </div>
            </div>
            
            <script>
              // Force color adjustment on page load
              document.addEventListener('DOMContentLoaded', function() {
                document.body.style.webkitPrintColorAdjust = 'exact';
                document.body.style.colorAdjust = 'exact';
                document.body.style.printColorAdjust = 'exact';
              });
            </script>
          </body>
        </html>
      `);
      barcodeWindow.document.close();
      toast.success('Barcode generated successfully');
    } catch (error) {
      console.error('Error generating barcode:', error);
      toast.error('Failed to generate barcode');
    }
  };



  // Asset import functions
  const handleAssetDownloadTemplate = () => {
    try {
      downloadAssetTemplate();
      toast.success('Asset template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const handleAssetFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateExcelFile(file);
      setSelectedAssetFile(file);
      setAssetImportError(null);
      
      // Parse and preview the file
      const assets = await parseAssetExcelFile(file);
      setAssetPreviewData(assets.slice(0, 5)); // Show first 5 rows for preview
      toast.success(`File loaded successfully! Found ${assets.length} assets.`);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error(error.message || 'Failed to parse Excel file');
      setSelectedAssetFile(null);
      setAssetPreviewData([]);
      setAssetImportError(error.message);
    }
  };

  const handleAssetBulkImport = async () => {
    if (!selectedAssetFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setAssetImportLoading(true);
      setAssetImportError(null);
      
      // Parse the full file
      const assets = await parseAssetExcelFile(selectedAssetFile);
      console.log('=== PARSED ASSETS DEBUG ===');
      console.log('Parsed assets from Excel:', assets);
      
      console.log('=== SKIPPING CATEGORY VALIDATION ===');
      console.log('Letting backend handle category validation');
      console.log('Excel data expects category:', assets.length > 0 ? assets[0].category_name : 'N/A');
      
      const skipValidation = true; // Skip frontend validation, let backend handle it
      
      // Enhanced validation with detailed error messages
      const validAssets = [];
      const rejectedItems = [];
      
      // Process all assets without frontend validation - let backend handle it
      console.log('=== PROCESSING ASSETS ===');
      console.log('Total assets from Excel:', assets.length);
      
      assets.forEach((asset, index) => {
        console.log(`Processing asset ${index + 1}: ${asset.name_en} (${asset.category_name})`);
        
        // Send asset data exactly as expected by the API (according to swagger.json)
        const transformedAsset = {
          name_en: asset.name_en,
          name_ar: asset.name_ar,
          category: asset.category_name, // API expects 'category' field, not 'category_name'
          product_code: asset.product_code,
          is_active: asset.is_active
        };
        
        console.log('Transformed asset:', transformedAsset);
        validAssets.push(transformedAsset);
      });
      
      console.log('Final validAssets array:', validAssets);
      console.log('Number of valid assets:', validAssets.length);
      
      // Send valid assets to backend
      let importResults = {
        summary: {
          total: assets.length,
          added: 0,
          rejected: rejectedItems.length,
          success_rate: 0
        },
        added: [],
        rejected: rejectedItems
      };
      
      console.log('=== BULK IMPORT DEBUG ===');
      console.log('Valid assets to import:', validAssets);
      console.log('Number of valid assets:', validAssets.length);
      console.log('Sample asset being sent:', validAssets[0]);
      
      if (validAssets.length > 0) {
        try {
          console.log('=== CALLING BULK API ===');
          console.log('About to call bulkCreateAssets with data:', validAssets);
          
          const response = await apiClient.bulkCreateAssets(validAssets);
          console.log('=== BULK IMPORT RESPONSE ===');
          console.log('Full response:', response);
          console.log('Response type:', typeof response);
          console.log('Is array?', Array.isArray(response));
          
          // Handle the specific response format from the bulk API (according to swagger.json)
          let createdAssets = [];
          let failedAssets = [];
          
          if (response && response.added_assets && Array.isArray(response.added_assets)) {
            // Expected format from swagger: { summary: {...}, added_assets: [...], rejected_assets: [...] }
            createdAssets = response.added_assets;
            failedAssets = response.rejected_assets || [];
            console.log('Using swagger format: response.added_assets');
          } else if (response && response.created && Array.isArray(response.created)) {
            // Fallback format: { created: [...], failed: [...] }
            createdAssets = response.created;
            failedAssets = response.failed || [];
            console.log('Using response.created format');
          } else if (response && response.data && Array.isArray(response.data)) {
            // Format: { data: [...] }
            createdAssets = response.data;
            console.log('Using response.data format');
          } else if (response && Array.isArray(response)) {
            // Format: [...]
            createdAssets = response;
            console.log('Using direct array format');
          } else if (response && response.success && response.assets) {
            // Format: { success: true, assets: [...] }
            createdAssets = response.assets;
            console.log('Using response.assets format');
          } else if (response && typeof response === 'object') {
            // Check for any array property in the response
            const arrayProp = Object.keys(response).find(key => Array.isArray(response[key]));
            if (arrayProp) {
              createdAssets = response[arrayProp];
              console.log(`Using response.${arrayProp} format`);
            }
          }
          
          // Handle failed assets from bulk response (according to swagger format)
          if (failedAssets.length > 0) {
            console.log('Processing failed assets from API response:', failedAssets);
            failedAssets.forEach((failedItem, index) => {
              // The API response format includes: asset_data, asset_name, errors
              const errorMessages = failedItem.errors ? failedItem.errors.join(', ') : 'Failed to create asset';
              
              rejectedItems.push({
                row_number: index + 2, // This might not be accurate, but better than nothing
                data: failedItem.asset_data || failedItem.asset || failedItem,
                error: `❌ ${errorMessages}`
              });
            });
          }
          
          importResults.added = createdAssets;
          importResults.summary.added = createdAssets.length;
          
          console.log('Final created assets:', createdAssets);
          console.log('Number of created assets:', createdAssets.length);
          console.log('Failed assets from response:', failedAssets);
          
        } catch (error) {
          console.error('Bulk import error:', error);
          console.error('Error details:', {
            message: error.message,
            status: error.status,
            data: error.data
          });
          
          // Add all valid assets to rejected list if bulk import fails
          validAssets.forEach((asset, index) => {
            rejectedItems.push({
              row_number: index + 2,
              data: asset,
              error: `❌ Server error: ${error.message || 'Failed to create asset'}`
            });
          });
          importResults.rejected = rejectedItems;
          importResults.summary.rejected = rejectedItems.length;
        }
      }
      
      // Update final counts
      importResults.rejected = rejectedItems;
      importResults.summary.rejected = rejectedItems.length;
      
      // Calculate success rate
      importResults.summary.success_rate = Math.round(
        (importResults.summary.added / importResults.summary.total) * 100
      );
      
      setAssetImportResults(importResults);
      
      console.log('=== FINAL IMPORT RESULTS ===');
      console.log('Import results summary:', importResults.summary);
      console.log('Added assets:', importResults.added);
      console.log('Rejected assets:', importResults.rejected);
      
      // Show success/error message
      if (importResults.summary.added > 0) {
        toast.success(`Successfully imported ${importResults.summary.added} assets!`);
        // Reload assets to show the new ones
        loadAssets(currentPage, filterCategory);
      } else if (importResults.summary.rejected > 0) {
        toast.error(`All ${importResults.summary.rejected} assets were rejected. Check the results for details.`);
      } else {
        toast.warning('No assets were processed. Please check your Excel file format.');
      }
      
      if (importResults.summary.rejected > 0 && importResults.summary.added > 0) {
        toast.warning(`${importResults.summary.rejected} assets were rejected. Check the results for details.`);
      }
      
    } catch (error) {
      console.error('Import error:', error);
      setAssetImportError(error.message || 'Failed to import assets');
      toast.error(error.message || 'Failed to import assets');
    } finally {
      setAssetImportLoading(false);
    }
  };

  const handleAssetExportResults = () => {
    if (assetImportResults) {
      try {
        exportBulkResults(assetImportResults);
        toast.success('Results exported successfully!');
      } catch (error) {
        console.error('Export error:', error);
        toast.error('Failed to export results');
      }
    }
  };

  const resetAssetImportDialog = () => {
    setSelectedAssetFile(null);
    setAssetPreviewData([]);
    setAssetImportResults(null);
    setAssetImportError(null);
    setAssetImportDialogOpen(false);
    if (assetFileInputRef.current) {
      assetFileInputRef.current.value = '';
    }
  };

  // Asset update import functions
  const handleAssetUpdateDownloadTemplate = async () => {
    try {
      setLoading(true);
      
      // Get all assets (paginated)
      let allAssets = [];
      let currentPageTemp = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        const params = {
          page: currentPageTemp,
          per_page: 100, // Get 100 assets per page
          ...(filterCategory && filterCategory !== 'all' && { category_id: filterCategory })
        };
        const response = await apiClient.getAssets(params);
        const pageAssets = response.items || response || [];
        allAssets = [...allAssets, ...pageAssets];
        
        hasMorePages = response.pages ? currentPageTemp < response.pages : false;
        currentPageTemp++;
      }

      downloadAssetUpdateTemplate(allAssets, categories);
      toast.success('Asset update template downloaded successfully!');
    } catch (error) {
      console.error('Error downloading update template:', error);
      toast.error('Failed to download update template');
    } finally {
      setLoading(false);
    }
  };

  const handleAssetUpdateFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateExcelFile(file);
      setSelectedAssetUpdateFile(file);
      setAssetUpdateError(null);
      
      // Parse and preview the file
      const assets = await parseAssetUpdateExcelFile(file);
      setAssetUpdatePreviewData(assets.slice(0, 5)); // Show first 5 rows for preview
      toast.success(`File loaded successfully! Found ${assets.length} assets to update.`);
    } catch (error) {
      console.error('Error parsing update file:', error);
      toast.error(error.message || 'Failed to parse Excel file');
      setSelectedAssetUpdateFile(null);
      setAssetUpdatePreviewData([]);
      setAssetUpdateError(error.message);
    }
  };

  const handleAssetBulkUpdate = async () => {
    if (!selectedAssetUpdateFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setAssetUpdateLoading(true);
      setAssetUpdateError(null);
      
      // Parse the full file
      const assets = await parseAssetUpdateExcelFile(selectedAssetUpdateFile);
      
      // Get existing categories to validate category names
      const existingCategories = await apiClient.getCategories({ page: 1, limit: 1000 });
      const existingCategoryNames = new Set();
      const categoryNameToId = new Map(); // Map category names to IDs
      
      // The API response uses 'items' array, not 'data'
      if (existingCategories.items) {
        existingCategories.items.forEach(cat => {
          // Use 'category' field which contains the actual category name users see
          if (cat.category) {
            const categoryNameLower = cat.category.toLowerCase().trim();
            existingCategoryNames.add(categoryNameLower);
            categoryNameToId.set(categoryNameLower, cat.id);
          }
        });
      }
      
      // Enhanced validation with detailed error messages
      const validAssets = [];
      const rejectedItems = [];
      
      assets.forEach((asset, index) => {
        const rowNumber = index + 2; // +2 because Excel rows start at 1 and we skip header
        let errorMessage = null;
        
        const categoryNameLower = asset.category_name.toLowerCase().trim();
        
        // Check if category name exists
        if (!existingCategoryNames.has(categoryNameLower)) {
          errorMessage = `❌ Category "${asset.category_name}" does not exist in the system`;
          
          rejectedItems.push({
            row_number: rowNumber,
            data: asset,
            error: errorMessage
          });
        } else {
          // Transform the asset data: replace category_name with category_id
          const categoryId = categoryNameToId.get(categoryNameLower);
          const transformedAsset = {
            id: asset.id,
            name_en: asset.name_en,
            name_ar: asset.name_ar,
            category_id: categoryId, // Use category_id instead of category_name
            product_code: asset.product_code,
            is_active: asset.is_active
          };
          
          validAssets.push(transformedAsset);
        }
      });
      
      // Send valid assets to backend
      let updateResults = {
        summary: {
          total: assets.length,
          successfully_added: 0, // Using same naming as bulk create for consistency 
          rejected: rejectedItems.length,
          success_rate: 0
        },
        updated_assets: [],
        rejected_assets: rejectedItems
      };
      
      if (validAssets.length > 0) {
        try {
          const response = await apiClient.bulkUpdateAssets(validAssets);
          
          if (response && response.updated_assets) {
            updateResults.updated_assets = response.updated_assets;
            updateResults.summary.successfully_added = response.updated_assets.length;
          } else if (response && Array.isArray(response)) {
            updateResults.updated_assets = response;
            updateResults.summary.successfully_added = response.length;
          }
        } catch (error) {
          console.error('Bulk update error:', error);
          // Add all valid assets to rejected list if bulk update fails
          validAssets.forEach((asset, index) => {
            rejectedItems.push({
              row_number: index + 2,
              data: asset,
              error: `❌ Server error: ${error.message || 'Failed to update asset'}`
            });
          });
          updateResults.rejected_assets = rejectedItems;
          updateResults.summary.rejected = rejectedItems.length;
        }
      }
      
      // Calculate success rate
      updateResults.summary.success_rate = Math.round(
        (updateResults.summary.successfully_added / updateResults.summary.total) * 100
      );
      
      setAssetUpdateResults(updateResults);
      
      // Show success/error message
      if (updateResults.summary.successfully_added > 0) {
        toast.success(`Successfully updated ${updateResults.summary.successfully_added} assets!`);
        // Reload assets to show the updated ones
        loadAssets(currentPage, filterCategory);
      }
      if (updateResults.summary.rejected > 0) {
        toast.warning(`${updateResults.summary.rejected} assets were rejected. Check the results for details.`);
      }
      
    } catch (error) {
      console.error('Update error:', error);
      setAssetUpdateError(error.message || 'Failed to update assets');
      toast.error(error.message || 'Failed to update assets');
    } finally {
      setAssetUpdateLoading(false);
    }
  };

  const handleAssetUpdateExportResults = () => {
    if (assetUpdateResults) {
      try {
        exportBulkResults(assetUpdateResults);
        toast.success('Results exported successfully!');
      } catch (error) {
        console.error('Export error:', error);
        toast.error('Failed to export results');
      }
    }
  };

  const resetAssetUpdateDialog = () => {
    setSelectedAssetUpdateFile(null);
    setAssetUpdatePreviewData([]);
    setAssetUpdateResults(null);
    setAssetUpdateError(null);
    setAssetUpdateDialogOpen(false);
    if (assetUpdateFileInputRef.current) {
      assetUpdateFileInputRef.current.value = '';
    }
  };

  const handleExportAssets = async () => {
    try {
      setLoading(true);
      
      // Prepare export parameters based on current filters
      const exportParams = {};
      if (filterCategory && filterCategory !== 'all') {
        exportParams.category_id = filterCategory;
      }
      
      // Get the blob from API
      const blob = await apiClient.exportAssets(exportParams);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date and filters
      const currentDate = new Date().toISOString().split('T')[0];
      let filename = `assets_export_${currentDate}`;
      if (filterCategory && filterCategory !== 'all') {
        const categoryName = categories.find(cat => cat.id.toString() === filterCategory)?.category || 'filtered';
        filename += `_${categoryName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
      filename += '.xlsx';
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Assets exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      handleError(error, 'Failed to export assets');
    } finally {
      setLoading(false);
    }
  };

  // Handle different views
  if (currentView === 'add') {
    return (
      <AssetFormView 
        onBack={handleBack} 
        onAssetSaved={handleAssetSaved}
      />
    );
  }

  if (currentView === 'edit' && selectedItem) {
    return (
      <AssetFormView 
        onBack={handleBack} 
        selectedAsset={selectedItem}
        onAssetSaved={handleAssetSaved}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fixed Assets</h1>
          <p className="text-muted-foreground">Manage your organization's fixed assets</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={handleExportAssets} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
          <Dialog open={assetImportDialogOpen} onOpenChange={setAssetImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setAssetImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import from Excel
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={assetUpdateDialogOpen} onOpenChange={setAssetUpdateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setAssetUpdateDialogOpen(true)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Import Update from Excel
              </Button>
            </DialogTrigger>
          </Dialog>
          <Button className="btn-primary" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-48">
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.isArray(categories) && categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table View */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Product Code</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map(asset => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold">{asset.name_en}</div>
                        <div className="text-sm text-muted-foreground">{asset.name_ar}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{getCategoryName(asset.category_id)}</div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{asset.product_code}</span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">{asset.quantity}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={asset.is_active ? 'default' : 'secondary'}>
                      {asset.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateBarcode(asset)}
                        title="Generate Barcode"
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(asset)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(asset)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({pagination.total} total)
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Assets Found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || filterCategory !== 'all'
              ? 'No assets match your current filters.'
              : 'Start by adding your first asset.'}
          </p>
          <Button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Asset
          </Button>
        </div>
      )}



      {/* Asset Import Dialog */}
      <Dialog open={assetImportDialogOpen} onOpenChange={resetAssetImportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Import Assets from Excel
            </DialogTitle>
            <DialogDescription>
              Import multiple assets at once using an Excel file. Follow the steps below to complete the import process.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1: Download Template */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                Download Empty Template
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                Download the empty Excel template, fill it with your asset data, and save it.
                <br />
                <strong>Asset Name (English):</strong> Required field
                <br />
                <strong>Asset Name (Arabic):</strong> Required field
                <br />
                <strong>Category Name:</strong> Required field (must exist in system)
                <br />
                <strong>Product Code:</strong> Optional (6-11 characters if provided)
                <br />
                <strong>Is Active:</strong> Optional (true/false, defaults to true)
              </p>
              <div className="ml-8">
                <Button variant="outline" onClick={handleAssetDownloadTemplate} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Empty Template
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-blue-900">📋 Instructions & Guidelines:</h4>
              <div className="space-y-3">
                <ul className="text-sm text-blue-800 space-y-1 ml-4">
                  <li>• <strong>Asset Name (English):</strong> Required field - the English name of the asset</li>
                  <li>• <strong>Asset Name (Arabic):</strong> Required field - the Arabic name of the asset</li>
                  <li>• <strong>Category Name:</strong> Required field - must be a valid category name from your system</li>
                  <li>• <strong>Product Code:</strong> Optional - 6-11 character alphanumeric code</li>
                  <li>• <strong>Is Active:</strong> Optional - true/false/1/0/yes/no (defaults to true)</li>
                  <li>• Save your Excel file after filling the data and upload it below</li>
                </ul>
                
                <div className="border-t border-blue-200 pt-3">
                  <div><strong className="text-red-700">⚠️ Assets will be rejected if:</strong></div>
                  <ul className="text-sm text-red-700 space-y-1 ml-4 mt-1">
                    <li>• Asset name (English or Arabic) is empty or missing</li>
                    <li>• Category name doesn't exist in the system</li>
                    <li>• Product Code is less than 6 or more than 11 characters</li>
                    <li>• Text exceeds 255 characters</li>
                    <li>• Contains invalid characters like &lt; &gt; " ' &amp;</li>
                    <li>• Row is completely empty</li>
                  </ul>
                </div>
                
                <div className="border-t border-blue-200 pt-3">
                  <div><strong className="text-green-700">✅ Tips for success:</strong></div>
                  <ul className="text-sm text-green-700 space-y-1 ml-4 mt-1">
                    <li>• Verify category names exist in your system before importing</li>
                    <li>• Remove empty rows before uploading</li>
                    <li>• Use simple text without special formatting</li>
                    <li>• Check for typos in asset names</li>
                    <li>• Keep all text under 255 characters</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 2: Upload File */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                Upload Excel File
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                Upload your completed Excel file. All required fields must be filled.
              </p>
              <div className="ml-8">
                <input
                  ref={assetFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleAssetFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {/* Step 3: Preview Data */}
            {assetPreviewData.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                  Preview Data
                </h3>
                <div className="ml-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Preview of first 5 rows (showing sample data):
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset Name (EN)</TableHead>
                          <TableHead>Asset Name (AR)</TableHead>
                          <TableHead>Category Name</TableHead>
                          <TableHead>Product Code</TableHead>
                          <TableHead>Is Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assetPreviewData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name_en}</TableCell>
                            <TableCell>{item.name_ar}</TableCell>
                            <TableCell>{item.category_name}</TableCell>
                            <TableCell>{item.product_code || '(empty)'}</TableCell>
                            <TableCell>{item.is_active ? 'Yes' : 'No'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Import Results */}
            {assetImportResults && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                  Import Results
                </h3>
                <div className="ml-8 space-y-4">
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total Records</div>
                        <div className="font-semibold">{assetImportResults.summary.total}</div>
                        <div className="text-xs text-muted-foreground">Processed from Excel</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Successfully Added</div>
                        <div className="font-semibold text-green-600">{assetImportResults.summary.added}</div>
                        <div className="text-xs text-muted-foreground">New assets created</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Rejected</div>
                        <div className="font-semibold text-red-600">{assetImportResults.summary.rejected}</div>
                        <div className="text-xs text-muted-foreground">Failed validation</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Success Rate</div>
                        <div className={`font-semibold ${assetImportResults.summary.success_rate >= 80 ? 'text-green-600' : assetImportResults.summary.success_rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {assetImportResults.summary.success_rate}%
                        </div>
                        <div className="text-xs text-muted-foreground">Import efficiency</div>
                      </div>
                    </div>
                  </div>

                  {/* Successfully Added Assets */}
                  {assetImportResults.added && assetImportResults.added.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-green-800">Successfully Added Assets</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Asset Name (EN)</TableHead>
                              <TableHead>Asset Name (AR)</TableHead>
                              <TableHead>Category Name</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assetImportResults.added.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.id}</TableCell>
                                <TableCell>{item.name_en}</TableCell>
                                <TableCell>{item.name_ar}</TableCell>
                                <TableCell>{item.category_name || item.category_id}</TableCell>
                                <TableCell className="text-sm text-green-600">
                                  <div className="flex items-start gap-2">
                                    <span className="text-lg leading-none">✅</span>
                                    <span className="font-medium">Successfully created in database</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Rejected Assets */}
                  {assetImportResults.rejected && assetImportResults.rejected.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-red-800">Rejected Assets</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Asset Name (EN)</TableHead>
                              <TableHead>Asset Name (AR)</TableHead>
                              <TableHead>Category Name</TableHead>
                              <TableHead>Message</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assetImportResults.rejected.map((item, index) => {
                              let message = item.error || 'Unknown error';
                              let statusColor = 'text-red-600';
                              let statusIcon = '❌';
                              
                              return (
                                <TableRow key={index}>
                                  <TableCell>{item.row_number}</TableCell>
                                  <TableCell>
                                    {item.data?.name_en ? (
                                      <span className="font-medium">{item.data.name_en}</span>
                                    ) : (
                                      <span className="text-gray-400 italic">(empty)</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {item.data?.name_ar ? (
                                      <span className="font-medium">{item.data.name_ar}</span>
                                    ) : (
                                      <span className="text-gray-400 italic">(empty)</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {item.data?.category_name ? (
                                      <span className="font-medium">{item.data.category_name}</span>
                                    ) : (
                                      <span className="text-gray-400 italic">(empty)</span>
                                    )}
                                  </TableCell>
                                  <TableCell className={`text-sm ${statusColor}`}>
                                    <div className="flex items-start gap-2">
                                      <span className="text-lg leading-none">{statusIcon}</span>
                                      <span className="font-medium">{message}</span>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Export Results Button */}
                  <Button variant="outline" onClick={handleAssetExportResults} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Detailed Results
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={resetAssetImportDialog}>
                {assetImportResults ? 'Close' : 'Cancel'}
              </Button>
              
              {selectedAssetFile && !assetImportResults && (
                <Button 
                  onClick={handleAssetBulkImport} 
                  disabled={assetImportLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {assetImportLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Import Assets
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Asset Update Import Dialog */}
      <Dialog open={assetUpdateDialogOpen} onOpenChange={resetAssetUpdateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Import Asset Updates from Excel
            </DialogTitle>
            <DialogDescription>
              Update existing assets in bulk using an Excel file. Download the template with current data, make your changes, and upload it back.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1: Download Template with Existing Data */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                Download Template with Current Asset Data
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                Download an Excel file containing all your current assets. Edit the data and save the file.
                <br />
                <strong>ID:</strong> Required field (do not modify - used to identify which asset to update)
                <br />
                <strong>Asset Name (English):</strong> Required field
                <br />
                <strong>Asset Name (Arabic):</strong> Required field
                <br />
                <strong>Category Name:</strong> Required field (must exist in system)
                <br />
                <strong>Product Code:</strong> Optional (6-11 characters if provided)
                <br />
                <strong>Is Active:</strong> true/false
              </p>
              <Button
                variant="outline"
                onClick={handleAssetUpdateDownloadTemplate}
                disabled={loading}
                className="ml-8"
              >
                <Download className="w-4 h-4 mr-2" />
                {loading ? 'Loading...' : 'Download Template with Current Data'}
              </Button>
            </div>

            {/* Step 2: Upload File */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                Upload Your Updated File
              </h3>
              <div className="ml-8 space-y-4">
                <div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleAssetUpdateFileSelect}
                    ref={assetUpdateFileInputRef}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => assetUpdateFileInputRef.current?.click()}
                    disabled={assetUpdateLoading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Excel File
                  </Button>
                  {selectedAssetUpdateFile && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {selectedAssetUpdateFile.name}
                    </p>
                  )}
                </div>

                {/* Preview Data */}
                {assetUpdatePreviewData.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Preview (first 5 rows):</h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Asset Name (EN)</TableHead>
                            <TableHead>Asset Name (AR)</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Product Code</TableHead>
                            <TableHead>Is Active</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assetUpdatePreviewData.map((asset, index) => (
                            <TableRow key={index}>
                              <TableCell>{asset.id}</TableCell>
                              <TableCell>{asset.name_en}</TableCell>
                              <TableCell>{asset.name_ar}</TableCell>
                              <TableCell>{asset.category_name}</TableCell>
                              <TableCell>{asset.product_code || '-'}</TableCell>
                              <TableCell>{asset.is_active ? 'Active' : 'Inactive'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Review Results */}
            {assetUpdateResults && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">✓</span>
                  Update Results
                </h3>
                <div className="ml-8 space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{assetUpdateResults.summary.total}</div>
                        <div className="text-sm text-muted-foreground">Total Processed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">{assetUpdateResults.summary.successfully_added}</div>
                        <div className="text-sm text-muted-foreground">Successfully Updated</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{assetUpdateResults.summary.rejected}</div>
                        <div className="text-sm text-muted-foreground">Rejected</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${assetUpdateResults.summary.success_rate >= 80 ? 'text-green-600' : assetUpdateResults.summary.success_rate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {assetUpdateResults.summary.success_rate}%
                        </div>
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                      </div>
                    </div>
                  </div>

                  {assetUpdateResults.updated_assets && assetUpdateResults.updated_assets.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-600 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Successfully Updated Assets ({assetUpdateResults.updated_assets.length})
                      </h4>
                      <div className="border rounded-lg max-h-40 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Asset Name (EN)</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Product Code</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assetUpdateResults.updated_assets.slice(0, 10).map((asset, index) => (
                              <TableRow key={index}>
                                <TableCell>{asset.id}</TableCell>
                                <TableCell>{asset.name_en}</TableCell>
                                <TableCell>{asset.category_id}</TableCell>
                                <TableCell>{asset.product_code || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {assetUpdateResults.updated_assets.length > 10 && (
                          <div className="p-2 text-center text-sm text-muted-foreground border-t">
                            ... and {assetUpdateResults.updated_assets.length - 10} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {assetUpdateResults.rejected_assets && assetUpdateResults.rejected_assets.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Rejected Assets ({assetUpdateResults.rejected_assets.length})
                      </h4>
                      <div className="border rounded-lg max-h-40 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Asset Data</TableHead>
                              <TableHead>Error</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {assetUpdateResults.rejected_assets.slice(0, 10).map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{item.row_number}</TableCell>
                                <TableCell>{item.data.name_en || 'N/A'}</TableCell>
                                <TableCell className="text-red-600 text-sm">{item.error}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {assetUpdateResults.rejected_assets.length > 10 && (
                          <div className="p-2 text-center text-sm text-muted-foreground border-t">
                            ... and {assetUpdateResults.rejected_assets.length - 10} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleAssetUpdateExportResults}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Detailed Results
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button variant="outline" onClick={resetAssetUpdateDialog}>
                Close
              </Button>
              {selectedAssetUpdateFile && !assetUpdateResults && (
                <Button
                  onClick={handleAssetBulkUpdate}
                  disabled={assetUpdateLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {assetUpdateLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Assets
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Display */}
      {assetImportError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{assetImportError}</AlertDescription>
        </Alert>
      )}

      {/* Update Error Display */}
      {assetUpdateError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{assetUpdateError}</AlertDescription>
        </Alert>
      )}

    </div>
  );
};

export default AssetManagement;