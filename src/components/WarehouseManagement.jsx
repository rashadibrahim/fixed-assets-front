import React, { useState, useEffect } from 'react';
import { 
  Warehouse, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin,
  Package,
  Building,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import apiClient from '../utils/api';

const WarehouseManagement = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    address_en: '',
    address_ar: '',
    branch_id: ''
  });

  useEffect(() => {
    console.log('WarehouseManagement component mounted');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading warehouses and branches from API...');
      
      // Initialize with empty arrays to prevent undefined errors
      setWarehouses([]);
      setBranches([]);
      
      const [warehousesResponse, branchesResponse] = await Promise.all([
        apiClient.getWarehouses().catch(err => {
          console.warn('Failed to load warehouses:', err);
          return { data: [] };
        }),
        apiClient.getBranches().catch(err => {
          console.warn('Failed to load branches:', err);
          return { data: [] };
        })
      ]);
      
      // Handle different response formats from API
      const warehousesData = warehousesResponse?.items || warehousesResponse?.data || warehousesResponse || [];
      const branchesData = branchesResponse?.items || branchesResponse?.data || branchesResponse || [];
      
      setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
      setBranches(Array.isArray(branchesData) ? branchesData : []);
      
      console.log('Successfully loaded warehouses:', warehousesData.length, 'branches:', branchesData.length);
    } catch (error) {
      console.error('Error loading warehouses and branches:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Cannot connect to server')) {
        setError('Cannot connect to the backend server. Please ensure the API server is running on http://localhost:5000');
      } else {
        setError(`Failed to load data: ${error.message}`);
      }
      
      setWarehouses([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingWarehouse(null);
    setFormData({
      name_en: '',
      name_ar: '',
      address_en: '',
      address_ar: '',
      branch_id: ''
    });
    setDialogOpen(true);
  };

  const openEditDialog = (warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name_en: warehouse.name_en || '',
      name_ar: warehouse.name_ar || '',
      address_en: warehouse.address_en || '',
      address_ar: warehouse.address_ar || '',
      branch_id: warehouse.branch_id ? warehouse.branch_id.toString() : ''
    });
    setDialogOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, '=', value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // Debug: Log current form data
      console.log('Current form data:', formData);
      
      // Validate required fields according to API (name_ar is required)
      if (!formData.name_ar.trim()) {
        toast.error('Arabic name is required');
        return;
      }
      if (!formData.branch_id) {
        toast.error('Branch selection is required');
        return;
      }

      setLoading(true);

      // Prepare the data according to API schema - only send non-empty values
      const warehouseData = {
        name_ar: formData.name_ar.trim(), // Required field
        branch_id: parseInt(formData.branch_id) // Required as integer
      };

      // Add optional fields only if they have values
      if (formData.name_en.trim()) {
        warehouseData.name_en = formData.name_en.trim();
      }
      if (formData.address_ar.trim()) {
        warehouseData.address_ar = formData.address_ar.trim();
      }
      if (formData.address_en.trim()) {
        warehouseData.address_en = formData.address_en.trim();
      }

      console.log('Sending warehouse data:', warehouseData);

      if (editingWarehouse) {
        // Update existing warehouse
        await apiClient.updateWarehouse(editingWarehouse.id, warehouseData);
        toast.success('Warehouse updated successfully!');
      } else {
        // Create new warehouse
        await apiClient.createWarehouse(warehouseData);
        toast.success('Warehouse created successfully!');
      }

      setDialogOpen(false);
      // Reset form
      setFormData({
        name_en: '',
        name_ar: '',
        address_en: '',
        address_ar: '',
        branch_id: ''
      });
      setEditingWarehouse(null);
      loadData(); // Reload the data
    } catch (error) {
      console.error('Error saving warehouse:', error);
      toast.error(`Failed to save warehouse: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (warehouseId) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.deleteWarehouse(warehouseId);
      toast.success('Warehouse deleted successfully!');
      loadData(); // Reload the data
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      toast.error(`Failed to delete warehouse: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouses = (warehouses || []).filter(warehouse => {
    if (!warehouse) return false;
    
    const matchesSearch = !searchTerm || 
      warehouse.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.name_ar?.includes(searchTerm) ||
      warehouse.address_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.address_ar?.includes(searchTerm);
    
    const matchesBranch = !selectedBranch || selectedBranch === 'all' || warehouse.branch_id === selectedBranch;
    
    return matchesSearch && matchesBranch;
  });

  const getBranchName = (branchId) => {
    if (!branches || !Array.isArray(branches)) return 'Unknown Branch';
    const branch = branches.find(b => b && b.id === branchId);
    return branch?.name_en || branch?.name_ar || 'Unknown Branch';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading warehouses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Warehouses</h1>
          <p className="text-muted-foreground">Manage storage locations and inventory</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Warehouse
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              {loading ? 'Retrying...' : 'Retry'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 items-center">
        <div className="max-w-md flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {(branches || []).filter(branch => branch && branch.id).map(branch => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name_en || branch.name_ar || 'Unnamed Branch'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWarehouses.map(warehouse => (
          <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Warehouse className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(warehouse)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(warehouse.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {warehouse.name_en || warehouse.name_ar || 'Unnamed Warehouse'}
                </h3>
                {warehouse.name_ar && warehouse.name_en && (
                  <p className="text-sm text-muted-foreground" dir="rtl">{warehouse.name_ar}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{getBranchName(warehouse.branch_id)}</span>
                </div>
                
                {(warehouse.address_en || warehouse.address_ar) && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="text-sm">
                      {warehouse.address_en && <p>{warehouse.address_en}</p>}
                      {warehouse.address_ar && (
                        <p dir="rtl" className="text-muted-foreground">{warehouse.address_ar}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {(warehouse.description_en || warehouse.description_ar) && (
                  <div className="flex items-start space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="text-sm">
                      {warehouse.description_en && <p>{warehouse.description_en}</p>}
                      {warehouse.description_ar && (
                        <p dir="rtl" className="text-muted-foreground">{warehouse.description_ar}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && filteredWarehouses.length === 0 && (
        <div className="text-center py-12">
          <Warehouse className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Warehouses Found</h3>
          <p className="text-muted-foreground mb-6">
            {warehouses.length === 0 
              ? 'Start by adding your first warehouse.' 
              : 'No warehouses match your search criteria.'
            }
          </p>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name_ar">Name (Arabic) *</Label>
                <Input
                  id="name_ar"
                  name="name_ar"
                  value={formData.name_ar}
                  onChange={handleInputChange}
                  required
                  dir="rtl"
                  placeholder="أدخل اسم المستودع"
                />
              </div>
              <div>
                <Label htmlFor="name_en">Name (English)</Label>
                <Input
                  id="name_en"
                  name="name_en"
                  value={formData.name_en}
                  onChange={handleInputChange}
                  placeholder="Enter warehouse name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="branch_id">Branch *</Label>
              <Select 
                value={formData.branch_id.toString()} 
                onValueChange={(value) => {
                  console.log('Branch selected:', value);
                  setFormData(prev => ({ ...prev, branch_id: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {(branches || []).filter(branch => branch && branch.id).map(branch => (
                    <SelectItem key={branch.id} value={branch.id.toString()}>
                      {branch.name_en || branch.name_ar || 'Unnamed Branch'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address_ar">Address (Arabic)</Label>
                <Textarea
                  id="address_ar"
                  name="address_ar"
                  value={formData.address_ar}
                  onChange={handleInputChange}
                  rows={3}
                  dir="rtl"
                  placeholder="أدخل عنوان المستودع"
                />
              </div>
              <div>
                <Label htmlFor="address_en">Address (English)</Label>
                <Textarea
                  id="address_en"
                  name="address_en"
                  value={formData.address_en}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter warehouse address"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : editingWarehouse ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehouseManagement;
