import React, { useState, useEffect } from 'react';
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

const AssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Form state matching API structure
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    description_en: '',
    description_ar: '',
    category: '',
    subcategory: '',
    value: '',
    quantity: 1,
    purchase_date: '',
    purchase_invoice: '',
    product_code: '',
    warehouse_id: '',
    is_active: true
  });

  useEffect(() => {
    loadAssets();
    loadWarehouses();
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

  const loadWarehouses = async () => {
    try {
      const response = await apiClient.getWarehouses();
      setWarehouses(response.items || []);
    } catch (error) {
      console.error('Error loading warehouses:', error);
      toast.error('Failed to load warehouses');
    }
  };

  const categories = [...new Set(assets.map(asset => asset.category))];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.name_ar.includes(searchTerm) ||
                         asset.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert form data to match API requirements
      const apiData = {
        ...formData,
        value: parseFloat(formData.value) || 0,
        quantity: parseInt(formData.quantity) || 1,
        warehouse_id: parseInt(formData.warehouse_id)
      };

      if (selectedAsset) {
        await apiClient.updateAsset(selectedAsset.id, apiData);
        toast.success('Asset updated successfully');
        setShowEditModal(false);
      } else {
        await apiClient.createAsset(apiData);
        toast.success('Asset created successfully');
        setShowAddModal(false);
      }
      loadAssets();
      resetForm();
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error('Failed to save asset');
    }
  };

  const handleEdit = (asset) => {
    setSelectedAsset(asset);
    setFormData({
      name_en: asset.name_en || '',
      name_ar: asset.name_ar || '',
      description_en: asset.description_en || '',
      description_ar: asset.description_ar || '',
      category: asset.category || '',
      subcategory: asset.subcategory || '',
      value: asset.value?.toString() || '',
      quantity: asset.quantity || 1,
      purchase_date: asset.purchase_date || '',
      purchase_invoice: asset.purchase_invoice || '',
      product_code: asset.product_code || '',
      warehouse_id: asset.warehouse_id?.toString() || '',
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
      const response = await apiClient.getAssetBarcode(asset.id);
      // Handle barcode response - could open a new window or download
      const barcodeWindow = window.open('', '_blank');
      barcodeWindow.document.write(`
        <html>
          <head><title>Barcode - ${asset.name_en}</title></head>
          <body style="text-align: center; padding: 20px;">
            <h3>${asset.name_en}</h3>
            <p>Product Code: ${response.product_code}</p>
            <img src="data:image/png;base64,${response.barcode_image}" alt="Barcode" />
          </body>
        </html>
      `);
      barcodeWindow.document.close();
    } catch (error) {
      console.error('Error generating barcode:', error);
      toast.error('Failed to generate barcode');
    }
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ar: '',
      description_en: '',
      description_ar: '',
      category: '',
      subcategory: '',
      value: '',
      quantity: 1,
      purchase_date: '',
      purchase_invoice: '',
      product_code: '',
      warehouse_id: '',
      is_active: true
    });
    setSelectedAsset(null);
  };

  const AssetForm = () => (
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category *</Label>
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="subcategory">Subcategory *</Label>
          <Input
            id="subcategory"
            name="subcategory"
            value={formData.subcategory}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product_code">Product Code *</Label>
          <Input
            id="product_code"
            name="product_code"
            value={formData.product_code}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="purchase_invoice">Purchase Invoice *</Label>
          <Input
            id="purchase_invoice"
            name="purchase_invoice"
            value={formData.purchase_invoice}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            name="value"
            type="number"
            step="0.01"
            value={formData.value}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleInputChange}
            min="1"
          />
        </div>
        <div>
          <Label htmlFor="purchase_date">Purchase Date *</Label>
          <Input
            id="purchase_date"
            name="purchase_date"
            type="date"
            value={formData.purchase_date}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="warehouse_id">Warehouse *</Label>
        <Select value={formData.warehouse_id} onValueChange={(value) => setFormData(prev => ({ ...prev, warehouse_id: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select warehouse" />
          </SelectTrigger>
          <SelectContent>
            {(warehouses || []).filter(warehouse => warehouse && warehouse.id).map(warehouse => (
              <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                {warehouse.name_en || warehouse.name_ar || 'Unnamed Warehouse'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="description_en">Description (English)</Label>
          <Textarea
            id="description_en"
            name="description_en"
            value={formData.description_en}
            onChange={handleInputChange}
            rows={3}
          />
        </div>
        <div>
          <Label htmlFor="description_ar">Description (Arabic)</Label>
          <Textarea
            id="description_ar"
            name="description_ar"
            value={formData.description_ar}
            onChange={handleInputChange}
            dir="rtl"
            rows={3}
          />
        </div>
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

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}>
          Cancel
        </Button>
        <Button type="submit" className="btn-primary">
          {selectedAsset ? 'Update Asset' : 'Create Asset'}
        </Button>
      </div>
    </form>
  );

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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
              </DialogHeader>
              <AssetForm />
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
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
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
                  <span className="font-medium">{asset.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Value:</span>
                  <span className="font-medium text-success">${parseFloat(asset.value).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{asset.quantity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Warehouse:</span>
                  <span className="font-medium">{asset.warehouse?.name_en || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(asset.purchase_date).toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-2">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <AssetForm />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetManagement;