import { apiService } from '@/lib/api/api';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';

// Installation Request Status enum - matches backend
export enum InstallationStatus {
  SUBMITTED = 'SUBMITTED',
  FRANCHISE_CONTACTED = 'FRANCHISE_CONTACTED',
  INSTALLATION_SCHEDULED = 'INSTALLATION_SCHEDULED',
  INSTALLATION_IN_PROGRESS = 'INSTALLATION_IN_PROGRESS',
  INSTALLATION_COMPLETED = 'INSTALLATION_COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

interface ActionHistory {
  id: string;
  actionType: string;
  comment: string | null;
  createdAt: string;
  fromStatus: string | null;
  toStatus: string;
  performedBy: string;
  performedByRole: string;
  metadata: string | null;
}

interface PaymentStatus {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  method?: string;
  paidDate?: string;
  razorpayOrderId?: string;
  razorpayPaymentLink?: string;
  razorpaySubscriptionId?: string;
}

interface InstallationRequest {
  id: string;
  productId: string;
  customerId: string;
  orderType: 'RENTAL' | 'PURCHASE';
  name: string;
  phoneNumber: string;
  franchiseId: string;
  franchiseName: string;
  status: InstallationStatus;
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
  actionHistory: ActionHistory[];
  razorpayOrderId?: string;
}

interface ServiceAgent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  isPrimary: boolean;
  isActive: boolean;
  assignedDate: string;
}

