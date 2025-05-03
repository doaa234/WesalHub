import { createLogger } from '../utils/logger';

const logger = createLogger('permission-service');

/**
 * Get permissions for a user based on their role
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {Array} - Array of permission strings
 */
export const getUserPermissions = async (userId, role) => {
  try {
    // In a real application, this would query a database
    // For demonstration, we'll return hardcoded permissions based on role
    
    // Base permissions for all authenticated users
    const basePermissions = [
      'profile:view',
      'profile:edit:basic',
      'dashboard:view',
    ];
    
    // Role-specific permissions
    let rolePermissions = [];
    
    switch (role) {
      case 'admin':
        rolePermissions = [
          '*', // Wildcard permission - can do everything
        ];
        break;
        
      case 'manager':
        rolePermissions = [
          'residents:*', // All resident permissions
          'maintenance:*', // All maintenance permissions
          'reports:view',
          'users:view',
          'profile:*', // All profile permissions
        ];
        break;
        
      case 'staff':
        rolePermissions = [
          'residents:view',
          'residents:edit:basic',
          'maintenance:view',
          'maintenance:create',
          'maintenance:edit',
          'reports:view:basic',
        ];
        break;
        
      case 'security':
        rolePermissions = [
          'residents:view:basic', // Can only view basic resident info
          'visitors:*', // All visitor permissions
          'incidents:create',
          'incidents:view',
        ];
        break;
        
      case 'resident':
        rolePermissions = [
          'maintenance:create',
          'maintenance:view:own',
          'payments:view:own',
          'payments:create',
          'visitors:create:own',
          'visitors:view:own',
        ];
        break;
        
      default:
        rolePermissions = [];
    }
    
    // Combine base and role permissions
    return [...basePermissions, ...rolePermissions];
  } catch (error) {
    logger.error('Error fetching user permissions', { 
      error: error.message,
      userId,
      role
    });
    
    // Return empty permissions array on error
    return [];
  }
};

/**
 * Get field visibility settings for a role
 * @param {string} role - User role
 * @param {string} resource - Resource type
 * @returns {Object} - Field visibility map
 */
export const getFieldVisibility = async (role, resource) => {
  try {
    // In a real application, this would query a database
    // For demonstration, we'll return hardcoded field visibility
    
    // Default field visibility - all fields hidden
    const defaultVisibility = {
      view: false,
      edit: false,
    };
    
    // Resource-specific field visibility based on role
    const fieldVisibility = {};
    
    // Example for 'residents' resource
    if (resource === 'residents') {
      switch (role) {
        case 'admin':
        case 'manager':
          // Admins and managers can view and edit all fields
          return {
            '*': { view: true, edit: true },
          };
          
        case 'staff':
          return {
            'name': { view: true, edit: true },
            'email': { view: true, edit: true },
            'phone': { view: true, edit: true },
            'unitNumber': { view: true, edit: true },
            'sector': { view: true, edit: true },
            'type': { view: true, edit: true },
            'idNumber': { view: true, edit: false },
            'contractDetails': { view: true, edit: false },
            'financialInfo': { view: false, edit: false },
          };
          
        case 'security':
          return {
            'name': { view: true, edit: false },
            'unitNumber': { view: true, edit: false },
            'sector': { view: true, edit: false },
            'idNumber': { view: true, edit: false },
            'phone': { view: false, edit: false },
            'email': { view: false, edit: false },
            'contractDetails': { view: false, edit: false },
            'financialInfo': { view: false, edit: false },
          };
          
        default:
          return {
            'name': { view: true, edit: false },
            'unitNumber': { view: true, edit: false },
            'sector': { view: true, edit: false },
          };
      }
    }
    
    // Return default visibility if no specific rules
    return { '*': defaultVisibility };
  } catch (error) {
    logger.error('Error fetching field visibility', { 
      error: error.message,
      role,
      resource
    });
    
    // Return empty visibility map on error
    return {};
  }
};