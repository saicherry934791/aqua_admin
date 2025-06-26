import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {

  const router = useRouter();

  // Sample user data (would typically come from authentication context/state management)
  const [userData] = useState({
    superAdmin: {
      name: 'Super Admin',
      email: 'admin@company.com',
      phone: '+1 (555) 123-4567',
      role: 'Super Administrator',
    },
    franchiseOwner: {
      name: 'Jane Franchise',
      email: 'jane@franchise.com',
      phone: '+1 (555) 987-6543',
      role: 'Franchise Owner',
      franchiseName: 'Franchise A',
    },
    serviceAgent: {
      name: 'John Agent',
      email: 'john@service.com',
      phone: '+1 (555) 246-8135',
      role: 'Service Agent',
      assignedFranchise: 'Franchise B',
    }
  });

  const handleLogout = async () => {
    // Reset user type to guest
   
    await AsyncStorage.clear()
    // Navigate to login screen
    router.replace('/(auth)/login');
   
    
  };

  // Get user details based on current user type

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
       
      </View>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// Reusable Information Row Component
const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 30,
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 15,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: 'gray',
  },
  infoSection: {
    backgroundColor: 'white',
    marginBottom: 20,
    paddingVertical: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: 'gray',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 