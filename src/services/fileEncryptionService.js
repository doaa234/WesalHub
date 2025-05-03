import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import config from '../config';

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Encryption algorithm
const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(config.fileStorage.encryptionKey);

/**
 * Encrypt a file
 * @param {Buffer} buffer - File buffer to encrypt
 * @returns {Object} - Encrypted data and initialization vector
 */
export const encryptFile = async (buffer) => {
  try {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    // Encrypt the file
    const encrypted = Buffer.concat([
      cipher.update(buffer),
      cipher.final()
    ]);
    
    return {
      data: encrypted,
      iv: iv.toString('hex')
    };
  } catch (error) {
    console.error('File encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
};

/**
 * Decrypt a file
 * @param {Buffer} encryptedData - Encrypted file data
 * @param {string} ivHex - Initialization vector in hex format
 * @returns {Buffer} - Decrypted file buffer
 */
export const decryptFile = async (encryptedData, ivHex) => {
  try {
    // Convert hex IV back to buffer
    const iv = Buffer.from(ivHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    
    // Decrypt the file
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
    
    return decrypted;
  } catch (error) {
    console.error('File decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
};

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path
 */
export const ensureDirectoryExists = async (dirPath) => {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
};

/**
 * Save encrypted file
 * @param {Buffer} fileBuffer - Original file buffer
 * @param {string} filePath - Path to save the encrypted file
 * @returns {Object} - File metadata including IV for decryption
 */
export const saveEncryptedFile = async (fileBuffer, filePath) => {
  try {
    // Ensure directory exists
    await ensureDirectoryExists(path.dirname(filePath));
    
    // Encrypt the file
    const { data, iv } = await encryptFile(fileBuffer);
    
    // Write encrypted file to disk
    await writeFile(filePath, data);
    
    return {
      path: filePath,
      iv,
      size: fileBuffer.length,
      encryptedSize: data.length
    };
  } catch (error) {
    console.error('Error saving encrypted file:', error);
    throw new Error('Failed to save encrypted file');
  }
};

/**
 * Read and decrypt file
 * @param {string} filePath - Path to the encrypted file
 * @param {string} iv - Initialization vector in hex format
 * @returns {Buffer} - Decrypted file buffer
 */
export const readDecryptedFile = async (filePath, iv) => {
  try {
    // Read encrypted file
    const encryptedData = await readFile(filePath);
    
    // Decrypt the file
    return await decryptFile(encryptedData, iv);
  } catch (error) {
    console.error('Error reading encrypted file:', error);
    throw new Error('Failed to read encrypted file');
  }
};

export default {
  encryptFile,
  decryptFile,
  saveEncryptedFile,
  readDecryptedFile,
  ensureDirectoryExists
};