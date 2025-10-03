import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader2,
  AlertCircle,
  Tag
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

  useEffect(() => {
    loadCategories();
  }, [pagination.page]);

  const loadCategories = async (page = pagination.page) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      if (!token) {
        handleError('Authentication required');
        return;
      }

      const response = await apiClient.getCategories({ per_page: 12, page });
      const data = response;

      if (data.items) {
        // Transform the API response to match component expectations
        const transformedCategories = data.items.map(item => ({
          id: item.id,
          category: item.category, // Main Category (optional)
          subcategory: item.subcategory, // Category Name (main display)
          description: '', // API doesn't provide description
          parent_id: null // API doesn't provide parent_id
        }));

        setCategories(transformedCategories);
        
        // Extract unique main categories for dropdown
        const uniqueMainCategories = [...new Set(
          data.items
            .map(item => item.category)
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
          cat.category?.toLowerCase() === formData.subcategory.trim().toLowerCase() && 
          (!editingCategory || cat.id !== editingCategory.id)
        );

        if (duplicateCategory) {
          handleError(`Category name "${formData.subcategory}" already exists`);
          return;
        }
      }

      const requestBody = {
        subcategory: formData.category.trim() === '__none__' ? null : formData.category.trim() || null, // Main Category (optional)
        category: formData.subcategory.trim() || null // Category Name (required)
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
      loadCategories();

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
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`${apiClient.baseURL}/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete category');
      }

      toast.success('Category deleted successfully');
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      const errorMessage = error.message || 'Failed to delete category';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.subcategory?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
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
                    <div className="font-semibold">{category.category}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{category.subcategory || 'None'}</span>
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
                      onClick={() => handleDelete(category.id, category.category)}
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
                          onClick={() => handleDelete(category.id, category.category)}
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
                        {category.category}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Main Category: {category.subcategory || 'None'}
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