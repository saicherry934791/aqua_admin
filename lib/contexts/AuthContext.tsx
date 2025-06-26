import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
    getAuth,
    signInWithPhoneNumber,
    connectAuthEmulator,
    signOut
} from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiService } from '../api/api';

// // Initialize Firebase app and auth
// const app = getApp();
// const auth = getAuth(app);

// if (__DEV__) {
//     // Use your computer's IP address, not localhost
//     const EMULATOR_HOST = '192.168.2.38'; // For Android emulator
//     // const EMULATOR_HOST = 'localhost'; // For iOS simulator
//     // const EMULATOR_HOST = '10.0.2.2'; // Alternative for Android emulator

//     try {
//         // connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`)
//         auth.useEmulator("http://192.168.2.38:9099")
//         console.log('connected emulator ')
//     } catch (error) {
//         console.log('Emulator already connected or error:', error);
//     }
// }

export enum UserRole {
    SUPER_ADMIN = 'admin',
    FRANCHISE_OWNER = 'FRANCHISE_OWNER',
    SERVICE_AGENT = 'SERVICE_AGENT',
}

export enum CustomerType {
    ADMIN = 'ADMIN',
    FRANCHISE = 'FRANCHISE',
    AGENT = 'AGENT',
}

export interface User {
    id: string;
    phoneNumber: string;
    role: UserRole;
    customerType: CustomerType;
    franchiseId?: string;
    franchiseName?: string;
    permissions: string[];
    profile: {
        name: string;
        email?: string;
        avatar?: string;
    };
}

export interface ViewAsState {
    isViewingAs: boolean;
    originalUser: User | null;
    currentViewRole: UserRole | null;
    targetFranchiseId?: string;
    targetUserId?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    viewAsState: ViewAsState;

    // Auth methods
    sendOTP: (phoneNumber: string, customerType: CustomerType) => Promise<FirebaseAuthTypes.ConfirmationResult>;
    verifyOTP: (otp: string) => Promise<boolean>;
    logout: () => Promise<void>;

    // View As functionality
    viewAsFranchiseOwner: (franchiseId: string) => Promise<boolean>;
    viewAsServiceAgent: (agentId: string, franchiseId: string) => Promise<boolean>;
    exitViewAs: () => Promise<void>;

    // Permission checking
    hasPermission: (permission: string) => boolean;
    canAccessScreen: (screenName: string) => boolean;

    // Refresh user data
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
    const [viewAsState, setViewAsState] = useState<ViewAsState>({
        isViewingAs: false,
        originalUser: null,
        currentViewRole: null,
    });

    const isAuthenticated = !!user;

    useEffect(() => {
        initializeAuth();
    }, []);

    const initializeAuth = async () => {
        try {
            const [accessToken, userProfile, viewAsData] = await AsyncStorage.multiGet([
                'accessToken',
                'userProfile',
                'viewAsState'
            ]);

            if (accessToken[1] && userProfile[1]) {
                const parsedUser = JSON.parse(userProfile[1]);
                setUser(parsedUser);

                if (viewAsData[1]) {
                    const parsedViewAs = JSON.parse(viewAsData[1]);
                    setViewAsState(parsedViewAs);
                }

                // Validate token with backend
                await refreshUser();
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
            await clearAuthData();
        } finally {
            setIsLoading(false);
        }
    };

    const sendOTP = async (phoneNumber: string, customerType: CustomerType): Promise<FirebaseAuthTypes.ConfirmationResult> => {
        try {
            console.log('=== Starting OTP Process ===');
            console.log('Phone number:', phoneNumber);
            console.log('Customer type:', customerType);
            console.log('Is emulator?', __DEV__);

            const formattedPhone = '+91' + phoneNumber.replace(/\D/g, ''); // Remove non-digits
            console.log('Formatted phone:', formattedPhone);

            console.log('Calling signInWithPhoneNumber...');

            // Add timeout to prevent hanging
            const confirmation = await Promise.race([
                await signInWithPhoneNumber(getAuth(), formattedPhone),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
                )
            ]);

            console.log('=== OTP Sent Successfully ===');
            console.log('Confirmation received ', confirmation);
            setConfirmation(confirmation)
            return confirmation;
        } catch (error) {
            console.log('=== OTP Error ===');
            console.error('Error details:', error);
            throw error;
        }
    };

