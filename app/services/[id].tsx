import { apiService } from '@/lib/api/api';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import { SheetManager } from 'react-native-actions-sheet';

const { width: screenWidth } = Dimensions.get('window');

// Service Request Status enum - matches backend
export enum ServiceStatus {
  CREATED = 'CREATED',
  ASSIGNED = 'ASSIGNED',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ServiceType {
  INSTALLATION = 'installation',
  MAINTENANCE = 'maintenance',
  REPAIR = 'repair',
  REPLACEMENT = 'replacement',
}

interface ServiceRequest {
  id: string;
  customerId: string;
  productId: string;
  type: ServiceType;
  description: string;
  status: ServiceStatus;
  images: string[];
  assignedAgent: {
    id: string;
    name: string;
    phone: string;
  } | null;
  franchiseId: string;
  scheduledDate: string | null;
  beforeImages: string[];
  afterImages: string[];
  requirePayment: boolean;
  paymentAmount: number | null;
  createdAt: string;
  updatedAt: string;
  completedDate?: string;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  product: {
    id: string;
    name: string;
    model: string;
  };
  paymentStatus?: {
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    amount: number;
    method?: string;
    paidDate?: string;
  };
}

export const ServiceRequestDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const { user } = useAuth();

  const statusActionSheetRef = useRef<ActionSheetRef>(null);
  const imageViewerRef = useRef<ActionSheetRef>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const fetchRequestDetails = async () => {
    setLoading(true);
    try {
      const result = await apiService.get(`/service-requests/${id}`);

      console.log('result.data.serviceRequest ', result.data.serviceRequest)
      if (result.success && result.data) {
        setRequest(result.data.serviceRequest);
        setBeforeImages(result.data.serviceRequest.beforeImages || []);
        setAfterImages(result.data.serviceRequest.afterImages || []);
        setPaymentAmount(result.data.serviceRequest.paymentAmount?.toString() || '');
      } else {
        setRequest(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load service request details');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const handleStatusUpdate = async (newStatus: ServiceStatus, additionalData?: any) => {
    if (!request) return;

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);

      if (comment) {
        formData.append('comment', comment);
      }

      // Handle status-specific requirements
      if (newStatus === ServiceStatus.SCHEDULED && additionalData?.scheduledDate) {
        formData.append('scheduledDate', additionalData.scheduledDate);
      }

      if (newStatus === ServiceStatus.IN_PROGRESS) {
        // For installation type, before images are required
        if (request.type === ServiceType.INSTALLATION && beforeImages.length === 0) {
          Alert.alert('Error', 'Before images are required to start installation service');
          setUpdating(false);
          return;
        }

        // Upload before images if any
        beforeImages.forEach((imageUri, index) => {
          if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
            formData.append('beforeImages', {
              uri: imageUri,
              type: 'image/jpeg',
              name: `before_${index}.jpg`,
            } as any);
          }
        });
      }

      if (newStatus === ServiceStatus.PAYMENT_PENDING) {

        if (afterImages.length === 0) {
          Alert.alert('Error', 'After images are required to request payment');
          setUpdating(false);
          return;
        }


        console.log('formData ', formData)

        // Upload after images
        afterImages.forEach((imageUri, index) => {
          if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
            formData.append('afterImages', {
              uri: imageUri,
              type: 'image/jpeg',
              name: `after_${index}.jpg`,
            } as any);
          }
        });
      }

      if (newStatus === ServiceStatus.COMPLETED && request.status !== ServiceStatus.PAYMENT_PENDING) {
        if (afterImages.length === 0) {
          Alert.alert('Error', 'After images are required to complete service');
          setUpdating(false);
          return;
        }

        // Upload after images
        afterImages.forEach((imageUri, index) => {
          if (imageUri.startsWith('file://') || imageUri.startsWith('content://')) {
            formData.append('afterImages', {
              uri: imageUri,
              type: 'image/jpeg',
              name: `after_${index}.jpg`,
            } as any);
          }
        });
      }

      const result = await apiService.patch(`/service-requests/${id}/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (result.success) {
        await fetchRequestDetails();
        statusActionSheetRef.current?.hide();
        setComment('');
        Alert.alert('Success', `Service request status updated to ${getStatusDisplayName(newStatus)}`);
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (error: any) {
      console.log('Failed to update service request status:', error);
      Alert.alert('Error', error.message || 'Failed to update service request status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignAgent = () => {
    SheetManager.show('agent-assignment-sheet', {
      payload: {
        serviceRequestId: id,
        currentAgentId: request?.assignedAgent?.id,
        currentAgentName: request?.assignedAgent?.name,
        onAgentAssigned: (agent: any) => {
          fetchRequestDetails();
        },
      },
    });
  };

  const handleScheduleService = () => {
    SheetManager.show('schedule-time-sheet', {
      payload: {
        serviceRequestId: id,
        currentScheduledDate: request?.scheduledDate,
        onScheduleUpdated: (scheduledDate: string | null) => {
          if (scheduledDate) {
            handleStatusUpdate(ServiceStatus.SCHEDULED, { scheduledDate });
          }
        },
      },
    });
  };

  const pickImages = async (type: 'before' | 'after') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);

        if (type === 'before') {
          setBeforeImages(prev => [...prev, ...newImages]);
        } else {
          setAfterImages(prev => [...prev, ...newImages]);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select images');
    }
  };

  const removeImage = (type: 'before' | 'after', index: number) => {
    if (type === 'before') {
      setBeforeImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setAfterImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const viewImages = (images: string[], startIndex: number = 0) => {
    setSelectedImages(images);
    setSelectedImageIndex(startIndex);
    imageViewerRef.current?.show();
  };

  const handlePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const cleanNumber = phoneNumber?.replace(/[^\d]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
  };

  const createPaymentLink = async () => {
    setUpdating(true);
    try {
      const result = await apiService.post(`/service-requests/${id}/generate-payment-link`);
      if (result.success) {
        Alert.alert('Success', 'Payment link created successfully');
        await fetchRequestDetails(); // Refresh to get updated payment info
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
      console.log('result payment verification ', result)
      if (result.success) {
        Alert.alert('Success', 'Payment status verified');
        await fetchRequestDetails(); // Refresh to get updated payment info
      } else {
        throw new Error(result.error || 'Failed to verify payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify payment status');

    }
    setUpdating(false);
  };

  // Get available status transitions based on current status and user role
  const getAvailableStatusTransitions = (currentStatus: ServiceStatus, userRole: UserRole) => {
    const transitions: ServiceStatus[] = [];

    switch (currentStatus) {
      case ServiceStatus.CREATED:
        if (userRole === UserRole.ADMIN || userRole === UserRole.FRANCHISE_OWNER) {
          transitions.push(ServiceStatus.ASSIGNED);
        }
        transitions.push(ServiceStatus.CANCELLED);
        break;

      case ServiceStatus.ASSIGNED:
        transitions.push(ServiceStatus.SCHEDULED, ServiceStatus.CANCELLED);
        break;

      case ServiceStatus.SCHEDULED:
        transitions.push(ServiceStatus.IN_PROGRESS, ServiceStatus.CANCELLED);
        break;

      case ServiceStatus.IN_PROGRESS:
        transitions.push(ServiceStatus.COMPLETED);
        if (request?.requirePayment) {
          transitions.push(ServiceStatus.PAYMENT_PENDING);
        }
        transitions.push(ServiceStatus.CANCELLED);
        break;

      case ServiceStatus.PAYMENT_PENDING:
        transitions.push(ServiceStatus.COMPLETED, ServiceStatus.CANCELLED);
        break;

      case ServiceStatus.CANCELLED:
        if (userRole === UserRole.ADMIN || userRole === UserRole.FRANCHISE_OWNER) {
          transitions.push(ServiceStatus.ASSIGNED, ServiceStatus.SCHEDULED);
        }
        break;

      default:
        break;
    }

    return transitions;
  };

  // Display name mappings
  const getStatusDisplayName = (status: ServiceStatus): string => {
    switch (status) {
      case ServiceStatus.CREATED: return 'Created';
      case ServiceStatus.ASSIGNED: return 'Assigned';
      case ServiceStatus.SCHEDULED: return 'Scheduled';
      case ServiceStatus.IN_PROGRESS: return 'In Progress';
      case ServiceStatus.PAYMENT_PENDING: return 'Payment Pending';
      case ServiceStatus.COMPLETED: return 'Completed';
      case ServiceStatus.CANCELLED: return 'Cancelled';
      default: return status;
    }
  };

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case ServiceStatus.CREATED: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
      case ServiceStatus.ASSIGNED: return { bg: '#F3E8FF', text: '#6B21A8', dot: '#8B5CF6' };
      case ServiceStatus.SCHEDULED: return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
      case ServiceStatus.IN_PROGRESS: return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' };
      case ServiceStatus.PAYMENT_PENDING: return { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' };
      case ServiceStatus.COMPLETED: return { bg: '#D1FAE5', text: '#047857', dot: '#059669' };
      case ServiceStatus.CANCELLED: return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
    }
  };

  const getServiceTypeIcon = (type: ServiceType) => {
    switch (type) {
      case ServiceType.INSTALLATION: return 'construct';
      case ServiceType.MAINTENANCE: return 'settings';
      case ServiceType.REPAIR: return 'build';
      case ServiceType.REPLACEMENT: return 'swap-horizontal';
      default: return 'cog';
    }
  };

  const getServiceTypeColor = (type: ServiceType) => {
    switch (type) {
      case ServiceType.INSTALLATION: return '#10B981';
      case ServiceType.MAINTENANCE: return '#3B82F6';
      case ServiceType.REPAIR: return '#EF4444';
      case ServiceType.REPLACEMENT: return '#8B5CF6';
      default: return '#6B7280';
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

  const canReassignAgent = () => {
    return user?.role === UserRole.ADMIN;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading service request details...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="support-agent" size={48} color="#9CA3AF" />
        <Text style={styles.errorTitle}>Service Request Not Found</Text>
        <Text style={styles.errorSubtitle}>The service request you're looking for doesn't exist</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColors = getStatusColor(request.status);
  const availableTransitions = getAvailableStatusTransitions(request.status, user?.role || UserRole.SERVICE_AGENT);
  const serviceTypeColor = getServiceTypeColor(request.type);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Service Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.requestHeader}>
            <View style={styles.requestInfo}>
              <View style={styles.serviceTypeContainer}>
                <View style={[styles.serviceTypeIcon, { backgroundColor: serviceTypeColor + '20' }]}>
                  <Ionicons
                    name={getServiceTypeIcon(request.type) as any}
                    size={20}
                    color={serviceTypeColor}
                  />
                </View>
                <View>
                  <Text style={styles.requestId}>#{request.id?.slice(-6)?.toUpperCase()}</Text>
                  <Text style={[styles.serviceType, { color: serviceTypeColor }]}>
                    {request.type.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.requestDate}>{formatDate(request.createdAt)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
            onPress={() => availableTransitions.length > 0 ? statusActionSheetRef.current?.show() : undefined}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {getStatusDisplayName(request.status)}
            </Text>
            {availableTransitions.length > 0 && (
              <Ionicons name="chevron-down" size={12} color={statusColors.text} />
            )}
          </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {request.status === ServiceStatus.CREATED && (user?.role === UserRole.ADMIN || user?.role === UserRole.FRANCHISE_OWNER) && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAssignAgent}
              >
                <Ionicons name="person-add" size={16} color="#8B5CF6" />
                <Text style={styles.actionButtonText}>Assign Agent</Text>
              </TouchableOpacity>
            )}

            {request.status === ServiceStatus.ASSIGNED && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleScheduleService}
              >
                <Ionicons name="calendar" size={16} color="#10B981" />
                <Text style={styles.actionButtonText}>Schedule Service</Text>
              </TouchableOpacity>
            )}

            {request.status === ServiceStatus.SCHEDULED && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleStatusUpdate(ServiceStatus.IN_PROGRESS)}
              >
                <Ionicons name="play" size={16} color="#F59E0B" />
                <Text style={styles.actionButtonText}>Start Service</Text>
              </TouchableOpacity>
            )}

            {request.status === ServiceStatus.IN_PROGRESS && (
              <>
                {request.requirePayment ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryActionButton]}
                    onPress={() => handleStatusUpdate(ServiceStatus.PAYMENT_PENDING)}
                  >
                    <Ionicons name="card" size={16} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Request Payment</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryActionButton]}
                    onPress={() => handleStatusUpdate(ServiceStatus.COMPLETED)}
                  >
                    <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Complete Service</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {request.status === ServiceStatus.PAYMENT_PENDING && (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryActionButton]}
                onPress={() => handleStatusUpdate(ServiceStatus.COMPLETED)}
              >
                <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Mark as Completed</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Service Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Details</Text>
          <View style={styles.serviceSection}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{request.product?.name}</Text>
              <Text style={styles.productModel}>Model: {request.product?.model}</Text>
              <Text style={styles.serviceDescription}>{request.description}</Text>
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
                <Text style={styles.customerName}>{request.customer?.name}</Text>
              </View>
            </View>

            <View style={styles.contactRow}>
              <View style={styles.contactInfo}>
                <Ionicons name="call" size={16} color="#6B7280" />
                <Text style={styles.contactText}>{request.customer?.phone}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handlePhoneCall(request.customer?.phone)}
                >
                  <Ionicons name="call" size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleWhatsApp(request.customer?.phone)}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Assigned Agent */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Assigned Agent</Text>
            {canReassignAgent() && request.assignedAgent && (
              <TouchableOpacity
                style={styles.assignButton}
                onPress={handleAssignAgent}
              >
                <Ionicons name="person-add" size={14} color="#3B82F6" />
                <Text style={styles.assignButtonText}>Reassign</Text>
              </TouchableOpacity>
            )}
          </View>

          {request.assignedAgent ? (
            <View style={styles.agentSection}>
              <View style={styles.agentInfo}>
                <Ionicons name="person-circle" size={20} color="#6B7280" />
                <View style={styles.agentDetails}>
                  <Text style={styles.agentName}>{request.assignedAgent?.name}</Text>
                  <Text style={styles.agentPhone}>{request.assignedAgent?.phone}</Text>
                </View>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handlePhoneCall(request.assignedAgent?.phone || '')}
                >
                  <Ionicons name="call" size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleWhatsApp(request.assignedAgent?.phone || '')}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noAgentSection}>
              <View style={styles.noAgentIcon}>
                <Ionicons name="person-add" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.noAgentText}>No agent assigned yet</Text>
              {(user?.role === UserRole.ADMIN || user?.role === UserRole.FRANCHISE_OWNER) && (
                <TouchableOpacity
                  style={styles.assignAgentButton}
                  onPress={handleAssignAgent}
                >
                  <Text style={styles.assignAgentButtonText}>Assign Agent</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Schedule Details */}
        {request.scheduledDate && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Schedule Details</Text>
            <View style={styles.scheduleSection}>
              <View style={styles.scheduleRow}>
                <Ionicons name="calendar" size={20} color="#10B981" />
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleLabel}>Scheduled Date</Text>
                  <Text style={styles.scheduleDate}>{formatDate(request.scheduledDate)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Payment Information */}
        {(request.requirePayment || request.paymentAmount) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment Information</Text>
            <View style={styles.paymentSection}>
              {request.paymentAmount && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Amount:</Text>
                  <Text style={styles.paymentValue}>{formatCurrency(request.paymentAmount)}</Text>
                </View>
              )}

              {request.paymentStatus && (
                <View style={styles.paymentStatusRow}>
                  <Text style={styles.paymentLabel}>Status:</Text>
                  <View style={[styles.paymentStatusBadge, {
                    backgroundColor:
                      request.paymentStatus.status === 'COMPLETED' ? '#D1FAE5' :
                        request.paymentStatus.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                  }]}>
                    <Text style={[styles.paymentStatusText, {
                      color:
                        request.paymentStatus.status === 'COMPLETED' ? '#047857' :
                          request.paymentStatus.status === 'PENDING' ? '#92400E' : '#B91C1C'
                    }]}>
                      {request.paymentStatus.status}
                    </Text>
                  </View>
                </View>
              )}






            </View>
          </View>
        )}


        {/* Payment Status (if payment required) */}
        {request.requirePayment && request.paymentStatus && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Information</Text>

            <View style={styles.paymentInfo}>
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Status</Text>
                <Text style={[
                  styles.paymentValue,
                  request?.paymentStatus?.status === 'PAID' ? styles.paymentPaid :
                  request?.paymentStatus?.status === 'FAILED' ? styles.paymentFailed : styles.paymentPending
                ]}>
                  {request.paymentStatus.status}
                </Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Amount</Text>
                <Text style={styles.paymentAmount}>₹{request.paymentStatus.amount.toLocaleString()}</Text>
              </View>

              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Method</Text>
                <Text style={styles.paymentAmount}>{request.paymentStatus.method}</Text>
              </View>

              {request.paymentStatus.paidDate && (
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Paid Date</Text>
                  <Text style={styles.paymentAmount}>{formatDate(request.paymentStatus.paidDate)}</Text>
                </View>
              )}
            </View>

            {/* Payment Actions */}
            {request.status === ServiceStatus.PAYMENT_PENDING && (
              <View style={styles.paymentActions}>
                {!request.paymentStatus.razorpayPaymentLink && (
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
                  (request.paymentStatus.razorpaySubscriptionId && request.paymentStatus.razorpayPaymentLink) && (
                    <View style={styles.paymentRow}>
                      <Text style={styles.paymentLabel}>Payment Link</Text>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(request.paymentStatus.razorpayPaymentLink)}
                      >
                        <Text style={styles.paymentAmount}>
                          {request.paymentStatus.razorpayPaymentLink}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )
                }

                {(request.paymentStatus.razorpaySubscriptionId && request.paymentStatus.razorpayPaymentLink) && (
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


        {/* Service Images */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Images</Text>

          {/* Initial Images */}
          {request.images && request.images.length > 0 && (
            <View style={styles.imageSection}>
              <Text style={styles.imageSectionTitle}>Initial Images</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.imageGrid}>
                  {request.images.map((imageUri, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.imageContainer}
                      onPress={() => viewImages(request.images, index)}
                    >
                      <Image source={{ uri: imageUri }} style={styles.serviceImage} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Before Images */}
          {(request.type === ServiceType.INSTALLATION || beforeImages.length > 0) && (
            <View style={styles.imageSection}>
              <View style={styles.imageSectionHeader}>
                <Text style={styles.imageSectionTitle}>Before Service</Text>
                {request.status === ServiceStatus.SCHEDULED && (
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={() => pickImages('before')}
                  >
                    <Ionicons name="camera" size={16} color="#3B82F6" />
                    <Text style={styles.addImageText}>Add Photos</Text>
                  </TouchableOpacity>
                )}
              </View>

              {beforeImages.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.imageGrid}>
                    {beforeImages.map((imageUri, index) => (
                      <View key={index} style={styles.imageContainer}>
                        <TouchableOpacity onPress={() => viewImages(beforeImages, index)}>
                          <Image source={{ uri: imageUri }} style={styles.serviceImage} />
                        </TouchableOpacity>
                        {request.status === ServiceStatus.SCHEDULED && (
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => removeImage('before', index)}
                          >
                            <Ionicons name="close" size={12} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              ) : request.type === ServiceType.INSTALLATION && request.status === ServiceStatus.SCHEDULED ? (
                <View style={styles.noImagesContainer}>
                  <Ionicons name="camera" size={32} color="#9CA3AF" />
                  <Text style={styles.noImagesText}>Before images required for installation</Text>
                  <TouchableOpacity
                    style={styles.addFirstImageButton}
                    onPress={() => pickImages('before')}
                  >
                    <Text style={styles.addFirstImageText}>Add Before Photos</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          )}

          {/* After Images */}
          {(request.status === ServiceStatus.IN_PROGRESS ||
            request.status === ServiceStatus.PAYMENT_PENDING ||
            request.status === ServiceStatus.COMPLETED ||
            afterImages.length > 0) && (
              <View style={styles.imageSection}>
                <View style={styles.imageSectionHeader}>
                  <Text style={styles.imageSectionTitle}>After Service</Text>
                  {request.status === ServiceStatus.IN_PROGRESS && (
                    <TouchableOpacity
                      style={styles.addImageButton}
                      onPress={() => pickImages('after')}
                    >
                      <Ionicons name="camera" size={16} color="#3B82F6" />
                      <Text style={styles.addImageText}>Add Photos</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {afterImages.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.imageGrid}>
                      {afterImages.map((imageUri, index) => (
                        <View key={index} style={styles.imageContainer}>
                          <TouchableOpacity onPress={() => viewImages(afterImages, index)}>
                            <Image source={{ uri: imageUri }} style={styles.serviceImage} />
                          </TouchableOpacity>
                          {request.status === ServiceStatus.IN_PROGRESS && (
                            <TouchableOpacity
                              style={styles.removeImageButton}
                              onPress={() => removeImage('after', index)}
                            >
                              <Ionicons name="close" size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                ) : request.status === ServiceStatus.IN_PROGRESS ? (
                  <View style={styles.noImagesContainer}>
                    <Ionicons name="camera" size={32} color="#9CA3AF" />
                    <Text style={styles.noImagesText}>After images required to complete service</Text>
                    <TouchableOpacity
                      style={styles.addFirstImageButton}
                      onPress={() => pickImages('after')}
                    >
                      <Text style={styles.addFirstImageText}>Add After Photos</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}
        </View>
      </ScrollView>

      {/* Status Update Action Sheet */}
      <ActionSheet ref={statusActionSheetRef}>
        <View style={styles.actionSheetContent}>
          <Text style={styles.actionSheetTitle}>Update Service Status</Text>

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
              disabled={updating}
            >
              <Ionicons name="arrow-forward" size={20} color="#374151" />
              <Text style={styles.actionSheetOptionText}>{getStatusDisplayName(status)}</Text>
              {updating && <ActivityIndicator size="small" color="#3B82F6" />}
            </TouchableOpacity>
          ))}
        </View>
      </ActionSheet>

      {/* Image Viewer Action Sheet */}
      <ActionSheet ref={imageViewerRef}>
        <View style={styles.imageViewerContent}>
          <View style={styles.imageViewerHeader}>
            <Text style={styles.imageViewerTitle}>
              Image {selectedImageIndex + 1} of {selectedImages.length}
            </Text>
            <TouchableOpacity
              style={styles.closeImageButton}
              onPress={() => imageViewerRef.current?.hide()}
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedImages.length > 0 && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                setSelectedImageIndex(index);
              }}
            >
              {selectedImages.map((imageUri, index) => (
                <View key={index} style={styles.fullImageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.fullImage} resizeMode="contain" />
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.imageNavigation}>
            {selectedImages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.imageIndicator,
                  index === selectedImageIndex && styles.activeImageIndicator
                ]}
              />
            ))}
          </View>
        </View>
      </ActionSheet>
    </View>
  );
};

export default ServiceRequestDetailsScreen;

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
    marginTop: 16,
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
    flex: 1,
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestId: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  serviceType: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
    marginLeft: 4,
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
  serviceSection: {
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
  productModel: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  serviceDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#374151',
    lineHeight: 20,
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
  agentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  agentDetails: {
    marginLeft: 8,
  },
  agentName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  agentPhone: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  noAgentSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAgentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  noAgentText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  assignAgentButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  assignAgentButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
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
  paymentSection: {
    gap: 12,
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
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  paymentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  paymentInputSection: {
    marginTop: 8,
  },
  paymentInputLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
    marginBottom: 8,
  },
  paymentInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    backgroundColor: '#FFFFFF',
  },
  imageSection: {
    marginBottom: 20,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageSectionTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#374151',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addImageText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#3B82F6',
    marginLeft: 4,
  },
  imageGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  serviceImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImagesContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  noImagesText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 12,
  },
  addFirstImageButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addFirstImageText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
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
  commentInput: {
    height: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    fontFamily: 'Outfit_400Regular',
  },
  imageViewerContent: {
    height: screenWidth * 1.2,
    backgroundColor: '#000000',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  imageViewerTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
  },
  closeImageButton: {
    padding: 4,
  },
  fullImageContainer: {
    width: screenWidth,
    height: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  imageNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeImageIndicator: {
    backgroundColor: '#FFFFFF',
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
});

