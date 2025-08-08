import { PushNotificationService } from '@/lib/utils/PushNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    FirebaseAuthTypes, getAuth,
    signInWithPhoneNumber,
    signOut
} from '@react-native-firebase/auth';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiService } from '../api/api';

export enum UserRole {
    CUSTOMER = 'customer',
    ADMIN = 'admin',
    FRANCHISE_OWNER = 'franchise_owner',
    SERVICE_AGENT = 'service_agent',
}

export enum CustomerType {
    CUSTOMER = 'customer',
    ADMIN = 'admin',
    FRANCHISE = 'franchise_owner',
    AGENT = 'service_agent',
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
    targetFranchiseName?: string;
    targetUserName?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    viewAsState: ViewAsState;

    // Auth methods
    sendOTP: (phoneNumber: string, customerType: CustomerType) => Promise<FirebaseAuthTypes.ConfirmationResult>;
    verifyOTP: (otp: string, role: string) => Promise<boolean>;
    logout: () => Promise<void>;

    // Backend-integrated view functionality
    viewAsFranchiseOwner: (franchiseId: string, franchiseName: string) => Promise<boolean>;
    viewAsServiceAgent: (agentId: string, agentName: string, franchiseId: string) => Promise<boolean>;
    exitViewAs: () => Promise<boolean>;

    // Permission checking
    hasPermission: (permission: string) => boolean;
    canAccessScreen: (screenName: string) => boolean;
    canAccessTab: (tabName: string) => boolean;

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

    // Get push notification service instance
    const pushNotificationService = PushNotificationService.getInstance();

    useEffect(() => {
        initializeAuth();

        // Setup notification listeners
        const listeners = pushNotificationService.setupNotificationListeners();

        // Cleanup listeners on unmount
        return () => {
            listeners.notificationListener.remove();
            listeners.responseListener.remove();
        };
    }, []);

    // Initialize push notifications when user logs in
    useEffect(() => {
        if (user && !viewAsState.isViewingAs) {
            // Initialize push notifications after successful login
            pushNotificationService.initializePushNotifications();
        }
    }, [user, viewAsState.isViewingAs]);

