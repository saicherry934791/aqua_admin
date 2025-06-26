import React, { useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useLocalSearchParams } from 'expo-router';
// Replace this with your actual component

const FranchiseDetails = () => {
    const navigation = useNavigation();
    const { id } = useLocalSearchParams();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <Text style={styles.headerTitle}>FRANCHISE DETAILS</Text>
            ),
            headerTitleAlign: 'center',

        });
    }, [navigation]);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerContainer}>
                <Image
                    source={{ uri: 'https://via.placeholder.com/80' }}
                    style={styles.logo}
                    resizeMode="cover"
                />
                <View style={styles.franchiseInfo}>
                    <Text style={styles.franchiseTitle}>Metro Franchise #{id}</Text>
                    <Text style={styles.franchiseLocation}>Mumbai, Maharashtra</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Overview</Text>

            <View style={styles.infoWrapper}>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Owner</Text>
                    <Text style={styles.value}>Rajesh Kumar</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Employees</Text>
                    <Text style={styles.value}>25</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Revenue</Text>
                    <Text style={styles.value}>₹2.5L/month</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Outlets</Text>
                    <Text style={styles.value}>5</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Established</Text>
                    <Text style={styles.value}>2023</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        color: '#121516',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    logo: {
        width: 64,
        height: 64,
        borderRadius: 12,
        marginRight: 16,
    },
    franchiseInfo: {
        flex: 1,
    },
    franchiseTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        color: '#121516',
    },
    franchiseLocation: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#687b82',
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Outfit_700Bold',
        color: '#121516',
        marginTop: 12,
        paddingHorizontal: 16,
    },
    infoWrapper: {
        paddingHorizontal: 16,
        marginTop: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: '#dde2e4',
    },
    label: {
        fontSize: 16,
        color: '#687b82',
        fontFamily: 'Outfit_400Regular',
        width: '50%',
    },
    value: {
        fontSize: 16,
        color: '#121516',
        fontFamily: 'Outfit_700Bold',
        textAlign: 'right',
        width: '50%',
    },
});

export default FranchiseDetails;
