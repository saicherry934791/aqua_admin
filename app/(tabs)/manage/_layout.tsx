import { useAuth, UserRole } from '@/lib/contexts/AuthContext'
import { useLocalSearchParams, useNavigation, router } from 'expo-router'
import React, { useLayoutEffect, useMemo, useRef, useEffect } from 'react'
import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'

// Import separate screens
import AgentsScreen from './AgentScreen'
import CancelSubscriptionsScreen from './CancelSubscriptionsScreen'
import CategoriesScree from './CategoriesScree'
import CustomersScreen from './CustomerScreen'
import FranchiseScreen from './FranchiseScreen'
import ProductsScreen from './ProductsScreen'
import RevenueScreen from './RevenueScreen'
import Subscriptions from './Subscriptions'

const Manage = () => {
    const navigation = useNavigation()
    const { user } = useAuth()
    const { tab } = useLocalSearchParams();
    const scrollViewRef = useRef<ScrollView>(null);
    const tabRefs = useRef<{ [key: string]: View | null }>({});

    function getDefaultTab() {
        if (!user) return 'Products';

        switch (user.role) {
            case UserRole.ADMIN:
                return 'Products';
            case UserRole.FRANCHISE_OWNER:
                return 'Agents';
            default:
                return 'Products';
        }
    }

    const getTabsForRole = () => {
        if (!user) return [];

        const allTabs = [
            { name: 'Categories', component: CategoriesScree, roles: [UserRole.ADMIN] },
            { name: 'Products', component: ProductsScreen, roles: [UserRole.ADMIN] },
            { name: 'Franchises', component: FranchiseScreen, roles: [UserRole.ADMIN] },
            { name: 'Agents', component: AgentsScreen, roles: [UserRole.ADMIN, UserRole.FRANCHISE_OWNER] },
            { name: 'Customers', component: CustomersScreen, roles: [UserRole.ADMIN] },
            { name: 'Subscriptions', component: Subscriptions, roles: [UserRole.ADMIN, UserRole.FRANCHISE_OWNER] },
            { name: 'Revenue', component: RevenueScreen, roles: [UserRole.ADMIN,UserRole.FRANCHISE_OWNER] },
            { name: 'Cancel Requests', component: CancelSubscriptionsScreen, roles: [UserRole.ADMIN, UserRole.FRANCHISE_OWNER] },
        ];

        return allTabs.filter(tab => tab.roles.includes(user.role));
    };

    const matchAvailableTab = (name?: string) => {
        if (!name) return undefined
        const lower = name.toLowerCase()
        return getTabsForRole()
            .map(t => t.name)
            .find(n => n.toLowerCase() === lower)
    }

    const availableTabs = useMemo(() => getTabsForRole(), [user?.role]);
    
    const currentTab = useMemo(() => {
        const requestedTab = typeof tab === 'string' ? tab : undefined;
        const matched = matchAvailableTab(requestedTab);
        const result = matched || getDefaultTab();
        console.log('Current tab calculation:', { requestedTab, matched, result });
        return result;
    }, [tab, availableTabs]);

    // Get the current tab component
    const currentTabData = availableTabs.find(t => t.name === currentTab);
    const CurrentComponent = currentTabData?.component;

    // Handle tab navigation
    const handleTabPress = (tabName: string) => {
        console.log('Tab pressed:', tabName);
        router.setParams({ tab: tabName });
    };

    // Auto-scroll to active tab
    useEffect(() => {
        if (scrollViewRef.current && currentTab) {
            const activeTabRef = tabRefs.current[currentTab];
            if (activeTabRef) {
                activeTabRef.measureLayout(
                    scrollViewRef.current as any,
                    (x: number, y: number, width: number, height: number) => {
                        // Calculate scroll position to center the active tab
                        const scrollX = Math.max(0, x - 50); // 50px padding from left edge
                        scrollViewRef.current?.scrollTo({
                            x: scrollX,
                            animated: true
                        });
                    },
                    () => {
                        // Fallback if measureLayout fails
                        console.log('Could not measure tab layout for scrolling');
                    }
                );
            }
        }
    }, [currentTab]);

    // Debug logging
    console.log('=== Manual Tab Render ===');
    console.log('Tab param:', tab);
    console.log('Current tab:', currentTab);
    console.log('Available tabs:', availableTabs.map(t => t.name));
    console.log('Current component exists:', !!CurrentComponent);

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
                    MANAGE
                </Text>
            ),
            headerTitleAlign: 'center',
            headerShadowVisible: false
        });
    }, [navigation]);

    if (availableTabs.length === 0) {
        return (
            <Text style={{ textAlign: 'center', marginTop: 50 }}>
                No management options available for your role.
            </Text>
        );
    }

    return (
        <View style={styles.container}>
            {/* Custom Tab Bar */}
            <View style={styles.tabBar}>
                <ScrollView 
                    ref={scrollViewRef}
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScrollContent}
                >
                    {availableTabs.map((tabItem) => {
                        const isActive = tabItem.name === currentTab;
                        return (
                            <TouchableOpacity
                                key={tabItem.name}
                                ref={(ref) => {
                                    tabRefs.current[tabItem.name] = ref;
                                }}
                                style={[styles.tabItem, isActive && styles.activeTabItem]}
                                onPress={() => handleTabPress(tabItem.name)}
                            >
                                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                    {tabItem.name}
                                </Text>
                                {isActive && <View style={styles.indicator} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Tab Content */}
            <View style={styles.content}>
                {CurrentComponent ? (
                    <CurrentComponent />
                ) : (
                    <Text style={styles.errorText}>Tab not found: {currentTab}</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    tabBar: {
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#dde2e4',
        elevation: 0,
    },
    tabScrollContent: {
        paddingHorizontal: 16,
    },
    tabItem: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 8,
        position: 'relative',
        minHeight: 48,
        justifyContent: 'center',
    },
    activeTabItem: {
        // Active styles handled by indicator
    },
    tabText: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        color: '#121517',
        textAlign: 'center',
    },
    activeTabText: {
        color: '#121517',
    },
    indicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#121517',
        borderRadius: 999,
    },
    content: {
        flex: 1,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: '#666',
    },
});

export default Manage