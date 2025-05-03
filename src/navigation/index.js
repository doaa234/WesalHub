import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { checkAuth } from '../store/slices/authSlice';
import { View, ActivityIndicator } from 'react-native';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';
// Import other screens here

// Role-based Navigators
import AdminNavigator from './AdminNavigator';
import CityManagerNavigator from './CityManagerNavigator';
import SecurityNavigator from './SecurityNavigator';
import ResidentNavigator from './ResidentNavigator';
import ResidentsNavigator from './ResidentsNavigator';
// Import other role navigators

const Stack = createStackNavigator();

const Navigation = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, userRole, loading } = useSelector(state => state.auth);
  
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  
  if (loading) {
    // Return a loading screen
    return <LoadingScreen />;
  }
  
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth screens
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
            {/* Add other auth screens here */}
          </Stack.Group>
        ) : (
          // Role-based screens
          <>
            {userRole === 'admin' && (
              <Stack.Screen name="AdminHome" component={AdminNavigator} />
            )}
            {userRole === 'cityManager' && (
              <Stack.Screen name="ManagerHome" component={CityManagerNavigator} />
            )}
            {userRole === 'securityOfficer' && (
              <Stack.Screen name="SecurityHome" component={SecurityNavigator} />
            )}
            {userRole === 'resident' && (
              <Stack.Screen name="ResidentHome" component={ResidentNavigator} />
            )}
            {/* Add Residents Navigator for roles that need access */}
            {['admin', 'cityManager', 'dataEntry'].includes(userRole) && (
              <Stack.Screen name="ResidentsManagement" component={ResidentsNavigator} />
            )}
            {/* Add other role navigators here */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Simple loading screen component
const LoadingScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default Navigation;