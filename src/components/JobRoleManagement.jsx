import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit3,
  Trash2,
  Shield,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  const [error, setError] = useState(null);

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
    }
  };

  const handleEdit = (role) => {
    if (onViewChange) {
      onViewChange('edit', role);
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

        <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add New Role
        </Button>
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