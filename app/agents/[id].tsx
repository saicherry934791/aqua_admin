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

interface Agent {
  id: string;
  name: string;
  phone: string;
  alternativePhone?: string;
  email?: string;
  isActive: boolean;
  joinedDate: string;
}

interface FranchiseAssignment {
  franchiseId: string;
  franchiseName: string;
  franchiseCity: string;
  isPrimary: boolean;
  assignedDate: string;
}

interface Statistics {
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  thisMonthRequests: number;
  totalRevenue: number;
  completionRate: number;
}

interface ServiceRequest {
  id: string;
  description: string;
  type: string;
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt?: string;
  scheduledDate?: string;
  completedDate?: string;
  customerName: string;
  customerPhone: string;
  franchiseName?: string;
  franchiseId?: string;
  requiresPayment?: boolean;
  paymentAmount?: number;
  beforeImages?: string[];
  afterImages?: string[];
}

interface ServiceRequestsByStatus {
  PENDING: ServiceRequest[];
  ASSIGNED: ServiceRequest[];
  IN_PROGRESS: ServiceRequest[];
  COMPLETED: ServiceRequest[];
  CANCELLED: ServiceRequest[];
}

interface ServiceRequestsData {
  all: ServiceRequest[];
  byStatus: ServiceRequestsByStatus;
  recent: ServiceRequest[];
}

interface AgentDetails {
  agent: Agent;
  franchiseAssignments: FranchiseAssignment[];
  statistics: Statistics;
  serviceRequests: ServiceRequestsData;
}

const AgentDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [agentData, setAgentData] = useState<AgentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'franchises' | 'performance'>('overview');

  useEffect(() => {
    fetchAgentDetails();
  }, [id]);

  const fetchAgentDetails = async () => {
    setLoading(true);
    try {
      const result = await apiService.get(`/agents/${id}/dashboard`);

      console.log('result is ',JSON.stringify(result))

      if (result.success) {
        setAgentData(result.data);
      } else {
        Alert.alert('Error', 'Failed to load agent details');
        router.back();
      }
    } catch (error) {
      console.log('Failed to fetch agent details:', error);
      Alert.alert('Error', 'Failed to load agent details');
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
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
      case 'IN_PROGRESS':
        return { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' };
      case 'ASSIGNED':
        return { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B' };
      case 'PENDING':
        return { bg: '#FEF3F2', text: '#B91C1C', dot: '#EF4444' };
      case 'CANCELLED':
        return { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' };
      case 'ACTIVE':
        return { bg: '#ECFDF5', text: '#047857', dot: '#10B981' };
      case 'INACTIVE':
        return { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      default:
        return { bg: '#F9FAFB', text: '#6B7280', dot: '#6B7280' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
      case 'HIGH':
        return { bg: '#FEF3F2', text: '#B91C1C', border: '#FED7D7' };
      case 'MEDIUM':
        return { bg: '#FFFBEB', text: '#92400E', border: '#FED7AA' };
      case 'LOW':
        return { bg: '#F0FDF4', text: '#047857', border: '#BBF7D0' };
      default:
        return { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' };
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
    if (!agentData) return null;

    const { statistics } = agentData;

    return (
      <View style={styles.tabContent}>
        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
              <MaterialIcons name="assignment" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{statistics.totalRequests}</Text>
            <Text style={styles.statLabel}>Total Requests</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
              <MaterialIcons name="check-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{statistics.completedRequests}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
              <MaterialIcons name="schedule" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{statistics.inProgressRequests}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFFBEB' }]}>
              <MaterialIcons name="pending" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>{statistics.pendingRequests}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>

          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{statistics.completionRate}%</Text>
              <Text style={styles.performanceLabel}>Completion Rate</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${statistics.completionRate}%`, backgroundColor: '#10B981' }
                  ]}
                />
              </View>
            </View>

            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{statistics.thisMonthRequests}</Text>
              <Text style={styles.performanceLabel}>This Month</Text>
            </View>

            <View style={styles.performanceCard}>
              <Text style={styles.performanceValue}>{formatCurrency(statistics.totalRevenue)}</Text>
              <Text style={styles.performanceLabel}>Total Revenue</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>

          {agentData.serviceRequests.recent.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="assignment" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No Recent Activity</Text>
              <Text style={styles.emptySubtitle}>No recent service requests</Text>
            </View>
          ) : (
            agentData.serviceRequests.recent.map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.activityCard}
                onPress={() => router.push(`/services/${request.id}`)}
              >
                <View style={styles.activityHeader}>
                  <View style={styles.activityInfo}>
                    <MaterialIcons name="build" size={20} color="#F59E0B" />
                    <Text style={styles.activityTitle}>#{request.id.slice(-6).toUpperCase()}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status).bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status).dot }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(request.status).text }]}>
                      {request.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.activitySubtitle} numberOfLines={1}>
                  {request.description}
                </Text>
                <Text style={styles.activityCustomer}>Customer: {request.customerName}</Text>
                <Text style={styles.activityDate}>
                  {request.completedDate ? formatDateTime(request.completedDate) : formatDateTime(request.createdAt)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    );
  };

  const renderRequests = () => {
    if (!agentData) return null;

    const allRequests = agentData.serviceRequests.all;

    return (
      <View style={styles.tabContent}>
        {allRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="assignment" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Service Requests</Text>
            <Text style={styles.emptySubtitle}>This agent has no service requests assigned</Text>
          </View>
        ) : (
          allRequests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={styles.requestCard}
              onPress={() => router.push(`/services/${request.id}`)}
            >
              <View style={styles.requestHeader}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestId}>#{request.id.slice(-6)?.toUpperCase()}</Text>
                  <Text style={styles.requestType}>{request.type?.toUpperCase()}</Text>
                  <View style={[
                    styles.priorityBadge,
                    {
                      backgroundColor: getPriorityColor(request.priority).bg,
                      borderColor: getPriorityColor(request.priority).border,
                      borderWidth: 1
                    }
                  ]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(request.priority).text }]}>
                      {request.priority}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status).bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status).dot }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(request.status).text }]}>
                    {request.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.requestDescription} numberOfLines={2}>
                {request.description}
              </Text>

              <View style={styles.requestDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Customer:</Text>
                  <Text style={styles.detailValue}>{request.customerName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Created:</Text>
                  <Text style={styles.detailValue}>{formatDateTime(request.createdAt)}</Text>
                </View>
                {request.scheduledDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Scheduled:</Text>
                    <Text style={styles.detailValue}>{formatDateTime(request.scheduledDate)}</Text>
                  </View>
                )}
                {request.completedDate && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Completed:</Text>
                    <Text style={styles.detailValue}>{formatDateTime(request.completedDate)}</Text>
                  </View>
                )}
                {request.franchiseName && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Franchise:</Text>
                    <Text style={styles.detailValue}>{request.franchiseName}</Text>
                  </View>
                )}
                {request.requiresPayment && request.paymentAmount && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={[styles.detailValue, { color: '#059669', fontFamily: 'Outfit_600SemiBold' }]}>
                      {formatCurrency(request.paymentAmount)}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  const renderFranchises = () => {
    if (!agentData) return null;

    return (
      <View style={styles.tabContent}>
        {agentData.franchiseAssignments.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="store" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Franchise Assignments</Text>
            <Text style={styles.emptySubtitle}>This agent is not assigned to any franchises</Text>
          </View>
        ) : (
          agentData.franchiseAssignments.map((franchise) => (
            <View key={franchise.franchiseId} style={styles.franchiseCard}>
              <View style={styles.franchiseHeader}>
                <View style={styles.franchiseInfo}>
                  <Text style={styles.franchiseName}>{franchise.franchiseName}</Text>
                  <Text style={styles.franchiseCity}>{franchise.franchiseCity}</Text>
                </View>
                <View style={styles.franchiseBadges}>
                  {franchise.isPrimary && (
                    <View style={[styles.statusBadge, { backgroundColor: '#EEF2FF' }]}>
                      <MaterialIcons name="star" size={12} color="#3B82F6" />
                      <Text style={[styles.statusText, { color: '#3B82F6' }]}>Primary</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.franchiseDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Assigned Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(franchise.assignedDate)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Franchise ID:</Text>
                  <Text style={styles.detailValue}>{franchise.franchiseId}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderPerformance = () => {
    if (!agentData) return null;

    const { statistics, serviceRequests } = agentData;
    const statusCounts = Object.entries(serviceRequests.byStatus).map(([status, requests]) => ({
      status,
      count: requests.length,
      color: getStatusColor(status)
    }));

    return (
      <View style={styles.tabContent}>
        {/* Performance Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>

          <View style={styles.performanceOverview}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceNumber}>{statistics.totalRequests}</Text>
              <Text style={styles.performanceItemLabel}>Total Requests</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceNumber, { color: '#10B981' }]}>
                {statistics.completionRate}%
              </Text>
              <Text style={styles.performanceItemLabel}>Success Rate</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceNumber, { color: '#3B82F6' }]}>
                {statistics.thisMonthRequests}
              </Text>
              <Text style={styles.performanceItemLabel}>This Month</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={[styles.performanceNumber, { color: '#059669' }]}>
                {formatCurrency(statistics.totalRevenue)}
              </Text>
              <Text style={styles.performanceItemLabel}>Revenue</Text>
            </View>
          </View>
        </View>

        {/* Status Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Status Breakdown</Text>

          {statusCounts.map(({ status, count, color }) => (
            <View key={status} style={styles.statusBreakdownItem}>
              <View style={styles.statusBreakdownInfo}>
                <View style={[styles.statusDot, { backgroundColor: color.dot }]} />
                <Text style={styles.statusBreakdownLabel}>{status.replace('_', ' ')}</Text>
              </View>
              <View style={styles.statusBreakdownCount}>
                <Text style={styles.statusBreakdownNumber}>{count}</Text>
                <Text style={styles.statusBreakdownPercent}>
                  {statistics.totalRequests > 0
                    ? `${((count / statistics.totalRequests) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'requests':
        return renderRequests();
      case 'franchises':
        return renderFranchises();
      // case 'performance':
      //   return renderPerformance();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading agent details...</Text>
      </View>
    );
  }

  if (!agentData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="person" size={48} color="#9CA3AF" />
        <Text style={styles.errorTitle}>Agent Not Found</Text>
        <Text style={styles.errorSubtitle}>The agent you're looking for doesn't exist</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { agent } = agentData;

  return (
    <View style={styles.container}>
      {/* Header */}
     

      {/* Agent Info Card */}
      <View style={styles.agentCard}>
        <View style={styles.agentHeader}>
          <View style={styles.agentInfo}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getInitials(agent.name)}</Text>
            </View>
            <View style={styles.agentDetails}>
              <Text style={styles.agentName}>{agent.name}</Text>
              <Text style={styles.agentPhone}>{agent.phone}</Text>
              {agent.alternativePhone && (
                <Text style={styles.agentAltPhone}>Alt: {agent.alternativePhone}</Text>
              )}
              <Text style={styles.agentJoinDate}>
                Joined {formatDate(agent.joinedDate)}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(agent.isActive ? 'ACTIVE' : 'INACTIVE').bg }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(agent.isActive ? 'ACTIVE' : 'INACTIVE').dot }]} />
            <Text style={[styles.statusText, { color: getStatusColor(agent.isActive ? 'ACTIVE' : 'INACTIVE').text }]}>
              {agent.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Contact Actions */}
        <View style={styles.contactActions}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handlePhoneCall(agent.phone)}
          >
            <Ionicons name="call" size={20} color="#3B82F6" />
            <Text style={styles.contactButtonText}>Call</Text>
          </TouchableOpacity>

          {agent.alternativePhone && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handlePhoneCall(agent.alternativePhone!)}
            >
              <Ionicons name="call-outline" size={20} color="#6B7280" />
              <Text style={styles.contactButtonText}>Alt Call</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleWhatsApp(agent.phone)}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.contactButtonText}>WhatsApp</Text>
          </TouchableOpacity>

          {agent.email && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleEmailPress(agent.email!)}
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
            { key: 'requests', label: 'Requests', icon: 'assignment' },
            { key: 'franchises', label: 'Franchises', icon: 'store' },
            // { key: 'performance', label: 'Performance', icon: 'analytics' },
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

export default AgentDetailsScreen;

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
  headerBackButton: {
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
  agentCard: {
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
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  agentPhone: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginBottom: 2,
  },
  agentAltPhone: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  agentJoinDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
  },
  contactActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  contactButton: {
    flex: 1,
    minWidth: '22%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  contactButtonText: {
    fontSize: 12,
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
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  performanceCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  performanceValue: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
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
  activityCustomer: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  requestId: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  requestType: {
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
  requestDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  requestDetails: {
    gap: 8,
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
    flexShrink: 1,
  },
  franchiseCard: {
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
  franchiseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  franchiseInfo: {
    flex: 1,
  },
  franchiseName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  franchiseCity: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  franchiseBadges: {
    alignItems: 'flex-end',
  },
  franchiseDetails: {
    gap: 8,
  },
  performanceOverview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  performanceItem: {
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
  performanceNumber: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
    marginBottom: 4,
  },
  performanceItemLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    textAlign: 'center',
  },
  statusBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBreakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusBreakdownLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  statusBreakdownCount: {
    alignItems: 'flex-end',
  },
  statusBreakdownNumber: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  statusBreakdownPercent: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
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

})
