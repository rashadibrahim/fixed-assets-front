import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import apiClient from '../utils/api';

const WarehouseFormView = ({ onBack, selectedWarehouse = null, onWarehouseSaved }) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    address_en: '',
    address_ar: '',
    branch_id: ''
  });

  const isEditMode = Boolean(selectedWarehouse);

  useEffect(() => {
    loadBranches();
    
    if (selectedWarehouse) {
      setFormData({
        name_en: selectedWarehouse.name_en || '',
        name_ar: selectedWarehouse.name_ar || '',
        address_en: selectedWarehouse.address_en || '',
        address_ar: selectedWarehouse.address_ar || '',
        branch_id: selectedWarehouse.branch_id?.toString() || ''
      });
    }
  }, [selectedWarehouse]);

  const loadBranches = async () => {
    try {
      const response = await apiClient.getBranches({ per_page: 100 });
      const branchesData = response?.items || response?.data || response || [];
      setBranches(Array.isArray(branchesData) ? branchesData : []);
    } catch (error) {
      console.error('Error loading branches:', error);
      handleError('Failed to load branches');
      setBranches([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBranchChange = (branchId) => {
    setFormData(prev => ({
      ...prev,
      branch_id: branchId
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.name_en.trim() && !formData.name_ar.trim()) {
      errors.push('Please provide at least one warehouse name (English or Arabic)');
    }
    if (!formData.branch_id) {
      errors.push('Please select a branch');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      handleError(errors.join('. '));
      return;
    }

    try {
      setLoading(true);

      const warehouseData = {
        name_en: formData.name_en.trim(),
        name_ar: formData.name_ar.trim(),
        address_en: formData.address_en.trim(),
        address_ar: formData.address_ar.trim(),
        branch_id: parseInt(formData.branch_id)
      };

      if (isEditMode) {
        await apiClient.updateWarehouse(selectedWarehouse.id, warehouseData);
        handleSuccess('Warehouse updated successfully');
      } else {
        await apiClient.createWarehouse(warehouseData);
        handleSuccess('Warehouse created successfully');
      }

      if (onWarehouseSaved) {
        onWarehouseSaved();
      }
      onBack();
    } catch (error) {
      handleError(error, `Failed to ${isEditMode ? 'update' : 'create'} warehouse`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Header */}
      <div className="flex-shrink-0 bg-background border-b border-border">
        <div className="px-6 py-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Warehouses
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditMode ? 'Edit Warehouse' : 'Add New Warehouse'}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditMode ? 'Update the warehouse information below' : 'Create a new warehouse by filling in the required information'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Left Column - Names & Branch */}
              <div className="space-y-4">
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Warehouse Name</h2>
                    <p className="text-xs text-muted-foreground">Enter the warehouse name in both languages</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name_en" className="text-sm font-medium">
                        Name (English) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name_en"
                        name="name_en"
                        value={formData.name_en}
                        onChange={handleInputChange}
                        placeholder="Enter warehouse name in English"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="name_ar" className="text-sm font-medium">
                        Name (Arabic) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name_ar"
                        name="name_ar"
                        value={formData.name_ar}
                        onChange={handleInputChange}
                        dir="rtl"
                        placeholder="أدخل اسم المستودع بالعربية"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="branch_id" className="text-sm font-medium">
                        Branch <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={formData.branch_id}
                        onValueChange={handleBranchChange}
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select a branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(branches) && branches.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id.toString()}>
                              {branch.name_en || branch.name_ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Addresses */}
              <div className="space-y-4">
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Address</h2>
                    <p className="text-xs text-muted-foreground">Enter the warehouse address (optional)</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="address_en" className="text-sm font-medium">
                        Address (English)
                      </Label>
                      <Textarea
                        id="address_en"
                        name="address_en"
                        value={formData.address_en}
                        onChange={handleInputChange}
                        placeholder="Enter address in English"
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="address_ar" className="text-sm font-medium">
                        Address (Arabic)
                      </Label>
                      <Textarea
                        id="address_ar"
                        name="address_ar"
                        value={formData.address_ar}
                        onChange={handleInputChange}
                        dir="rtl"
                        placeholder="أدخل العنوان بالعربية"
                        className="min-h-[100px] resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 mt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onBack} disabled={loading} size="lg">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} size="lg" className="min-w-[140px]">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Warehouse' : 'Create Warehouse'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WarehouseFormView;
