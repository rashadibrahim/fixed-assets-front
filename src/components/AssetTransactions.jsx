import React, { useState, useEffect } from 'react';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  FileText,
  Download,
  Filter,
  Search,
  Package,
  Warehouse,
  User,
  DollarSign,
  Clock,
  Wrench,
  Plus,
  Edit3,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ViewToggle } from '@/components/ui/view-toggle';
import apiClient from '../utils/api';
import { useErrorHandler } from '../hooks/useErrorHandler';

const AssetTransactions = () => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [transactions, setTransactions] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  // Form data for new transaction
  const [formData, setFormData] = useState({
    asset_id: '',
    transaction_type: 'IN',
    quantity: 1,
    unit_price: '',
    total_value: '',
    reference_number: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    warehouse_from: '',
    warehouse_to: '',
    user_id: '',
    notes: ''
  });

  useEffect(() => {
    loadTransactions();
    loadAssets();
  }, []);

  const getValidToken = () => {
    return localStorage.getItem('authToken');
  };

  const loadTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const token = getValidToken();
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`${apiClient.baseURL}/transactions/?per_page=50&page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.items || data || []);
      setPagination({
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0
      });
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
      // Fallback to mock data for development
      loadMockTransactions();
    } finally {
      setLoading(false);
    }
  };

  const loadAssets = async () => {
    try {
      const token = getValidToken();
      if (!token) return;

      const response = await fetch(`${apiClient.baseURL}/assets/?per_page=100&page=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (response.ok) {
        const data = await response.json();
        setAssets(data.items || data || []);
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

  // Mock data fallback for development
  const loadMockTransactions = () => {
    const mockTransactions = [
      {
        id: 1,
        asset_name: 'Dell Laptop XPS 13',
        transaction_type: 'IN',
        quantity: 5,
        unit_price: 1200.00,
        total_value: 6000.00,
        reference_number: 'PO-2024-001',
        transaction_date: '2024-01-15',
        warehouse: 'Main Warehouse',
        user: 'John Smith',
        status: 'COMPLETED',
        notes: 'New stock arrival from supplier'
      },
      {
        id: 2,
        asset_name: 'Office Chair',
        transaction_type: 'OUT',
        quantity: 2,
        unit_price: 150.00,
        total_value: 300.00,
        reference_number: 'REQ-2024-045',
        transaction_date: '2024-01-14',
        warehouse: 'Branch Office',
        user: 'Sarah Johnson',
        status: 'PENDING',
        notes: 'Transfer to branch office'
      },
      {
        id: 3,
        asset_name: 'HP Printer LaserJet',
        transaction_type: 'TRANSFER',
        quantity: 1,
        unit_price: 450.00,
        total_value: 450.00,
        reference_number: 'TR-2024-012',
        transaction_date: '2024-01-13',
        warehouse: 'IT Department',
        user: 'Mike Wilson',
        status: 'COMPLETED',
        notes: 'Internal transfer between departments'
      }
    ];

    setTransactions(mockTransactions);
    setPagination({
      page: 1,
      pages: 1,
      total: mockTransactions.length
    });
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

    try {
      const token = getValidToken();
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      // Prepare transaction data
      const transactionData = {
        asset_id: parseInt(formData.asset_id),
        transaction_type: formData.transaction_type,
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price) || 0,
        total_value: parseFloat(formData.total_value) || 0,
        reference_number: formData.reference_number,
        description: formData.description || formData.notes,
        transaction_date: formData.transaction_date,
        notes: formData.notes
      };

      const response = await fetch(`${apiClient.baseURL}/asset-transactions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create transaction');
      }

      toast.success('Transaction created successfully!');
      setShowAddModal(false);
      loadTransactions();
      resetForm();
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast.error(error.message || 'Failed to create transaction');
    }
  };

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      await apiClient.deleteAssetTransaction(transactionId);
      handleSuccess('Transaction deleted successfully');
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      handleError(error, 'Failed to delete transaction');
    }
  };

  const resetForm = () => {
    setFormData({
      asset_id: '',
      transaction_type: 'IN',
      quantity: 1,
      unit_price: '',
      total_value: '',
      reference_number: '',
      description: '',
      transaction_date: new Date().toISOString().split('T')[0],
      warehouse_from: '',
      warehouse_to: '',
      user_id: '',
      notes: ''
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = (transaction.asset_name || transaction.asset?.name_en || transaction.asset?.name_ar || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.reference_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.transaction_type === filterType;
    const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'IN': return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'OUT': return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case 'TRANSFER': return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'COMPLETED': 'default',
      'PENDING': 'secondary',
      'CANCELLED': 'destructive',
      'IN_PROGRESS': 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status || 'COMPLETED'}</Badge>;
  };

  const TransactionListView = () => (
    <Card className="glass-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map(transaction => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">
                        {transaction.asset_name || transaction.asset?.name_en || transaction.asset?.name_ar || 'Unknown Asset'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.warehouse || transaction.warehouse?.name_en || transaction.warehouse?.name_ar || 'Unknown Warehouse'}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(transaction.transaction_type)}
                    <span className="font-medium">{transaction.transaction_type}</span>
                  </div>
                </TableCell>
                <TableCell>{transaction.quantity}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">${(transaction.total_value || 0).toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">@${transaction.unit_price || 0}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{transaction.reference_number || 'N/A'}</span>
                </TableCell>
                <TableCell>
                  {new Date(transaction.transaction_date || transaction.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {getStatusBadge(transaction.status)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(transaction.id)}
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

  const TransactionGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredTransactions.map(transaction => (
        <Card key={transaction.id} className="glass-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getTypeIcon(transaction.transaction_type)}
                <span className="font-medium">{transaction.transaction_type}</span>
              </div>
              {getStatusBadge(transaction.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">
                {transaction.asset_name || transaction.asset?.name_en || transaction.asset?.name_ar || 'Unknown Asset'}
              </h3>
              <p className="text-sm text-muted-foreground">{transaction.reference_number || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quantity:</span>
                <span className="font-medium">{transaction.quantity}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Value:</span>
                <span className="font-medium text-green-600">${(transaction.total_value || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Warehouse:</span>
                <span className="font-medium">
                  {transaction.warehouse || transaction.warehouse?.name_en || transaction.warehouse?.name_ar || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">User:</span>
                <span className="font-medium">
                  {transaction.user || transaction.user?.full_name || 'Unknown User'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(transaction.transaction_date || transaction.date).toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(transaction.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Asset Transactions</h1>
          <p className="text-muted-foreground">Track all asset movements and transactions</p>
        </div>
        <div className="flex items-center space-x-3">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Create New Transaction</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto p-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="asset_id">Asset *</Label>
                      <Select value={formData.asset_id} onValueChange={(value) => setFormData(prev => ({ ...prev, asset_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset" />
                        </SelectTrigger>
                        <SelectContent>
                          {assets.map(asset => (
                            <SelectItem key={asset.id} value={asset.id.toString()}>
                              {asset.name_en || asset.name_ar} - {asset.product_code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="transaction_type">Transaction Type *</Label>
                      <Select value={formData.transaction_type} onValueChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN">Stock IN</SelectItem>
                          <SelectItem value="OUT">Stock OUT</SelectItem>
                          <SelectItem value="TRANSFER">Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit_price">Unit Price</Label>
                      <Input
                        id="unit_price"
                        name="unit_price"
                        type="number"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="total_value">Total Value</Label>
                      <Input
                        id="total_value"
                        name="total_value"
                        type="number"
                        step="0.01"
                        value={formData.total_value}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reference_number">Reference Number *</Label>
                      <Input
                        id="reference_number"
                        name="reference_number"
                        value={formData.reference_number}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="transaction_date">Transaction Date *</Label>
                      <Input
                        id="transaction_date"
                        name="transaction_date"
                        type="date"
                        value={formData.transaction_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="btn-primary">
                      Create Transaction
                    </Button>
                  </div>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{transactions.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock IN</p>
                <p className="text-2xl font-bold text-green-600">
                  {transactions.filter(t => t.transaction_type === 'IN').length}
                </p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stock OUT</p>
                <p className="text-2xl font-bold text-red-600">
                  {transactions.filter(t => t.transaction_type === 'OUT').length}
                </p>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-primary">
                  ${transactions.reduce((sum, t) => sum + (t.total_value || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="IN">Stock IN</SelectItem>
                <SelectItem value="OUT">Stock OUT</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Display */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : viewMode === 'grid' ? (
        <TransactionGridView />
      ) : (
        <TransactionListView />
      )}

      {/* No transactions message */}
      {!loading && filteredTransactions.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'No Transactions Found'
              : 'No Transactions Yet'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'No transactions match your current filters.'
              : 'Start by creating your first transaction.'}
          </p>
          <Button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Transaction
          </Button>
        </div>
      )}
    </div>
  );
};

export default AssetTransactions;