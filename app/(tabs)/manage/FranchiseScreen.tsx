// screens/FranchiseScreen.tsx
import { apiService } from '@/lib/api/api';
import FranchiseSkeleton from '@/lib/components/skeltons/FranchisesSkelton';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActionSheetIOS, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterType = 'all' | 'active' | 'pending' | 'company' | 'franchised';

const FranchiseScreen = () => {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const { viewAsFranchiseOwner } = useAuth();
  const params = useLocalSearchParams();

  // Track if we need to refresh data
  const [shouldRefresh, setShouldRefresh] = useState(false);

  // Handle refresh when returning from forms
  useEffect(() => {
    if (params.refreshData) {
      try {
        const parsedData = JSON.parse(params.refreshData as string);
        if (parsedData.type === 'add') {
          // Add new franchise to the list
          setFranchises(prev => [parsedData.data, ...prev]);
        } else if (parsedData.type === 'update') {
          // Update existing franchise in the list
          setFranchises(prev => 
            prev.map(franchise => 
              franchise.id === parsedData.data.id ? parsedData.data : franchise
            )
          );
        }
        // Clear the refresh data parameter
        setTimeout(() => {
          router.setParams({ refreshData: undefined });
        }, 100);
      } catch (error) {
        console.log('Error parsing refresh data:', error);
      }
    }
  }, [params.refreshData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we're returning from another screen
      if (shouldRefresh) {
        fetchFranchises();
        setShouldRefresh(false);
      }
    }, [shouldRefresh])
  );

  // Set refresh flag when navigating away
  const handleAddFranchise = () => {
    setShouldRefresh(true);
    router.push('/franchise/add/new');
  };

  const handleEditFranchise = (franchiseId: string) => {
    setShouldRefresh(true);
    router.push(`/franchise/add/${franchiseId}`);
  };

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      const result = await apiService.get('/franchises');

      if (result.success && Array.isArray(result.data)) {
        let revenueSum = 0;

        const mapped = result.data.map((item: any) => {
          // Parse revenue
          let revenue = 0;
          if (item.revenue && typeof item.revenue === 'string') {
            const match = item.revenue.match(/₹?([\d.]+)(L)?/i);
            if (match) {
              const value = parseFloat(match[1]);
              revenue = match[2] === 'L' ? value * 100000 : value;
            }
          }
          revenueSum += revenue;

          return {
            id: item.id,
            name: item.name,
            location: item.city,
            owner: item.ownerName || 'Owned By Company',
            revenue: item.revenue || '₹0',
            year: new Date(item.createdAt).getFullYear(),
            outlets: 0,
            employees: item.serviceAgentCount || 0,
            status: item.isActive ? 'Active' : 'Pending',
            geoPolygon: JSON.parse(item.geoPolygon || '[]'),
            isCompanyManaged: !!item.isCompanyManaged,
          };
        });

        setFranchises(mapped);
        setTotalRevenue(revenueSum);
      } else {
        setFranchises([]);
        setTotalRevenue(0);
      }
    } catch (err) {
      console.log('Failed to fetch franchises:', err);
      setFranchises([]);
      setTotalRevenue(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFranchises();
  };

  useEffect(() => {
    fetchFranchises();
  }, []);

  const showActionSheet = (franchise: any) => {
    const options = [
      'View Details',
      'Edit Franchise',
      'View as Franchise',
      franchise.status === 'Active' ? 'Deactivate' : 'Activate',
      'Cancel'
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 4,
          destructiveButtonIndex: franchise.status === 'Active' ? 3 : undefined,
          title: `Manage ${franchise.name}`,
          message: 'Choose an action for this franchise'
        },
        (buttonIndex) => {
          if (buttonIndex !== 4) {
            handleActionSheetResponse(franchise, buttonIndex);
          }
        }
      );
    } else {
      Alert.alert(
        `Manage ${franchise.name}`,
        'Choose an action for this franchise',
        [
          { text: 'View Details', onPress: () => handleActionSheetResponse(franchise, 0) },
          { text: 'Edit Franchise', onPress: () => handleActionSheetResponse(franchise, 1) },
          { text: 'View as Franchise', onPress: () => handleActionSheetResponse(franchise, 2) },
          {
            text: franchise.status === 'Active' ? 'Deactivate' : 'Activate',
            style: franchise.status === 'Active' ? 'destructive' : 'default',
            onPress: () => handleActionSheetResponse(franchise, 3)
          },
          { text: 'Cancel', style: 'cancel' }
        ],
        { cancelable: true }
      );
    }
  };

  const updateFranchiseStatus = async (id: string, status: boolean) => {
    // Implementation for updating franchise status
  };

  const handleViewAsFranchise = (franchise: any) => {
    viewAsFranchiseOwner(franchise.id, franchise.name);
    Alert.alert(
      'View Mode Changed',
      `You are now viewing as ${franchise.name} franchise owner. You can switch back anytime from the banner at the top.`,
      [{ text: 'OK' }]
    );
  };

  const handleActionSheetResponse = (franchise: any, buttonIndex: number) => {
    switch (buttonIndex) {
      case 0:
        router.push(`/franchise/${franchise.id}`);
        break;
      case 1:
        handleEditFranchise(franchise.id);
        break;
      case 2:
        handleViewAsFranchise(franchise);
        break;
      case 3:
        updateFranchiseStatus(franchise.id, franchise.status !== 'Active');
        break;
    }
  };

  // Calculate statistics
  const activeFranchises = franchises.filter(f => f.status === 'Active').length;
  const pendingFranchises = franchises.filter(f => f.status === 'Pending').length;
  const companyManaged = franchises.filter(f => f.isCompanyManaged).length;
  const franchisedOut = franchises.length - companyManaged;

  // Filter franchises based on active filter
  const filteredFranchises = franchises.filter(franchise => {
    switch (activeFilter) {
      case 'active':
        return franchise.status === 'Active';
      case 'pending':
        return franchise.status === 'Pending';
      case 'company':
        return franchise.isCompanyManaged;
      case 'franchised':
        return !franchise.isCompanyManaged;
      default:
        return true;
    }
  });

  // Filter buttons data
  const filterButtons = [
    { key: 'all', icon: 'business', label: 'All', value: franchises.length, color: '#3B82F6', bgColor: '#EEF2FF' },
    { key: 'active', icon: 'checkmark-circle', label: 'Active', value: activeFranchises, color: '#10B981', bgColor: '#ECFDF5' },
    { key: 'pending', icon: 'time', label: 'Pending', value: pendingFranchises, color: '#F59E0B', bgColor: '#FFFBEB' },
    { key: 'company', icon: 'home', label: 'Company', value: companyManaged, color: '#8B5CF6', bgColor: '#F3E8FF' },
    { key: 'franchised', icon: 'people', label: 'Franchised', value: franchisedOut, color: '#EF4444', bgColor: '#FEF2F2' },
  ];

  return (
    <View style={styles.container}>
      <SkeletonWrapper
        loading={loading}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        skeleton={<FranchiseSkeleton />}
        style={styles.scrollContent}
      >
        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          {filterButtons.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                { backgroundColor: filter.bgColor },
                activeFilter === filter.key && [styles.activeFilterButton, { borderColor: filter.color }]
              ]}
              onPress={() => setActiveFilter(filter.key as FilterType)}
              activeOpacity={0.7}
            >
              <View style={[styles.filterIcon, { backgroundColor: filter.color }]}>
                <Ionicons name={filter.icon as any} size={16} color="#fff" />
              </View>
              <Text style={[
                styles.filterValue,
                activeFilter === filter.key && { color: filter.color }
              ]}>
                {filter.value}
              </Text>
              <Text style={[
                styles.filterLabel,
                activeFilter === filter.key && { color: filter.color }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredFranchises.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="business" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all' ? 'No Franchises Found' : `No ${activeFilter} franchises`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all'
                ? 'Add your first franchise to get started'
                : `Try selecting a different filter`
              }
            </Text>
          </View>
        ) : (
          filteredFranchises.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.franchiseCard}
              onPress={() => showActionSheet(item)}
              activeOpacity={0.7}
            >
              {/* Franchise Header */}
              <View style={styles.franchiseHeader}>
                <View style={styles.franchiseInfo}>
                  <View style={styles.avatarContainer}>
                    <MaterialIcons name="business" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.franchiseDetails}>
                    <Text style={styles.franchiseName}>{item.name}</Text>
                    <Text style={styles.franchiseLocation} numberOfLines={1}>
                      <Ionicons name="location" size={12} color="#6B7280" />
                      {' '}{item.location}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusAndActions}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'Active' ? styles.badgeActive : styles.badgePending
                    ]}
                  >
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: item.status === 'Active' ? '#10B981' : '#F59E0B' }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: item.status === 'Active' ? '#047857' : '#D97706' }
                    ]}>
                      {item.status}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.editButton}>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Franchise Details */}
              <View style={styles.franchiseMetrics}>
                <View style={styles.ownerRow}>
                  <Text style={styles.ownerLabel}>Owner:</Text>
                  <Text style={styles.ownerValue}>{item.owner}</Text>
                  {item.isCompanyManaged && (
                    <View style={styles.companyBadge}>
                      <Text style={styles.companyBadgeText}>Company</Text>
                    </View>
                  )}
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Revenue</Text>
                    <Text style={styles.metricValue}>{item.revenue}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Established</Text>
                    <Text style={styles.metricValue}>{item.year}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Outlets</Text>
                    <Text style={styles.metricValue}>{item.outlets}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Employees</Text>
                    <Text style={styles.metricValue}>{item.employees}</Text>
                  </View>
                </View>

                {/* View As Button */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity 
                    style={styles.viewAsButton}
                    onPress={() => handleViewAsFranchise(item)}
                  >
                    <Ionicons name="eye" size={16} color="#3B82F6" />
                    <Text style={styles.viewAsButtonText}>View as Franchise</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </SkeletonWrapper>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddFranchise}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default FranchiseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  filterScrollView: {
    marginTop: 16,
    marginBottom: 20,
  },
  filterContainer: {
    paddingHorizontal: 0,
    padding: 2,
    borderRadius: 100,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 2,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeFilterButton: {
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  filterIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  filterValue: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginRight: 4,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
  },
  franchiseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  franchiseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  franchiseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  franchiseDetails: {
    flex: 1,
  },
  franchiseName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  franchiseLocation: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  statusAndActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeActive: {
    backgroundColor: '#ECFDF5',
  },
  badgePending: {
    backgroundColor: '#FFFBEB',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  editButton: {
    padding: 4,
  },
  franchiseMetrics: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ownerLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginRight: 8,
  },
  ownerValue: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    flex: 1,
  },
  companyBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  companyBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_500Medium',
    color: '#7C3AED',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  viewAsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  viewAsButtonText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#3B82F6',
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});