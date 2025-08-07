import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/contexts/AuthContext';
import { PushNotificationService } from './PushNotificationService';

export const usePushNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const pushService = PushNotificationService.getInstance();

  useEffect(() => {
    if (isAuthenticated && user) {
      initializePushNotifications();
    }
  }, [isAuthenticated, user]);

  const initializePushNotifications = async () => {
    try {
      // Get current token if available
      const currentToken = pushService.getCurrentToken();
      if (currentToken) {
        setPushToken(currentToken);
        setPermissionStatus('granted');
        return;
      }

      // Request permissions and get token
      const token = await pushService.requestPermissionsAndGetToken();
      if (token) {
        setPushToken(token);
        setPermissionStatus('granted');
        
        // Register with backend
        await pushService.registerTokenWithBackend(token);
      } else {
        setPermissionStatus('denied');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      setPermissionStatus('denied');
    }
  };

  const requestPermissions = async () => {
    try {
      const token = await pushService.requestPermissionsAndGetToken();
      if (token) {
        setPushToken(token);
        setPermissionStatus('granted');
        await pushService.registerTokenWithBackend(token);
        return true;
      } else {
        setPermissionStatus('denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting push permissions:', error);
      setPermissionStatus('denied');
      return false;
    }
  };

  return {
    pushToken,
    permissionStatus,
    requestPermissions,
    isEnabled: permissionStatus === 'granted' && !!pushToken,
  };
};