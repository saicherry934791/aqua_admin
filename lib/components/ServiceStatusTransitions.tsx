import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceRequestStatus, ServiceRequest, validTransitions } from '../types/ServiceRequest';
import { UserRole } from '../contexts/AuthContext';
import { 
  getStatusDisplayName, 
  getStatusColor, 
  getAvailableTransitions,
  requiresImageValidation 
} from '../utils/serviceRequestUtils';

interface ServiceStatusTransitionsProps {
  request: ServiceRequest;
  userRole: UserRole;
  beforeImages: string[];
  afterImages: string[];
  onStatusUpdate: (status: ServiceRequestStatus, additionalData?: any) => void;
  onAssignAgent: () => void;
  onScheduleService: () => void;
}

export const ServiceStatusTransitions: React.FC<ServiceStatusTransitionsProps> = ({
  request,
  userRole,
  beforeImages,
  afterImages,
  onStatusUpdate,
  onAssignAgent,
  onScheduleService,
}) => {
  const availableTransitions = getAvailableTransitions(request,request.status, userRole, validTransitions);
  
  const handleTransition = (toStatus: ServiceRequestStatus) => {
    // Special handling for specific transitions
    if (toStatus === ServiceRequestStatus.ASSIGNED) {
      onAssignAgent();
      return;
    }
    
    if (toStatus === ServiceRequestStatus.SCHEDULED) {
      onScheduleService();
      return;
    }
    
    // Validate image requirements
    const imageValidation = requiresImageValidation(
      request.status,
      toStatus,
      request.type,
      beforeImages,
      afterImages
    );
    
    if (!imageValidation.valid) {
      Alert.alert('Images Required', imageValidation.message);
      return;
    }
    
    // Confirm critical actions
    if (toStatus === ServiceRequestStatus.CANCELLED) {
      Alert.alert(
        'Cancel Service Request',
        'Are you sure you want to cancel this service request?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: () => onStatusUpdate(toStatus) }
        ]
      );
      return;
    }
    
    if (toStatus === ServiceRequestStatus.COMPLETED) {
      Alert.alert(
        'Complete Service Request',
        'Are you sure you want to mark this service as completed?',
        [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', onPress: () => onStatusUpdate(toStatus) }
        ]
      );
      return;
    }
    
    onStatusUpdate(toStatus);
  };

  const getTransitionIcon = (toStatus: ServiceRequestStatus) => {
    switch (toStatus) {
      case ServiceRequestStatus.ASSIGNED: return 'person-add';
      case ServiceRequestStatus.SCHEDULED: return 'calendar';
      case ServiceRequestStatus.IN_PROGRESS: return 'play';
      case ServiceRequestStatus.PAYMENT_PENDING: return 'card';
      case ServiceRequestStatus.COMPLETED: return 'checkmark-done';
      case ServiceRequestStatus.CANCELLED: return 'close-circle';
      default: return 'arrow-forward';
    }
  };

  const getTransitionColor = (toStatus: ServiceRequestStatus) => {
    switch (toStatus) {
      case ServiceRequestStatus.ASSIGNED: return '#8B5CF6';
      case ServiceRequestStatus.SCHEDULED: return '#10B981';
      case ServiceRequestStatus.IN_PROGRESS: return '#F59E0B';
      case ServiceRequestStatus.PAYMENT_PENDING: return '#D97706';
      case ServiceRequestStatus.COMPLETED: return '#059669';
      case ServiceRequestStatus.CANCELLED: return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTransitionDescription = (toStatus: ServiceRequestStatus) => {
    switch (toStatus) {
      case ServiceRequestStatus.ASSIGNED: return 'Assign an agent to handle this request';
      case ServiceRequestStatus.SCHEDULED: return 'Schedule a date and time for service';
      case ServiceRequestStatus.IN_PROGRESS: return 'Start working on the service';
      case ServiceRequestStatus.PAYMENT_PENDING: return 'Request payment from customer';
      case ServiceRequestStatus.COMPLETED: return 'Mark service as completed';
      case ServiceRequestStatus.CANCELLED: return 'Cancel this service request';
      default: return `Update status to ${getStatusDisplayName(toStatus)}`;
    }
  };

  if (availableTransitions.length === 0) {
    return null;
  }

  const currentStatusColors = getStatusColor(request.status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Available Actions</Text>
        <View style={[styles.currentStatusBadge, { backgroundColor: currentStatusColors.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: currentStatusColors.dot }]} />
          <Text style={[styles.currentStatusText, { color: currentStatusColors.text }]}>
            {getStatusDisplayName(request.status)}
          </Text>
        </View>
      </View>

      <View style={styles.transitionsContainer}>
        {availableTransitions.map((toStatus) => {
          const transitionColor = getTransitionColor(toStatus);
          const transitionIcon = getTransitionIcon(toStatus);
          
          return (
            <TouchableOpacity
              key={toStatus}
              style={[styles.transitionButton, { borderColor: transitionColor + '30' }]}
              onPress={() => handleTransition(toStatus)}
            >
              <View style={[styles.transitionIcon, { backgroundColor: transitionColor + '20' }]}>
                <Ionicons name={transitionIcon as any} size={20} color={transitionColor} />
              </View>
              
              <View style={styles.transitionContent}>
                <Text style={[styles.transitionTitle, { color: transitionColor }]}>
                  {getStatusDisplayName(toStatus)}
                </Text>
                <Text style={styles.transitionDescription}>
                  {getTransitionDescription(toStatus)}
                </Text>
              </View>
              
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  currentStatusBadge: {
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
  currentStatusText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  transitionsContainer: {
    gap: 12,
  },
  transitionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#FAFBFC',
  },
  transitionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transitionContent: {
    flex: 1,
  },
  transitionTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    marginBottom: 2,
  },
  transitionDescription: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    lineHeight: 16,
  },
});