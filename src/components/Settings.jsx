import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  QrCode, 
  Palette,
  Type,
  Maximize2,
  Save,
  RotateCcw,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Settings = () => {
  const [barcodeSettings, setBarcodeSettings] = useState({
    width: 300,
    height: 100,
    fontSize: 16,
    fontFamily: 'Courier New',
    textColor: '#000000',
    barcodeColor: '#000000',
    backgroundColor: '#ffffff',
    showText: true,
    textPosition: 'bottom'
  });

  const [previewAsset] = useState({
    id: 'preview',
    name_en: 'Sample Asset',
    name_ar: 'عينة الأصول',
    product_code: '12345678'
  });

  useEffect(() => {
    loadBarcodeSettings();
  }, []);

  const loadBarcodeSettings = () => {
    const saved = localStorage.getItem('barcodeSettings');
    if (saved) {
      try {
        setBarcodeSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading barcode settings:', error);
      }
    }
  };

  const saveBarcodeSettings = () => {
    try {
      localStorage.setItem('barcodeSettings', JSON.stringify(barcodeSettings));
      toast.success('Barcode settings saved successfully!');
    } catch (error) {
      console.error('Error saving barcode settings:', error);
      toast.error('Failed to save barcode settings');
    }
  };

  const resetToDefaults = () => {
    setBarcodeSettings({
      width: 300,
      height: 100,
      fontSize: 16,
      fontFamily: 'Courier New',
      textColor: '#000000',
      barcodeColor: '#000000',
      backgroundColor: '#ffffff',
      showText: true,
      textPosition: 'bottom'
    });
    toast.info('Settings reset to defaults');
  };

  const generatePreviewBarcode = async () => {
    try {
      const previewWindow = window.open('', '_blank', 'width=700,height=600');
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Barcode Preview - ${previewAsset.name_en}</title>
            <style>
              body {
                font-family: '${barcodeSettings.fontFamily}', monospace;
                text-align: center;
                padding: 20px;
                margin: 0;
                background: ${barcodeSettings.backgroundColor};
              }
              .barcode-container {
                max-width: ${barcodeSettings.width + 100}px;
                margin: 0 auto;
                border: 2px solid #333;
                padding: 30px;
                border-radius: 8px;
                background: ${barcodeSettings.backgroundColor};
              }
              .asset-name {
                margin-bottom: 20px;
                font-size: ${barcodeSettings.fontSize + 2}px;
                font-weight: bold;
                color: ${barcodeSettings.textColor};
                text-transform: uppercase;
                font-family: '${barcodeSettings.fontFamily}', monospace;
              }
              .barcode-image {
                margin: 20px 0;
                background: ${barcodeSettings.backgroundColor};
                padding: 10px;
                border: 1px solid #ddd;
                display: flex;
                justify-content: center;
                align-items: center;
                width: ${barcodeSettings.width}px;
                height: ${barcodeSettings.height}px;
                background-color: ${barcodeSettings.barcodeColor};
                position: relative;
                margin: 0 auto;
              }
              .mock-barcode {
                width: 100%;
                height: 100%;
                background: repeating-linear-gradient(
                  90deg,
                  ${barcodeSettings.barcodeColor} 0px,
                  ${barcodeSettings.barcodeColor} 2px,
                  ${barcodeSettings.backgroundColor} 2px,
                  ${barcodeSettings.backgroundColor} 4px
                );
              }
              .barcode-number {
                font-family: '${barcodeSettings.fontFamily}', monospace;
                font-size: ${barcodeSettings.fontSize}px;
                font-weight: bold;
                color: ${barcodeSettings.textColor};
                margin-top: 10px;
                letter-spacing: 2px;
                ${!barcodeSettings.showText ? 'display: none;' : ''}
              }
              .barcode-number-top {
                font-family: '${barcodeSettings.fontFamily}', monospace;
                font-size: ${barcodeSettings.fontSize}px;
                font-weight: bold;
                color: ${barcodeSettings.textColor};
                margin-bottom: 10px;
                letter-spacing: 2px;
                ${barcodeSettings.textPosition !== 'top' ? 'display: none;' : ''}
              }
              .buttons {
                margin-top: 30px;
              }
              .btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                cursor: pointer;
                margin: 0 10px;
                font-size: 14px;
                font-weight: bold;
              }
              .btn:hover {
                background: #0056b3;
              }
              .btn-secondary {
                background: #6c757d;
              }
              .btn-secondary:hover {
                background: #545b62;
              }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <div class="asset-name">
                ${previewAsset.name_en} (PREVIEW)
              </div>
              ${barcodeSettings.textPosition === 'top' ? `<div class="barcode-number-top">${previewAsset.product_code}</div>` : ''}
              <div class="barcode-image">
                <div class="mock-barcode"></div>
              </div>
              ${barcodeSettings.textPosition === 'bottom' ? `<div class="barcode-number">${previewAsset.product_code}</div>` : ''}
              <div class="buttons">
                <button class="btn btn-secondary" onclick="window.close()">Close Preview</button>
              </div>
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure system preferences and barcode settings</p>
        </div>
      </div>

      <Tabs defaultValue="barcode" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="barcode" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Barcode Settings
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            System Settings
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="barcode" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Barcode Generation Settings
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure default settings for barcode generation. These settings will be used when printing barcodes from asset management.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Size Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" />
                  Size Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="barcode-width">Width (px)</Label>
                    <Input
                      id="barcode-width"
                      type="number"
                      value={barcodeSettings.width}
                      onChange={(e) => setBarcodeSettings(prev => ({ 
                        ...prev, 
                        width: parseInt(e.target.value) || 300 
                      }))}
                      min="100"
                      max="800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="barcode-height">Height (px)</Label>
                    <Input
                      id="barcode-height"
                      type="number"
                      value={barcodeSettings.height}
                      onChange={(e) => setBarcodeSettings(prev => ({ 
                        ...prev, 
                        height: parseInt(e.target.value) || 100 
                      }))}
                      min="50"
                      max="300"
                    />
                  </div>
                </div>
              </div>

              {/* Font Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="font-size">Font Size (px)</Label>
                    <Input
                      id="font-size"
                      type="number"
                      value={barcodeSettings.fontSize}
                      onChange={(e) => setBarcodeSettings(prev => ({ 
                        ...prev, 
                        fontSize: parseInt(e.target.value) || 16 
                      }))}
                      min="8"
                      max="48"
                    />
                  </div>
                  <div>
                    <Label htmlFor="font-family">Font Family</Label>
                    <Select
                      value={barcodeSettings.fontFamily}
                      onValueChange={(value) => setBarcodeSettings(prev => ({ 
                        ...prev, 
                        fontFamily: value 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Color Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Color Settings
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="text-color">Text Color</Label>
                    <Input
                      id="text-color"
                      type="color"
                      value={barcodeSettings.textColor}
                      onChange={(e) => setBarcodeSettings(prev => ({ 
                        ...prev, 
                        textColor: e.target.value 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="barcode-color">Barcode Color</Label>
                    <Input
                      id="barcode-color"
                      type="color"
                      value={barcodeSettings.barcodeColor}
                      onChange={(e) => setBarcodeSettings(prev => ({ 
                        ...prev, 
                        barcodeColor: e.target.value 
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bg-color">Background</Label>
                    <Input
                      id="bg-color"
                      type="color"
                      value={barcodeSettings.backgroundColor}
                      onChange={(e) => setBarcodeSettings(prev => ({ 
                        ...prev, 
                        backgroundColor: e.target.value 
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Text Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Text Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show-text"
                      checked={barcodeSettings.showText}
                      onChange={(e) => setBarcodeSettings(prev => ({ 
                        ...prev, 
                        showText: e.target.checked 
                      }))}
                    />
                    <Label htmlFor="show-text">Show barcode number</Label>
                  </div>

                  {barcodeSettings.showText && (
                    <div>
                      <Label htmlFor="text-position">Text Position</Label>
                      <Select
                        value={barcodeSettings.textPosition}
                        onValueChange={(value) => setBarcodeSettings(prev => ({ 
                          ...prev, 
                          textPosition: value 
                        }))}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Above barcode</SelectItem>
                          <SelectItem value="bottom">Below barcode</SelectItem>
                          <SelectItem value="none">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={resetToDefaults}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Defaults
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={generatePreviewBarcode}
                    className="flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </Button>
                </div>
                <Button 
                  onClick={saveBarcodeSettings}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                General system configuration options.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <SettingsIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">System Settings</h3>
                <p className="text-muted-foreground">System settings coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Customize the look and feel of the application.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Appearance Settings</h3>
                <p className="text-muted-foreground">Theme and appearance settings coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;