import { apiService } from '@/lib/api/api';
import SkeletonWrapper from '@/lib/components/skeltons/SkeltonScrollRefreshWrapper';
import FranchiseSkeleton from '@/lib/components/skeltons/FranchisesSkelton';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';

type FilterType = 'all' | 'active' | 'inactive' | 'recent';

const AgentScreen = () => {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const { user, viewAsServiceAgent } = useAuth();
    const { refreshData } = useLocalSearchParams();

    // Handle refresh data from form submissions
    useEffect(() => {
        if (refreshData) {
            try {
                const parsedData = JSON.parse(refreshData as string);
                if (parsedData.type === 'add') {
                    // Add new agent to the list
                    setAgents(prev => [parsedData.data, ...prev]);
                } else if (parsedData.type === 'update') {
                    // Update existing agent in the list
                    setAgents(prev => 
                        prev.map(agent => 
                            agent.id === parsedData.data.id ? parsedData.data : agent
                        )
                    );
                }
                // Clear the refresh data parameter
                router.setParams({ refreshData: undefined });
            } catch (error) {
                console.error('Error parsing refresh data:', error);
            }
        }
    }, [refreshData]);

    const fetchAgents = async () => {
        try {
            setLoading(true);
            const result = await apiService.get('/agents');
            console.log('service agents ', result.data)
            if (result.success && Array.isArray(result.data)) {
                const mapped = result.data.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    email: item.email,
                    phone: item.number,
                    isActive: item.active,
                    franchise: item.franchiseName || 'Global Agent',
                    franchiseId: item.franchiseId,
                    createdAt: item.joined,
                    joinDate: new Date(item.joined),
                    serviceRequestsCount: item.serviceRequestsCount,
                    ordersCount: item.ordersCount
                }));
                console.log('mapped ', mapped);
                setAgents(mapped);
            } else {
                setAgents([]);
            }
        } catch (err) {
            console.error('Failed to fetch agents:', err);
            setAgents([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAgents();
    };

    const handleEditAgent = (agentId: string) => {
        router.push(`/agents/edit/${agentId}`);
    };

    const handleAddAgent = () => {
        router.push('/agents/add/new');
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    // Calculate statistics
    const activeAgents = agents.filter(a => a.isActive).length;
    const inactiveAgents = agents.filter(a => !a.isActive).length;
    const recentAgents = agents.filter(a => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return new Date(a.createdAt) > oneMonthAgo;
    }).length;

    // Filter agents based on active filter
    const filteredAgents = agents.filter(agent => {
        switch (activeFilter) {
            case 'active':
                return agent.isActive;
            case 'inactive':
                return !agent.isActive;
            case 'recent':
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                return new Date(agent.createdAt) > oneMonthAgo;
            default:
                return true;
        }
    });

    // Filter buttons data
    const filterButtons = [
        { key: 'all', icon: 'people', label: 'All', value: agents.length, color: '#3B82F6', bgColor: '#EEF2FF' },
        { key: 'active', icon: 'checkmark-circle', label: 'Active', value: activeAgents, color: '#10B981', bgColor: '#ECFDF5' },
        { key: 'inactive', icon: 'pause-circle', label: 'Inactive', value: inactiveAgents, color: '#EF4444', bgColor: '#FEF2F2' },
        { key: 'recent', icon: 'time', label: 'Recent', value: recentAgents, color: '#F59E0B', bgColor: '#FFFBEB' },
    ];

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const showActionSheet = (agent: any) => {
        const options = [
            'View Details',
            'Edit Agent',
            ...(user?.role === UserRole.ADMIN || user?.role === UserRole.FRANCHISE_OWNER ? ['View as Agent'] : []),
            agent.isActive ? 'Deactivate' : 'Activate',
            'Cancel'
        ];

        const cancelIndex = options.length - 1;
        const destructiveIndex = agent.isActive ? options.length - 2 : undefined;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: cancelIndex,
                    destructiveButtonIndex: destructiveIndex,
                    title: `Manage ${agent.name}`,
                    message: 'Choose an action for this agent'
                },
                (buttonIndex) => {
                    if (buttonIndex !== cancelIndex) {
                        handleActionSheetResponse(agent, buttonIndex);
                    }
                }
            );
        } else {
            const alertOptions = [
                { text: 'View Details', onPress: () => handleActionSheetResponse(agent, 0) },
                { text: 'Edit Agent', onPress: () => handleActionSheetResponse(agent, 1) },
            ];

            if (user?.role === UserRole.ADMIN || user?.role === UserRole.FRANCHISE_OWNER) {
                alertOptions.push({ text: 'View as Agent', onPress: () => handleActionSheetResponse(agent, 2) });
            }

            alertOptions.push({
                text: agent.isActive ? 'Deactivate' : 'Activate',
                style: agent.isActive ? 'destructive' : 'default',
                onPress: () => handleActionSheetResponse(agent, options.length - 2)
            });

            alertOptions.push({ text: 'Cancel', style: 'cancel' });

            Alert.alert(
                `Manage ${agent.name}`,
                'Choose an action for this agent',
                alertOptions,
                { cancelable: true }
            );
        }
    };

    const updateAgentStatus = async (agentId: string, status: boolean) => {
        // Implementation for updating agent status
    };

    const handleViewAsAgent = (agent: any) => {
        viewAsServiceAgent(agent.id, agent.name, agent.franchiseId || '');
        Alert.alert(
            'View Mode Changed',
            `You are now viewing as ${agent.name} (Service Agent). You can switch back anytime from the banner at the top.`,
            [{ text: 'OK' }]
        );
    };

    const handleActionSheetResponse = (agent: any, buttonIndex: number) => {
        const hasViewAsOption = user?.role === UserRole.ADMIN || user?.role === UserRole.FRANCHISE_OWNER;
        
        switch (buttonIndex) {
            case 0:
                router.push(`/agents/${agent.id}`);
                break;
            case 1:
                router.push(`/agents/add/${agent.id}`);
                break;
            case 2:
                if (hasViewAsOption) {
                    handleViewAsAgent(agent);
                } else {
                    updateAgentStatus(agent.id, !agent.isActive);
                }
                break;
            case 3:
                if (hasViewAsOption) {
                    updateAgentStatus(agent.id, !agent.isActive);
                }
                break;
        }
    };

    return (
        <View style={styles.container}>
            <SkeletonWrapper
                loading={loading}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                skeleton={<FranchiseSkeleton />}
                style={styles.scrollContent}
            >
                {/* Filter Buttons */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterScrollView}
                    contentContainerStyle={styles.filterContainer}
                >
                    {filterButtons.map((filter) => (
                        <TouchableOpacity
                            key={filter.key}
                            style={[
                                styles.filterButton,
                                { backgroundColor: filter.bgColor },
                                activeFilter === filter.key && [styles.activeFilterButton, { borderColor: filter.color }]
                            ]}
                            onPress={() => setActiveFilter(filter.key as FilterType)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.filterIcon, { backgroundColor: filter.color }]}>
                                <Ionicons name={filter.icon as any} size={16} color="#fff" />
                            </View>
                            <Text style={[
                                styles.filterValue,
                                activeFilter === filter.key && { color: filter.color }
                            ]}>
                                {filter.value}
                            </Text>
                            <Text style={[
                                styles.filterLabel,
                                activeFilter === filter.key && { color: filter.color }
                            ]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {filteredAgents.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialIcons name="people" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>
                            {activeFilter === 'all' ? 'No Agents Found' : `No ${activeFilter} agents`}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {activeFilter === 'all'
                                ? 'Add your first agent to get started'
                                : `Try selecting a different filter`
                            }
                        </Text>
                    </View>
                ) : (
                    filteredAgents.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.agentCard}
                            onPress={() => showActionSheet(item)}
                            activeOpacity={0.7}
                        >
                            {/* Agent Header */}
                            <View style={styles.agentHeader}>
                                <View style={styles.agentInfo}>
                                    <View style={styles.avatarContainer}>
                                        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
                                    </View>
                                    <View style={styles.agentDetails}>
                                        <Text style={styles.agentName}>{item.name}</Text>
                                        <Text style={styles.agentContact} numberOfLines={1}>
                                            <Ionicons name="call" size={12} color="#6B7280" />
                                            {' '}{item.phone}
                                        </Text>
                                        <Text style={styles.agentEmail} numberOfLines={1}>
                                            <Ionicons name="mail" size={12} color="#6B7280" />
                                            {' '}{item.email || 'Not provided'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.statusAndActions}>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            item.isActive ? styles.badgeActive : styles.badgeInactive
                                        ]}
                                    >
                                        <View style={[
                                            styles.statusDot,
                                            { backgroundColor: item.isActive ? '#10B981' : '#EF4444' }
                                        ]} />
                                        <Text style={[
                                            styles.statusText,
                                            { color: item.isActive ? '#047857' : '#DC2626' }
                                        ]}>
                                            {item.isActive ? 'Active' : 'Inactive'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity style={styles.editButton}>
                                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Agent Details */}
                            <View style={styles.agentMetrics}>
                                <View style={styles.franchiseRow}>
                                    <Ionicons name="business" size={14} color="#6B7280" />
                                    <Text style={styles.franchiseText}>{item.franchise}</Text>
                                </View>

                                <View style={styles.metricsRow}>
                                    <View style={styles.metricBox}>
                                        <Text style={styles.metricLabel}>Requests</Text>
                                        <Text style={styles.metricValue}>{item.serviceRequestsCount}</Text>
                                    </View>
                                    <View style={styles.metricBox}>
                                        <Text style={styles.metricLabel}>Orders</Text>
                                        <Text style={styles.metricValue}>{item.ordersCount}</Text>
                                    </View>
                                    <View style={styles.metricBox}>
                                        <Text style={styles.metricLabel}>Joined</Text>
                                        <Text style={styles.metricValue}>
                                            {item.joinDate.toLocaleDateString('en-US', {
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </Text>
                                    </View>
                                </View>

                                {/* View As Button for Admin and Franchise Owner */}
                                {(user?.role === UserRole.ADMIN || user?.role === UserRole.FRANCHISE_OWNER) && (
                                    <View style={styles.actionButtonsRow}>
                                        <TouchableOpacity
                                            style={styles.viewAsButton}
                                            onPress={() => handleViewAsAgent(item)}
                                        >
                                            <Ionicons name="eye" size={16} color="#10B981" />
                                            <Text style={styles.viewAsButtonText}>View as Agent</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </SkeletonWrapper>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleAddAgent}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

export default AgentScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    filterScrollView: {
        marginTop: 16,
        marginBottom: 20,
    },
    filterContainer: {
        paddingHorizontal: 0,
        padding: 2,
        borderRadius: 100,
        gap: 12,
    },
    filterButton: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 2,
        alignItems: 'center',
        minWidth: 100,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    activeFilterButton: {
        borderWidth: 2,
        transform: [{ scale: 1.02 }],
    },
    filterIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    filterValue: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        color: '#111827',
        marginRight: 4,
    },
    filterLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        color: '#6B7280',
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
    },
    agentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    agentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    agentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#FFFFFF',
    },
    agentDetails: {
        flex: 1,
    },
    agentName: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
        marginBottom: 4,
    },
    agentContact: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginBottom: 2,
    },
    agentEmail: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    statusAndActions: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginBottom: 8,
    },
    badgeActive: {
        backgroundColor: '#ECFDF5',
    },
    badgeInactive: {
        backgroundColor: '#FEF2F2',
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
    editButton: {
        padding: 4,
    },
    agentMetrics: {
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 16,
    },
    franchiseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    franchiseText: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginLeft: 6,
        flex: 1,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    metricBox: {
        alignItems: 'center',
        flex: 1,
    },
    metricLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
    },
    actionButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
    },
    viewAsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    viewAsButtonText: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        color: '#10B981',
        marginLeft: 6,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});