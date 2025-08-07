import { apiService } from '@/lib/api/api';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Subscription {
  id: string;
  productId: string;
  productName: string;
  planType: 'MONTHLY' | 'YEARLY';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  startDate: string;
  endDate: string;
  amount: number;
  franchiseId: string;
  franchiseName: string;
  payments: Payment[];
}

interface Payment {
  id: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  method: string;
  razorpayPaymentId?: string;
  paidDate?: string;
  dueDate: string;
}

interface InstallationRequest {
  id: string;
  productId: string;
  productName: string;
  status: string;
  requestedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  franchiseId: string;
  franchiseName: string;
  assignedAgent?: {
    id: string;
    name: string;
    phone: string;
  };
}

interface ServiceRequest {
  id: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  completedDate?: string;
  franchiseId: string;
  franchiseName: string;
  assignedAgent?: {
    id: string;
    name: string;
    phone: string;
  };
}

interface CustomerDetails {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  subscriptions: Subscription[];
  installationRequests: InstallationRequest[];
  serviceRequests: ServiceRequest[];
}

const CustomerDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'installations' | 'services'>('overview');

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const result = await apiService.get(`/auth/users/${id}/details`);
      
      console.log('result in customer details  ',JSON.stringify(result))
      if (result.success) {
        setCustomer(result.data);
      } else {
        Alert.alert('Error', 'Failed to load customer details');
        router.back();
      }
    } catch (error) {
      console.log('Failed to fetch customer details:', error);
      Alert.alert('Error', 'Failed to load customer details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleWhatsApp = (phoneNumber: string) => {
    const cleanNumber = phoneNumber?.replace(/[^\d]/g, '');
    Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
  };

  const handleEmailPress = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
      case 'COMPLETED':
        return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
      case 'PENDING':
      case 'IN_PROGRESS':
        return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' };
      case 'INACTIVE':
      case 'CANCELLED':
      case 'FAILED':
        return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      case 'EXPIRED':
        return { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' };
      default:
        return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'HIGH':
      case 'URGENT':
        return { bg: '#FEF2F2', text: '#DC2626' };
      case 'MEDIUM':
        return { bg: '#FFFBEB', text: '#92400E' };
      case 'LOW':
        return { bg: '#F0FDF4', text: '#047857' };
      default:
        return { bg: '#F9FAFB', text: '#6B7280' };
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderOverview = () => {
    if (!customer) return null;

    const activeSubscriptions = customer.subscriptions.filter(s => s.status === 'ACTIVE').length;
    const totalInstallations = customer.installationRequests.length;
    const totalServiceRequests = customer.serviceRequests.length;
    const completedServices = customer.serviceRequests.filter(s => s.status === 'COMPLETED').length;

    return (
      <View style={styles.tabContent}>
        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
              <MaterialIcons name="subscriptions" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{activeSubscriptions}</Text>
            <Text style={styles.statLabel}>Active Subscriptions</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
              <MaterialIcons name="build" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{totalInstallations}</Text>
            <Text style={styles.statLabel}>Installations</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFFBEB' }]}>
              <MaterialIcons name="support-agent" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{totalServiceRequests}</Text>
            <Text style={styles.statLabel}>Service Requests</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F0FDF4' }]}>
              <MaterialIcons name="check-circle" size={24} color="#059669" />
            </View>
            <Text style={styles.statValue}>{completedServices}</Text>
            <Text style={styles.statLabel}>Completed Services</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          {/* Recent Subscriptions */}
          {customer.subscriptions.slice(0, 2).map((subscription) => (
            <View key={subscription.id} style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View style={styles.activityInfo}>
                  <MaterialIcons name="subscriptions" size={20} color="#3B82F6" />
                  <Text style={styles.activityTitle}>{subscription.productName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status).bg }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(subscription.status).text }]}>
                    {subscription.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.activitySubtitle}>
                {subscription.planType} • {formatCurrency(subscription.amount)}
              </Text>
              <Text style={styles.activityDate}>
                {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
              </Text>
            </View>
          ))}

          {/* Recent Service Requests */}
          {customer.serviceRequests.slice(0, 2).map((service) => (
            <TouchableOpacity 
              key={service.id} 
              style={styles.activityCard}
              onPress={() => router.push(`/services/${service.id}`)}
            >
              <View style={styles.activityHeader}>
                <View style={styles.activityInfo}>
                  <MaterialIcons name="support-agent" size={20} color="#F59E0B" />
                  <Text style={styles.activityTitle}>{service.type.toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(service.status).bg }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(service.status).text }]}>
                    {service.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.activitySubtitle} numberOfLines={1}>
                {service.description}
              </Text>
              <Text style={styles.activityDate}>
                {formatDateTime(service.createdAt)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSubscriptions = () => {
    if (!customer) return null;

    return (
      <View style={styles.tabContent}>
        {customer.subscriptions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="subscriptions" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Subscriptions</Text>
            <Text style={styles.emptySubtitle}>This customer has no active subscriptions</Text>
          </View>
        ) : (
          customer.subscriptions.map((subscription) => (
            <View key={subscription.id} style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionProduct}>{subscription.productName}</Text>
                  <Text style={styles.subscriptionPlan}>
                    {subscription.planType} • {formatCurrency(subscription.amount)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status).bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(subscription.status).dot }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(subscription.status).text }]}>
                    {subscription.status}
                  </Text>
                </View>
              </View>

              <View style={styles.subscriptionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Period:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Franchise:</Text>
                  <Text style={styles.detailValue}>{subscription.franchiseName}</Text>
                </View>
              </View>

              {/* Recent Payments */}
              {subscription.payments.length > 0 && (
                <View style={styles.paymentsSection}>
                  <Text style={styles.paymentsTitle}>Recent Payments</Text>
                  {subscription.payments.slice(0, 3).map((payment) => (
                    <View key={payment.id} style={styles.paymentRow}>
                      <View style={styles.paymentInfo}>
                        <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                        <Text style={styles.paymentMethod}>{payment.method}</Text>
                      </View>
                      <View style={styles.paymentStatus}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status).bg }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(payment.status).text }]}>
                            {payment.status}
                          </Text>
                        </View>
                        <Text style={styles.paymentDate}>
                          {payment.paidDate ? formatDate(payment.paidDate) : formatDate(payment.dueDate)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </View>
    );
  };

  const renderInstallations = () => {
    if (!customer) return null;

    return (
      <View style={styles.tabContent}>
        {customer.installationRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="build" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Installation Requests</Text>
            <Text style={styles.emptySubtitle}>This customer has no installation requests</Text>
          </View>
        ) : (
          customer.installationRequests.map((installation) => (
            <TouchableOpacity 
              key={installation.id} 
              style={styles.installationCard}
              onPress={() => router.push(`/orders/${installation.id}`)}
            >
              <View style={styles.installationHeader}>
                <View style={styles.installationInfo}>
                  <Text style={styles.installationId}>#{installation.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.installationProduct}>{installation.productName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(installation.status).bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(installation.status).dot }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(installation.status).text }]}>
                    {installation.status}
                  </Text>
                </View>
              </View>

              <View style={styles.installationDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Requested:</Text>
                  <Text style={styles.detailValue}>{formatDateTime(installation.requestedDate)}</Text>
                </View>
                {installation.scheduledDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Scheduled:</Text>
                    <Text style={styles.detailValue}>{formatDateTime(installation.scheduledDate)}</Text>
                  </View>
                )}
                {installation.completedDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Completed:</Text>
                    <Text style={styles.detailValue}>{formatDateTime(installation.completedDate)}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Franchise:</Text>
                  <Text style={styles.detailValue}>{installation.franchiseName}</Text>
                </View>
                {installation.assignedAgent && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Agent:</Text>
                    <Text style={styles.detailValue}>{installation.assignedAgent.name}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const renderServices = () => {
    if (!customer) return null;

    return (
      <View style={styles.tabContent}>
        {customer.serviceRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="support-agent" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Service Requests</Text>
            <Text style={styles.emptySubtitle}>This customer has no service requests</Text>
          </View>
        ) : (
          customer.serviceRequests.map((service) => (
            <TouchableOpacity 
              key={service.id} 
              style={styles.serviceCard}
              onPress={() => router.push(`/services/${service.id}`)}
            >
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceId}>#{service.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.serviceType}>{service.type.toUpperCase()}</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(service.priority).bg }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(service.priority).text }]}>
                      {service.priority}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(service.status).bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(service.status).dot }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(service.status).text }]}>
                    {service.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.serviceDescription} numberOfLines={2}>
                {service.description}
              </Text>

              <View style={styles.serviceDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created:</Text>
                  <Text style={styles.detailValue}>{formatDateTime(service.createdAt)}</Text>
                </View>
                {service.completedDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Completed:</Text>
                    <Text style={styles.detailValue}>{formatDateTime(service.completedDate)}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Franchise:</Text>
                  <Text style={styles.detailValue}>{service.franchiseName}</Text>
                </View>
                {service.assignedAgent && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Agent:</Text>
                    <Text style={styles.detailValue}>{service.assignedAgent.name}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'subscriptions':
        return renderSubscriptions();
      case 'installations':
        return renderInstallations();
      case 'services':
        return renderServices();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading customer details...</Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="person" size={48} color="#9CA3AF" />
        <Text style={styles.errorTitle}>Customer Not Found</Text>
        <Text style={styles.errorSubtitle}>The customer you're looking for doesn't exist</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Details</Text>
        <View style={styles.headerSpacer} />
      </View> */}

      {/* Customer Info Card */}
      <View style={styles.customerCard}>
        <View style={styles.customerHeader}>
          <View style={styles.customerInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getInitials(customer.name)}</Text>
            </View>
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{customer.name}</Text>
              <Text style={styles.customerRole}>{customer.role}</Text>
              <Text style={styles.customerJoinDate}>
                Joined {formatDate(customer.createdAt)}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(customer.isActive ? 'ACTIVE' : 'INACTIVE').bg }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(customer.isActive ? 'ACTIVE' : 'INACTIVE').dot }]} />
            <Text style={[styles.statusText, { color: getStatusColor(customer.isActive ? 'ACTIVE' : 'INACTIVE').text }]}>
              {customer.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Contact Actions */}
        <View style={styles.contactActions}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handlePhoneCall(customer.phone)}
          >
            <Ionicons name="call" size={20} color="#3B82F6" />
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleWhatsApp(customer.phone)}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>

          {customer.email && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleEmailPress(customer.email!)}
            >
              <Ionicons name="mail" size={20} color="#F59E0B" />
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'Overview', icon: 'dashboard' },
            { key: 'subscriptions', label: 'Subscriptions', icon: 'subscriptions' },
            { key: 'installations', label: 'Installations', icon: 'build' },
            { key: 'services', label: 'Services', icon: 'support-agent' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <MaterialIcons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.key ? '#3B82F6' : '#6B7280'} 
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

export default CustomerDetailsScreen;

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  customerRole: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginBottom: 2,
  },
  customerJoinDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  contactButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontFamily: 'Outfit_600SemiBold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginLeft: 8,
  },
  activitySubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionProduct: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  subscriptionPlan: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  subscriptionDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  paymentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  paymentsTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  paymentMethod: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  paymentStatus: {
    alignItems: 'flex-end',
  },
  paymentDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  installationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  installationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  installationInfo: {
    flex: 1,
  },
  installationId: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  installationProduct: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  installationDetails: {
    gap: 8,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceId: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  serviceType: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#8B5CF6',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
  },
  serviceDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  serviceDetails: {
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
  },
});