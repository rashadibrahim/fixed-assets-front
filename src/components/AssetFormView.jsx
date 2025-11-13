import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import apiClient from '../utils/api';

const AssetFormView = ({ onBack, selectedAsset = null, onAssetSaved }) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    category_id: '',
    product_code: '',
    is_active: true
  });

  const isEditMode = Boolean(selectedAsset);

  const loadCategories = async () => {
    try {
      const response = await apiClient.getCategories();
      const categoriesData = response.items || response || [];
      // Ensure it's always an array
      const categoriesArray = Array.isArray(categoriesData) ? categoriesData : [];
      setCategories(categoriesArray);
      setCategoriesLoaded(true);
      return categoriesArray;
    } catch (error) {
      console.error('Error loading categories:', error);
      handleError('Failed to load categories');
      setCategories([]);
      setCategoriesLoaded(true);
      return [];
    }
  };

  useEffect(() => {
    const initializeForm = async () => {
      // Load categories first
      const loadedCategories = await loadCategories();
      
      // Then set form data if editing
      if (selectedAsset) {
        const categoryId = selectedAsset.category_id?.toString() || '';
        
        // Verify the category exists in loaded categories
        if (categoryId && loadedCategories.length > 0) {
          const categoryExists = loadedCategories.some(cat => cat.id.toString() === categoryId);
          console.log('Setting category_id:', categoryId, 'Exists:', categoryExists);
        }
        
        setFormData({
          name_en: selectedAsset.name_en || '',
          name_ar: selectedAsset.name_ar || '',
          category_id: categoryId,
          product_code: selectedAsset.product_code || '',
          is_active: selectedAsset.is_active !== undefined ? selectedAsset.is_active : true
        });
      }
    };
    
    initializeForm();
  }, [selectedAsset]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category_id: categoryId
    }));
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

  const validateForm = () => {
    const errors = [];

    if (!formData.name_en.trim()) {
      errors.push('English name is required');
    }
    if (!formData.name_ar.trim()) {
      errors.push('Arabic name is required');
    }
    if (!formData.category_id) {
      errors.push('Category is required');
    }
    if (formData.product_code && (formData.product_code.length < 6 || formData.product_code.length > 11)) {
      errors.push('Product code must be 6-11 digits');
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

      const assetData = {
        name_en: formData.name_en.trim(),
        name_ar: formData.name_ar.trim(),
        is_active: formData.is_active,
        category_id: parseInt(formData.category_id)
      };

      if (formData.product_code && formData.product_code.trim()) {
        assetData.product_code = formData.product_code.trim();
      }

      if (isEditMode) {
        await apiClient.updateAsset(selectedAsset.id, assetData);
        handleSuccess('Asset updated successfully');
      } else {
        // Use bulk creation endpoint as workaround
        const categories = await apiClient.getCategories();
        const selectedCategory = categories.items?.find(cat => cat.id === parseInt(formData.category_id));
        
        if (!selectedCategory) {
          throw new Error('Invalid category selected');
        }

        const bulkAssetData = {
          ...assetData,
          category: selectedCategory.category
        };
        delete bulkAssetData.category_id;

        const result = await apiClient.bulkCreateAssets([bulkAssetData]);
        
        if (result && result.summary && result.summary.successfully_added > 0) {
          handleSuccess('Asset created successfully');
        } else {
          const errors = result?.rejected_assets?.[0]?.errors || ['Unknown error occurred'];
          throw new Error(errors.join(', '));
        }
      }

      if (onAssetSaved) {
        onAssetSaved();
      }
      onBack();
    } catch (error) {
      handleError(error, `Failed to ${isEditMode ? 'update' : 'create'} asset`);
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
            Back to Assets
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditMode ? 'Edit Asset' : 'Add New Asset'}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditMode ? 'Update the asset information below' : 'Create a new fixed asset by filling in the required information'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content - No scroll, fit to screen */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            {/* Form Fields - Takes available space */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Left Column */}
              <div className="space-y-4">
                {/* Basic Information Card */}
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Basic Information</h2>
                    <p className="text-xs text-muted-foreground">Enter the asset name in both languages</p>
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
                        required
                        placeholder="Enter asset name in English"
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
                        required
                        placeholder="أدخل اسم الأصل بالعربية"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Card */}
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Status</h2>
                    <p className="text-xs text-muted-foreground">Set the asset's availability status</p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                      <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <div>
                        <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                          Active Asset
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Active assets are available for transactions
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Category & Product Code Card */}
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Classification</h2>
                    <p className="text-xs text-muted-foreground">Categorize the asset and assign a product code</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="category_id" className="text-sm font-medium">
                        Category <span className="text-destructive">*</span>
                      </Label>
                      {!categoriesLoaded ? (
                        <div className="h-10 flex items-center justify-center border border-input rounded-md bg-muted">
                          <span className="text-sm text-muted-foreground">Loading categories...</span>
                        </div>
                      ) : (
                        <Select
                          value={formData.category_id}
                          onValueChange={handleCategoryChange}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.length > 0 ? (
                              categories.map((category) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.category}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-categories" disabled>
                                No categories available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Choose from existing categories
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="product_code" className="text-sm font-medium">
                        Product Code (Optional)
                      </Label>
                      <Input
                        id="product_code"
                        name="product_code"
                        value={formData.product_code}
                        onChange={handleProductCodeChange}
                        placeholder="6-11 digits"
                        maxLength="11"
                        pattern="[0-9]{6,11}"
                        className="h-10"
                      />
                      <p className="text-xs text-muted-foreground">
                        Numbers only, 6-11 digits for barcode
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
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
                    {isEditMode ? 'Update Asset' : 'Create Asset'}
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

export default AssetFormView;