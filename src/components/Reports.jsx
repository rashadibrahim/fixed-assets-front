import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Download,
  Filter,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Search,
  RefreshCw,
  AlertCircle,
  Eye,
  ChevronDown,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from 'sonner';
import apiClient from '../utils/api';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'all',           // Changed from category_ids to category
    subcategory: 'all',        // Keep subcategory as is
    branch_id: 'all',
    warehouse_id: 'all'
  });

  // Options for searchable dropdowns
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  // Loading states for each dropdown
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);

  // Search states
  const [categorySearch, setCategorySearch] = useState('');
  const [subcategorySearch, setSubcategorySearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');
  const [warehouseSearch, setWarehouseSearch] = useState('');

  // Dropdown open states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);

  useEffect(() => {
    // Load initial data with empty search
    loadCategories('');
    loadBranches('');
    loadWarehouses('');
  }, []);

  // Load report settings from localStorage
  const loadReportSettings = () => {
    const saved = localStorage.getItem('reportSettings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading report settings:', error);
        return getDefaultReportSettings();
      }
    }
    return getDefaultReportSettings();
  };

  const getDefaultReportSettings = () => ({
    header: {
      companyName: 'Company Name',
      companyNameAr: 'اسم الشركة',
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
      copyrightText: '© 2025 All rights reserved.',
      copyrightTextAr: '© 2025 جميع الحقوق محفوظة.'
    }
  });

  // Debounced search functions
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedCategorySearch = useDebounce(categorySearch, 300);
  const debouncedSubcategorySearch = useDebounce(subcategorySearch, 300);
  const debouncedBranchSearch = useDebounce(branchSearch, 300);
  const debouncedWarehouseSearch = useDebounce(warehouseSearch, 300);

  // Load categories with search
  const loadCategories = async (searchTerm = '') => {
    try {
      setLoadingCategories(true);
      console.log('Loading categories with search:', searchTerm);

      const params = { per_page: 100, page: 1 };
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await apiClient.getCategories(params);
      console.log('Categories response:', response);

      if (response && response.items) {
        // Extract unique categories only (not category + subcategory)
        const uniqueCategories = [...new Set(
          response.items
            .filter(item => item.category)
            .map(item => item.category)
        )];
        setCategories(uniqueCategories.map(cat => ({ category: cat })));
        console.log('Categories set:', uniqueCategories);
      } else {
        console.warn('Categories data has unexpected structure:', response);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error loading categories');
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load subcategories with search
  const loadSubcategories = async (searchTerm = '') => {
    try {
      setLoadingSubcategories(true);
      console.log('Loading subcategories with search:', searchTerm);

      const params = { per_page: 100, page: 1 };
      if (searchTerm.trim()) {
        params.subcategory = searchTerm.trim();
      }

      const response = await apiClient.getCategories(params);
      console.log('Subcategories response:', response);

      if (response && response.items) {
        // Extract unique subcategories
        const uniqueSubcategories = [...new Set(
          response.items
            .filter(item => item.subcategory)
            .map(item => item.subcategory)
        )];
        setSubcategories(uniqueSubcategories.map(sub => ({ subcategory: sub })));
        console.log('Subcategories set:', uniqueSubcategories);
      } else {
        console.warn('Subcategories data has unexpected structure:', response);
        setSubcategories([]);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast.error('Error loading subcategories');
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  // Load branches with search
  const loadBranches = async (searchTerm = '') => {
    try {
      setLoadingBranches(true);
      console.log('Loading branches with search:', searchTerm);

      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({ per_page: 100, page: 1 });
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`${apiClient.baseURL}/branches/?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Branches response:', data);

      if (data && data.items) {
        setBranches(data.items);
        console.log('Branches set:', data.items);
      } else {
        console.warn('Branches data has unexpected structure:', data);
        setBranches([]);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Error loading branches');
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  // Load warehouses with search
  const loadWarehouses = async (searchTerm = '') => {
    try {
      setLoadingWarehouses(true);
      console.log('Loading warehouses with search:', searchTerm);

      const token = localStorage.getItem('authToken');
      const params = new URLSearchParams({ per_page: 100, page: 1 });
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      const response = await fetch(`${apiClient.baseURL}/warehouses/?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Warehouses response:', data);

      if (data && data.items) {
        setWarehouses(data.items);
        console.log('Warehouses set:', data.items);
      } else {
        console.warn('Warehouses data has unexpected structure:', data);
        setWarehouses([]);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Error loading warehouses');
      setWarehouses([]);
    } finally {
      setLoadingWarehouses(false);
    }
  };

  // Effect for debounced searches
  useEffect(() => {
    if (categoryOpen) {
      loadCategories(debouncedCategorySearch);
    }
  }, [debouncedCategorySearch, categoryOpen]);

  useEffect(() => {
    if (subcategoryOpen) {
      loadSubcategories(debouncedSubcategorySearch);
    }
  }, [debouncedSubcategorySearch, subcategoryOpen]);

  useEffect(() => {
    if (branchOpen) {
      loadBranches(debouncedBranchSearch);
    }
  }, [debouncedBranchSearch, branchOpen]);

  useEffect(() => {
    if (warehouseOpen) {
      loadWarehouses(debouncedWarehouseSearch);
    }
  }, [debouncedWarehouseSearch, warehouseOpen]);

  // Helper function to get display text for selected items
  const getSelectedCategoryText = () => {
    if (filters.category === 'all') return 'All Categories';
    return filters.category || 'Select category';
  };

  const getSelectedSubcategoryText = () => {
    if (filters.subcategory === 'all') return 'All main categories';
    return filters.subcategory || 'Select main category';
  };

  const getSelectedBranchText = () => {
    if (filters.branch_id === 'all') return 'All Branches';
    const branch = branches.find(b => b.id.toString() === filters.branch_id);
    return branch ? `${branch.name_en} (${branch.name_ar})` : 'Select branch';
  };

  const getSelectedWarehouseText = () => {
    if (filters.warehouse_id === 'all') return 'All Warehouses';
    const warehouse = warehouses.find(w => w.id.toString() === filters.warehouse_id);
    return warehouse ? `${warehouse.name_en} (${warehouse.name_ar})` : 'Select warehouse';
  };

  const generateReport = async () => {
    if (!filters.date) {
      toast.error('Please select a date to generate the report');
      return;
    }

    try {
      setLoading(true);

      // Build query parameters
      const queryParams = new URLSearchParams({
        date: filters.date
      });

      // Add category name (not ID) if selected
      if (filters.category && filters.category !== 'all') {
        queryParams.append('category', filters.category);
      }

      // Add subcategory name if selected
      if (filters.subcategory && filters.subcategory !== 'all') {
        queryParams.append('subcategory', filters.subcategory);
      }

      if (filters.branch_id && filters.branch_id !== 'all') {
        queryParams.append('branch_id', filters.branch_id);
      }
      if (filters.warehouse_id && filters.warehouse_id !== 'all') {
        queryParams.append('warehouse_id', filters.warehouse_id);
      }

      console.log('Generating report with params:', queryParams.toString());

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiClient.baseURL}/transactions/generate-report?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Report data received:', data);
      setReportData(data);
      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(`Failed to generate report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) {
      toast.error('No report data to export');
      return;
    }

    try {
      const reportSettings = loadReportSettings();
      const reportDate = new Date(filters.date).toLocaleDateString();

      // Create the PDF window
      const pdfWindow = window.open('', '_blank', 'width=1000,height=800');

      // Generate the HTML content for PDF (keeping the existing PDF generation code)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Transaction Report - ${reportDate}</title>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
                background: white;
              }
              
              .page {
                width: 215mm;
                min-height: 297mm;
                margin: 0 auto;
                background: white;
                padding: 20mm;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              
              .header {
                margin-bottom: 25px;
                padding-bottom: 15px;
                border-bottom: 2px solid #333;
              }
              
              .company-name {
                font-size: 22px;
                font-weight: bold;
                color: #333;
                margin-bottom: 3px;
                text-align: center;
              }
              
              .company-name-ar {
                font-size: 18px;
                font-weight: bold;
                color: #666;
                margin-bottom: 12px;
                direction: rtl;
                text-align: center;
              }
              
              .company-details {
                font-size: 10px;
                color: #666;
                line-height: 1.3;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px 20px;
                max-width: 600px;
                margin: 0 auto;
              }
              
              .company-details > div {
                padding: 2px 0;
              }
              
              .company-details .address-section {
                grid-column: 1 / -1;
                text-align: center;
                margin-bottom: 5px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
              }
              
              .company-details .contact-grid {
                display: contents;
              }
              
              .report-title {
                text-align: center;
                margin: 20px 0;
              }
              
              .report-title h1 {
                font-size: 18px;
                color: #333;
                margin-bottom: 8px;
              }
              
              .report-title p {
                font-size: 11px;
                color: #666;
                margin: 3px 0;
              }
              
              .report-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 25px;
              }
              
              .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
              }
              
              .info-item {
                text-align: center;
                padding: 10px;
                background: white;
                border-radius: 5px;
                border: 1px solid #ddd;
              }
              
              .info-value {
                font-size: 18px;
                font-weight: bold;
                color: #007bff;
                display: block;
              }
              
              .info-label {
                font-size: 10px;
                color: #666;
                text-transform: uppercase;
                margin-top: 5px;
              }
              
              .table-container {
                margin: 20px 0;
                overflow-x: auto;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 10px;
              }
              
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              
              th {
                background-color: #f8f9fa;
                font-weight: bold;
                color: #333;
                text-align: center;
              }
              
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              
              .positive { color: #28a745; font-weight: bold; }
              .negative { color: #dc3545; font-weight: bold; }
              .neutral { color: #333; }
              
              .summary-section {
                margin-top: 30px;
                background: #f8f9fa;
                padding: 20px;
                border-radius: 5px;
              }
              
              .summary-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
              }
              
              .summary-column h4 {
                font-size: 14px;
                margin-bottom: 10px;
                color: #333;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
              }
              
              .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 11px;
              }
              
              .summary-row.total {
                border-top: 1px solid #333;
                padding-top: 5px;
                margin-top: 10px;
                font-weight: bold;
              }
              
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                text-align: center;
                font-size: 10px;
                color: #666;
              }
              
              .footer-section {
                margin-bottom: 8px;
              }
              
              .print-controls {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 1000;
              }
              
              .btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                margin: 0 5px;
                font-size: 12px;
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
              
              @media print {
                .print-controls {
                  display: none;
                }
                
                .page {
                  margin: 0;
                  box-shadow: none;
                  padding: 15mm;
                }
                
                body {
                  background: white;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-controls">
              <button class="btn" onclick="window.print()">Print PDF</button>
              <button class="btn btn-secondary" onclick="window.close()">Close</button>
            </div>
            
            <div class="page">
              <!-- Header -->
              <div class="header">
                ${reportSettings.header.companyName ? `<div class="company-name">${reportSettings.header.companyName}</div>` : ''}
                ${reportSettings.header.companyNameAr ? `<div class="company-name-ar">${reportSettings.header.companyNameAr}</div>` : ''}
                <div class="company-details">
                  ${(reportSettings.header.address || reportSettings.header.addressAr) ? `
                    <div class="address-section">
                      ${reportSettings.header.address ? `<div>${reportSettings.header.address}</div>` : ''}
                      ${reportSettings.header.addressAr ? `<div style="direction: rtl; margin-top: 2px;">${reportSettings.header.addressAr}</div>` : ''}
                    </div>
                  ` : ''}
                  
                  <div class="contact-grid">
                    ${reportSettings.header.phone ? `<div><strong>Phone:</strong> ${reportSettings.header.phone}</div>` : ''}
                    ${reportSettings.header.email ? `<div><strong>Email:</strong> ${reportSettings.header.email}</div>` : ''}
                    ${reportSettings.header.website ? `<div><strong>Website:</strong> ${reportSettings.header.website}</div>` : ''}
                    ${reportSettings.header.additionalInfo ? `<div>${reportSettings.header.additionalInfo}</div>` : ''}
                  </div>
                  
                  ${reportSettings.header.additionalInfoAr ? `
                    <div style="direction: rtl; text-align: center; grid-column: 1 / -1; margin-top: 5px; font-style: italic;">
                      ${reportSettings.header.additionalInfoAr}
                    </div>
                  ` : ''}
                </div>
              </div>
              
              <!-- Report Title -->
              <div class="report-title">
                <h1>Transaction Report</h1>
                <p>Report Date: ${reportDate}</p>
                <p>Generated: ${new Date(reportData.report_metadata.generated_at).toLocaleString()}</p>
              </div>
              
              <!-- Report Summary -->
              <div class="report-info">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-value">${reportData.report_metadata.total_assets}</span>
                    <div class="info-label">Total Assets</div>
                  </div>
                  <div class="info-item">
                    <span class="info-value">${reportData.summary_totals.total_quantity_in}</span>
                    <div class="info-label">Total Quantity In</div>
                  </div>
                  <div class="info-item">
                    <span class="info-value">${reportData.summary_totals.total_quantity_out}</span>
                    <div class="info-label">Total Quantity Out</div>
                  </div>
                  <div class="info-item">
                    <span class="info-value">$${reportData.summary_totals.net_cost.toLocaleString()}</span>
                    <div class="info-label">Net Cost</div>
                  </div>
                </div>
              </div>
              
              <!-- Asset Details Table -->
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Asset Name</th>
                      <th>Product Code</th>
                      <th>Category</th>
                      <th>Qty In</th>
                      <th>Qty Out</th>
                      <th>Amount In</th>
                      <th>Amount Out</th>
                      <th>Cost In</th>
                      <th>Cost Out</th>
                      <th>Net Qty</th>
                      <th>Net Amount</th>
                      <th>Net Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${reportData.asset_reports.length === 0 ?
          '<tr><td colspan="12" class="text-center">No asset transactions found for the selected date and filters.</td></tr>' :
          reportData.asset_reports.map(asset => `
                        <tr>
                          <td>
                            <div><strong>${asset.asset_name_en}</strong></div>
                            <div style="font-size: 9px; color: #666;">${asset.asset_name_ar}</div>
                          </td>
                          <td class="text-center">${asset.product_code}</td>
                          <td>
                            <div>${asset.category}</div>
                            ${asset.subcategory ? `<div style="font-size: 9px; color: #666;">${asset.subcategory}</div>` : ''}
                          </td>
                          <td class="text-right">${asset.total_quantity_in}</td>
                          <td class="text-right">${asset.total_quantity_out}</td>
                          <td class="text-right">$${asset.total_amount_in.toLocaleString()}</td>
                          <td class="text-right">$${asset.total_amount_out.toLocaleString()}</td>
                          <td class="text-right">$${asset.total_cost_in.toLocaleString()}</td>
                          <td class="text-right">$${asset.total_cost_out.toLocaleString()}</td>
                          <td class="text-right ${asset.net_quantity >= 0 ? 'positive' : 'negative'}">${asset.net_quantity}</td>
                          <td class="text-right ${asset.net_amount >= 0 ? 'positive' : 'negative'}">$${asset.net_amount.toLocaleString()}</td>
                          <td class="text-right ${asset.net_cost >= 0 ? 'positive' : 'negative'}">$${asset.net_cost.toLocaleString()}</td>
                        </tr>
                      `).join('')
        }
                  </tbody>
                </table>
              </div>
              
              <!-- Summary Totals -->
              <div class="summary-section">
                <h3 style="text-align: center; margin-bottom: 20px;">Summary Totals</h3>
                <div class="summary-grid">
                  <div class="summary-column">
                    <h4>Quantities</h4>
                    <div class="summary-row">
                      <span>Total In:</span>
                      <span>${reportData.summary_totals.total_quantity_in}</span>
                    </div>
                    <div class="summary-row">
                      <span>Total Out:</span>
                      <span>${reportData.summary_totals.total_quantity_out}</span>
                    </div>
                    <div class="summary-row total">
                      <span>Net:</span>
                      <span>${reportData.summary_totals.net_quantity}</span>
                    </div>
                  </div>
                  
                  <div class="summary-column">
                    <h4>Amounts</h4>
                    <div class="summary-row">
                      <span>Total In:</span>
                      <span>$${reportData.summary_totals.total_amount_in.toLocaleString()}</span>
                    </div>
                    <div class="summary-row">
                      <span>Total Out:</span>
                      <span>$${reportData.summary_totals.total_amount_out.toLocaleString()}</span>
                    </div>
                    <div class="summary-row total ${reportData.summary_totals.net_amount >= 0 ? 'positive' : 'negative'}">
                      <span>Net:</span>
                      <span>$${reportData.summary_totals.net_amount.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div class="summary-column">
                    <h4>Costs</h4>
                    <div class="summary-row">
                      <span>Total In:</span>
                      <span>$${reportData.summary_totals.total_cost_in.toLocaleString()}</span>
                    </div>
                    <div class="summary-row">
                      <span>Total Out:</span>
                      <span>$${reportData.summary_totals.total_cost_out.toLocaleString()}</span>
                    </div>
                    <div class="summary-row total ${reportData.summary_totals.net_cost >= 0 ? 'positive' : 'negative'}">
                      <span>Net:</span>
                      <span>$${reportData.summary_totals.net_cost.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Footer -->
              <div class="footer">
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
                <div class="footer-section">
                  <small>Report generated on ${new Date().toLocaleString()}</small>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      pdfWindow.document.write(htmlContent);
      pdfWindow.document.close();

      // Auto-focus the window for better user experience
      pdfWindow.focus();

      toast.success('PDF report opened successfully! Use your browser\'s print function to save as PDF.');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report');
    }
  };

  const clearFilters = () => {
    setFilters({
      date: new Date().toISOString().split('T')[0],
      category: 'all',          // Changed from category_ids to category
      subcategory: 'all',
      branch_id: 'all',
      warehouse_id: 'all'
    });
    setReportData(null);
    setCategorySearch('');
    setSubcategorySearch('');
    setBranchSearch('');
    setWarehouseSearch('');
  };

  const exportToExcel = async () => {
    if (!filters.date) {
      toast.error('Date is required for export');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare export parameters based on current filters
      const exportParams = { date: filters.date };
      
      // Add optional filters
      if (filters.category && filters.category !== 'all') {
        exportParams.category = filters.category;
      }
      if (filters.subcategory && filters.subcategory !== 'all') {
        exportParams.subcategory = filters.subcategory;
      }
      if (filters.branch_id && filters.branch_id !== 'all') {
        exportParams.branch_id = filters.branch_id;
      }
      if (filters.warehouse_id && filters.warehouse_id !== 'all') {
        exportParams.warehouse_id = filters.warehouse_id;
      }
      
      // Get the blob from API
      const blob = await apiClient.exportTransactionsReport(exportParams);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date and filters
      let filename = `transaction_report_${filters.date}`;
      if (filters.category && filters.category !== 'all') {
        filename += `_${filters.category.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
      if (filters.subcategory && filters.subcategory !== 'all') {
        filename += `_${filters.subcategory.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
      filename += '.xlsx';
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Transaction report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export transaction report');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaction Reports</h1>
          <p className="text-muted-foreground">Generate detailed transaction reports by date and filters</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={exportToExcel} disabled={loading || !filters.date}>
            <FileText className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          {reportData && (
            <Button variant="outline" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          )}
          <Button variant="outline" onClick={clearFilters}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date Filter - Required */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="w-full"
              />
            </div>

            {/* Category Filter with Search */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between"
                  >
                    <span className="truncate">{getSelectedCategoryText()}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search categories..."
                      value={categorySearch}
                      onValueChange={setCategorySearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loadingCategories ? "Loading..." : "No categories found."}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setFilters({ ...filters, category: 'all' });
                            setCategoryOpen(false);
                            setCategorySearch('');
                          }}
                        >
                          All Categories
                        </CommandItem>
                        {categories.map((category, index) => (
                          <CommandItem
                            key={index}
                            onSelect={() => {
                              setFilters({ ...filters, category: category.category });
                              setCategoryOpen(false);
                              setCategorySearch('');
                            }}
                          >
                            {category.category}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">Categories loaded: {categories.length}</p>
            </div>

            {/* Subcategory Filter with Search */}
            <div className="space-y-2">
              <Label>Main Category</Label>
              <Popover open={subcategoryOpen} onOpenChange={setSubcategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={subcategoryOpen}
                    className="w-full justify-between"
                  >
                    <span className="truncate">{getSelectedSubcategoryText()}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search main categories..."
                      value={subcategorySearch}
                      onValueChange={setSubcategorySearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loadingSubcategories ? "Loading..." : "No main categories found."}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setFilters({ ...filters, subcategory: 'all' });
                            setSubcategoryOpen(false);
                            setSubcategorySearch('');
                          }}
                        >
                          All main categories
                        </CommandItem>
                        {subcategories.map((subcategory, index) => (
                          <CommandItem
                            key={index}
                            onSelect={() => {
                              setFilters({ ...filters, subcategory: subcategory.subcategory });
                              setSubcategoryOpen(false);
                              setSubcategorySearch('');
                            }}
                          >
                            {subcategory.subcategory}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">Main categories loaded: {subcategories.length}</p>
            </div>

            {/* Branch Filter with Search */}
            <div className="space-y-2">
              <Label>Branch</Label>
              <Popover open={branchOpen} onOpenChange={setBranchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={branchOpen}
                    className="w-full justify-between"
                  >
                    <span className="truncate">{getSelectedBranchText()}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search branches..."
                      value={branchSearch}
                      onValueChange={setBranchSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loadingBranches ? "Loading..." : "No branches found."}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setFilters({ ...filters, branch_id: 'all' });
                            setBranchOpen(false);
                            setBranchSearch('');
                          }}
                        >
                          All Branches
                        </CommandItem>
                        {branches.map((branch) => (
                          <CommandItem
                            key={branch.id}
                            onSelect={() => {
                              setFilters({ ...filters, branch_id: branch.id.toString() });
                              setBranchOpen(false);
                              setBranchSearch('');
                            }}
                          >
                            {branch.name_en} ({branch.name_ar})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">Branches loaded: {branches.length}</p>
            </div>

            {/* Warehouse Filter with Search */}
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Popover open={warehouseOpen} onOpenChange={setWarehouseOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={warehouseOpen}
                    className="w-full justify-between"
                  >
                    <span className="truncate">{getSelectedWarehouseText()}</span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search warehouses..."
                      value={warehouseSearch}
                      onValueChange={setWarehouseSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {loadingWarehouses ? "Loading..." : "No warehouses found."}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => {
                            setFilters({ ...filters, warehouse_id: 'all' });
                            setWarehouseOpen(false);
                            setWarehouseSearch('');
                          }}
                        >
                          All Warehouses
                        </CommandItem>
                        {warehouses.map((warehouse) => (
                          <CommandItem
                            key={warehouse.id}
                            onSelect={() => {
                              setFilters({ ...filters, warehouse_id: warehouse.id.toString() });
                              setWarehouseOpen(false);
                              setWarehouseSearch('');
                            }}
                          >
                            {warehouse.name_en} ({warehouse.name_ar})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">Warehouses loaded: {warehouses.length}</p>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={generateReport} disabled={loading || !filters.date} className="btn-primary">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <>
          {/* Report Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Report Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">
                    {reportData.report_metadata.total_assets}
                  </p>
                  <p className="text-sm text-blue-600">Total Assets</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">
                    {reportData.summary_totals.total_quantity_in}
                  </p>
                  <p className="text-sm text-green-600">Total Quantity In</p>
                </div>

                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <TrendingDown className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">
                    {reportData.summary_totals.total_quantity_out}
                  </p>
                  <p className="text-sm text-red-600">Total Quantity Out</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">
                    ${reportData.summary_totals.net_cost.toLocaleString()}
                  </p>
                  <p className="text-sm text-purple-600">Net Cost</p>
                </div>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                <p>Generated at: {new Date(reportData.report_metadata.generated_at).toLocaleString()}</p>
                <p>Transactions analyzed: {reportData.report_metadata.total_transactions_analyzed}</p>
              </div>
            </CardContent>
          </Card>

          {/* Asset Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Asset Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.asset_reports.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No asset transactions found for the selected date and filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset</TableHead>
                        <TableHead>Product Code</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Qty In</TableHead>
                        <TableHead className="text-right">Qty Out</TableHead>
                        <TableHead className="text-right">Amount In</TableHead>
                        <TableHead className="text-right">Amount Out</TableHead>
                        <TableHead className="text-right">Cost In</TableHead>
                        <TableHead className="text-right">Cost Out</TableHead>
                        <TableHead className="text-right">Net Qty</TableHead>
                        <TableHead className="text-right">Net Amount</TableHead>
                        <TableHead className="text-right">Net Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.asset_reports.map((asset) => (
                        <TableRow key={asset.asset_id} className="hover:bg-muted/50">
                          <TableCell>
                            <div>
                              <p className="font-medium">{asset.asset_name_en}</p>
                              <p className="text-sm text-muted-foreground">{asset.asset_name_ar}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{asset.product_code}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{asset.category}</p>
                              {asset.subcategory && (
                                <p className="text-xs text-muted-foreground">{asset.subcategory}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{asset.total_quantity_in}</TableCell>
                          <TableCell className="text-right">{asset.total_quantity_out}</TableCell>
                          <TableCell className="text-right">${asset.total_amount_in.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${asset.total_amount_out.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${asset.total_cost_in.toLocaleString()}</TableCell>
                          <TableCell className="text-right">${asset.total_cost_out.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={asset.net_quantity >= 0 ? "default" : "destructive"}>
                              {asset.net_quantity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={asset.net_amount >= 0 ? "text-green-600" : "text-red-600"}>
                              ${asset.net_amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={asset.net_cost >= 0 ? "text-green-600" : "text-red-600"}>
                              ${asset.net_cost.toLocaleString()}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Summary Totals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Quantities</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total In:</span>
                      <span className="font-medium">{reportData.summary_totals.total_quantity_in}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Out:</span>
                      <span className="font-medium">{reportData.summary_totals.total_quantity_out}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-sm font-medium">Net:</span>
                      <span className="font-bold">{reportData.summary_totals.net_quantity}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Amounts</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total In:</span>
                      <span className="font-medium">${reportData.summary_totals.total_amount_in.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Out:</span>
                      <span className="font-medium">${reportData.summary_totals.total_amount_out.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-sm font-medium">Net:</span>
                      <span className={`font-bold ${reportData.summary_totals.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${reportData.summary_totals.net_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Costs</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total In:</span>
                      <span className="font-medium">${reportData.summary_totals.total_cost_in.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Out:</span>
                      <span className="font-medium">${reportData.summary_totals.total_cost_out.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-sm font-medium">Net:</span>
                      <span className={`font-bold ${reportData.summary_totals.net_cost >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${reportData.summary_totals.net_cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Reports;