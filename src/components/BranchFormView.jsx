import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import apiClient from '../utils/api';

const BranchFormView = ({ onBack, selectedBranch = null, onBranchSaved }) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    address_en: '',
    address_ar: ''
  });

  const isEditMode = Boolean(selectedBranch);

  useEffect(() => {
    if (selectedBranch) {
      setFormData({
        name_en: selectedBranch.name_en || '',
        name_ar: selectedBranch.name_ar || '',
        address_en: selectedBranch.address_en || '',
        address_ar: selectedBranch.address_ar || ''
      });
    }
  }, [selectedBranch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name_en.trim() && !formData.name_ar.trim()) {
      return 'Please provide at least one branch name (English or Arabic)';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      handleError(error);
      return;
    }

    try {
      setLoading(true);

      const branchData = {
        name_en: formData.name_en.trim(),
        name_ar: formData.name_ar.trim(),
        address_en: formData.address_en.trim(),
        address_ar: formData.address_ar.trim()
      };

      if (isEditMode) {
        await apiClient.updateBranch(selectedBranch.id, branchData);
        handleSuccess('Branch updated successfully');
      } else {
        await apiClient.createBranch(branchData);
        handleSuccess('Branch created successfully');
      }

      if (onBranchSaved) {
        onBranchSaved();
      }
      onBack();
    } catch (error) {
      handleError(error, `Failed to ${isEditMode ? 'update' : 'create'} branch`);
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
            Back to Branches
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditMode ? 'Edit Branch' : 'Add New Branch'}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditMode ? 'Update the branch information below' : 'Create a new branch by filling in the required information'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Left Column - Branch Names */}
              <div className="space-y-4">
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Branch Name</h2>
                    <p className="text-xs text-muted-foreground">Enter the branch name in both languages</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name_en" className="text-sm font-medium">
                        Branch Name (English) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name_en"
                        name="name_en"
                        value={formData.name_en}
                        onChange={handleInputChange}
                        placeholder="Enter branch name in English"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="name_ar" className="text-sm font-medium">
                        Branch Name (Arabic) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name_ar"
                        name="name_ar"
                        value={formData.name_ar}
                        onChange={handleInputChange}
                        dir="rtl"
                        placeholder="أدخل اسم الفرع بالعربية"
                        className="h-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      At least one name (English or Arabic) is required
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column - Addresses */}
              <div className="space-y-4">
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Address</h2>
                    <p className="text-xs text-muted-foreground">Enter the branch address (optional)</p>
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
                        className="min-h-[80px] resize-none"
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
                        className="min-h-[80px] resize-none"
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
                    {isEditMode ? 'Update Branch' : 'Create Branch'}
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

export default BranchFormView;
