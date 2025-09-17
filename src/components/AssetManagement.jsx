import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Filter,
  Download,
  Search,
  Calendar,
  DollarSign,
  AlertCircle,
  Upload,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiClient from '../utils/api';
import FileUpload from './FileUpload';
import { ViewToggle } from '@/components/ui/view-toggle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const AssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [assetFiles, setAssetFiles] = useState({});
  const [viewMode, setViewMode] = useState('grid');

  // Form state matching API structure
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    category_id: '',
    quantity: 1,
    product_code: '',
    is_active: true
  });

  useEffect(() => {
    loadAssets();
    loadCategories();
  }, []);

  const loadAssets = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        per_page: 10,
        ...(filterCategory !== 'all' && { category: filterCategory })
      };

      const response = await apiClient.getAssets(params);
      setAssets(response.items || []);
      setPagination({
        page: response.page || 1,
        pages: response.pages || 1,
        total: response.total || 0
      });
    } catch (error) {
      console.error('Error loading assets:', error);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      setCategories(response.items || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.category : 'Unknown Category';
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
<<<<<<< HEAD
      asset.name_ar.includes(searchTerm) ||
      asset.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
=======
                         asset.name_ar.includes(searchTerm) ||
                         getCategoryName(asset.category_id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || asset.category_id?.toString() === filterCategory;
    return matchesSearch && matchesCategory;
>>>>>>> f215cb518f142ad9908c77c6167b5d4028b7be6c
  });

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    console.log('Input changed:', name, '=', newValue);
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  }, []);

  const handleCategoryChange = (categoryId) => {
    const selectedCategory = categories.find(cat => cat.id.toString() === categoryId);
    console.log('Selected category:', selectedCategory);
    setFormData(prev => ({
      ...prev,
      category_id: categoryId
    }));
  };

  const handleCancel = useCallback(() => {
    setShowAddModal(false);
    setShowEditModal(false);
    resetForm();
  }, []);

  const validateProductCode = (code) => {
    const numericCode = code.replace(/\D/g, '');
    if (numericCode.length < 6 || numericCode.length > 11) {
      toast.error('Product code must be 6-11 digits only');
      return false;
    }
    return numericCode;
  };

  const handleProductCodeChange = (e) => {
    const { value } = e.target;
    // Only allow numeric input
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 11) {
      setFormData(prev => ({
        ...prev,
        product_code: numericValue
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Debug: Log current form data
      console.log('Current form data:', formData);

      // Validate required fields according to API schema
      const requiredFields = [
<<<<<<< HEAD
        'name_en', 'name_ar', 'category', 'subcategory',
        'product_code', 'purchase_invoice', 'purchase_date', 'warehouse_id'
=======
        'name_en', 'name_ar', 'category_id'
>>>>>>> f215cb518f142ad9908c77c6167b5d4028b7be6c
      ];

      for (const field of requiredFields) {
        if (!formData[field] || formData[field].toString().trim() === '') {
          console.log(`Validation failed for field: ${field}, value:`, formData[field]);
          toast.error(`${field.replace('_', ' ')} is required`);
          return;
        }
      }

      // Validate product code format if provided
      if (formData.product_code && formData.product_code.trim()) {
        const validatedProductCode = validateProductCode(formData.product_code);
        if (!validatedProductCode) {
          return;
        }
      }

      setLoading(true);

      // Transform the data to match backend expectations - ONLY SUPPORTED FIELDS
      const assetData = {
        name_en: formData.name_en.trim(),
        name_ar: formData.name_ar.trim(),
        category_id: parseInt(formData.category_id)
      };

      // Add optional fields that are supported by backend
      if (formData.quantity && parseInt(formData.quantity) > 0) {
        assetData.quantity = parseInt(formData.quantity);
      }
      
      if (formData.product_code && formData.product_code.trim()) {
        assetData.product_code = formData.product_code.trim();
      }
      
      if (formData.is_active !== undefined) {
        assetData.is_active = formData.is_active;
      }

      console.log('Sending minimal asset data:', assetData);
      console.log('Original form data:', formData);

      if (selectedAsset) {
        await apiClient.updateAsset(selectedAsset.id, assetData);
        toast.success('Asset updated successfully');
        setShowEditModal(false);
      } else {
        const result = await apiClient.createAsset(assetData);
        console.log('Asset saved:', result);
        toast.success('Asset created successfully');
        setShowAddModal(false);
      }

      loadAssets();
      resetForm();
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error(`Failed to save asset: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (asset) => {
    setSelectedAsset(asset);
    setFormData({
      name_en: asset.name_en || '',
      name_ar: asset.name_ar || '',
      category_id: asset.category_id?.toString() || '',
      quantity: asset.quantity || 1,
      product_code: asset.product_code || '',
      is_active: asset.is_active !== undefined ? asset.is_active : true
    });
    setShowEditModal(true);
  };

  const handleDelete = async (asset) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await apiClient.deleteAsset(asset.id);
        toast.success('Asset deleted successfully');
        loadAssets();
      } catch (error) {
        console.error('Error deleting asset:', error);
        toast.error('Failed to delete asset');
      }
    }
  };

  const handleGenerateBarcode = async (asset) => {
    try {
<<<<<<< HEAD
      const response = await apiClient.getAssetBarcode(asset.id);
      // Handle barcode response - could open a new window or download
      const barcodeWindow = window.open('', '_blank');
=======
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
        width: 300,
        height: 100
      });
      
      // Create a new window to display the barcode
      const barcodeWindow = window.open('', '_blank', 'width=600,height=500');
>>>>>>> f215cb518f142ad9908c77c6167b5d4028b7be6c
      barcodeWindow.document.write(`
        <html>
<<<<<<< HEAD
          <head><title>Barcode - ${asset.name_en}</title></head>
          <body style="text-align: center; padding: 20px;">
            <h3>${asset.name_en}</h3>
            <p>Product Code: ${response.product_code}</p>
            <img src="data:image/png;base64,${response.barcode_image}" alt="Barcode" />
=======
          <head>
            <title>Barcode - ${asset.name_en || asset.name_ar}</title>
            <style>
              body {
                font-family: 'Arial', sans-serif;
                text-align: center;
                padding: 20px;
                margin: 0;
                background: white;
              }
              .barcode-container {
                max-width: 400px;
                margin: 0 auto;
                border: 2px solid #333;
                padding: 30px;
                border-radius: 8px;
                background: white;
              }
              .asset-name {
                margin-bottom: 20px;
                font-size: 18px;
                font-weight: bold;
                color: #333;
                text-transform: uppercase;
                word-wrap: break-word;
              }
              .barcode-image {
                margin: 20px 0;
                background: white;
                padding: 10px;
                border: 1px solid #ddd;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              .barcode-image img {
                width: 100%;
                height: auto;
                max-width: 300px;
                max-height: 100px;
              }
              .barcode-number {
                font-family: 'Courier New', monospace;
                font-size: 16px;
                font-weight: bold;
                color: #000;
                margin-top: 10px;
                letter-spacing: 2px;
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
                .no-print { display: none; }
                .barcode-container { 
                  border: none; 
                  max-width: none;
                  padding: 10px;
                }
                body { 
                  padding: 0; 
                  font-size: 12pt;
                }
                .asset-name {
                  font-size: 14pt;
                  margin-bottom: 15px;
                }
                .barcode-number {
                  font-size: 12pt;
                }
                .barcode-image {
                  border: none;
                  padding: 5px;
                }
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <div class="asset-name">
                ${asset.name_en || asset.name_ar || 'Unnamed Asset'}
              </div>
              <div class="barcode-image">
                <img src="data:image/png;base64,${response.barcode_image}" alt="Barcode" />
              </div>
              <div class="barcode-number">
                ${response.product_code || paddedCode}
              </div>
              <div class="buttons no-print">
                <button class="btn" onclick="window.print()">Print Barcode</button>
                <button class="btn btn-secondary" onclick="window.close()">Close</button>
              </div>
            </div>
>>>>>>> f215cb518f142ad9908c77c6167b5d4028b7be6c
          </body>
        </html>
      `);
      barcodeWindow.document.close();
    } catch (error) {
      console.error('Error generating barcode:', error);
      toast.error('Failed to generate barcode');
    }
  };

  const AssetListView = () => (
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
  );

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ar: '',
      category_id: '',
      quantity: 1,
      product_code: '',
      is_active: true
    });
    setSelectedAsset(null);
  };

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
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name_en">Name (English) *</Label>
                    <Input
                      id="name_en"
                      name="name_en"
                      value={formData.name_en}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name_ar">Name (Arabic) *</Label>
                    <Input
                      id="name_ar"
                      name="name_ar"
                      value={formData.name_ar}
                      onChange={handleInputChange}
                      dir="rtl"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="category_id">Category *</Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={handleCategoryChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Need a new category? Go to Category Management to add one.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="product_code">Product Code (6-11 digits)</Label>
                    <Input
                      id="product_code"
                      name="product_code"
                      value={formData.product_code}
                      onChange={handleProductCodeChange}
                      placeholder="Enter 6-11 digit code"
                      maxLength="11"
                      pattern="[0-9]{6,11}"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Numbers only, 6-11 digits (will be auto-formatted for barcode)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="1"
                      placeholder="1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="rounded"
                    />
                    <Label htmlFor="is_active">Active Asset</Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-primary">
                    {selectedAsset ? 'Update Asset' : 'Create Asset'}
                  </Button>
                </div>
              </form>
              </div>
            </DialogContent>
          </Dialog>
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
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.category}>{category.category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map(asset => (
            <Card key={asset.id} className="glass-card hover:shadow-primary transition-smooth">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className={asset.is_active ? 'status-active' : 'status-inactive'}>
                    {asset.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground text-lg">{asset.name_en}</h3>
                  <p className="text-sm text-muted-foreground">{asset.name_ar}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{getCategoryName(asset.category_id)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span className="font-medium">{asset.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Product Code:</span>
                    <span className="font-medium font-mono">{asset.product_code}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center space-x-2">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <AssetListView />
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => loadAssets(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          <Button
            variant="outline"
            onClick={() => loadAssets(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
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

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name_en">Name (English) *</Label>
                  <Input
                    id="edit_name_en"
                    name="name_en"
                    value={formData.name_en}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_name_ar">Name (Arabic) *</Label>
                  <Input
                    id="edit_name_ar"
                    name="name_ar"
                    value={formData.name_ar}
                    onChange={handleInputChange}
                    dir="rtl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="edit_category_id">Category *</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_product_code">Product Code (6-11 digits)</Label>
                  <Input
                    id="edit_product_code"
                    name="product_code"
                    value={formData.product_code}
                    onChange={handleProductCodeChange}
                    placeholder="Enter 6-11 digit code"
                    maxLength="11"
                    pattern="[0-9]{6,11}"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Numbers only, 6-11 digits (will be auto-formatted for barcode)
                  </p>
                </div>
                <div>
                  <Label htmlFor="edit_quantity">Quantity</Label>
                  <Input
                    id="edit_quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <Label htmlFor="edit_is_active">Active Asset</Label>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  {selectedAsset ? 'Update Asset' : 'Create Asset'}
                </Button>
              </div>
            </form>

            {/* File Upload Section - only show when editing an existing asset */}
            {selectedAsset && (
              <div className="mt-6 pt-6 border-t border-border">
                <FileUpload
                  assetId={selectedAsset.id}
                  files={assetFiles[selectedAsset.id] || selectedAsset.attached_files || []}
                  onFileUploaded={(response) => handleFileUploaded(selectedAsset.id, response)}
                  onFileDeleted={(fileId) => handleFileDeleted(selectedAsset.id, fileId)}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetManagement;