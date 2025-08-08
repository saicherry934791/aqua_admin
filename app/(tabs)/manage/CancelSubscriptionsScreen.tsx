import { apiService } from '@/lib/api/api';
import FranchiseSkeleton from '@/lib/components/skeltons/FranchisesSkelton';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActionSheetIOS, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CancelRequest {
    id: string;
    reason: string;
    createdAt: string;
    subscriptions: {
        id: string;
        connectId: string;
        requestId: string;
        status: string;
        franchiseId: string;
        customer: {
            id: string;
            phone: string;
            alternativePhone: string;
            city: string;
        };
        franchise: {
            id: string;
            name: string;
            city: string;
        };
    };
}

type FilterType = 'all' | 'recent' | 'older';

const CancelSubscriptionsScreen = () => {
    const [cancelRequests, setCancelRequests] = useState<CancelRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const { user } = useAuth();
    const params = useLocalSearchParams();

    const fetchAllCancelRequests = async () => {
        try {
            setLoading(true);
            const result = await apiService.get('/subscriptions/cancelRequests');
            console.log('cancelled requests:', JSON.stringify(result));
            
            if (result.success && result.data?.result) {
                setCancelRequests(result.data.result);
            } else {
                setCancelRequests([]);
            }
        } catch (error) {
            console.log('error fetching cancel requests:', error);
            setCancelRequests([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAllCancelRequests();
    };

    useEffect(() => {
        fetchAllCancelRequests();
    }, []);

    // Calculate statistics
    const recentRequests = cancelRequests.filter(request => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        try {
            return new Date(request.createdAt) > oneWeekAgo;
        } catch {
            return false;
        }
    }).length;

    const olderRequests = cancelRequests.length - recentRequests;

    // Filter requests based on active filter
    const filteredRequests = cancelRequests.filter(request => {
        switch (activeFilter) {
            case 'recent':
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                try {
                    return new Date(request.createdAt) > oneWeekAgo;
                } catch {
                    return false;
                }
            case 'older':
                const oneWeekAgo2 = new Date();
                oneWeekAgo2.setDate(oneWeekAgo2.getDate() - 7);
                try {
                    return new Date(request.createdAt) <= oneWeekAgo2;
                } catch {
                    return true;
                }
            default:
                return true;
        }
    });

    // Filter buttons data
    const filterButtons = [
        { key: 'all', icon: 'albums', label: 'All', value: cancelRequests.length, color: '#3B82F6', bgColor: '#EEF2FF' },
        { key: 'recent', icon: 'time', label: 'Recent', value: recentRequests, color: '#F59E0B', bgColor: '#FFFBEB' },
        { key: 'older', icon: 'archive', label: 'Older', value: olderRequests, color: '#6B7280', bgColor: '#F9FAFB' },
    ];

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const getTimeAgo = (dateString: string) => {
        try {
            const now = new Date();
            const date = new Date(dateString);
            const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
            
            if (diffInHours < 1) {
                return 'Just now';
            } else if (diffInHours < 24) {
                return `${diffInHours}h ago`;
            } else {
                const diffInDays = Math.floor(diffInHours / 24);
                return `${diffInDays}d ago`;
            }
        } catch {
            return 'Unknown';
        }
    };

    const showActionSheet = (request: CancelRequest) => {
        const options = [
            'View Subscription Details',
            'View Customer',
            'View Franchise',
            'Contact Customer',
            'Cancel'
        ];

        const cancelIndex = options.length - 1;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: cancelIndex,
                    title: `Cancel Request #${request.id.slice(-8)}`,
                    message: `Subscription: ${request.subscriptions.connectId}`
                },
                (buttonIndex) => {
                    if (buttonIndex !== cancelIndex) {
                        handleActionSheetResponse(request, buttonIndex);
                    }
                }
            );
        } else {
            const alertOptions = [
                { text: 'View Subscription Details', onPress: () => handleActionSheetResponse(request, 0) },
                { text: 'View Customer', onPress: () => handleActionSheetResponse(request, 1) },
                { text: 'View Franchise', onPress: () => handleActionSheetResponse(request, 2) },
                { text: 'Contact Customer', onPress: () => handleActionSheetResponse(request, 3) },
                { text: 'Cancel', style: 'cancel' }
            ];

            Alert.alert(
                `Cancel Request #${request.id.slice(-8)}`,
                `Subscription: ${request.subscriptions.connectId}`,
                alertOptions,
                { cancelable: true }
            );
        }
    };

    const handleActionSheetResponse = (request: CancelRequest, buttonIndex: number) => {
        switch (buttonIndex) {
            case 0:
                router.push(`/subscriptions/${request.subscriptions.id}`);
                break;
            case 1:
                router.push(`/customers/${request.subscriptions.customer.id}`);
                break;
            case 2:
                router.push(`/franchises/${request.subscriptions.franchiseId}`);
                break;
            case 3:
                // Handle contact customer - you can implement phone call or messaging
                Alert.alert(
                    'Contact Customer',
                    `Phone: ${request.subscriptions.customer.phone}\nAlternative: ${request.subscriptions.customer.alternativePhone}`,
                    [
                        { text: 'Call Primary', onPress: () => console.log('Call:', request.subscriptions.customer.phone) },
                        { text: 'Call Alternative', onPress: () => console.log('Call:', request.subscriptions.customer.alternativePhone) },
                        { text: 'Cancel', style: 'cancel' }
                    ]
                );
                break;
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

                {filteredRequests.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="cancel" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>
                            {activeFilter === 'all' ? 'No Cancel Requests Found' : `No ${activeFilter} cancel requests`}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeFilter === 'all'
                                ? 'Cancel requests will appear here when customers request cancellations'
                                : `Try selecting a different filter`
                            }
                        </Text>
                    </View>
                ) : (
                    filteredRequests.map((request) => (
                        <TouchableOpacity
                            key={request.id}
                            style={styles.requestCard}
                            onPress={() => showActionSheet(request)}
                            activeOpacity={0.7}
                        >
                            {/* Request Header */}
                            <View style={styles.requestHeader}>
                                <View style={styles.requestInfo}>
                                    <View style={styles.cancelIcon}>
                                        <MaterialIcons name="cancel" size={24} color="#EF4444" />
                                    </View>
                                    <View style={styles.requestDetails}>
                                        <Text style={styles.requestId}>
                                            Cancel Request #{request.id.slice(-8).toUpperCase()}
                                        </Text>
                                        <Text style={styles.subscriptionId}>
                                            Subscription: {request.subscriptions.connectId}
                                        </Text>
                                        <Text style={styles.requestTime}>
                                            {getTimeAgo(request.createdAt)}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.statusBadge}>
                                    <View style={styles.statusDot} />
                                    <Text style={styles.statusText}>{request.subscriptions.status ==='ACTIVE'?'PENDING':'CLOSED'}</Text>
                                </View>
                            </View>

                            {/* Customer Info */}
                            <View style={styles.customerSection}>
                                <View style={styles.customerInfo}>
                                    <Ionicons name="person" size={14} color="#6B7280" />
                                    <Text style={styles.customerPhone}>{request.subscriptions.customer.phone}</Text>
                                    {request.subscriptions.customer.alternativePhone && (
                                        <>
                                            <Ionicons name="call" size={12} color="#6B7280" style={{ marginLeft: 8 }} />
                                            <Text style={styles.alternativePhone}>
                                                {request.subscriptions.customer.alternativePhone}
                                            </Text>
                                        </>
                                    )}
                                </View>
                                <View style={styles.locationInfo}>
                                    <Ionicons name="location" size={14} color="#6B7280" />
                                    <Text style={styles.locationText}>
                                        {request.subscriptions.customer.city}
                                    </Text>
                                </View>
                            </View>

                            {/* Franchise Info */}
                            <View style={styles.franchiseSection}>
                                <View style={styles.franchiseInfo}>
                                    <Ionicons name="business" size={14} color="#6B7280" />
                                    <Text style={styles.franchiseName}>{request.subscriptions.franchise.name}</Text>
                                </View>
                                <View style={styles.franchiseLocation}>
                                    <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                                    <Text style={styles.franchiseCity}>{request.subscriptions.franchise.city}</Text>
                                </View>
                            </View>

                            {/* Cancel Reason */}
                            <View style={styles.reasonSection}>
                                <Text style={styles.reasonLabel}>Cancellation Reason:</Text>
                                <Text style={styles.reasonText} numberOfLines={3}>
                                    {request.reason.trim() || 'No reason provided'}
                                </Text>
                            </View>

                            {/* Request Details */}
                            <View style={styles.detailsSection}>
                                <View style={styles.detailRow}>
                                    <View style={styles.detailBox}>
                                        <Text style={styles.detailLabel}>Request Date</Text>
                                        <Text style={styles.detailValue}>{formatDate(request.createdAt)}</Text>
                                    </View>
                                    <View style={styles.detailBox}>
                                        <Text style={styles.detailLabel}>Subscription Status</Text>
                                        <Text style={[
                                            styles.detailValue,
                                            { color: request.subscriptions.status === 'ACTIVE' ? '#10B981' : '#EF4444' }
                                        ]}>
                                            {request.subscriptions.status}
                                        </Text>
                                    </View>
                                    <View style={styles.detailBox}>
                                        <Text style={styles.detailLabel}>Request ID</Text>
                                        <Text style={styles.detailValue} numberOfLines={1}>
                                            {request.subscriptions.requestId.slice(0, 8)}...
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity style={styles.chevronButton}>
                                <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                )}
            </SkeletonWrapper>
        </View>
    );
};

export default CancelSubscriptionsScreen;

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
        padding: 12,
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
        borderColor: '#FEE2E2',
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
        position: 'relative',
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    requestInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cancelIcon: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    requestDetails: {
        flex: 1,
    },
    requestId: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
        marginBottom: 2,
    },
    subscriptionId: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#6B7280',
        marginBottom: 2,
    },
    requestTime: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#9CA3AF',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: '#FFFBEB',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F59E0B',
        marginRight: 4,
    },
    statusText: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        color: '#D97706',
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
    customerPhone: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#111827',
        marginLeft: 6,
    },
    alternativePhone: {
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
    franchiseSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    franchiseInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    franchiseName: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#111827',
        marginLeft: 6,
    },
    franchiseLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 20,
    },
    franchiseCity: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#9CA3AF',
        marginLeft: 4,
    },
    reasonSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    reasonLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#6B7280',
        marginBottom: 6,
    },
    reasonText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#111827',
        lineHeight: 20,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
    },
    detailsSection: {
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailBox: {
        alignItems: 'center',
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginBottom: 4,
        textAlign: 'center',
    },
    detailValue: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#111827',
        textAlign: 'center',
    },
    chevronButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
});