export const InstallationRequestDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const [request, setRequest] = useState<InstallationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceAgents, setServiceAgents] = useState<ServiceAgent[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [comment, setComment] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const { user } = useAuth();

  const statusActionSheetRef = useRef<ActionSheetRef>(null);
  const agentActionSheetRef = useRef<ActionSheetRef>(null);
  const rejectActionSheetRef = useRef<ActionSheetRef>(null);
  const cancelActionSheetRef = useRef<ActionSheetRef>(null);
  const serviceRequestActionSheetRef = useRef<ActionSheetRef>(null);

  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const result = await apiService.get(`/installation-requests/${id}`);
      
      if (result.success && result.data) {
        console.log('result.data.installationRequest ',result.data.installationRequest)
        setRequest(result.data.installationRequest);
        
        // Check if payment status is available
        if (result.data.paymentStatus) {
          setPaymentStatus({
            status: result.data.paymentStatus.status || 'PENDING',
            amount: result.data.installationRequest.orderType === 'RENTAL' 
              ? result.data.installationRequest.product.deposit || 0 
              : result.data.installationRequest.product.buyPrice || 0,
            method: result.data.paymentStatus.method,
            paidDate: result.data.paymentStatus.paidDate,
            razorpayOrderId: result.data.paymentStatus.razorpayOrderId,
            razorpayPaymentLink: result.data.paymentStatus.razorpayPaymentLink,
            razorpaySubscriptionId: result.data.paymentStatus.razorpaySubscriptionId
          });
        } else {
          setPaymentStatus(null);
        }
      } else {
        setRequest(null);
        setPaymentStatus(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load request details');
    }
    setLoading(false);
  };

  const fetchServiceAgents = async () => {
    if (!request?.franchiseId) return;

    try {
      console.log('Fetching service agents for franchise:', request.franchiseId);
      const result = await apiService.get(`/agents`);
      console.log('Available service agents:', result);

      if (result && Array.isArray(result.data)) {
        setServiceAgents(result.data);
      }
    } catch (error) {
      console.log('Failed to fetch service agents:', error);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  useEffect(() => {
    if (request?.franchiseId) {
      fetchServiceAgents();
    }
  }, [request?.franchiseId]);

  const handleStatusUpdate = async (newStatus: InstallationStatus, additionalData?: any) => {
    try {
      const payload: any = {
        status: newStatus,
        ...(comment && { comment }),
        ...additionalData
      };

      const result = await apiService.patch(`/installation-requests/${id}/status`, payload);

      await fetchRequestDetails();
      statusActionSheetRef.current?.hide();
      Alert.alert('Success', `Request status updated to ${getStatusDisplayName(newStatus)}`);
    } catch (error) {
      console.log('Failed to update request status:', error);
      Alert.alert('Error', 'Failed to update request status');
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      await handleStatusUpdate(InstallationStatus.REJECTED, { rejectionReason });
      rejectActionSheetRef.current?.hide();
      setRejectionReason('');
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  const handleCancelRequest = async () => {
    if (!cancellationReason.trim()) {
      Alert.alert('Error', 'Please provide a cancellation reason');
      return;
    }

    try {
      await handleStatusUpdate(InstallationStatus.CANCELLED, { cancellationReason });
      cancelActionSheetRef.current?.hide();
      setCancellationReason('');
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel request');
    }
  };

  const createInstallationSchedule = async (agentId?: string, scheduledDateTime?: Date) => {
    try {
      const payload: any = {
        installationRequestId: id,
        assignedToId: agentId,
        scheduledDate: scheduledDateTime ? scheduledDateTime.toISOString() : new Date().toISOString(),
        description: `${user?.profile?.name || 'Admin'} scheduled installation`
      };

      const result = await apiService.post('/service-requests/installation', payload);
      console.log('Installation scheduled:', result);
      await fetchRequestDetails();
      agentActionSheetRef.current?.hide();
      Alert.alert('Success', 'Installation scheduled successfully');
    } catch (error) {
      console.log('Failed to schedule installation:', error);
      Alert.alert('Error', 'Failed to schedule installation');
    }
  };

  const handleAgentAssignment = async (agentId: string, agentName: string) => {
    try {
      await createInstallationSchedule(agentId, scheduledDate);
    } catch (error) {
      console.log('Failed to assign agent:', error);
      Alert.alert('Error', 'Failed to assign agent');
    }
  };

  const handlePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const cleanNumber = phoneNumber?.replace(/[^\d]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
  };

  const handleCompleteInstallation = () => {
    router.push(`/orders/${id}/complete`);
  };



  // Get available status transitions based on current status
  const getAvailableStatusTransitions = (currentStatus: InstallationStatus) => {
    switch (currentStatus) {
      case InstallationStatus.SUBMITTED:
        return [
          InstallationStatus.FRANCHISE_CONTACTED,
          InstallationStatus.REJECTED
        ];
      case InstallationStatus.FRANCHISE_CONTACTED:
        return [
          InstallationStatus.INSTALLATION_SCHEDULED,
          InstallationStatus.CANCELLED
        ];
      case InstallationStatus.INSTALLATION_SCHEDULED:
        return [
          InstallationStatus.INSTALLATION_IN_PROGRESS,
          InstallationStatus.CANCELLED
        ];
      case InstallationStatus.INSTALLATION_IN_PROGRESS:
        return [
          InstallationStatus.INSTALLATION_COMPLETED,
          InstallationStatus.CANCELLED
        ];
      case InstallationStatus.CANCELLED:
        return [
          InstallationStatus.FRANCHISE_CONTACTED,
          InstallationStatus.INSTALLATION_SCHEDULED,
          InstallationStatus.INSTALLATION_IN_PROGRESS
        ];
      default:
        return [];
    }
  };

  // Display name mappings
  const getStatusDisplayName = (status: InstallationStatus): string => {
    switch (status) {
      case InstallationStatus.SUBMITTED: return 'Submitted';
      case InstallationStatus.FRANCHISE_CONTACTED: return 'Franchise Contacted';
      case InstallationStatus.INSTALLATION_SCHEDULED: return 'Scheduled';
      case InstallationStatus.INSTALLATION_IN_PROGRESS: return 'In Progress';
      case InstallationStatus.INSTALLATION_COMPLETED: return 'Completed';
      case InstallationStatus.CANCELLED: return 'Cancelled';
      case InstallationStatus.REJECTED: return 'Rejected';
      default: return status;
    }
  };

  const getStatusColor = (status: InstallationStatus) => {
    switch (status) {
      case InstallationStatus.SUBMITTED: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
      case InstallationStatus.FRANCHISE_CONTACTED: return { bg: '#F3E8FF', text: '#6B21A8', dot: '#8B5CF6' };
      case InstallationStatus.INSTALLATION_SCHEDULED: return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' };
      case InstallationStatus.INSTALLATION_IN_PROGRESS: return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
      case InstallationStatus.INSTALLATION_COMPLETED: return { bg: '#D1FAE5', text: '#047857', dot: '#059669' };
      case InstallationStatus.CANCELLED: return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      case InstallationStatus.REJECTED: return { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626' };
      default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount?.toLocaleString('en-IN')}`;
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

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setScheduledDate(selectedDate);
      if (Platform.OS === 'android') {
        // Show time picker after date is selected on Android
        setShowTimePicker(true);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    
    if (selectedTime) {
      const newDateTime = new Date(scheduledDate);
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      setScheduledDate(newDateTime);
    }
  };

  const getPriceForOrderType = (request: InstallationRequest) => {
    return request.orderType === 'RENTAL' ? request.product?.rentPrice : request.product?.buyPrice;
  };

  console.log('user is installation request is ',user)

  const getActionTypeDisplayName = (actionType: string) => {
    switch (actionType) {
      case 'INSTALLATION_REQUEST_SUBMITTED': return 'Request Submitted';
      case 'INSTALLATION_REQUEST_CONTACTED': return 'Franchise Contacted';
      case 'INSTALLATION_REQUEST_SCHEDULED': return 'Installation Scheduled';
      case 'INSTALLATION_REQUEST_IN_PROGRESS': return 'Installation Started';
      case 'INSTALLATION_REQUEST_COMPLETED': return 'Installation Completed';
      case 'INSTALLATION_REQUEST_CANCELLED': return 'Request Cancelled';
      case 'INSTALLATION_REQUEST_REJECTED': return 'Request Rejected';
      default: return actionType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading request details...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="build" size={48} color="#9CA3AF" />
        <Text style={styles.errorTitle}>Request Not Found</Text>
        <Text style={styles.errorSubtitle}>The installation request you&apos;re looking for doesn&apos;t exist</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColors = getStatusColor(request.status);
  const availableTransitions = getAvailableStatusTransitions(request.status);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Request Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.requestHeader}>
            <View style={styles.requestInfo}>
              <Text style={styles.requestId}>#{request.id?.slice(-6)?.toUpperCase()}</Text>
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
            <Text style={styles.requestDate}>{formatDate(request.createdAt)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
            onPress={() => user?.role !== UserRole.SERVICE_AGENT ? statusActionSheetRef.current?.show() : undefined}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {getStatusDisplayName(request.status)}
            </Text>
            {user?.role !== UserRole.SERVICE_AGENT && availableTransitions.length > 0 && (
              <Ionicons name="chevron-down" size={12} color={statusColors.text} />
            )}
          </TouchableOpacity>
           
          {/* Quick Actions */}
          {user?.role !== UserRole.SERVICE_AGENT && (
            <View style={styles.quickActions}>
              {request.status === InstallationStatus.SUBMITTED && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusUpdate(InstallationStatus.FRANCHISE_CONTACTED)}
                  >
                    <Ionicons name="call" size={16} color="#3B82F6" />
                    <Text style={styles.actionButtonText}>Contact Franchise</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerActionButton]}
                    onPress={() => rejectActionSheetRef.current?.show()}
                  >
                    <Ionicons name="close" size={16} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}

              {request.status === InstallationStatus.FRANCHISE_CONTACTED && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => agentActionSheetRef.current?.show()}
                  >
                    <Ionicons name="person-add" size={16} color="#10B981" />
                    <Text style={styles.actionButtonText}>Schedule Installation</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerActionButton]}
                    onPress={() => cancelActionSheetRef.current?.show()}
                  >
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}

              {request.status === InstallationStatus.INSTALLATION_SCHEDULED && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusUpdate(InstallationStatus.INSTALLATION_IN_PROGRESS)}
                  >
                    <Ionicons name="construct" size={16} color="#F59E0B" />
                    <Text style={styles.actionButtonText}>Start Installation</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerActionButton]}
                    onPress={() => cancelActionSheetRef.current?.show()}
                  >
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}

              {request.status === InstallationStatus.INSTALLATION_IN_PROGRESS && (
                <>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryActionButton]}
                    onPress={handleCompleteInstallation}
                  >
                    <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Complete Installation</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.dangerActionButton]}
                    onPress={() => cancelActionSheetRef.current?.show()}
                  >
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel</Text>
                  </TouchableOpacity>
                 
                 
                </>
              )}

              {request.status === InstallationStatus.CANCELLED && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStatusUpdate(InstallationStatus.FRANCHISE_CONTACTED)}
                  >
                    <Ionicons name="refresh" size={16} color="#10B981" />
                    <Text style={styles.actionButtonText}>Reactivate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => agentActionSheetRef.current?.show()}
                  >
                    <Ionicons name="calendar" size={16} color="#F59E0B" />
                    <Text style={styles.actionButtonText}>Reschedule</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {/* Product Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Details</Text>
          <View style={styles.productSection}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{request.product?.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  {request.orderType === 'RENTAL' ? 'Rental Price:' : 'Purchase Price:'}
                </Text>
                <Text style={styles.priceValue}>{formatCurrency(getPriceForOrderType(request))}</Text>
              </View>
              {request.product?.deposit > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Deposit:</Text>
                  <Text style={styles.depositValue}>{formatCurrency(request.product.deposit)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Details</Text>
          <View style={styles.customerSection}>
            <View style={styles.customerInfo}>
              <View style={styles.customerNameRow}>
                <Ionicons name="person" size={20} color="#6B7280" />
                <Text style={styles.customerName}>{request.customer?.name || request.name}</Text>
              </View>
            </View>

            <View style={styles.contactRow}>
              <View style={styles.contactInfo}>
                <Ionicons name="call" size={16} color="#6B7280" />
                <Text style={styles.contactText}>{request.customer?.phone || request.phoneNumber}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handlePhoneCall(request.customer?.phone || request.phoneNumber)}
                >
                  <Ionicons name="call" size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleWhatsApp(request.customer?.phone || request.phoneNumber)}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.addressInfo}>
              <Ionicons name="location" size={16} color="#6B7280" />
              <Text style={styles.addressText}>{request.installationAddress}</Text>
            </View>
          </View>
        </View>
        
        {/* Payment Status */}
        {paymentStatus && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Status</Text>
            <View style={styles.paymentSection}>
              <View style={[styles.paymentStatusBadge, {
                backgroundColor: 
                  paymentStatus.status === 'COMPLETED' ? '#D1FAE5' :
                  paymentStatus.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
              }]}>
                <View style={[styles.statusDot, { 
                  backgroundColor: 
                    paymentStatus.status === 'COMPLETED' ? '#059669' :
                    paymentStatus.status === 'PENDING' ? '#D97706' : '#DC2626'
                }]} />
                <Text style={[styles.paymentStatusText, {
                  color: 
                    paymentStatus.status === 'COMPLETED' ? '#047857' :
                    paymentStatus.status === 'PENDING' ? '#92400E' : '#B91C1C'
                }]}>
                  {paymentStatus.status}
                </Text>
              </View>
              
              <View style={styles.paymentDetails}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Amount:</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(paymentStatus.amount)}</Text>
                </View>
                
                {paymentStatus.method && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Method:</Text>
                    <Text style={styles.paymentValue}>{paymentStatus.method}</Text>
                  </View>
                )}
                
                {paymentStatus.paidDate && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Paid On:</Text>
                    <Text style={styles.paymentValue}>{formatDate(paymentStatus.paidDate)}</Text>
                  </View>
                )}
                
                {paymentStatus.razorpayOrderId && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Order ID:</Text>
                    <Text style={styles.paymentValue}>{paymentStatus.razorpayOrderId}</Text>
                  </View>
                )}
                
               
                
                {paymentStatus.razorpaySubscriptionId && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Subscription ID:</Text>
                    <Text style={styles.paymentValue}>{paymentStatus.razorpaySubscriptionId}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Franchise Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Franchise Details</Text>
          <View style={styles.franchiseSection}>
            <View style={styles.franchiseInfo}>
              <Ionicons name="business" size={20} color="#6B7280" />
              <View style={styles.franchiseDetails}>
                <Text style={styles.franchiseName}>{request.franchise?.name}</Text>
                <Text style={styles.franchiseCity}>{request.franchise?.city}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Assigned Technician */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Assigned Technician</Text>
            {user?.role !== UserRole.SERVICE_AGENT && request.status === InstallationStatus.FRANCHISE_CONTACTED && (
              <TouchableOpacity
                style={styles.assignButton}
                onPress={() => agentActionSheetRef.current?.show()}
              >
                <Ionicons name="person-add" size={14} color="#3B82F6" />
                <Text style={styles.assignButtonText}>
                  {request.assignedTechnician ? 'Change' : 'Assign'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {request.assignedTechnician ? (
            <View style={styles.technicianSection}>
              <View style={styles.technicianInfo}>
                <Ionicons name="person-circle" size={20} color="#6B7280" />
                <Text style={styles.technicianName}>{request.assignedTechnician?.name}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noTechnicianSection}>
              <View style={styles.noTechnicianIcon}>
                <Ionicons name="person-add" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.noTechnicianText}>No technician assigned yet</Text>
            </View>
          )}
        </View>

        {/* Schedule Details */}
        {request.scheduledDate && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Schedule Details</Text>
            <View style={styles.scheduleSection}>
              <View style={styles.scheduleRow}>
                <Ionicons name="calendar" size={20} color="#F59E0B" />
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleLabel}>Scheduled Date</Text>
                  <Text style={styles.scheduleDate}>{formatDate(request.scheduledDate)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Rejection Reason */}
        {request.rejectionReason && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rejection Reason</Text>
            <View style={styles.rejectionSection}>
              <Ionicons name="warning" size={20} color="#EF4444" />
              <Text style={styles.rejectionText}>{request.rejectionReason}</Text>
            </View>
          </View>
        )}

        {/* Action History */}
        {request.actionHistory && request.actionHistory.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Action History</Text>
            <View style={styles.actionHistorySection}>
              {request.actionHistory.map((action, index) => (
                <View key={action.id} style={styles.actionHistoryItem}>
                  <View style={styles.actionHistoryHeader}>
                    <Text style={styles.actionHistoryAction}>
                      {getActionTypeDisplayName(action.actionType)}
                    </Text>
                    <Text style={styles.actionHistoryDate}>
                      {formatDate(action.createdAt)}
                    </Text>
                  </View>
                  
                  <View style={styles.actionHistoryDetails}>
                    <Text style={styles.actionHistoryRole}>
                      by {action.performedByRole}
                    </Text>
                    {action.fromStatus && (
                      <Text style={styles.actionHistoryStatus}>
                        {getStatusDisplayName(action.fromStatus as InstallationStatus)} → {getStatusDisplayName(action.toStatus as InstallationStatus)}
                      </Text>
                    )}
                  </View>
                  
                  {action.comment && (
                    <Text style={styles.actionHistoryComment}>{action.comment}</Text>
                  )}
                  
                  {index < request.actionHistory.length - 1 && (
                    <View style={styles.actionHistoryDivider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Sheets */}

      {/* Status Update Action Sheet */}
      <ActionSheet ref={statusActionSheetRef}>
        <View style={styles.actionSheetContent}>
          <Text style={styles.actionSheetTitle}>Update Request Status</Text>

          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment (optional)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />

          {availableTransitions.map((status) => (
            <TouchableOpacity
              key={status}
              style={styles.actionSheetOption}
              onPress={() => handleStatusUpdate(status)}
            >
              <Ionicons name="arrow-forward" size={20} color="#374151" />
              <Text style={styles.actionSheetOptionText}>{getStatusDisplayName(status)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ActionSheet>

      {/* Agent Assignment Action Sheet */}
      <ActionSheet ref={agentActionSheetRef}
        snapPoints={[70, 90]}
        initialSnapIndex={0}
        gestureEnabled={true}
        closeOnTouchBackdrop={true}
        containerStyle={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          minHeight: Dimensions.get('window').height * 0.7,
        }}
        drawUnderStatusBar={false}
        statusBarTranslucent={false}
        defaultOverlayOpacity={0.3}>
        <View style={styles.actionSheetContent}>
          <Text style={styles.actionSheetTitle}>Schedule Installation</Text>

          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerLabel}>Scheduled Date & Time</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#6B7280" />
              <Text style={styles.datePickerText}>
                {formatDateForDisplay(scheduledDate)}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {showTimePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={scheduledDate}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.timePickerButton}
              onPress={() => setShowTimePicker(!showTimePicker)}
            >
              <Ionicons name="time" size={20} color="#6B7280" />
              <Text style={styles.datePickerText}>
                {showTimePicker ? 'Hide Time Picker' : 'Set Time'}
              </Text>
            </TouchableOpacity>
          )}

          {showTimePicker && Platform.OS === 'ios' && (
            <DateTimePicker
              value={scheduledDate}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
            />
          )}
         

          {serviceAgents && serviceAgents.map((agent) => (
            <TouchableOpacity
              key={agent.id}
              style={[
                styles.actionSheetOption,
                request.assignedTechnicianId === agent.id && styles.activeOption
              ]}
              onPress={() => handleAgentAssignment(agent.id, agent.name)}
            >
              <Ionicons name="person-circle" size={20} color="#374151" />
              <View style={styles.agentOptionInfo}>
                <Text style={styles.actionSheetOptionText}>{agent.name}</Text>
                <Text style={styles.agentOptionPhone}>{agent.phone}</Text>
                <Text style={styles.agentOptionRole}>{agent.role} {agent.isPrimary ? '(Primary)' : ''}</Text>
              </View>
              {request.assignedTechnicianId === agent.id && (
                <Ionicons name="checkmark" size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ActionSheet>

      {/* Reject Request Action Sheet */}
      <ActionSheet ref={rejectActionSheetRef}>
        <View style={styles.actionSheetContent}>
          <Text style={styles.actionSheetTitle}>Reject Request</Text>
          <Text style={styles.actionSheetSubtitle}>Please provide a reason for rejection</Text>

          <TextInput
            style={styles.rejectionInput}
            placeholder="Rejection reason"
            value={rejectionReason}
            onChangeText={setRejectionReason}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.submitButton, styles.dangerSubmitButton]}
            onPress={handleRejectRequest}
          >
            <Text style={styles.submitButtonText}>Reject Request</Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>

      {/* Cancel Request Action Sheet */}
      <ActionSheet ref={cancelActionSheetRef}>
        <View style={styles.actionSheetContent}>
          <Text style={styles.actionSheetTitle}>Cancel Request</Text>
          <Text style={styles.actionSheetSubtitle}>Please provide a reason for cancellation</Text>

          <TextInput
            style={styles.rejectionInput}
            placeholder="Cancellation reason"
            value={cancellationReason}
            onChangeText={setCancellationReason}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.submitButton, styles.dangerSubmitButton]}
            onPress={handleCancelRequest}
          >
            <Text style={styles.submitButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>
    </View>
  );
};

export default InstallationRequestDetailsScreen;

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
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
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
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestId: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginRight: 12,
  },
  orderTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  orderTypeText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  requestDate: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    marginRight: 4,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  primaryActionButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  dangerActionButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
    marginLeft: 4,
  },
  paymentSection: {
    gap: 16,
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  paymentStatusText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
  },
  paymentDetails: {
    gap: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  assignButtonText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#3B82F6',
    marginLeft: 4,
  },
  productSection: {
    gap: 12,
  },
  productInfo: {
    gap: 8,
  },
  productName: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  depositValue: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#F59E0B',
  },
  customerSection: {
    gap: 12,
  },
  customerInfo: {
    gap: 8,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  franchiseSection: {
    gap: 12,
  },
  franchiseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  franchiseDetails: {
    marginLeft: 8,
  },
  franchiseName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  franchiseCity: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  technicianSection: {
    gap: 12,
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  technicianName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  noTechnicianSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noTechnicianIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  noTechnicianText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  scheduleSection: {
    gap: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleInfo: {
    marginLeft: 12,
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  scheduleDate: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  rejectionSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rejectionText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
  actionHistorySection: {
    gap: 16,
  },
  actionHistoryItem: {
    gap: 8,
  },
  actionHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  actionHistoryAction: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    flex: 1,
  },
  actionHistoryDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  actionHistoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionHistoryRole: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#8B5CF6',
    textTransform: 'capitalize',
  },
  actionHistoryStatus: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  actionHistoryComment: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#374151',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionHistoryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 8,
  },
  actionSheetContent: {
    padding: 16,
    gap: 12,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  actionSheetSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  actionSheetOptionText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
    flex: 1,
  },
  activeOption: {
    backgroundColor: '#F1F5F9',
  },
  agentOptionInfo: {
    flex: 1,
  },
  agentOptionPhone: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  agentOptionRole: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  commentInput: {
    height: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  datePickerLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#374151',
    marginLeft: 8,
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  rejectionInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
  },
  dangerSubmitButton: {
    backgroundColor: '#EF4444',
  },
});