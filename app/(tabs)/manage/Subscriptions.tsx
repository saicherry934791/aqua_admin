import { apiService } from '@/lib/api/api';
import FranchiseSkeleton from '@/lib/components/skeltons/FranchisesSkelton';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActionSheetIOS, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';

type FilterType = 'all' | 'active' | 'pending' | 'expired' | 'recent';

interface Subscription {
    id: string;
    connectId: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerCity: string;
    productId: string;
    productName: string;
    productImages: string[];
    franchiseId: string;
    franchiseName: string;
    planName: string;
    status: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED';
    startDate: string;
    endDate: string | null;
    currentPeriodStartDate: string;
    currentPeriodEndDate: string;
    nextPaymentDate: string;
    monthlyAmount: number;
    depositAmount: number;
    installationAddress: string;
    installationStatus: string;
    autoPaymentEnabled: boolean;
    createdAt: string;
}

const SubscriptionsScreen = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const { user } = useAuth();
    const params = useLocalSearchParams();

    // Track if we need to refresh data
    const [shouldRefresh, setShouldRefresh] = useState(false);

    // Handle refresh when returning from forms
    useEffect(() => {
        if (params.refreshData) {
            try {
                const parsedData = JSON.parse(params.refreshData as string);
                if (parsedData.type === 'update') {
                    setSubscriptions(prev => 
                        prev.map(sub => 
                            sub.id === parsedData.data.id ? parsedData.data : sub
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
            if (shouldRefresh) {
                fetchSubscriptions();
                setShouldRefresh(false);
            }
        }, [shouldRefresh])
    );

    const fetchSubscriptions = async () => {
        try {
            setLoading(true);
            const result = await apiService.get('/subscriptions');
            console.log('subscriptions response:', result);
            
            if (result.success && result.data?.subscriptions) {
                const mapped: Subscription[] = result.data.subscriptions.map((item: any) => ({
                    id: item.id,
                    connectId: item.connectId,
                    customerId: item.customerId,
                    customerName: item.customer?.name || 'Unknown Customer',
                    customerPhone: item.customer?.phone || 'N/A',
                    customerCity: item.customer?.city || 'N/A',
                    productId: item.productId,
                    productName: item.product?.name || 'Unknown Product',
                    productImages: item.product?.images || [],
                    franchiseId: item.franchiseId,
                    franchiseName: item.franchise?.name || 'Unknown Franchise',
                    planName: item.planName,
                    status: item.status,
                    startDate: item.startDate,
                    endDate: item.endDate,
                    currentPeriodStartDate: item.currentPeriodStartDate,
                    currentPeriodEndDate: item.currentPeriodEndDate,
                    nextPaymentDate: item.nextPaymentDate,
                    monthlyAmount: item.monthlyAmount,
                    depositAmount: item.depositAmount,
                    installationAddress: item.installationRequest?.installationAddress || 'N/A',
                    installationStatus: item.installationRequest?.status || 'UNKNOWN',
                    autoPaymentEnabled: item.installationRequest?.autoPaymentEnabled || false,
                    createdAt: item.createdAt
                }));
                console.log('mapped subscriptions:', mapped);
                setSubscriptions(mapped);
            } else {
                setSubscriptions([]);
            }
        } catch (err) {
            console.log('Failed to fetch subscriptions:', err);
            setSubscriptions([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchSubscriptions();
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    // Calculate statistics
    const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE').length;
    const pendingSubscriptions = subscriptions.filter(s => s.status === 'PENDING').length;
    const expiredSubscriptions = subscriptions.filter(s => s.status === 'EXPIRED' || s.status === 'CANCELLED').length;
    const recentSubscriptions = subscriptions.filter(s => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        try {
            return s.createdAt && new Date(s.createdAt) > oneMonthAgo;
        } catch {
            return false;
        }
    }).length;

    // Filter subscriptions based on active filter
    const filteredSubscriptions = subscriptions.filter(subscription => {
        switch (activeFilter) {
            case 'active':
                return subscription.status === 'ACTIVE';
            case 'pending':
                return subscription.status === 'PENDING';
            case 'expired':
                return subscription.status === 'EXPIRED' || subscription.status === 'CANCELLED';
            case 'recent':
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                try {
                    return subscription.createdAt && new Date(subscription.createdAt) > oneMonthAgo;
                } catch {
                    return false;
                }
            default:
                return true;
        }
    });

    // Filter buttons data
    const filterButtons = [
        { key: 'all', icon: 'albums', label: 'All', value: subscriptions.length, color: '#3B82F6', bgColor: '#EEF2FF' },
        { key: 'active', icon: 'checkmark-circle', label: 'Active', value: activeSubscriptions, color: '#10B981', bgColor: '#ECFDF5' },
        { key: 'pending', icon: 'time', label: 'Pending', value: pendingSubscriptions, color: '#F59E0B', bgColor: '#FFFBEB' },
        { key: 'expired', icon: 'close-circle', label: 'Expired', value: expiredSubscriptions, color: '#EF4444', bgColor: '#FEF2F2' },
        { key: 'recent', icon: 'trending-up', label: 'Recent', value: recentSubscriptions, color: '#8B5CF6', bgColor: '#F3E8FF' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return { color: '#047857', bgColor: '#ECFDF5', dotColor: '#10B981' };
            case 'PENDING':
                return { color: '#D97706', bgColor: '#FFFBEB', dotColor: '#F59E0B' };
            case 'EXPIRED':
            case 'CANCELLED':
                return { color: '#DC2626', bgColor: '#FEF2F2', dotColor: '#EF4444' };
            default:
                return { color: '#6B7280', bgColor: '#F9FAFB', dotColor: '#9CA3AF' };
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString()}`;
    };

    const showActionSheet = (subscription: Subscription) => {
        const options = [
            'View Details',
            'View Customer',
            'View Product',
            subscription.status === 'ACTIVE' ? 'Suspend' : 'Reactivate',
            'Cancel'
        ];

        const cancelIndex = options.length - 1;
        const destructiveIndex = subscription.status === 'ACTIVE' ? options.length - 2 : undefined;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: cancelIndex,
                    destructiveButtonIndex: destructiveIndex,
                    title: `Manage ${subscription.planName}`,
                    message: `Customer: ${subscription.customerName}`
                },
                (buttonIndex) => {
                    if (buttonIndex !== cancelIndex) {
                        handleActionSheetResponse(subscription, buttonIndex);
                    }
                }
            );
        } else {
            const alertOptions = [
                { text: 'View Details', onPress: () => handleActionSheetResponse(subscription, 0) },
                { text: 'View Customer', onPress: () => handleActionSheetResponse(subscription, 1) },
                { text: 'View Product', onPress: () => handleActionSheetResponse(subscription, 2) },
                {
                    text: subscription.status === 'ACTIVE' ? 'Suspend' : 'Reactivate',
                    style: subscription.status === 'ACTIVE' ? 'destructive' : 'default',
                    onPress: () => handleActionSheetResponse(subscription, 3)
                },
                { text: 'Cancel', style: 'cancel' }
            ];

            Alert.alert(
                `Manage ${subscription.planName}`,
                `Customer: ${subscription.customerName}`,
                alertOptions,
                { cancelable: true }
            );
        }
    };

    const handleActionSheetResponse = (subscription: Subscription, buttonIndex: number) => {
        switch (buttonIndex) {
            case 0:
                router.push(`/subscriptions/${subscription.id}`);
                break;
            case 1:
                router.push(`/customers/${subscription.customerId}`);
                break;
            case 2:
                router.push(`/products/${subscription.productId}`);
                break;
            case 3:
                // Handle suspend/reactivate
                updateSubscriptionStatus(subscription.id, subscription.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                break;
        }
    };

    const updateSubscriptionStatus = async (subscriptionId: string, status: string) => {
        // Implementation for updating subscription status
        try {
            const result = await apiService.put(`/subscriptions/${subscriptionId}/status`, { status });
            if (result.success) {
                Alert.alert('Success', 'Subscription status updated successfully');
                fetchSubscriptions();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update subscription status');
        }
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

                {filteredSubscriptions.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="subscriptions" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>
                            {activeFilter === 'all' ? 'No Subscriptions Found' : `No ${activeFilter} subscriptions`}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeFilter === 'all'
                                ? 'Subscriptions will appear here once customers start renting'
                                : `Try selecting a different filter`
                            }
                        </Text>
                    </View>
                ) : (
                    filteredSubscriptions.map((item) => {
                        const statusColors = getStatusColor(item.status);
                        return (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.subscriptionCard}
                                onPress={() => showActionSheet(item)}
                                activeOpacity={0.7}
                            >
                                {/* Subscription Header */}
                                <View style={styles.subscriptionHeader}>
                                    <View style={styles.productInfo}>
                                        {item.productImages.length > 0 ? (
                                            <Image 
                                                source={{ uri: item.productImages[0] }} 
                                                style={styles.productImage}
                                             
                                            />
                                        ) : (
                                            <View style={styles.productImagePlaceholder}>
                                                <MaterialIcons name="inventory" size={24} color="#9CA3AF" />
                                            </View>
                                        )}
                                        <View style={styles.productDetails}>
                                            <Text style={styles.productName} numberOfLines={1}>
                                                {item.productName}
                                            </Text>
                                            <Text style={styles.planName} numberOfLines={1}>
                                                {item.planName}
                                            </Text>
                                            <Text style={styles.connectId}>
                                                ID: {item.connectId}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.statusAndAmount}>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: statusColors.bgColor }
                                            ]}
                                        >
                                            <View style={[
                                                styles.statusDot,
                                                { backgroundColor: statusColors.dotColor }
                                            ]} />
                                            <Text style={[
                                                styles.statusText,
                                                { color: statusColors.color }
                                            ]}>
                                                {item.status}
                                            </Text>
                                        </View>
                                        <Text style={styles.monthlyAmount}>
                                            {formatCurrency(item.monthlyAmount)}/mo
                                        </Text>
                                    </View>
                                </View>

                                {/* Customer Info */}
                                <View style={styles.customerSection}>
                                    <View style={styles.customerInfo}>
                                        <Ionicons name="person" size={14} color="#6B7280" />
                                        <Text style={styles.customerName}>{item.customerName}</Text>
                                        <Ionicons name="call" size={12} color="#6B7280" style={{ marginLeft: 8 }} />
                                        <Text style={styles.customerPhone}>{item.customerPhone}</Text>
                                    </View>
                                    <View style={styles.locationInfo}>
                                        <Ionicons name="location" size={14} color="#6B7280" />
                                        <Text style={styles.locationText} numberOfLines={1}>
                                            {item.customerCity}
                                        </Text>
                                    </View>
                                </View>

                                {/* Subscription Details */}
                                <View style={styles.subscriptionDetails}>
                                    <View style={styles.franchiseRow}>
                                        <Ionicons name="business" size={14} color="#6B7280" />
                                        <Text style={styles.franchiseText}>{item.franchiseName}</Text>
                                        {item.autoPaymentEnabled && (
                                            <View style={styles.autoPayBadge}>
                                                <Ionicons name="card" size={12} color="#10B981" />
                                                <Text style={styles.autoPayText}>Auto Pay</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.datesRow}>
                                        <View style={styles.dateBox}>
                                            <Text style={styles.dateLabel}>Started</Text>
                                            <Text style={styles.dateValue}>
                                                {formatDate(item.startDate)}
                                            </Text>
                                        </View>
                                        <View style={styles.dateBox}>
                                            <Text style={styles.dateLabel}>Current Period</Text>
                                            <Text style={styles.dateValue}>
                                                {formatDate(item.currentPeriodEndDate)}
                                            </Text>
                                        </View>
                                        <View style={styles.dateBox}>
                                            <Text style={styles.dateLabel}>Next Payment</Text>
                                            <Text style={styles.dateValue}>
                                                {formatDate(item.nextPaymentDate)}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.amountRow}>
                                        <View style={styles.amountBox}>
                                            <Text style={styles.amountLabel}>Monthly</Text>
                                            <Text style={styles.amountValue}>{formatCurrency(item.monthlyAmount)}</Text>
                                        </View>
                                        <View style={styles.amountBox}>
                                            <Text style={styles.amountLabel}>Deposit</Text>
                                            <Text style={styles.amountValue}>{formatCurrency(item.depositAmount)}</Text>
                                        </View>
                                        <View style={styles.installationStatus}>
                                            <Text style={styles.installationLabel}>Installation</Text>
                                            <Text style={[
                                                styles.installationValue,
                                                { color: item.installationStatus === 'INSTALLATION_COMPLETED' ? '#10B981' : '#F59E0B' }
                                            ]}>
                                                {item.installationStatus === 'INSTALLATION_COMPLETED' ? 'Done' : 'Pending'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity style={styles.chevronButton}>
                                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })
                )}
            </SkeletonWrapper>
        </View>
    );
};

export default SubscriptionsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
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
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    subscriptionCard: {
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
        position: 'relative',
    },
    subscriptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    productInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    productImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
    },
    productImagePlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
        marginBottom: 2,
    },
    planName: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#6B7280',
        marginBottom: 2,
    },
    connectId: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#9CA3AF',
    },
    statusAndAmount: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginBottom: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    statusText: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
    },
    monthlyAmount: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        color: '#10B981',
    },
    customerSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    customerName: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#111827',
        marginLeft: 6,
    },
    customerPhone: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginLeft: 4,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginLeft: 6,
        flex: 1,
    },
    subscriptionDetails: {
        gap: 12,
    },
    franchiseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    franchiseText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginLeft: 6,
        flex: 1,
    },
    autoPayBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    autoPayText: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        color: '#10B981',
        marginLeft: 4,
    },
    datesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateBox: {
        alignItems: 'center',
        flex: 1,
    },
    dateLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginBottom: 2,
    },
    dateValue: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#111827',
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amountBox: {
        alignItems: 'center',
        flex: 1,
    },
    amountLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginBottom: 2,
    },
    amountValue: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
    },
    installationStatus: {
        alignItems: 'center',
        flex: 1,
    },
    installationLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginBottom: 2,
    },
    installationValue: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
    },
    chevronButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
});