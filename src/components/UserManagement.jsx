import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Mail,
  Shield,
  User,
  Search,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ViewToggle } from '@/components/ui/view-toggle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import apiClient from '../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]); // Store all users for filtering
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('grid');

  const searchInputRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: '',
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
    can_make_transaction: false,
  });

  useEffect(() => {
    console.log('UserManagement component mounted');
    loadData(); // Load all data once
  }, []);

  // Real-time filtering of users based on search term and role filter
  const filteredUsers = useMemo(() => {
    let filtered = allUsers;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.role?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by role
    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    return filtered;
  }, [allUsers, searchTerm, roleFilter]);

  // Reset to page 1 when search term or role filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  // Update displayed users and pagination when filtered results change
  useEffect(() => {
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    setUsers(paginatedUsers);
    setTotalUsers(filteredUsers.length);
    setTotalPages(Math.ceil(filteredUsers.length / perPage));
    
    // Reset to page 1 if current page is beyond available pages
    if (currentPage > Math.ceil(filteredUsers.length / perPage) && filteredUsers.length > 0) {
      setCurrentPage(1);
    }
  }, [filteredUsers, currentPage, perPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading users and job roles from API...');
      
      // Initialize with empty arrays to prevent undefined errors
      setUsers([]);
      setAllUsers([]);
      setJobRoles([]);
      
      // Load all users without pagination for real-time filtering
      const [usersResponse, rolesResponse] = await Promise.all([
        apiClient.getUsers({ per_page: 100 }).catch(err => { // Load up to 100 users (API maximum)
          console.warn('Failed to load users:', err);
          return { data: [], items: [], total: 0, pages: 1 };
        }),
        apiClient.getJobRoles().catch(err => {
          console.warn('Failed to load job roles:', err);
          return { data: [] };
        })
      ]);
      
      // Handle different response formats from API
      const usersData = usersResponse?.items || usersResponse?.data || usersResponse || [];
      const rolesData = rolesResponse?.items || rolesResponse?.data || rolesResponse || [];
      
      const processedUsers = Array.isArray(usersData) ? usersData : [];
      setAllUsers(processedUsers); // Store all users for filtering
      setJobRoles(Array.isArray(rolesData) ? rolesData : []);
      
      // Initialize pagination with all users
      setTotalUsers(processedUsers.length);
      setTotalPages(Math.ceil(processedUsers.length / perPage));
      setCurrentPage(1);
      
      console.log('Successfully loaded users:', processedUsers.length, 'roles:', rolesData.length);
    } catch (error) {
      console.error('Error loading users and roles:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Cannot connect to server')) {
        setError('Cannot connect to the backend server. Please ensure the API server is running on http://localhost:5000');
      } else {
        setError(`Failed to load data: ${error.message}`);
      }
      
      setUsers([]);
      setAllUsers([]);
      setJobRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      email: '',
      password: '',
      role: '',
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
      can_make_transaction: false,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      password: '',
      role: user.role || '',
      can_read_branch: user.can_read_branch ?? false,
      can_edit_branch: user.can_edit_branch ?? false,
      can_delete_branch: user.can_delete_branch ?? false,
      can_read_warehouse: user.can_read_warehouse ?? false,
      can_edit_warehouse: user.can_edit_warehouse ?? false,
      can_delete_warehouse: user.can_delete_warehouse ?? false,
      can_read_asset: user.can_read_asset ?? false,
      can_edit_asset: user.can_edit_asset ?? false,
      can_delete_asset: user.can_delete_asset ?? false,
      can_print_barcode: user.can_print_barcode ?? false,
      can_make_report: user.can_make_report ?? false,
      can_make_transaction: user.can_make_transaction ?? false,
    });
    setDialogOpen(true);
  };

  const getRoleName = (roleName) => {
    if (!jobRoles || !Array.isArray(jobRoles)) return roleName || 'Unknown Role';
    const role = jobRoles.find(r => r && r.name === roleName);
    return role?.name || roleName || 'Unknown Role';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleRoleChange = (roleName) => {
    const selectedRole = jobRoles.find(role => role.name === roleName);
    
    if (selectedRole) {
      // Auto-populate permissions from the selected role
      setFormData(prev => ({
        ...prev,
        role: roleName,
        can_read_branch: selectedRole.can_read_branch ?? false,
        can_edit_branch: selectedRole.can_edit_branch ?? false,
        can_delete_branch: selectedRole.can_delete_branch ?? false,
        can_read_warehouse: selectedRole.can_read_warehouse ?? false,
        can_edit_warehouse: selectedRole.can_edit_warehouse ?? false,
        can_delete_warehouse: selectedRole.can_delete_warehouse ?? false,
        can_read_asset: selectedRole.can_read_asset ?? false,
        can_edit_asset: selectedRole.can_edit_asset ?? false,
        can_delete_asset: selectedRole.can_delete_asset ?? false,
        can_print_barcode: selectedRole.can_print_barcode ?? false,
        can_make_report: selectedRole.can_make_report ?? false,
        can_make_transaction: selectedRole.can_make_transaction ?? false
      }));
    } else {
      setFormData(prev => ({ ...prev, role: roleName }));
    }
  };

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

  const handlePermissionChange = (permission, checked) => {
    setFormData(prev => {
      const newFormData = { ...prev };
      
      // If unchecking a read permission, also uncheck corresponding edit/delete
      if (permission === 'can_read_branch' && !checked) {
        newFormData.can_edit_branch = false;
        newFormData.can_delete_branch = false;
      } else if (permission === 'can_read_warehouse' && !checked) {
        newFormData.can_edit_warehouse = false;
        newFormData.can_delete_warehouse = false;
      } else if (permission === 'can_read_asset' && !checked) {
        newFormData.can_edit_asset = false;
        newFormData.can_delete_asset = false;
      }
      
      // If enabling edit/delete, automatically enable read
      if ((permission === 'can_edit_branch' || permission === 'can_delete_branch') && checked) {
        newFormData.can_read_branch = true;
      } else if ((permission === 'can_edit_warehouse' || permission === 'can_delete_warehouse') && checked) {
        newFormData.can_read_warehouse = true;
      } else if ((permission === 'can_edit_asset' || permission === 'can_delete_asset') && checked) {
        newFormData.can_read_asset = true;
      }
      
      newFormData[permission] = checked;
      return newFormData;
    });
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.full_name.trim()) {
        toast.error('Full name is required');
        return;
      }
      if (!formData.email.trim()) {
        toast.error('Email is required');
        return;
      }
      if (!formData.role) {
        toast.error('Job role selection is required');
        return;
      }
      if (!editingUser && !formData.password.trim()) {
        toast.error('Password is required for new users');
        return;
      }

      // Validate permissions logic
      const validationErrors = validatePermissions();
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        return;
      }

      setLoading(true);

      if (editingUser) {
        // Update existing user - try sending full_name instead of username
        const updateData = {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
          permissions: {
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
          }
        };
        console.log('Updating user with data:', updateData);
        await apiClient.updateUser(editingUser.id, updateData);
        toast.success('User updated successfully!');
      } else {
        // Create new user using UserInput schema
        const userData = {
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        };
        await apiClient.createUser(userData);
        toast.success('User created successfully!');
      }

      setDialogOpen(false);
      loadData(); // Reload the data
    } catch (error) {
      console.error('Error saving user:', error);
      
      // Try to extract more specific error information
      let errorMessage = 'Failed to save user';
      if (error.message) {
        if (error.message.includes('400')) {
          errorMessage = 'Invalid data provided. Please check all fields.';
        } else if (error.message.includes('409')) {
          errorMessage = 'User with this email already exists.';
        } else if (error.message.includes('422')) {
          errorMessage = 'Validation error. Please check required fields.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.deleteUser(userId);
      toast.success('User deleted successfully!');
      loadData(); // Reload the data
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const UserListView = () => (
    <Card className="glass-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <User className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-semibold">{user.full_name}</div>
                      <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>{getRoleName(user.role)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {(user.can_read_branch || user.can_edit_branch || user.can_delete_branch) && (
                      <Badge variant="outline" className="text-xs">
                        Branch: {[
                          user.can_read_branch && 'R',
                          user.can_edit_branch && 'E', 
                          user.can_delete_branch && 'D'
                        ].filter(Boolean).join('/')}
                      </Badge>
                    )}
                    {(user.can_read_warehouse || user.can_edit_warehouse || user.can_delete_warehouse) && (
                      <Badge variant="outline" className="text-xs">
                        Warehouse: {[
                          user.can_read_warehouse && 'R',
                          user.can_edit_warehouse && 'E', 
                          user.can_delete_warehouse && 'D'
                        ].filter(Boolean).join('/')}
                      </Badge>
                    )}
                    {(user.can_read_asset || user.can_edit_asset || user.can_delete_asset) && (
                      <Badge variant="outline" className="text-xs">
                        Asset: {[
                          user.can_read_asset && 'R',
                          user.can_edit_asset && 'E', 
                          user.can_delete_asset && 'D'
                        ].filter(Boolean).join('/')}
                      </Badge>
                    )}
                    {user.can_print_barcode && (
                      <Badge variant="outline" className="text-xs">Barcode</Badge>
                    )}
                    {user.can_make_report && (
                      <Badge variant="outline" className="text-xs">Reports</Badge>
                    )}
                    {user.can_make_transaction && (
                      <Badge variant="outline" className="text-xs">Transactions</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(user.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">Manage system users and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
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
              ref={searchInputRef}
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {(jobRoles || []).filter(role => role && role.name).map(role => (
              <SelectItem key={role.id} value={role.name}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(user.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{user.full_name}</h3>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span>{user.email}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{getRoleName(user.role)}</span>
                </div>
                
                <div className="flex gap-2 flex-wrap items-center">
                  {/* Permission badges */}
                  {(user.can_read_branch || user.can_edit_branch || user.can_delete_branch) && (
                    <Badge variant="outline" className="text-xs">
                      Branch: {[
                        user.can_read_branch && 'R',
                        user.can_edit_branch && 'E', 
                        user.can_delete_branch && 'D'
                      ].filter(Boolean).join('/')}
                    </Badge>
                  )}
                  
                  {(user.can_read_warehouse || user.can_edit_warehouse || user.can_delete_warehouse) && (
                    <Badge variant="outline" className="text-xs">
                      Warehouse: {[
                        user.can_read_warehouse && 'R',
                        user.can_edit_warehouse && 'E', 
                        user.can_delete_warehouse && 'D'
                      ].filter(Boolean).join('/')}
                    </Badge>
                  )}
                  
                  {(user.can_read_asset || user.can_edit_asset || user.can_delete_asset) && (
                    <Badge variant="outline" className="text-xs">
                      Asset: {[
                        user.can_read_asset && 'R',
                        user.can_edit_asset && 'E', 
                        user.can_delete_asset && 'D'
                      ].filter(Boolean).join('/')}
                    </Badge>
                  )}
                  
                  {user.can_print_barcode && (
                    <Badge variant="outline" className="text-xs">Barcode</Badge>
                  )}
                  
                  {user.can_make_report && (
                    <Badge variant="outline" className="text-xs">Reports</Badge>
                  )}
                  
                  {user.can_make_transaction && (
                    <Badge variant="outline" className="text-xs">Transactions</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      ) : (
        <UserListView />
      )}

      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Users Found</h3>
          <p className="text-muted-foreground mb-6">
            {users.length === 0 
              ? 'Start by adding your first user.' 
              : 'No users match your search criteria.'
            }
          </p>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      )}

      {/* Pagination */}
      {!loading && filteredUsers.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalUsers)} of {totalUsers} users
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto p-1">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter user's full name"
                />
                {editingUser && (
                  <p className="text-xs text-muted-foreground mt-1">
                    This will update the username field in the system
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            {!editingUser && (
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {(jobRoles || []).filter(role => role && role.name).map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                Selecting a role will auto-populate permissions below, which you can then customize.
              </p>
            </div>

            {/* Permissions Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Permissions</Label>
              
              {/* Branch Permissions */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Branch Permissions</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_read_branch"
                      checked={formData.can_read_branch}
                      onCheckedChange={(checked) => handlePermissionChange('can_read_branch', checked)}
                    />
                    <Label htmlFor="can_read_branch" className="text-sm">Read Branches</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_edit_branch"
                      checked={formData.can_edit_branch}
                      onCheckedChange={(checked) => handlePermissionChange('can_edit_branch', checked)}
                      disabled={!formData.can_read_branch}
                    />
                    <Label htmlFor="can_edit_branch" className={`text-sm ${!formData.can_read_branch ? 'text-muted-foreground' : ''}`}>
                      Edit Branches {!formData.can_read_branch && <span className="text-xs">(requires read)</span>}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_delete_branch"
                      checked={formData.can_delete_branch}
                      onCheckedChange={(checked) => handlePermissionChange('can_delete_branch', checked)}
                      disabled={!formData.can_read_branch}
                    />
                    <Label htmlFor="can_delete_branch" className={`text-sm ${!formData.can_read_branch ? 'text-muted-foreground' : ''}`}>
                      Delete Branches {!formData.can_read_branch && <span className="text-xs">(requires read)</span>}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Warehouse Permissions */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Warehouse Permissions</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_read_warehouse"
                      checked={formData.can_read_warehouse}
                      onCheckedChange={(checked) => handlePermissionChange('can_read_warehouse', checked)}
                    />
                    <Label htmlFor="can_read_warehouse" className="text-sm">Read Warehouses</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_edit_warehouse"
                      checked={formData.can_edit_warehouse}
                      onCheckedChange={(checked) => handlePermissionChange('can_edit_warehouse', checked)}
                      disabled={!formData.can_read_warehouse}
                    />
                    <Label htmlFor="can_edit_warehouse" className={`text-sm ${!formData.can_read_warehouse ? 'text-muted-foreground' : ''}`}>
                      Edit Warehouses {!formData.can_read_warehouse && <span className="text-xs">(requires read)</span>}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_delete_warehouse"
                      checked={formData.can_delete_warehouse}
                      onCheckedChange={(checked) => handlePermissionChange('can_delete_warehouse', checked)}
                      disabled={!formData.can_read_warehouse}
                    />
                    <Label htmlFor="can_delete_warehouse" className={`text-sm ${!formData.can_read_warehouse ? 'text-muted-foreground' : ''}`}>
                      Delete Warehouses {!formData.can_read_warehouse && <span className="text-xs">(requires read)</span>}
                    </Label>
                  </div>
                </div>
              </div>

              {/* Asset Permissions */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Asset Permissions</Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_read_asset"
                      checked={formData.can_read_asset}
                      onCheckedChange={(checked) => handlePermissionChange('can_read_asset', checked)}
                    />
                    <Label htmlFor="can_read_asset" className="text-sm">Read Assets</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_edit_asset"
                      checked={formData.can_edit_asset}
                      onCheckedChange={(checked) => handlePermissionChange('can_edit_asset', checked)}
                      disabled={!formData.can_read_asset}
                    />
                    <Label htmlFor="can_edit_asset" className={`text-sm ${!formData.can_read_asset ? 'text-muted-foreground' : ''}`}>
                      Edit Assets {!formData.can_read_asset && <span className="text-xs">(requires read)</span>}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_delete_asset"
                      checked={formData.can_delete_asset}
                      onCheckedChange={(checked) => handlePermissionChange('can_delete_asset', checked)}
                      disabled={!formData.can_read_asset}
                    />
                    <Label htmlFor="can_delete_asset" className={`text-sm ${!formData.can_read_asset ? 'text-muted-foreground' : ''}`}>
                      Delete Assets {!formData.can_read_asset && <span className="text-xs">(requires read)</span>}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_print_barcode"
                      checked={formData.can_print_barcode}
                      onCheckedChange={(checked) => handlePermissionChange('can_print_barcode', checked)}
                    />
                    <Label htmlFor="can_print_barcode" className="text-sm">Print Barcodes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_make_report"
                      checked={formData.can_make_report}
                      onCheckedChange={(checked) => handlePermissionChange('can_make_report', checked)}
                    />
                    <Label htmlFor="can_make_report" className="text-sm">Make Reports</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="can_make_transaction"
                      checked={formData.can_make_transaction}
                      onCheckedChange={(checked) => handlePermissionChange('can_make_transaction', checked)}
                    />
                    <Label htmlFor="can_make_transaction" className="text-sm">Make Transactions</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
