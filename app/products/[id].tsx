import { apiService } from '@/lib/api/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Image, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface ProductData {
    id: string;
    name: string;
    description: string;
    images: string[];
    rentPrice: number;
    buyPrice: number;
    deposit: number;
    isRentable: boolean;
    isPurchasable: boolean;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    categoryId: string;
}

interface Statistics {
    totalInstallationRequests: number;
    totalSubscriptions: number;
    totalServiceRequests: number;
    totalPayments: number;
    activeSubscriptions: number;
    completedInstallations: number;
    pendingInstallations: number;
    totalRevenue: number;
}

interface InstallationRequest {
    id: string;
    name: string;
    customerId: string;
    customerName: string;
    orderType: string;
    status: string;
    franchiseName: string;
    franchiseId: string;
    connectId: string | null;
    scheduledDate: string | null;
    completedDate: string | null;
    createdAt: string;
    updatedAt: string;
    payAmount: number;
    razorpayPaymentLink: string | null;
}

interface Subscription {
    id: string;
    connectId: string;
    customerId: string;
    customerName: string;
    franchiseId: string;
    franchiseName: string;
    planName: string;
    status: string;
    startDate: string;
    endDate: string | null;
    currentPeriodStartDate: string;
    currentPeriodEndDate: string;
    nextPaymentDate: string;
    monthlyAmount: number;
    depositAmount: number;
    createdAt: string;
    updatedAt: string;
}

interface ServiceRequest {
    id: string;
    type: string;
    description: string;
    status: string;
    customerId: string;
    customerName: string;
    franchiseId: string;
    franchiseName: string;
    assignedToId: string;
    assignedToName: string;
    scheduledDate: string | null;
    completedDate: string | null;
    requirePayment: boolean;
    createdAt: string;
    updatedAt: string;
}

interface Payment {
    id: string;
    amount: number;
    type: string;
    status: string;
    paymentMethod: string;
    razorpayPaymentId: string | null;
    createdAt: string;
}

interface RecentActivity {
    type: string;
    id: string;
    description: string;
    timestamp: string;
    status: string;
}

interface ProductDetailsResponse {
    product: ProductData;
    statistics: Statistics;
    installationRequests: InstallationRequest[];
    subscriptions: Subscription[];
    serviceRequests: ServiceRequest[];
    payments: Payment[];
    recentActivity: RecentActivity[];
}

