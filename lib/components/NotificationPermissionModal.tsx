import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePushNotifications } from '../utils/usePushNotifications';
import { useAuth } from '../contexts/AuthContext';


interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  visible,
  onClose,
}) => {
  const { requestPermissions, permissionStatus } = usePushNotifications();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const granted = await requestPermissions();
      if (granted) {
        Alert.alert(
          'Success!',
          'Notifications enabled successfully. You\'ll now receive important updates.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'Permission Denied',
          'You can enable notifications later in your device settings.',
          [{ text: 'OK', onPress: onClose }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to enable notifications. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = async () => {
    // Remember that user skipped
    await AsyncStorage.setItem('notificationPermissionSkipped', 'true');
    onClose();
  };

  return (
    <>
    </>
  );
};

// Hook to manage when to show the permission modal
export const useNotificationPermissionModal = () => {
  const { user, isAuthenticated } = useAuth();
  const { permissionStatus } = usePushNotifications();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    checkShouldShowModal();
  }, [user, isAuthenticated, permissionStatus]);

  const checkShouldShowModal = async () => {
    if (!isAuthenticated || !user) {
      setShouldShow(false);
      return;
    }

    try {
      const skipped = await AsyncStorage.getItem('notificationPermissionSkipped');
      const hasAsked = await AsyncStorage.getItem('notificationPermissionAsked');

      // Show modal if:
      // 1. User is authenticated
      // 2. Permission is not granted
      // 3. User hasn't skipped
      // 4. We haven't asked before (optional - remove this condition if you want to ask repeatedly)
      const shouldShowModal =
        permissionStatus !== 'granted' &&
        skipped !== 'true' &&
        hasAsked !== 'true';

      setShouldShow(shouldShowModal);

      if (shouldShowModal) {
        // Mark that we've asked
        await AsyncStorage.setItem('notificationPermissionAsked', 'true');
      }
    } catch (error) {
      console.error('Error checking notification permission modal state:', error);
    }
  };

  const hideModal = () => {
    setShouldShow(false);
  };

  return {
    shouldShow,
    hideModal,
  };
};
