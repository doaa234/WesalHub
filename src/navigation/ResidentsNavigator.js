import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from '../i18n';

// Import screens
import ResidentListScreen from '../screens/residents/ResidentListScreen';
import ResidentDetailsScreen from '../screens/residents/ResidentDetailsScreen';
import ResidentFormScreen from '../screens/residents/ResidentFormScreen';

const Stack = createStackNavigator();

const ResidentsNavigator = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      initialRouteName="ResidentList"
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="ResidentList" 
        component={ResidentListScreen} 
        options={{ 
          title: t('residents.listTitle', 'Residents & Tenants') 
        }} 
      />
      <Stack.Screen 
        name="ResidentDetails" 
        component={ResidentDetailsScreen} 
        options={({ route }) => ({ 
          title: route.params?.name || t('residents.detailsTitle', 'Resident Details') 
        })} 
      />
      <Stack.Screen 
        name="ResidentForm" 
        component={ResidentFormScreen} 
        options={({ route }) => ({ 
          title: route.params?.isEditing 
            ? t('residents.editTitle', 'Edit Resident') 
            : t('residents.addTitle', 'Add New Resident') 
        })} 
      />
    </Stack.Navigator>
  );
};

export default ResidentsNavigator;