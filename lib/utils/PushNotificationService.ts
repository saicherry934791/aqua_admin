import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../api/api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class PushNotificationService {
  private static instance: PushNotificationService;
  private expoPushToken: string | null = null;

  private constructor() {}

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Request notification permissions and get push token
   */
  async requestPermissionsAndGetToken(): Promise<string | null> {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return null;
      }

      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      // Get the token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID ||'042e4ad4-9763-4dcd-b4f0-32c4317cac4e', // Make sure to set this in your .env
      });

      console.log('Expo Push Token:', token.data);
      this.expoPushToken = token.data;

      // Store token locally
      await AsyncStorage.setItem('expoPushToken', token.data);

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Send push token to backend
   */
  async registerTokenWithBackend(token: string): Promise<boolean> {
    try {
      const response = await apiService.post('/auth/register-push-token', {
        token: token
      });

      if (response.success) {
        console.log('Push token registered successfully');
        await AsyncStorage.setItem('tokenRegistered', 'true');
        return true;
      } else {
        console.error('Failed to register push token:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Error registering push token:', error);
      return false;
    }
  }

  /**
   * Initialize push notifications (call this after login)
   */
  async initializePushNotifications(): Promise<void> {
    try {
      // Get stored token first
      const storedToken = await AsyncStorage.getItem('expoPushToken');
      const tokenRegistered = await AsyncStorage.getItem('tokenRegistered');

      if (storedToken && tokenRegistered === 'true') {
        this.expoPushToken = storedToken;
        console.log('Using stored push token:', storedToken);
        return;
      }

      // Request new token and register
      const token = await this.requestPermissionsAndGetToken();
      if (token) {
        const registered = await this.registerTokenWithBackend(token);
        if (!registered) {
          // Retry registration on next app launch
          await AsyncStorage.removeItem('tokenRegistered');
        }
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  /**
   * Setup notification listeners
   */
  setupNotificationListeners() {
    // Handle notification received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can show custom in-app notification here if needed
    });

    // Handle user tapping on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data) {
        this.handleNotificationNavigation(data);
      }
    });

    return { notificationListener, responseListener };
  }

  /**
   * Handle navigation when notification is tapped
   */
  private handleNotificationNavigation(data: any) {
    // Implement navigation logic based on notification data
    // Example:
    if (data.screen) {
      // Use your router to navigate
      // router.push(data.screen);
    }
  }

  /**
   * Clear token (call on logout)
   */
  async clearToken(): Promise<void> {
    try {
      this.expoPushToken = null;
      await AsyncStorage.multiRemove(['expoPushToken', 'tokenRegistered']);
      
      // Optionally, unregister token from backend
      // await apiService.post('/notifications/unregister-token');
    } catch (error) {
      console.error('Error clearing push token:', error);
    }
  }

  /**
   * Get current push token
   */
  getCurrentToken(): string | null {
    return this.expoPushToken;
  }
}