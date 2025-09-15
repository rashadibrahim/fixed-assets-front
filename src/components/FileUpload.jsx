import React, { useState, useCallback } from 'react';
import { Upload, File, X, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import apiClient from '@/utils/api';

const FileUpload = ({ assetId, files = [], onFileUploaded, onFileDeleted }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [comment, setComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState(new Set());

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // More comprehensive file type validation
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];

      // Also check file extension as backup
      const fileName = file.name.toLowerCase();
      const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

      if (!allowedTypes.includes(file.type) && !hasValidExtension) {
        toast.error('Invalid file type. Please upload PDF, DOC, DOCX, XLS, XLSX, JPG, or PNG files.');
        e.target.value = '';
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB.');
        e.target.value = '';
        return;
      }

      // Check for empty file
      if (file.size === 0) {
        toast.error('Cannot upload empty file.');
        e.target.value = '';
        return;
      }

      console.log('File selected:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      setSelectedFile(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !comment.trim()) {
      toast.error('Please select a file and enter a comment.');
      return;
    }

    try {
      setUploading(true);
      
      console.log('Starting file upload...');
      const response = await apiClient.uploadAssetFile(assetId, selectedFile, comment.trim());
      
      // If upload was simulated due to backend issues, store locally
      if (response.simulated) {
        const existingFiles = JSON.parse(localStorage.getItem(`asset_${assetId}_files`) || '[]');
        existingFiles.push(response);
        localStorage.setItem(`asset_${assetId}_files`, JSON.stringify(existingFiles));
        toast.success('File uploaded successfully! (Stored locally until backend is available)');
      } else {
        toast.success('File uploaded successfully!');
      }
      
      // Reset form
      setSelectedFile(null);
      setComment('');
      setShowUploadDialog(false);
      
      // Reset file input
      const fileInput = document.getElementById('file');
      if (fileInput) fileInput.value = '';
      
      // Notify parent component
      if (onFileUploaded) {
        onFileUploaded(response);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      // Check if it's a simulated file (stored locally)
      const storedFiles = JSON.parse(localStorage.getItem(`asset_${assetId}_files`) || '[]');
      const simulatedFile = storedFiles.find(file => file.id === fileId);
      
      if (simulatedFile && simulatedFile.simulated) {
        toast.info('This file is stored locally. Backend download not available yet.');
        return;
      }

      // Try to download from backend
      const blob = await apiClient.downloadFile(fileId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `file_${fileId}`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName || 'this file'}"?`)) {
      return;
    }

    try {
      setDeletingFiles(prev => new Set(prev).add(fileId));
      
      // Check if it's a simulated file
      const storedFiles = JSON.parse(localStorage.getItem(`asset_${assetId}_files`) || '[]');
      const fileIndex = storedFiles.findIndex(file => file.id === fileId);
      
      if (fileIndex !== -1 && storedFiles[fileIndex].simulated) {
        // Remove from localStorage
        storedFiles.splice(fileIndex, 1);
        localStorage.setItem(`asset_${assetId}_files`, JSON.stringify(storedFiles));
        toast.success('File deleted successfully');
      } else {
        // Try to delete from backend
        await apiClient.deleteAssetFile(fileId);
        toast.success('File deleted successfully');
      }
      
      if (onFileDeleted) {
        onFileDeleted(fileId);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return <File className="h-4 w-4" />;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold">File Attachments</h4>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload File Attachment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)
                </p>
              </div>
              
              <div>
                <Label htmlFor="comment">Comment *</Label>
                <Input
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe this file..."
                />
              </div>

              {selectedFile && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <File className="h-4 w-4 mr-2" />
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowUploadDialog(false);
                    setSelectedFile(null);
                    setComment('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!selectedFile || !comment.trim() || uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Files List */}
      <div className="space-y-2">
        {files && files.length > 0 ? (
          files.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  {getFileIcon(file.file_name)}
                  <div className="ml-2 min-w-0 flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
                        <p className="text-sm font-medium">
                          {file.file_name || `File ${file.id}`}
                        </p>
                        {file.simulated && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Local
                          </span>
                        )}
                      </div>
                      {file.comment && (
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground italic">
                            • "{file.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                    {file.file_size && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatFileSize(file.file_size)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(file.id, file.file_name)}
                    title="Download file"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.id, file.file_name)}
                    disabled={deletingFiles.has(file.id)}
                    title="Delete file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files attached to this asset.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;