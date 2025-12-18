import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface PushToken {
  userId: string;
  token: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;
  createdAt: number;
  updatedAt: number;
}

// Register for push notifications
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permission');
      return null;
    }

    // Get Expo push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with your Expo project ID
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0077BE',
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

// Save push token to database
export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    const deviceId = await Device.deviceName || 'Unknown Device';
    const platform = Platform.OS as 'ios' | 'android' | 'web';

    const { error } = await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token,
        device_id: deviceId,
        platform,
        device_name: deviceId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,device_id',
      });

    if (error) {
      console.error('Failed to save push token:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error saving push token:', error);
    throw error;
  }
}

// Remove push token from database
export async function removePushToken(userId: string): Promise<void> {
  try {
    const deviceId = await Device.deviceName || 'Unknown Device';

    const { error } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('device_id', deviceId);

    if (error) {
      console.error('Failed to remove push token:', error);
    }
  } catch (error) {
    console.error('Error removing push token:', error);
  }
}

// Send push notification (via Supabase Edge Function)
export async function sendPushNotification(data: {
  userId: string;
  title: string;
  body: string;
  data?: any;
}): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: data.userId,
        title: data.title,
        body: data.body,
        data: data.data,
      },
    });

    if (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

// Schedule local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null,
  });

  return notificationId;
}

// Cancel scheduled notification
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Cancel all scheduled notifications
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get notification permission status
export async function getNotificationPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

// Set up notification listeners
export function setupNotificationListeners(
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
): { cleanup: () => void } {
  const receivedSubscription = Notifications.addNotificationReceivedListener(onNotificationReceived);
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

  return {
    cleanup: () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    },
  };
}

// Update badge count
export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'ios') {
    await Notifications.setBadgeCountAsync(count);
  }
}

// Clear badge count
export async function clearBadgeCount(): Promise<void> {
  await setBadgeCount(0);
}

// Notification types
export enum NotificationType {
  NEW_MESSAGE = 'new_message',
  CONTACT_REQUEST = 'contact_request',
  CONTACT_ACCEPTED = 'contact_accepted',
  BUDDY_NEARBY = 'buddy_nearby',
  DIVE_REMINDER = 'dive_reminder',
  EMERGENCY_ALERT = 'emergency_alert',
}

// Send typed notifications
export async function sendMessageNotification(
  userId: string,
  senderName: string,
  messageText: string,
  conversationId: string
): Promise<void> {
  await sendPushNotification({
    userId,
    title: senderName,
    body: messageText,
    data: {
      type: NotificationType.NEW_MESSAGE,
      conversationId,
    },
  });
}

export async function sendContactRequestNotification(
  userId: string,
  senderName: string,
  requestId: string
): Promise<void> {
  await sendPushNotification({
    userId,
    title: 'New Contact Request',
    body: `${senderName} wants to connect with you`,
    data: {
      type: NotificationType.CONTACT_REQUEST,
      requestId,
    },
  });
}

export async function sendContactAcceptedNotification(
  userId: string,
  accepterName: string,
  conversationId: string
): Promise<void> {
  await sendPushNotification({
    userId,
    title: 'Contact Request Accepted',
    body: `${accepterName} accepted your contact request`,
    data: {
      type: NotificationType.CONTACT_ACCEPTED,
      conversationId,
    },
  });
}

export async function sendBuddyNearbyNotification(
  userId: string,
  buddyName: string,
  distance: number
): Promise<void> {
  await sendPushNotification({
    userId,
    title: 'Buddy Nearby',
    body: `${buddyName} is ${distance}km away`,
    data: {
      type: NotificationType.BUDDY_NEARBY,
    },
  });
}

export async function sendDiveReminderNotification(
  userId: string,
  diveSite: string,
  timeUntil: string
): Promise<void> {
  await sendPushNotification({
    userId,
    title: 'Dive Reminder',
    body: `Your dive at ${diveSite} is ${timeUntil}`,
    data: {
      type: NotificationType.DIVE_REMINDER,
    },
  });
}

export async function sendEmergencyAlertNotification(
  userId: string,
  buddyName: string,
  location: string
): Promise<void> {
  await sendPushNotification({
    userId,
    title: '🚨 EMERGENCY ALERT',
    body: `${buddyName} triggered SOS near ${location}`,
    data: {
      type: NotificationType.EMERGENCY_ALERT,
    },
  });
}
