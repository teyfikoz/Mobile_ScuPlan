import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
  setupNotificationListeners,
  NotificationType,
  setBadgeCount,
} from '../services/notifications';
import { getCurrentUserProfile } from '../services/auth';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  badgeCount: number;
  updateBadgeCount: (count: number) => void;
  clearBadge: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: null,
  notification: null,
  badgeCount: 0,
  updateBadgeCount: () => {},
  clearBadge: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [badgeCount, setBadgeCountState] = useState(0);
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  const initializePushNotifications = async () => {
    try {
      const token = await registerForPushNotifications();

      if (token) {
        setExpoPushToken(token);

        // Save token to database
        const profile = await getCurrentUserProfile();
        if (profile) {
          await savePushToken(profile.id, token);
        }
      }
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
    }
  };

  const handleNotificationReceived = async (notification: Notifications.Notification) => {
    console.log('Notification received:', notification);
    setNotification(notification);

    // Update badge count
    const newCount = badgeCount + 1;
    setBadgeCountState(newCount);
    await setBadgeCount(newCount);
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    console.log('Notification tapped:', data);

    // Navigate based on notification type
    if (data?.type) {
      switch (data.type) {
        case NotificationType.NEW_MESSAGE:
          if (data.conversationId) {
            router.push(`/chat/${data.conversationId}`);
          }
          break;

        case NotificationType.CONTACT_REQUEST:
          router.push('/contact-requests');
          break;

        case NotificationType.CONTACT_ACCEPTED:
          if (data.conversationId) {
            router.push(`/chat/${data.conversationId}`);
          }
          break;

        case NotificationType.BUDDY_NEARBY:
          router.push('/(tabs)/buddy');
          break;

        case NotificationType.DIVE_REMINDER:
          router.push('/(tabs)/plans');
          break;

        case NotificationType.EMERGENCY_ALERT:
          router.push('/(tabs)');
          break;

        default:
          console.log('Unknown notification type:', data.type);
      }
    }
  };

  const updateBadgeCount = async (count: number) => {
    setBadgeCountState(count);
    await setBadgeCount(count);
  };

  const clearBadge = async () => {
    setBadgeCountState(0);
    await setBadgeCount(0);
  };

  useEffect(() => {
    initializePushNotifications();

    // Set up notification listeners
    const { cleanup } = setupNotificationListeners(
      handleNotificationReceived,
      handleNotificationResponse
    );

    return () => {
      cleanup();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        badgeCount,
        updateBadgeCount,
        clearBadge,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
