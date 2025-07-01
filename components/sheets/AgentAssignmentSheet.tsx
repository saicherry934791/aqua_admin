import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ActionSheet, { SheetManager, SheetProps } from 'react-native-actions-sheet';
import { apiService } from '@/lib/api/api';

interface ServiceAgent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isAvailable?: boolean;
  currentAssignments?: number;
}

interface AgentAssignmentSheetProps extends SheetProps {
  serviceRequestId: string;
  currentAgentId?: string;
  currentAgentName?: string;
  onAgentAssigned: (agent: ServiceAgent) => void;
}

export default function AgentAssignmentSheet({ 
  sheetId, 
  payload 
}: AgentAssignmentSheetProps) {
  const { 
    serviceRequestId, 
    currentAgentId, 
    currentAgentName, 
    onAgentAssigned 
  } = payload || {};

  const [agents, setAgents] = useState<ServiceAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(currentAgentId || null);

  useEffect(() => {
    if (serviceRequestId) {
      fetchAvailableAgents();
    }
  }, [serviceRequestId]);

  const fetchAvailableAgents = async () => {
    setLoading(true);
    try {
      const result = await apiService.get(`/orders/${serviceRequestId}/available-agents`);
      console.log('Available service agents:', result.data?.availableAgents);
      
      if (result.success && result.data?.availableAgents) {
        setAgents(result.data.availableAgents);
      } else {
        setAgents([]);
      }
    } catch (error) {
      console.error('Failed to fetch service agents:', error);
      Alert.alert('Error', 'Failed to load available agents');
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentSelection = (agent: ServiceAgent) => {
    setSelectedAgentId(agent.id);
  };

  const handleAssignAgent = async () => {
    if (!selectedAgentId) {
      Alert.alert('No Selection', 'Please select an agent to assign');
      return;
    }

    const selectedAgent = agents.find(agent => agent.id === selectedAgentId);
    if (!selectedAgent) {
      Alert.alert('Error', 'Selected agent not found');
      return;
    }

    setAssigning(true);
    try {
      const result = await apiService.post(`/service-requests/${serviceRequestId}/assign-agent`, {
        serviceAgentId: selectedAgentId
      });

      if (result.success) {
        onAgentAssigned(selectedAgent);
        SheetManager.hide(sheetId);
        Alert.alert(
          'Success', 
          `Agent ${selectedAgent.name} has been assigned to this service request`
        );
      } else {
        throw new Error(result.error || 'Failed to assign agent');
      }
    } catch (error: any) {
      console.error('Failed to assign agent:', error);
      Alert.alert('Error', error.message || 'Failed to assign agent');
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignAgent = async () => {
    Alert.alert(
      'Unassign Agent',
      'Are you sure you want to unassign the current agent?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: async () => {
            setAssigning(true);
            try {
              const result = await apiService.post(`/service-requests/${serviceRequestId}/unassign-agent`);
              
              if (result.success) {
                onAgentAssigned({ id: '', name: '', phone: '' }); // Clear assignment
                SheetManager.hide(sheetId);
                Alert.alert('Success', 'Agent has been unassigned');
              } else {
                throw new Error(result.error || 'Failed to unassign agent');
              }
            } catch (error: any) {
              console.error('Failed to unassign agent:', error);
              Alert.alert('Error', error.message || 'Failed to unassign agent');
            } finally {
              setAssigning(false);
            }
          }
        }
      ]
    );
  };

  const renderAgentItem = ({ item }: { item: ServiceAgent }) => {
    const isSelected = selectedAgentId === item.id;
    const isCurrent = currentAgentId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.agentItem,
          isSelected && styles.selectedAgentItem,
          isCurrent && styles.currentAgentItem
        ]}
        onPress={() => handleAgentSelection(item)}
        disabled={assigning}
      >
        <View style={styles.agentInfo}>
          <View style={styles.agentHeader}>
            <Text style={[
              styles.agentName,
              isSelected && styles.selectedAgentText
            ]}>
              {item.name}
            </Text>
            {isCurrent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current</Text>
              </View>
            )}
            {item.isAvailable === false && (
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableBadgeText}>Busy</Text>
              </View>
            )}
          </View>
          
          <View style={styles.agentDetails}>
            <View style={styles.agentDetailRow}>
              <Ionicons name="call" size={14} color="#6B7280" />
              <Text style={styles.agentDetailText}>{item.phone}</Text>
            </View>
            
            {item.email && (
              <View style={styles.agentDetailRow}>
                <Ionicons name="mail" size={14} color="#6B7280" />
                <Text style={styles.agentDetailText}>{item.email}</Text>
              </View>
            )}
            
            {item.currentAssignments !== undefined && (
              <View style={styles.agentDetailRow}>
                <Ionicons name="briefcase" size={14} color="#6B7280" />
                <Text style={styles.agentDetailText}>
                  {item.currentAssignments} active assignments
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ActionSheet
      id={sheetId}
      snapPoints={[80]}
      initialSnapIndex={0}
      gestureEnabled={true}
      closeOnTouchBackdrop={true}
      containerStyle={styles.actionSheetContainer}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {currentAgentId ? 'Reassign Agent' : 'Assign Agent'}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => SheetManager.hide(sheetId)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Current Assignment Info */}
        {currentAgentId && currentAgentName && (
          <View style={styles.currentAssignmentInfo}>
            <Text style={styles.currentAssignmentLabel}>Currently Assigned:</Text>
            <Text style={styles.currentAssignmentName}>{currentAgentName}</Text>
          </View>
        )}

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading available agents...</Text>
          </View>
        ) : (
          <>
            {/* Agents List */}
            <View style={styles.agentsContainer}>
              <Text style={styles.sectionTitle}>Available Agents</Text>
              
              {agents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyTitle}>No Agents Available</Text>
                  <Text style={styles.emptySubtitle}>
                    There are no agents available for assignment at this time
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={agents}
                  renderItem={renderAgentItem}
                  keyExtractor={(item) => item.id}
                  style={styles.agentsList}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {currentAgentId && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.unassignButton]}
                  onPress={handleUnassignAgent}
                  disabled={assigning}
                >
                  {assigning ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <>
                      <Ionicons name="person-remove" size={20} color="#EF4444" />
                      <Text style={styles.unassignButtonText}>Unassign Current</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.assignButton,
                  (!selectedAgentId || assigning) && styles.disabledButton
                ]}
                onPress={handleAssignAgent}
                disabled={!selectedAgentId || assigning}
              >
                {assigning ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={20} color="#FFFFFF" />
                    <Text style={styles.assignButtonText}>
                      {currentAgentId ? 'Reassign Agent' : 'Assign Agent'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </ActionSheet>
  );
}

const styles = StyleSheet.create({
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  currentAssignmentInfo: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  currentAssignmentLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  currentAssignmentName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginTop: 16,
  },
  agentsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  agentsList: {
    flex: 1,
  },
  agentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  selectedAgentItem: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  currentAgentItem: {
    borderColor: '#3B82F6',
    backgroundColor: '#EEF2FF',
  },
  agentInfo: {
    flex: 1,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  agentName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
    flex: 1,
  },
  selectedAgentText: {
    color: '#047857',
  },
  currentBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  currentBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
  },
  unavailableBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  unavailableBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
  },
  agentDetails: {
    gap: 4,
  },
  agentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agentDetailText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  checkmark: {
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  assignButton: {
    backgroundColor: '#10B981',
  },
  assignButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  unassignButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  unassignButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#EF4444',
  },
  disabledButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
});