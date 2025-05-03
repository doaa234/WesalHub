import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { fetchProfilePermissions } from '../../services/permissionsService';

// Create context for profile permissions
const ProfilePermissionsContext = createContext({
  permissions: {},
  loading: true,
  error: null,
});

export const useProfilePermissions = () => useContext(ProfilePermissionsContext);

const ProfilePermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { userRole } = useSelector(state => state.auth);
  
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would fetch from your API
        // For now, we'll simulate role-based permissions
        const profilePermissions = await fetchProfilePermissions(userRole);
        setPermissions(profilePermissions);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load permissions');
      } finally {
        setLoading(false);
      }
    };
    
    loadPermissions();
  }, [userRole]);
  
  return (
    <ProfilePermissionsContext.Provider value={{ permissions, loading, error }}>
      {children}
    </ProfilePermissionsContext.Provider>
  );
};

export default ProfilePermissionsProvider;