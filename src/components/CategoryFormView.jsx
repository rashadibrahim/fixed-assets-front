import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import apiClient from '../utils/api';

const CategoryFormView = ({ onBack, selectedCategory = null, onCategorySaved }) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    category_ar: '',
    subcategory: '',
    subcategory_ar: ''
  });

  const isEditMode = Boolean(selectedCategory);

  useEffect(() => {
    if (selectedCategory) {
      setFormData({
        category: selectedCategory.subcategory || '',
        category_ar: selectedCategory.subcategory_ar || '',
        subcategory: selectedCategory.category || '',
        subcategory_ar: selectedCategory.category_ar || ''
      });
    }
  }, [selectedCategory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.category.trim()) errors.push('Main category (English) is required');
    if (!formData.category_ar.trim()) errors.push('Main category (Arabic) is required');
    if (!formData.subcategory.trim()) errors.push('Category name (English) is required');
    if (!formData.subcategory_ar.trim()) errors.push('Category name (Arabic) is required');
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

      const categoryData = {
        category: formData.category.trim(),
        category_ar: formData.category_ar.trim(),
        subcategory: formData.subcategory.trim(),
        subcategory_ar: formData.subcategory_ar.trim()
      };

      if (isEditMode) {
        await apiClient.updateCategory(selectedCategory.id, categoryData);
        handleSuccess('Category updated successfully');
      } else {
        await apiClient.createCategory(categoryData);
        handleSuccess('Category created successfully');
      }

      if (onCategorySaved) {
        onCategorySaved();
      }
      onBack();
    } catch (error) {
      handleError(error, `Failed to ${isEditMode ? 'update' : 'create'} category`);
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
            Back to Categories
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditMode ? 'Edit Category' : 'Add New Category'}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditMode ? 'Update the category information below' : 'Create a new category by filling in the required information'}
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
              
              {/* Left Column - Main Category */}
              <div className="space-y-4">
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Main Category</h2>
                    <p className="text-xs text-muted-foreground">Enter the main category name in both languages</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="category" className="text-sm font-medium">
                        Main Category (English) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter main category in English"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="category_ar" className="text-sm font-medium">
                        Main Category (Arabic) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="category_ar"
                        name="category_ar"
                        value={formData.category_ar}
                        onChange={handleInputChange}
                        dir="rtl"
                        required
                        placeholder="أدخل الفئة الرئيسية بالعربية"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Category Name */}
              <div className="space-y-4">
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Category Name</h2>
                    <p className="text-xs text-muted-foreground">Enter the category name in both languages</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="subcategory" className="text-sm font-medium">
                        Category Name (English) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="subcategory"
                        name="subcategory"
                        value={formData.subcategory}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter category name in English"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subcategory_ar" className="text-sm font-medium">
                        Category Name (Arabic) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="subcategory_ar"
                        name="subcategory_ar"
                        value={formData.subcategory_ar}
                        onChange={handleInputChange}
                        dir="rtl"
                        required
                        placeholder="أدخل اسم الفئة بالعربية"
                        className="h-10"
                      />
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
                    {isEditMode ? 'Update Category' : 'Create Category'}
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

export default CategoryFormView;
