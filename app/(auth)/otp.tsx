import { useAuth } from '@/lib/contexts/AuthContext';
import { router, useNavigation } from 'expo-router';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Alert,
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const otp = () => {
    const navigation = useNavigation();
    const { verifyOTP } = useAuth();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => <Text style={styles.welcomeText}>Verify OTP</Text>,
            headerTitleAlign: 'center',
            headerShadowVisible: false,
        });
    }, [navigation]);

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isComplete, setIsComplete] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => {
        const otpString = otp.join('');
        setIsComplete(otpString.length === 6 && /^\d{6}$/.test(otpString));
    }, [otp]);

    const handleOtpChange = (value, index) => {
        if (value.length > 1 && index === 0) {
            const pastedCode = value.replace(/[^0-9]/g, '').slice(0, 6);
            const newOtp = Array(6).fill('');
            for (let i = 0; i < Math.min(pastedCode.length, 6); i++) {
                newOtp[i] = pastedCode[i];
            }
            setOtp(newOtp);
            if (pastedCode.length >= 6) {
                inputRefs.current[5]?.blur();
            } else if (pastedCode.length > 0) {
                inputRefs.current[Math.min(pastedCode.length, 5)]?.focus();
            }
            return;
        }

        if (value.length <= 1 && (/^\d$/.test(value) || value === '')) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);
            if (value !== '' && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyPress = (key, index) => {
        if (key === 'Backspace') {
            if (otp[index] === '' && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            } else if (otp[index] !== '') {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const handleVerifyOTP = async () => {
        const otpString = otp.join('');
        if (isComplete) {
            setLoading(true);
            try {
                await verifyOTP(otpString);
                router.replace('/(tabs)');
            } catch (e) {
                Alert.alert('Error', e.message || 'OTP verification failed');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleResendOTP = () => {
        Alert.alert('OTP Resent', 'A new OTP has been sent to your phone number.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
    };

    const renderOtpInput = (index) => (
        <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
                styles.otpInput,
                otp[index] ? styles.filledInput : styles.emptyInput,
                loading && { opacity: 0.6 }
            ]}
            value={otp[index]}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            keyboardType="numeric"
            maxLength={6}
            textAlign="center"
            selectTextOnFocus={true}
            editable={!loading}
            blurOnSubmit={false}
        />
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Enter the code</Text>
            <Text style={styles.description}>
                We sent a verification code to your phone number. Please enter it below.
            </Text>

            <View style={styles.otpContainer}>
                {Array.from({ length: 6 }, (_, index) => renderOtpInput(index))}
            </View>

            <TouchableOpacity
                style={[
                    styles.verifyButton,
                    isComplete ? styles.activeButton : styles.inactiveButton,
                    loading && { opacity: 0.6 }
                ]}
                onPress={handleVerifyOTP}
                disabled={!isComplete || loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Verify OTP</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.didntReceiveText}>Didn't receive the code?</Text>

            <TouchableOpacity
                onPress={handleResendOTP}
                style={styles.resendContainer}
                disabled={loading}
            >
                <Text style={styles.resendText}>Resend OTP</Text>
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
    description: {
        color: '#111618',
        fontSize: 18,
        fontFamily: 'Outfit_500Medium',
        paddingBottom: 12,
        paddingTop: 4,
        lineHeight: 24,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        paddingVertical: 12,
    },
    otpInput: {
        height: 56,
        width: 48,
        borderRadius: 12,
        fontSize: 18,
        fontFamily: 'Outfit_500Medium',
        color: '#111618',
    },
    emptyInput: {
        backgroundColor: '#f0f3f5',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    filledInput: {
        backgroundColor: '#f0f3f5',
        borderWidth: 2,
        borderColor: '#dbe3e6',
    },
    verifyButton: {
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 12,
    },
    activeButton: {
        backgroundColor: '#20b7f3',
    },
    inactiveButton: {
        backgroundColor: '#d0d0d0',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
    },
    didntReceiveText: {
        color: '#607e8a',
        fontSize: 16,
        textAlign: 'center',
        paddingBottom: 12,
        paddingTop: 4,
        fontFamily: 'Outfit_500Medium',
    },
    resendContainer: {
        alignItems: 'center',
        paddingBottom: 12,
        paddingTop: 4,
    },
    resendText: {
        color: '#607e8a',
        fontSize: 16,
        textDecorationLine: 'underline',
        fontFamily: 'Outfit_500Medium',
    },
    welcomeText: {
        color: '#111618',
        fontSize: 24,
        textAlign: 'left',
        paddingBottom: 12,
        paddingTop: 20,
        fontFamily: 'Outfit_700Bold',
    },
});

export default otp;
