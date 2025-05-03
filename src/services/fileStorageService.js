import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import fileEncryptionService from './fileEncryptionService';
import { createLogger } from '../utils/logger';

const logger = createLogger('file-storage');

// Promisify fs functions
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

/**
 * Generate a unique filename
 * @param {string} originalName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {string} - Unique filename
 */
const generateUniqueFilename = (originalName, mimeType) => {
  const fileType = config.fileStorage.allowedFileTypes[mimeType];
  const extension = fileType ? fileType.extension : path.extname(originalName).slice(1);
  return `${uuidv4()}.${extension}`;
};

/**
 * Check if file type is allowed
 * @param {string} mimeType - File MIME type
 * @returns {boolean} - Whether file type is allowed
 */
export const isFileTypeAllowed = (mimeType) => {
  return Object.keys(config.fileStorage.allowedFileTypes).includes(mimeType);
};

/**
 * Get file category by ID
 * @param {string} categoryId - Category ID
 * @returns {Object|null} - Category object or null if not found
 */
export const getFileCategory = (categoryId) => {
  return config.fileStorage.fileCategories.find(category => category.id === categoryId) || null;
};

/**
 * Store file with encryption
 * @param {Object} fileData - File data object
 * @param {Buffer} fileData.buffer - File buffer
 * @param {string} fileData.originalname - Original file name
 * @param {string} fileData.mimetype - File MIME type
 * @param {number} fileData.size - File size
 * @param {string} residentId - Resident ID
 * @param {string} category - File category
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Stored file information
 */
export const storeFile = async (fileData, residentId, category, metadata = {}) => {
  try {
    // Check file size
    if (fileData.size > config.fileStorage.maxFileSize) {
      throw new Error(`File size exceeds the maximum allowed size of ${config.fileStorage.maxFileSize / (1024 * 1024)}MB`);
    }
    
    // Check file type
    if (!isFileTypeAllowed(fileData.mimetype)) {
      throw new Error('File type not allowed');
    }
    
    // Generate unique filename
    const filename = generateUniqueFilename(fileData.originalname, fileData.mimetype);
    
    // Create resident directory path
    const residentDir = path.join(config.fileStorage.uploadPath, residentId);
    const categoryDir = path.join(residentDir, category);
    const filePath = path.join(categoryDir, filename);
    
    // Ensure directories exist
    await fileEncryptionService.ensureDirectoryExists(categoryDir);
    
    // Save encrypted file
    const fileInfo = await fileEncryptionService.saveEncryptedFile(fileData.buffer, filePath);
    
    // Return file information
    return {
      id: uuidv4(),
      filename,
      originalName: fileData.originalname,
      mimeType: fileData.mimetype,
      size: fileData.size,
      category,
      residentId,
      path: filePath,
      iv: fileInfo.iv,
      uploadDate: new Date(),
      metadata
    };
  } catch (error) {
    logger.error('File storage error', { error: error.message });
    throw error;
  }
};

/**
 * Retrieve file with decryption
 * @param {Object} fileInfo - File information
 * @returns {Buffer} - Decrypted file buffer
 */
export const retrieveFile = async (fileInfo) => {
  try {
    // Check if file exists
    await stat(fileInfo.path);
    
    // Read and decrypt file
    return await fileEncryptionService.readDecryptedFile(fileInfo.path, fileInfo.iv);
  } catch (error) {
    logger.error('File retrieval error', { error: error.message, fileId: fileInfo.id });
    throw new Error('Failed to retrieve file');
  }
};

/**
 * Delete file
 * @param {Object} fileInfo - File information
 * @returns {boolean} - Whether deletion was successful
 */
export const deleteFile = async (fileInfo) => {
  try {
    // Check if file exists
    await stat(fileInfo.path);
    
    // Delete file
    await unlink(fileInfo.path);
    
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, consider it deleted
      return true;
    }
    
    logger.error('File deletion error', { error: error.message, fileId: fileInfo.id });
    throw new Error('Failed to delete file');
  }
};

/**
 * Get file icon based on MIME type
 * @param {string} mimeType - File MIME type
 * @returns {string} - Icon name
 */
export const getFileIcon = (mimeType) => {
  const fileType = config.fileStorage.allowedFileTypes[mimeType];
  return fileType ? fileType.icon : 'file';
};

/**
 * Check if file type supports preview
 * @param {string} mimeType - File MIME type
 * @returns {boolean} - Whether file type supports preview
 */
export const supportsPreview = (mimeType) => {
  const fileType = config.fileStorage.allowedFileTypes[mimeType];
  return fileType ? fileType.preview : false;
};

export default {
  storeFile,
  retrieveFile,
  deleteFile,
  isFileTypeAllowed,
  getFileCategory,
  getFileIcon,
  supportsPreview
};