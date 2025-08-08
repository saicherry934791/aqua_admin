// screens/SubscriptionDetailsScreen.tsx
import { apiService } from '@/lib/api/api';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    Linking
} from 'react-native';

interface SubscriptionDetails {
    id: string;
    connectId: string;
    customerId: string;
    productId: string;
    franchiseId: string;
    planName: string;
    status: string;
    startDate: string;
    endDate: string | null;
    currentPeriodStartDate: string;
    currentPeriodEndDate: string;
    nextPaymentDate: string;
    monthlyAmount: number;
    depositAmount: number;
    customer: {
        id: string;
        phone: string;
        name: string;
        city: string;
        alternativePhone: string;
        isActive: boolean;
    };
    product: {
        id: string;
        name: string;
        description: string;
        images: string[];
        rentPrice: number;
        buyPrice: number;
        deposit: number;
        isRentable: boolean;
        isPurchasable: boolean;
    };
    franchise: {
        id: string;
        name: string;
        city: string;
        isActive: boolean;
    };
    installationRequest: {
        id: string;
        name: string;
        phoneNumber: string;
        installationAddress: string;
        status: string;
        completedDate: string | null;
        scheduledDate: string | null;
        razorpayPaymentLink: string;
        autoPaymentEnabled: boolean;
    };
    payments: Array<{
        id: string;
        amount: number;
        type: string;
        status: string;
        paymentMethod: string;
        paidDate: string;
    }>;
}

const SubscriptionDetailsScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSubscriptionDetails = async () => {
        setLoading(true);
        try {
            const result = await apiService.get(`/subscriptions/${id}`);
            if (result?.data?.subscription) {
                setSubscription(result.data.subscription);
            }
        } catch (error) {
            console.log('Failed to fetch subscription details:', error);
            Alert.alert('Error', 'Failed to load subscription details');
        }
        setLoading(false);
        setRefreshing(false);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchSubscriptionDetails();
    };

    const handleCallCustomer = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleOpenPaymentLink = (paymentLink: string) => {
        Linking.openURL(paymentLink);
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    const formatCurrency = (amount: number) => {
        return `₹${amount.toLocaleString()}`;
    };

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE':
                return { color: '#10B981', bgColor: '#ECFDF5' };
            case 'INACTIVE':
            case 'CANCELLED':
                return { color: '#EF4444', bgColor: '#FEF2F2' };
            case 'PAUSED':
                return { color: '#F59E0B', bgColor: '#FFFBEB' };
            case 'COMPLETED':
                return { color: '#8B5CF6', bgColor: '#F3E8FF' };
            default:
                return { color: '#6B7280', bgColor: '#F9FAFB' };
        }
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED':
            case 'SUCCESS':
                return { color: '#10B981', bgColor: '#ECFDF5' };
            case 'PENDING':
                return { color: '#F59E0B', bgColor: '#FFFBEB' };
            case 'FAILED':
                return { color: '#EF4444', bgColor: '#FEF2F2' };
            default:
                return { color: '#6B7280', bgColor: '#F9FAFB' };
        }
    };

    useEffect(() => {
        if (id) {
            fetchSubscriptionDetails();
        }
    }, [id]);

    const handleTerminate = () => {
        Alert.alert(
            "Confirm Termination",
            "Are you sure you want to terminate this subscription?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes",
                    onPress: async () => {
                        try {
                            const result = await apiService.patch(`/subscriptions/${id}/terminate`, {});
                            if (result?.data?.subscription) {
                                setSubscription(result.data.subscription);
                            }
                            console.log('result ', result?.statusCode == 400)
                            console.log(result)
                            console.log(result?.error?.trim() == "there is no cancel reqeust from user")
                            if (
                                result?.statusCode == 400 &&
                                result?.error?.trim() == "there is no cancel reqeust from user"
                            ) {
                                Alert.alert(
                                    "No Cancel Request",
                                    "There is no request from user to cancel. Would you like to terminate anyway?",
                                    [
                                        { text: "No", style: "cancel" },
                                        {
                                            text: "Yes",
                                            onPress: async () => {
                                                try {
                                                    await apiService.patch(`/subscriptions/${id}/terminate`, { override: true });
                                                    Alert.alert("Success", "Subscription terminated successfully.");
                                                } catch (err) {
                                                    Alert.alert("Error", "Failed to terminate subscription.");
                                                }
                                            },
                                        },
                                    ]
                                );
                            } else {
                                Alert.alert("Error", "Failed to check subscription status.");
                            }
                        } catch (error) {
                            console.log('error is ', error)

                        }
                    },
                },
            ]
        );
    };

    const SkeletonCard = () => (
        <View style={styles.skeletonCard}>
            <View style={styles.skeletonHeader} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLineLong} />
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </View>
        );
    }

    if (!subscription) {
        return (
            <View style={styles.emptyState}>
                <MaterialIcons name="receipt-long" size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>Subscription Not Found</Text>
                <Text style={styles.emptySubtitle}>The requested subscription could not be loaded</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusStyle = getStatusColor(subscription.status);

    return (
        <View style={styles.container}>
            <SkeletonWrapper
                loading={loading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                skeleton={<SkeletonCard />}
                style={styles.scrollContent}
            >
                {/* Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerInfo}>
                            <Text style={styles.subscriptionId}>#{subscription.connectId}</Text>
                            <Text style={styles.planName}>{subscription.planName}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
                            <View style={[styles.statusDot, { backgroundColor: statusStyle.color }]} />
                            <Text style={[styles.statusText, { color: statusStyle.color }]}>
                                {subscription.status}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.amountRow}>
                        <View style={styles.amountBox}>
                            <Text style={styles.amountLabel}>Monthly Amount</Text>
                            <Text style={styles.amountValue}>{formatCurrency(subscription.monthlyAmount)}</Text>
                        </View>
                        <View style={styles.amountBox}>
                            <Text style={styles.amountLabel}>Deposit</Text>
                            <Text style={styles.amountValue}>{formatCurrency(subscription.depositAmount)}</Text>
                        </View>
                    </View>

                    <View style={styles.dateRow}>
                        <Text style={styles.dateLabel}>Next Payment: </Text>
                        <Text style={styles.dateValue}>{formatDate(subscription.nextPaymentDate)}</Text>
                    </View>
                </View>

                {/* Customer Information */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person" size={20} color="#3B82F6" />
                        <Text style={styles.sectionTitle}>Customer Information</Text>
                    </View>
                    <View style={styles.customerInfo}>
                        <View style={styles.customerRow}>
                            <Text style={styles.customerName}>{subscription.customer.name}</Text>
                            <View style={[
                                styles.customerStatusBadge,
                                subscription.customer.isActive ? styles.badgeActive : styles.badgeInactive
                            ]}>
                                <Text style={[
                                    styles.customerStatusText,
                                    { color: subscription.customer.isActive ? '#047857' : '#DC2626' }
                                ]}>
                                    {subscription.customer.isActive ? 'Active' : 'Inactive'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.contactRow}
                            onPress={() => handleCallCustomer(subscription.customer.phone)}
                        >
                            <Ionicons name="call" size={14} color="#6B7280" />
                            <Text style={styles.contactText}>{subscription.customer.phone}</Text>
                        </TouchableOpacity>

                        {subscription.customer.alternativePhone && (
                            <TouchableOpacity
                                style={styles.contactRow}
                                onPress={() => handleCallCustomer(subscription.customer.alternativePhone)}
                            >
                                <Ionicons name="call-outline" size={14} color="#6B7280" />
                                <Text style={styles.contactText}>{subscription.customer.alternativePhone}</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.contactRow}>
                            <Ionicons name="location" size={14} color="#6B7280" />
                            <Text style={styles.contactText}>{subscription.customer.city}</Text>
                        </View>
                    </View>
                </View>

                {/* Product Information */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cube" size={20} color="#10B981" />
                        <Text style={styles.sectionTitle}>Product Details</Text>
                    </View>

                    {subscription.product.images && subscription.product.images.length > 0 && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.imageContainer}
                        >
                            {subscription.product.images.map((image, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: image }}
                                    style={styles.productImage}
                                    resizeMode="cover"
                                />
                            ))}
                        </ScrollView>
                    )}

                    <View style={styles.productInfo}>
                        <Text style={styles.productName}>{subscription.product.name}</Text>
                        <Text style={styles.productDescription}>{subscription.product.description}</Text>

                        <View style={styles.priceRow}>
                            <View style={styles.priceBox}>
                                <Text style={styles.priceLabel}>Rent Price</Text>
                                <Text style={styles.priceValue}>{formatCurrency(subscription.product.rentPrice)}</Text>
                            </View>
                            <View style={styles.priceBox}>
                                <Text style={styles.priceLabel}>Buy Price</Text>
                                <Text style={styles.priceValue}>{formatCurrency(subscription.product.buyPrice)}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Installation Details */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="construct" size={20} color="#F59E0B" />
                        <Text style={styles.sectionTitle}>Installation Details</Text>
                    </View>

                    <View style={styles.installationInfo}>
                        <View style={styles.installationRow}>
                            <Text style={styles.installationLabel}>Status:</Text>
                            <Text style={styles.installationValue}>
                                {subscription.installationRequest.status.replace('_', ' ')}
                            </Text>
                        </View>

                        <View style={styles.installationRow}>
                            <Text style={styles.installationLabel}>Contact Person:</Text>
                            <Text style={styles.installationValue}>{subscription.installationRequest.name}</Text>
                        </View>

                        <View style={styles.installationRow}>
                            <Text style={styles.installationLabel}>Phone:</Text>
                            <TouchableOpacity onPress={() => handleCallCustomer(subscription.installationRequest.phoneNumber)}>
                                <Text style={[styles.installationValue, styles.linkText]}>
                                    {subscription.installationRequest.phoneNumber}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.addressRow}>
                            <Ionicons name="location" size={14} color="#6B7280" />
                            <Text style={styles.addressText}>{subscription.installationRequest.installationAddress}</Text>
                        </View>

                        {subscription.installationRequest.completedDate && (
                            <View style={styles.installationRow}>
                                <Text style={styles.installationLabel}>Completed:</Text>
                                <Text style={styles.installationValue}>
                                    {formatDate(subscription.installationRequest.completedDate)}
                                </Text>
                            </View>
                        )}

                        {subscription.installationRequest.autoPaymentEnabled && (
                            <View style={styles.autoPayRow}>
                                <Ionicons name="card" size={16} color="#10B981" />
                                <Text style={styles.autoPayText}>Auto Payment Enabled</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Franchise Information */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="business" size={20} color="#8B5CF6" />
                        <Text style={styles.sectionTitle}>Franchise Details</Text>
                    </View>

                    <View style={styles.franchiseInfo}>
                        <Text style={styles.franchiseName}>{subscription.franchise.name}</Text>
                        <View style={styles.franchiseRow}>
                            <Ionicons name="location" size={14} color="#6B7280" />
                            <Text style={styles.franchiseCity}>{subscription.franchise.city}</Text>
                        </View>
                    </View>
                </View>

                {/* Payment History */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="card" size={20} color="#EF4444" />
                        <Text style={styles.sectionTitle}>Payment History</Text>
                    </View>

                    {subscription.payments.map((payment, index) => {
                        const paymentStatusStyle = getPaymentStatusColor(payment.status);
                        return (
                            <View key={payment.id} style={styles.paymentItem}>
                                <View style={styles.paymentHeader}>
                                    <View style={styles.paymentInfo}>
                                        <Text style={styles.paymentType}>{payment.type}</Text>
                                        <Text style={styles.paymentAmount}>{formatCurrency(payment.amount / 100)}</Text>
                                    </View>
                                    <View style={[styles.paymentStatus, { backgroundColor: paymentStatusStyle.bgColor }]}>
                                        <Text style={[styles.paymentStatusText, { color: paymentStatusStyle.color }]}>
                                            {payment.status}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.paymentDetails}>
                                    <Text style={styles.paymentMethod}>{payment.paymentMethod}</Text>
                                    <Text style={styles.paymentDate}>{formatDate(payment.paidDate)}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    {subscription.installationRequest.razorpayPaymentLink && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.primaryButton]}
                            onPress={() => handleOpenPaymentLink(subscription.installationRequest.razorpayPaymentLink)}
                        >
                            <Ionicons name="card" size={16} color="#fff" />
                            <Text style={styles.primaryButtonText}>Payment Link</Text>
                        </TouchableOpacity>
                    )}

                    {
                        subscription.status !== 'TERMINATED' &&
                        <TouchableOpacity onPress={handleTerminate} style={[styles.actionButton, styles.secondaryButton]}>
                            <Ionicons name="create" size={16} color="#3B82F6" />
                            <Text style={styles.secondaryButtonText}>Terminate Subscription</Text>
                        </TouchableOpacity>
                    }
                </View>
            </SkeletonWrapper>
        </View>
    );
};

export default SubscriptionDetailsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    headerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerInfo: {
        flex: 1,
    },
    subscriptionId: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#6B7280',
        marginBottom: 4,
    },
    planName: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        color: '#111827',
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
    amountRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    amountBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#111827',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    dateValue: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
        marginLeft: 8,
    },
    customerInfo: {
        gap: 8,
    },
    customerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    customerName: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
    },
    customerStatusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    badgeActive: {
        backgroundColor: '#ECFDF5',
    },
    badgeInactive: {
        backgroundColor: '#FEF2F2',
    },
    customerStatusText: {
        fontSize: 10,
        fontFamily: 'Outfit_500Medium',
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 2,
    },
    contactText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    imageContainer: {
        marginBottom: 16,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 8,
    },
    productInfo: {
        gap: 8,
    },
    productName: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
    },
    productDescription: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        lineHeight: 20,
    },
    priceRow: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    priceBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
    },
    installationInfo: {
        gap: 8,
    },
    installationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    installationLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    installationValue: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#111827',
    },
    linkText: {
        color: '#3B82F6',
        textDecorationLine: 'underline',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 8,
    },
    addressText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        flex: 1,
        lineHeight: 20,
    },
    autoPayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        backgroundColor: '#ECFDF5',
        padding: 8,
        borderRadius: 8,
    },
    autoPayText: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#047857',
    },
    franchiseInfo: {
        gap: 8,
    },
    franchiseName: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
    },
    franchiseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    franchiseCity: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    paymentItem: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    paymentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentInfo: {
        flex: 1,
    },
    paymentType: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        color: '#111827',
    },
    paymentAmount: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        color: '#111827',
        marginTop: 2,
    },
    paymentStatus: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    paymentStatusText: {
        fontSize: 10,
        fontFamily: 'Outfit_500Medium',
    },
    paymentDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentMethod: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    paymentDate: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    actionButtons: {
        gap: 12,
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    primaryButton: {
        backgroundColor: '#3B82F6',
    },
    primaryButtonText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
    },
    secondaryButton: {
        backgroundColor: '#FF0000',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#3B82F6',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
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
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    backButtonText: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
    },
    skeletonCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    skeletonHeader: {
        height: 20,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginBottom: 12,
        width: '60%',
    },
    skeletonLine: {
        height: 16,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginBottom: 8,
        width: '40%',
    },
    skeletonLineLong: {
        height: 16,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        width: '80%',
    },
});