import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Colors } from '@/lib/constants/Colors';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { useColorScheme } from '@/lib/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading, user, viewAsState, exitViewAs } = useAuth();

  // Show loading screen while auth is initializing
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If not logged in, redirect to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  // Define all possible tabs with their access rules
  const allTabs = [
    {
      name: 'index',
      title: 'Dashboard',
      icon: 'dashboard' as keyof typeof MaterialIcons.glyphMap,
      roles: [UserRole.ADMIN, UserRole.FRANCHISE_OWNER, UserRole.SERVICE_AGENT],
    },
    {
      name: 'manage',
      title: 'Manage',
      icon: 'settings' as keyof typeof MaterialIcons.glyphMap,
      roles: [UserRole.ADMIN, UserRole.FRANCHISE_OWNER],
    },
    {
      name: 'orders',
      title: 'Orders',
      icon: 'shopping-cart' as keyof typeof MaterialIcons.glyphMap,
      roles: [UserRole.ADMIN, UserRole.FRANCHISE_OWNER, UserRole.SERVICE_AGENT],
    },
    {
      name: 'service',
      title: 'Services',
      icon: 'miscellaneous-services' as keyof typeof MaterialIcons.glyphMap,
      roles: [UserRole.ADMIN, UserRole.FRANCHISE_OWNER, UserRole.SERVICE_AGENT],
    },
    {
      name: 'notifications',
      title: 'Notifications',
      icon: 'notifications' as keyof typeof MaterialIcons.glyphMap,
      roles: [UserRole.SERVICE_AGENT], // Only service agents see notifications
    },
    {
      name: 'profile',
      title: 'Profile',
      icon: 'person' as keyof typeof MaterialIcons.glyphMap,
      roles: [UserRole.ADMIN, UserRole.FRANCHISE_OWNER, UserRole.SERVICE_AGENT],
    },
  ];

  return (
    <View style={styles.container}>
      {/* View As Header Banner */}
      {viewAsState.isViewingAs && (
        <View style={styles.viewAsHeader}>
          <View style={styles.viewAsContent}>
            <MaterialIcons name="visibility" size={16} color="#3B82F6" />
            <Text style={styles.viewAsText}>
              Viewing as {viewAsState.currentViewRole === UserRole.FRANCHISE_OWNER ? 'Franchise Owner' : 'Service Agent'}
              {viewAsState.targetFranchiseName && ` - ${viewAsState.targetFranchiseName}`}
              {viewAsState.targetUserName && ` - ${viewAsState.targetUserName}`}
            </Text>
          </View>
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
        {allTabs.map((tab) => {
          const hasAccess = user && tab.roles.includes(user.role);
          
          return (
            <Tabs.Screen
              key={tab.name}
              name={tab.name}
              options={{
                title: tab.title,
                tabBarIcon: ({ color }) => (
                  <TabBarIcon name={tab.icon} color={color} />
                ),
                // Hide tabs that user doesn't have access to
                href: hasAccess ? undefined : null,
              }}
            />
          );
        })}
      </Tabs>

      {/* Exit View As Button - Bottom Fixed */}
      {viewAsState.isViewingAs && (
        <View style={styles.exitViewContainer}>
          <TouchableOpacity 
            style={styles.exitViewButton} 
            onPress={exitViewAs}
          >
            <MaterialIcons name="exit-to-app" size={20} color="#FFFFFF" />
            <Text style={styles.exitViewButtonText}>Exit View Mode</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Icon wrapper for MaterialIcons
function TabBarIcon({ name, color }: { name: keyof typeof MaterialIcons.glyphMap; color: string }) {
  return <MaterialIcons name={name} size={24} color={color} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  viewAsHeader: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: Platform.OS === 'ios' ? 44 : 8, // Account for status bar on iOS
  },
  viewAsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAsText: {
    color: '#374151',
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    marginLeft: 8,
  },
  exitViewContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70, // Above tab bar
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  exitViewButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exitViewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    marginLeft: 8,
  },
});