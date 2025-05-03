/**
 * Role-Based Access Control (RBAC) Permissions Utility
 * 
 * This module defines the permission structure for the application,
 * mapping roles to their allowed operations on specific resources and fields.
 */

// Permission levels
export const PERMISSION_LEVELS = {
  NONE: 'none',     // No access at all
  VIEW: 'view',     // Read-only access
  EDIT: 'edit',     // Can view and modify
  FULL: 'full'      // Full access (view, edit, delete)
};

// Application roles
export const ROLES = {
  ADMIN: 'admin',
  CITY_MANAGER: 'cityManager',
  SECURITY: 'securityOfficer',
  DATA_ENTRY: 'dataEntry',
  RESIDENT: 'resident',
  TENANT: 'tenant',
  GUEST: 'guest'
};

/**
 * Role-based permissions matrix
 * Maps each role to their permissions for different resources and fields
 */
const rolePermissions = {
  // Admin has full access to everything
  [ROLES.ADMIN]: {
    residents: {
      _resourceAccess: PERMISSION_LEVELS.FULL,
      fields: {
        // All fields have full access by default
        _default: PERMISSION_LEVELS.FULL
      }
    },
    users: {
      _resourceAccess: PERMISSION_LEVELS.FULL,
      fields: {
        _default: PERMISSION_LEVELS.FULL
      }
    },
    reports: {
      _resourceAccess: PERMISSION_LEVELS.FULL,
      fields: {
        _default: PERMISSION_LEVELS.FULL
      }
    },
    settings: {
      _resourceAccess: PERMISSION_LEVELS.FULL,
      fields: {
        _default: PERMISSION_LEVELS.FULL
      }
    },
    logs: {
      _resourceAccess: PERMISSION_LEVELS.FULL,
      fields: {
        _default: PERMISSION_LEVELS.FULL
      }
    }
  },
  
  // City Manager permissions
  [ROLES.CITY_MANAGER]: {
    residents: {
      _resourceAccess: PERMISSION_LEVELS.EDIT,
      fields: {
        _default: PERMISSION_LEVELS.EDIT,
        // Can view but not edit financial information
        financialRecords: PERMISSION_LEVELS.VIEW,
        contractDetails: PERMISSION_LEVELS.VIEW
      }
    },
    users: {
      _resourceAccess: PERMISSION_LEVELS.VIEW,
      fields: {
        _default: PERMISSION_LEVELS.VIEW,
        // Can edit some user fields
        status: PERMISSION_LEVELS.EDIT
      }
    },
    reports: {
      _resourceAccess: PERMISSION_LEVELS.VIEW,
      fields: {
        _default: PERMISSION_LEVELS.VIEW
      }
    },
    settings: {
      _resourceAccess: PERMISSION_LEVELS.VIEW,
      fields: {
        _default: PERMISSION_LEVELS.VIEW,
        // Can edit some settings
        citySettings: PERMISSION_LEVELS.EDIT
      }
    },
    logs: {
      _resourceAccess: PERMISSION_LEVELS.VIEW,
      fields: {
        _default: PERMISSION_LEVELS.VIEW
      }
    }
  },
  
  // Security Officer permissions
  [ROLES.SECURITY]: {
    residents: {
      _resourceAccess: PERMISSION_LEVELS.VIEW,
      fields: {
        _default: PERMISSION_LEVELS.VIEW,
        // Security only needs basic identification info
        name: PERMISSION_LEVELS.VIEW,
        idNumber: PERMISSION_LEVELS.VIEW,
        unitNumber: PERMISSION_LEVELS.VIEW,
        sector: PERMISSION_LEVELS.VIEW,
        profilePicture: PERMISSION_LEVELS.VIEW,
        // Hide sensitive information
        email: PERMISSION_LEVELS.NONE,
        phoneNumber: PERMISSION_LEVELS.NONE,
        financialRecords: PERMISSION_LEVELS.NONE,
        contractDetails: PERMISSION_LEVELS.NONE,
        documents: PERMISSION_LEVELS.NONE
      }
    },
    users: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    reports: {
      _resourceAccess: PERMISSION_LEVELS.VIEW,
      fields: {
        _default: PERMISSION_LEVELS.VIEW,
        // Only security-related reports
        securityReports: PERMISSION_LEVELS.VIEW
      }
    },
    settings: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    logs: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    }
  },
  
  // Data Entry permissions
  [ROLES.DATA_ENTRY]: {
    residents: {
      _resourceAccess: PERMISSION_LEVELS.EDIT,
      fields: {
        _default: PERMISSION_LEVELS.EDIT,
        // Can't access financial or contract information
        financialRecords: PERMISSION_LEVELS.NONE,
        contractDetails: PERMISSION_LEVELS.NONE,
        // Can view but not edit documents
        documents: PERMISSION_LEVELS.VIEW
      }
    },
    users: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    reports: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    settings: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    logs: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    }
  },
  
  // Resident permissions
  [ROLES.RESIDENT]: {
    residents: {
      _resourceAccess: PERMISSION_LEVELS.VIEW,
      fields: {
        _default: PERMISSION_LEVELS.VIEW,
        // Can only edit their own profile
        // This is handled separately in the backend logic
      }
    },
    users: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    reports: {
      _resourceAccess: PERMISSION_LEVELS.VIEW,
      fields: {
        _default: PERMISSION_LEVELS.VIEW,
        // Only public reports
        publicReports: PERMISSION_LEVELS.VIEW
      }
    },
    settings: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    logs: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    }
  },
  
  // Tenant permissions (similar to resident)
  [ROLES.TENANT]: {
    residents: {
      _resourceAccess: PERMISSION_LEVELS.VIEW,
      fields: {
        _default: PERMISSION_LEVELS.VIEW,
        // Can only edit their own profile
        // This is handled separately in the backend logic
      }
    },
    users: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    reports: {
      _resourceAccess: PERMISSION_LEVELS.VIEW,
      fields: {
        _default: PERMISSION_LEVELS.VIEW,
        // Only public reports
        publicReports: PERMISSION_LEVELS.VIEW
      }
    },
    settings: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    logs: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    }
  },
  
  // Guest permissions (minimal access)
  [ROLES.GUEST]: {
    residents: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    users: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    reports: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    settings: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    },
    logs: {
      _resourceAccess: PERMISSION_LEVELS.NONE,
      fields: {
        _default: PERMISSION_LEVELS.NONE
      }
    }
  }
};

