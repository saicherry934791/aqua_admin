import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useLayoutEffect } from 'react'
import { Text } from 'react-native'
import { useAuth, UserRole } from '@/lib/contexts/AuthContext'

// Import separate screens
import AgentsScreen from './AgentScreen'
import CustomersScreen from './CustomerScreen'
import FranchiseScreen from './FranchiseScreen'
import ProductsScreen from './ProductsScreen'
import CategoriesScree from './CategoriesScree'

const Tab = createMaterialTopTabNavigator()

const Manage = () => {
    const navigation = useNavigation()
    const { user } = useAuth()
    const { tab } = useLocalSearchParams();
    const initialTab = typeof tab === 'string' ? tab : getDefaultTab();

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
            { name: 'Customers', component: CustomersScreen, roles: [UserRole.ADMIN, UserRole.FRANCHISE_OWNER] },
        ];

        return allTabs.filter(tab => tab.roles.includes(user.role));
    };

    const availableTabs = getTabsForRole();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <Text
                    style={{
                        fontSize: 20, // equivalent to text-2xl
                        fontFamily: 'Outfit_700Bold', // equivalent to font-grotesk-bold
                        color: '#121516',
                    }}
                >
                    MANAGE
                </Text>
            ),
            headerTitleAlign: 'center',
            headerShadowVisible :false
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
        <Tab.Navigator
            initialRouteName={initialTab}
            screenOptions={{
                swipeEnabled: false,
                tabBarScrollEnabled: true,
                tabBarActiveTintColor: '#121517',
                tabBarInactiveTintColor: '#121517',
                tabBarIndicatorStyle: {
                    backgroundColor: '#121517',
                    height: 3,
                    borderRadius: 999,
                },
                tabBarLabelStyle: {
                    fontSize: 18,
                    fontFamily: 'Outfit_600SemiBold',
                    textTransform: 'none',
                },
                tabBarStyle: {
                    backgroundColor: 'white',
                    borderBottomWidth: 1,
                    borderColor: '#dde2e4',
                    elevation: 0,
                },
                tabBarItemStyle: {
                    width: 'auto',
                },
            }}
        >
            {availableTabs.map((tab) => (
                <Tab.Screen
                    key={tab.name}
                    name={tab.name}
                    component={tab.component}
                />
            ))}
        </Tab.Navigator>
    )
}

export default Manage