import React from 'react';
import { useProfilePermissions } from './ProfilePermissionsProvider';

const PermissionAware = ({ 
  permissionKey, 
  children, 
  fallback = null,
  loadingComponent = null
}) => {
  const { permissions, loading } = useProfilePermissions();
  
  if (loading) {
    return loadingComponent;
  }
  
  if (permissions[permissionKey]) {
    return children;
  }
  
  return fallback;
};

export default PermissionAware;