// screens/OrdersScreen.tsx
import { apiService } from '@/lib/api/api';
import FranchiseSkeleton from '@/lib/components/skeltons/FranchisesSkelton';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterType = 'all' | 'created' | 'payment_pending' | 'payment_completed' | 'assigned' | 'installation_pending' | 'installed' | 'completed' | 'cancelled';
type OrderTypeFilter = 'all' | 'rent' | 'purchase';

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  productId: string;
  productName: string;
  productImage?: string;
  type: 'rent' | 'purchase';
  status: 'created' | 'payment_pending' | 'payment_completed' | 'assigned' | 'installation_pending' | 'installed' | 'cancelled' | 'completed';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partial';
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
      console.log('Orders API response:', JSON.stringify(result));

      if (result.success && result.data && Array.isArray(result.data.orders)) {
        // Map the API response to our Order interface
        const mappedOrders: Order[] = result.data.orders.map((item: any) => ({
          id: item.id || item._id || Date.now().toString(),
          customerId: item.customerId || item.customer_id || '',
          customerName: item.customer?.name || item.customerName || item.customer_name || 'Unknown Customer',
          customerPhone: item.customer?.phone || item.customerPhone || item.customer_phone || '',
          customerEmail: item.customer?.email || item.customerEmail || item.customer_email,
          productId: item.productId || item.product_id || '',
          productName: item.product?.name || item.productName || item.product_name || 'Unknown Product',
          productImage: item.product?.images?.[0] || item.productImage || item.product_image,
          type: (item.type || item.order_type || 'purchase').toLowerCase() as 'rent' | 'purchase',
          status: (item.status || 'created').toLowerCase() as Order['status'],
          totalAmount: item.totalAmount || item.total_amount || 0,
          paymentStatus: (item.paymentStatus || item.payment_status || 'pending').toLowerCase() as Order['paymentStatus'],
          serviceAgentId: item.serviceAgentId || item.service_agent_id || item.serviceAgent?.id,
          serviceAgentName: item.serviceAgent?.name || item.serviceAgentName || item.service_agent_name,
          installationDate: item.installationDate || item.installation_date,
          createdAt: item.createdAt || item.created_at || new Date().toISOString(),
          updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
        }));

        setOrders(mappedOrders);
      } else {
        // Fallback to empty array if API doesn't return data
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Set empty array on error
      setOrders([]);
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
  const createdOrders = orders.filter(o => o.status === 'created').length;
  const paymentPendingOrders = orders.filter(o => o.status === 'payment_pending').length;
  const paymentCompletedOrders = orders.filter(o => o.status === 'payment_completed').length;
  const assignedOrders = orders.filter(o => o.status === 'assigned').length;
  const installationPendingOrders = orders.filter(o => o.status === 'installation_pending').length;
  const installedOrders = orders.filter(o => o.status === 'installed').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

  // Filter orders based on active filters
  const filteredOrders = orders.filter(order => {
    const statusMatch = activeFilter === 'all' || order.status === activeFilter;
    const typeMatch = typeFilter === 'all' || order.type === typeFilter;
    return statusMatch && typeMatch;
  });

  // Status filter buttons
  const statusFilters = [
    { key: 'all', icon: 'list', label: 'All', value: orders.length, color: '#3B82F6', bgColor: '#EEF2FF' },
    { key: 'created', icon: 'add-circle', label: 'Created', value: createdOrders, color: '#6B7280', bgColor: '#F9FAFB' },
    { key: 'payment_pending', icon: 'card', label: 'Payment Pending', value: paymentPendingOrders, color: '#F59E0B', bgColor: '#FFFBEB' },
    { key: 'payment_completed', icon: 'checkmark-circle', label: 'Payment Done', value: paymentCompletedOrders, color: '#10B981', bgColor: '#ECFDF5' },
    { key: 'assigned', icon: 'person-add', label: 'Assigned', value: assignedOrders, color: '#8B5CF6', bgColor: '#F3E8FF' },
    { key: 'installation_pending', icon: 'time', label: 'Installation Pending', value: installationPendingOrders, color: '#F59E0B', bgColor: '#FFFBEB' },
    { key: 'installed', icon: 'checkmark-done', label: 'Installed', value: installedOrders, color: '#059669', bgColor: '#D1FAE5' },
    { key: 'completed', icon: 'checkmark-done-circle', label: 'Completed', value: completedOrders, color: '#059669', bgColor: '#D1FAE5' },
    { key: 'cancelled', icon: 'close-circle', label: 'Cancelled', value: cancelledOrders, color: '#EF4444', bgColor: '#FEF2F2' },
  ];

  // Type filter buttons
  const typeFilters = [
    { key: 'all', label: 'All Types', color: '#3B82F6' },
    { key: 'rent', label: 'Rental', color: '#10B981' },
    { key: 'purchase', label: 'Purchase', color: '#F59E0B' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
      case 'payment_pending': return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' };
      case 'payment_completed': return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
      case 'assigned': return { bg: '#F3E8FF', text: '#6B21A8', dot: '#8B5CF6' };
      case 'installation_pending': return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' };
      case 'installed': return { bg: '#D1FAE5', text: '#047857', dot: '#059669' };
      case 'completed': return { bg: '#D1FAE5', text: '#047857', dot: '#059669' };
      case 'cancelled': return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return { bg: '#ECFDF5', text: '#047857' };
      case 'pending': return { bg: '#FFFBEB', text: '#92400E' };
      case 'failed': return { bg: '#FEF2F2', text: '#DC2626' };
      case 'refunded': return { bg: '#F3E8FF', text: '#6B21A8' };
      case 'partial': return { bg: '#FEF3C7', text: '#92400E' };
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

  const getStatusDisplayText = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
                        backgroundColor: order.type === 'rent' ? '#ECFDF5' : '#FFFBEB'
                      }]}>
                        <Text style={[styles.orderTypeText, {
                          color: order.type === 'rent' ? '#047857' : '#92400E'
                        }]}>
                          {order.type === 'rent' ? 'Rental' : 'Purchase'}
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
                        {getStatusDisplayText(order.status)}
                      </Text>
                    </View>
                    <View style={[styles.paymentBadge, { backgroundColor: paymentColors.bg }]}>
                      <Text style={[styles.paymentText, { color: paymentColors.text }]}>
                        {order.paymentStatus.toUpperCase()}
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