import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import PropertiesStackNavigator from './PropertiesStack';
import InspectionsStackNavigator from './InspectionsStack';
import { SyncBanner } from '../components';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <View style={styles.root}>
      <SyncBanner />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        }}
      >
        <Tab.Screen name="PropertiesTab" component={PropertiesStackNavigator} options={{ title: 'Properties' }} />
        <Tab.Screen
          name="InspectionsTab"
          component={InspectionsStackNavigator}
          options={{ title: 'My Inspections' }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
