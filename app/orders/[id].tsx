import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import { apiService } from '@/lib/api/api';

// Backend enums - use exact values from backend
export enum OrderStatus {
  CREATED = 'created',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_COMPLETED = 'payment_completed',
  ASSIGNED = 'assigned',
  INSTALLATION_PENDING = 'installation_pending',
  INSTALLED = 'installed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  productId: string;
  productName: string;
  productImage?: string;
  productDescription?: string;
  type: 'RENT' | 'BUY';
  status: OrderStatus;
  totalAmount: number;
  paidAmount?: number;
  pendingAmount?: number;
  paymentStatus: PaymentStatus;
  serviceAgentId?: string;
  serviceAgentName?: string;
  serviceAgentPhone?: string;
  installationDate?: string;
  deliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceAgent {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export const OrderDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceAgents, setServiceAgents] = useState<ServiceAgent[]>([]);

  const statusActionSheetRef = useRef<ActionSheetRef>(null);
  const agentActionSheetRef = useRef<ActionSheetRef>(null);
  const paymentActionSheetRef = useRef<ActionSheetRef>(null);
  const moreActionsSheetRef = useRef<ActionSheetRef>(null);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const result = await apiService.get(`/orders/${id}`);
      const data = result?.data;

      console.log('orders data ', JSON.stringify(data));

