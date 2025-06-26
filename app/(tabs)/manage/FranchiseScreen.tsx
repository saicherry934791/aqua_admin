// screens/FranchiseScreen.tsx
import { apiService } from '@/lib/api/api';
import FranchiseSkeleton from '@/lib/components/skeltons/FranchisesSkelton';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterType = 'all' | 'active' | 'pending' | 'company' | 'franchised';

const FranchiseScreen = () => {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

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
      console.error('Failed to fetch franchises:', err);
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

  const handleAddFranchise = () => {
    router.push('/franchise/add/new');
  };

  useEffect(() => {
    fetchFranchises();
  }, []);

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

        {/* Revenue Summary Card */}
        {/* <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="trending-up" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryTitle}>Total Revenue</Text>
              <Text style={styles.summaryValue}>₹{(totalRevenue / 100000).toFixed(1)}L</Text>
            </View>
          </View>
        </View> */}

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
              onPress={() => router.push('/franchise/abc')}
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
    // backgroundColor:'white',
    // padding:12,
    padding:2,
    borderRadius:100,
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  summaryDetails: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
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
    // color: '#9CA3AF',
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
    // color: '#7C3AED',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  employeeText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginLeft: 4,
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