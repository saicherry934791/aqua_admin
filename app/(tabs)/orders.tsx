// screens/OrdersScreen.tsx
import { apiService } from '@/lib/api/api';
import FranchiseSkeleton from '@/lib/components/skeltons/FranchisesSkelton';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterType = 'all' | 'created' | 'confirmed' | 'in_progress' | 'delivered' | 'completed' | 'cancelled';
type OrderTypeFilter = 'all' | 'rent' | 'buy';

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  productId: string;
  productName: string;
  productImage?: string;
  type: 'RENT' | 'BUY';
  status: 'CREATED' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL';
  serviceAgentId?: string;
  serviceAgentName?: string;
  installationDate?: string;
  createdAt: string;
  updatedAt: string;
}

const OrdersScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [typeFilter, setTypeFilter] = useState<OrderTypeFilter>('all');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await apiService.get('/orders');
      const data = result?.data || [];
      if (!data || data.length === 0) {
        setOrders([
          {
            id: 'order-1',
            customerId: 'cust-1',
            customerName: 'Ravi Teja',
            customerPhone: '+91 9876543210',
            productId: 'prod-1',
            productName: 'RO Water Purifier Premium',
            type: 'RENT',
            status: 'CONFIRMED',
            totalAmount: 2500,
            paymentStatus: 'PAID',
            serviceAgentId: 'agent-1',
            serviceAgentName: 'Kumar Singh',
            installationDate: '2024-06-28',
            createdAt: '2024-06-25T10:30:00Z',
            updatedAt: '2024-06-25T15:45:00Z',
          },
          {
            id: 'order-2',
            customerId: 'cust-2',
            customerName: 'Priya Sharma',
            customerPhone: '+91 9988776655',
            productId: 'prod-2',
            productName: 'UV Water Purifier Basic',
            type: 'BUY',
            status: 'DELIVERED',
            totalAmount: 15000,
            paymentStatus: 'PAID',
            serviceAgentId: 'agent-2',
            serviceAgentName: 'Raj Patel',
            installationDate: '2024-06-24',
            createdAt: '2024-06-20T09:15:00Z',
            updatedAt: '2024-06-24T16:20:00Z',
          },
          {
            id: 'order-3',
            customerId: 'cust-3',
            customerName: 'Arjun Kumar',
            customerPhone: '+91 8877665544',
            productId: 'prod-3',
            productName: 'Alkaline Water Purifier',
            type: 'RENT',
            status: 'IN_PROGRESS',
            totalAmount: 3000,
            paymentStatus: 'PENDING',
            installationDate: '2024-06-27',
            createdAt: '2024-06-24T14:20:00Z',
            updatedAt: '2024-06-26T11:30:00Z',
          },
          {
            id: 'order-4',
            customerId: 'cust-4',
            customerName: 'Sita Ram',
            customerPhone: '+91 7766554433',
            productId: 'prod-4',
            productName: 'Smart RO System',
            type: 'BUY',
            status: 'CREATED',
            totalAmount: 25000,
            paymentStatus: 'PENDING',
            createdAt: '2024-06-26T16:45:00Z',
            updatedAt: '2024-06-26T16:45:00Z',
          },
          {
            id: 'order-5',
            customerId: 'cust-5',
            customerName: 'Lakshmi Devi',
            customerPhone: '+91 6655443322',
            productId: 'prod-5',
            productName: 'Compact Water Purifier',
            type: 'RENT',
            status: 'CANCELLED',
            totalAmount: 2000,
            paymentStatus: 'REFUNDED',
            createdAt: '2024-06-22T12:00:00Z',
            updatedAt: '2024-06-23T09:30:00Z',
          },
        ]);
      } else {
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleCreateOrder = () => {
    router.push('/orders/create');
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Calculate statistics
  const createdOrders = orders.filter(o => o.status === 'CREATED').length;
  const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED').length;
  const inProgressOrders = orders.filter(o => o.status === 'IN_PROGRESS').length;
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

  // Filter orders based on active filters
  const filteredOrders = orders.filter(order => {
    const statusMatch = activeFilter === 'all' || order.status.toLowerCase() === activeFilter;
    const typeMatch = typeFilter === 'all' || order.type.toLowerCase() === typeFilter;
    return statusMatch && typeMatch;
  });

  // Status filter buttons
  const statusFilters = [
    { key: 'all', icon: 'list', label: 'All', value: orders.length, color: '#3B82F6', bgColor: '#EEF2FF' },
    { key: 'created', icon: 'add-circle', label: 'Created', value: createdOrders, color: '#6B7280', bgColor: '#F9FAFB' },
    { key: 'confirmed', icon: 'checkmark-circle', label: 'Confirmed', value: confirmedOrders, color: '#10B981', bgColor: '#ECFDF5' },
    { key: 'in_progress', icon: 'time', label: 'In Progress', value: inProgressOrders, color: '#F59E0B', bgColor: '#FFFBEB' },
    { key: 'delivered', icon: 'car', label: 'Delivered', value: deliveredOrders, color: '#8B5CF6', bgColor: '#F3E8FF' },
    { key: 'completed', icon: 'checkmark-done', label: 'Completed', value: completedOrders, color: '#059669', bgColor: '#D1FAE5' },
    { key: 'cancelled', icon: 'close-circle', label: 'Cancelled', value: cancelledOrders, color: '#EF4444', bgColor: '#FEF2F2' },
  ];

  // Type filter buttons
  const typeFilters = [
    { key: 'all', label: 'All Types', color: '#3B82F6' },
    { key: 'rent', label: 'Rental', color: '#10B981' },
    { key: 'buy', label: 'Purchase', color: '#F59E0B' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
      case 'CONFIRMED': return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
      case 'IN_PROGRESS': return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' };
      case 'DELIVERED': return { bg: '#F3E8FF', text: '#6B21A8', dot: '#8B5CF6' };
      case 'COMPLETED': return { bg: '#D1FAE5', text: '#047857', dot: '#059669' };
      case 'CANCELLED': return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return { bg: '#ECFDF5', text: '#047857' };
      case 'PENDING': return { bg: '#FFFBEB', text: '#92400E' };
      case 'FAILED': return { bg: '#FEF2F2', text: '#DC2626' };
      case 'REFUNDED': return { bg: '#F3E8FF', text: '#6B21A8' };
      case 'PARTIAL': return { bg: '#FEF3C7', text: '#92400E' };
      default: return { bg: '#F9FAFB', text: '#6B7280' };
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
        {/* Type Filter */}
        <View style={styles.typeFilterContainer}>
          {typeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.typeFilterButton,
                typeFilter === filter.key && [styles.activeTypeFilter, { borderColor: filter.color }]
              ]}
              onPress={() => setTypeFilter(filter.key as OrderTypeFilter)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.typeFilterText,
                typeFilter === filter.key && { color: filter.color }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          {statusFilters.map((filter) => (
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

        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all' && typeFilter === 'all' ? 'No Orders Found' : 'No matching orders'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all' && typeFilter === 'all'
                ? 'Create your first order to get started'
                : 'Try adjusting your filters'
              }
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const statusColors = getStatusColor(order.status);
            const paymentColors = getPaymentStatusColor(order.paymentStatus);

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => {
                  console.log('clicked ')
                  router.push(`/orders/${order.id}`)
                }}
                activeOpacity={0.7}
              >
                {/* Order Header */}
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <View style={styles.orderTitleRow}>
                      <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                      <View style={[styles.orderTypeBadge, {
                        backgroundColor: order.type === 'RENT' ? '#ECFDF5' : '#FFFBEB'
                      }]}>
                        <Text style={[styles.orderTypeText, {
                          color: order.type === 'RENT' ? '#047857' : '#92400E'
                        }]}>
                          {order.type === 'RENT' ? 'Rental' : 'Purchase'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.productName} numberOfLines={1}>{order.productName}</Text>
                    <Text style={styles.customerInfo} numberOfLines={1}>
                      <Ionicons name="person" size={12} color="#6B7280" />
                      {' '}{order.customerName}
                    </Text>
                  </View>
                  <View style={styles.orderAmount}>
                    <Text style={styles.amountText}>{formatCurrency(order.totalAmount)}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                  </View>
                </View>

                {/* Order Status and Payment */}
                <View style={styles.statusContainer}>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
                      <Text style={[styles.statusText, { color: statusColors.text }]}>
                        {order.status.replace('_', ' ')}
                      </Text>
                    </View>
                    <View style={[styles.paymentBadge, { backgroundColor: paymentColors.bg }]}>
                      <Text style={[styles.paymentText, { color: paymentColors.text }]}>
                        {order.paymentStatus}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Additional Info */}
                <View style={styles.additionalInfo}>
                  {order.serviceAgentName && (
                    <View style={styles.agentInfo}>
                      <Ionicons name="person-circle" size={14} color="#6B7280" />
                      <Text style={styles.agentText}>Agent: {order.serviceAgentName}</Text>
                    </View>
                  )}
                  {order.installationDate && (
                    <View style={styles.installationInfo}>
                      <Ionicons name="calendar" size={14} color="#6B7280" />
                      <Text style={styles.installationText}>
                        Installation: {formatDate(order.installationDate)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Indicator */}
                <View style={styles.actionIndicator}>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </SkeletonWrapper>


    </View>
  );
};

export default OrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  typeFilterContainer: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
  },
  typeFilterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeTypeFilter: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
  },
  typeFilterText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  filterScrollView: {
    marginBottom: 20,
  },
  filterContainer: {
    paddingHorizontal: 0,
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
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderId: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginRight: 8,
  },
  orderTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  orderTypeText: {
    fontSize: 10,
    fontFamily: 'Outfit_500Medium',
  },
  productName: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
    marginBottom: 4,
  },
  customerInfo: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  orderAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
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
    textTransform: 'capitalize',
  },
  paymentBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  paymentText: {
    fontSize: 10,
    fontFamily: 'Outfit_500Medium',
    textTransform: 'capitalize',
  },
  additionalInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    gap: 8,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginLeft: 6,
  },
  installationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  installationText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginLeft: 6,
  },
  actionIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
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