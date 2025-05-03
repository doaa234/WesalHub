import { createLogger } from '../utils/logger';
import excelService from '../services/excelService';
import residentService from '../services/residentService';
import { logSensitiveAccess } from '../utils/logger';

const logger = createLogger('excel-controller');

/**
 * Get resident data schema for Excel operations
 */
const getResidentSchema = () => ({
  requiredFields: [
    { name: 'Name', nameAr: 'الاسم', key: 'fullName', required: true, type: 'string' },
    { name: 'Unit Number', nameAr: 'رقم الوحدة', key: 'unitNumber', required: true, type: 'string' },
  ],
  fields: [
    { name: 'Name', nameAr: 'الاسم', key: 'fullName', required: true, type: 'string' },
    { name: 'Unit Number', nameAr: 'رقم الوحدة', key: 'unitNumber', required: true, type: 'string' },
    { name: 'Email', nameAr: 'البريد الإلكتروني', key: 'email', required: false, type: 'email' },
    { name: 'Phone', nameAr: 'الهاتف', key: 'phone', required: false, type: 'phone' },
    { name: 'Sector', nameAr: 'القطاع', key: 'sector', required: false, type: 'string' },
    { name: 'Role', nameAr: 'الدور', key: 'role', required: false, type: 'string' },
    { name: 'Status', nameAr: 'الحالة', key: 'status', required: false, type: 'string' },
    { name: 'Registration Date', nameAr: 'تاريخ التسجيل', key: 'registrationDate', required: false, type: 'date' },
  ]
});

/**
 * Validate Excel file for import
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const validateExcelImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Log sensitive operation
    logSensitiveAccess({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'validate',
      resource: 'excel-import',
      timestamp: new Date().toISOString()
    });
    
    // Parse Excel file
    const { headers, rows } = await excelService.parseExcel(req.file);
    
    // Get schema for validation
    const schema = getResidentSchema();
    
    // Validate data
    const validationResult = excelService.validateExcelData(headers, rows, schema);
    
    // Return validation results
    return res.status(200).json({
      valid: validationResult.valid,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      preview: {
        headers,
        rows: rows.slice(0, 5), // Preview first 5 rows
        totalRows: rows.length
      }
    });
  } catch (error) {
    logger.error('Excel validation error', { error: error.message });
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Import data from Excel file
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const importExcelData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Log sensitive operation
    logSensitiveAccess({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'import',
      resource: 'excel-import',
      timestamp: new Date().toISOString()
    });
    
    // Parse Excel file
    const { headers, rows } = await excelService.parseExcel(req.file);
    
    // Get schema for mapping
    const schema = getResidentSchema();
    
    // Map Excel data to model
    const mappedData = excelService.mapExcelDataToModel(headers, rows, schema);
    
    // Import data (in a real app, this would save to database)
    const importResult = await residentService.bulkImportResidents(mappedData);
    
    // Return import results
    return res.status(200).json({
      success: true,
      imported: importResult.imported,
      failed: importResult.failed,
      total: mappedData.length
    });
  } catch (error) {
    logger.error('Excel import error', { error: error.message });
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Export data to Excel file
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const exportExcelData = async (req, res) => {
  try {
    const { filters } = req.query;
    
    // Log sensitive operation
    logSensitiveAccess({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'export',
      resource: 'excel-export',
      filters: filters ? JSON.parse(filters) : null,
      timestamp: new Date().toISOString()
    });
    
    // Parse filters if provided
    const parsedFilters = filters ? JSON.parse(filters) : {};
    
    // Get data from service
    const data = await residentService.getResidentsForExport(parsedFilters);
    
    // Convert to Excel
    const excelBlob = excelService.exportToExcel(data, {
      sheetName: 'Residents',
      fileName: 'residents_export.xlsx'
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="residents_export.xlsx"');
    
    // Send file
    return res.send(excelBlob);
  } catch (error) {
    logger.error('Excel export error', { error: error.message });
    return res.status(500).json({ message: error.message });
  }
};