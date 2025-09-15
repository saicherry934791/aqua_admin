import { apiService } from '@/lib/api/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

const FranchiseDetails = () => {
    const navigation = useNavigation();
    const { id } = useLocalSearchParams();
    const [franchiseData, setFranchiseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <Text style={styles.headerTitle}>FRANCHISE DETAILS</Text>
            ),
            headerTitleAlign: 'center',
        });
    }, [navigation]);

    useEffect(() => {
        fetchFranchiseData();
    }, [id]);

    const fetchFranchiseData = async () => {
        try {
            setLoading(true);
            const response = await apiService.get(`franchises/${id}`);

            console.log('response data from franchise details', JSON.stringify(response.data));
            setFranchiseData(response.data.franchiseArea || response.data);
        } catch (error) {
            Alert.alert("Error", "Failed to load franchise data");
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchFranchiseData();
        setRefreshing(false);
    };

    const openDocument = async (url: string, documentType: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', `Cannot open ${documentType}. URL not supported.`);
            }
        } catch (error) {
            Alert.alert('Error', `Failed to open ${documentType}.`);
        }
    };

    if (loading) {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </ScrollView>
        );
    }

    if (!franchiseData) {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.loadingText}>No franchise data found</Text>
                </View>
            </ScrollView>
        );
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <TouchableWithoutFeedback>
                <View >
                    <View style={styles.headerContainer}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="business" size={32} color="#3B82F6" />
                        </View>
                        <View style={styles.franchiseInfo}>
                            <Text style={styles.franchiseTitle}>{franchiseData.name || 'Franchise'}</Text>
                            <Text style={styles.franchiseLocation}>
                                <Ionicons name="location" size={14} color="#6B7280" />
                                {' '}{franchiseData.city || 'Location not specified'}
                            </Text>
                            <View style={styles.statusContainer}>
                                <View style={[
                                    styles.statusIndicator,
                                    { backgroundColor: franchiseData.isActive ? '#ECFDF5' : '#FEF2F2' }
                                ]}>
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: franchiseData.isActive ? '#10B981' : '#EF4444' }
                                    ]} />
                                    <Text style={[
                                        styles.statusText,
                                        { color: franchiseData.isActive ? '#047857' : '#DC2626' }
                                    ]}>
                                        {franchiseData.isActive ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Overview</Text>

                    <View style={styles.infoWrapper}>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Owner</Text>
                            <Text style={styles.value}>{franchiseData.fullname || franchiseData.ownerName || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Franchise Type</Text>
                            <Text style={styles.value}>{franchiseData.franchiseType || 'N/A'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Phone Number</Text>
                            <Text style={styles.value}>{franchiseData.phonenumber || franchiseData.phoneNumber || 'N/A'}</Text>
                        </View>
                        {/* <View style={styles.infoRow}>
                            <Text style={styles.label}>Revenue</Text>
                            <Text style={styles.value}>₹{franchiseData.revenue || '0'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Service Agents</Text>
                            <Text style={styles.value}>{franchiseData.serviceAgentCount || '0'}</Text>
                        </View> */}
                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Established</Text>
                            <Text style={styles.value}>{formatDate(franchiseData.createdAt)}</Text>
                        </View>

                        {franchiseData.gst_number && (
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>GST Number</Text>
                                <Text style={styles.value}>{franchiseData.gst_number}</Text>
                            </View>
                        )}

                        {/* Additional Details Section */}
                        <Text style={styles.sectionTitle}>Additional Details</Text>

                        <View style={styles.infoWrapper}>
                            {franchiseData.ownerId && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Owner ID</Text>
                                    <Text style={styles.value}>{franchiseData.ownerId}</Text>
                                </View>
                            )}

                            {franchiseData.isCompanyManaged !== undefined && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Company Managed</Text>
                                    <Text style={[styles.value, { color: franchiseData.isCompanyManaged ? '#4CAF50' : '#F59E0B' }]}>
                                        {franchiseData.isCompanyManaged ? 'Yes' : 'No'}
                                    </Text>
                                </View>
                            )}

                            {franchiseData.geoPolygon && franchiseData.geoPolygon.coordinates && franchiseData.geoPolygon.coordinates.length > 0 && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.label}>Service Area</Text>
                                    <Text style={styles.value}>Defined ({franchiseData.geoPolygon.coordinates.length} points)</Text>
                                </View>
                            )}
                        </View>

                        {/* Documents Section */}
                        {(franchiseData.gst_document || (franchiseData.identity_proof && franchiseData.identity_proof.length > 0)) && (
                            <>
                                <Text style={styles.sectionTitle}>Documents</Text>

                                <View style={styles.infoWrapper}>
                                    {franchiseData.gst_document && (
                                        <View style={styles.documentRow}>
                                            <View style={styles.documentInfo}>
                                                <Ionicons name="document-text" size={20} color="#3B82F6" />
                                                <View style={styles.documentDetails}>
                                                    <Text style={styles.documentLabel}>GST Document</Text>
                                                    <Text style={styles.documentStatus}>Available</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.viewDocumentButton}
                                                onPress={() => openDocument(franchiseData.gst_document, 'GST Document')}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="eye" size={16} color="#3B82F6" />
                                                <Text style={styles.viewDocumentText}>View</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {franchiseData.identity_proof && franchiseData.identity_proof.length > 0 && (
                                        <View style={styles.documentRow}>
                                            <View style={styles.documentInfo}>
                                                <Ionicons name="images" size={20} color="#10B981" />
                                                <View style={styles.documentDetails}>
                                                    <Text style={styles.documentLabel}>Identity Proof</Text>
                                                    <Text style={styles.documentStatus}>{franchiseData.identity_proof.length} document(s)</Text>
                                                </View>
                                            </View>
                                            <View style={styles.documentActions}>
                                                {franchiseData.identity_proof.map((proof: string, index: number) => (
                                                    <TouchableOpacity
                                                        key={index}
                                                        style={styles.viewProofButton}
                                                        onPress={() => openDocument(proof, `Identity Proof ${index + 1}`)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Ionicons name="eye" size={14} color="#10B981" />
                                                        <Text style={styles.viewProofText}>View {index + 1}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </TouchableWithoutFeedback>
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
    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
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
        marginBottom: 8,
    },
    statusContainer: {
        marginTop: 4,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignSelf: 'flex-start',
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
    documentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderColor: '#dde2e4',
    },
    documentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    documentDetails: {
        marginLeft: 12,
    },
    documentLabel: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        color: '#111827',
        marginBottom: 2,
    },
    documentStatus: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        color: '#6B7280',
    },
    viewDocumentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    viewDocumentText: {
        fontSize: 12,
        fontFamily: 'Outfit_600SemiBold',
        color: '#3B82F6',
        marginLeft: 4,
    },
    documentActions: {
        flexDirection: 'row',
        gap: 8,
    },
    viewProofButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    viewProofText: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        color: '#10B981',
        marginLeft: 3,
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
    loadingText: {
        fontSize: 16,
        color: '#687b82',
        fontFamily: 'Outfit_400Regular',
        textAlign: 'center',
        marginTop: 40,
    },
});

export default FranchiseDetails;
