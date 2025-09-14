import React, { useState, useEffect } from 'react';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import apiClient from '../utils/api';

const AssetDetails = ({ assetId, onBack }) => {
  const [assetData, setAssetData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssetDetails();
  }, [assetId]);

  const loadAssetDetails = async () => {
    try {
      const response = await apiClient.getAssetDetails(assetId);
      setAssetData(response);
      console.log('Asset Data:', response); // For debugging
    } catch (error) {
      console.error('Error loading asset details:', error);
      toast.error('Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      await apiClient.downloadFile(fileId);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!assetData) {
    return <div>No asset data found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assets
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Asset Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm">Name (English)</h4>
                <p>{assetData.name_en}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Name (Arabic)</h4>
                <p dir="rtl">{assetData.name_ar}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Category</h4>
                <p>{assetData.category}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Subcategory</h4>
                <p>{assetData.subcategory}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Purchase Date</h4>
                <p>{new Date(assetData.purchase_date).toLocaleDateString()}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Value</h4>
                <p>${parseFloat(assetData.value || 0).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Quantity</h4>
                <p>{assetData.quantity}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Product Code</h4>
                <p>{assetData.product_code || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files Card */}
        <Card>
          <CardHeader>
            <CardTitle>Attached Files</CardTitle>
          </CardHeader>
          <CardContent>
            {assetData.attached_files && assetData.attached_files.length > 0 ? (
              <div className="space-y-2">
                {assetData.attached_files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2 hover:bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{file.file_path}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No files attached
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AssetDetails;