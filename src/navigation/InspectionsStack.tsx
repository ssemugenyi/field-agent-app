import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { InspectionsStackParamList } from './types';
import MyInspectionsScreen from '../screens/MyInspectionsScreen';
import InspectionDetailScreen from '../screens/InspectionDetailScreen';
import InspectionFormScreen from '../screens/InspectionFormScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator<InspectionsStackParamList>();

export default function InspectionsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="MyInspections" component={MyInspectionsScreen} options={{ title: 'My Inspections' }} />
      <Stack.Screen name="InspectionDetail" component={InspectionDetailScreen} options={{ title: 'Inspection' }} />
      <Stack.Screen name="InspectionForm" component={InspectionFormScreen} options={{ title: 'Inspection' }} />
    </Stack.Navigator>
  );
}