/**
 * Check if a user has permission to access a resource
 * @param {string} role - User role
 * @param {string} resource - Resource name (e.g., 'residents')
 * @param {string} action - Action type ('view', 'edit', 'delete')
 * @returns {boolean} - Whether the user has permission
 */
export const hasResourcePermission = (role, resource, action) => {
  // Admin has all permissions
  if (role === ROLES.ADMIN) return true;
  
  // Check if role exists in permissions
  if (!rolePermissions[role]) return false;
  
  // Check if resource exists for this role
  if (!rolePermissions[role][resource]) return false;
  
  const resourceAccess = rolePermissions[role][resource]._resourceAccess;
  
  switch (action) {
    case 'view':
      return [PERMISSION_LEVELS.VIEW, PERMISSION_LEVELS.EDIT, PERMISSION_LEVELS.FULL].includes(resourceAccess);
    case 'edit':
    case 'update':
      return [PERMISSION_LEVELS.EDIT, PERMISSION_LEVELS.FULL].includes(resourceAccess);
    case 'delete':
      return resourceAccess === PERMISSION_LEVELS.FULL;
    case 'create':
      return [PERMISSION_LEVELS.EDIT, PERMISSION_LEVELS.FULL].includes(resourceAccess);
    default:
      return false;
  }
};

/**
 * Check if a user has permission to access a specific field
 * @param {string} role - User role
 * @param {string} resource - Resource name (e.g., 'residents')
 * @param {string} field - Field name
 * @param {string} action - Action type ('view', 'edit')
 * @returns {boolean} - Whether the user has permission
 */
export const hasFieldPermission = (role, resource, field, action) => {
  // Admin has all permissions
  if (role === ROLES.ADMIN) return true;
  
  // Check if role exists in permissions
  if (!rolePermissions[role]) return false;
  
  // Check if resource exists for this role
  if (!rolePermissions[role][resource]) return false;
  
  // Get field permission or default
  const fieldPermission = 
    rolePermissions[role][resource].fields[field] || 
    rolePermissions[role][resource].fields._default;
  
  switch (action) {
    case 'view':
      return [PERMISSION_LEVELS.VIEW, PERMISSION_LEVELS.EDIT, PERMISSION_LEVELS.FULL].includes(fieldPermission);
    case 'edit':
      return [PERMISSION_LEVELS.EDIT, PERMISSION_LEVELS.FULL].includes(fieldPermission);
    default:
      return false;
  }
};

/**
 * Filter object fields based on user permissions
 * @param {string} role - User role
 * @param {string} resource - Resource name
 * @param {Object} data - Data object to filter
 * @returns {Object} - Filtered object with only permitted fields
 */
export const filterDataByPermission = (role, resource, data) => {
  // Admin gets all data
  if (role === ROLES.ADMIN) return data;
  
  // If no permissions defined or no data, return empty object
  if (!rolePermissions[role] || !rolePermissions[role][resource] || !data) {
    return {};
  }
  
  const result = {};
  
  // Get default permission for this resource
  const defaultPermission = rolePermissions[role][resource].fields._default;
  
  // Process each field in the data
  Object.keys(data).forEach(field => {
    // Get specific field permission or use default
    const fieldPermission = 
      rolePermissions[role][resource].fields[field] || 
      defaultPermission;
    
    // Include field if user has at least view permission
    if ([PERMISSION_LEVELS.VIEW, PERMISSION_LEVELS.EDIT, PERMISSION_LEVELS.FULL].includes(fieldPermission)) {
      result[field] = data[field];
    }
  });
  
  return result;
};

export default {
  PERMISSION_LEVELS,
  ROLES,
  hasResourcePermission,
  hasFieldPermission,
  filterDataByPermission
};