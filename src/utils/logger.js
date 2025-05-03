import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create security logs directory
const securityLogsDir = path.join(logsDir, 'security');
if (!fs.existsSync(securityLogsDir)) {
  fs.mkdirSync(securityLogsDir);
}

// Define log formats
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create default logger
const defaultLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileFormat,
  defaultMeta: { service: 'api' },
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  defaultLogger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Create security logger for access attempts
const securityLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: 'security' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(securityLogsDir, 'access-denied.log'),
      level: 'warn'
    }),
    new winston.transports.File({ 
      filename: path.join(securityLogsDir, 'security.log') 
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  securityLogger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

/**
 * Create a logger instance with a specific module name
 * @param {string} module - Module name for the logger
 * @returns {winston.Logger} - Logger instance
 */
export const createLogger = (module) => {
  // For security-related modules, use the security logger
  if (module.startsWith('auth') || module.startsWith('security')) {
    return securityLogger.child({ module });
  }
  
  // For other modules, use the default logger
  return defaultLogger.child({ module });
};

/**
 * Log unauthorized access attempts
 * @param {Object} data - Access attempt data
 */
export const logAccessDenied = (data) => {
  securityLogger.warn('Access denied', data);
};

/**
 * Log successful authentication
 * @param {Object} data - Authentication data
 */
export const logAuthentication = (data) => {
  securityLogger.info('Authentication successful', data);
};

/**
 * Log sensitive data access
 * @param {Object} data - Access data
 */
export const logSensitiveAccess = (data) => {
  securityLogger.info('Sensitive data accessed', data);
};

export default {
  createLogger,
  logAccessDenied,
  logAuthentication,
  logSensitiveAccess
};