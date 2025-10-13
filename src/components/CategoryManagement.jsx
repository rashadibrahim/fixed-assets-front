import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  Tag,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ViewToggle } from '@/components/ui/view-toggle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import apiClient from '../utils/api';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { downloadCategoryTemplate, parseExcelFile, validateExcelFile, exportBulkResults } from '../utils/excelUtils';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [viewMode, setViewMode] = useState('grid');
  const { handleError, handleSuccess } = useErrorHandler();

  const [formData, setFormData] = useState({
    category: '', // Main Category (optional, from dropdown)
    subcategory: '', // Category Name (what user sees as main)
    description: '',
    parent_id: ''
  });

  const [existingMainCategories, setExistingMainCategories] = useState([]);
  
  // Bulk import states
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCategories(pagination.page, searchTerm);
  }, [pagination.page, searchTerm]);

  const loadCategories = async (page = pagination.page, search = '') => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        handleError('Authentication required');
        return;
      }

      // Prepare API parameters with search
      const params = { per_page: 12, page };
      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await apiClient.getCategories(params);
      const data = response;

      if (data.items) {
        // Transform the API response to match component expectations
        const transformedCategories = data.items.map(item => ({
          id: item.id,
          category: item.subcategory, // Main Category (from backend subcategory)
          subcategory: item.category, // Category Name (from backend category)
          description: '', // API doesn't provide description
          parent_id: null // API doesn't provide parent_id
        }));

        setCategories(transformedCategories);
        
        // Extract unique main categories for dropdown
        const uniqueMainCategories = [...new Set(
          data.items
            .map(item => item.subcategory)
            .filter(category => category && category.trim() !== '')
        )].sort();
        setExistingMainCategories(uniqueMainCategories);

        setPagination({
          page: data.page || 1,
          pages: data.pages || 1,
          total: data.total || 0
        });
      } else {
        setCategories([]);
        setExistingMainCategories([]);
      }
    } catch (error) {
      handleError(error, 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({
      category: '__none__', // Main Category (optional)
      subcategory: '', // Category Name (required)
      description: '',
      parent_id: ''
    });
    setDialogOpen(true);
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setFormData({
      category: category.category || '__none__', // Main Category
      subcategory: category.subcategory || '', // Category Name
      description: category.description || '',
      parent_id: category.parent_id || ''
    });
    setDialogOpen(true);
  };

  // Update the validateForm function:
  const validateForm = () => {
    const errors = [];

    if (!formData.subcategory.trim()) {
      errors.push('Category name is required');
    }

    return errors;
  };

  const handleSubmit = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        handleError('Authentication required');
        return;
      }

      const errors = validateForm();
      if (errors.length > 0) {
        setError(errors.join('. '));
        return;
      }

      // Check for duplicate names
      if (formData.subcategory.trim()) {
        const duplicateCategory = categories.find(cat => 
          cat.subcategory?.toLowerCase() === formData.subcategory.trim().toLowerCase() && 
          (!editingCategory || cat.id !== editingCategory.id)
        );

        if (duplicateCategory) {
          handleError(`Category name "${formData.subcategory}" already exists`);
          return;
        }
      }

      const requestBody = {
        category: formData.subcategory.trim() || null, // Category Name (required) - maps to backend category
        subcategory: formData.category.trim() === '__none__' ? null : formData.category.trim() || null // Main Category (optional) - maps to backend subcategory
      };

      if (!requestBody.category) {
        requestBody.category = null;
      }

      if (editingCategory) {
        await apiClient.updateCategory(editingCategory.id, requestBody);
        handleSuccess('Category updated successfully!');
      } else {
        await apiClient.createCategory(requestBody);
        handleSuccess('Category created successfully!');
      }

      setFormData({ category: '__none__', subcategory: '', description: '', parent_id: '' });
      setEditingCategory(null);
      setDialogOpen(false);
      loadCategories(pagination.page, searchTerm);

    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.deleteCategory(categoryId);
      handleSuccess('Category deleted successfully');
      await loadCategories(pagination.page, searchTerm);
    } catch (error) {
      console.error('Error deleting category:', error);
      handleError(error, 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  // Since search is now handled by API, use categories directly
  const filteredCategories = categories;

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Bulk import functions
  const handleDownloadTemplate = () => {
    try {
      downloadCategoryTemplate();
      handleSuccess('Template downloaded successfully!');
    } catch (error) {
      handleError(error, 'Failed to download template');
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      validateExcelFile(file);
      setSelectedFile(file);
      
      // Parse and preview the file
      const categories = await parseExcelFile(file);
      setPreviewData(categories.slice(0, 5)); // Show first 5 rows for preview
      handleSuccess(`File loaded successfully! Found ${categories.length} categories.`);
    } catch (error) {
      handleError(error, 'Failed to parse Excel file');
      setSelectedFile(null);
      setPreviewData([]);
    }
  };

  const handleBulkImport = async () => {
    if (!selectedFile) {
      handleError('Please select a file first');
      return;
    }

    try {
      setImportLoading(true);
      
      // Parse the full file
      const categories = await parseExcelFile(selectedFile);
      
      // Get existing categories to check for duplicates
      const existingCategories = await apiClient.getCategories({ page: 1, limit: 1000 });
      const existingCategoriesSet = new Set();
      
      if (existingCategories.data) {
        existingCategories.data.forEach(cat => {
          const key = `${cat.category || ''}|${cat.subcategory || ''}`.toLowerCase();
          existingCategoriesSet.add(key);
        });
      }
      
      // Enhanced validation with detailed error messages
      const validCategories = [];
      const rejectedItems = [];
      
      categories.forEach((category, index) => {
        const rowNumber = index + 2; // +2 because Excel rows start at 1 and we skip header
        let errorMessage = null;
        
        // Check if category name (category field) is missing
        if (!category.category || category.category.trim() === '') {
          errorMessage = '❌ Category name is required and cannot be empty';
        }
        // Check for duplicates in existing data
        else {
          const categoryKey = `${category.category || ''}|${category.subcategory}`.toLowerCase();
          
          if (existingCategoriesSet.has(categoryKey)) {
            errorMessage = '⚠️ Category already exists in database - skipped to avoid duplicates';
          } else {
            // Check for duplicates within the current import batch
            const duplicateInBatch = validCategories.find(vc => 
              (vc.category || '').toLowerCase() === (category.category || '').toLowerCase() &&
              vc.subcategory.toLowerCase() === category.subcategory.toLowerCase()
            );
            if (duplicateInBatch) {
              errorMessage = '⚠️ Duplicate category in this import file - only first occurrence will be processed';
            }
          }
        }
        
        if (errorMessage) {
          rejectedItems.push({
            row_number: rowNumber,
            data: category,
            error: errorMessage,
            reason: errorMessage
          });
        } else {
          validCategories.push(category);
        }
      });
      
      // If we have valid categories, send them to backend
      let backendResults = null;
      if (validCategories.length > 0) {
        try {
          backendResults = await apiClient.bulkCreateCategories(validCategories);
        } catch (error) {
          // If backend fails, mark all valid categories as failed
          validCategories.forEach((category, index) => {
            const originalIndex = categories.findIndex(c => c === category);
            rejectedItems.push({
              row_number: originalIndex >= 0 ? originalIndex + 2 : index + 2,
              data: category,
              error: `❌ Server error: ${error.message || 'Failed to connect to server'}`,
              reason: `The server encountered an error while processing this category: ${error.message || 'Unknown server error. Please try again or contact support.'}`
            });
          });
        }
      }
      
      // Handle case where backend says items were rejected but doesn't provide details
      let backendRejectedItems = [];
      let backendSuccessItems = [];
      const actualRejectedItems = backendResults?.rejected_categories || backendResults?.rejected || [];
      
      if (actualRejectedItems && actualRejectedItems.length > 0) {
        // Filter out backend bugs - categories rejected only for empty main category duplication
        actualRejectedItems.forEach(item => {
          const hasOnlyEmptyMainCategoryError = item.errors && 
            item.errors.length === 1 && 
            item.errors[0].includes("Category ''") && 
            item.errors[0].includes("is duplicated in this batch");
          
          if (hasOnlyEmptyMainCategoryError) {
            // Treat this as a successful item since empty main categories should be allowed
            backendSuccessItems.push({
              id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID
              category: item.category_data?.category || '',
              subcategory: item.category_data?.subcategory || '',
              created_at: new Date().toISOString()
            });
          } else {
            // This is a legitimate rejection
            backendRejectedItems.push(item);
          }
        });
      } else if ((backendResults?.summary?.rejected || 0) > 0 && validCategories.length > 0) {
        // Backend says items were rejected but didn't provide details
        // Create synthetic rejected items for each category that wasn't added
        const addedCount = backendResults?.added?.length || 0;
        const shouldHaveBeenAdded = validCategories.length;
        const actuallyRejected = shouldHaveBeenAdded - addedCount;
        
        if (actuallyRejected > 0) {
          // Create synthetic rejected items for categories that weren't added
          for (let i = 0; i < actuallyRejected && i < validCategories.length; i++) {
            const category = validCategories[i];
            backendRejectedItems.push({
              row_number: categories.findIndex(c => c === category) + 2,
              data: category,
              error: `❌ Server rejected "${category.subcategory}" without providing specific reason`,
              reason: `The server processed this category but rejected it. This could be due to: duplicate detection, validation rules, or database constraints.`
            });
          }
        }
      }
      
      // Now calculate totals after arrays are populated
      const backendAddedItems = backendResults?.added_categories || backendResults?.added || [];
      const allSuccessfulItems = [...backendAddedItems, ...backendSuccessItems];
      const totalAdded = allSuccessfulItems.length;
      const totalRejected = rejectedItems.length + backendRejectedItems.length;
      
      const finalResults = {
        summary: {
          total: categories.length,
          added: totalAdded,
          rejected: totalRejected,
          success_rate: categories.length > 0 ? Math.round((totalAdded / categories.length) * 100) : 0
        },
        added: allSuccessfulItems,
        rejected: [
          ...rejectedItems,
          ...backendRejectedItems.map((item, index) => {
            // Parse the backend rejected item format
            let originalData = item.category_data || item.data;
            let errorMessage = '';
            let rowNumber = originalData?._rowNumber || (index + rejectedItems.length + 2);
            
            // Extract error messages from backend response
            if (item.errors && Array.isArray(item.errors)) {
              const validErrors = item.errors.filter(err => !err.includes('_rowNumber: Unknown field'));
              if (validErrors.length > 0) {
                // Translate backend error messages to frontend terminology
                const categoryName = originalData?.subcategory || '';
                const mainCategoryName = originalData?.category || '';
                
                let translatedError = validErrors[0]; // Take the first error
                
                // Translate common backend error patterns
                if (translatedError.includes('already exists in database')) {
                  errorMessage = `⚠️ Category "${categoryName}"`;
                  if (mainCategoryName) {
                    errorMessage += ` with main category "${mainCategoryName}"`;
                  }
                  errorMessage += ` already exists in database - Skipped to avoid duplicates`;
                } else if (translatedError.includes('is duplicated in this batch')) {
                  if (translatedError.includes("Category ''")) {
                    // Backend incorrectly treats empty main categories as duplicates - this is a backend bug
                    errorMessage = `🐛 Backend validation error: Empty main categories incorrectly flagged as duplicates. Category "${categoryName}" should be valid.`;
                  } else {
                    errorMessage = `⚠️ Category "${categoryName}" is duplicated in this import batch - Only first occurrence will be processed`;
                  }
                } else if (translatedError.includes('is required')) {
                  errorMessage = `❌ Category name is required and cannot be empty`;
                } else if (translatedError.includes('too long')) {
                  errorMessage = `❌ Category name is too long (maximum 255 characters)`;
                } else if (translatedError.includes('invalid characters')) {
                  errorMessage = `❌ Category name contains invalid characters`;
                } else {
                  // Generic error message
                  errorMessage = `❌ ${translatedError}`;
                }
              } else {
                // All errors were about _rowNumber, so this is actually a valid category
                const categoryName = originalData?.subcategory || '';
                const mainCategoryName = originalData?.category || '';
                errorMessage = `⚠️ Category "${categoryName}"`;
                if (mainCategoryName) {
                  errorMessage += ` (Main Category: "${mainCategoryName}")`;
                }
                errorMessage += ` was processed but may have validation issues`;
              }
            } else {
              errorMessage = item.error || item.message || item.reason || '❌ Server rejected this item without providing specific details';
            }
            
            return {
              row_number: rowNumber,
              data: originalData || { category: '', subcategory: 'Unknown item' },
              error: errorMessage,
              reason: errorMessage
            };
          })
        ]
      };
      

      
      setImportResults(finalResults);
      
      handleSuccess(`Import completed! ${finalResults.summary.added} categories added, ${finalResults.summary.rejected} rejected.`);
      
      // Refresh the categories list
      await loadCategories(pagination.page, searchTerm);
      
    } catch (error) {
      handleError(error, 'Failed to import categories');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportResults = () => {
    if (importResults) {
      try {
        exportBulkResults(importResults);
        handleSuccess('Results exported successfully!');
      } catch (error) {
        handleError(error, 'Failed to export results');
      }
    }
  };

  const resetImportDialog = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setImportResults(null);
    setImportDialogOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const CategoryListView = () => (
    <Card className="glass-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead>Main Category</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map(category => (
              <TableRow key={category.id}>
                <TableCell>
                  <span className="font-mono font-medium text-blue-600">#{category.id}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Tag className="h-4 w-4 text-purple-500" />
                    </div>
                    <div className="font-semibold">{category.subcategory}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{category.category || 'None'}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id, category.subcategory)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen className="w-8 h-8 text-blue-600" />
            Category Management
          </h1>
          <p className="text-gray-600 mt-1">Manage asset categories and subcategories</p>
          {pagination.total > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              Total: {pagination.total} categories
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          
          {/* Import from Excel Button */}
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import from Excel
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="subcategory">Category Name *</Label>
                    <Input
                      id="subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      placeholder="Enter category name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Main Category (Optional)</Label>
                    <div className="mt-1">
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select main category or leave empty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">-- No Main Category --</SelectItem>
                          {existingMainCategories.map(mainCat => (
                            <SelectItem key={mainCat} value={mainCat}>
                              {mainCat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-1">
                      <Input
                        placeholder="Or enter new main category"
                        value={formData.category === '__none__' ? '' : formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value || '__none__' }))}
                        className="text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You can select from existing categories or type a new one
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Import from Excel Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={resetImportDialog}>
        <DialogContent className="max-w-none max-h-none w-screen h-screen m-0 rounded-none overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Import from Excel
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1: Download Template */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                Download Empty Template
              </h3>
              <p className="text-sm text-muted-foreground ml-8">
                Download the empty Excel template, fill it with your category data, and save it. 
                <br />
                <strong>Main Category:</strong> Optional (can be empty or select from existing)
                <br />
                <strong>Category:</strong> Required field
              </p>
              <div className="ml-8">
                <Button variant="outline" onClick={handleDownloadTemplate} className="flex items-center gap-2">
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
                  <li>• <strong>Main Category:</strong> Optional field - you can leave it empty, enter a new main category, or use an existing one</li>
                  <li>• <strong>Category:</strong> Required field - this is the specific category name</li>
                  <li>• Save your Excel file after filling the data and upload it below</li>
                </ul>
                
                <div className="border-t border-blue-200 pt-3">
                  <div><strong className="text-red-700">⚠️ Categories will be rejected if:</strong></div>
                  <ul className="text-sm text-red-700 space-y-1 ml-4 mt-1">
                    <li>• Category name is empty or missing</li>
                    <li>• Category already exists (duplicates are automatically skipped)</li>
                    <li>• Text exceeds 255 characters</li>
                    <li>• Contains invalid characters like &lt; &gt; " ' &amp;</li>
                    <li>• Row is completely empty</li>
                  </ul>
                </div>
                
                <div className="border-t border-blue-200 pt-3">
                  <div><strong className="text-green-700">✅ Tips for success:</strong></div>
                  <ul className="text-sm text-green-700 space-y-1 ml-4 mt-1">
                    <li>• Main Category is optional - leave empty if not needed</li>
                    <li>• Remove empty rows before uploading</li>
                    <li>• Use simple text without special formatting</li>
                    <li>• Check for typos to avoid unintended duplicates</li>
                    <li>• Keep names under 255 characters</li>
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
                Upload your completed Excel file. Only the Category column is required, Main Category is optional.
              </p>
              <div className="ml-8">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {/* Step 3: Preview Data */}
            {previewData.length > 0 && (
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
                          <TableHead>Main Category</TableHead>
                          <TableHead>Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.subcategory || '(empty)'}</TableCell>
                            <TableCell>{item.category}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Import Results */}
            {importResults && (
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
                        <div className="font-semibold">{importResults.summary.total}</div>
                        <div className="text-xs text-muted-foreground">Processed from Excel</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Successfully Added</div>
                        <div className="font-semibold text-green-600">{importResults.summary.added}</div>
                        <div className="text-xs text-muted-foreground">New categories created</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Rejected</div>
                        <div className="font-semibold text-red-600">{importResults.summary.rejected}</div>
                        <div className="text-xs text-muted-foreground">Duplicates or errors</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Success Rate</div>
                        <div className="font-semibold">{importResults.summary.success_rate}%</div>
                        <div className="text-xs text-muted-foreground">Import efficiency</div>
                      </div>
                    </div>
                    
                    {/* Detailed Rejection Breakdown */}
                    {importResults.rejected && importResults.rejected.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h5 className="font-medium mb-2 text-sm">Rejection Breakdown</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                          {(() => {
                            const rejectionTypes = {};
                            importResults.rejected.forEach(item => {
                              const error = (item.error || 'Unknown error').toLowerCase();
                              if (error.includes('already exists') || error.includes('duplicate')) {
                                rejectionTypes['Already Exists'] = (rejectionTypes['Already Exists'] || 0) + 1;
                              } else if (error.includes('required') || error.includes('missing') || error.includes('cannot be empty')) {
                                rejectionTypes['Missing Required'] = (rejectionTypes['Missing Required'] || 0) + 1;
                              } else if (error.includes('validation') || error.includes('invalid')) {
                                rejectionTypes['Invalid Format'] = (rejectionTypes['Invalid Format'] || 0) + 1;
                              } else if (error.includes('empty') || error.includes('blank')) {
                                rejectionTypes['Empty Rows'] = (rejectionTypes['Empty Rows'] || 0) + 1;
                              } else if (error.includes('too long') || error.includes('length')) {
                                rejectionTypes['Too Long'] = (rejectionTypes['Too Long'] || 0) + 1;
                              } else if (error.includes('special characters') || error.includes('invalid characters')) {
                                rejectionTypes['Invalid Characters'] = (rejectionTypes['Invalid Characters'] || 0) + 1;
                              } else {
                                rejectionTypes['Other Errors'] = (rejectionTypes['Other Errors'] || 0) + 1;
                              }
                            });
                            
                            return Object.entries(rejectionTypes).map(([type, count]) => (
                              <div key={type} className="flex justify-between items-center bg-white rounded px-2 py-1">
                                <span className="text-muted-foreground">{type}</span>
                                <span className="font-medium text-red-600">{count}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Successfully Added Items */}
                  {importResults.added && importResults.added.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-3 text-green-800">Successfully Added Categories</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Main Category</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Message</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importResults.added.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>#{item.id}</TableCell>
                                <TableCell>{item.subcategory || '(no main category)'}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell className="text-green-600 text-sm font-medium">✅ Successfully created in database</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Rejected Items */}
                  {importResults.rejected && importResults.rejected.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-red-800">Rejected Categories</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Main Category</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Message</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importResults.rejected.map((item, index) => {
                              let message = item.error || 'Unknown error';
                              let statusColor = 'text-red-600';
                              let statusIcon = '❌';
                              
                              // Enhanced message customization based on error type and context
                              const errorLower = message.toLowerCase();
                              const categoryName = item.data?.subcategory || '';
                              const mainCategoryName = item.data?.category || '';
                              
                              if (errorLower.includes('already exists') || errorLower.includes('duplicate')) {
                                message = `⚠️ Category "${categoryName}" already exists`;
                                if (mainCategoryName) {
                                  message += ` in main category "${mainCategoryName}"`;
                                }
                                message += ' - Skipped to avoid duplicates';
                                statusColor = 'text-orange-600';
                                statusIcon = '⚠️';
                              } else if (errorLower.includes('required') || errorLower.includes('missing') || errorLower.includes('cannot be empty')) {
                                if (!categoryName || categoryName.trim() === '') {
                                  message = '❌ Category name is required and cannot be empty';
                                } else {
                                  message = `❌ Required field missing: ${message}`;
                                }
                                statusColor = 'text-red-600';
                                statusIcon = '❌';
                              } else if (errorLower.includes('validation') || errorLower.includes('invalid')) {
                                message = `❌ Invalid data format`;
                                if (categoryName) {
                                  message += ` for category "${categoryName}"`;
                                }
                                message += ` - ${message}`;
                                statusColor = 'text-red-600';
                                statusIcon = '❌';
                              } else if (errorLower.includes('empty') || errorLower.includes('blank')) {
                                message = '⚠️ Empty row detected - Skipped';
                                statusColor = 'text-gray-600';
                                statusIcon = '⚠️';
                              } else if (errorLower.includes('too long') || errorLower.includes('length')) {
                                message = `❌ Text too long`;
                                if (categoryName) {
                                  message += ` for category "${categoryName}"`;
                                }
                                message += ' - Maximum 255 characters allowed';
                                statusColor = 'text-red-600';
                                statusIcon = '❌';
                              } else if (errorLower.includes('special characters') || errorLower.includes('invalid characters')) {
                                message = `❌ Invalid characters detected`;
                                if (categoryName) {
                                  message += ` in category "${categoryName}"`;
                                }
                                message += ' - Only letters, numbers, spaces, and basic punctuation allowed';
                                statusColor = 'text-red-600';
                                statusIcon = '❌';
                              } else if (errorLower.includes('network') || errorLower.includes('connection')) {
                                message = '🌐 Network error - Please check your connection and try again';
                                statusColor = 'text-blue-600';
                                statusIcon = '🌐';
                              } else if (errorLower.includes('server') || errorLower.includes('internal')) {
                                message = '🔧 Server error - Please contact administrator';
                                statusColor = 'text-purple-600';
                                statusIcon = '🔧';
                              } else {
                                message = `❌ ${message}`;
                                statusColor = 'text-red-600';
                                statusIcon = '❌';
                              }
                              
                              return (
                                <TableRow key={index} className="hover:bg-gray-50">
                                  <TableCell className="text-sm font-mono">{item.row_number || index + 1}</TableCell>
                                  <TableCell className="text-sm">
                                    {item.data?.subcategory ? (
                                      <span className="font-medium">{item.data.subcategory}</span>
                                    ) : (
                                      <span className="text-gray-400 italic">(no main category)</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {item.data?.category ? (
                                      <span className="font-medium">{item.data.category}</span>
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
                  <Button variant="outline" onClick={handleExportResults} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Detailed Results
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={resetImportDialog}>
                {importResults ? 'Close' : 'Cancel'}
              </Button>
              
              {selectedFile && !importResults && (
                <Button 
                  onClick={handleBulkImport} 
                  disabled={importLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {importLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Import Categories
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && !dialogOpen && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {/* Categories Grid */}
      {/* Categories Display */}
      {!loading && (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Categories Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? 'No categories match your search criteria.' : 'Start by adding your first category.'}
                </p>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            ) : (
              filteredCategories.map(category => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Tag className="h-6 w-6 text-purple-500" />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id, category.subcategory)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">ID:</span>
                        <span className="font-mono font-medium text-blue-600">#{category.id}</span>
                      </div>
                      <h3 className="font-semibold text-lg text-foreground mb-1">
                        {category.subcategory}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Main Category: {category.category || 'None'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <CategoryListView />
        )
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </Button>

          <span className="text-sm text-muted-foreground px-3">
            Page {pagination.page} of {pagination.pages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;