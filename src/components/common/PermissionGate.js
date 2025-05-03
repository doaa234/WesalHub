import React from 'react';
import { useSelector } from 'react-redux';
import { hasResourcePermission, hasFieldPermission } from '../../utils/permissions';

/**
 * PermissionGate component
 * Conditionally renders children based on user permissions
 * 
 * @param {Object} props
 * @param {string} props.resource - Resource name (e.g., 'residents')
 * @param {string} props.action - Action type ('view', 'edit', 'delete', 'create')
 * @param {string} [props.field] - Optional field name for field-level permissions
 * @param {React.ReactNode} props.children - Child components to render if permitted
 * @param {React.ReactNode} [props.fallback] - Optional component to render if not permitted
 */
const PermissionGate = ({ 
  resource, 
  action, 
  field, 
  children, 
  fallback = null 
}) => {
  const { userRole } = useSelector(state => state.auth);
  
  // Check permission based on whether a field is specified
  const hasPermission = field 
    ? hasFieldPermission(userRole, resource, field, action)
    : hasResourcePermission(userRole, resource, action);
  
  // Render children if user has permission, otherwise render fallback
  return hasPermission ? children : fallback;
};

export default PermissionGate;