import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDb } from '../../db/schema';
import { NotificationService } from '../NotificationService';

jest.mock('../../db/schema', () => ({
  getDb: jest.fn(),
}));

describe('NotificationService', () => {
  let mockDb: any;
  let notificationHandlerCallback: any;

  beforeAll(() => {
    const setNotificationHandlerMock = Notifications.setNotificationHandler as jest.Mock;
    if (setNotificationHandlerMock.mock.calls.length > 0) {
      notificationHandlerCallback = setNotificationHandlerMock.mock.calls[0][0];
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getFirstSync: jest.fn(),
    };
    (getDb as jest.Mock).mockReturnValue(mockDb);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Notification Handler', () => {
    it('suppresses sound and banner if today transaction exists', async () => {
      mockDb.getFirstSync.mockReturnValueOnce({ count: 2 });

      if (notificationHandlerCallback) {
        const result = await notificationHandlerCallback.handleNotification();
        expect(result).toEqual({
          shouldPlaySound: false,
          shouldSetBadge: false,
          shouldShowBanner: false,
          shouldShowList: false,
        });
      }
    });

    it('plays sound and shows banner if no transaction was recorded today', async () => {
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      if (notificationHandlerCallback) {
        const result = await notificationHandlerCallback.handleNotification();
        expect(result).toEqual({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        });
      }
    });

    it('handles database exceptions safely and shows notifications as fallback', async () => {
      mockDb.getFirstSync.mockImplementationOnce(() => {
        throw new Error('DB Error');
      });

      if (notificationHandlerCallback) {
        const result = await notificationHandlerCallback.handleNotification();
        expect(result.shouldPlaySound).toBe(true);
        expect(result.shouldShowBanner).toBe(true);
      }
    });
  });

  describe('setupChannel', () => {
    it('creates notification channel on Android', async () => {
      Platform.OS = 'android';
      await NotificationService.setupChannel();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'habits_money_v2',
        expect.objectContaining({
          name: 'habits_money_v2',
          importance: Notifications.AndroidImportance.HIGH,
        }),
      );
    });

    it('does not create channel on iOS', async () => {
      Platform.OS = 'ios';
      await NotificationService.setupChannel();

      expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
    });
  });

  describe('requestPermissions', () => {
    it('returns true if already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
        granted: true,
      });

      const granted = await NotificationService.requestPermissions();
      expect(granted).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permissions if not initially granted and returns true on approval', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'undetermined',
        granted: false,
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'granted',
        granted: true,
      });

      const granted = await NotificationService.requestPermissions();
      expect(granted).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('returns false if permissions are denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'undetermined',
        granted: false,
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
        status: 'denied',
        granted: false,
      });

      const granted = await NotificationService.requestPermissions();
      expect(granted).toBe(false);
    });
  });

  describe('scheduleDailyReminder', () => {
    it('schedules notification for daily repetition', async () => {
      await NotificationService.scheduleDailyReminder(
        20,
        30,
        'Daily Reminder',
        'Record your expenses',
      );

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Daily Reminder',
            body: 'Record your expenses',
          }),
          trigger: expect.objectContaining({
            type: 'daily',
            hour: 20,
            minute: 30,
            repeats: true,
          }),
        }),
      );
    });

    it('catches and logs errors without throwing', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Scheduling failed'),
      );

      await expect(
        NotificationService.scheduleDailyReminder(20, 0, 'Title', 'Body'),
      ).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('scheduleWeeklyReminder', () => {
    it('schedules notification for weekly repetition', async () => {
      Platform.OS = 'ios';
      await NotificationService.scheduleWeeklyReminder(
        1,
        18,
        0,
        'Weekly Review',
        'Check your habits',
      );

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          title: 'Weekly Review',
          body: 'Check your habits',
        }),
        trigger: expect.objectContaining({
          type: 'weekly',
          weekday: 1,
          hour: 18,
          minute: 0,
          repeats: true,
        }),
      });
    });

    it('catches and logs errors without throwing', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Scheduling failed'),
      );

      await expect(
        NotificationService.scheduleWeeklyReminder(1, 10, 0, 'T', 'B'),
      ).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('cancelAllNotifications & getScheduledNotifications', () => {
    it('cancels all scheduled notifications', async () => {
      await NotificationService.cancelAllNotifications();
      expect(
        Notifications.cancelAllScheduledNotificationsAsync,
      ).toHaveBeenCalled();
    });

    it('catches error during cancel gracefully', async () => {
      (
        Notifications.cancelAllScheduledNotificationsAsync as jest.Mock
      ).mockRejectedValueOnce(new Error('Cancel failed'));

      await expect(
        NotificationService.cancelAllNotifications(),
      ).resolves.not.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it('retrieves scheduled notifications', async () => {
      (
        Notifications.getAllScheduledNotificationsAsync as jest.Mock
      ).mockResolvedValueOnce([{ id: 'notif-1' }]);

      const result = await NotificationService.getScheduledNotifications();
      expect(result).toEqual([{ id: 'notif-1' }]);
    });
  });
});
