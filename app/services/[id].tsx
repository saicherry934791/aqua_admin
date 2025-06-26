// screens/ServiceDetailScreen.tsx
import { apiService } from '@/lib/api/api';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    Linking,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import ActionSheet from 'react-native-actions-sheet';

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
    notes?: string;
    customerEmail?: string;
    estimatedDuration?: number;
    actualDuration?: number;
    materials?: string[];
    cost?: number;
}

const ServiceDetailScreen = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState(false);

    // Mock data for demonstration
    const mockServiceRequest: ServiceRequest = {
        id: 'sr-1',
        customerId: 'cust-1',
        customerName: 'Ravi Teja',
        customerPhone: '+91 9876543210',
        customerEmail: 'ravi.teja@email.com',
        customerAddress: '123, Brigade Road, Hyderabad, Telangana - 500001',
        productId: 'prod-1',
        productName: 'RO Water Purifier Premium',
        orderId: 'order-1',
        type: 'INSTALLATION',
        description: 'New installation required for RO water purifier. Customer prefers morning slot between 10 AM to 12 PM. Ground floor installation with direct water connection available.',
        status: 'SCHEDULED',
        assignedToId: 'agent-1',
        assignedToName: 'Kumar Singh',
        franchiseAreaId: 'area-1',
        franchiseAreaName: 'Hyderabad Central',
        scheduledDate: '2024-06-28T10:00:00Z',
        createdAt: '2024-06-25T10:30:00Z',
        updatedAt: '2024-06-26T15:45:00Z',
        priority: 'HIGH',
        notes: 'Customer requested morning slot. Ensure to carry all necessary tools and spare parts.',
        estimatedDuration: 120,
        materials: ['RO Membrane', 'Pre-filters', 'Tubing', 'Fittings'],
        cost: 15000
    };

    const fetchServiceRequest = async () => {
        setLoading(true);
        try {
            // const result = await apiService.get(`/service-requests/${id}`);
            // setServiceRequest(result?.data || null);

            // Using mock data for now
            setServiceRequest(mockServiceRequest);
        } catch (error) {
            console.error('Failed to fetch service request:', error);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CREATED': return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280', border: '#E5E7EB' };
            case 'ASSIGNED': return { bg: '#F3E8FF', text: '#6B21A8', dot: '#8B5CF6', border: '#C4B5FD' };
            case 'SCHEDULED': return { bg: '#ECFDF5', text: '#047857', dot: '#10B981', border: '#A7F3D0' };
            case 'IN_PROGRESS': return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', border: '#FDE68A' };
            case 'COMPLETED': return { bg: '#D1FAE5', text: '#047857', dot: '#059669', border: '#6EE7B7' };
            case 'CANCELLED': return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444', border: '#FECACA' };
            default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280', border: '#E5E7EB' };
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
        const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
        Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
    };

    const handleDirections = (address: string) => {
        const encodedAddress = encodeURIComponent(address);
        Linking.openURL(`https://maps.google.com/?q=${encodedAddress}`);
    };

    const updateServiceStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            // const result = await apiService.put(`/service-requests/${id}`, { status: newStatus });
            // setServiceRequest(result?.data || serviceRequest);

            // Mock update
            if (serviceRequest) {
                setServiceRequest({
                    ...serviceRequest,
                    status: newStatus as any,
                    updatedAt: new Date().toISOString()
                });
            }

            Alert.alert('Success', `Service request ${newStatus.toLowerCase().replace('_', ' ')}`);
        } catch (error) {
            console.error('Failed to update service request:', error);
            Alert.alert('Error', 'Failed to update service request');
        }
        setUpdating(false);
    };

    const showActionSheet = () => {
        if (!serviceRequest) return;

        const currentStatus = serviceRequest.status;
        let options = ['Cancel'];
        let destructiveButtonIndex = -1;

        // Define available actions based on current status
        switch (currentStatus) {
            case 'CREATED':
                options = ['Assign to Technician', 'Schedule Service', 'Cancel Request', 'Cancel'];
                destructiveButtonIndex = 2;
                break;
            case 'ASSIGNED':
                options = ['Schedule Service', 'Start Service', 'Cancel Request', 'Cancel'];
                destructiveButtonIndex = 2;
                break;
            case 'SCHEDULED':
                options = ['Start Service', 'Reschedule', 'Cancel Request', 'Cancel'];
                destructiveButtonIndex = 2;
                break;
            case 'IN_PROGRESS':
                options = ['Complete Service', 'Pause Service', 'Cancel Request', 'Cancel'];
                destructiveButtonIndex = 2;
                break;
            case 'COMPLETED':
                options = ['Reopen Service', 'Cancel'];
                break;
            case 'CANCELLED':
                options = ['Reopen Service', 'Cancel'];
                break;
        }

        ActionSheet.showActionSheetWithOptions(
            {
                options,
                destructiveButtonIndex,
                cancelButtonIndex: options.length - 1,
                title: 'Update Service Request',
                message: 'Choose an action to update this service request',
            },
            (buttonIndex) => {
                if (buttonIndex === options.length - 1) return; // Cancel

                const selectedOption = options[buttonIndex];

                switch (selectedOption) {
                    case 'Assign to Technician':
                        updateServiceStatus('ASSIGNED');
                        break;
                    case 'Schedule Service':
                        updateServiceStatus('SCHEDULED');
                        break;
                    case 'Start Service':
                        updateServiceStatus('IN_PROGRESS');
                        break;
                    case 'Complete Service':
                        updateServiceStatus('COMPLETED');
                        break;
                    case 'Pause Service':
                        updateServiceStatus('ASSIGNED');
                        break;
                    case 'Cancel Request':
                        Alert.alert(
                            'Confirm Cancellation',
                            'Are you sure you want to cancel this service request?',
                            [
                                { text: 'No', style: 'cancel' },
                                { text: 'Yes', onPress: () => updateServiceStatus('CANCELLED') }
                            ]
                        );
                        break;
                    case 'Reopen Service':
                        updateServiceStatus('CREATED');
                        break;
                    case 'Reschedule':
                        // Handle reschedule logic
                        Alert.alert('Reschedule', 'Reschedule functionality would be implemented here');
                        break;
                }
            }
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
                                    {serviceRequest.status.replace('_', ' ')}
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

                        {serviceRequest.customerEmail && (
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

                        {serviceRequest.assignedToName && (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Assigned To</Text>
                                <Text style={styles.detailValue}>{serviceRequest.assignedToName}</Text>
                            </View>
                        )}

                        {serviceRequest.estimatedDuration && (
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Estimated Duration</Text>
                                <Text style={styles.detailValue}>{serviceRequest.estimatedDuration} minutes</Text>
                            </View>
                        )}

                        {serviceRequest.cost && (
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

                {/* Materials */}
                {serviceRequest.materials && serviceRequest.materials.length > 0 && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Required Materials</Text>
                        <View style={styles.materialsContainer}>
                            {serviceRequest.materials.map((material, index) => (
                                <View key={index} style={styles.materialChip}>
                                    <Text style={styles.materialText}>{material}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Notes */}
                {serviceRequest.notes && (
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Notes</Text>
                        <Text style={styles.notesText}>{serviceRequest.notes}</Text>
                    </View>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Action Button */}
            <TouchableOpacity
                style={[styles.actionButton, updating && styles.actionButtonDisabled]}
                onPress={showActionSheet}
                disabled={updating}
            >
                {updating ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <Ionicons name="options" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Update Service</Text>
                    </>
                )}
            </TouchableOpacity>
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
        fontFamily: 'Outfit_500Medium',
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
        fontFamily: 'Outfit_600SemiBold',
        color: '#EF4444',
        marginTop: 16,
        marginBottom: 8,
    },
    errorSubtitle: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
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
        fontFamily: 'Outfit_500Medium',
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
        fontFamily: 'Outfit_700Bold',
        color: '#111827',
    },
    serviceTypeText: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
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
        fontFamily: 'Outfit_600SemiBold',
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
        fontFamily: 'Outfit_600SemiBold',
        textTransform: 'capitalize',
    },
    productName: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
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
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
        marginBottom: 16,
    },
    customerInfo: {
        gap: 16,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    customerName: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
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
        fontFamily: 'Outfit_400Regular',
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
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        flex: 1,
        lineHeight: 20,
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
        fontFamily: 'Outfit_500Medium',
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
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
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
    },
    timelineDate: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginTop: 2,
    },
    materialsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    materialChip: {
        backgroundColor: '#EEF2FF',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    materialText: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#4F46E5',
    },
    notesText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        lineHeight: 20,
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
        fontFamily: 'Outfit_600SemiBold'
    }
})