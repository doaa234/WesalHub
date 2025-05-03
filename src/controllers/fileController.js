import { createLogger } from '../utils/logger';
import fileStorageService from '../services/fileStorageService';
import { logSensitiveAccess } from '../utils/logger';
import config from '../config';

const logger = createLogger('file-controller');

/**
 * Upload file for a resident
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const uploadFile = async (req, res) => {
  try {
    const { residentId, category } = req.params;
    const { description, title } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Check if category exists
    const fileCategory = fileStorageService.getFileCategory(category);
    if (!fileCategory) {
      return res.status(400).json({ message: 'Invalid file category' });
    }
    
    // Store file with encryption
    const fileInfo = await fileStorageService.storeFile(
      req.file,
      residentId,
      category,
      { description, title }
    );
    
    // Save file info to database (this would be implemented in a real application)
    // For this example, we'll just return the file info
    
    // Log sensitive file access
    logSensitiveAccess({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'upload',
      resource: 'resident-file',
      resourceId: residentId,
      fileCategory: category,
      timestamp: new Date().toISOString()
    });
    
    // Return success response
    return res.status(201).json({
      id: fileInfo.id,
      filename: fileInfo.originalName,
      mimeType: fileInfo.mimeType,
      size: fileInfo.size,
      category,
      uploadDate: fileInfo.uploadDate,
      title,
      description,
      icon: fileStorageService.getFileIcon(fileInfo.mimeType),
      supportsPreview: fileStorageService.supportsPreview(fileInfo.mimeType)
    });
  } catch (error) {
    logger.error('File upload error', { error: error.message });
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get file for a resident
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get file info from database (this would be implemented in a real application)
    // For this example, we'll assume we have the file info
    const fileInfo = await getFileInfoFromDatabase(fileId);
    
    if (!fileInfo) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Check if user has permission to view this file
    // This would be implemented based on your permission system
    
    // Log sensitive file access
    logSensitiveAccess({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'view',
      resource: 'resident-file',
      resourceId: fileInfo.residentId,
      fileId,
      fileCategory: fileInfo.category,
      timestamp: new Date().toISOString()
    });
    
    // Retrieve and decrypt file
    const fileBuffer = await fileStorageService.retrieveFile(fileInfo);
    
    // Set appropriate headers
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.originalName}"`);
    
    // Send file
    return res.send(fileBuffer);
  } catch (error) {
    logger.error('File retrieval error', { error: error.message });
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Delete file for a resident
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Get file info from database (this would be implemented in a real application)
    // For this example, we'll assume we have the file info
    const fileInfo = await getFileInfoFromDatabase(fileId);
    
    if (!fileInfo) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Check if user has permission to delete this file
    // This would be implemented based on your permission system
    
    // Log sensitive file access
    logSensitiveAccess({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'delete',
      resource: 'resident-file',
      resourceId: fileInfo.residentId,
      fileId,
      fileCategory: fileInfo.category,
      timestamp: new Date().toISOString()
    });
    
    // Delete file
    await fileStorageService.deleteFile(fileInfo);
    
    // Remove file info from database (this would be implemented in a real application)
    
    // Return success response
    return res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    logger.error('File deletion error', { error: error.message });
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Get all files for a resident
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const getResidentFiles = async (req, res) => {
  try {
    const { residentId } = req.params;
    const { category } = req.query;
    
    // Get files from database (this would be implemented in a real application)
    // For this example, we'll return mock data
    const files = await getResidentFilesFromDatabase(residentId, category);
    
    // Map files to include icon and preview support
    const mappedFiles = files.map(file => ({
      ...file,
      icon: fileStorageService.getFileIcon(file.mimeType),
      supportsPreview: fileStorageService.supportsPreview(file.mimeType)
    }));
    
    // Return files
    return res.status(200).json(mappedFiles);
  } catch (error) {
    logger.error('File listing error', { error: error.message });
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Mock function to get file info from database
 * In a real application, this would query a database
 */
const getFileInfoFromDatabase = async (fileId) => {
  // This is just a placeholder
  // In a real app, this would query your database
  return null;
};

/**
 * Mock function to get resident files from database
 * In a real application, this would query a database
 */
const getResidentFilesFromDatabase = async (residentId, category) => {
  // This is just a placeholder
  // In a real app, this would query your database
  return [];
};

export default {
  uploadFile,
  getFile,
  deleteFile,
  getResidentFiles
};