    const verifyOTP = async (otp: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            if (!confirmation) {
                return false
            }

            // Verify OTP with React Native Firebase
            const result = await confirmation.confirm(otp);

            console.log('result is ', result)
            const idToken = await result.user.getIdToken();

            console.log('idToken is ', idToken)

            // Send idToken to backend for authentication
            const response = await apiService.post('/auth/login', {
                idToken,
                phoneNumber: result.user.phoneNumber,
                customerType: CustomerType, // Make sure to pass the actual customerType parameter
            });

            console.log('response is ', response)

            if (response.success) {
                const { accessToken, refreshToken, user: userData } = response.data;

                // Store tokens and user data
                await AsyncStorage.multiSet([
                    ['accessToken', accessToken],
                    ['refreshToken', refreshToken],
                    ['userProfile', JSON.stringify(userData)],
                ]);

                setUser(userData);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Verify OTP error:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);

            // Sign out from React Native Firebase using modular SDK
            await signOut(auth);

            // Clear local storage
            await clearAuthData();

            // Reset state
            setUser(null);
            setViewAsState({
                isViewingAs: false,
                originalUser: null,
                currentViewRole: null,
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const clearAuthData = async () => {
        await AsyncStorage.multiRemove([
            'accessToken',
            'refreshToken',
            'userProfile',
            'viewAsState'
        ]);
    };

    const viewAsFranchiseOwner = async (franchiseId: string): Promise<boolean> => {
        if (!user || user.role !== UserRole.SUPER_ADMIN) {
            return false;
        }

        try {
            const response = await apiService.post('/auth/view-as-franchise', {
                franchiseId,
            });

            if (response.success) {
                const { viewAsUser, accessToken } = response.data;

                // Update tokens
                await AsyncStorage.setItem('accessToken', accessToken);

                // Set view as state
                const newViewAsState: ViewAsState = {
                    isViewingAs: true,
                    originalUser: user,
                    currentViewRole: UserRole.FRANCHISE_OWNER,
                    targetFranchiseId: franchiseId,
                };

                setViewAsState(newViewAsState);
                setUser(viewAsUser);

                await AsyncStorage.setItem('viewAsState', JSON.stringify(newViewAsState));

                return true;
            }
        } catch (error) {
            console.error('View as franchise owner error:', error);
        }

        return false;
    };

    const viewAsServiceAgent = async (agentId: string, franchiseId: string): Promise<boolean> => {
        if (!user || (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.FRANCHISE_OWNER)) {
            return false;
        }

        try {
            const response = await apiService.post('/auth/view-as-agent', {
                agentId,
                franchiseId,
            });

            if (response.success) {
                const { viewAsUser, accessToken } = response.data;

                await AsyncStorage.setItem('accessToken', accessToken);

                const newViewAsState: ViewAsState = {
                    isViewingAs: true,
                    originalUser: viewAsState.isViewingAs ? viewAsState.originalUser : user,
                    currentViewRole: UserRole.SERVICE_AGENT,
                    targetFranchiseId: franchiseId,
                    targetUserId: agentId,
                };

                setViewAsState(newViewAsState);
                setUser(viewAsUser);

                await AsyncStorage.setItem('viewAsState', JSON.stringify(newViewAsState));

                return true;
            }
        } catch (error) {
            console.error('View as service agent error:', error);
        }

        return false;
    };

    const exitViewAs = async () => {
        if (!viewAsState.isViewingAs || !viewAsState.originalUser) {
            return;
        }

        try {
            const response = await apiService.post('/auth/exit-view-as');

            if (response.success) {
                const { accessToken } = response.data;

                await AsyncStorage.setItem('accessToken', accessToken);
                await AsyncStorage.removeItem('viewAsState');

                setUser(viewAsState.originalUser);
                setViewAsState({
                    isViewingAs: false,
                    originalUser: null,
                    currentViewRole: null,
                });
            }
        } catch (error) {
            console.error('Exit view as error:', error);
        }
    };

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;
        return user.permissions.includes(permission);
    };

    const canAccessScreen = (screenName: string): boolean => {
        if (!user) return false;

        // Define screen permissions based on roles
        const screenPermissions: Record<string, UserRole[]> = {
            'super-admin-dashboard': [UserRole.SUPER_ADMIN],
            'franchise-dashboard': [UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER],
            'agent-dashboard': [UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.SERVICE_AGENT],
            'franchise-management': [UserRole.SUPER_ADMIN],
            'user-management': [UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER],
            'service-requests': [UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER, UserRole.SERVICE_AGENT],
            'reports': [UserRole.SUPER_ADMIN, UserRole.FRANCHISE_OWNER],
        };

        const allowedRoles = screenPermissions[screenName];
        return allowedRoles ? allowedRoles.includes(user.role) : true;
    };

    const refreshUser = async () => {
        try {
            const response = await apiService.get('/auth/me');
            if (response.success) {
                setUser(response.data);
                await AsyncStorage.setItem('userProfile', JSON.stringify(response.data));
            }
        } catch (error) {
            console.error('Refresh user error:', error);
            // If token is invalid, clear auth data
            if (error?.response?.status === 401) {
                await clearAuthData();
                setUser(null);
            }
        }
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated,
        viewAsState,
        sendOTP,
        verifyOTP,
        logout,
        viewAsFranchiseOwner,
        viewAsServiceAgent,
        exitViewAs,
        hasPermission,
        canAccessScreen,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};