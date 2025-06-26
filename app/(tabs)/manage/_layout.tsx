import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import React, { useLayoutEffect } from 'react'
import { Text } from 'react-native'

// Import separate screens
import AgentsScreen from './AgentScreen'
import CustomersScreen from './CustomerScreen'
import FranchiseScreen from './FranchiseScreen'
import ProductsScreen from './ProductsScreen'

const Tab = createMaterialTopTabNavigator()

const Manage = () => {
    const navigation = useNavigation()

    const { tab } = useLocalSearchParams();
    const initialTab = typeof tab === 'string' ? tab : 'Franchises';


    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <Text style={{}}>MANAGE</Text>
            ),
            headerTitleAlign: 'center',
            headerShadowVisible: false,
        });
    }, [navigation]);

    return (
        <Tab.Navigator
            initialRouteName={initialTab}
            screenOptions={{
                swipeEnabled: false,

                tabBarScrollEnabled: true,
                tabBarActiveTintColor: '#121517', // active tab text color
                tabBarInactiveTintColor: '#121517', // inactive tab text color
                tabBarIndicatorStyle: {
                    backgroundColor: '#121517', // underline color for active tab
                    height: 3,
                    borderRadius: 999,
                },
                tabBarLabelStyle: {
                    fontSize: 18,
                    fontFamily: 'Outfit_600SemiBold', // 👈 use your custom font here
                    textTransform: 'none',
                },
                tabBarStyle: {
                    backgroundColor: 'white',
                    borderBottomWidth: 1,
                    borderColor: '#dde2e4',
                    elevation: 0,
                },
                tabBarItemStyle: {
                    width: 'auto',           // ✅ Don’t force equal width
                },
            }}
        >
            <Tab.Screen name="Products" component={ProductsScreen} />
            <Tab.Screen name="Franchises" component={FranchiseScreen} />

            <Tab.Screen name="Agents" component={AgentsScreen} />
            <Tab.Screen name="Customers" component={CustomersScreen} />
        </Tab.Navigator>
    )
}

export default Manage
