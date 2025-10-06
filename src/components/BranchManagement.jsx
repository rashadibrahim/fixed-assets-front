import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Search,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ViewToggle } from '@/components/ui/view-toggle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import apiClient from '../utils/api';
import { useErrorHandler } from '../hooks/useErrorHandler';

const BranchManagement = () => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    address_en: '',
    address_ar: ''
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getBranches();
      setBranches(response.items || response || []);
    } catch (error) {
      console.error('Error loading branches:', error);
      setError('Failed to load branches. Please try again.');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddDialog = () => {
    setEditingBranch(null);
    setFormData({ name_en: '', name_ar: '', address_en: '', address_ar: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name_en: branch.name_en || '',
      name_ar: branch.name_ar || '',
      address_en: branch.address_en || '',
      address_ar: branch.address_ar || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!formData.name_en.trim() && !formData.name_ar.trim()) {
        toast.error('Please provide at least one branch name (English or Arabic)');
        return;
      }

      const branchData = {
        name_en: formData.name_en.trim(),
        name_ar: formData.name_ar.trim(),
        address_en: formData.address_en.trim(),
        address_ar: formData.address_ar.trim()
      };

      if (editingBranch) {
        await apiClient.updateBranch(editingBranch.id, branchData);
        handleSuccess('Branch updated successfully');
      } else {
        await apiClient.createBranch(branchData);
        handleSuccess('Branch created successfully');
      }

      setDialogOpen(false);
      setFormData({ name_en: '', name_ar: '', address_en: '', address_ar: '' });
      setEditingBranch(null);
      await loadBranches();
    } catch (error) {
      console.error('Error saving branch:', error);
      const defaultMessage = editingBranch ? 'Failed to update branch' : 'Failed to create branch';
      handleError(error, defaultMessage);
      setError(defaultMessage + '. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (branchId, branchName) => {
    if (!confirm(`Are you sure you want to delete "${branchName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await apiClient.deleteBranch(branchId);
      handleSuccess('Branch deleted successfully');
      await loadBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      handleError(error, 'Failed to delete branch');
      setError('Failed to delete branch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBranches = branches.filter(branch => 
    (branch.name_en && branch.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (branch.name_ar && branch.name_ar.includes(searchTerm)) ||
    (branch.address_en && branch.address_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (branch.address_ar && branch.address_ar.includes(searchTerm))
  );

  const BranchListView = () => (
    <Card className="glass-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBranches.map(branch => (
              <TableRow key={branch.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Building className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-semibold">
                        {branch.name_en || branch.name_ar || 'Unnamed Branch'}
                      </div>
                      {branch.name_ar && branch.name_en && (
                        <div className="text-sm text-muted-foreground" dir="rtl">{branch.name_ar}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {branch.address_en && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground mt-1" />
                        <span className="text-sm">{branch.address_en}</span>
                      </div>
                    )}
                    {branch.address_ar && (
                      <div className="text-sm text-muted-foreground" dir="rtl">{branch.address_ar}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(branch)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(branch.id, branch.name_en || branch.name_ar)}
                      className="text-destructive hover:text-destructive"
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

  if (loading && branches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Branches</h1>
          <p className="text-muted-foreground">Manage your organization branches</p>
        </div>
        <div className="flex items-center space-x-3">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Branches Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBranches.map(branch => (
          <Card key={branch.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Building className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(branch)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(branch.id, branch.name_en || branch.name_ar)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {branch.name_en || branch.name_ar || 'Unnamed Branch'}
                </h3>
                {branch.name_ar && branch.name_en && (
                  <p className="text-sm text-muted-foreground" dir="rtl">{branch.name_ar}</p>
                )}
              </div>
              {(branch.address_en || branch.address_ar) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    {branch.address_en && (
                      <p className="text-sm text-muted-foreground">{branch.address_en}</p>
                    )}
                    {branch.address_ar && (
                      <p className="text-sm text-muted-foreground" dir="rtl">{branch.address_ar}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        </div>
      ) : (
        <BranchListView />
      )}

      {!loading && filteredBranches.length === 0 && branches.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Branches Found</h3>
          <p className="text-muted-foreground mb-6">
            Start by adding your first branch location.
          </p>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        </div>
      )}

      {!loading && filteredBranches.length === 0 && branches.length > 0 && (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Matching Branches</h3>
          <p className="text-muted-foreground mb-6">
            No branches found matching your search criteria.
          </p>
        </div>
      )}

      {/* Add/Edit Branch Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? 'Edit Branch' : 'Add New Branch'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name_en">Branch Name (English)</Label>
              <Input
                id="name_en"
                name="name_en"
                value={formData.name_en}
                onChange={handleInputChange}
                placeholder="Enter branch name in English"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name_ar">Branch Name (Arabic)</Label>
              <Input
                id="name_ar"
                name="name_ar"
                value={formData.name_ar}
                onChange={handleInputChange}
                placeholder="أدخل اسم الفرع بالعربية"
                dir="rtl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address_en">Address (English)</Label>
              <Textarea
                id="address_en"
                name="address_en"
                value={formData.address_en}
                onChange={handleInputChange}
                placeholder="Enter address in English"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address_ar">Address (Arabic)</Label>
              <Textarea
                id="address_ar"
                name="address_ar"
                value={formData.address_ar}
                onChange={handleInputChange}
                placeholder="أدخل العنوان بالعربية"
                dir="rtl"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingBranch ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingBranch ? 'Update Branch' : 'Create Branch'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchManagement;
