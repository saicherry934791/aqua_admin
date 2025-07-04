import { apiService } from '@/lib/api/api';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SheetManager } from 'react-native-actions-sheet';

// Backend service request statuses
export enum ServiceRequestStatus {
    CREATED = 'created',
    ASSIGNED = 'assigned',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

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
    status: ServiceRequestStatus;
    assignedToId?: string;
    assignedToName?: string;
    franchiseAreaId: string;
    franchiseAreaName: string;
    scheduledDate?: string;
    completedDate?: string;
    createdAt: string;
    updatedAt: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    customerEmail?: string;
    estimatedDuration?: number;
    actualDuration?: number;
    cost?: number;
}

const ServiceDetailScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const { user } = useAuth()

    const navigation = useNavigation()

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <Text
                    style={{
                        fontSize: 20, // equivalent to text-2xl
                        fontFamily: 'Outfit_500Medium', // equivalent to font-grotesk-bold
                        color: '#121516',
                    }}
                >
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
            console.log('Service request data:', data);

            setServiceRequest({
                id: data.id,
                customerId: data.customer.id,
                customerName: data.customer.name,
                customerPhone: data.customer.phone,
                customerEmail: data.customer.email,
                customerAddress: data.customer.address,
                productId: data.product.id,
                productName: data.product.name,
                orderId: data.orderId,
                type: data.type,
                description: data.product.description,
                status: data.status, // Use backend status directly
                assignedToId: data.assignedToId,
                assignedToName: data.assignedTo?.name || null,
                franchiseAreaId: data.franchiseAreaId,
                franchiseAreaName: data.franchiseAreaName || 'Service Area',
                scheduledDate: data.scheduledDate,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                priority: data.priority || 'MEDIUM',
                estimatedDuration: data.estimatedDuration || 120,
                cost: data.cost || 0
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
                return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280', border: '#E5E7EB' };
            case ServiceRequestStatus.ASSIGNED:
                return { bg: '#F3E8FF', text: '#6B21A8', dot: '#8B5CF6', border: '#C4B5FD' };
            case ServiceRequestStatus.IN_PROGRESS:
                return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', border: '#FDE68A' };
            case ServiceRequestStatus.COMPLETED:
                return { bg: '#D1FAE5', text: '#047857', dot: '#059669', border: '#6EE7B7' };
            case ServiceRequestStatus.CANCELLED:
                return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444', border: '#FECACA' };
            default:
                return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280', border: '#E5E7EB' };
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

    const handleDirections = (address: string) => {
        const encodedAddress = encodeURIComponent(address);
        Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
    };

    const updateServiceStatus = async (newStatus: ServiceRequestStatus) => {
        setUpdating(true);
        try {
            const result = await apiService.patch(`/service-requests/${id}/status`, {
                status: newStatus
            });

            if (result.success) {
                setServiceRequest(prev => prev ? {
                    ...prev,
                    status: newStatus,
                    updatedAt: new Date().toISOString()
                } : null);

                Alert.alert('Success', `Service request ${getStatusDisplayName(newStatus)}`);
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
            case ServiceRequestStatus.IN_PROGRESS: return 'In Progress';
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
                orderId: serviceRequest?.orderId,
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

    const getAvailableActions = () => {
        if (!serviceRequest) return [];

        const currentStatus = serviceRequest.status;

        switch (currentStatus) {
            case ServiceRequestStatus.CREATED:
                return [
                    { key: ServiceRequestStatus.ASSIGNED, label: 'Mark as Assigned', icon: 'person-add' },
                    { key: ServiceRequestStatus.IN_PROGRESS, label: 'Start Service', icon: 'play' },
                    { key: ServiceRequestStatus.CANCELLED, label: 'Cancel Request', icon: 'close-circle', destructive: true },
                ];
            case ServiceRequestStatus.ASSIGNED:
                return [
                    { key: ServiceRequestStatus.IN_PROGRESS, label: 'Start Service', icon: 'play' },
                    { key: ServiceRequestStatus.CANCELLED, label: 'Cancel Request', icon: 'close-circle', destructive: true },
                ];
            case ServiceRequestStatus.IN_PROGRESS:
                return [
                    { key: ServiceRequestStatus.COMPLETED, label: 'Complete Service', icon: 'checkmark-circle' },
                    { key: ServiceRequestStatus.ASSIGNED, label: 'Pause Service', icon: 'pause' },
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

        const options = [
            ...availableActions.map(action => action.label),
            'Cancel'
        ];

        Alert.alert(
            'Update Status',
            'Choose a new status for this service request',
            [
                ...availableActions.map((action, index) => ({
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
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusColors = getStatusColor(serviceRequest.status);
    const priorityColors = getPriorityColor(serviceRequest.priority);
    const availableActions = getAvailableActions();

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Header Card */}
                <View style={styles.headerCard}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            <View style={styles.serviceTypeIconLarge}>
                                <Ionicons
                                    name={getServiceTypeIcon(serviceRequest.type) as any}
                                    size={24}
                                    color="#3B82F6"
                                />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.requestId}>#{serviceRequest.id.slice(-6).toUpperCase()}</Text>
                                <Text style={styles.serviceTypeText}>{serviceRequest.type}</Text>
                            </View>
                        </View>
                        <View style={styles.headerRight}>
                            {serviceRequest.priority && (
                                <View style={[styles.priorityBadgeLarge, {
                                    backgroundColor: priorityColors.bg,
                                    borderColor: priorityColors.border
                                }]}>
                                    <Text style={[styles.priorityTextLarge, { color: priorityColors.text }]}>
                                        {serviceRequest.priority}
                                    </Text>
                                </View>
                            )}
                            <View style={[styles.statusBadgeLarge, {
                                backgroundColor: statusColors.bg,
                                borderColor: statusColors.border
                            }]}>
                                <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
                                <Text style={[styles.statusTextLarge, { color: statusColors.text }]}>
                                    {getStatusDisplayName(serviceRequest.status)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.productName}>{serviceRequest.productName}</Text>
                    <Text style={styles.description}>{serviceRequest.description}</Text>
                </View>

                {/* Customer Information */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Customer Information</Text>

                    <View style={styles.customerInfo}>
                        <View style={styles.customerRow}>
                            <Ionicons name="person" size={20} color="#6B7280" />
                            <Text style={styles.customerName}>{serviceRequest.customerName}</Text>
                        </View>

                        <View style={styles.contactRow}>
                            <View style={styles.contactItem}>
                                <Ionicons name="call" size={16} color="#6B7280" />
                                <Text style={styles.contactText}>{serviceRequest.customerPhone}</Text>
                            </View>
                            <View style={styles.contactActions}>
                                <TouchableOpacity
                                    style={[styles.contactButton, styles.callButton]}
                                    onPress={() => handleCall(serviceRequest.customerPhone)}
                                >
                                    <Ionicons name="call" size={16} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.contactButton, styles.whatsappButton]}
                                    onPress={() => handleWhatsApp(serviceRequest.customerPhone)}
                                >
                                    <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {serviceRequest.customerEmail && serviceRequest.customerEmail !== 'N/A' && (
                            <View style={styles.contactRow}>
                                <View style={styles.contactItem}>
                                    <Ionicons name="mail" size={16} color="#6B7280" />
                                    <Text style={styles.contactText}>{serviceRequest.customerEmail}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.contactButton, styles.emailButton]}
                                    onPress={() => handleEmail(serviceRequest.customerEmail!)}
                                >
                                    <Ionicons name="mail" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.addressRow}>
                            <Ionicons name="location" size={16} color="#6B7280" />
                            <Text style={styles.addressText}>{serviceRequest.customerAddress}</Text>
                            <TouchableOpacity
                                style={[styles.contactButton, styles.directionsButton]}
                                onPress={() => handleDirections(serviceRequest.customerAddress)}
                            >
                                <Ionicons name="navigate" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Service Agent Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.sectionTitle}>Service Agent</Text>
                    </View>

                    {serviceRequest.assignedToName ? (
                        <View style={styles.agentSection}>
                            <View style={styles.agentInfo}>
                                <View style={styles.agentAvatar}>
                                    <Ionicons name="person" size={20} color="#3B82F6" />
                                </View>
                                <View style={styles.agentDetails}>
                                    <Text style={styles.agentName}>{serviceRequest.assignedToName}</Text>
                                    <Text style={styles.agentStatus}>Assigned Agent</Text>
                                </View>
                            </View>

                            {
                                user?.role !== UserRole.SERVICE_AGENT && <View style={styles.agentActions}>
                                    <TouchableOpacity
                                        style={styles.agentActionButton}
                                        onPress={handleAssignAgent}
                                    >
                                        <Ionicons name="swap-horizontal" size={16} color="#3B82F6" />
                                        <Text style={styles.agentActionText}>Reassign</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.noAgentSection}
                            onPress={handleAssignAgent}
                        >
                            <View style={styles.noAgentIcon}>
                                <Ionicons name="person-add" size={24} color="#6B7280" />
                            </View>
                            <View style={styles.noAgentContent}>
                                <Text style={styles.noAgentText}>No Agent Assigned</Text>
                                <Text style={styles.noAgentSubtext}>Tap to assign a service agent</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Schedule Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.sectionTitle}>Schedule</Text>
                    </View>

                    {serviceRequest.scheduledDate ? (
                        <View style={styles.scheduleSection}>
                            <View style={styles.scheduleInfo}>
                                <View style={styles.scheduleIcon}>
                                    <Ionicons name="calendar" size={20} color="#10B981" />
                                </View>
                                <View style={styles.scheduleDetails}>
                                    <Text style={styles.scheduleDate}>{formatDateFull(serviceRequest.scheduledDate)}</Text>
                                    <Text style={styles.scheduleStatus}>Scheduled</Text>
                                </View>
                            </View>

                            <View style={styles.scheduleActions}>
                                <TouchableOpacity
                                    style={styles.scheduleActionButton}
                                    onPress={handleScheduleTime}
                                >
                                    <Ionicons name="create" size={16} color="#10B981" />
                                    <Text style={styles.scheduleActionText}>Update</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.noScheduleSection}
                            onPress={handleScheduleTime}
                        >
                            <View style={styles.noScheduleIcon}>
                                <Ionicons name="calendar-outline" size={24} color="#6B7280" />
                            </View>
                            <View style={styles.noScheduleContent}>
                                <Text style={styles.noScheduleText}>Not Scheduled</Text>
                                <Text style={styles.noScheduleSubtext}>Tap to schedule service time</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Service Details */}
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Service Details</Text>

                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Service Type</Text>
                            <Text style={styles.detailValue}>{serviceRequest.type}</Text>
                        </View>

                        <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Franchise Area</Text>
                            <Text style={styles.detailValue}>{serviceRequest.franchiseAreaName}</Text>
                        </View>

                        {serviceRequest.estimatedDuration && (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Estimated Duration</Text>
                                <Text style={styles.detailValue}>{serviceRequest.estimatedDuration} minutes</Text>
                            </View>
                        )}

                        {serviceRequest.cost && serviceRequest.cost > 0 && (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Service Cost</Text>
                                <Text style={styles.detailValue}>₹{serviceRequest.cost.toLocaleString()}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Timeline */}
                <View style={styles.sectionCard}>
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
                                <View style={styles.timelineIcon}>
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
                                <View style={styles.timelineIcon}>
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
            )}
        </View>
    );
};

export default ServiceDetailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
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
        backgroundColor: '#F8FAFC',
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
    backButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    headerCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginTop: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
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
    serviceTypeIconLarge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    requestId: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    serviceTypeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8B5CF6',
        textTransform: 'capitalize',
    },
    headerRight: {
        alignItems: 'flex-end',
        gap: 8,
    },
    priorityBadgeLarge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    priorityTextLarge: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusBadgeLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusTextLarge: {
        fontSize: 13,
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
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
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
        marginBottom: 8,
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
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    contactText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 8,
    },
    contactActions: {
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
    callButton: {
        backgroundColor: '#10B981',
    },
    whatsappButton: {
        backgroundColor: '#25D366',
    },
    emailButton: {
        backgroundColor: '#3B82F6',
    },
    directionsButton: {
        backgroundColor: '#8B5CF6',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    addressText: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
        lineHeight: 20,
    },
    // Agent Section Styles
    agentSection: {
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
        backgroundColor: '#EEF2FF',
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
        marginBottom: 2,
    },
    agentStatus: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '500',
    },
    agentActions: {
        flexDirection: 'row',
        gap: 8,
    },
    agentActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    agentActionText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#3B82F6',
    },
    noAgentSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    noAgentIcon: {
        marginRight: 12,
    },
    noAgentContent: {
        flex: 1,
    },
    noAgentText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 2,
    },
    noAgentSubtext: {
        fontSize: 12,
        color: '#6B7280',
    },
    // Schedule Section Styles
    scheduleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scheduleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    scheduleIcon: {
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
    scheduleDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    scheduleStatus: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '500',
    },
    scheduleActions: {
        flexDirection: 'row',
        gap: 8,
    },
    scheduleActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 4,
    },
    scheduleActionText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#10B981',
    },
    noScheduleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    noScheduleIcon: {
        marginRight: 12,
    },
    noScheduleContent: {
        flex: 1,
    },
    noScheduleText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 2,
    },
    noScheduleSubtext: {
        fontSize: 12,
        color: '#6B7280',
    },
    detailsGrid: {
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        textAlign: 'right',
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
        backgroundColor: '#F1F5F9',
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
        marginTop: 2,
    },
    bottomPadding: {
        height: 100,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3B82F6',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        margin: 16,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        gap: 8,
    },
    actionButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0.1,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
});