import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { PropertiesStackParamList } from './types';
import PropertyListScreen from '../screens/PropertyListScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import InspectionFormScreen from '../screens/InspectionFormScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<PropertiesStackParamList>();

export default function PropertiesStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="PropertyList" component={PropertyListScreen} options={{ title: 'Properties' }} />
      <Stack.Screen name="PropertyDetail" component={PropertyDetailScreen} options={{ title: 'Property' }} />
      <Stack.Screen name="InspectionForm" component={InspectionFormScreen} options={{ title: 'Inspection' }} />
    </Stack.Navigator>
  );
}