    const initializeAuth = async () => {
        try {
            setIsLoading(true);
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

                    // Verify view-as session is still valid with backend
                    try {
                        const statusResponse = await apiService.get('/view-as/status');
                        if (!statusResponse.success || !statusResponse.data.isViewingAs) {
                            // View-as session expired, clear local state
                            await clearViewAsState();
                        }
                    } catch (error) {
                        console.log('Error checking view-as status:', error);
                        await clearViewAsState();
                    }
                }

                // Validate token with backend
                await refreshUser();
            }
        } catch (error) {
            console.log('Auth initialization error:', error);
            await clearAuthData();
        } finally {
            setIsLoading(false);
        }
    };

    const clearViewAsState = async () => {
        setViewAsState({
            isViewingAs: false,
            originalUser: null,
            currentViewRole: null,
        });
        await AsyncStorage.removeItem('viewAsState');
    };

    const sendOTP = async (phoneNumber: string, customerType: CustomerType): Promise<FirebaseAuthTypes.ConfirmationResult> => {
        try {
            console.log('=== Starting OTP Process ===');
            console.log('Phone number:', phoneNumber);
            console.log('Customer type:', customerType);

            const formattedPhone = '+91' + phoneNumber.replace(/\D/g, '');
            console.log('Formatted phone:', formattedPhone);

            const confirmation = await signInWithPhoneNumber(getAuth(), formattedPhone);

            console.log('=== OTP Sent Successfully ===');
            setConfirmation(confirmation);
            return confirmation;
        } catch (error) {
            console.log('=== OTP Error ===');
            console.log('Error details:', error);
            throw error;
        }
    };

    const verifyOTP = async (otp: string, role: string): Promise<boolean> => {
        try {
            if (!confirmation) {
                throw new Error('No OTP confirmation found. Please request a new OTP.');
            }

            // Verify OTP with Firebase
            const result = await confirmation.confirm(otp);
            const idToken = await result.user.getIdToken();

            console.log('Firebase verification successful, sending to backend...');

            // Send idToken and role to backend for authentication
            const response = await apiService.post('/auth/login', {
                idToken,
                role,
            });

            console.log('Backend login response:', response);

            if (response.success) {
                const { accessToken, refreshToken, user: userData, franchiseId } = response.data;

                // Store tokens and user data
                await AsyncStorage.multiSet([
                    ['accessToken', accessToken],
                    ['refreshToken', refreshToken],
                    ['userProfile', JSON.stringify(userData)],
                ]);

                const userWithFranchise = { ...userData, franchiseId };
                setUser(userWithFranchise);
                setConfirmation(null);

                return true;
            } else {
                throw new Error(response.error || 'Login failed');
            }
        } catch (error: any) {
            console.log('Verify OTP error:', error);
            setConfirmation(null);

            if (error.code === 'auth/invalid-verification-code') {
                throw new Error('Invalid OTP. Please check the code and try again.');
            } else if (error.code === 'auth/code-expired') {
                throw new Error('OTP has expired. Please request a new code.');
            } else {
                throw new Error(error.message || 'OTP verification failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Clear push notification token
            await pushNotificationService.clearToken();

            // Sign out from Firebase
            await signOut(getAuth());

            // Clear local storage
            await clearAuthData();

            // Reset state
            setUser(null);
            setConfirmation(null);
            await clearViewAsState();

            router.replace('/(auth)')
        } catch (error) {
            console.log('Logout error:', error);
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

    // Backend-integrated view functionality
    const viewAsFranchiseOwner = async (franchiseId: string, franchiseName: string): Promise<boolean> => {
        try {
            if (!user || user.role !== UserRole.ADMIN) {
                throw new Error('Only admins can view as franchise owners');
            }

            setIsLoading(true);

            const response = await apiService.post('/view-as/franchise-owner', {
                franchiseId
            });

            if (response.success) {
                const { accessToken, viewAsContext } = response.data;

                // Update token
                await AsyncStorage.setItem('accessToken', accessToken);

                // Create view-as state
                const newViewAsState: ViewAsState = {
                    isViewingAs: true,
                    originalUser: user,
                    currentViewRole: UserRole.FRANCHISE_OWNER,
                    targetFranchiseId: franchiseId,
                    targetFranchiseName: franchiseName,
                };

                // Create franchise user
                const franchiseUser: User = {
                    ...user,
                    role: UserRole.FRANCHISE_OWNER,
                    customerType: CustomerType.FRANCHISE,
                    franchiseId: franchiseId,
                    franchiseName: franchiseName,
                };

                setViewAsState(newViewAsState);
                setUser(franchiseUser);

                // Persist view state
                await AsyncStorage.setItem('viewAsState', JSON.stringify(newViewAsState));

                return true;
            } else {
                throw new Error(response.error || 'Failed to view as franchise owner');
            }
        } catch (error: any) {
            console.log('View as franchise owner error:', error);
            throw new Error(error.message || 'Failed to view as franchise owner');
        } finally {
            setIsLoading(false);
        }
    };

    const viewAsServiceAgent = async (agentId: string, agentName: string, franchiseId: string): Promise<boolean> => {
        try {
            if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.FRANCHISE_OWNER)) {
                throw new Error('Only admins and franchise owners can view as service agents');
            }

            setIsLoading(true);

            const response = await apiService.post('/view-as/service-agent', {
                agentId,
                franchiseId
            });
            console.log('response from bc fro vaservcie ', response)

            if (response.success) {
                const { accessToken, viewAsContext } = response.data;

                // Update token
                await AsyncStorage.setItem('accessToken', accessToken);

                // Create view-as state
                const newViewAsState: ViewAsState = {
                    isViewingAs: true,
                    originalUser: viewAsState.isViewingAs ? viewAsState.originalUser : user,
                    currentViewRole: UserRole.SERVICE_AGENT,
                    targetFranchiseId: franchiseId,
                    targetUserId: agentId,
                    targetUserName: agentName,
                };

                // Create agent user
                const agentUser: User = {
                    ...user,
                    role: UserRole.SERVICE_AGENT,
                    customerType: CustomerType.AGENT,
                    franchiseId: franchiseId,
                    profile: {
                        ...user.profile,
                        name: agentName,
                    }
                };

                setViewAsState(newViewAsState);
                setUser(agentUser);

                // Persist view state
                await AsyncStorage.setItem('viewAsState', JSON.stringify(newViewAsState));

                return true;
            } else {
                throw new Error(response.error || 'Failed to view as service agent');
            }
        } catch (error: any) {
            console.log('View as service agent error:', error);
            throw new Error(error.message || 'Failed to view as service agent');
        } finally {
            setIsLoading(false);
        }
    };

    const exitViewAs = async (): Promise<boolean> => {
        try {
            if (!viewAsState.isViewingAs || !viewAsState.originalUser) {
                return false;
            }

            setIsLoading(true);

            const response = await apiService.post('/view-as/exit');

            if (response.success) {
                const { accessToken } = response.data;

                // Update token
                await AsyncStorage.setItem('accessToken', accessToken);

                // Restore original user
                setUser(viewAsState.originalUser);
                await clearViewAsState();

                return true;
            } else {
                throw new Error(response.error || 'Failed to exit view as mode');
            }
        } catch (error: any) {
            console.log('Exit view as error:', error);
            throw new Error(error.message || 'Failed to exit view as mode');
        } finally {
            setIsLoading(false);
        }
    };

    const hasPermission = (permission: string): boolean => {
        if (!user) return false;

        // If viewing as someone else, check original user's permissions for admin actions
        const checkUser = viewAsState.isViewingAs ? viewAsState.originalUser : user;
        if (!checkUser) return false;

        return checkUser.permissions.includes(permission);
    };

    const canAccessScreen = (screenName: string): boolean => {
        if (!user) return false;

        // Define screen permissions based on roles
        const screenPermissions: Record<string, UserRole[]> = {
            'super-admin-dashboard': [UserRole.ADMIN],
            'franchise-dashboard': [UserRole.ADMIN, UserRole.FRANCHISE_OWNER],
            'agent-dashboard': [UserRole.ADMIN, UserRole.FRANCHISE_OWNER, UserRole.SERVICE_AGENT],
            'franchise-management': [UserRole.ADMIN],
            'user-management': [UserRole.ADMIN, UserRole.FRANCHISE_OWNER],
            'service-requests': [UserRole.ADMIN, UserRole.FRANCHISE_OWNER, UserRole.SERVICE_AGENT],
            'reports': [UserRole.ADMIN, UserRole.FRANCHISE_OWNER],
        };

        const allowedRoles = screenPermissions[screenName];
        return allowedRoles ? allowedRoles.includes(user.role) : true;
    };

    const canAccessTab = (tabName: string): boolean => {
        if (!user) return false;

        // Define tab access based on roles - more restrictive filtering
        const tabPermissions: Record<string, UserRole[]> = {
            'index': [UserRole.ADMIN, UserRole.FRANCHISE_OWNER, UserRole.SERVICE_AGENT], // Dashboard
            'manage': [UserRole.ADMIN, UserRole.FRANCHISE_OWNER], // Manage tab - only admin and franchise
            'orders': [UserRole.ADMIN, UserRole.FRANCHISE_OWNER], // Orders
            'service': [UserRole.ADMIN, UserRole.FRANCHISE_OWNER, UserRole.SERVICE_AGENT], // Service requests
            'notifications': [UserRole.SERVICE_AGENT], // Notifications - only service agents
            'profile': [UserRole.ADMIN, UserRole.FRANCHISE_OWNER, UserRole.SERVICE_AGENT], // Profile
        };

        const allowedRoles = tabPermissions[tabName];
        return allowedRoles ? allowedRoles.includes(user.role) : false;
    };

    const refreshUser = async () => {
        try {
            const response = await apiService.get('/auth/me');
            console.log('response in auth me ', response)
            if (response.success) {
                // Only update if not in view-as mode
                if (!viewAsState.isViewingAs) {
                    setUser({ ...response.data.user, franchiseId: response.data.franchiseId });
                    await AsyncStorage.setItem('userProfile', JSON.stringify(response.data));
                }
            } else {
                await clearAuthData();
                setUser(null);
                await clearViewAsState();
                router.replace('/(auth)')
            }
        } catch (error: any) {
            console.log('Refresh user error:', error);
            // If token is invalid, clear auth data
            if (error?.response?.status === 401) {
                await clearAuthData();
                setUser(null);
                await clearViewAsState();
                router.replace('/(auth)')
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
        canAccessTab,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};