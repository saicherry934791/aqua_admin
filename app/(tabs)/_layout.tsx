import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '@/lib/constants/Colors';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { useColorScheme } from '@/lib/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, user, canAccessTab } = useAuth();

  if (isLoading) return null;

  // If not logged in, redirect to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  // Get tabs based on user role
  const getTabsForRole = () => {
    if (!user) return [];

    const allTabs = [
      {
        name: 'index',
        title: 'Dashboard',
        icon: 'dashboard' as keyof typeof MaterialIcons.glyphMap,
      },
      {
        name: 'manage',
        title: 'Manage',
        icon: 'settings' as keyof typeof MaterialIcons.glyphMap,
      },
      {
        name: 'orders',
        title: 'Orders',
        icon: 'shopping-cart' as keyof typeof MaterialIcons.glyphMap,
      },
      {
        name: 'service',
        title: 'Services',
        icon: 'miscellaneous-services' as keyof typeof MaterialIcons.glyphMap,
      },
      {
        name: 'notifications',
        title: 'Notifications',
        icon: 'notifications' as keyof typeof MaterialIcons.glyphMap,
      },
      {
        name: 'profile',
        title: 'Profile',
        icon: 'person' as keyof typeof MaterialIcons.glyphMap,
      },
    ];

    // Filter tabs based on user role permissions
    return allTabs.filter(tab => canAccessTab(tab.name));
  };

  const availableTabs = getTabsForRole();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
      initialRouteName="index"
    >
      {availableTabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <TabBarIcon name={tab.icon} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

// Icon wrapper for MaterialIcons
function TabBarIcon({ name, color }: { name: keyof typeof MaterialIcons.glyphMap; color: string }) {
  return <MaterialIcons name={name} size={24} color={color} />;
}