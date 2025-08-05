// screens/InstallationRequestsScreen.tsx
import { apiService } from '@/lib/api/api';
import FranchiseSkeleton from '@/lib/components/skeltons/FranchisesSkelton';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterType = 'all' | 'SUBMITTED' | 'FRANCHISE_CONTACTED' | 'INSTALLATION_SCHEDULED' | 'INSTALLATION_IN_PROGRESS' | 'INSTALLATION_COMPLETED' | 'CANCELLED' | 'REJECTED';
type OrderTypeFilter = 'all' | 'RENTAL' | 'PURCHASE';

interface InstallationRequest {
  id: string;
  productId: string;
  customerId: string;
  orderType: 'RENTAL' | 'PURCHASE';
  name: string;
  phoneNumber: string;
  franchiseId: string;
  franchiseName: string;
  status: 'SUBMITTED' | 'FRANCHISE_CONTACTED' | 'INSTALLATION_SCHEDULED' | 'INSTALLATION_IN_PROGRESS' | 'INSTALLATION_COMPLETED' | 'CANCELLED' | 'REJECTED';
  installationAddress: string;
  scheduledDate: string | null;
  assignedTechnicianId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    rentPrice: number;
    buyPrice: number;
    deposit: number;
  };
  franchise: {
    id: string;
    name: string;
    city: string;
  };
  customer: {
    id: string;
    name: string | null;
    phone: string;
  };
  assignedTechnician: {
    id: string;
    name: string | null;
  } | null;
}

