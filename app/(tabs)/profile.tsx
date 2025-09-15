import { apiService } from '@/lib/api/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { Activity, Building2, Crown, MapPin, Phone, Shield, TrendingUp, Users, Wrench } from 'lucide-react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface ProfileData {
  user: {
    id: string;
    name: string;
    phone: string;
    role: string;
    isActive?: boolean;
  };
  profile: {
    type: string;
    totalFranchises?: number;
    totalAgents?: number;
    totalCustomers?: number;
    totalRevenue?: number;
    permissions?: string[];
    franchise?: {
      id: string;
      name: string;
      fullname: string;
      city: string;
      franchiseType: string;
      isActive: boolean;
      totalAgents: number;
      totalCustomers: number;
      totalRevenue: number;
      createdAt: string;
    };
    assignments?: Array<{
      franchiseId: string;
      franchiseName: string;
      franchiseCity: string;
      isPrimary: boolean;
      isActive: boolean;
      assignedDate: string;
    }>;
    statistics?: {
      totalRequests: number;
      completedRequests: number;
      pendingRequests: number;
      completionRate: number;
    };
  };
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headerTitle}>PROFILE</Text>
      ),
      headerTitleAlign: 'center',
      headerShadowVisible: false,
      headerRight: () => (
        <TouchableOpacity
          onPress={fetchProfileData}
          style={styles.refreshButton}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color="#007bff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      console.log('Fetching profile for user:', user);
      const result = await apiService.get('/users/profile');
      console.log('Profile API response:', result);
      if (result.success) {
        setProfileData(result.data);
      } else {
        console.log('Profile API failed:', result);
        // Set fallback data for testing
        setProfileData({
          user: {
            id: user.id || 'user_id',
            name: user.profile?.name || 'User Name',
            phone: user.phoneNumber || '1234567890',
            role: user.role || 'ADMIN',
            isActive: true
          },
          profile: {
            type: user.role || 'ADMIN',
            totalFranchises: 15,
            totalAgents: 25,
            totalCustomers: 150,
            totalRevenue: 50000,
            permissions: [
              'manage_franchises',
              'manage_agents',
              'view_all_data',
              'manage_products',
              'view_reports',
              'manage_users'
            ]
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Set fallback data on error
      setProfileData({
        user: {
          id: user.id || 'user_id',
          name: user.profile?.name || 'User Name',
          phone: user.phoneNumber || '1234567890',
          role: user.role || 'ADMIN',
          isActive: true
        },
        profile: {
          type: user.role || 'ADMIN',
          totalFranchises: 15,
          totalAgents: 25,
          totalCustomers: 150,
          totalRevenue: 50000,
          permissions: [
            'manage_franchises',
            'manage_agents',
            'view_all_data',
            'manage_products',
            'view_reports',
            'manage_users'
          ]
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      return `₹${value / 1000}K`;
    }
    return `₹${value}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return Crown;
      case 'FRANCHISE_OWNER':
        return Building2;
      case 'SERVICE_AGENT':
        return Wrench;
      default:
        return Users;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return '#DC2626';
      case 'FRANCHISE_OWNER':
        return '#2563EB';
      case 'SERVICE_AGENT':
        return '#059669';
      default:
        return '#6B7280';
    }
  };

  const renderAdminProfile = () => (
    <View style={styles.profileContainer}>
      {/* User Info Card */}
      <View style={styles.userInfoCard}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: getRoleColor('ADMIN') }]}>
            <Crown size={32} color="white" />
          </View>
        </View>
        <Text style={styles.userName}>{profileData?.user.name}</Text>
        <Text style={styles.userRole}>Administrator</Text>
        <View style={styles.contactInfo}>
          <Phone size={16} color="#6B7280" />
          <Text style={styles.contactText}>{profileData?.user.phone}</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#10B98115' }]}>
            <Building2 size={20} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{profileData?.profile.totalFranchises || 0}</Text>
          <Text style={styles.statLabel}>Franchises</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#3B82F615' }]}>
            <Users size={20} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{profileData?.profile.totalAgents || 0}</Text>
          <Text style={styles.statLabel}>Agents</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B15' }]}>
            <Users size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{profileData?.profile.totalCustomers || 0}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#8B5CF615' }]}>
            <TrendingUp size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.statValue}>{formatCurrency(profileData?.profile.totalRevenue || 0)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {/* Permissions */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Permissions</Text>
        <View style={styles.permissionsGrid}>
          {profileData?.profile.permissions?.map((permission, index) => (
            <View key={index} style={styles.permissionChip}>
              <Shield size={14} color="#059669" />
              <Text style={styles.permissionText}>{permission.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderFranchiseOwnerProfile = () => (
    <View style={styles.profileContainer}>
      {/* User Info Card */}
      <View style={styles.userInfoCard}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: getRoleColor('FRANCHISE_OWNER') }]}>
            <Building2 size={32} color="white" />
          </View>
        </View>
        <Text style={styles.userName}>{profileData?.user.name}</Text>
        <Text style={styles.userRole}>Franchise Owner</Text>
        <View style={styles.contactInfo}>
          <Phone size={16} color="#6B7280" />
          <Text style={styles.contactText}>{profileData?.user.phone}</Text>
        </View>
      </View>

      {/* Franchise Info Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Franchise Information</Text>
        <View style={styles.franchiseInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Franchise Name:</Text>
            <Text style={styles.infoValue}>{profileData?.profile.franchise?.fullname}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>City:</Text>
            <Text style={styles.infoValue}>{profileData?.profile.franchise?.city}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{profileData?.profile.franchise?.franchiseType}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot,
                { backgroundColor: profileData?.profile.franchise?.isActive ? '#10B981' : '#EF4444' }
              ]} />
              <Text style={styles.statusText}>
                {profileData?.profile.franchise?.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>
              {profileData?.profile.franchise?.createdAt ? formatDate(profileData.profile.franchise.createdAt) : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#3B82F615' }]}>
            <Users size={20} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{profileData?.profile.franchise?.totalAgents || 0}</Text>
          <Text style={styles.statLabel}>Agents</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B15' }]}>
            <Users size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>{profileData?.profile.franchise?.totalCustomers || 0}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#8B5CF615' }]}>
            <TrendingUp size={20} color="#8B5CF6" />
          </View>
          <Text style={styles.statValue}>{formatCurrency(profileData?.profile.franchise?.totalRevenue || 0)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>
    </View>
  );

  const renderServiceAgentProfile = () => (
    <View style={styles.profileContainer}>
      {/* User Info Card */}
      <View style={styles.userInfoCard}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: getRoleColor('SERVICE_AGENT') }]}>
            <Wrench size={32} color="white" />
          </View>
        </View>
        <Text style={styles.userName}>{profileData?.user.name}</Text>
        <Text style={styles.userRole}>Service Agent</Text>
        <View style={styles.contactInfo}>
          <Phone size={16} color="#6B7280" />
          <Text style={styles.contactText}>{profileData?.user.phone}</Text>
        </View>
      </View>

      {/* Assignments */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Franchise Assignments</Text>
        {profileData?.profile.assignments?.map((assignment, index) => (
          <View key={index} style={styles.assignmentCard}>
            <View style={styles.assignmentHeader}>
              <Text style={styles.franchiseName}>{assignment.franchiseName}</Text>
              {assignment.isPrimary && (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryText}>Primary</Text>
                </View>
              )}
            </View>
            <View style={styles.assignmentDetails}>
              <View style={styles.locationInfo}>
                <MapPin size={14} color="#6B7280" />
                <Text style={styles.locationText}>{assignment.franchiseCity}</Text>
              </View>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: assignment.isActive ? '#10B981' : '#EF4444' }
                ]} />
                <Text style={styles.statusText}>
                  {assignment.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            <Text style={styles.assignedDate}>
              Assigned: {formatDate(assignment.assignedDate)}
            </Text>
          </View>
        ))}
      </View>

      {/* Statistics */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Performance Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#3B82F615' }]}>
              <Activity size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{profileData?.profile.statistics?.totalRequests || 0}</Text>
            <Text style={styles.statLabel}>Total Requests</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#10B98115' }]}>
              <TrendingUp size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{profileData?.profile.statistics?.completedRequests || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F59E0B15' }]}>
              <Activity size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{profileData?.profile.statistics?.pendingRequests || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#8B5CF615' }]}>
              <TrendingUp size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.statValue}>{profileData?.profile.statistics?.completionRate || 0}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderProfileContent = () => {
    if (!profileData) {
      return (
        <View style={styles.profileContainer}>
          <Text style={styles.errorText}>No profile data available</Text>
          <Text style={styles.errorText}>User: {JSON.stringify(user)}</Text>
        </View>
      );
    }

    console.log('Rendering profile for role:', profileData.user.role);
    console.log('Profile data:', profileData);

    const userRole = profileData.user.role?.toUpperCase();
    console.log('Normalized user role:', userRole);

    switch (userRole) {
      case 'ADMIN':
        return renderAdminProfile();
      case 'FRANCHISE_OWNER':
        return renderFranchiseOwnerProfile();
      case 'SERVICE_AGENT':
        return renderServiceAgentProfile();
      default:
        return (
          <View style={styles.profileContainer}>
            <Text style={styles.errorText}>Unknown user role: {profileData.user.role}</Text>
            <Text style={styles.errorText}>Normalized: {userRole}</Text>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableWithoutFeedback >
        <View>
          {renderProfileContent()}

          {/* Logout Button */}
          <View style={styles.logoutSection}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#111618',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginTop: 16,
  },
  profileContainer: {
    padding: 16,
  },
  userInfoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#64748b',
    marginBottom: 16,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    display: 'none',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#64748b',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  permissionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permissionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  permissionText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#065F46',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  franchiseInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1e293b',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#1e293b',
  },
  assignmentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  franchiseName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1e293b',
    flex: 1,
  },
  primaryBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  primaryText: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    color: '#92400E',
  },
  assignmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginLeft: 4,
  },
  assignedDate: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
  },
  logoutSection: {
    padding: 16,
    paddingBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#EF4444',
    textAlign: 'center',
    padding: 20,
  },
});