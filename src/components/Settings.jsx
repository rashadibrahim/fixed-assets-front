import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  QrCode,
  Type,
  Maximize2,
  Save,
  RotateCcw,
  Eye,
  FileText,
  Building2,
  Mail,
  Globe,
  Phone,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user } = useAuth();

  // Permission helper functions
  const isAdmin = () => user?.role?.toLowerCase() === 'admin';
  const canPrintBarcode = () => isAdmin() || user?.can_print_barcode;
  const canMakeReport = () => isAdmin() || user?.can_make_report;
  const hasSettingsAccess = () => canPrintBarcode() || canMakeReport();

  const [barcodeSettings, setBarcodeSettings] = useState({
    width: 300,
    height: 100,
    fontSize: 16,
    fontFamily: 'Courier New',
    showText: true,
    textPosition: 'bottom'
  });

  const [reportSettings, setReportSettings] = useState({
    header: {
      companyName: '',
      companyNameAr: '',
      logo: '',
      address: '',
      addressAr: '',
      phone: '',
      email: '',
      website: '',
      additionalInfo: '',
      additionalInfoAr: ''
    },
    footer: {
      website: '',
      email: '',
      phone: '',
      address: '',
      additionalInfo: '',
      additionalInfoAr: '',
      copyrightText: '',
      copyrightTextAr: ''
    }
  });

  const [previewAsset] = useState({
    id: 'preview',
    name_en: 'Sample Asset',
    name_ar: 'عينة الأصول',
    product_code: '12345678'
  });

  useEffect(() => {
    loadBarcodeSettings();
    loadReportSettings();
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

  const loadReportSettings = () => {
    const saved = localStorage.getItem('reportSettings');
    if (saved) {
      try {
        setReportSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading report settings:', error);
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

  const saveReportSettings = () => {
    try {
      localStorage.setItem('reportSettings', JSON.stringify(reportSettings));
      toast.success('Report settings saved successfully!');
    } catch (error) {
      console.error('Error saving report settings:', error);
      toast.error('Failed to save report settings');
    }
  };

  const resetBarcodeToDefaults = () => {
    setBarcodeSettings({
      width: 300,
      height: 100,
      fontSize: 16,
      fontFamily: 'Courier New',
      showText: true,
      textPosition: 'bottom'
    });
    toast.info('Barcode settings reset to defaults');
  };

  const resetReportToDefaults = () => {
    setReportSettings({
      header: {
        companyName: '',
        companyNameAr: '',
        logo: '',
        address: '',
        addressAr: '',
        phone: '',
        email: '',
        website: '',
        additionalInfo: '',
        additionalInfoAr: ''
      },
      footer: {
        website: '',
        email: '',
        phone: '',
        address: '',
        additionalInfo: '',
        additionalInfoAr: '',
        copyrightText: '',
        copyrightTextAr: ''
      }
    });
    toast.info('Report settings reset to defaults');
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
                background: #ffffff;
              }
              .barcode-container {
                max-width: ${barcodeSettings.width + 100}px;
                margin: 0 auto;
                border: 2px solid #333;
                padding: 30px;
                border-radius: 8px;
                background: #ffffff;
              }
              .asset-name {
                margin-bottom: 20px;
                font-size: ${barcodeSettings.fontSize + 2}px;
                font-weight: bold;
                color: #000000;
                text-transform: uppercase;
                font-family: '${barcodeSettings.fontFamily}', monospace;
              }
              .barcode-image {
                margin: 20px 0;
                background: #ffffff;
                padding: 10px;
                border: 1px solid #ddd;
                display: flex;
                justify-content: center;
                align-items: center;
                width: ${barcodeSettings.width}px;
                height: ${barcodeSettings.height}px;
                background-color: #000000;
                position: relative;
                margin: 0 auto;
              }
              .mock-barcode {
                width: 100%;
                height: 100%;
                background: repeating-linear-gradient(
                  90deg,
                  #000000 0px,
                  #000000 2px,
                  #ffffff 2px,
                  #ffffff 4px
                );
              }
              .barcode-number {
                font-family: '${barcodeSettings.fontFamily}', monospace;
                font-size: ${barcodeSettings.fontSize}px;
                font-weight: bold;
                color: #000000;
                margin-top: 10px;
                letter-spacing: 2px;
                ${!barcodeSettings.showText ? 'display: none;' : ''}
              }
              .barcode-number-top {
                font-family: '${barcodeSettings.fontFamily}', monospace;
                font-size: ${barcodeSettings.fontSize}px;
                font-weight: bold;
                color: #000000;
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

  const generateReportPreview = () => {
    try {
      const previewWindow = window.open('', '_blank', 'width=800,height=600');
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Report Layout Preview</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
              }
              .report-container {
                background: white;
                max-width: 800px;
                margin: 0 auto;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                min-height: 600px;
                display: flex;
                flex-direction: column;
              }
              .report-header {
                background: #f8f9fa;
                padding: 30px;
                border-bottom: 2px solid #dee2e6;
                text-align: center;
              }
              .company-name {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
              }
              .company-name-ar {
                font-size: 20px;
                font-weight: bold;
                color: #666;
                margin-bottom: 15px;
                direction: rtl;
              }
              .company-details {
                font-size: 14px;
                color: #666;
                line-height: 1.6;
              }
              .report-content {
                flex: 1;
                padding: 40px 30px;
                text-align: center;
                color: #999;
                font-size: 18px;
              }
              .report-footer {
                background: #f8f9fa;
                padding: 20px 30px;
                border-top: 2px solid #dee2e6;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
              .footer-section {
                margin-bottom: 10px;
              }
              .btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                margin: 20px 10px;
              }
              .btn:hover {
                background: #0056b3;
              }
            </style>
          </head>
          <body>
            <div class="report-container">
              <div class="report-header">
                ${reportSettings.header.companyName ? `<div class="company-name">${reportSettings.header.companyName}</div>` : ''}
                ${reportSettings.header.companyNameAr ? `<div class="company-name-ar">${reportSettings.header.companyNameAr}</div>` : ''}
                <div class="company-details">
                  ${reportSettings.header.address ? `<div>${reportSettings.header.address}</div>` : ''}
                  ${reportSettings.header.addressAr ? `<div style="direction: rtl;">${reportSettings.header.addressAr}</div>` : ''}
                  ${reportSettings.header.phone ? `<div>Phone: ${reportSettings.header.phone}</div>` : ''}
                  ${reportSettings.header.email ? `<div>Email: ${reportSettings.header.email}</div>` : ''}
                  ${reportSettings.header.website ? `<div>Website: ${reportSettings.header.website}</div>` : ''}
                  ${reportSettings.header.additionalInfo ? `<div>${reportSettings.header.additionalInfo}</div>` : ''}
                  ${reportSettings.header.additionalInfoAr ? `<div style="direction: rtl;">${reportSettings.header.additionalInfoAr}</div>` : ''}
                </div>
              </div>
              
              <div class="report-content">
                <h2>Report Content Area</h2>
                <p>This is where your report data will be displayed</p>
                <p>Tables, charts, and other content will appear here</p>
              </div>
              
              <div class="report-footer">
                ${reportSettings.footer.website || reportSettings.footer.email || reportSettings.footer.phone ? `
                  <div class="footer-section">
                    ${reportSettings.footer.website ? `Website: ${reportSettings.footer.website} | ` : ''}
                    ${reportSettings.footer.email ? `Email: ${reportSettings.footer.email} | ` : ''}
                    ${reportSettings.footer.phone ? `Phone: ${reportSettings.footer.phone}` : ''}
                  </div>
                ` : ''}
                ${reportSettings.footer.address ? `<div class="footer-section">${reportSettings.footer.address}</div>` : ''}
                ${reportSettings.footer.additionalInfo ? `<div class="footer-section">${reportSettings.footer.additionalInfo}</div>` : ''}
                ${reportSettings.footer.additionalInfoAr ? `<div class="footer-section" style="direction: rtl;">${reportSettings.footer.additionalInfoAr}</div>` : ''}
                ${reportSettings.footer.copyrightText ? `<div class="footer-section">${reportSettings.footer.copyrightText}</div>` : ''}
                ${reportSettings.footer.copyrightTextAr ? `<div class="footer-section" style="direction: rtl;">${reportSettings.footer.copyrightTextAr}</div>` : ''}
              </div>
            </div>
            
            <div style="text-align: center;">
              <button class="btn" onclick="window.close()">Close Preview</button>
            </div>
          </body>
        </html>
      `);
      previewWindow.document.close();
    } catch (error) {
      console.error('Error generating report preview:', error);
      toast.error('Failed to generate report preview');
    }
  };

  // Check if user has access to any settings
  if (!hasSettingsAccess()) {
    return (
      <div className="space-y-4 p-4">
        <div className="text-center py-8">
          <SettingsIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Settings
          </h1>
        </div>
      </div>

      <Tabs defaultValue={canPrintBarcode() ? "barcode" : "reports"} className="space-y-4">
        <TabsList className={`grid w-full ${canPrintBarcode() && canMakeReport() ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {canPrintBarcode() && (
            <TabsTrigger value="barcode" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Barcode Settings
            </TabsTrigger>
          )}
          {canMakeReport() && (
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Report Settings
            </TabsTrigger>
          )}
        </TabsList>

        {canPrintBarcode() && (
          <TabsContent value="barcode" className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <QrCode className="w-4 h-4" />
                  Barcode Settings
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Configure barcode generation defaults
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Size Settings */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Maximize2 className="w-3 h-3" />
                    Size Settings
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
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
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Type className="w-3 h-3" />
                    Font Settings
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
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
                    <div className="col-span-2">
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

                {/* Text Options */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Text Options</h3>
                  <div className="grid grid-cols-2 gap-4">
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
                          <SelectTrigger>
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
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetBarcodeToDefaults}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generatePreviewBarcode}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    onClick={saveBarcodeSettings}
                    className="btn-primary flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canMakeReport() && (
          <TabsContent value="reports" className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-4 h-4" />
                  Report Settings
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Configure report header and footer for PDF generation
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Header Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="w-3 h-3" />
                    Report Header (Company Details)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company-name">Company Name (English)</Label>
                      <Input
                        id="company-name"
                        value={reportSettings.header.companyName}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          header: { ...prev.header, companyName: e.target.value }
                        }))}
                        placeholder="Enter company name in English"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company-name-ar">Company Name (Arabic)</Label>
                      <Input
                        id="company-name-ar"
                        value={reportSettings.header.companyNameAr}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          header: { ...prev.header, companyNameAr: e.target.value }
                        }))}
                        placeholder="أدخل اسم الشركة بالعربية"
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address">Address (English)</Label>
                      <Textarea
                        id="address"
                        value={reportSettings.header.address}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          header: { ...prev.header, address: e.target.value }
                        }))}
                        placeholder="Enter company address"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address-ar">Address (Arabic)</Label>
                      <Textarea
                        id="address-ar"
                        value={reportSettings.header.addressAr}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          header: { ...prev.header, addressAr: e.target.value }
                        }))}
                        placeholder="أدخل عنوان الشركة"
                        dir="rtl"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        value={reportSettings.header.phone}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          header: { ...prev.header, phone: e.target.value }
                        }))}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={reportSettings.header.email}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          header: { ...prev.header, email: e.target.value }
                        }))}
                        placeholder="info@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website" className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        value={reportSettings.header.website}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          header: { ...prev.header, website: e.target.value }
                        }))}
                        placeholder="www.company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="additional-info">Additional Info (English)</Label>
                      <Textarea
                        id="additional-info"
                        value={reportSettings.header.additionalInfo}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          header: { ...prev.header, additionalInfo: e.target.value }
                        }))}
                        placeholder="Any additional information"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="additional-info-ar">Additional Info (Arabic)</Label>
                      <Textarea
                        id="additional-info-ar"
                        value={reportSettings.header.additionalInfoAr}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          header: { ...prev.header, additionalInfoAr: e.target.value }
                        }))}
                        placeholder="أي معلومات إضافية"
                        dir="rtl"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Settings */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    Report Footer
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="footer-website" className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Website
                      </Label>
                      <Input
                        id="footer-website"
                        value={reportSettings.footer.website}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          footer: { ...prev.footer, website: e.target.value }
                        }))}
                        placeholder="www.company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="footer-email" className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </Label>
                      <Input
                        id="footer-email"
                        type="email"
                        value={reportSettings.footer.email}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          footer: { ...prev.footer, email: e.target.value }
                        }))}
                        placeholder="contact@company.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="footer-phone" className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Phone
                      </Label>
                      <Input
                        id="footer-phone"
                        value={reportSettings.footer.phone}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          footer: { ...prev.footer, phone: e.target.value }
                        }))}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="footer-address">Footer Address</Label>
                    <Input
                      id="footer-address"
                      value={reportSettings.footer.address}
                      onChange={(e) => setReportSettings(prev => ({
                        ...prev,
                        footer: { ...prev.footer, address: e.target.value }
                      }))}
                      placeholder="Footer address line"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="footer-additional">Additional Footer Info (English)</Label>
                      <Textarea
                        id="footer-additional"
                        value={reportSettings.footer.additionalInfo}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          footer: { ...prev.footer, additionalInfo: e.target.value }
                        }))}
                        placeholder="Additional footer information"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="footer-additional-ar">Additional Footer Info (Arabic)</Label>
                      <Textarea
                        id="footer-additional-ar"
                        value={reportSettings.footer.additionalInfoAr}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          footer: { ...prev.footer, additionalInfoAr: e.target.value }
                        }))}
                        placeholder="معلومات إضافية للتذييل"
                        dir="rtl"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="copyright">Copyright Text (English)</Label>
                      <Input
                        id="copyright"
                        value={reportSettings.footer.copyrightText}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          footer: { ...prev.footer, copyrightText: e.target.value }
                        }))}
                        placeholder="© 2025 Company Name. All rights reserved."
                      />
                    </div>
                    <div>
                      <Label htmlFor="copyright-ar">Copyright Text (Arabic)</Label>
                      <Input
                        id="copyright-ar"
                        value={reportSettings.footer.copyrightTextAr}
                        onChange={(e) => setReportSettings(prev => ({
                          ...prev,
                          footer: { ...prev.footer, copyrightTextAr: e.target.value }
                        }))}
                        placeholder="© 2025 اسم الشركة. جميع الحقوق محفوظة."
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetReportToDefaults}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateReportPreview}
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Preview Layout
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    onClick={saveReportSettings}
                    className="btn-primary flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;