import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static CHANNEL_ID = 'default';

  static async setupChannel() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(this.CHANNEL_ID, {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#16A34A',
      });
    }
  }

  static async requestPermissions(): Promise<boolean> {
    const response = (await Notifications.getPermissionsAsync()) as any;
    let finalStatus =
      response.status || (response.granted ? 'granted' : 'denied');

    if (finalStatus !== 'granted') {
      const statusResponse =
        (await Notifications.requestPermissionsAsync()) as any;
      finalStatus =
        statusResponse.status ||
        (statusResponse.granted ? 'granted' : 'denied');
    }

    return finalStatus === 'granted';
  }

  static async scheduleDailyReminder(
    hour: number,
    minute: number,
    title: string,
    body: string,
  ) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...Platform.select({
            android: { channelId: this.CHANNEL_ID },
            default: {},
          }),
        } as any,
        trigger: {
          type: 'daily',
          hour: Math.floor(hour),
          minute: Math.floor(minute),
          repeats: true,
          channelId: this.CHANNEL_ID,
        } as any,
      });
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);
    }
  }

  static async scheduleWeeklyReminder(
    day: number,
    hour: number,
    minute: number,
    title: string,
    body: string,
  ) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...Platform.select({
            android: { channelId: this.CHANNEL_ID },
            default: {},
          }),
        } as any,
        trigger: {
          type: 'weekly',
          weekday: Math.floor(day),
          hour: Math.floor(hour),
          minute: Math.floor(minute),
          repeats: true,
          channelId: this.CHANNEL_ID,
        } as any,
      });
    } catch (error) {
      console.error('Error scheduling weekly reminder:', error);
    }
  }

  static async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  static async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}
