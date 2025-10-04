import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  Package,
  DollarSign,
  Hash,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import apiClient from '../utils/api';
import { useErrorHandler } from '../hooks/useErrorHandler';

const AssetTransactionEdit = ({ 
  isOpen, 
  onClose, 
  assetTransaction, 
  onUpdate, 
  onDelete 
}) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 1,
    amount: 0
  });

  useEffect(() => {
    if (isOpen && assetTransaction) {
      setFormData({
        quantity: assetTransaction.quantity || 1,
        amount: assetTransaction.amount || 0
      });
    }
  }, [isOpen, assetTransaction]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!assetTransaction?.id) {
      handleError('Asset transaction ID is required');
      return;
    }

    if (formData.quantity <= 0) {
      handleError('Quantity must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      
      const updateData = {
        asset_id: assetTransaction.asset_id,
        quantity: parseInt(formData.quantity),
        amount: parseFloat(formData.amount) || 0
      };

      const updatedTransaction = await apiClient.updateAssetTransaction(
        assetTransaction.id, 
        updateData
      );

      handleSuccess('Asset transaction updated successfully');
      
      if (onUpdate) {
        onUpdate(updatedTransaction);
      }
      
      onClose();
    } catch (error) {
      handleError(error, 'Failed to update asset transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!assetTransaction?.id) {
      handleError('Asset transaction ID is required');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this asset transaction?')) {
      return;
    }

    try {
      setDeleteLoading(true);
      
      await apiClient.deleteAssetTransaction(assetTransaction.id);
      
      handleSuccess('Asset transaction deleted successfully');
      
      if (onDelete) {
        onDelete(assetTransaction.id);
      }
      
      onClose();
    } catch (error) {
      handleError(error, 'Failed to delete asset transaction');
    } finally {
      setDeleteLoading(false);
    }
  };

  const calculateTotal = () => {
    return (formData.quantity || 0) * (formData.amount || 0);
  };

  if (!isOpen || !assetTransaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Edit Asset Transaction
          </DialogTitle>
          <DialogDescription>
            Modify the quantity and amount for this asset transaction
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Information (Read-only) */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <Label className="text-sm font-semibold text-gray-700">Asset</Label>
            <div className="text-sm text-gray-900">
              {assetTransaction.asset?.name_en || assetTransaction.asset?.name_ar || 'Unknown Asset'}
            </div>
            {assetTransaction.asset?.product_code && (
              <div className="text-xs text-gray-500">
                Code: {assetTransaction.asset.product_code}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity" className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Quantity *
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              required
            />
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Unit Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            />
          </div>

          {/* Total Value Display */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <Label className="text-sm font-semibold text-blue-700">Total Value</Label>
            <div className="text-lg font-bold text-blue-900">
              ${calculateTotal().toLocaleString()}
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="mr-auto"
            >
              {deleteLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssetTransactionEdit;