import { hasResourcePermission, filterDataByPermission } from '../utils/permissions';

/**
 * Middleware to check if a user has permission to access a resource
 * @param {string} resource - Resource name (e.g., 'residents')
 * @param {string} action - Action type ('view', 'edit', 'delete', 'create')
 * @returns {Function} - Express middleware function
 */
export const checkResourcePermission = (resource, action) => {
  return (req, res, next) => {
    const { role } = req.user;
    
    if (!hasResourcePermission(role, resource, action)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};

/**
 * Middleware to filter response data based on user permissions
 * @param {string} resource - Resource name (e.g., 'residents')
 * @returns {Function} - Express middleware function
 */
export const filterResponseByPermission = (resource) => {
  return (req, res, next) => {
    const { role } = req.user;
    
    // Store the original send function
    const originalSend = res.send;
    
    // Override the send function
    res.send = function(data) {
      try {
        // Parse the data if it's a string (JSON)
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Filter the data based on permissions
        let filteredData;
        
        if (Array.isArray(parsedData)) {
          // If it's an array, filter each item
          filteredData = parsedData.map(item => filterDataByPermission(role, resource, item));
        } else if (parsedData.data && Array.isArray(parsedData.data)) {
          // If it's a paginated response with a data array
          filteredData = {
            ...parsedData,
            data: parsedData.data.map(item => filterDataByPermission(role, resource, item))
          };
        } else {
          // If it's a single object
          filteredData = filterDataByPermission(role, resource, parsedData);
        }
        
        // Call the original send with the filtered data
        return originalSend.call(this, JSON.stringify(filteredData));
      } catch (error) {
        // If there's an error, just send the original data
        console.error('Error filtering response data:', error);
        return originalSend.call(this, data);
      }
    };
    
    next();
  };
};

export default {
  checkResourcePermission,
  filterResponseByPermission
};