const ProductDetails = () => {
    const { id } = useLocalSearchParams();
    const navigation = useNavigation();
    const [productData, setProductData] = useState<ProductDetailsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Product Details',
            headerTitleStyle: { fontFamily: 'Outfit_600SemiBold' },
        });
    }, [navigation]);

    const fetchProductData = async () => {
        try {
            setLoading(true);
            const result = await apiService.get(`/products/${id}/admin-details`);

            if (result.success) {
                setProductData(result.data);
            } else {
                Alert.alert('Error', 'Failed to fetch product details');
            }
        } catch (error) {
            console.error('Failed to fetch product details:', error);
            Alert.alert('Error', 'Failed to fetch product details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProductData();
    };

    const openPaymentLink = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Cannot open payment link. URL not supported.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open payment link.');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'COMPLETED':
            case 'INSTALLATION_COMPLETED':
                return '#10B981';
            case 'PENDING':
            case 'SUBMITTED':
            case 'SCHEDULED':
            case 'INSTALLATION_SCHEDULED':
                return '#F59E0B';
            case 'IN_PROGRESS':
                return '#3B82F6';
            case 'PAUSED':
                return '#6B7280';
            case 'CANCELLED':
            case 'FAILED':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const getStatusBackground = (status: string) => {
        const color = getStatusColor(status);
        return color + '20'; // 20% opacity
    };

    useEffect(() => {
        if (id) {
            fetchProductData();
        }
    }, [id]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading product details...</Text>
            </View>
        );
    }

    if (!productData) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load product details</Text>
                <TouchableOpacity style={styles.retryButton} onPress={fetchProductData}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { product, statistics, installationRequests, subscriptions, serviceRequests, payments, recentActivity } = productData;

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <TouchableWithoutFeedback>
                <View>
                    {/* Product Header */}
                    <View style={styles.headerContainer}>
                        <View style={styles.productImages}>
                            {product.images && product.images.length > 0 ? (
                                <>
                                    <Image
                                        source={{ uri: product.images[selectedImageIndex] }}
                                        style={styles.mainImage}
                                        resizeMode="cover"
                                    />
                                    {product.images.length > 1 && (
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            style={styles.imageThumbnails}
                                        >
                                            {product.images.map((image, index) => (
                                                <TouchableOpacity
                                                    key={index}
                                                    onPress={() => setSelectedImageIndex(index)}
                                                    style={[
                                                        styles.thumbnail,
                                                        selectedImageIndex === index && styles.selectedThumbnail
                                                    ]}
                                                >
                                                    <Image source={{ uri: image }} style={styles.thumbnailImage} />
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </>
                            ) : (
                                <View style={styles.noImageContainer}>
                                    <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                                    <Text style={styles.noImageText}>No images available</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.productInfo}>
                            <View style={styles.statusContainer}>
                                <View style={[
                                    styles.statusIndicator,
                                    { backgroundColor: product.isActive ? '#ECFDF5' : '#FEF2F2' }
                                ]}>
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: product.isActive ? '#10B981' : '#EF4444' }
                                    ]} />
                                    <Text style={[
                                        styles.statusText,
                                        { color: product.isActive ? '#047857' : '#DC2626' }
                                    ]}>
                                        {product.isActive ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productDescription}>{product.description}</Text>

                            <View style={styles.pricingContainer}>
                                {product.isRentable && (
                                    <View style={styles.priceBox}>
                                        <Text style={styles.priceLabel}>Rent Price</Text>
                                        <Text style={styles.priceValue}>{formatCurrency(product.rentPrice)}/month</Text>
                                    </View>
                                )}
                                {product.isPurchasable && (
                                    <View style={styles.priceBox}>
                                        <Text style={styles.priceLabel}>Buy Price</Text>
                                        <Text style={styles.priceValue}>{formatCurrency(product.buyPrice)}</Text>
                                    </View>
                                )}
                             
                            </View>

                            <View style={styles.productMeta}>
                                <Text style={styles.metaText}>Created: {formatDate(product.createdAt)}</Text>
                                <Text style={styles.metaText}>Updated: {formatDate(product.updatedAt)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Statistics Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Product Statistics</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
                                    <Ionicons name="build" size={20} color="#3B82F6" />
                                </View>
                                <Text style={styles.statValue}>{statistics.totalInstallationRequests}</Text>
                                <Text style={styles.statLabel}>Installations</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
                                    <Ionicons name="card" size={20} color="#10B981" />
                                </View>
                                <Text style={styles.statValue}>{statistics.totalSubscriptions}</Text>
                                <Text style={styles.statLabel}>Subscriptions</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
                                    <Ionicons name="settings" size={20} color="#F59E0B" />
                                </View>
                                <Text style={styles.statValue}>{statistics.totalServiceRequests}</Text>
                                <Text style={styles.statLabel}>Service Requests</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={[styles.statIcon, { backgroundColor: '#F3E8FF' }]}>
                                    <Ionicons name="cash" size={20} color="#8B5CF6" />
                                </View>
                                <Text style={styles.statValue}>{formatCurrency(statistics.totalRevenue)}</Text>
                                <Text style={styles.statLabel}>Total Revenue</Text>
                            </View>
                        </View>
                    </View>

                    {/* Installation Requests Section */}
                    {installationRequests.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Installation Requests</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {installationRequests.map((request) => (
                                    <View key={request.id} style={styles.requestCard}>
                                        <View style={styles.requestHeader}>
                                            <Text style={styles.requestTitle} numberOfLines={2}>{request.name}</Text>
                                            <View style={[
                                                styles.statusBadge,
                                                { backgroundColor: getStatusBackground(request.status) }
                                            ]}>
                                                <Text style={[styles.statusBadgeText, { color: getStatusColor(request.status) }]}>
                                                    {request.status.replace(/_/g, ' ')}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.requestDetails}>
                                            <Text style={styles.requestDetail}>Customer: {request.customerName}</Text>
                                            <Text style={styles.requestDetail}>Franchise: {request.franchiseName}</Text>
                                            <Text style={styles.requestDetail}>Type: {request.orderType}</Text>
                                            <Text style={styles.requestDetail}>Amount: {formatCurrency(request.payAmount)}</Text>
                                            {request.scheduledDate && (
                                                <Text style={styles.requestDetail}>
                                                    Scheduled: {formatDateTime(request.scheduledDate)}
                                                </Text>
                                            )}
                                        </View>

                                        {request.razorpayPaymentLink && (
                                            <TouchableOpacity
                                                style={styles.paymentLinkButton}
                                                onPress={() => openPaymentLink(request.razorpayPaymentLink!)}
                                            >
                                                <Ionicons name="link" size={16} color="#3B82F6" />
                                                <Text style={styles.paymentLinkText}>Payment Link</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Subscriptions Section */}
                    {subscriptions.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Active Subscriptions</Text>
                            {subscriptions.map((subscription) => (
                                <View key={subscription.id} style={styles.subscriptionCard}>
                                    <View style={styles.subscriptionHeader}>
                                        <View style={styles.subscriptionInfo}>
                                            <Text style={styles.subscriptionPlan}>{subscription.planName}</Text>
                                            <Text style={styles.subscriptionCustomer}>{subscription.customerName}</Text>
                                        </View>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusBackground(subscription.status) }
                                        ]}>
                                            <Text style={[styles.statusBadgeText, { color: getStatusColor(subscription.status) }]}>
                                                {subscription.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.subscriptionDetails}>
                                        <Text style={styles.subscriptionDetail}>
                                            Franchise: {subscription.franchiseName}
                                        </Text>
                                        <Text style={styles.subscriptionDetail}>
                                            Monthly: {formatCurrency(subscription.monthlyAmount)}
                                        </Text>
                                        <Text style={styles.subscriptionDetail}>
                                            Deposit: {formatCurrency(subscription.depositAmount)}
                                        </Text>
                                        <Text style={styles.subscriptionDetail}>
                                            Next Payment: {formatDate(subscription.nextPaymentDate)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Service Requests Section */}
                    {serviceRequests.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Service Requests</Text>
                            {serviceRequests.map((request) => (
                                <View key={request.id} style={styles.serviceRequestCard}>
                                    <View style={styles.serviceRequestHeader}>
                                        <View style={styles.serviceTypeContainer}>
                                            <Ionicons
                                                name={request.type === 'MAINTENANCE' ? 'build' : 'settings'}
                                                size={16}
                                                color="#6B7280"
                                            />
                                            <Text style={styles.serviceType}>{request.type}</Text>
                                        </View>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusBackground(request.status) }
                                        ]}>
                                            <Text style={[styles.statusBadgeText, { color: getStatusColor(request.status) }]}>
                                                {request.status.replace(/_/g, ' ')}
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.serviceDescription}>{request.description}</Text>

                                    <View style={styles.serviceDetails}>
                                        <Text style={styles.serviceDetail}>Customer: {request.customerName}</Text>
                                        <Text style={styles.serviceDetail}>Franchise: {request.franchiseName}</Text>
                                        <Text style={styles.serviceDetail}>Assigned: {request.assignedToName}</Text>
                                        {request.scheduledDate && (
                                            <Text style={styles.serviceDetail}>
                                                Scheduled: {formatDateTime(request.scheduledDate)}
                                            </Text>
                                        )}
                                        <Text style={styles.serviceDetail}>
                                            Payment Required: {request.requirePayment ? 'Yes' : 'No'}
                                        </Text>
                                    </View>
                                </View>
                            ))}
        </View>
                    )}

                    {/* Recent Activity Section */}
                    {recentActivity.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Recent Activity</Text>
                            {recentActivity.map((activity, index) => (
                                <View key={`${activity.id}-${index}`} style={styles.activityCard}>
                                    <View style={styles.activityIcon}>
                                        <Ionicons
                                            name={
                                                activity.type === 'SERVICE_REQUEST' ? 'settings' :
                                                    activity.type === 'INSTALLATION_REQUEST' ? 'build' :
                                                        activity.type === 'SUBSCRIPTION' ? 'card' :
                                                            'notifications'
                                            }
                                            size={16}
                                            color="#6B7280"
                                        />
                                    </View>
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityDescription}>{activity.description}</Text>
                                        <Text style={styles.activityTime}>{formatDateTime(activity.timestamp)}</Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusBackground(activity.status) }
                                    ]}>
                                        <Text style={[styles.statusBadgeText, { color: getStatusColor(activity.status) }]}>
                                            {activity.status.replace(/_/g, ' ')}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Payments Section */}
                    {payments.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Recent Payments</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {payments.map((payment) => (
                                    <View key={payment.id} style={styles.paymentCard}>
                                        <View style={styles.paymentHeader}>
                                            <Text style={styles.paymentType}>{payment.type.replace(/_/g, ' ')}</Text>
                                            <View style={[
                                                styles.statusBadge,
                                                { backgroundColor: getStatusBackground(payment.status) }
                                            ]}>
                                                <Text style={[styles.statusBadgeText, { color: getStatusColor(payment.status) }]}>
                                                    {payment.status}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                                        <Text style={styles.paymentMethod}>{payment.paymentMethod.replace(/_/g, ' ')}</Text>
                                        <Text style={styles.paymentDate}>{formatDate(payment.createdAt)}</Text>

                                        {payment.razorpayPaymentId && (
                                            <Text style={styles.paymentId}>ID: {payment.razorpayPaymentId}</Text>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </TouchableWithoutFeedback>
        </ScrollView>
    );
};

export default ProductDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#EF4444',
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
    },
    headerContainer: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        marginBottom: 16,
    },
    productImages: {
        marginBottom: 20,
    },
    mainImage: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        marginBottom: 12,
    },
    imageThumbnails: {
        flexDirection: 'row',
        gap: 8,
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
    },
    selectedThumbnail: {
        borderColor: '#3B82F6',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    noImageContainer: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#9CA3AF',
        marginTop: 8,
    },
    productInfo: {
        gap: 12,
    },
    statusContainer: {
        alignSelf: 'flex-start',
    },
    statusIndicator: {
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
    productName: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        color: '#111827',
        lineHeight: 32,
    },
    productDescription: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        lineHeight: 24,
    },
    pricingContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    priceBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#6B7280',
        marginBottom: 4,
    },
    priceValue: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        color: '#111827',
    },
    productMeta: {
        marginTop: 8,
    },
    metaText: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#9CA3AF',
    },
    section: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        color: '#111827',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#6B7280',
        textAlign: 'center',
    },
    requestCard: {
        width: 280,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    requestTitle: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 10,
        fontFamily: 'Outfit_500Medium',
    },
    requestDetails: {
        gap: 4,
        marginBottom: 12,
    },
    requestDetail: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    paymentLinkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
    },
    paymentLinkText: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        color: '#3B82F6',
        marginLeft: 4,
    },
    subscriptionCard: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    subscriptionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    subscriptionInfo: {
        flex: 1,
        marginRight: 12,
    },
    subscriptionPlan: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    subscriptionCustomer: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#6B7280',
    },
    subscriptionDetails: {
        gap: 4,
    },
    subscriptionDetail: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    serviceRequestCard: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    serviceRequestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    serviceTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    serviceType: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#6B7280',
    },
    serviceDescription: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#111827',
        marginBottom: 12,
        lineHeight: 20,
    },
    serviceDetails: {
        gap: 4,
    },
    serviceDetail: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    activityIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
        marginRight: 12,
    },
    activityDescription: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#111827',
        marginBottom: 2,
    },
    activityTime: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#9CA3AF',
    },
    paymentCard: {
        width: 200,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentType: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#111827',
        flex: 1,
        marginRight: 8,
    },
    paymentAmount: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#111827',
        marginBottom: 8,
    },
    paymentMethod: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginBottom: 4,
    },
    paymentDate: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginBottom: 4,
    },
    paymentId: {
        fontSize: 10,
        fontFamily: 'monospace',
        color: '#9CA3AF',
    },
});