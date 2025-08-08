import { apiService } from '@/lib/api/api';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

interface ServiceRequest {
  id: string;

  description: string;
  type: 'installation' | 'repair' | 'maintenance' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  productType?: string;
  estimatedDuration?: string;
  requiredSkills?: string[];
}

const OpenServiceRequestsScreen = () => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigation = useNavigation()

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Text
          style={{
            fontSize: 20,
            fontFamily: 'Outfit_700Bold',
            color: '#121516',
          }}
        >
          OPEN REQUESTS
        </Text>
      ),
      headerRight: () => <View style={{
        paddingRight: 16
      }}><View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{serviceRequests.length}</Text>
        </View></View>,
      headerTitleAlign: 'center',
      headerShadowVisible: false
    });
  }, [navigation]);


  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    setLoading(true);
    try {
      const result = await apiService.get('/service-requests/unassigned');
      console.log('result notifications ', result)
      setServiceRequests(result?.data || []);
    } catch (error) {
      console.log('Failed to fetch service requests:', error);

    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServiceRequests();
  };

  const handleAssignRequest = (serviceRequest: ServiceRequest) => {
    Alert.alert(
      'Assign Service Request',
      `Would you like to assign "${serviceRequest.type}" to yourself?\n\nCustomer: ${serviceRequest.customerName}\nLocation: ${serviceRequest.customerAddress}\nEstimated Duration: ${serviceRequest.estimatedDuration}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Assign to Me',
          style: 'default',
          onPress: () => assignServiceRequest(serviceRequest.id),
        },
      ]
    );
  };

  const assignServiceRequest = async (serviceRequestId: string) => {
    setAssigningId(serviceRequestId);
    try {
      // Make API call to assign the service request
      const resp = await apiService.post(`/service-requests/${serviceRequestId}/assign-to-me`, {

      });

      if (resp.success) {
        // Remove from the list since it's no longer open
        setServiceRequests(prev => prev.filter(sr => sr.id !== serviceRequestId));

        Alert.alert(
          'Success',
          'Service request has been assigned to you successfully!',
          [
            {
              text: 'View Details',
              onPress: () => router.push(`/services/${serviceRequestId}` as any),
            },
          ]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to assign the service request. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.log('Failed to assign service request:', error);
      Alert.alert(
        'Error',
        'Failed to assign the service request. Please try again.',
        [{ text: 'OK' }]
      );
    }
    setAssigningId(null);
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'installation':
        return 'build';
      case 'repair':
        return 'build';
      case 'maintenance':
        return 'settings';
      case 'inspection':
        return 'search';
      default:
        return 'build';
    }
  };

  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'installation':
        return { bg: '#EEF2FF', icon: '#3B82F6', text: '#1E40AF' };
      case 'repair':
        return { bg: '#FEF2F2', icon: '#EF4444', text: '#DC2626' };
      case 'maintenance':
        return { bg: '#F0FDF4', icon: '#10B981', text: '#059669' };
      case 'inspection':
        return { bg: '#FEF3C7', icon: '#F59E0B', text: '#D97706' };
      default:
        return { bg: '#F9FAFB', icon: '#6B7280', text: '#4B5563' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: '#FEF2F2', border: '#EF4444', text: '#DC2626' };
      case 'high':
        return { bg: '#FEF3C7', border: '#F59E0B', text: '#D97706' };
      case 'medium':
        return { bg: '#EEF2FF', border: '#3B82F6', text: '#2563EB' };
      case 'low':
        return { bg: '#F0FDF4', border: '#10B981', text: '#059669' };
      default:
        return { bg: '#F9FAFB', border: '#6B7280', text: '#4B5563' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="build" size={48} color="#9CA3AF" />
        <Text style={styles.loadingText}>Loading open service requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>


      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <TouchableWithoutFeedback>
          <View style={{}}>
            {serviceRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="assignment-turned-in" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Open Requests</Text>
                <Text style={styles.emptySubtitle}>
                  All service requests have been assigned. Check back later for new requests.
                </Text>
              </View>
            ) : (
              serviceRequests.map((request) => {
                const typeColors = getServiceTypeColor(request.type);
                const priorityColors = getPriorityColor(request.priority);
                const isAssigning = assigningId === request.id;

                return (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <View style={[styles.typeIcon, { backgroundColor: typeColors.bg }]}>
                        <MaterialIcons
                          name={getServiceTypeIcon(request.type) as any}
                          size={20}
                          color={typeColors.icon}
                        />
                      </View>

                      <View style={styles.requestInfo}>
                        <Text style={styles.requestTitle}>{request.type.toUpperCase()}</Text>

                      </View>

                      <View style={[
                        styles.priorityBadge,
                        {
                          backgroundColor: priorityColors.bg,
                          borderColor: priorityColors.border
                        }
                      ]}>
                        <Text style={[
                          styles.priorityText,
                          { color: priorityColors.text }
                        ]}>
                          {request.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.requestDescription}>{request.description}</Text>

                    <View style={styles.customerInfo}>
                      <View style={styles.infoRow}>
                        <MaterialIcons name="person" size={16} color="#6B7280" />
                        <Text style={styles.infoText}>{request.customerName}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <MaterialIcons name="location-on" size={16} color="#6B7280" />
                        <Text style={styles.infoText} numberOfLines={1}>
                          {request.customerAddress}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <MaterialIcons name="phone" size={16} color="#6B7280" />
                        <Text style={styles.infoText}>{request.customerPhone}</Text>
                      </View>
                    </View>

                    {request.productType && (
                      <View style={styles.productInfo}>
                        <MaterialIcons name="devices" size={16} color="#6B7280" />
                        <Text style={styles.productText}>{request.productType}</Text>
                      </View>
                    )}

                    <View style={styles.requestFooter}>
                      <View style={styles.timeInfo}>
                        <MaterialIcons name="schedule" size={14} color="#9CA3AF" />
                        <Text style={styles.timeText}>
                          Created {formatDate(request.createdAt)}
                        </Text>
                      </View>

                      {request.estimatedDuration && (
                        <View style={styles.durationInfo}>
                          <MaterialIcons name="timer" size={14} color="#9CA3AF" />
                          <Text style={styles.durationText}>
                            Est: {request.estimatedDuration}
                          </Text>
                        </View>
                      )}
                    </View>


                    <TouchableOpacity
                      style={[
                        styles.assignButton,
                        isAssigning && styles.assigningButton
                      ]}
                      onPress={() => handleAssignRequest(request)}
                      disabled={isAssigning}
                      activeOpacity={0.8}
                    >
                      {isAssigning ? (
                        <Text style={styles.assigningText}>Assigning...</Text>
                      ) : (
                        <>
                          <MaterialIcons name="assignment-ind" size={18} color="#FFFFFF" />
                          <Text style={styles.assignText}>Assign to Me</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}

            <View style={styles.bottomPadding} />
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </View>
  );
};

export default OpenServiceRequestsScreen;

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
    color: '#6B7280',
    fontFamily: 'Outfit_500Medium',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  headerBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontSize: 12,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
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
    lineHeight: 20,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  requestType: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
  },
  requestDescription: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  customerInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  productText: {
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
    marginLeft: 8,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginLeft: 4,
  },
  skillsContainer: {
    marginBottom: 16,
  },
  skillsLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#4B5563',
    marginBottom: 6,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 10,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
  },
  assignButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  assigningButton: {
    backgroundColor: '#9CA3AF',
  },
  assignText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  assigningText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 20,
  },
});