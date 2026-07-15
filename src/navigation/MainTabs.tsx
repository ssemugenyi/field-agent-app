import React from 'react';
import { View, StyleSheet } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
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
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.borderMuted },
        }}
      >
        <Tab.Screen
          name="PropertiesTab"
          component={PropertiesStackNavigator}
          options={{
            title: 'Properties',
            tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
          }}
        />
        <Tab.Screen
          name="InspectionsTab"
          component={InspectionsStackNavigator}
          options={{
            title: 'My Inspections',
            tabBarIcon: ({ color, size }) => <Feather name="clipboard" size={size} color={color} />,
          }}
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
