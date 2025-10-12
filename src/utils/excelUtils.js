import * as XLSX from 'xlsx';

// Create and download an Excel template for categories
export const downloadCategoryTemplate = () => {
  // Create empty template data with headers only
  const templateData = [
    ['Main Category', 'Category'], // Headers only - empty template for users to fill
  ];

  // Create a new workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(templateData);

  // Set column widths
  ws['!cols'] = [
    { width: 25 }, // Main Category column
    { width: 25 }, // Category column
  ];

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Categories Template');

  // Generate and download the file
  const fileName = `categories_template_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Parse Excel file and return categories data
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip empty rows and header row
        const dataRows = jsonData.slice(1).filter(row => 
          row && row.length > 0 && (row[0] || row[1])
        );
        
        // Transform to the expected format with enhanced validation
        const categories = dataRows.map((row, index) => {
          const rowNumber = index + 2; // Account for header row
          const mainCategory = row[0] ? String(row[0]).trim() : '';
          const category = row[1] ? String(row[1]).trim() : '';
          
          // Validate required fields - only category is required, main category is optional
          if (!category) {
            throw new Error(`Row ${rowNumber}: Category name is required and cannot be empty`);
          }
          
          // Validate category length (most databases have 255 char limit)
          if (category.length > 255) {
            throw new Error(`Row ${rowNumber}: Category name too long (maximum 255 characters)`);
          }
          
          // Validate main category length if provided
          if (mainCategory && mainCategory.length > 255) {
            throw new Error(`Row ${rowNumber}: Main category name too long (maximum 255 characters)`);
          }
          
          // Basic validation for special characters (adjust based on your requirements)
          const invalidCharsRegex = /[<>\"\'&]/;
          if (invalidCharsRegex.test(category)) {
            throw new Error(`Row ${rowNumber}: Category contains invalid characters (<, >, ", ', &)`);
          }
          
          if (mainCategory && invalidCharsRegex.test(mainCategory)) {
            throw new Error(`Row ${rowNumber}: Main category contains invalid characters (<, >, ", ', &)`);
          }
          
          return {
            category: mainCategory || '', // First column (Main Category) maps to backend category field
            subcategory: category // Second column (Category) maps to backend subcategory field
            // Note: _rowNumber removed as backend doesn't expect this field
          };
        });
        
        resolve(categories);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Validate Excel file format
export const validateExcelFile = (file) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Please upload a valid Excel file (.xlsx or .xls)');
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB limit
    throw new Error('File size must be less than 5MB');
  }
  
  return true;
};

// Create Excel file from bulk import results
export const exportBulkResults = (results) => {
  const { summary, added, rejected } = results;
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['Bulk Import Summary', ''],
    ['Total Records', summary.total],
    ['Successfully Added', summary.added],  
    ['Rejected', summary.rejected],
    ['Success Rate', `${summary.success_rate}%`],
    ['Import Date', new Date().toLocaleString()],
  ];
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ width: 20 }, { width: 15 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
  
  // Successfully added sheet
  if (added && added.length > 0) {
    const addedData = [
      ['ID', 'Main Category', 'Category', 'Status'],
      ...added.map(item => [
        item.id, 
        item.category || '(no main category)', 
        item.subcategory,
        '✅ Successfully created in database'
      ])
    ];
    
    const addedWs = XLSX.utils.aoa_to_sheet(addedData);
    addedWs['!cols'] = [{ width: 10 }, { width: 20 }, { width: 20 }, { width: 30 }];
    XLSX.utils.book_append_sheet(wb, addedWs, 'Successfully Added');
  }
  
  // Rejected sheet
  if (rejected && rejected.length > 0) {
    const rejectedData = [
      ['Row', 'Main Category', 'Category', 'Status & Reason'],
      ...rejected.map(item => {
        let message = item.error || 'Unknown error';
        
        // Enhanced message customization based on error type and context
        const errorLower = message.toLowerCase();
        const categoryName = item.data?.subcategory || '';
        const mainCategoryName = item.data?.category || '';
        
        if (errorLower.includes('already exists') || errorLower.includes('duplicate')) {
          message = `⚠️ Category "${categoryName}" already exists`;
          if (mainCategoryName) {
            message += ` in main category "${mainCategoryName}"`;
          }
          message += ' - Skipped to avoid duplicates';
        } else if (errorLower.includes('required') || errorLower.includes('missing') || errorLower.includes('cannot be empty')) {
          if (!categoryName || categoryName.trim() === '') {
            message = '❌ Category name is required and cannot be empty';
          } else {
            message = `❌ Required field missing: ${message}`;
          }
        } else if (errorLower.includes('validation') || errorLower.includes('invalid')) {
          message = `❌ Invalid data format`;
          if (categoryName) {
            message += ` for category "${categoryName}"`;
          }
          message += ` - ${message}`;
        } else if (errorLower.includes('empty') || errorLower.includes('blank')) {
          message = '⚠️ Empty row detected - Skipped';
        } else if (errorLower.includes('too long') || errorLower.includes('length')) {
          message = `❌ Text too long`;
          if (categoryName) {
            message += ` for category "${categoryName}"`;
          }
          message += ' - Maximum 255 characters allowed';
        } else if (errorLower.includes('special characters') || errorLower.includes('invalid characters')) {
          message = `❌ Invalid characters detected`;
          if (categoryName) {
            message += ` in category "${categoryName}"`;
          }
          message += ' - Only letters, numbers, spaces, and basic punctuation allowed';
        } else if (errorLower.includes('network') || errorLower.includes('connection')) {
          message = '🌐 Network error - Please check your connection and try again';
        } else if (errorLower.includes('server') || errorLower.includes('internal')) {
          message = '🔧 Server error - Please contact administrator';
        } else {
          message = `❌ ${message}`;
        }
        
        return [
          item.row_number || '', 
          item.data?.category || '(empty)', 
          item.data?.subcategory || '(empty)', 
          message
        ];
      })
    ];
    
    const rejectedWs = XLSX.utils.aoa_to_sheet(rejectedData);
    rejectedWs['!cols'] = [{ width: 10 }, { width: 20 }, { width: 20 }, { width: 40 }];
    XLSX.utils.book_append_sheet(wb, rejectedWs, 'Rejected');
  }
  
  // Download the file
  const fileName = `bulk_import_results_${new Date().toISOString().split('T')[0]}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
};