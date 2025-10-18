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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import apiClient from '../utils/api';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { downloadCategoryTemplate, parseExcelFile, validateExcelFile, exportBulkResults } from '../utils/excelUtils';
import CategoryFormView from './CategoryFormView';

const CategoryManagement = ({ currentView = 'list', onViewChange, selectedItem = null }) => {
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
  const { handleError, handleSuccess } = useErrorHandler();

  const [formData, setFormData] = useState({
    category: '', // Main Category (English)
    category_ar: '', // Main Category (Arabic)
    subcategory: '', // Category Name (English)
    subcategory_ar: '', // Category Name (Arabic)
    parent_id: ''
  });

  const [existingMainCategories, setExistingMainCategories] = useState([]);
  const [loadingMainCategories, setLoadingMainCategories] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

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
          category: item.subcategory, // Main Category (English)
          category_ar: item.subcategory_ar, // Main Category (Arabic)
          subcategory: item.category, // Category Name (English)
          subcategory_ar: item.category_ar, // Category Name (Arabic)
          parent_id: null
        }));

        setCategories(transformedCategories);

        // Extract unique categories for dropdown
        const uniqueMainCategories = [...new Set(
          data.items
            .map(item => ({
              en: item.category,
              ar: item.category_ar
            }))
            .filter(category => category.en && category.en.trim() !== '')
        )];
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

  const loadMainCategoriesForDropdown = async (search = '') => {
    try {
      setLoadingMainCategories(true);

      const token = localStorage.getItem('authToken');
      if (!token) {
        return;
      }

      const params = {
        per_page: 100,
        page: 1
      };
      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await apiClient.getCategories(params);
      const data = response;

      if (data.items) {
        const uniqueMainCategories = [...new Set(
          data.items
            .map(item => ({
              en: item.category,
              ar: item.category_ar
            }))
            .filter(category => category.en && category.en.trim() !== '')
        )];

        setExistingMainCategories(uniqueMainCategories);
      } else {
        setExistingMainCategories([]);
      }
    } catch (error) {
      console.error('Error loading main categories for dropdown:', error);
      setExistingMainCategories([]);
    } finally {
      setLoadingMainCategories(false);
    }
  };

  const handleCategorySearch = (searchValue) => {
    setCategorySearchTerm(searchValue);
    clearTimeout(window.categorySearchTimeout);
    window.categorySearchTimeout = setTimeout(() => {
      loadMainCategoriesForDropdown(searchValue);
    }, 300);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({
      category: 'none',
      category_ar: '',
      subcategory: '',
      subcategory_ar: '',
      parent_id: ''
    });
    loadMainCategoriesForDropdown();
    setDialogOpen(true);
  };

  const openEditDialog = (category) => {
    setEditingCategory(category);
    setFormData({
      category: category.category || 'none',
      category_ar: category.category_ar || '',
      subcategory: category.subcategory || '',
      subcategory_ar: category.subcategory_ar || '',
      parent_id: category.parent_id || ''
    });
    loadMainCategoriesForDropdown();
    setDialogOpen(true);
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.subcategory.trim()) {
      errors.push('Category name (English) is required');
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

      // Auto-populate Arabic main category from selected dropdown option
      let selectedMainCategoryAr = null;
      if (formData.category !== 'none' && formData.category) {
        const selectedMainCat = existingMainCategories.find(cat => cat.en === formData.category);
        selectedMainCategoryAr = selectedMainCat?.ar || null;
      }

      const requestBody = {
        category: formData.subcategory.trim() || null, // Category Name (English)
        category_ar: formData.subcategory_ar.trim() || null, // Category Name (Arabic)
        subcategory: formData.category === 'none' ? null : formData.category.trim() || null, // Main Category (English)
        subcategory_ar: formData.category === 'none' ? null : selectedMainCategoryAr // Main Category (Arabic) - Auto-populated
      };

      if (editingCategory) {
        await apiClient.updateCategory(editingCategory.id, requestBody);
        handleSuccess('Category updated successfully!');
      } else {
        await apiClient.createCategory(requestBody);
        handleSuccess('Category created successfully!');
      }

      setFormData({
        category: 'none',
        category_ar: '',
        subcategory: '',
        subcategory_ar: '',
        parent_id: ''
      });
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

      let errorMessage = 'Failed to delete category';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      handleError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories;

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Bulk import functions - Updated for new fields
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

      const categories = await parseExcelFile(file);
      setPreviewData(categories.slice(0, 5));
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

      const categories = await parseExcelFile(selectedFile);

      const existingCategories = await apiClient.getCategories({ page: 1, limit: 1000 });
      const existingCategoriesSet = new Set();

      if (existingCategories.data) {
        existingCategories.data.forEach(cat => {
          const key = `${cat.category || ''}|${cat.subcategory || ''}`.toLowerCase();
          existingCategoriesSet.add(key);
        });
      }

      const validCategories = [];
      const rejectedItems = [];

      categories.forEach((category, index) => {
        const rowNumber = index + 2;
        let errorMessage = null;

        if (!category.category || category.category.trim() === '') {
          errorMessage = '❌ Category name (English) is required and cannot be empty';
        } else {
          const categoryKey = `${category.category || ''}|${category.subcategory}`.toLowerCase();

          if (existingCategoriesSet.has(categoryKey)) {
            errorMessage = '⚠️ Category already exists in database - skipped to avoid duplicates';
          } else {
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

      let backendResults = null;
      if (validCategories.length > 0) {
        try {
          backendResults = await apiClient.bulkCreateCategories(validCategories);
        } catch (error) {
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

      // Handle backend results...
      let backendRejectedItems = [];
      let backendSuccessItems = [];
      const actualRejectedItems = backendResults?.rejected_categories || backendResults?.rejected || [];

      if (actualRejectedItems && actualRejectedItems.length > 0) {
        actualRejectedItems.forEach(item => {
          const hasOnlyEmptyMainCategoryError = item.errors &&
            item.errors.length === 1 &&
            item.errors[0].includes("Category ''") &&
            item.errors[0].includes("is duplicated in this batch");

          if (hasOnlyEmptyMainCategoryError) {
            backendSuccessItems.push({
              id: `temp-${Date.now()}-${Math.random()}`,
              category: item.category_data?.category || '',
              category_ar: item.category_data?.category_ar || '',
              subcategory: item.category_data?.subcategory || '',
              subcategory_ar: item.category_data?.subcategory_ar || '',
              created_at: new Date().toISOString()
            });
          } else {
            backendRejectedItems.push(item);
          }
        });
      }

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
            let originalData = item.category_data || item.data;
            let errorMessage = '';
            let rowNumber = originalData?._rowNumber || (index + rejectedItems.length + 2);

            if (item.errors && Array.isArray(item.errors)) {
              const validErrors = item.errors.filter(err => !err.includes('_rowNumber: Unknown field'));
              if (validErrors.length > 0) {
                const categoryName = originalData?.subcategory || '';
                const mainCategoryName = originalData?.category || '';

                let translatedError = validErrors[0];

                if (translatedError.includes('already exists in database')) {
                  errorMessage = `⚠️ Category "${categoryName}"`;
                  if (mainCategoryName) {
                    errorMessage += ` with main category "${mainCategoryName}"`;
                  }
                  errorMessage += ` already exists in database - Skipped to avoid duplicates`;
                } else if (translatedError.includes('is duplicated in this batch')) {
                  if (translatedError.includes("Category ''")) {
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
                  errorMessage = `❌ ${translatedError}`;
                }
              } else {
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
              data: originalData || { category: '', category_ar: '', subcategory: 'Unknown item', subcategory_ar: '' },
              error: errorMessage,
              reason: errorMessage
            };
          })
        ]
      };

      setImportResults(finalResults);

      handleSuccess(`Import completed! ${finalResults.summary.added} categories added, ${finalResults.summary.rejected} rejected.`);

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

  // Handle view changes
  const handleAdd = () => {
    if (onViewChange) {
      onViewChange('add');
    } else {
      openAddDialog();
    }
  };

  const handleEdit = (category) => {
    if (onViewChange) {
      onViewChange('edit', category);
    } else {
      openEditDialog(category);
    }
  };

  const handleBack = () => {
    if (onViewChange) {
      onViewChange('list');
    }
  };

  const handleCategorySaved = () => {
    loadCategories(pagination.page, searchTerm);
  };

  // If we're in add or edit view, show the form view
  if (currentView === 'add' || currentView === 'edit') {
    return (
      <CategoryFormView
        onBack={handleBack}
        selectedCategory={currentView === 'edit' ? selectedItem : null}
        onCategorySaved={handleCategorySaved}
      />
    );
  }

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
              <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 gap-4">
                  {/* Category Name (English) - Required */}
                  <div>
                    <Label htmlFor="subcategory">Category Name (English) *</Label>
                    <Input
                      id="subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleInputChange}
                      placeholder="Enter category name in English"
                      className="mt-1"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This is the main category name and is required
                    </p>
                  </div>

                  {/* Category Name (Arabic) - Optional */}
                  <div>
                    <Label htmlFor="subcategory_ar">Category Name (Arabic)</Label>
                    <Input
                      id="subcategory_ar"
                      name="subcategory_ar"
                      value={formData.subcategory_ar}
                      onChange={handleInputChange}
                      placeholder="Enter category name in Arabic"
                      className="mt-1"
                      dir="rtl"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional Arabic translation for the category name
                    </p>
                  </div>

                  {/* Main Category (English) - Optional */}
                  <div>
                    <Label htmlFor="category">Main Category</Label>
                    <div className="mt-1">
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        onOpenChange={(isOpen) => {
                          if (isOpen) {
                            setCategorySearchTerm('');
                            loadMainCategoriesForDropdown();
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select main category or leave empty" />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="p-2 border-b">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
                              <Input
                                placeholder="Search categories..."
                                value={categorySearchTerm}
                                onChange={(e) => handleCategorySearch(e.target.value)}
                                className="pl-7 h-8 text-sm"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>

                          <SelectItem value="none">
                            <div className="flex flex-col">
                              <span className="font-medium">-- No Main Category --</span>
                              <span className="text-xs text-muted-foreground">This will be a top-level category</span>
                            </div>
                          </SelectItem>

                          {loadingMainCategories ? (
                            <SelectItem value="loading" disabled>
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading categories...
                              </div>
                            </SelectItem>
                          ) : existingMainCategories.length > 0 ? (
                            existingMainCategories.map((mainCat, index) => (
                              <SelectItem key={index} value={mainCat.en}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{mainCat.en}</span>
                                  {mainCat.ar && (
                                    <span className="text-sm text-muted-foreground" dir="rtl">{mainCat.ar}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-data" disabled>
                              <span className="text-muted-foreground">
                                {categorySearchTerm ? 'No categories found matching your search' : 'No main categories available'}
                              </span>
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Select an existing main category to create a subcategory. Arabic name will be automatically included if available.
                    </p>
                  </div>

                  {/* Display selected main category info if applicable */}
                  {formData.category !== 'none' && formData.category && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Selected Main Category:</h4>
                      <div className="space-y-1">
                        <div>
                          <span className="text-sm font-medium">English:</span> {formData.category}
                        </div>
                        {(() => {
                          const selectedCat = existingMainCategories.find(cat => cat.en === formData.category);
                          return selectedCat?.ar ? (
                            <div>
                              <span className="text-sm font-medium">Arabic:</span>
                              <span className="mr-2" dir="rtl">{selectedCat.ar}</span>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No Arabic translation available</div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
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

      {/* Import Dialog - Updated for new fields */}
      <Dialog open={importDialogOpen} onOpenChange={resetImportDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
                Download the Excel template with the following columns:
                <br />
                <strong>Main Category (English/Arabic):</strong> Optional
                <br />
                <strong>Category (English):</strong> Required field
                <br />
                <strong>Category (Arabic):</strong> Optional
              </p>
              <div className="ml-8">
                <Button variant="outline" onClick={handleDownloadTemplate} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
              </div>
            </div>

            {/* Updated Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-blue-900">📋 Instructions & Guidelines:</h4>
              <div className="space-y-3">
                <ul className="text-sm text-blue-800 space-y-1 ml-4">
                  <li>• <strong>Main Category (English/Arabic):</strong> Optional fields for parent category</li>
                  <li>• <strong>Category (English):</strong> Required field - main category name</li>
                  <li>• <strong>Category (Arabic):</strong> Optional Arabic translation</li>
                  <li>• Arabic fields support RTL text direction</li>
                  <li>• Save your Excel file after filling the data and upload it below</li>
                </ul>

                <div className="border-t border-blue-200 pt-3">
                  <div><strong className="text-red-700">⚠️ Categories will be rejected if:</strong></div>
                  <ul className="text-sm text-red-700 space-y-1 ml-4 mt-1">
                    <li>• Category name (English) is empty or missing</li>
                    <li>• Category already exists (duplicates are automatically skipped)</li>
                    <li>• Text exceeds 255 characters</li>
                    <li>• Contains invalid characters like &lt; &gt; " ' &amp;</li>
                    <li>• Row is completely empty</li>
                  </ul>
                </div>

                <div className="border-t border-blue-200 pt-3">
                  <div><strong className="text-green-700">✅ Tips for success:</strong></div>
                  <ul className="text-sm text-green-700 space-y-1 ml-4 mt-1">
                    <li>• Only Category (English) is required - all other fields are optional</li>
                    <li>• Arabic fields can be left empty if not needed</li>
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
                Upload your completed Excel file. Only the Category (English) column is required.
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

            {/* Step 3: Preview Data - Updated for new fields */}
            {previewData.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                  Preview Data
                </h3>
                <div className="ml-8">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Preview of first 5 rows:
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Main Category (EN)</TableHead>
                          <TableHead>Main Category (AR)</TableHead>
                          <TableHead>Category (EN)</TableHead>
                          <TableHead>Category (AR)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.subcategory || '(empty)'}</TableCell>
                            <TableCell dir="rtl">{item.subcategory_ar || '(empty)'}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell dir="rtl">{item.category_ar || '(empty)'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {/* Results section remains the same but with updated field displays */}
            {importResults && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    <CheckCircle className="w-4 h-4" />
                  </span>
                  Import Results
                </h3>
                <div className="ml-8 space-y-4">
                  {/* Summary remains the same */}
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
                  </div>

                  {/* Successfully Added Items - Updated table */}
                  {importResults.added && importResults.added.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 mb-4">
                      <h4 className="font-medium mb-3 text-green-800">Successfully Added Categories</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>ID</TableHead>
                              <TableHead>Main Category (EN)</TableHead>
                              <TableHead>Main Category (AR)</TableHead>
                              <TableHead>Category (EN)</TableHead>
                              <TableHead>Category (AR)</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importResults.added.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>#{item.id}</TableCell>
                                <TableCell>{item.subcategory || '(no main category)'}</TableCell>
                                <TableCell dir="rtl">{item.subcategory_ar || '(no main category)'}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell dir="rtl">{item.category_ar || '(not provided)'}</TableCell>
                                <TableCell className="text-green-600 text-sm font-medium">✅ Successfully created</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Rejected Items - Updated table */}
                  {importResults.rejected && importResults.rejected.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-medium mb-3 text-red-800">Rejected Categories</h4>
                      <div className="max-h-40 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Row</TableHead>
                              <TableHead>Main Category (EN)</TableHead>
                              <TableHead>Main Category (AR)</TableHead>
                              <TableHead>Category (EN)</TableHead>
                              <TableHead>Category (AR)</TableHead>
                              <TableHead>Message</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {importResults.rejected.map((item, index) => {
                              let message = item.error || 'Unknown error';
                              let statusColor = 'text-red-600';
                              let statusIcon = '❌';

                              const errorLower = message.toLowerCase();
                              const categoryName = item.data?.subcategory || '';

                              if (errorLower.includes('already exists') || errorLower.includes('duplicate')) {
                                message = `⚠️ Category "${categoryName}" already exists - Skipped to avoid duplicates`;
                                statusColor = 'text-orange-600';
                                statusIcon = '⚠️';
                              } else if (errorLower.includes('required') || errorLower.includes('missing') || errorLower.includes('cannot be empty')) {
                                if (!categoryName || categoryName.trim() === '') {
                                  message = '❌ Category name (English) is required and cannot be empty';
                                } else {
                                  message = `❌ Required field missing: ${message}`;
                                }
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
                                      <span className="text-gray-400 italic">(empty)</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm" dir="rtl">
                                    {item.data?.subcategory_ar ? (
                                      <span className="font-medium">{item.data.subcategory_ar}</span>
                                    ) : (
                                      <span className="text-gray-400 italic">(empty)</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {item.data?.category ? (
                                      <span className="font-medium">{item.data.category}</span>
                                    ) : (
                                      <span className="text-gray-400 italic">(empty)</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm" dir="rtl">
                                    {item.data?.category_ar ? (
                                      <span className="font-medium">{item.data.category_ar}</span>
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

                  <Button variant="outline" onClick={handleExportResults} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Detailed Results
                  </Button>
                </div>
              </div>
            )}

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

      {/* Categories Table View - Updated for new fields */}
      {!loading && (
        <Card className="glass-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Category (Arabic)</TableHead>
                  <TableHead>Main Category</TableHead>
                  <TableHead>Main Category (Arabic)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Categories Found</h3>
                      <p className="text-muted-foreground mb-6">
                        {searchTerm ? 'No categories match your search criteria.' : 'Start by adding your first category.'}
                      </p>
                      <Button onClick={openAddDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map(category => (
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
                      <TableCell dir="rtl">
                        <span className="text-muted-foreground">{category.subcategory_ar || 'None'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{category.category || 'None'}</span>
                      </TableCell>
                      <TableCell dir="rtl">
                        <span className="text-muted-foreground">{category.category_ar || 'None'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
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
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
    </div >
  );
};

export default CategoryManagement;