import * as XLSX from 'xlsx';
import { createLogger } from '../utils/logger';

const logger = createLogger('excel-service');

/**
 * Service for handling Excel import/export operations
 */
const excelService = {
  /**
   * Parse Excel file and return JSON data
   * @param {File} file - Excel file to parse
   * @returns {Promise<Object>} - Parsed data and metadata
   */
  parseExcel: async (file) => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1,
              defval: '',
              blankrows: false
            });
            
            // Extract headers (first row)
            const headers = jsonData[0];
            const rows = jsonData.slice(1);
            
            // Get all sheet names
            const sheets = workbook.SheetNames;
            
            resolve({
              headers,
              rows,
              sheets,
              totalRows: rows.length,
              totalSheets: sheets.length
            });
          } catch (error) {
            logger.error('Error parsing Excel file', { error: error.message });
            reject(new Error('Invalid Excel file format'));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Error reading file'));
        };
        
        reader.readAsArrayBuffer(file);
      } catch (error) {
        logger.error('Error processing Excel file', { error: error.message });
        reject(error);
      }
    });
  },
  
  /**
   * Validate Excel data against required fields and data types
   * @param {Array} headers - Excel headers
   * @param {Array} rows - Excel data rows
   * @param {Object} schema - Validation schema with required fields
   * @returns {Object} - Validation results
   */
  validateExcelData: (headers, rows, schema) => {
    const errors = [];
    const warnings = [];
    
    // Check required headers
    const missingHeaders = schema.requiredFields.filter(
      field => !headers.includes(field.name) && !headers.includes(field.nameAr)
    );
    
    if (missingHeaders.length > 0) {
      errors.push({
        type: 'missing_headers',
        message: `Missing required headers: ${missingHeaders.map(h => h.name).join(', ')}`,
        fields: missingHeaders
      });
    }
    
    // Map headers to schema fields
    const headerMap = {};
    headers.forEach((header, index) => {
      const schemaField = schema.fields.find(
        field => field.name === header || field.nameAr === header
      );
      
      if (schemaField) {
        headerMap[index] = schemaField;
      }
    });
    
    // Validate each row
    rows.forEach((row, rowIndex) => {
      const rowErrors = [];
      
      // Check each cell based on schema
      Object.keys(headerMap).forEach(colIndex => {
        const field = headerMap[colIndex];
        const value = row[colIndex];
        
        // Check required fields
        if (field.required && (value === undefined || value === '')) {
          rowErrors.push({
            field: field.name,
            message: `Missing required value for ${field.name}`,
            column: parseInt(colIndex),
            value
          });
        }
        
        // Validate data type
        if (value !== undefined && value !== '' && field.type) {
          const typeError = validateDataType(value, field.type);
          if (typeError) {
            rowErrors.push({
              field: field.name,
              message: `Invalid ${field.type}: ${typeError}`,
              column: parseInt(colIndex),
              value
            });
          }
        }
      });
      
      if (rowErrors.length > 0) {
        errors.push({
          row: rowIndex + 2, // +2 because row 0 is header and Excel is 1-indexed
          errors: rowErrors
        });
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  },
  
  /**
   * Convert data to Excel format and return as blob
   * @param {Array} data - Data to export
   * @param {Object} options - Export options
   * @returns {Blob} - Excel file as blob
   */
  exportToExcel: (data, options = {}) => {
    try {
      const { 
        sheetName = 'Data',
        fileName = 'export.xlsx',
        includeHeaders = true
      } = options;
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data, { 
        skipHeader: !includeHeaders 
      });
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Convert to Blob
      return new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
    } catch (error) {
      logger.error('Error exporting to Excel', { error: error.message });
      throw error;
    }
  },
  
  /**
   * Map data from Excel format to application model
   * @param {Array} headers - Excel headers
   * @param {Array} rows - Excel data rows
   * @param {Object} mappingSchema - Schema for mapping fields
   * @returns {Array} - Mapped data objects
   */
  mapExcelDataToModel: (headers, rows, mappingSchema) => {
    // Create header mapping (Excel header -> model field)
    const headerMapping = {};
    
    headers.forEach((header, index) => {
      // Check English field names
      const englishField = mappingSchema.fields.find(field => field.name === header);
      if (englishField) {
        headerMapping[index] = englishField.key;
        return;
      }
      
      // Check Arabic field names
      const arabicField = mappingSchema.fields.find(field => field.nameAr === header);
      if (arabicField) {
        headerMapping[index] = arabicField.key;
      }
    });
    
    // Map each row to model object
    return rows.map(row => {
      const obj = {};
      
      Object.keys(headerMapping).forEach(colIndex => {
        const modelKey = headerMapping[colIndex];
        const value = row[colIndex];
        
        if (value !== undefined) {
          obj[modelKey] = value;
        }
      });
      
      return obj;
    });
  }
};

/**
 * Validate a value against a specified data type
 * @param {any} value - Value to validate
 * @param {string} type - Data type to validate against
 * @returns {string|null} - Error message or null if valid
 */
const validateDataType = (value, type) => {
  switch (type) {
    case 'string':
      return typeof value === 'string' || typeof value === 'number' ? null : 'Must be text';
      
    case 'number':
      return !isNaN(Number(value)) ? null : 'Must be a number';
      
    case 'date':
      const date = new Date(value);
      return !isNaN(date.getTime()) ? null : 'Must be a valid date';
      
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(String(value)) ? null : 'Must be a valid email';
      
    case 'phone':
      const phoneRegex = /^\d{10,15}$/;
      return phoneRegex.test(String(value).replace(/\D/g, '')) ? null : 'Must be a valid phone number';
      
    default:
      return null;
  }
};

export default excelService;