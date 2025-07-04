// screens/CustomerScreen.tsx
import { apiService } from '@/lib/api/api';
import FranchiseSkeleton from '@/lib/components/skeltons/FranchisesSkelton';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterType = 'all' | 'active' | 'inactive' | 'recent' | 'premium';

const CustomerScreen = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const result = await apiService.get('/customers');
      const data = result?.data || [];
      if (!data || data.length === 0) {
        setCustomers([
          {
            id: 'dummy-1',
            name: 'Ravi Teja',
            phone: '+91 9876543210',
            email: 'ravi@example.com',
            address: 'Hyderabad, Telangana',
            createdAt: '2023-05-12T12:00:00Z',
            isActive: true,
            totalOrders: 12,
            totalSpent: '₹45,000',
            joinDate: new Date('2023-05-12'),
            isPremium: true,
          },
          {
            id: 'dummy-2',
            name: 'Sita Ram',
            phone: '+91 9988776655',
            email: 'sita@example.com',
            address: 'Bangalore, Karnataka',
            createdAt: '2024-01-22T10:00:00Z',
            isActive: false,
            totalOrders: 3,
            totalSpent: '₹8,500',
            joinDate: new Date('2024-01-22'),
            isPremium: false,
          },
          {
            id: 'dummy-3',
            name: 'Arjun Kumar',
            phone: '+91 8877665544',
            email: 'arjun@example.com',
            address: 'Chennai, Tamil Nadu',
            createdAt: '2024-11-15T08:30:00Z',
            isActive: true,
            totalOrders: 7,
            totalSpent: '₹22,000',
            joinDate: new Date('2024-11-15'),
            isPremium: false,
          },
          {
            id: 'dummy-4',
            name: 'Priya Sharma',
            phone: '+91 7766554433',
            email: 'priya@example.com',
            address: 'Mumbai, Maharashtra',
            createdAt: '2024-12-01T14:20:00Z',
            isActive: true,
            totalOrders: 25,
            totalSpent: '₹85,000',
            joinDate: new Date('2024-12-01'),
            isPremium: true,
          },
        ]);
      } else {
        setCustomers(data);
      }
    } catch (error) {
      console.log('Failed to fetch customers:', error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const handleAddCustomer = () => {
    router.push('/customer/add/new');
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Calculate statistics
  const activeCustomers = customers.filter(c => c.isActive).length;
  const inactiveCustomers = customers.filter(c => !c.isActive).length;
  const recentCustomers = customers.filter(c => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return c.createdAt && new Date(c.createdAt) > oneMonthAgo;
  }).length;
  const premiumCustomers = customers.filter(c => c.isPremium).length;

  // Filter customers based on active filter
  const filteredCustomers = customers.filter(customer => {
    switch (activeFilter) {
      case 'active':
        return customer.isActive;
      case 'inactive':
        return !customer.isActive;
      case 'recent':
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return customer.createdAt && new Date(customer.createdAt) > oneMonthAgo;
      case 'premium':
        return customer.isPremium;
      default:
        return true;
    }
  });

  // Filter buttons data
  const filterButtons = [
    { key: 'all', icon: 'people', label: 'All', value: customers.length, color: '#3B82F6', bgColor: '#EEF2FF' },
    { key: 'active', icon: 'checkmark-circle', label: 'Active', value: activeCustomers, color: '#10B981', bgColor: '#ECFDF5' },
    { key: 'inactive', icon: 'pause-circle', label: 'Inactive', value: inactiveCustomers, color: '#EF4444', bgColor: '#FEF2F2' },
    { key: 'recent', icon: 'time', label: 'Recent', value: recentCustomers, color: '#F59E0B', bgColor: '#FFFBEB' },
    { key: 'premium', icon: 'star', label: 'Premium', value: premiumCustomers, color: '#8B5CF6', bgColor: '#F3E8FF' },
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

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

        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="people" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all' ? 'No Customers Found' : `No ${activeFilter} customers`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all'
                ? 'Add your first customer to get started'
                : `Try selecting a different filter`
              }
            </Text>
          </View>
        ) : (
          filteredCustomers.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.customerCard}
              onPress={() => router.push(`/customer/${item.id}`)}
              activeOpacity={0.7}
            >
              {/* Customer Header */}
              <View style={styles.customerHeader}>
                <View style={styles.customerInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                  </View>
                  <View style={styles.customerDetails}>
                    <View style={styles.nameRow}>
                      <Text style={styles.customerName}>{item.name}</Text>
                      {item.isPremium && (
                        <View style={styles.premiumBadge}>
                          <Ionicons name="star" size={10} color="#F59E0B" />
                        </View>
                      )}
                    </View>
                    <Text style={styles.customerContact} numberOfLines={1}>
                      <Ionicons name="call" size={12} color="#6B7280" />
                      {' '}{item.phone}
                    </Text>
                    <Text style={styles.customerEmail} numberOfLines={1}>
                      <Ionicons name="mail" size={12} color="#6B7280" />
                      {' '}{item.email}
                    </Text>
                  </View>
                </View>
                <View style={styles.statusAndActions}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.isActive ? styles.badgeActive : styles.badgeInactive
                    ]}
                  >
                    <View style={[
                      styles.statusDot,
                      { backgroundColor: item.isActive ? '#10B981' : '#EF4444' }
                    ]} />
                    <Text style={[
                      styles.statusText,
                      { color: item.isActive ? '#047857' : '#DC2626' }
                    ]}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.editButton}>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Customer Details */}
              <View style={styles.customerMetrics}>
                <View style={styles.addressRow}>
                  <Ionicons name="location" size={14} color="#6B7280" />
                  <Text style={styles.addressText}>{item.address}</Text>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Orders</Text>
                    <Text style={styles.metricValue}>{item.totalOrders}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Total Spent</Text>
                    <Text style={styles.metricValue}>{item.totalSpent}</Text>
                  </View>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>Joined</Text>
                    <Text style={styles.metricValue}>
                      {item.joinDate ? item.joinDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      }) : 'N/A'}
                    </Text>
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
        onPress={handleAddCustomer}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default CustomerScreen;

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
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerInfo: {
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
  avatarText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  customerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginRight: 6,
  },
  premiumBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerContact: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  customerEmail: {
    fontSize: 13,
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
  badgeInactive: {
    backgroundColor: '#FEF2F2',
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
  customerMetrics: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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