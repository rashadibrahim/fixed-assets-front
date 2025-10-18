import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Shield,
  Search,
  Loader2,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import apiClient from '../utils/api';
import { useErrorHandler } from '../hooks/useErrorHandler';
import JobRoleFormView from './JobRoleFormView';

const JobRoleManagement = ({ currentView = 'list', onViewChange, selectedItem = null }) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    loadJobRoles();
  }, []);

  const loadJobRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getJobRoles();
      setJobRoles(response.items || response || []);
    } catch (error) {
      console.error('Error loading job roles:', error);
      setError('Failed to load job roles. Please try again.');
      setJobRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

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

  const openAddDialog = useCallback(() => {
    setEditingRole(null);
    setFormData({
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
      can_print_barcode: false,
      can_make_report: false,
      can_make_transaction: false
    });
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((role) => {
    setEditingRole(role);
    setFormData({
      name: role.name || '',
      can_read_branch: role.can_read_branch || false,
      can_edit_branch: role.can_edit_branch || false,
      can_delete_branch: role.can_delete_branch || false,
      can_read_warehouse: role.can_read_warehouse || false,
      can_edit_warehouse: role.can_edit_warehouse || false,
      can_delete_warehouse: role.can_delete_warehouse || false,
      can_read_asset: role.can_read_asset || false,
      can_edit_asset: role.can_edit_asset || false,
      can_delete_asset: role.can_delete_asset || false,
      can_print_barcode: role.can_print_barcode || false,
      can_make_report: role.can_make_report || false,
      can_make_transaction: role.can_make_transaction || false
    });
    setDialogOpen(true);
  }, []);

  const validatePermissions = () => {
    const errors = [];

    // Check branch permissions
    if ((formData.can_edit_branch || formData.can_delete_branch) && !formData.can_read_branch) {
      errors.push('Read branch permission is required for edit/delete branch permissions');
    }

    // Check warehouse permissions
    if ((formData.can_edit_warehouse || formData.can_delete_warehouse) && !formData.can_read_warehouse) {
      errors.push('Read warehouse permission is required for edit/delete warehouse permissions');
    }

    // Check asset permissions
    if ((formData.can_edit_asset || formData.can_delete_asset) && !formData.can_read_asset) {
      errors.push('Read asset permission is required for edit/delete asset permissions');
    }

    return errors;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('Please provide a job role name');
        return;
      }

      // Validate permissions logic
      const validationErrors = validatePermissions();
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        return;
      }

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
        can_print_barcode: formData.can_print_barcode,
        can_make_report: formData.can_make_report,
        can_make_transaction: formData.can_make_transaction
      };

      console.log('Submitting role data:', roleData);

      if (editingRole) {
        await apiClient.updateJobRole(editingRole.id, roleData);
        handleSuccess('Job role updated successfully');
      } else {
        await apiClient.createJobRole(roleData);
        handleSuccess('Job role created successfully');
      }

      setDialogOpen(false);
      await loadJobRoles();
    } catch (error) {
      console.error('Error saving job role:', error);
      const defaultMessage = editingRole ? 'Failed to update job role' : 'Failed to create job role';
      handleError(error, defaultMessage);
      setError(`${defaultMessage}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this job role?')) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.deleteJobRole(roleId);
      handleSuccess('Job role deleted successfully');
      await loadJobRoles();
    } catch (error) {
      console.error('Error deleting job role:', error);
      handleError(error, 'Failed to delete job role');
    } finally {
      setLoading(false);
    }
  };

  // Handle view changes
  const handleAdd = () => {
    if (onViewChange) {
      onViewChange('add');
    } else {
      openAddDialog();
    }
  };

  const handleEdit = (role) => {
    if (onViewChange) {
      onViewChange('edit', role);
    } else {
      openEditDialog(role);
    }
  };

  const handleBack = () => {
    if (onViewChange) {
      onViewChange('list');
    }
  };

  const handleRoleSaved = () => {
    loadJobRoles();
  };

  // If we're in add or edit view, show the form view
  if (currentView === 'add' || currentView === 'edit') {
    return (
      <JobRoleFormView
        onBack={handleBack}
        selectedRole={currentView === 'edit' ? selectedItem : null}
        onRoleSaved={handleRoleSaved}
      />
    );
  }

  const filteredRoles = jobRoles.filter(role =>
    role?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const permissionGroups = [
    {
      title: "Branch Permissions",
      permissions: [
        { key: 'can_read_branch', label: 'Read Branches', required: false },
        { key: 'can_edit_branch', label: 'Edit Branches', required: 'can_read_branch' },
        { key: 'can_delete_branch', label: 'Delete Branches', required: 'can_read_branch' }
      ]
    },
    {
      title: "Warehouse Permissions",
      permissions: [
        { key: 'can_read_warehouse', label: 'Read Warehouses', required: false },
        { key: 'can_edit_warehouse', label: 'Edit Warehouses', required: 'can_read_warehouse' },
        { key: 'can_delete_warehouse', label: 'Delete Warehouses', required: 'can_read_warehouse' }
      ]
    },
    {
      title: "Asset Permissions",
      permissions: [
        { key: 'can_read_asset', label: 'Read Assets', required: false },
        { key: 'can_edit_asset', label: 'Edit Assets', required: 'can_read_asset' },
        { key: 'can_delete_asset', label: 'Delete Assets', required: 'can_read_asset' }
      ]
    },
    {
      title: "Other Permissions",
      permissions: [
        { key: 'can_print_barcode', label: 'Print Barcodes', required: false },
        { key: 'can_make_report', label: 'Make Reports', required: false },
        { key: 'can_make_transaction', label: 'Make Transactions', required: false }
      ]
    }
  ];

  if (loading && jobRoles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading job roles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-600" />
            Job Role Management
          </h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Role
            </Button>
          </DialogTrigger>
          <DialogContent className="flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingRole ? 'Edit Job Role' : 'Add New Job Role'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 overflow-y-auto p-1">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter role name"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
                {permissionGroups.map((group) => (
                  <div key={group.title} className="space-y-3">
                    <h4 className="text-md font-medium text-gray-700">{group.title}</h4>
                    <div className="grid grid-cols-1 gap-3 pl-4">
                      {group.permissions.map((permission) => (
                        <div key={permission.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission.key}
                            checked={formData[permission.key]}
                            onCheckedChange={() => handleCheckboxChange(permission.key)}
                            disabled={permission.required && !formData[permission.required]}
                          />
                          <Label
                            htmlFor={permission.key}
                            className={`text-sm ${permission.required && !formData[permission.required] ? 'text-muted-foreground' : ''}`}
                          >
                            {permission.label}
                            {permission.required && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (requires {permission.required.replace('can_', '').replace('_', ' ')})
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
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
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search job roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Job Roles Table View */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Permissions Summary</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No job roles found</h3>
                    <p className="text-gray-500 mb-6">
                      {searchTerm ? 'Try adjusting your search criteria' : 'Start by creating your first job role'}
                    </p>
                    <Button onClick={handleAdd}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Job Role
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map(role => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-600/10 rounded-lg">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{role.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {role.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {role.can_read_branch && <Badge variant="outline" className="text-xs">Branch-R</Badge>}
                          {role.can_edit_branch && <Badge variant="outline" className="text-xs">Branch-E</Badge>}
                          {role.can_delete_branch && <Badge variant="outline" className="text-xs">Branch-D</Badge>}
                          {role.can_read_warehouse && <Badge variant="outline" className="text-xs">Warehouse-R</Badge>}
                          {role.can_edit_warehouse && <Badge variant="outline" className="text-xs">Warehouse-E</Badge>}
                          {role.can_delete_warehouse && <Badge variant="outline" className="text-xs">Warehouse-D</Badge>}
                          {role.can_read_asset && <Badge variant="outline" className="text-xs">Asset-R</Badge>}
                          {role.can_edit_asset && <Badge variant="outline" className="text-xs">Asset-E</Badge>}
                          {role.can_delete_asset && <Badge variant="outline" className="text-xs">Asset-D</Badge>}
                          {role.can_print_barcode && <Badge variant="outline" className="text-xs">Barcode</Badge>}
                          {role.can_make_report && <Badge variant="outline" className="text-xs">Reports</Badge>}
                          {role.can_make_transaction && <Badge variant="outline" className="text-xs">Transactions</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(role)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobRoleManagement;