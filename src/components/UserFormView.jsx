import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2, User, Mail, Lock, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import apiClient from '../utils/api';
import { useErrorHandler } from '../hooks/useErrorHandler';

const UserFormView = ({ onBack, selectedUser, onUserSaved }) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [jobRoles, setJobRoles] = useState([]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: '',
  });

  useEffect(() => {
    loadJobRoles();
    if (selectedUser) {
      setFormData({
        full_name: selectedUser.full_name || '',
        email: selectedUser.email || '',
        password: '', // Don't populate password for editing
        role: selectedUser.role || '',
      });
    }
  }, [selectedUser]);

  const loadJobRoles = async () => {
    try {
      const response = await apiClient.getJobRoles();
      console.log('Job roles response:', response);
      // Handle both paginated response (items) and direct array response (data)
      const roles = response.items || response.data || response || [];
      console.log('Extracted roles:', roles);
      setJobRoles(Array.isArray(roles) ? roles : []);
    } catch (error) {
      console.error('Error loading job roles:', error);
      handleError(error);
      setJobRoles([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.full_name.trim()) {
      handleError({ response: { data: { message: 'Full name is required' } } });
      return;
    }
    if (!formData.email.trim()) {
      handleError({ response: { data: { message: 'Email is required' } } });
      return;
    }
    if (!selectedUser && !formData.password.trim()) {
      handleError({ response: { data: { message: 'Password is required for new users' } } });
      return;
    }
    if (!formData.role) {
      handleError({ response: { data: { message: 'Job role is required' } } });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        role: formData.role,
      };

      // Only include password if it's set (for new users or if changing password)
      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      console.log('Submitting user payload:', payload);

      if (selectedUser) {
        const response = await apiClient.updateUser(selectedUser.id, payload);
        console.log('Update response:', response);
        handleSuccess('User updated successfully');
      } else {
        const response = await apiClient.createUser(payload);
        console.log('Create response:', response);
        handleSuccess('User created successfully');
      }

      if (onUserSaved) {
        onUserSaved();
      }
      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error('Error saving user:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedUser ? 'Edit User' : 'Add New User'}
          </h2>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email *
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password {!selectedUser && '*'}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={selectedUser ? "Leave blank to keep current password" : "Enter password"}
                  required={!selectedUser}
                />
                {selectedUser && (
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to keep the current password
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role and Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Role and Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="role">Job Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(jobRoles) && jobRoles.length > 0 ? (
                      jobRoles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No job roles available</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {selectedUser ? 'Update User' : 'Create User'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserFormView;