const InstallationRequestsScreen = () => {
  const [requests, setRequests] = useState<InstallationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [typeFilter, setTypeFilter] = useState<OrderTypeFilter>('all');
  const navigation = useNavigation();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: 1,
        limit: 100
      };

      if (activeFilter !== 'all') {
        params.status = activeFilter;
      }

      if (typeFilter !== 'all') {
        params.orderType = typeFilter;
      }

      const result = await apiService.get('/installation-requests', { params });
  

      if (result.success && result.data && Array.isArray(result.data.installationRequests)) {
        setRequests(result.data.installationRequests);
      } else {
        setRequests([]);
      }
    } catch (error) {
   
      setRequests([]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text
          style={{
            fontSize: 20,
            fontFamily: 'Outfit_700Bold',
            color: '#121516',
          }}
        >
          INSTALLATION REQUESTS
        </Text>
      ),
      headerTitleAlign: 'center',
      headerShadowVisible: false
    });
  }, [navigation]);

  useEffect(() => {
    fetchRequests();
  }, [activeFilter, typeFilter]);

  // Calculate statistics
  const submittedRequests = requests.filter(r => r.status === 'SUBMITTED').length;
  const franchiseContactedRequests = requests.filter(r => r.status === 'FRANCHISE_CONTACTED').length;
  const scheduledRequests = requests.filter(r => r.status === 'INSTALLATION_SCHEDULED').length;
  const inProgressRequests = requests.filter(r => r.status === 'INSTALLATION_IN_PROGRESS').length;
  const completedRequests = requests.filter(r => r.status === 'INSTALLATION_COMPLETED').length;
  const cancelledRequests = requests.filter(r => r.status === 'CANCELLED').length;
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED').length;

  // Status filter buttons
  const statusFilters = [
    { key: 'all', icon: 'list', label: 'All', value: requests.length, color: '#3B82F6', bgColor: '#EEF2FF' },
    { key: 'SUBMITTED', icon: 'add-circle', label: 'Submitted', value: submittedRequests, color: '#6B7280', bgColor: '#F9FAFB' },
    { key: 'FRANCHISE_CONTACTED', icon: 'call', label: 'Contacted', value: franchiseContactedRequests, color: '#8B5CF6', bgColor: '#F3E8FF' },
    { key: 'INSTALLATION_SCHEDULED', icon: 'calendar', label: 'Scheduled', value: scheduledRequests, color: '#F59E0B', bgColor: '#FFFBEB' },
    { key: 'INSTALLATION_IN_PROGRESS', icon: 'construct', label: 'In Progress', value: inProgressRequests, color: '#10B981', bgColor: '#ECFDF5' },
    { key: 'INSTALLATION_COMPLETED', icon: 'checkmark-done', label: 'Completed', value: completedRequests, color: '#059669', bgColor: '#D1FAE5' },
    { key: 'CANCELLED', icon: 'close-circle', label: 'Cancelled', value: cancelledRequests, color: '#EF4444', bgColor: '#FEF2F2' },
    { key: 'REJECTED', icon: 'close', label: 'Rejected', value: rejectedRequests, color: '#DC2626', bgColor: '#FEF2F2' },
  ];

  // Type filter buttons
  const typeFilters = [
    { key: 'all', label: 'All Types', color: '#3B82F6' },
    { key: 'RENTAL', label: 'Rental', color: '#10B981' },
    { key: 'PURCHASE', label: 'Purchase', color: '#F59E0B' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
      case 'FRANCHISE_CONTACTED': return { bg: '#F3E8FF', text: '#6B21A8', dot: '#8B5CF6' };
      case 'INSTALLATION_SCHEDULED': return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' };
      case 'INSTALLATION_IN_PROGRESS': return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
      case 'INSTALLATION_COMPLETED': return { bg: '#D1FAE5', text: '#047857', dot: '#059669' };
      case 'CANCELLED': return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      case 'REJECTED': return { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626' };
      default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
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
    switch (status) {
      case 'SUBMITTED': return 'Submitted';
      case 'FRANCHISE_CONTACTED': return 'Franchise Contacted';
      case 'INSTALLATION_SCHEDULED': return 'Scheduled';
      case 'INSTALLATION_IN_PROGRESS': return 'In Progress';
      case 'INSTALLATION_COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  };

  const getPriceForOrderType = (request: InstallationRequest) => {
    return request.orderType === 'RENTAL' ? request.product.rentPrice : request.product.buyPrice;
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

        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="build" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all' && typeFilter === 'all' ? 'No Installation Requests Found' : 'No matching requests'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all' && typeFilter === 'all'
                ? 'Installation requests will appear here'
                : 'Try adjusting your filters'
              }
            </Text>
          </View>
        ) : (
          requests.map((request) => {
            const statusColors = getStatusColor(request.status);

            return (
              <TouchableOpacity
                key={request.id}
                style={styles.requestCard}
                onPress={() => {
               
                  router.push(`/orders/${request.id}`);
                }}
                activeOpacity={0.7}
              >
                {/* Request Header */}
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <View style={styles.requestTitleRow}>
                      <Text style={styles.requestId}>#{request.id.slice(-6).toUpperCase()}</Text>
                      <View style={[styles.orderTypeBadge, {
                        backgroundColor: request.orderType === 'RENTAL' ? '#ECFDF5' : '#FFFBEB'
                      }]}>
                        <Text style={[styles.orderTypeText, {
                          color: request.orderType === 'RENTAL' ? '#047857' : '#92400E'
                        }]}>
                          {request.orderType}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.productName} numberOfLines={1}>{request.product.name}</Text>
                    <Text style={styles.customerInfo} numberOfLines={1}>
                      <Ionicons name="person" size={12} color="#6B7280" />
                      {' '}{request.customer.name || request.name}
                    </Text>
                    <Text style={styles.franchiseInfo} numberOfLines={1}>
                      <Ionicons name="business" size={12} color="#6B7280" />
                      {' '}{request.franchise.name} - {request.franchise.city}
                    </Text>
                  </View>
                  <View style={styles.requestAmount}>
                    <Text style={styles.amountText}>{formatCurrency(getPriceForOrderType(request))}</Text>
                    <Text style={styles.requestDate}>{formatDate(request.createdAt)}</Text>
                    {request.product.deposit > 0 && (
                      <Text style={styles.depositText}>
                        Deposit: {formatCurrency(request.product.deposit)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Request Status */}
                <View style={styles.statusContainer}>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
                      <Text style={[styles.statusText, { color: statusColors.text }]}>
                        {getStatusDisplayText(request.status)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Additional Info */}
                <View style={styles.additionalInfo}>
                  <View style={styles.addressInfo}>
                    <Ionicons name="location" size={14} color="#6B7280" />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {request.installationAddress}
                    </Text>
                  </View>
                  
                  {request.assignedTechnician && (
                    <View style={styles.technicianInfo}>
                      <Ionicons name="person-circle" size={14} color="#6B7280" />
                      <Text style={styles.technicianText}>
                        Technician: {request.assignedTechnician.name}
                      </Text>
                    </View>
                  )}
                  
                  {request.scheduledDate && (
                    <View style={styles.scheduledInfo}>
                      <Ionicons name="calendar" size={14} color="#6B7280" />
                      <Text style={styles.scheduledText}>
                        Scheduled: {formatDate(request.scheduledDate)}
                      </Text>
                    </View>
                  )}

                  {request.rejectionReason && (
                    <View style={styles.rejectionInfo}>
                      <Ionicons name="warning" size={14} color="#EF4444" />
                      <Text style={styles.rejectionText} numberOfLines={2}>
                        Rejected: {request.rejectionReason}
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

export default InstallationRequestsScreen;

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
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestId: {
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
    marginBottom: 2,
  },
  franchiseInfo: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  requestAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  depositText: {
    fontSize: 10,
    fontFamily: 'Outfit_400Regular',
    color: '#F59E0B',
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
  },
  additionalInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    gap: 8,
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  technicianText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginLeft: 6,
  },
  scheduledInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduledText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginLeft: 6,
  },
  rejectionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rejectionText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#EF4444',
    marginLeft: 6,
    flex: 1,
  },
  actionIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
});