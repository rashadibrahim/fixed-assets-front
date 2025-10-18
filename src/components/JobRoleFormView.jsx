import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import apiClient from '../utils/api';

const JobRoleFormView = ({ onBack, selectedRole = null, onRoleSaved }) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    can_read_branch: false,
    can_edit_branch: false,
    can_delete_branch: false,
    can_read_warehouse: false,
    can_edit_warehouse: false,
    can_delete_warehouse: false,
    can_read_asset: false,
    can_edit_asset: false,
    can_delete_asset: false,
    can_print_barcode: false
  });

  const isEditMode = Boolean(selectedRole);

  useEffect(() => {
    if (selectedRole) {
      setFormData({
        name: selectedRole.name || '',
        can_read_branch: selectedRole.can_read_branch || false,
        can_edit_branch: selectedRole.can_edit_branch || false,
        can_delete_branch: selectedRole.can_delete_branch || false,
        can_read_warehouse: selectedRole.can_read_warehouse || false,
        can_edit_warehouse: selectedRole.can_edit_warehouse || false,
        can_delete_warehouse: selectedRole.can_delete_warehouse || false,
        can_read_asset: selectedRole.can_read_asset || false,
        can_edit_asset: selectedRole.can_edit_asset || false,
        can_delete_asset: selectedRole.can_delete_asset || false,
        can_print_barcode: selectedRole.can_print_barcode || false
      });
    }
  }, [selectedRole]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = useCallback((permission) => {
    setFormData(prev => {
      const newFormData = { ...prev };

      // If unchecking a read permission, also uncheck corresponding edit/delete
      if (permission === 'can_read_branch' && prev[permission]) {
        newFormData.can_edit_branch = false;
        newFormData.can_delete_branch = false;
      } else if (permission === 'can_read_warehouse' && prev[permission]) {
        newFormData.can_edit_warehouse = false;
        newFormData.can_delete_warehouse = false;
      } else if (permission === 'can_read_asset' && prev[permission]) {
        newFormData.can_edit_asset = false;
        newFormData.can_delete_asset = false;
      }

      // If enabling edit/delete, automatically enable read
      if (permission === 'can_edit_branch' || permission === 'can_delete_branch') {
        newFormData.can_read_branch = true;
      } else if (permission === 'can_edit_warehouse' || permission === 'can_delete_warehouse') {
        newFormData.can_read_warehouse = true;
      } else if (permission === 'can_edit_asset' || permission === 'can_delete_asset') {
        newFormData.can_read_asset = true;
      }

      // Toggle the clicked permission
      newFormData[permission] = !prev[permission];

      return newFormData;
    });
  }, []);

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Job role name is required';
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

      const roleData = {
        name: formData.name.trim(),
        can_read_branch: formData.can_read_branch,
        can_edit_branch: formData.can_edit_branch,
        can_delete_branch: formData.can_delete_branch,
        can_read_warehouse: formData.can_read_warehouse,
        can_edit_warehouse: formData.can_edit_warehouse,
        can_delete_warehouse: formData.can_delete_warehouse,
        can_read_asset: formData.can_read_asset,
        can_edit_asset: formData.can_edit_asset,
        can_delete_asset: formData.can_delete_asset,
        can_print_barcode: formData.can_print_barcode
      };

      if (isEditMode) {
        await apiClient.updateJobRole(selectedRole.id, roleData);
        handleSuccess('Job role updated successfully');
      } else {
        await apiClient.createJobRole(roleData);
        handleSuccess('Job role created successfully');
      }

      if (onRoleSaved) {
        onRoleSaved();
      }
      onBack();
    } catch (error) {
      handleError(error, `Failed to ${isEditMode ? 'update' : 'create'} job role`);
    } finally {
      setLoading(false);
    }
  };

  const PermissionCheckbox = ({ permission, label, description }) => (
    <div className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
      <Checkbox
        id={permission}
        checked={formData[permission]}
        onCheckedChange={() => handleCheckboxChange(permission)}
        className="mt-0.5"
      />
      <div className="flex-1">
        <Label htmlFor={permission} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Header */}
      <div className="flex-shrink-0 bg-background border-b border-border">
        <div className="px-6 py-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Roles
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditMode ? 'Edit Job Role' : 'Add New Job Role'}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isEditMode ? 'Update the job role and permissions' : 'Create a new job role and assign permissions'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 space-y-4">
              
              {/* Job Role Name */}
              <div className="bg-background rounded-lg border border-border shadow-sm">
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="text-base font-semibold text-foreground">Job Role Information</h2>
                  <p className="text-xs text-muted-foreground">Enter the job role name</p>
                </div>
                <div className="p-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Job Role Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter job role name"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* Branch Permissions */}
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Branch Permissions</h2>
                    <p className="text-xs text-muted-foreground">Access to branch management</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <PermissionCheckbox
                      permission="can_read_branch"
                      label="View Branches"
                      description="Can view branch information"
                    />
                    <PermissionCheckbox
                      permission="can_edit_branch"
                      label="Edit Branches"
                      description="Can modify branch details"
                    />
                    <PermissionCheckbox
                      permission="can_delete_branch"
                      label="Delete Branches"
                      description="Can remove branches"
                    />
                  </div>
                </div>

                {/* Warehouse Permissions */}
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Warehouse Permissions</h2>
                    <p className="text-xs text-muted-foreground">Access to warehouse management</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <PermissionCheckbox
                      permission="can_read_warehouse"
                      label="View Warehouses"
                      description="Can view warehouse information"
                    />
                    <PermissionCheckbox
                      permission="can_edit_warehouse"
                      label="Edit Warehouses"
                      description="Can modify warehouse details"
                    />
                    <PermissionCheckbox
                      permission="can_delete_warehouse"
                      label="Delete Warehouses"
                      description="Can remove warehouses"
                    />
                  </div>
                </div>

                {/* Asset Permissions */}
                <div className="bg-background rounded-lg border border-border shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <h2 className="text-base font-semibold text-foreground">Asset Permissions</h2>
                    <p className="text-xs text-muted-foreground">Access to asset management</p>
                  </div>
                  <div className="p-4 space-y-2">
                    <PermissionCheckbox
                      permission="can_read_asset"
                      label="View Assets"
                      description="Can view asset information"
                    />
                    <PermissionCheckbox
                      permission="can_edit_asset"
                      label="Edit Assets"
                      description="Can modify asset details"
                    />
                    <PermissionCheckbox
                      permission="can_delete_asset"
                      label="Delete Assets"
                      description="Can remove assets"
                    />
                    <PermissionCheckbox
                      permission="can_print_barcode"
                      label="Print Barcodes"
                      description="Can generate barcodes"
                    />
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
                    {isEditMode ? 'Update Role' : 'Create Role'}
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

export default JobRoleFormView;
