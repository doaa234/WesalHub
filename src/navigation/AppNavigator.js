import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import ResidentDashboard from '../screens/resident/ResidentDashboard';
import SecurityDashboard from '../screens/security/SecurityDashboard';
import LoadingScreen from '../screens/common/LoadingScreen';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
};

const AdminStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
    </Stack.Navigator>
  );
};

const ResidentStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ResidentDashboard" component={ResidentDashboard} />
    </Stack.Navigator>
  );
};

const SecurityStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SecurityDashboard" component={SecurityDashboard} />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { isLoading, userToken, userInfo } = useContext(AuthContext);
  const { theme, isDarkMode } = useContext(ThemeContext);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const getUserStack = () => {
    if (!userInfo) return AuthStack;

    switch (userInfo.role) {
      case 'ADMIN':
        return AdminStack;
      case 'RESIDENT':
        return ResidentStack;
      case 'SECURITY_OFFICER':
        return SecurityStack;
      default:
        return AuthStack;
    }
  };

  return (
    <NavigationContainer theme={theme}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      {getUserStack()()}
    </NavigationContainer>
  );
};

export default AppNavigator;