      if (!data) {
        setOrder(null);
      } else {
        const order = data.order as any;

        const realOrder: Order = {
          id: order.id,
          customerId: order.customerId,
          customerName: order.customer?.name || 'Unknown',
          customerPhone: order.customer?.phone || 'N/A',
          customerEmail: order.customer?.email || 'N/A',
          customerAddress: order.customer?.address || 'N/A',
          productId: order.productId,
          productName: order.product?.name || 'Unknown Product',
          productDescription: order.product?.description || '',
          productImage: order.product?.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image',
          type: order?.type?.toUpperCase(),
          status: order?.status, // Keep backend status as-is
          totalAmount: order.totalAmount,
          paidAmount: order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0,
          pendingAmount: order.totalAmount - (order.payments?.reduce((sum, p) => sum + p.amount, 0) || 0),
          paymentStatus: order.paymentStatus, // Keep backend payment status as-is
          serviceAgentId: order.serviceAgentId,
          serviceAgentName: order.serviceAgent?.name || null,
          serviceAgentPhone: order.serviceAgent?.phone || null,
          installationDate: order.installationDate,
          deliveryDate: order.deliveryDate,
          notes: order.notes || '',
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };

        setOrder(realOrder);
      }

    } catch (error) {
      console.error('Failed to fetch order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    }
    setLoading(false);
  };

  const fetchServiceAgents = async () => {
    try {
      const result = await apiService.get(`orders/${id}/available-agents`);
      console.log('avilable service agents ',result.data.availableAgents)
      const data = result?.data || [];

     
        setServiceAgents(data.availableAgents);
      
    } catch (error) {
      console.error('Failed to fetch service agents:', error);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    fetchServiceAgents();
  }, [id]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    try {
      const result = await apiService.patch(`/orders/${id}/status`, { status: newStatus });
      
      // Refetch order details to get updated data
      await fetchOrderDetails();
      
      statusActionSheetRef.current?.hide();
      Alert.alert('Success', `Order status updated to ${getStatusDisplayName(newStatus)}`);
    } catch (error) {
      console.error('Failed to update order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const handleAgentAssignment = async (agentId: string, agentName: string, agentPhone: string) => {
    try {
      const result = await apiService.post(`/orders/${id}/assign-agent`, { serviceAgentId: agentId });
      
      // Refetch order details to get updated data
      await fetchOrderDetails();
      
      agentActionSheetRef.current?.hide();
      Alert.alert('Success', `Agent ${agentName} assigned to order`);
    } catch (error) {
      console.error('Failed to assign agent:', error);
      Alert.alert('Error', 'Failed to assign agent');
    }
  };

  const handlePaymentUpdate = async (status: PaymentStatus) => {
    try {
      const result = await apiService.put(`/orders/${id}/payment`, { paymentStatus: status });
      
      // Refetch order details to get updated data
      await fetchOrderDetails();
      
      paymentActionSheetRef.current?.hide();
      Alert.alert('Success', `Payment status updated to ${getPaymentStatusDisplayName(status)}`);
    } catch (error) {
      console.error('Failed to update payment status:', error);
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const handlePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const cleanNumber = phoneNumber?.replace(/[^\d]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
  };

  // Display name mappings for better UX
  const getStatusDisplayName = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.CREATED: return 'Created';
      case OrderStatus.PAYMENT_PENDING: return 'Payment Pending';
      case OrderStatus.PAYMENT_COMPLETED: return 'Payment Completed';
      case OrderStatus.ASSIGNED: return 'Assigned';
      case OrderStatus.INSTALLATION_PENDING: return 'Installation Pending';
      case OrderStatus.INSTALLED: return 'Installed';
      case OrderStatus.CANCELLED: return 'Cancelled';
      case OrderStatus.COMPLETED: return 'Completed';
      default: return status;
    }
  };

  const getPaymentStatusDisplayName = (status: PaymentStatus): string => {
    switch (status) {
      case PaymentStatus.PENDING: return 'Pending';
      case PaymentStatus.COMPLETED: return 'Completed';
      case PaymentStatus.FAILED: return 'Failed';
      case PaymentStatus.REFUNDED: return 'Refunded';
      default: return status;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CREATED: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
      case OrderStatus.PAYMENT_PENDING: return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' };
      case OrderStatus.PAYMENT_COMPLETED: return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
      case OrderStatus.ASSIGNED: return { bg: '#EEF2FF', text: '#3730A3', dot: '#4F46E5' };
      case OrderStatus.INSTALLATION_PENDING: return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
      case OrderStatus.INSTALLED: return { bg: '#F3E8FF', text: '#6B21A8', dot: '#8B5CF6' };
      case OrderStatus.COMPLETED: return { bg: '#D1FAE5', text: '#047857', dot: '#059669' };
      case OrderStatus.CANCELLED: return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED: return { bg: '#ECFDF5', text: '#047857' };
      case PaymentStatus.PENDING: return { bg: '#FFFBEB', text: '#92400E' };
      case PaymentStatus.FAILED: return { bg: '#FEF2F2', text: '#DC2626' };
      case PaymentStatus.REFUNDED: return { bg: '#F3E8FF', text: '#6B21A8' };
      default: return { bg: '#F9FAFB', text: '#6B7280' };
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

  const statusOptions = [
    { key: OrderStatus.CREATED, label: 'Created', icon: 'add-circle' },
    { key: OrderStatus.PAYMENT_PENDING, label: 'Payment Pending', icon: 'time' },
    { key: OrderStatus.PAYMENT_COMPLETED, label: 'Payment Completed', icon: 'checkmark-circle' },
    { key: OrderStatus.ASSIGNED, label: 'Assigned', icon: 'person-add' },
    { key: OrderStatus.INSTALLATION_PENDING, label: 'Installation Pending', icon: 'construct' },
    { key: OrderStatus.INSTALLED, label: 'Installed', icon: 'build' },
    { key: OrderStatus.COMPLETED, label: 'Completed', icon: 'checkmark-done' },
    { key: OrderStatus.CANCELLED, label: 'Cancelled', icon: 'close-circle' },
  ];

  const paymentOptions = [
    { key: PaymentStatus.PENDING, label: 'Pending', icon: 'time' },
    { key: PaymentStatus.COMPLETED, label: 'Completed', icon: 'checkmark-circle' },
    { key: PaymentStatus.FAILED, label: 'Failed', icon: 'close-circle' },
    { key: PaymentStatus.REFUNDED, label: 'Refunded', icon: 'return-up-back' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="receipt" size={48} color="#9CA3AF" />
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <Text style={styles.errorSubtitle}>The order you're looking for doesn't exist</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColors = getStatusColor(order.status);
  const paymentColors = getPaymentStatusColor(order.paymentStatus);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Order Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderId}>#{order.id?.slice(-6)?.toUpperCase()}</Text>
              <View style={[styles.orderTypeBadge, {
                backgroundColor: order.type === 'RENT' ? '#ECFDF5' : '#FFFBEB'
              }]}>
                <Text style={[styles.orderTypeText, {
                  color: order.type === 'RENT' ? '#047857' : '#92400E'
                }]}>
                  {order.type === 'RENT' ? 'Rental' : 'Purchase'}
                </Text>
              </View>
            </View>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>

          <View style={styles.statusPaymentRow}>
            <TouchableOpacity
              style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}
              onPress={() => statusActionSheetRef.current?.show()}
            >
              <View style={[styles.statusDot, { backgroundColor: statusColors.dot }]} />
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {getStatusDisplayName(order.status)}
              </Text>
              <Ionicons name="chevron-down" size={12} color={statusColors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentBadge, { backgroundColor: paymentColors.bg }]}
              onPress={() => paymentActionSheetRef.current?.show()}
            >
              <Text style={[styles.paymentText, { color: paymentColors.text }]}>
                {getPaymentStatusDisplayName(order.paymentStatus)}
              </Text>
              <Ionicons name="chevron-down" size={12} color={paymentColors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Product Details</Text>
          <View style={styles.productSection}>
            {order.productImage && (
              <Image source={{ uri: order.productImage }} style={styles.productImage} />
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{order.productName}</Text>
              {order.productDescription && order.productDescription.length > 0 && (
                <Text style={styles.productDescription} numberOfLines={2}>
                  {order.productDescription}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Details</Text>
          <View style={styles.customerSection}>
            <View style={styles.customerInfo}>
              <Ionicons name="person" size={20} color="#6B7280" />
              <Text style={styles.customerName}>{order.customerName}</Text>
            </View>

            <View style={styles.contactRow}>
              <View style={styles.contactInfo}>
                <Ionicons name="call" size={16} color="#6B7280" />
                <Text style={styles.contactText}>{order.customerPhone}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handlePhoneCall(order.customerPhone)}
                >
                  <Ionicons name="call" size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleWhatsApp(order.customerPhone)}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                </TouchableOpacity>
              </View>
            </View>

            {order.customerEmail && order.customerEmail !== 'N/A' && (
              <View style={styles.contactInfo}>
                <Ionicons name="mail" size={16} color="#6B7280" />
                <Text style={styles.contactText}>{order.customerEmail}</Text>
              </View>
            )}

            {order.customerAddress && order.customerAddress !== 'N/A' && (
              <View style={styles.addressInfo}>
                <Ionicons name="location" size={16} color="#6B7280" />
                <Text style={styles.addressText}>{order.customerAddress}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>
          <View style={styles.paymentSection}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total Amount</Text>
              <Text style={styles.paymentAmount}>{formatCurrency(order.totalAmount)}</Text>
            </View>
            {order.paidAmount && order.paidAmount > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Paid Amount</Text>
                <Text style={[styles.paymentAmount, { color: '#10B981' }]}>
                  {formatCurrency(order.paidAmount)}
                </Text>
              </View>
            )}
            {order.pendingAmount && order.pendingAmount > 0 && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Pending Amount</Text>
                <Text style={[styles.paymentAmount, { color: '#F59E0B' }]}>
                  {formatCurrency(order.pendingAmount)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Service Agent */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Service Agent</Text>
            <TouchableOpacity
              style={styles.assignButton}
              onPress={() => agentActionSheetRef.current?.show()}
            >
              <Ionicons name="person-add" size={14} color="#3B82F6" />
              <Text style={styles.assignButtonText}>
                {order.serviceAgentName ? 'Change' : 'Assign'}
              </Text>
            </TouchableOpacity>
          </View>

          {order.serviceAgentName ? (
            <View style={styles.agentSection}>
              <View style={styles.agentInfo}>
                <Ionicons name="person-circle" size={20} color="#6B7280" />
                <Text style={styles.agentName}>{order.serviceAgentName}</Text>
              </View>
              {order.serviceAgentPhone && (
                <View style={styles.contactRow}>
                  <View style={styles.contactInfo}>
                    <Ionicons name="call" size={16} color="#6B7280" />
                    <Text style={styles.contactText}>{order.serviceAgentPhone}</Text>
                  </View>
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => handlePhoneCall(order.serviceAgentPhone!)}
                    >
                      <Ionicons name="call" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => handleWhatsApp(order.serviceAgentPhone!)}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.noAgentSection}
              onPress={() => agentActionSheetRef.current?.show()}
            >
              <View style={styles.noAgentIcon}>
                <Ionicons name="person-add" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.noAgentText}>Tap to assign service agent</Text>
              <Text style={styles.noAgentSubtext}>No agent assigned yet</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Schedule Details */}
        {(order.deliveryDate || order.installationDate) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Schedule Details</Text>
            <View style={styles.scheduleSection}>
              {order.deliveryDate && (
                <View style={styles.scheduleRow}>
                  <Ionicons name="car" size={20} color="#8B5CF6" />
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleLabel}>Delivery Date</Text>
                    <Text style={styles.scheduleDate}>{formatDate(order.deliveryDate)}</Text>
                  </View>
                </View>
              )}
              {order.installationDate && (
                <View style={styles.scheduleRow}>
                  <Ionicons name="construct" size={20} color="#F59E0B" />
                  <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleLabel}>Installation Date</Text>
                    <Text style={styles.scheduleDate}>{formatDate(order.installationDate)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        {order.notes && order.notes.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Sheets */}

      {/* Status Update Action Sheet */}
      <ActionSheet ref={statusActionSheetRef}>
        <View style={styles.actionSheetContent}>
          <Text style={styles.actionSheetTitle}>Update Order Status</Text>
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.actionSheetOption,
                order.status === option.key && styles.activeOption
              ]}
              onPress={() => handleStatusUpdate(option.key)}
            >
              <Ionicons name={option.icon as any} size={20} color="#374151" />
              <Text style={styles.actionSheetOptionText}>{option.label}</Text>
              {order.status === option.key && (
                <Ionicons name="checkmark" size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ActionSheet>

      {/* Agent Assignment Action Sheet */}
      <ActionSheet ref={agentActionSheetRef}>
        <View style={styles.actionSheetContent}>
          <Text style={styles.actionSheetTitle}>Assign Service Agent</Text>
          {serviceAgents && serviceAgents?.map((agent) => (
            <TouchableOpacity
              key={agent.id}
              style={[
                styles.actionSheetOption,
                order.serviceAgentId === agent.id && styles.activeOption
              ]}
              onPress={() => handleAgentAssignment(agent.id, agent.name, agent.phone)}
            >
              <Ionicons name="person-circle" size={20} color="#374151" />
              <View style={styles.agentOptionInfo}>
                <Text style={styles.actionSheetOptionText}>{agent.name}</Text>
                <Text style={styles.agentOptionPhone}>{agent.phone}</Text>
              </View>
              {order.serviceAgentId === agent.id && (
                <Ionicons name="checkmark" size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ActionSheet>

      {/* Payment Status Action Sheet */}
      <ActionSheet ref={paymentActionSheetRef}>
        <View style={styles.actionSheetContent}>
          <Text style={styles.actionSheetTitle}>Update Payment Status</Text>
          {paymentOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.actionSheetOption,
                order.paymentStatus === option.key && styles.activeOption
              ]}
              onPress={() => handlePaymentUpdate(option.key)}
            >
              <Ionicons name={option.icon as any} size={20} color="#374151" />
              <Text style={styles.actionSheetOptionText}>{option.label}</Text>
              {order.paymentStatus === option.key && (
                <Ionicons name="checkmark" size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ActionSheet>

      {/* More Actions Action Sheet */}
      <ActionSheet ref={moreActionsSheetRef}>
        <View style={styles.actionSheetContent}>
          <Text style={styles.actionSheetTitle}>More Actions</Text>

          <TouchableOpacity style={styles.actionSheetOption}>
            <Ionicons name="document-text" size={20} color="#374151" />
            <Text style={styles.actionSheetOptionText}>Generate Invoice</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionSheetOption}>
            <Ionicons name="share" size={20} color="#374151" />
            <Text style={styles.actionSheetOptionText}>Share Order Details</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionSheetOption}>
            <Ionicons name="create" size={20} color="#374151" />
            <Text style={styles.actionSheetOptionText}>Edit Order</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionSheetOption}>
            <Ionicons name="copy" size={20} color="#374151" />
            <Text style={styles.actionSheetOptionText}>Duplicate Order</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionSheetOption, styles.dangerOption]}>
            <Ionicons name="trash" size={20} color="#EF4444" />
            <Text style={[styles.actionSheetOptionText, styles.dangerText]}>Delete Order</Text>
          </TouchableOpacity>
        </View>
      </ActionSheet>
    </View>
  );
};

export default OrderDetailsScreen;

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
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
  orderDate: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  statusPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
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
    textTransform: 'capitalize',
    marginRight: 4,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  paymentText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    textTransform: 'capitalize',
    marginRight: 4,
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
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  assignButtonText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#3B82F6',
  },
  productSection: {
    flexDirection: 'row',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  customerSection: {
    gap: 12,
  },
  customerInfo: {
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
  paymentAmount: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  agentSection: {
    gap: 12,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  noAgentSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAgentText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
    marginTop: 8,
  },
  scheduleSection: {
    gap: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleInfo: {
    marginLeft: 12,
  },
  scheduleLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginBottom: 2,
  },
  scheduleDate: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#374151',
    lineHeight: 20,
  },
  actionSheetContent: {
    padding: 20,
    paddingBottom: 40,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  activeOption: {
    backgroundColor: '#EEF2FF',
  },
  actionSheetOptionText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  agentOptionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  agentOptionPhone: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  dangerOption: {
    backgroundColor: '#FEF2F2',
  },
  dangerText: {
    color: '#EF4444',
  },
});