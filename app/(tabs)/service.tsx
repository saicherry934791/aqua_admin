// screens/ServiceRequestsScreen.tsx
import { apiService } from '@/lib/api/api';
import FranchiseSkeleton from '@/lib/components/skeltons/FranchisesSkelton';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterType = 'all' | 'created' | 'assigned' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
type ServiceTypeFilter = 'all' | 'installation' | 'maintenance' | 'repair' | 'replacement';

interface ServiceRequest {
    id: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    productId: string;
    productName: string;
    orderId?: string;
    type: 'INSTALLATION' | 'MAINTENANCE' | 'REPAIR' | 'REPLACEMENT';
    description: string;
    status: 'CREATED' | 'ASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    assignedToId?: string;
    assignedToName?: string;
    franchiseAreaId: string;
    franchiseAreaName: string;
    scheduledDate?: string;
    completedDate?: string;
    createdAt: string;
    updatedAt: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

const ServiceRequestsScreen = () => {
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [typeFilter, setTypeFilter] = useState<ServiceTypeFilter>('all');

    const fetchServiceRequests = async () => {
        setLoading(true);
        try {
            const result = await apiService.get('/service-requests');

            console.log('service requests are ',JSON.stringify(result.data?.serviceRequests))
            const data = result?.data?.serviceRequests || [];
            if (!data || data.length === 0) {
                setServiceRequests([]);
            } else {
                setServiceRequests(data);
            }
        } catch (error) {
            console.log('Failed to fetch service requests:', error);
        }
        setLoading(false);
        setRefreshing(false);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchServiceRequests();
    };

    const handleCreateServiceRequest = () => {
        router.push('/service-requests/create');
    };

    useEffect(() => {
        fetchServiceRequests();
    }, []);

    // Calculate statistics
    const createdRequests = serviceRequests.filter(sr => sr.status === 'CREATED').length;
    const assignedRequests = serviceRequests.filter(sr => sr.status === 'ASSIGNED').length;
    const scheduledRequests = serviceRequests.filter(sr => sr.status === 'SCHEDULED').length;
    const inProgressRequests = serviceRequests.filter(sr => sr.status === 'IN_PROGRESS').length;
    const completedRequests = serviceRequests.filter(sr => sr.status === 'COMPLETED').length;
    const cancelledRequests = serviceRequests.filter(sr => sr.status === 'CANCELLED').length;

    // Filter service requests based on active filters
    const filteredRequests = serviceRequests.filter(request => {
        const statusMatch = activeFilter === 'all' || request.status.toLowerCase() === activeFilter;
        const typeMatch = typeFilter === 'all' || request.type.toLowerCase() === typeFilter;
        return statusMatch && typeMatch;
    });

    // Status filter buttons
    const statusFilters = [
        { key: 'all', icon: 'list', label: 'All', value: serviceRequests.length, color: '#3B82F6', bgColor: '#EEF2FF' },
        { key: 'created', icon: 'add-circle', label: 'Created', value: createdRequests, color: '#6B7280', bgColor: '#F9FAFB' },
        { key: 'assigned', icon: 'person-add', label: 'Assigned', value: assignedRequests, color: '#8B5CF6', bgColor: '#F3E8FF' },
        { key: 'scheduled', icon: 'calendar', label: 'Scheduled', value: scheduledRequests, color: '#10B981', bgColor: '#ECFDF5' },
        { key: 'in_progress', icon: 'time', label: 'In Progress', value: inProgressRequests, color: '#F59E0B', bgColor: '#FFFBEB' },
        { key: 'completed', icon: 'checkmark-done', label: 'Completed', value: completedRequests, color: '#059669', bgColor: '#D1FAE5' },
        { key: 'cancelled', icon: 'close-circle', label: 'Cancelled', value: cancelledRequests, color: '#EF4444', bgColor: '#FEF2F2' },
    ];

    // Type filter buttons
    const typeFilters = [
        { key: 'all', label: 'All Types', color: '#3B82F6' },
        { key: 'installation', label: 'Installation', color: '#10B981' },
        { key: 'maintenance', label: 'Maintenance', color: '#F59E0B' },
        { key: 'repair', label: 'Repair', color: '#EF4444' },
        { key: 'replacement', label: 'Replacement', color: '#8B5CF6' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CREATED': return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
            case 'ASSIGNED': return { bg: '#F3E8FF', text: '#6B21A8', dot: '#8B5CF6' };
            case 'SCHEDULED': return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
            case 'IN_PROGRESS': return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' };
            case 'COMPLETED': return { bg: '#D1FAE5', text: '#047857', dot: '#059669' };
            case 'CANCELLED': return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
            default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'LOW': return { bg: '#F0F9FF', text: '#0369A1', border: '#7DD3FC' };
            case 'MEDIUM': return { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' };
            case 'HIGH': return { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' };
            case 'URGENT': return { bg: '#7F1D1D', text: '#FFFFFF', border: '#DC2626' };
            default: return { bg: '#F9FAFB', text: '#6B7280', border: '#D1D5DB' };
        }
    };

    const getServiceTypeIcon = (type: string) => {
        switch (type) {
            case 'INSTALLATION': return 'construct';
            case 'MAINTENANCE': return 'settings';
            case 'REPAIR': return 'build';
            case 'REPLACEMENT': return 'swap-horizontal';
            default: return 'cog';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateOnly = (dateString: string) => {
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
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.typeFilterScrollView}
                    contentContainerStyle={styles.typeFilterContainer}
                >
                    {typeFilters.map((filter) => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[
                                styles.typeFilterButton,
                                typeFilter === filter.key && [styles.activeTypeFilter, { borderColor: filter.color }]
                            ]}
                            onPress={() => setTypeFilter(filter.key as ServiceTypeFilter)}
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
                </ScrollView>

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

                {filteredRequests.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="support-agent" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>
                            {activeFilter === 'all' && typeFilter === 'all' ? 'No Service Requests Found' : 'No matching requests'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeFilter === 'all' && typeFilter === 'all'
                                ? 'Create your first service request to get started'
                                : 'Try adjusting your filters'
                            }
                        </Text>
                    </View>
                ) : (
                    filteredRequests.map((request) => {
                        const statusColors = getStatusColor(request.status);
                        const priorityColors = getPriorityColor(request.priority);

                        return (
                            <TouchableOpacity
                                key={request.id}
                                style={styles.requestCard}
                                onPress={() => router.push(`/services/${request.id}`)}
                                activeOpacity={0.7}
                            >
                                {/* Request Header */}
                                <View style={styles.requestHeader}>
                                    <View style={styles.requestInfo}>
                                        <View style={styles.requestTitleRow}>
                                            <View style={styles.serviceTypeIcon}>
                                                <Ionicons
                                                    name={getServiceTypeIcon(request.type) as any}
                                                    size={16}
                                                    color="#3B82F6"
                                                />
                                            </View>
                                            <Text style={styles.requestId}>#{request.id.slice(-6).toUpperCase()}</Text>
                                            {request.priority && (
                                                <View style={[styles.priorityBadge, {
                                                    backgroundColor: priorityColors.bg,
                                                    borderColor: priorityColors.border
                                                }]}>
                                                    <Text style={[styles.priorityText, { color: priorityColors.text }]}>
                                                        {request.priority}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.serviceType}>{request.type}</Text>
                                        <Text style={styles.productName} numberOfLines={1}>{request.productName}</Text>
                                    </View>
                                    <View style={styles.requestDate}>
                                        <Text style={styles.dateText}>{formatDateOnly(request.createdAt)}</Text>
                                    </View>
                                </View>

                                {/* Customer Info */}
                                <View style={styles.customerSection}>
                                    <View style={styles.customerRow}>
                                        <Ionicons name="person" size={12} color="#6B7280" />
                                        <Text style={styles.customerName}>{request.customer.name}</Text>
                                    </View>
                                    <View style={styles.customerRow}>
                                        <Ionicons name="call" size={12} color="#6B7280" />
                                        <Text style={styles.customerPhone}>{request.customer.phone}</Text>
                                    </View>
                                    <View style={styles.customerRow}>
                                        <Ionicons name="location" size={12} color="#6B7280" />
                                        <Text style={styles.customerAddress} numberOfLines={1}>{request.customer.address}</Text>
                                    </View>
                                </View>

                                {/* Description */}
                                <View style={styles.descriptionSection}>
                                    <Text style={styles.descriptionText} numberOfLines={2}>
                                        {request.description}
                                    </Text>
                                </View>

                                {/* Status and Assignment */}
                                <View style={styles.statusSection}>
                                    <View style={styles.statusRow}>
                                        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                                            <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
                                            <Text style={[styles.statusText, { color: statusColors.text }]}>
                                                {request.status.replace('_', ' ')}
                                            </Text>
                                        </View>
                                        <Text style={styles.franchiseArea}>{request.franchiseAreaName}</Text>
                                    </View>
                                </View>

                                {/* Additional Info */}
                                <View style={styles.additionalInfo}>
                                    {request.assignedToName && (
                                        <View style={styles.assigneeInfo}>
                                            <Ionicons name="person-circle" size={14} color="#6B7280" />
                                            <Text style={styles.assigneeText}>Assigned to: {request.assignedToName}</Text>
                                        </View>
                                    )}
                                    {request.scheduledDate && (
                                        <View style={styles.scheduleInfo}>
                                            <Ionicons name="calendar" size={14} color="#6B7280" />
                                            <Text style={styles.scheduleText}>
                                                Scheduled: {formatDate(request.scheduledDate)}
                                            </Text>
                                        </View>
                                    )}
                                    {request.completedDate && (
                                        <View style={styles.completedInfo}>
                                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                            <Text style={styles.completedText}>
                                                Completed: {formatDate(request.completedDate)}
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

export default ServiceRequestsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    typeFilterScrollView: {
        marginTop: 16,
        marginBottom: 16,
    },
    typeFilterContainer: {
        paddingHorizontal: 0,
        gap: 12,
    },
    typeFilterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activeTypeFilter: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        transform: [{ scale: 1.02 }],
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
    serviceTypeIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    requestId: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
        marginRight: 8,
    },
    priorityBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    priorityText: {
        fontSize: 9,
        fontFamily: 'Outfit_600SemiBold',
    },
    serviceType: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#8B5CF6',
        marginBottom: 4,
        textTransform: 'capitalize',
    },
    productName: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#374151',
    },
    requestDate: {
        alignItems: 'flex-end',
    },
    dateText: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    customerSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    customerName: {
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        color: '#374151',
        marginLeft: 6,
    },
    customerPhone: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginLeft: 6,
    },
    customerAddress: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginLeft: 6,
        flex: 1,
    },
    descriptionSection: {
        marginBottom: 16,
    },
    descriptionText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#4B5563',
        lineHeight: 20,
    },
    statusSection: {
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
    franchiseArea: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    additionalInfo: {
        gap: 8,
    },
    assigneeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    assigneeText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginLeft: 6,
    },
    scheduleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scheduleText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginLeft: 6,
    },
    completedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    completedText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#059669',
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
    }
})