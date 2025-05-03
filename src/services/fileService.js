import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import config from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('file-service');

/**
 * Service for handling secure file operations
 */
class FileService {
  constructor() {
    this.baseDir = FileSystem.documentDirectory + 'secure_files/';
    this.encryptionKey = config.fileEncryptionKey;
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    this.allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.docx'];
    
    // Initialize directory
    this._initializeDirectory();
  }
  
  /**
   * Initialize the secure file directory
   */
  async _initializeDirectory() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.baseDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.baseDir, { intermediates: true });
        logger.info('Created secure file directory');
      }
    } catch (error) {
      logger.error('Failed to initialize directory', { error: error.message });
      throw new Error('Failed to initialize file system');
    }
  }
  
  /**
   * Validate file before upload
   * @param {Object} file - File object
   * @returns {boolean} - Whether file is valid
   */
  validateFile(file) {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed (${this.maxFileSize / (1024 * 1024)}MB)`);
    }
    
    // Check file type
    const fileType = file.type;
    if (!this.allowedTypes.includes(fileType)) {
      throw new Error('File type not supported. Allowed types: PDF, JPG, PNG, DOCX');
    }
    
    return true;
  }
  
  /**
   * Encrypt and save a file
   * @param {Object} file - File object
   * @param {string} recordId - ID of the record this file belongs to
   * @returns {Object} - Saved file metadata
   */
  async saveFile(file, recordId) {
    try {
      // Validate file
      this.validateFile(file);
      
      // Generate a unique filename
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 10);
      const encryptedFilename = `${recordId}_${timestamp}_${randomString}.${fileExtension}`;
      const filePath = this.baseDir + encryptedFilename;
      
      // Encrypt and save file
      const fileContent = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
      const encryptedContent = await this._encryptData(fileContent);
      await FileSystem.writeAsStringAsync(filePath, encryptedContent, { encoding: FileSystem.EncodingType.Base64 });
      
      // Return file metadata
      return {
        id: `${timestamp}_${randomString}`,
        name: file.name,
        type: file.type,
        size: file.size,
        path: encryptedFilename,
        uploadDate: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to save file', { error: error.message, recordId });
      throw error;
    }
  }
  
  /**
   * Retrieve and decrypt a file
   * @param {string} filePath - Path to the encrypted file
   * @returns {string} - Decrypted file content (Base64)
   */
  async getFile(filePath) {
    try {
      const fullPath = this.baseDir + filePath;
      const fileInfo = await FileSystem.getInfoAsync(fullPath);
      
      if (!fileInfo.exists) {
        throw new Error('File not found');
      }
      
      const encryptedContent = await FileSystem.readAsStringAsync(fullPath, { encoding: FileSystem.EncodingType.Base64 });
      const decryptedContent = await this._decryptData(encryptedContent);
      
      return decryptedContent;
    } catch (error) {
      logger.error('Failed to retrieve file', { error: error.message, filePath });
      throw error;
    }
  }
  
  /**
   * Delete a file
   * @param {string} filePath - Path to the file
   * @returns {boolean} - Whether deletion was successful
   */
  async deleteFile(filePath) {
    try {
      const fullPath = this.baseDir + filePath;
      const fileInfo = await FileSystem.getInfoAsync(fullPath);
      
      if (!fileInfo.exists) {
        throw new Error('File not found');
      }
      
      await FileSystem.deleteAsync(fullPath);
      return true;
    } catch (error) {
      logger.error('Failed to delete file', { error: error.message, filePath });
      throw error;
    }
  }
  
  /**
   * Encrypt data
   * @param {string} data - Data to encrypt (Base64)
   * @returns {string} - Encrypted data (Base64)
   */
  async _encryptData(data) {
    try {
      // In a real app, you would use a proper encryption library
      // This is a simplified example using a hash-based approach
      const salt = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString()
      );
      
      const key = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        this.encryptionKey + salt
      );
      
      // Store salt at the beginning of the encrypted data
      return salt + this._xorEncrypt(data, key);
    } catch (error) {
      logger.error('Encryption failed', { error: error.message });
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypt data
   * @param {string} encryptedData - Encrypted data (Base64)
   * @returns {string} - Decrypted data (Base64)
   */
  async _decryptData(encryptedData) {
    try {
      // Extract salt (first 64 characters of SHA-256 hash)
      const salt = encryptedData.substring(0, 64);
      const data = encryptedData.substring(64);
      
      const key = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        this.encryptionKey + salt
      );
      
      return this._xorEncrypt(data, key); // XOR is symmetric, so we can use the same function
    } catch (error) {
      logger.error('Decryption failed', { error: error.message });
      throw new Error('Failed to decrypt data');
    }
  }
  
  /**
   * Simple XOR encryption/decryption
   * Note: This is a simplified example. In production, use a proper encryption library.
   */
  _xorEncrypt(data, key) {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  }
  
  /**
   * Get file type from extension
   * @param {string} filename - Filename
   * @returns {string} - MIME type
   */
  getFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      default:
        return 'application/octet-stream';
    }
  }
}

export default new FileService();