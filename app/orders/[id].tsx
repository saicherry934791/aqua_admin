// screens/OrderDetailsScreen.tsximport React, { useEffect, useState, useRef } from 'react';
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
import { useEffect, useRef, useState } from 'react';

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
  status: 'CREATED' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  paidAmount?: number;
  pendingAmount?: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIAL';
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

export  const OrderDetailsScreen = () => {
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
      
      if (!data) {
        // Mock data for demonstration
        const mockOrder: Order = {
          id: id as string,
          customerId: 'cust-1',
          customerName: 'Ravi Teja',
          customerPhone: '+91 9876543210',
          customerEmail: 'ravi.teja@email.com',
          customerAddress: '123 MG Road, Koramangala, Bangalore - 560034',
          productId: 'prod-1',
          productName: 'RO Water Purifier Premium',
          productDescription: 'Advanced 7-stage purification with UV, UF, and RO technology',
          productImage: 'https://via.placeholder.com/300x200?text=Water+Purifier',
          type: 'RENT',
          status: 'CONFIRMED',
          totalAmount: 2500,
          paidAmount: 500,
          pendingAmount: 2000,
          paymentStatus: 'PARTIAL',
          serviceAgentId: 'agent-1',
          serviceAgentName: 'Kumar Singh',
          serviceAgentPhone: '+91 9988776655',
          installationDate: '2024-06-28T10:00:00Z',
          deliveryDate: '2024-06-27T14:00:00Z',
          notes: 'Customer requested installation between 10 AM - 2 PM',
          createdAt: '2024-06-25T10:30:00Z',
          updatedAt: '2024-06-26T15:45:00Z',
        };
        setOrder(mockOrder);
      } else {
        setOrder(data);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    }
    setLoading(false);
  };

  const fetchServiceAgents = async () => {
    try {
      const result = await apiService.get('/service-agents');
      const data = result?.data || [];
      
      if (data.length === 0) {
        // Mock service agents
        setServiceAgents([
          { id: 'agent-1', name: 'Kumar Singh', phone: '+91 9988776655', email: 'kumar@company.com' },
          { id: 'agent-2', name: 'Raj Patel', phone: '+91 8877665544', email: 'raj@company.com' },
          { id: 'agent-3', name: 'Suresh Kumar', phone: '+91 7766554433', email: 'suresh@company.com' },
        ]);
      } else {
        setServiceAgents(data);
      }
    } catch (error) {
      console.error('Failed to fetch service agents:', error);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    fetchServiceAgents();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await apiService.put(`/orders/${id}/status`, { status: newStatus });
      setOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
      statusActionSheetRef.current?.hide();
      Alert.alert('Success', `Order status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const handleAgentAssignment = async (agentId: string, agentName: string) => {
    try {
      await apiService.put(`/orders/${id}/agent`, { serviceAgentId: agentId });
      setOrder(prev => prev ? { ...prev, serviceAgentId: agentId, serviceAgentName: agentName } : null);
      agentActionSheetRef.current?.hide();
      Alert.alert('Success', `Agent ${agentName} assigned to order`);
    } catch (error) {
      Alert.alert('Error', 'Failed to assign agent');
    }
  };

  const handlePaymentUpdate = async (status: string) => {
    try {
      await apiService.put(`/orders/${id}/payment`, { paymentStatus: status });
      setOrder(prev => prev ? { ...prev, paymentStatus: status as any } : null);
      paymentActionSheetRef.current?.hide();
      Alert.alert('Success', `Payment status updated to ${status}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const handlePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
      case 'CONFIRMED': return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
      case 'IN_PROGRESS': return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' };
      case 'DELIVERED': return { bg: '#F3E8FF', text: '#6B21A8', dot: '#8B5CF6' };
      case 'COMPLETED': return { bg: '#D1FAE5', text: '#047857', dot: '#059669' };
      case 'CANCELLED': return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      default: return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return { bg: '#ECFDF5', text: '#047857' };
      case 'PENDING': return { bg: '#FFFBEB', text: '#92400E' };
      case 'FAILED': return { bg: '#FEF2F2', text: '#DC2626' };
      case 'REFUNDED': return { bg: '#F3E8FF', text: '#6B21A8' };
      case 'PARTIAL': return { bg: '#FEF3C7', text: '#92400E' };
      default: return { bg: '#F9FAFB', text: '#6B7280' };
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
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
    { key: 'CREATED', label: 'Created', icon: 'add-circle' },
    { key: 'CONFIRMED', label: 'Confirmed', icon: 'checkmark-circle' },
    { key: 'IN_PROGRESS', label: 'In Progress', icon: 'time' },
    { key: 'DELIVERED', label: 'Delivered', icon: 'car' },
    { key: 'COMPLETED', label: 'Completed', icon: 'checkmark-done' },
    { key: 'CANCELLED', label: 'Cancelled', icon: 'close-circle' },
  ];

  const paymentOptions = [
    { key: 'PENDING', label: 'Pending', icon: 'time' },
    { key: 'PAID', label: 'Paid', icon: 'checkmark-circle' },
    { key: 'PARTIAL', label: 'Partial', icon: 'remove-circle' },
    { key: 'FAILED', label: 'Failed', icon: 'close-circle' },
    { key: 'REFUNDED', label: 'Refunded', icon: 'return-up-back' },
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
              <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
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
                {order.status.replace('_', ' ')}
              </Text>
              <Ionicons name="chevron-down" size={12} color={statusColors.text} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.paymentBadge, { backgroundColor: paymentColors.bg }]}
              onPress={() => paymentActionSheetRef.current?.show()}
            >
              <Text style={[styles.paymentText, { color: paymentColors.text }]}>
                {order.paymentStatus}
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
              {order.productDescription && (
                <Text style={styles.productDescription}>{order.productDescription}</Text>
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

            {order.customerEmail && (
              <View style={styles.contactInfo}>
                <Ionicons name="mail" size={16} color="#6B7280" />
                <Text style={styles.contactText}>{order.customerEmail}</Text>
              </View>
            )}

            {order.customerAddress && (
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
            {order.paidAmount && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Paid Amount</Text>
                <Text style={[styles.paymentAmount, { color: '#10B981' }]}>
                  {formatCurrency(order.paidAmount)}
                </Text>
              </View>
            )}
            {order.pendingAmount && (
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
            <View style={styles.noAgentSection}>
              <Ionicons name="person-add" size={24} color="#9CA3AF" />
              <Text style={styles.noAgentText}>No agent assigned</Text>
            </View>
          )}
        </View>

        {/* Schedule Details */}
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

        {/* Notes */}
        {order.notes && (
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
          {serviceAgents.map((agent) => (
            <TouchableOpacity
              key={agent.id}
              style={[
                styles.actionSheetOption,
                order.serviceAgentId === agent.id && styles.activeOption
              ]}
              onPress={() => handleAgentAssignment(agent.id, agent.name)}
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