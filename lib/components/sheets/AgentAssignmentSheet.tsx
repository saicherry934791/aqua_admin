import { apiService } from '@/lib/api/api';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ActionSheet, { SheetManager, SheetProps } from 'react-native-actions-sheet';

interface Agent {
  id: string;
  name: string;
  phone: string;
  email: string;
  isAvailable: boolean;
  activeServiceRequests: number;
}

interface AgentAssignmentSheetProps extends SheetProps {
  serviceRequestId: string;
  currentAgentId?: string;
  currentAgentName?: string;
  onAgentAssigned: (agent: Agent) => void;
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

  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableAgents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAgents(agents);
    } else {
      const filtered = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.phone.includes(searchQuery) ||
        agent.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAgents(filtered);
    }
  }, [searchQuery, agents]);

  const fetchAvailableAgents = async () => {
    setLoading(true);
    try {
      const result = await apiService.get('/agents/available');
      if (result.success && result.data) {
        setAgents(result.data.agents || []);
        setFilteredAgents(result.data.agents || []);
      } else {
        setAgents([]);
        setFilteredAgents([]);
      }
    } catch (error) {
      console.log('Failed to fetch agents:', error);
      Alert.alert('Error', 'Failed to load available agents');
      setAgents([]);
      setFilteredAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = async (agent: Agent) => {
    if (agent.id === currentAgentId) {
      Alert.alert('Info', 'This agent is already assigned to this service request');
      return;
    }

    setAssigning(agent.id);
    try {
      // Use the status update endpoint with ASSIGNED status and agentId
      const formData = new FormData();
      formData.append('status', 'ASSIGNED');
      formData.append('assignedAgentId', agent.id);

      const result = await apiService.patch(`/service-requests/${serviceRequestId}/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (result.success) {
        onAgentAssigned(agent);
        SheetManager.hide(sheetId);
        Alert.alert(
          'Success', 
          `${agent.name} has been assigned to this service request`
        );
      } else {
        throw new Error(result.error || 'Failed to assign agent');
      }
    } catch (error: any) {
      console.log('Failed to assign agent:', error);
      Alert.alert('Error', error.message || 'Failed to assign agent');
    } finally {
      setAssigning(null);
    }
  };

  const handleUnassignAgent = async () => {
    Alert.alert(
      'Unassign Agent',
      `Are you sure you want to unassign ${currentAgentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: async () => {
            setAssigning('unassign');
            try {
              // Use the status update endpoint to unassign agent
              const formData = new FormData();
              formData.append('assignedAgentId', ''); // Clear the assigned agent

              const result = await apiService.patch(`/service-requests/${serviceRequestId}/status`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              });

              if (result.success) {
                onAgentAssigned(null as any); // Trigger refresh
                SheetManager.hide(sheetId);
                Alert.alert('Success', 'Agent has been unassigned');
              } else {
                throw new Error(result.error || 'Failed to unassign agent');
              }
            } catch (error: any) {
              console.log('Failed to unassign agent:', error);
              Alert.alert('Error', error.message || 'Failed to unassign agent');
            } finally {
              setAssigning(null);
            }
          }
        }
      ]
    );
  };

  const renderAgentItem = ({ item: agent }: { item: Agent }) => {
    const isCurrentAgent = agent.id === currentAgentId;
    const isAssigningThis = assigning === agent.id;

    return (
      <TouchableOpacity
        style={[
          styles.agentItem,
          isCurrentAgent && styles.currentAgentItem,
          !agent.isAvailable && styles.unavailableAgentItem
        ]}
        onPress={() => handleAssignAgent(agent)}
        disabled={isAssigningThis || !agent.isAvailable}
      >
        <View style={styles.agentInfo}>
          <View style={styles.agentHeader}>
            <Text style={[
              styles.agentName,
              isCurrentAgent && styles.currentAgentText,
              !agent.isAvailable && styles.unavailableText
            ]}>
              {agent.name}
            </Text>
            {isCurrentAgent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentBadgeText}>Current</Text>
              </View>
            )}
            {!agent.isAvailable && (
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableBadgeText}>Busy</Text>
              </View>
            )}
          </View>
          
          <Text style={[
            styles.agentContact,
            !agent.isAvailable && styles.unavailableText
          ]}>
            {agent.phone} • {agent.email}
          </Text>
          
          <Text style={[
            styles.agentWorkload,
            !agent.isAvailable && styles.unavailableText
          ]}>
            Active requests: {agent.activeServiceRequests}
          </Text>
        </View>

        <View style={styles.agentActions}>
          {isAssigningThis ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Ionicons 
              name={isCurrentAgent ? "checkmark-circle" : "person-add"} 
              size={24} 
              color={
                isCurrentAgent ? "#10B981" : 
                !agent.isAvailable ? "#9CA3AF" : "#3B82F6"
              } 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ActionSheet
      id={sheetId}
      initialSnapIndex={0}
      gestureEnabled={true}
      closeOnTouchBackdrop={true}
      containerStyle={styles.actionSheetContainer}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assign Agent</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => SheetManager.hide(sheetId)}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Current Agent Info */}
        {currentAgentId && currentAgentName && (
          <View style={styles.currentAgentInfo}>
            <View style={styles.currentAgentHeader}>
              <Text style={styles.currentAgentLabel}>Currently Assigned:</Text>
              <TouchableOpacity
                style={styles.unassignButton}
                onPress={handleUnassignAgent}
                disabled={assigning === 'unassign'}
              >
                {assigning === 'unassign' ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="person-remove" size={16} color="#EF4444" />
                    <Text style={styles.unassignButtonText}>Unassign</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.currentAgentName}>{currentAgentName}</Text>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
          style={styles.searchInput}
            placeholder="Search agents by name, phone, or email"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Agents List */}
        <View style={styles.agentsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading available agents...</Text>
            </View>
          ) : filteredAgents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No agents found' : 'No agents available'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'All agents are currently busy with other requests'
                }
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={filteredAgents}
              renderItem={renderAgentItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.agentsList}
            />
          )}
        </View>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: '80%',
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
  currentAgentInfo: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  currentAgentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentAgentLabel: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#047857',
  },
  unassignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  unassignButtonText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#EF4444',
  },
  currentAgentName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#065F46',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#111827',
  },
  agentsContainer: {
    flex: 1,
    minHeight: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearSearchButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#FFFFFF',
  },
  agentsList: {
    paddingBottom: 20,
  },
  agentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentAgentItem: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  unavailableAgentItem: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    opacity: 0.7,
  },
  agentInfo: {
    flex: 1,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  agentName: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  currentAgentText: {
    color: '#065F46',
  },
  unavailableText: {
    color: '#9CA3AF',
  },
  currentBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFFFFF',
  },
  unavailableBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unavailableBadgeText: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    color: '#6B7280',
  },
  agentContact: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  agentWorkload: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#9CA3AF',
  },
  agentActions: {
    marginLeft: 12,
  },
});