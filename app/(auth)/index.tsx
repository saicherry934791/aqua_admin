import { apiService } from '@/lib/api/api';
import { CustomerType, useAuth } from '@/lib/contexts/AuthContext';
import { useNavigation } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert
} from 'react-native';

const Login = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedRole, setSelectedRole] = useState('admin');
    const [isLoading, setIsLoading] = useState(false);

    const { sendOTP } = useAuth();
    const navigation = useNavigation();

    const isValidPhoneNumber = (number: string) => {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(number);
    };

    const handlePhoneNumberChange = (text: string) => {
        const numericText = text.replace(/[^0-9]/g, '');
        if (numericText.length <= 10) {
            setPhoneNumber(numericText);
        }
    };

    const handleSendOTP = async () => {
        if (!isValidPhoneNumber(phoneNumber)) {
            Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
            return;
        }

        setIsLoading(true);
        try {
            // First check if user exists with the selected role
            const result = await apiService.get(
                `/auth/checkrole?phoneNumber=${phoneNumber}&role=${selectedRole}`
            );

            console.log('Role check result:', result);

            if (result.success) {
                if (result.data.exists && result.data.role === selectedRole) {
                    // User exists with correct role, proceed with OTP
                    const confirmation = await sendOTP(phoneNumber, selectedRole as CustomerType);
                    console.log('OTP sent successfully:', confirmation);
                    navigation.navigate('otp' as never, { 
                        role: selectedRole,
                        phoneNumber: phoneNumber,
                        userId: result.data.userId 
                    } as never);
                } else if (result.data.exists && result.data.role !== selectedRole) {
                    // User exists but with different role
                    Alert.alert(
                        'Role Mismatch', 
                        `This phone number is registered as ${result.data.role}. Please select the correct role or contact support.`
                    );
                } else {
                    // User doesn't exist
                    Alert.alert(
                        'User Not Found', 
                        'No account found with this phone number and role. Please contact your administrator to create an account.'
                    );
                }
            } else {
                Alert.alert('Error', result.error || 'Failed to verify user. Please try again.');
            }
        } catch (error) {
            console.error('Failed to send OTP:', error);
            Alert.alert('Error', 'Failed to send OTP. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <Text style={styles.welcomeText}>AQUA HOME</Text>
            ),
            headerTitleAlign: 'center',
            headerShadowVisible: false,
        });
    }, [navigation]);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome back</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneInputWrapper}>
                    <Text style={styles.countryCode}>+91</Text>
                    <TextInput
                        style={styles.phoneInput}
                        placeholder="Enter your phone number"
                        placeholderTextColor="#607e8a"
                        value={phoneNumber}
                        onChangeText={handlePhoneNumberChange}
                        keyboardType="numeric"
                        maxLength={10}
                        editable={!isLoading}
                    />
                </View>
            </View>

            <View style={styles.roleSection}>
                <Text style={styles.roleLabel}>Select Role</Text>
                <View style={styles.roleSelectorContainer}>
                    {['admin', 'Franchise', 'Agent'].map((role) => (
                        <TouchableOpacity
                            key={role}
                            style={[
                                styles.roleTab,
                                selectedRole === role && styles.activeRoleTab
                            ]}
                            onPress={() => setSelectedRole(role)}
                            disabled={isLoading}
                        >
                            <Text
                                style={[
                                    styles.roleTabText,
                                    selectedRole === role && styles.activeRoleTabText
                                ]}
                            >
                                {role}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.otpButton,
                    isValidPhoneNumber(phoneNumber) ? styles.activeButton : styles.inactiveButton,
                    isLoading && { opacity: 0.6 }
                ]}
                onPress={handleSendOTP}
                disabled={!isValidPhoneNumber(phoneNumber) || isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingHorizontal: 16,
    },
    title: {
        color: '#111618',
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
        textAlign: 'left',
        paddingBottom: 12,
        paddingTop: 20,
    },
    welcomeText: {
        color: '#111618',
        fontSize: 24,
        textAlign: 'left',
        paddingBottom: 12,
        paddingTop: 20,
        fontFamily: 'Outfit_700Bold',
    },
    inputContainer: {
        paddingVertical: 12,
    },
    label: {
        color: '#111618',
        fontSize: 18,
        fontFamily: 'Outfit_500Medium',
        paddingBottom: 8,
    },
    phoneInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f3f5',
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 16,
    },
    countryCode: {
        color: '#111618',
        fontSize: 18,
        fontFamily: 'Outfit_500Medium',
        marginRight: 8,
    },
    phoneInput: {
        flex: 1,
        color: '#111618',
        fontSize: 18,
        height: '100%',
        fontFamily: 'Outfit_500Medium',
    },
    roleSelectorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f0f3f5',
        borderRadius: 12,
        padding: 4,
    },
    roleTab: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 4,
        backgroundColor: '#f0f3f5',
        borderRadius: 8,
        alignItems: 'center',
    },
    activeRoleTab: {
        backgroundColor: '#20b7f3',
    },
    roleTabText: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
        color: '#111618',
    },
    activeRoleTabText: {
        fontFamily: 'Outfit_700Bold',
        color: 'white',
    },
    otpButton: {
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    activeButton: {
        backgroundColor: '#20b7f3',
    },
    inactiveButton: {
        backgroundColor: '#d0d0d0',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
    },
    roleSection: {
        marginTop: 20,
    },
    roleLabel: {
        color: '#111618',
        fontSize: 18,
        fontFamily: 'Outfit_500Medium',
        paddingBottom: 8,
        paddingLeft: 4,
    },
});

export default Login;