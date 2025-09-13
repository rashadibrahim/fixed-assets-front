import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Mail,
  Shield,
  User,
  UserCheck,
  UserX,
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import apiClient from '../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    job_role_id: '',
    can_read_asset: true,
    can_edit_asset: false,
    can_delete_asset: false,
    is_active: true
  });

  useEffect(() => {
    console.log('UserManagement component mounted');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading users and job roles from API...');
      
      // Initialize with empty arrays to prevent undefined errors
      setUsers([]);
      setJobRoles([]);
      
      const [usersResponse, rolesResponse] = await Promise.all([
        apiClient.getUsers().catch(err => {
          console.warn('Failed to load users:', err);
          return { data: [] };
        }),
        apiClient.getJobRoles().catch(err => {
          console.warn('Failed to load job roles:', err);
          return { data: [] };
        })
      ]);
      
      // Handle different response formats from API
      const usersData = usersResponse?.items || usersResponse?.data || usersResponse || [];
      const rolesData = rolesResponse?.items || rolesResponse?.data || rolesResponse || [];
      
      setUsers(Array.isArray(usersData) ? usersData : []);
      setJobRoles(Array.isArray(rolesData) ? rolesData : []);
      
      console.log('Successfully loaded users:', usersData.length, 'roles:', rolesData.length);
    } catch (error) {
      console.error('Error loading users and roles:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Cannot connect to server')) {
        setError('Cannot connect to the backend server. Please ensure the API server is running on http://localhost:5000');
      } else {
        setError(`Failed to load data: ${error.message}`);
      }
      
      setUsers([]);
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
      job_role_id: '',
      can_read_asset: true,
      can_edit_asset: false,
      can_delete_asset: false,
      is_active: true
    });
    setDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      password: '',
      job_role_id: user.job_role_id || '',
      can_read_asset: user.can_read_asset ?? true,
      can_edit_asset: user.can_edit_asset ?? false,
      can_delete_asset: user.can_delete_asset ?? false,
      is_active: user.is_active ?? true
    });
    setDialogOpen(true);
  };

  const filteredUsers = (users || []).filter(user => {
    if (!user) return false;
    
    const matchesSearch = !searchTerm || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || roleFilter === 'all' || user.job_role_id === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleName = (roleId) => {
    if (!jobRoles || !Array.isArray(jobRoles)) return 'Unknown Role';
    const role = jobRoles.find(r => r && r.id === roleId);
    return role?.name_en || role?.name_ar || 'Unknown Role';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
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
      if (!formData.job_role_id) {
        toast.error('Job role selection is required');
        return;
      }
      if (!editingUser && !formData.password.trim()) {
        toast.error('Password is required for new users');
        return;
      }

      setLoading(true);

      if (editingUser) {
        // Update existing user (don't send password if empty)
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await apiClient.updateUser(editingUser.id, updateData);
        toast.success('User updated successfully!');
      } else {
        // Create new user
        await apiClient.createUser(formData);
        toast.success('User created successfully!');
      }

      setDialogOpen(false);
      loadData(); // Reload the data
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(`Failed to save user: ${error.message}`);
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
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
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
            {(jobRoles || []).filter(role => role && role.id).map(role => (
              <SelectItem key={role.id} value={role.id}>
                {role.name_en || role.name_ar || 'Unnamed Role'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                  <span className="text-sm">{getRoleName(user.job_role_id)}</span>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {user.is_active ? (
                    <Badge variant="default" className="text-xs">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <UserX className="h-3 w-3 mr-1" />
                      Inactive
                    </Badge>
                  )}
                  
                  {user.can_read_asset && (
                    <Badge variant="outline" className="text-xs">Read</Badge>
                  )}
                  {user.can_edit_asset && (
                    <Badge variant="outline" className="text-xs">Edit</Badge>
                  )}
                  {user.can_delete_asset && (
                    <Badge variant="outline" className="text-xs">Delete</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
              />
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
              <Label htmlFor="job_role_id">Role *</Label>
              <Select value={formData.job_role_id} onValueChange={(value) => setFormData(prev => ({ ...prev, job_role_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {(jobRoles || []).filter(role => role && role.id).map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name_en || role.name_ar || 'Unnamed Role'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="can_read_asset"
                  checked={formData.can_read_asset}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_read_asset: checked }))}
                />
                <Label htmlFor="can_read_asset">Can Read Assets</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="can_edit_asset"
                  checked={formData.can_edit_asset}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_edit_asset: checked }))}
                />
                <Label htmlFor="can_edit_asset">Can Edit Assets</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="can_delete_asset"
                  checked={formData.can_delete_asset}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_delete_asset: checked }))}
                />
                <Label htmlFor="can_delete_asset">Can Delete Assets</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
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
