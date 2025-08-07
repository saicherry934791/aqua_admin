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
  Modal,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import { SheetManager } from 'react-native-actions-sheet';


import { ServiceRequest, ServiceRequestStatus, ServiceType } from '@/lib/types/ServiceRequest';
import { ServiceStatusTransitions } from '@/lib/components/ServiceStatusTransitions';
import { ServiceImageManager } from '@/lib/components/ServiceImageManager';
import {
  getStatusDisplayName,
  getStatusColor,
  getServiceTypeIcon,
  getServiceTypeColor,
  formatCurrency,
  formatDate,
} from '@/lib/utils/serviceRequestUtils';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { apiService } from '@/lib/api/api';

const { width: screenWidth } = Dimensions.get('window');

export const ServiceRequestDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [comment, setComment] = useState('');
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const { user } = useAuth();
  const [showQR, setShowQR] = useState(false);

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

  const handleStatusUpdate = async (newStatus: ServiceRequestStatus, additionalData?: any) => {
    if (!request) return;

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);

      if (comment) {
        formData.append('comment', comment);
      }

      // Handle status-specific requirements
      if (newStatus === ServiceRequestStatus.SCHEDULED && additionalData?.scheduledDate) {
        formData.append('scheduledDate', additionalData.scheduledDate);
      }

      if (newStatus === ServiceRequestStatus.IN_PROGRESS) {
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

      if (newStatus === ServiceRequestStatus.PAYMENT_PENDING ||
        (newStatus === ServiceRequestStatus.COMPLETED && request.status !== ServiceRequestStatus.PAYMENT_PENDING)) {
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

      console.log('formData in serviceupdate', formData)

      const result = await apiService.patch(`/service-requests/${id}/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (result.success) {
        console.log('result in updationg  ', result)
        await fetchRequestDetails();
        setComment('');
        Alert.alert('Success', `Service request status updated to ${getStatusDisplayName(newStatus)}`);
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (error: any) {
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
  const handleScheduleService = (editOnly = false) => {
    SheetManager.show('schedule-time-sheet', {
      payload: {
        serviceRequestId: id,
        currentScheduledDate: request?.scheduledDate,
        editOnly,  // pass the flag
        onScheduleUpdated: async (scheduledDate) => {
          if (!scheduledDate) return;
          if (editOnly) {
            // Call your dedicated PATCH endpoint
            setUpdating(true);
            try {
              const result = await apiService.patch(`/service-requests/${id}/scheduleDateUpdate`, { scheduledDate });
              if (result.success) {
                Alert.alert('Success', 'Schedule date updated');
                await fetchRequestDetails();
              } else {
                throw new Error(result.error || 'Failed to update schedule date');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update schedule date');
            }
            setUpdating(false);
          } else {
            // Call status update as before
            handleStatusUpdate(ServiceRequestStatus.SCHEDULED, { scheduledDate });
          }
        },
      },
    });
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
        await fetchRequestDetails();
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
      if (result.success) {
        Alert.alert('Success', 'Payment status verified');
        await fetchRequestDetails();
      } else {
        throw new Error(result.error || 'Failed to verify payment');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify payment status');
    }
    setUpdating(false);
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

          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {getStatusDisplayName(request.status)}
            </Text>
          </View>
        </View>

        {/* Status Transitions */}
        {updating ? (
          <View style={styles.updatingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.updatingText}>Updating service request...</Text>
          </View>
        ) : (
          <ServiceStatusTransitions
            request={request}
            userRole={user?.role || UserRole.SERVICE_AGENT}
            beforeImages={beforeImages}
            afterImages={afterImages}
            onStatusUpdate={handleStatusUpdate}
            onAssignAgent={handleAssignAgent}
            onScheduleService={handleScheduleService}
          />
        )}

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
            {user?.role === UserRole.ADMIN && request.assignedAgent && (request.status === ServiceRequestStatus.ASSIGNED || request.status === ServiceRequestStatus.SCHEDULED) && (
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
            </View>
          )}
        </View>

        {request.scheduledDate && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Schedule Details</Text>
              {/* Show pencil only for admin and if not cancelled */}
              {user?.role === UserRole.ADMIN && request.status === ServiceRequestStatus.SCHEDULED && (
                <TouchableOpacity onPress={() => handleScheduleService(true)}>
                  <Ionicons name="pencil" size={20} color="#3B82F6" />
                </TouchableOpacity>
              )}
            </View>
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

              {/* Payment Actions */}
              {request.status === ServiceRequestStatus.PAYMENT_PENDING && (
                <View style={styles.paymentActions}>
                  {!request.paymentStatus?.razorpayPaymentLink && (
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

                  {request.paymentStatus?.razorpayPaymentLink && (
                    <View style={styles.paymentContainer}>
                      {/* Existing payment link button */}
                      <TouchableOpacity
                        style={styles.paymentLinkButton}
                        onPress={() => Linking.openURL(request.paymentStatus?.razorpayPaymentLink || '')}
                      >
                        <Ionicons name="link" size={16} color="#3B82F6" />
                        <Text style={styles.paymentLinkText}>View Payment Link</Text>
                      </TouchableOpacity>

                      {/* QR Code button */}
                      <TouchableOpacity
                        style={styles.qrButton}
                        onPress={() => setShowQR(true)}
                      >
                        <Ionicons name="qr-code" size={16} color="#3B82F6" />
                        <Text style={styles.qrButtonText}>Show QR Code</Text>
                      </TouchableOpacity>

                      {/* QR Code Modal */}
                      <Modal
                        visible={showQR}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowQR(false)}
                      >
                        <View style={styles.modalOverlay}>
                          <View style={styles.qrContainer}>
                            <Text style={styles.qrTitle}>Scan to Pay</Text>
                            <QRCode
                              value={request.paymentStatus?.razorpayPaymentLink || ''}
                              size={200}
                              color="black"
                              backgroundColor="white"
                            />
                            <TouchableOpacity
                              style={styles.closeButton}
                              onPress={() => setShowQR(false)}
                            >
                              <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </Modal>
                    </View>
                  )}

                  {/* {request.paymentStatus?.razorpayPaymentLink && (
                    <TouchableOpacity
                      style={styles.paymentLinkButton}
                      onPress={() => Linking.openURL(request.paymentStatus?.razorpayPaymentLink || '')}
                    >
                      <Ionicons name="link" size={16} color="#3B82F6" />
                      <Text style={styles.paymentLinkText}>View Payment Link</Text>
                    </TouchableOpacity>
                  )} */}

                  {request.paymentStatus?.razorpaySubscriptionId && (
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
          </View>
        )}

        {/* Service Images */}
        <ServiceImageManager
          serviceType={request.type}
          currentStatus={request.status}
          initialImages={request.images || []}
          beforeImages={beforeImages}
          afterImages={afterImages}
          onBeforeImagesChange={setBeforeImages}
          onAfterImagesChange={setAfterImages}
          onViewImages={viewImages}
        />
      </ScrollView>

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
  updatingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  updatingText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginTop: 12,
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
    fontFamily: 'Outfit_600SemiBold',
    marginLeft: 8,
  },
  paymentContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  paymentLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    flex: 1,
  },
  paymentLinkText: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '500',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
    flex: 1,
  },
  qrButtonText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#1F2937',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: '500',
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
});