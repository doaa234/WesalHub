import { createLogger } from '../utils/logger';

const logger = createLogger('security-service');

/**
 * Filter data based on user permissions before sending to client
 * @param {Object} data - Data to be filtered
 * @param {Object} user - User object with role and permissions
 * @param {string} resource - Resource type being accessed
 * @returns {Object} - Filtered data
 */
export const filterDataByPermissions = (data, user, resource) => {
  if (!data) return data;
  
  // If user has admin role, return all data
  if (user.role === 'admin') {
    return data;
  }
  
  // Get field visibility permissions for the user
  const fieldPermissions = getFieldPermissions(user, resource);
  
  // Handle array of objects
  if (Array.isArray(data)) {
    return data.map(item => filterObjectByPermissions(item, fieldPermissions));
  }
  
  // Handle single object
  return filterObjectByPermissions(data, fieldPermissions);
};

/**
 * Filter a single object based on field permissions
 * @param {Object} obj - Object to filter
 * @param {Object} fieldPermissions - Field permissions map
 * @returns {Object} - Filtered object
 */
const filterObjectByPermissions = (obj, fieldPermissions) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if user has permission to view this field
    if (fieldPermissions[key] && fieldPermissions[key].view) {
      // For nested objects, recursively filter
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = filterObjectByPermissions(value, fieldPermissions);
      } 
      // For arrays of objects, filter each item
      else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        result[key] = value.map(item => filterObjectByPermissions(item, fieldPermissions));
      }
      // For primitive values or arrays of primitives, include as is
      else {
        result[key] = value;
      }
    }
    // If no permission, field is excluded from result
  }
  
  return result;
};

/**
 * Get field permissions for a user and resource
 * @param {Object} user - User object with role and permissions
 * @param {string} resource - Resource type
 * @returns {Object} - Map of field permissions
 */
const getFieldPermissions = (user, resource) => {
  // This would typically come from a database or cache
  // For now, we'll use a simplified approach
  
  const fieldPermissions = {};
  
  // Extract field permissions from user permissions
  user.permissions.forEach(permission => {
    // Parse permissions in format "resource:action:field"
    const parts = permission.split(':');
    
    if (parts.length >= 3 && parts[0] === resource) {
      const action = parts[1];
      const field = parts[2];
      
      if (!fieldPermissions[field]) {
        fieldPermissions[field] = {};
      }
      
      fieldPermissions[field][action] = true;
    }
  });
  
  return fieldPermissions;
};

/**
 * Apply field-level security to API responses
 * @param {Function} handler - API route handler
 * @returns {Function} - Wrapped handler with security filtering
 */
export const secureApiHandler = (handler, resource) => {
  return async (req, res) => {
    // Store the original res.json function
    const originalJson = res.json;
    
    // Override res.json to filter data before sending
    res.json = function(data) {
      // Skip filtering for error responses
      if (res.statusCode >= 400) {
        return originalJson.call(this, data);
      }
      
      try {
        // Filter data based on user permissions
        const filteredData = filterDataByPermissions(data, req.user, resource);
        
        // Call original json method with filtered data
        return originalJson.call(this, filteredData);
      } catch (error) {
        logger.error('Error filtering response data', {
          error: error.message,
          userId: req.user?.id,
          resource,
          path: req.path
        });
        
        // In case of filtering error, return the original data
        // This is a fallback to prevent API failures
        return originalJson.call(this, data);
      }
    };
    
    // Call the original handler
    return handler(req, res);
  };
};