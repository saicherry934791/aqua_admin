import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiService } from '@/lib/api/api';
import { useAuth, UserRole } from '@/lib/contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'service_request' | 'order_update' | 'system' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: {
    orderId?: string;
    serviceRequestId?: string;
    customerId?: string;
  };
}

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  // Mock data for service agents
  const mockNotifications: Notification[] = [
    {
      id: 'notif-1',
      title: 'New Service Request Assigned',
      message: 'You have been assigned a new water purifier installation at Hyderabad Central.',
      type: 'service_request',
      priority: 'high',
      isRead: false,
      createdAt: '2024-06-28T09:30:00Z',
      actionUrl: '/services/sr-1',
      metadata: {
        serviceRequestId: 'sr-1',
        customerId: 'cust-1',
      },
    },
    {
      id: 'notif-2',
      title: 'Order Status Update',
      message: 'Order #ORD123 has been confirmed and is ready for delivery.',
      type: 'order_update',
      priority: 'medium',
      isRead: false,
      createdAt: '2024-06-28T08:15:00Z',
      actionUrl: '/orders/order-1',
      metadata: {
        orderId: 'order-1',
      },
    },
    {
      id: 'notif-3',
      title: 'Maintenance Reminder',
      message: 'Customer Ravi Teja has a scheduled maintenance due today at 2:00 PM.',
      type: 'reminder',
      priority: 'medium',
      isRead: true,
      createdAt: '2024-06-28T07:00:00Z',
      actionUrl: '/services/sr-2',
      metadata: {
        serviceRequestId: 'sr-2',
        customerId: 'cust-1',
      },
    },
    {
      id: 'notif-4',
      title: 'System Update',
      message: 'The mobile app has been updated with new features. Please restart the app.',
      type: 'system',
      priority: 'low',
      isRead: true,
      createdAt: '2024-06-27T18:30:00Z',
    },
    {
      id: 'notif-5',
      title: 'Urgent Service Request',
      message: 'Emergency repair needed at Mumbai West. Customer reports complete system failure.',
      type: 'service_request',
      priority: 'urgent',
      isRead: false,
      createdAt: '2024-06-27T16:45:00Z',
      actionUrl: '/services/sr-3',
      metadata: {
        serviceRequestId: 'sr-3',
        customerId: 'cust-2',
      },
    },
  ];

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // For now, use mock data since this is primarily for service agents
      if (user?.role === UserRole.SERVICE_AGENT) {
        setNotifications(mockNotifications);
      } else {
        // For other roles, you might want to fetch different notifications
        const result = await apiService.get('/notifications');
        setNotifications(result?.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications(mockNotifications); // Fallback to mock data
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiService.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Update locally anyway for better UX
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.patch('/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Update locally anyway
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'service_request':
        return 'build';
      case 'order_update':
        return 'shopping-cart';
      case 'system':
        return 'info';
      case 'reminder':
        return 'schedule';
      default:
        return 'notifications';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { bg: '#FEF2F2', border: '#EF4444', text: '#DC2626' };
      case 'high':
        return { bg: '#FEF3C7', border: '#F59E0B', text: '#D97706' };
      case 'medium':
        return { bg: '#EEF2FF', border: '#3B82F6', text: '#2563EB' };
      case 'low':
        return { bg: '#F0FDF4', border: '#10B981', text: '#059669' };
      default:
        return { bg: '#F9FAFB', border: '#6B7280', text: '#4B5563' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Unread Count */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Ionicons name="notifications" size={16} color="#3B82F6" />
          <Text style={styles.unreadText}>
            You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="notifications-none" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const priorityColors = getPriorityColor(notification.priority);
            
            return (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.isRead && styles.unreadCard,
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationIcon}>
                    <MaterialIcons
                      name={getNotificationIcon(notification.type) as any}
                      size={20}
                      color="#3B82F6"
                    />
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <View style={styles.titleRow}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.isRead && styles.unreadTitle
                      ]}>
                        {notification.title}
                      </Text>
                      {!notification.isRead && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                    
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>
                    
                    <View style={styles.notificationFooter}>
                      <Text style={styles.notificationTime}>
                        {formatDate(notification.createdAt)}
                      </Text>
                      
                      <View style={[
                        styles.priorityBadge,
                        { 
                          backgroundColor: priorityColors.bg,
                          borderColor: priorityColors.border 
                        }
                      ]}>
                        <Text style={[
                          styles.priorityText,
                          { color: priorityColors.text }
                        ]}>
                          {notification.priority.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {notification.actionUrl && (
                    <View style={styles.actionIndicator}>
                      <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Outfit_500Medium',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    color: '#111827',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  markAllText: {
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
    color: '#3B82F6',
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  unreadText: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#3B82F6',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    backgroundColor: '#FEFEFE',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#374151',
    flex: 1,
  },
  unreadTitle: {
    fontFamily: 'Outfit_600SemiBold',
    color: '#111827',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#9CA3AF',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
  },
  actionIndicator: {
    marginLeft: 8,
    paddingLeft: 8,
  },
  bottomPadding: {
    height: 20,
  },
});