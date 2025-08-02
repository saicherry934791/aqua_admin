import { apiService } from '@/lib/api/api';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    Image,
    StyleSheet
} from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';
import * as ImagePicker from 'expo-image-picker';

// Backend service request statuses
export enum ServiceRequestStatus {
    CREATED = 'CREATED',
    ASSIGNED = 'ASSIGNED',
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

interface PaymentStatus {
    status: 'PENDING' | 'PAID' | 'FAILED';
    amount: number;
    method: string;
    paidDate?: string;
    razorpayPaymentLink?: string;
    razorpaySubscriptionId?: string;
}

interface ServiceRequest {
    id: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    productId: string;
    productName: string;
    type: 'installation' | 'maintenance' | 'repair' | 'replacement';
    description: string;
    status: ServiceRequestStatus;
    assignedToId?: string;
    assignedToName?: string;
    scheduledDate?: string;
    completedDate?: string;
    createdAt: string;
    updatedAt: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    customerEmail?: string;
    requirePayment: boolean;
    paymentStatus?: PaymentStatus;
    beforeImages: string[];
    afterImages: string[];
}

const ServiceDetailScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [selectedImages, setSelectedImages] = useState<{ beforeImages: any[], afterImages: any[] }>({
        beforeImages: [],
        afterImages: []
    });
    const { user } = useAuth();
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <Text style={styles.headerTitle}>
                    SERVICES
                </Text>
            ),
            headerTitleAlign: 'center',
            headerShadowVisible: false
        });
    }, [navigation]);

    const fetchServiceRequest = async () => {
        setLoading(true);
        try {
            const result = await apiService.get(`/service-requests/${id}`);
            if (!result.success) {
                setServiceRequest(null);
                return;
            }

            const data = result.data.serviceRequest;

            console.log('data sr ', data)
            // Transform the data to match our interface
            setServiceRequest({
                id: data.id,
                customerId: data.customer.id,
                customerName: data.customer.name,
                customerPhone: data.customer.phone,
                customerEmail: data.customer.email,
                customerAddress: `${data.customer.city}`, // Assuming address structure
                productId: data.product.id,
                productName: data.product.name,
                type: data.type,
                description: data.description,
                status: data.status,
                assignedToId: data.assignedAgent?.id,
                assignedToName: data.assignedAgent?.name,
                scheduledDate: data.scheduledDate,
                completedDate: data.completedDate,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                priority: 'MEDIUM', // Default priority
                requirePayment: data.requirePayment,
                paymentStatus: data.paymentStatus,
                beforeImages: data.beforeImages || [],
                afterImages: data.afterImages || []
            });

        } catch (error) {
            console.log('Failed to fetch service request:', error);
            Alert.alert('Error', 'Failed to load service request details');
        }
        setLoading(false);
        setRefreshing(false);
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchServiceRequest();
    };

    useEffect(() => {
        fetchServiceRequest();
    }, [id]);

    const getStatusColor = (status: ServiceRequestStatus) => {
        switch (status) {
            case ServiceRequestStatus.CREATED:
                return { backgroundColor: '#F3F4F6', color: '#374151', borderColor: '#E5E7EB' };
            case ServiceRequestStatus.ASSIGNED:
                return { backgroundColor: '#F3E8FF', color: '#7C3AED', borderColor: '#E9D5FF' };
            case ServiceRequestStatus.SCHEDULED:
                return { backgroundColor: '#DBEAFE', color: '#1D4ED8', borderColor: '#BFDBFE' };
            case ServiceRequestStatus.IN_PROGRESS:
                return { backgroundColor: '#FEF3C7', color: '#D97706', borderColor: '#FDE68A' };
            case ServiceRequestStatus.PAYMENT_PENDING:
                return { backgroundColor: '#FED7AA', color: '#EA580C', borderColor: '#FDBA74' };
            case ServiceRequestStatus.COMPLETED:
                return { backgroundColor: '#D1FAE5', color: '#059669', borderColor: '#A7F3D0' };
            case ServiceRequestStatus.CANCELLED:
                return { backgroundColor: '#FEE2E2', color: '#DC2626', borderColor: '#FECACA' };
            default:
                return { backgroundColor: '#F3F4F6', color: '#374151', borderColor: '#E5E7EB' };
        }
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'LOW': return { backgroundColor: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' };
            case 'MEDIUM': return { backgroundColor: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' };
            case 'HIGH': return { backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' };
            case 'URGENT': return { backgroundColor: '#7F1D1D', color: '#FFFFFF', borderColor: '#DC2626' };
            default: return { backgroundColor: '#F9FAFB', color: '#4B5563', borderColor: '#E5E7EB' };
        }
    };

    const getServiceTypeIcon = (type: string) => {
        switch (type) {
            case 'installation': return 'construct';
            case 'maintenance': return 'settings';
            case 'repair': return 'build';
            case 'replacement': return 'swap-horizontal';
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

    const formatDateFull = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCall = (phoneNumber: string) => {
        Linking.openURL(`tel:${phoneNumber}`);
    };

    const handleEmail = (email: string) => {
        Linking.openURL(`mailto:${email}`);
    };

    const handleWhatsApp = (phoneNumber: string) => {
        const cleanNumber = phoneNumber?.replace(/[^\d]/g, '');
        Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
    };

    const pickImages = async (type: 'before' | 'after') => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setSelectedImages(prev => ({
                ...prev,
                [`${type}Images`]: result.assets
            }));
        }
    };

    const requiresImages = (currentStatus: ServiceRequestStatus, newStatus: ServiceRequestStatus): 'before' | 'after' | 'both' | null => {
        // For non-installation types: scheduled -> in_progress needs before images
        if (serviceRequest?.type !== 'installation' &&
            currentStatus === ServiceRequestStatus.SCHEDULED &&
            newStatus === ServiceRequestStatus.IN_PROGRESS) {
            return 'before';
        }

        // in_progress -> completed needs after images
        if (currentStatus === ServiceRequestStatus.IN_PROGRESS &&
            newStatus === ServiceRequestStatus.COMPLETED) {
            return 'after';
        }

        // in_progress -> payment_pending needs after images
        if (currentStatus === ServiceRequestStatus.IN_PROGRESS &&
            newStatus === ServiceRequestStatus.PAYMENT_PENDING) {
            return 'after';
        }

        return null;
    };

    const updateServiceStatus = async (newStatus: ServiceRequestStatus) => {
        if (!serviceRequest) return;

        const imageRequirement = requiresImages(serviceRequest.status, newStatus);

        // Check if images are required but not provided
        if (imageRequirement) {
            const hasRequiredImages = imageRequirement === 'before'
                ? selectedImages.beforeImages.length > 0
                : imageRequirement === 'after'
                    ? selectedImages.afterImages.length > 0
                    : selectedImages.beforeImages.length > 0 && selectedImages.afterImages.length > 0;

            if (!hasRequiredImages) {
                Alert.alert(
                    'Images Required',
                    `Please upload ${imageRequirement} images to proceed with this status change.`,
                    [
                        {
                            text: 'Upload Images',
                            onPress: () => {
                                if (imageRequirement === 'before') pickImages('before');
                                else if (imageRequirement === 'after') pickImages('after');
                            }
                        },
                        { text: 'Cancel', style: 'cancel' }
                    ]
                );
                return;
            }
        }

        setUpdating(true);
        try {
            const formData = new FormData();
            formData.append('status', newStatus);

            // Append images if required
            if (imageRequirement === 'before' || imageRequirement === 'both') {
                selectedImages.beforeImages.forEach((image, index) => {
                    formData.append('beforeImages', {
                        uri: image.uri,
                        type: 'image/jpeg',
                        name: `before_${index}.jpg`,
                    } as any);
                });
            }

            if (imageRequirement === 'after' || imageRequirement === 'both') {
                selectedImages.afterImages.forEach((image, index) => {
                    formData.append('afterImages', {
                        uri: image.uri,
                        type: 'image/jpeg',
                        name: `after_${index}.jpg`,
                    } as any);
                });
            }

            const result = await apiService.patch(`/service-requests/${id}/status`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (result.success) {
                setServiceRequest(prev => prev ? {
                    ...prev,
                    status: newStatus,
                    updatedAt: new Date().toISOString()
                } : null);

                // Clear selected images
                setSelectedImages({ beforeImages: [], afterImages: [] });

                Alert.alert('Success', `Service request updated to ${getStatusDisplayName(newStatus)}`);
            } else {
                throw new Error(result.error || 'Failed to update status');
            }
        } catch (error) {
            console.log('Failed to update service request:', error);
            Alert.alert('Error', 'Failed to update service request');
        }
        setUpdating(false);
    };

    const getStatusDisplayName = (status: ServiceRequestStatus): string => {
        switch (status) {
            case ServiceRequestStatus.CREATED: return 'Created';
            case ServiceRequestStatus.ASSIGNED: return 'Assigned';
            case ServiceRequestStatus.SCHEDULED: return 'Scheduled';
            case ServiceRequestStatus.IN_PROGRESS: return 'In Progress';
            case ServiceRequestStatus.PAYMENT_PENDING: return 'Payment Pending';
            case ServiceRequestStatus.COMPLETED: return 'Completed';
            case ServiceRequestStatus.CANCELLED: return 'Cancelled';
            default: return status;
        }
    };

    const handleAssignAgent = () => {
        SheetManager.show('agent-assignment-sheet', {
            payload: {
                serviceRequestId: id,
                currentAgentId: serviceRequest?.assignedToId,
                currentAgentName: serviceRequest?.assignedToName,
                onAgentAssigned: (agent: { id: string; name: string; phone: string }) => {
                    if (serviceRequest) {
                        setServiceRequest({
                            ...serviceRequest,
                            assignedToId: agent.id || undefined,
                            assignedToName: agent.name || undefined,
                        });
                    }
                }
            }
        });
    };

    const handleScheduleTime = () => {
        SheetManager.show('schedule-time-sheet', {
            payload: {
                serviceRequestId: id,
                currentScheduledDate: serviceRequest?.scheduledDate,
                onScheduleUpdated: (scheduledDate: string | null) => {
                    if (serviceRequest) {
                        setServiceRequest({
                            ...serviceRequest,
                            scheduledDate: scheduledDate || undefined,
                        });
                    }
                }
            }
        });
    };

    const createPaymentLink = async () => {
        setUpdating(true);
        try {
            const result = await apiService.post(`/service-requests/${id}/generate-payment-link`);
            if (result.success) {
                Alert.alert('Success', 'Payment link created successfully');
                fetchServiceRequest(); // Refresh to get updated payment info
            } else {
                throw new Error(result.error || 'Failed to create payment link');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to create payment link');
        }
        setUpdating(false);
    };

    const verifyPaymentStatus = async () => {
        setUpdating(true);
        try {
            const result = await apiService.post(`/service-requests/${id}/refresh-payment-status`);
            console.log('result payment verification ',result)
            if (result.success) {
                Alert.alert('Success', 'Payment status verified');
                fetchServiceRequest(); // Refresh to get updated payment info
            } else {
                throw new Error(result.error || 'Failed to verify payment');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to verify payment status');
        }
        setUpdating(false);
    };

    const getAvailableActions = () => {
        if (!serviceRequest) return [];

        const currentStatus = serviceRequest.status;

        switch (currentStatus) {
            case ServiceRequestStatus.CREATED:
                return [
                    { key: ServiceRequestStatus.ASSIGNED, label: 'Mark as Assigned', icon: 'person-add' },
                    { key: ServiceRequestStatus.SCHEDULED, label: 'Schedule Service', icon: 'calendar' },
                    { key: ServiceRequestStatus.CANCELLED, label: 'Cancel Request', icon: 'close-circle', destructive: true },
                ];
            case ServiceRequestStatus.ASSIGNED:
                return [
                    { key: ServiceRequestStatus.SCHEDULED, label: 'Schedule Service', icon: 'calendar' },
                    { key: ServiceRequestStatus.CANCELLED, label: 'Cancel Request', icon: 'close-circle', destructive: true },
                ];
            case ServiceRequestStatus.SCHEDULED:
                return [
                    { key: ServiceRequestStatus.IN_PROGRESS, label: 'Start Service', icon: 'play' },
                    { key: ServiceRequestStatus.CANCELLED, label: 'Cancel Request', icon: 'close-circle', destructive: true },
                ];
            case ServiceRequestStatus.IN_PROGRESS:
                const actions = [];
                console.log('here 1 ', serviceRequest.requirePayment)
                if (serviceRequest.requirePayment) {
                    actions.push({ key: ServiceRequestStatus.PAYMENT_PENDING, label: 'Mark Payment Pending', icon: 'card' });
                } else {
                    actions.push({ key: ServiceRequestStatus.COMPLETED, label: 'Complete Service', icon: 'checkmark-circle' });
                }
                actions.push({ key: ServiceRequestStatus.CANCELLED, label: 'Cancel Request', icon: 'close-circle', destructive: true });
                return actions;
            case ServiceRequestStatus.PAYMENT_PENDING:
                return [
                    { key: ServiceRequestStatus.COMPLETED, label: 'Complete Service', icon: 'checkmark-circle' },
                    { key: ServiceRequestStatus.CANCELLED, label: 'Cancel Request', icon: 'close-circle', destructive: true },
                ];
            case ServiceRequestStatus.COMPLETED:
                return [
                    { key: ServiceRequestStatus.CREATED, label: 'Reopen Service', icon: 'refresh' },
                ];
            case ServiceRequestStatus.CANCELLED:
                return [
                    { key: ServiceRequestStatus.CREATED, label: 'Reopen Service', icon: 'refresh' },
                ];
            default:
                return [];
        }
    };

    const showStatusActionSheet = () => {
        const availableActions = getAvailableActions();

        if (availableActions.length === 0) {
            Alert.alert('No Actions', 'No status updates available for this service request.');
            return;
        }

        Alert.alert(
            'Update Status',
            'Choose a new status for this service request',
            [
                ...availableActions.map((action) => ({
                    text: action.label,
                    style: action.destructive ? 'destructive' : 'default',
                    onPress: () => updateServiceStatus(action.key)
                })),
                { text: 'Cancel', style: 'cancel' }
            ],
            { cancelable: true }
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading Service Details...</Text>
            </View>
        );
    }

    if (!serviceRequest) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#EF4444" />
                <Text style={styles.errorTitle}>Service Request Not Found</Text>
                <Text style={styles.errorSubtitle}>The requested service details could not be found.</Text>
                <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
                    <Text style={styles.goBackButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const availableActions = getAvailableActions();
    const statusColors = getStatusColor(serviceRequest.status);
    const priorityColors = getPriorityColor(serviceRequest.priority);

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Header Card */}
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            <View style={styles.iconContainer}>
                                <Ionicons
                                    name={getServiceTypeIcon(serviceRequest.type) as any}
                                    size={24}
                                    color="#3B82F6"
                                />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.serviceId}>#{serviceRequest.id.slice(-6).toUpperCase()}</Text>
                                <Text style={styles.serviceType}>{serviceRequest.type}</Text>
                            </View>
                        </View>
                        <View style={styles.headerRight}>
                            {serviceRequest.priority && (
                                <View style={[styles.priorityBadge, {
                                    backgroundColor: priorityColors.backgroundColor,
                                    borderColor: priorityColors.borderColor
                                }]}>
                                    <Text style={[styles.priorityText, { color: priorityColors.color }]}>
                                        {serviceRequest.priority}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.statusBadge, {
                                backgroundColor: statusColors.backgroundColor,
                                borderColor: statusColors.borderColor
                            }]}>
                                <View style={[styles.statusDot, { backgroundColor: statusColors.color }]} />
                                <Text style={[styles.statusText, { color: statusColors.color }]}>
                                    {getStatusDisplayName(serviceRequest.status)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.productName}>{serviceRequest.productName}</Text>
                    <Text style={styles.description}>{serviceRequest.description}</Text>
                </View>

                {/* Customer Information */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Customer Information</Text>

                    <View style={styles.customerInfo}>
                        <View style={styles.customerRow}>
                            <Ionicons name="person" size={20} color="#6B7280" />
                            <Text style={styles.customerName}>{serviceRequest.customerName}</Text>
                        </View>

                        <View style={styles.contactRow}>
                            <View style={styles.contactInfo}>
                                <Ionicons name="call" size={16} color="#6B7280" />
                                <Text style={styles.contactText}>{serviceRequest.customerPhone}</Text>
                            </View>
                            <View style={styles.contactButtons}>
                                <TouchableOpacity
                                    style={[styles.contactButton, { backgroundColor: '#10B981' }]}
                                    onPress={() => handleCall(serviceRequest.customerPhone)}
                                >
                                    <Ionicons name="call" size={16} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.contactButton, { backgroundColor: '#25D366' }]}
                                    onPress={() => handleWhatsApp(serviceRequest.customerPhone)}
                                >
                                    <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {serviceRequest.customerEmail && serviceRequest.customerEmail !== 'N/A' && (
                            <View style={styles.contactRow}>
                                <View style={styles.contactInfo}>
                                    <Ionicons name="mail" size={16} color="#6B7280" />
                                    <Text style={styles.contactText}>{serviceRequest.customerEmail}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.contactButton, { backgroundColor: '#3B82F6' }]}
                                    onPress={() => handleEmail(serviceRequest.customerEmail!)}
                                >
                                    <Ionicons name="mail" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.addressRow}>
                            <Ionicons name="location" size={16} color="#6B7280" style={styles.addressIcon} />
                            <Text style={styles.addressText}>{serviceRequest.customerAddress}</Text>
                        </View>
                    </View>
                </View>

                {/* Payment Status (if payment required) */}
                {serviceRequest.requirePayment && serviceRequest.paymentStatus && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Payment Information</Text>

                        <View style={styles.paymentInfo}>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Status</Text>
                                <Text style={[
                                    styles.paymentValue,
                                    serviceRequest.paymentStatus.status === 'PAID' ? styles.paymentPaid :
                                        serviceRequest.paymentStatus.status === 'FAILED' ? styles.paymentFailed : styles.paymentPending
                                ]}>
                                    {serviceRequest.paymentStatus.status}
                                </Text>
                            </View>

                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Amount</Text>
                                <Text style={styles.paymentAmount}>₹{serviceRequest.paymentStatus.amount.toLocaleString()}</Text>
                            </View>

                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Method</Text>
                                <Text style={styles.paymentAmount}>{serviceRequest.paymentStatus.method}</Text>
                            </View>

                            {serviceRequest.paymentStatus.paidDate && (
                                <View style={styles.paymentRow}>
                                    <Text style={styles.paymentLabel}>Paid Date</Text>
                                    <Text style={styles.paymentAmount}>{formatDate(serviceRequest.paymentStatus.paidDate)}</Text>
                                </View>
                            )}
                        </View>

                        {/* Payment Actions */}
                        {serviceRequest.status === ServiceRequestStatus.PAYMENT_PENDING && (
                            <View style={styles.paymentActions}>
                                {!serviceRequest.paymentStatus.razorpayPaymentLink && (
                                    <TouchableOpacity
                                        style={styles.paymentButton}
                                        onPress={createPaymentLink}
                                        disabled={updating}
                                    >
                                        {updating ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="link" size={16} color="#fff" />
                                                <Text style={styles.paymentButtonText}>Create Payment Link</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                                {
                                    (serviceRequest.paymentStatus.razorpaySubscriptionId && serviceRequest.paymentStatus.razorpayPaymentLink) && (
                                        <View style={styles.paymentRow}>
                                            <Text style={styles.paymentLabel}>Payment Link</Text>
                                            <TouchableOpacity
                                                onPress={() => Linking.openURL(serviceRequest.paymentStatus.razorpayPaymentLink)}
                                            >
                                                <Text style={styles.paymentAmount}>
                                                    {serviceRequest.paymentStatus.razorpayPaymentLink}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    )
                                }

                                {(serviceRequest.paymentStatus.razorpaySubscriptionId && serviceRequest.paymentStatus.razorpayPaymentLink) && (
                                    <TouchableOpacity
                                        style={[styles.paymentButton, { backgroundColor: '#10B981' }]}
                                        onPress={verifyPaymentStatus}
                                        disabled={updating}
                                    >
                                        {updating ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                                                <Text style={styles.paymentButtonText}>Verify Payment</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                )}

                {/* Service Agent Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Service Agent</Text>

                    {serviceRequest.assignedToName ? (
                        <View style={styles.agentAssigned}>
                            <View style={styles.agentInfo}>
                                <View style={styles.agentAvatar}>
                                    <Ionicons name="person" size={20} color="#3B82F6" />
                                </View>
                                <View style={styles.agentDetails}>
                                    <Text style={styles.agentName}>{serviceRequest.assignedToName}</Text>
                                    <Text style={styles.agentLabel}>Assigned Agent</Text>
                                </View>
                            </View>

                            {user?.role !== UserRole.SERVICE_AGENT && (
                                <TouchableOpacity
                                    style={styles.reassignButton}
                                    onPress={handleAssignAgent}
                                >
                                    <Ionicons name="swap-horizontal" size={16} color="#3B82F6" />
                                    <Text style={styles.reassignText}>Reassign</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.scheduleButton}
                            onPress={handleScheduleTime}
                        >
                            <Ionicons name="calendar-outline" size={24} color="#6B7280" />
                            <View style={styles.scheduleButtonText}>
                                <Text style={styles.scheduleButtonTitle}>Not Scheduled</Text>
                                <Text style={styles.scheduleButtonSubtitle}>Tap to schedule service time</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Images Section */}
                {(serviceRequest.beforeImages.length > 0 || serviceRequest.afterImages.length > 0 || selectedImages.beforeImages.length > 0 || selectedImages.afterImages.length > 0) && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Service Images</Text>

                        {/* Before Images */}
                        {(serviceRequest.beforeImages.length > 0 || selectedImages.beforeImages.length > 0) && (
                            <View style={styles.imagesSection}>
                                <Text style={styles.imagesSectionTitle}>Before Images</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                                    {serviceRequest.beforeImages.map((image, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: image }}
                                            style={styles.serviceImage}
                                        />
                                    ))}
                                    {selectedImages.beforeImages.map((image, index) => (
                                        <Image
                                            key={`selected-${index}`}
                                            source={{ uri: image.uri }}
                                            style={styles.serviceImage}
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* After Images */}
                        {(serviceRequest.afterImages.length > 0 || selectedImages.afterImages.length > 0) && (
                            <View>
                                <Text style={styles.imagesSectionTitle}>After Images</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                                    {serviceRequest.afterImages.map((image, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: image }}
                                            style={styles.serviceImage}
                                        />
                                    ))}
                                    {selectedImages.afterImages.map((image, index) => (
                                        <Image
                                            key={`selected-${index}`}
                                            source={{ uri: image.uri }}
                                            style={styles.serviceImage}
                                        />
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                )}

                {/* Image Upload Buttons */}
                {(serviceRequest.status === ServiceRequestStatus.SCHEDULED || serviceRequest.status === ServiceRequestStatus.IN_PROGRESS) && (
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Upload Images</Text>

                        <View style={styles.uploadButtonsRow}>
                            <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={() => pickImages('before')}
                            >
                                <Ionicons name="camera" size={16} color="#3B82F6" />
                                <Text style={styles.uploadButtonText}>Before Images</Text>
                            </TouchableOpacity>

                            {serviceRequest.status === ServiceRequestStatus.IN_PROGRESS && (
                                <TouchableOpacity
                                    style={[styles.uploadButton, { backgroundColor: '#ECFDF5' }]}
                                    onPress={() => pickImages('after')}
                                >
                                    <Ionicons name="camera" size={16} color="#10B981" />
                                    <Text style={[styles.uploadButtonText, { color: '#10B981' }]}>After Images</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {selectedImages.beforeImages.length > 0 && (
                            <Text style={styles.selectedImagesText}>
                                {selectedImages.beforeImages.length} before image(s) selected
                            </Text>
                        )}

                        {selectedImages.afterImages.length > 0 && (
                            <Text style={[styles.selectedImagesText, { color: '#10B981' }]}>
                                {selectedImages.afterImages.length} after image(s) selected
                            </Text>
                        )}
                    </View>
                )}

                {/* Timeline */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Timeline</Text>

                    <View style={styles.timeline}>
                        <View style={styles.timelineItem}>
                            <View style={styles.timelineIcon}>
                                <Ionicons name="add-circle" size={16} color="#6B7280" />
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Request Created</Text>
                                <Text style={styles.timelineDate}>{formatDateFull(serviceRequest.createdAt)}</Text>
                            </View>
                        </View>

                        {serviceRequest.scheduledDate && (
                            <View style={styles.timelineItem}>
                                <View style={[styles.timelineIcon, { backgroundColor: '#D1FAE5' }]}>
                                    <Ionicons name="calendar" size={16} color="#10B981" />
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineTitle}>Scheduled</Text>
                                    <Text style={styles.timelineDate}>{formatDateFull(serviceRequest.scheduledDate)}</Text>
                                </View>
                            </View>
                        )}

                        {serviceRequest.completedDate && (
                            <View style={styles.timelineItem}>
                                <View style={[styles.timelineIcon, { backgroundColor: '#D1FAE5' }]}>
                                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                                </View>
                                <View style={styles.timelineContent}>
                                    <Text style={styles.timelineTitle}>Completed</Text>
                                    <Text style={styles.timelineDate}>{formatDateFull(serviceRequest.completedDate)}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Action Button */}
            {availableActions.length > 0 && (
                <View style={styles.actionButtonContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, updating && styles.actionButtonDisabled]}
                        onPress={showStatusActionSheet}
                        disabled={updating}
                    >
                        {updating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="options" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Update Status</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        color: '#EF4444',
        marginTop: 16,
        marginBottom: 8,
        fontWeight: '600',
    },
    errorSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    goBackButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    goBackButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '500',
        color: '#111827',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    serviceId: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    serviceType: {
        fontSize: 14,
        fontWeight: '500',
        color: '#7C3AED',
        textTransform: 'capitalize',
    },
    headerRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    priorityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    priorityText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    productName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    customerInfo: {
        gap: 12,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    customerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginLeft: 8,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    contactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    contactText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 8,
    },
    contactButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    contactButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    addressIcon: {
        marginTop: 2,
    },
    addressText: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
        lineHeight: 20,
    },
    paymentInfo: {
        gap: 12,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    paymentLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    paymentPaid: {
        color: '#059669',
    },
    paymentFailed: {
        color: '#DC2626',
    },
    paymentPending: {
        color: '#D97706',
    },
    paymentAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    paymentActions: {
        marginTop: 16,
        gap: 8,
    },
    paymentButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    paymentButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        marginLeft: 8,
    },
    agentAssigned: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    agentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    agentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    agentDetails: {
        flex: 1,
    },
    agentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    agentLabel: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '500',
    },
    reassignButton: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    reassignText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#3B82F6',
        marginLeft: 4,
    },
    assignAgentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    assignAgentText: {
        flex: 1,
        marginLeft: 12,
    },
    assignAgentTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    assignAgentSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    scheduleAssigned: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scheduleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    scheduleAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    scheduleDetails: {
        flex: 1,
    },
    scheduleName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    scheduleLabel: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '500',
    },
    updateScheduleButton: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    updateScheduleText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#10B981',
        marginLeft: 4,
    },
    scheduleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    scheduleButtonText: {
        flex: 1,
        marginLeft: 12,
    },
    scheduleButtonTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    scheduleButtonSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    imagesSection: {
        marginBottom: 16,
    },
    imagesSectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    imagesScroll: {
        flexDirection: 'row',
    },
    serviceImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 8,
    },
    uploadButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    uploadButton: {
        flex: 1,
        backgroundColor: '#EFF6FF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadButtonText: {
        color: '#3B82F6',
        fontWeight: '500',
        fontSize: 14,
        marginLeft: 8,
    },
    selectedImagesText: {
        fontSize: 12,
        color: '#3B82F6',
        marginTop: 8,
    },
    timeline: {
        gap: 16,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    timelineIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineContent: {
        flex: 1,
    },
    timelineTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    timelineDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    bottomPadding: {
        height: 96,
    },
    actionButtonContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default ServiceDetailScreen;