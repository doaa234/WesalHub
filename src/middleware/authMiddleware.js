import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger';
import { getUserPermissions } from '../services/permissionService';
import config from '../config';

const logger = createLogger('auth-middleware');

/**
 * Middleware to verify JWT token and extract user information
 */
export const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid Authorization header', { 
        ip: req.ip, 
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // Set user info in request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired', { 
        ip: req.ip, 
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ message: 'Token expired' });
    }
    
    logger.error('Token verification failed', { 
      error: error.message,
      ip: req.ip, 
      path: req.path,
      method: req.method
    });
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * Middleware to check if user has required role
 * @param {string[]} roles - Array of allowed roles
 */
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      // Log unauthorized access attempt
      logger.warn('Unauthorized role access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({ message: 'Access denied: Insufficient role privileges' });
    }
    
    next();
  };
};

/**
 * Middleware to check if user has required permission
 * @param {string} resource - Resource being accessed
 * @param {string} action - Action being performed
 * @param {string} [field] - Optional field being accessed
 */
export const requirePermission = (resource, action, field = null) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      // Get user permissions (from token or fetch from database if needed)
      let userPermissions = req.user.permissions;
      
      // If permissions not in token, fetch from database
      if (!userPermissions || userPermissions.length === 0) {
        userPermissions = await getUserPermissions(req.user.id, req.user.role);
        req.user.permissions = userPermissions;
      }
      
      // Check if user has the required permission
      const hasPermission = checkPermission(userPermissions, resource, action, field);
      
      if (!hasPermission) {
        // Log unauthorized access attempt
        logger.warn('Unauthorized permission access attempt', {
          userId: req.user.id,
          userRole: req.user.role,
          resource,
          action,
          field,
          ip: req.ip,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });
        
        return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
      }
      
      next();
    } catch (error) {
      logger.error('Permission check failed', { 
        error: error.message,
        userId: req.user.id,
        resource,
        action,
        field
      });
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

/**
 * Helper function to check if user has the required permission
 * @param {Array} permissions - User permissions
 * @param {string} resource - Resource being accessed
 * @param {string} action - Action being performed
 * @param {string} field - Field being accessed
 * @returns {boolean} - Whether user has permission
 */
const checkPermission = (permissions, resource, action, field = null) => {
  // Check for wildcard permission
  if (permissions.some(p => p === '*')) {
    return true;
  }
  
  // Check for resource wildcard
  if (permissions.some(p => p === `${resource}:*`)) {
    return true;
  }
  
  // Check for specific action permission
  if (permissions.some(p => p === `${resource}:${action}`)) {
    return true;
  }
  
  // Check for field-specific permission
  if (field && permissions.some(p => p === `${resource}:${action}:${field}`)) {
    return true;
  }
  
  return false;
};

/**
 * Middleware to prepare for future ABAC implementation
 * This can be extended to include attribute-based checks
 */
export const checkAttributes = (attributeRules) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get current context attributes
    const context = {
      time: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      location: req.headers['x-location'] || null, // Could be set by a previous middleware
      deviceType: req.headers['x-device-type'] || null,
      // Add more context attributes as needed
    };
    
    // Evaluate attribute rules
    const allowed = evaluateAttributeRules(attributeRules, req.user, context);
    
    if (!allowed) {
      // Log unauthorized access attempt
      logger.warn('Attribute-based access denied', {
        userId: req.user.id,
        userRole: req.user.role,
        context,
        rules: attributeRules,
        ip: req.ip,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      return res.status(403).json({ message: 'Access denied: Attribute conditions not met' });
    }
    
    next();
  };
};

/**
 * Helper function to evaluate attribute-based rules
 * This is a simple implementation that can be expanded
 */
const evaluateAttributeRules = (rules, user, context) => {
  // For now, just a placeholder for future ABAC implementation
  // This would evaluate rules like time-based access, location-based access, etc.
  return true;
};