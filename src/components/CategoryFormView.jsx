import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Search, Loader2 } from 'lucide-react';
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

  const [existingMainCategories, setExistingMainCategories] = useState([]);
  const [loadingMainCategories, setLoadingMainCategories] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  const isEditMode = Boolean(selectedCategory);

  useEffect(() => {
    if (selectedCategory) {
      // Map the display data correctly:
      // selectedCategory.category → Category Name (English) 
      // selectedCategory.subcategory → Main Category (English)
      setFormData({
        category: selectedCategory.category || '', // Category Name (English)
        category_ar: selectedCategory.category_ar || '', // Category Name (Arabic)
        subcategory: selectedCategory.subcategory || '', // Main Category (English)
        subcategory_ar: selectedCategory.subcategory_ar || '' // Main Category (Arabic)
      });
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadMainCategoriesForDropdown();
  }, []);

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
      }
    } catch (error) {
      console.error('Failed to load main categories:', error);
    } finally {
      setLoadingMainCategories(false);
    }
  };

  const handleCategorySearch = (value) => {
    setCategorySearchTerm(value);
    loadMainCategoriesForDropdown(value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.category.trim()) errors.push('Category name (English) is required');
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

      // Auto-populate Arabic main category from selected dropdown option
      let selectedMainCategoryAr = null;
      if (formData.subcategory !== 'none' && formData.subcategory) {
        const selectedMainCat = existingMainCategories.find(cat => cat.en === formData.subcategory);
        selectedMainCategoryAr = selectedMainCat?.ar || null;
      }

      // Backend expects:
      // category → Category Name (English)
      // category_ar → Category Name (Arabic)
      // subcategory → Main Category (English)
      // subcategory_ar → Main Category (Arabic)
      const categoryData = {
        category: formData.category.trim() || null, // Category Name (English)
        category_ar: formData.category_ar.trim() || null, // Category Name (Arabic)
        subcategory: formData.subcategory === 'none' ? null : formData.subcategory.trim() || null, // Main Category (English)
        subcategory_ar: formData.subcategory === 'none' ? null : selectedMainCategoryAr // Main Category (Arabic) - Auto-populated
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
            <div className="flex-1 space-y-4">
              
              {/* Category Name Section */}
              <div className="bg-background rounded-lg border border-border shadow-sm">
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="text-base font-semibold text-foreground">Category Information</h2>
                  <p className="text-xs text-muted-foreground">Enter the category details</p>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category Name (English) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter category name in English"
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      This is the main category name and is required
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="category_ar" className="text-sm font-medium">
                      Category Name (Arabic)
                    </Label>
                    <Input
                      id="category_ar"
                      name="category_ar"
                      value={formData.category_ar}
                      onChange={handleInputChange}
                      dir="rtl"
                      placeholder="Enter category name in Arabic"
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional Arabic translation for the category name
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subcategory" className="text-sm font-medium">
                      Main Category
                    </Label>
                    <Select
                      value={formData.subcategory}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
                      onOpenChange={(isOpen) => {
                        if (isOpen) {
                          setCategorySearchTerm('');
                          loadMainCategoriesForDropdown();
                        }
                      }}
                    >
                      <SelectTrigger className="h-10">
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
                    <p className="text-xs text-muted-foreground">
                      Optional: Select an existing main category to create a subcategory. Arabic name will be automatically included if available.
                    </p>
                  </div>

                  {/* Display selected main category info if applicable */}
                  {formData.subcategory !== 'none' && formData.subcategory && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Selected Main Category:</h4>
                      <div className="space-y-1">
                        <div>
                          <span className="text-sm font-medium">English:</span> {formData.subcategory}
                        </div>
                        {(() => {
                          const selectedCat = existingMainCategories.find(cat => cat.en === formData.subcategory);
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
