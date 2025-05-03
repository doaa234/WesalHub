import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from '../i18n';

// Import screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import RolePermissionsScreen from '../screens/admin/RolePermissionsScreen';
// Import other admin screens as needed

const Stack = createStackNavigator();

const AdminNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen} 
      />
      <Stack.Screen 
        name="UserManagement" 
        component={UserManagementScreen} 
      />
      <Stack.Screen 
        name="RolePermissions" 
        component={RolePermissionsScreen} 
      />
      {/* Add other admin screens as needed */}
    </Stack.Navigator>
  );
};

export default AdminNavigator;