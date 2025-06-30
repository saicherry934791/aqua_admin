import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '@/lib/constants/Colors';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { useColorScheme } from '@/lib/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, user, canAccessTab, viewAsState, exitViewAs } = useAuth();

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
    <>
      {/* View As Banner */}
      {viewAsState.isViewingAs && (
        <View style={styles.viewAsBanner}>
          <View style={styles.viewAsContent}>
            <MaterialIcons name="visibility" size={16} color="#FFFFFF" />
            <Text style={styles.viewAsText}>
              Viewing as {viewAsState.currentViewRole === UserRole.FRANCHISE_OWNER ? 'Franchise' : 'Agent'}
              {viewAsState.targetFranchiseName && `: ${viewAsState.targetFranchiseName}`}
              {viewAsState.targetUserName && `: ${viewAsState.targetUserName}`}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.exitViewAsButton} 
            onPress={exitViewAs}
          >
            <Text style={styles.exitViewAsText}>Exit</Text>
          </TouchableOpacity>
        </View>
      )}

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
    </>
  );
}

// Icon wrapper for MaterialIcons
function TabBarIcon({ name, color }: { name: keyof typeof MaterialIcons.glyphMap; color: string }) {
  return <MaterialIcons name={name} size={24} color={color} />;
}

const styles = StyleSheet.create({
  viewAsBanner: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: Platform.OS === 'ios' ? 44 : 8, // Account for status bar on iOS
  },
  viewAsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  viewAsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    marginLeft: 8,
  },
  exitViewAsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  exitViewAsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
  },
});