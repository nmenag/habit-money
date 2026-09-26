import * as Localization from 'expo-localization';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Divider, Switch, Text, useTheme } from 'react-native-paper';
import { TimePicker } from 'react-native-paper-dates';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { NotificationService } from '../../../services/NotificationService';
import { ReviewManager } from '../../../services/ReviewManager';
import { useStore, useTranslation } from '../../../store/useStore';
import { backupToJSON, restoreFromJSON } from '../../../utils/dataBackup';
import { CURRENCIES } from '../../../constants';
import { AppTheme, spacing, radius, featureColors } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

const addAlpha = (color: string, opacity: number) => {
  if (color && color.startsWith('#')) {
    const hex = color.replace('#', '');
    const alpha = Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${hex}${alpha}`;
  }
  return color;
};

export const SettingsScreen = () => {
  const {
    setLanguage,
    setThemePreference,
    themePreference,
    loadData,
    checkAndShowAd,
    notificationsEnabled,
    notificationTime,
    setNotificationsEnabled,
    setNotificationTime,
    currency,
    setCurrency,
    cycleStartDay,
    setCycleStartDay,
    resetData,
    appLockEnabled,
    setAppLockEnabled,
  } = useStore();

  const { t, language } = useTranslation();
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();

  const notificationHeight = useSharedValue(notificationsEnabled ? 80 : 0);
  const notificationOpacity = useSharedValue(notificationsEnabled ? 1 : 0);

  React.useEffect(() => {
    notificationHeight.value = withTiming(notificationsEnabled ? 80 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    notificationOpacity.value = withTiming(notificationsEnabled ? 1 : 0, {
      duration: 250,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [notificationsEnabled, notificationHeight, notificationOpacity]);

  const animatedReminderStyle = useAnimatedStyle(() => {
    return {
      height: notificationHeight.value,
      opacity: notificationOpacity.value,
      overflow: 'hidden',
    };
  });

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;

    if (newValue) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          t('error') || 'Error',
          'Please enable notifications in your phone settings.',
        );
        return;
      }
    }

    setNotificationsEnabled(newValue);

    if (newValue) {
      const [hour, minute] = notificationTime.split(':').map(Number);
      NotificationService.scheduleDailyReminder(
        hour,
        minute,
        t('notificationDailyTitle') || "Don't forget your finances!",
        t('notificationDailyBody') ||
          'Track your daily expenses to stay on budget.',
      );
      NotificationService.scheduleWeeklyReminder(
        1,
        hour,
        minute,
        t('notificationWeeklyTitle') || 'Weekly Financial Review',
        t('notificationWeeklyBody') ||
          "It's time to review your week's spending and income.",
      );
    } else {
      NotificationService.cancelAllNotifications();
    }
  };

  const handleOpenEmail = async () => {
    const subject = `Habit Money Feedback (${language})`;
    Linking.openURL(`mailto:nmena.garzon@gmail.com?subject=${subject}`);
  };

  const handleAppLockToggle = React.useCallback(
    async (newValue: boolean) => {
      if (newValue) {
        const { AppLockService } =
          await import('../../../services/AppLockService');
        const result = await AppLockService.authenticate();
        if (!result.success) {
          const blockedErrors = ['not_enrolled', 'not_available', 'unknown'];
          if (blockedErrors.includes((result as any).error)) {
            Alert.alert(t('appLock'), t('appLockNotEnrolled'));
          }
          return;
        }
      }
      await setAppLockEnabled(newValue);
    },
    [setAppLockEnabled, t],
  );

  const handleDonate = async () => {
    Linking.openURL('https://ko-fi.com/nmenag');
  };

  const handleBackupJSON = async () => {
    try {
      await backupToJSON();
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
      await checkAndShowAd();
    } catch {
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error,
      ).catch(() => {});
    }
  };

  const handleRestoreJSON = () => {
    setRestoreMenuVisible(true);
  };

  const is24Hour = React.useMemo(() => {
    return (Localization.getLocales()[0] as any)?.use24HourClock ?? false;
  }, []);

  const formatDisplayTime = React.useCallback(
    (timeStr: string) => {
      if (is24Hour) return timeStr;
      const [hour, minute] = timeStr.split(':').map(Number);
      const period = hour >= 12 ? 'PM' : 'AM';
      const h = hour % 12 || 12;
      return `${h}:${minute.toString().padStart(2, '0')} ${period}`;
    },
    [is24Hour],
  );

  const [timePickerVisible, setTimePickerVisible] = React.useState(false);
  const [pickerHours, setPickerHours] = React.useState(20);
  const [pickerMinutes, setPickerMinutes] = React.useState(0);
  const [pickerFocused, setPickerFocused] = React.useState<'hours' | 'minutes'>(
    'hours',
  );
  const [languageMenuVisible, setLanguageMenuVisible] = React.useState(false);
  const [currencyMenuVisible, setCurrencyMenuVisible] = React.useState(false);
  const [cycleStartDayMenuVisible, setCycleStartDayMenuVisible] =
    React.useState(false);
  const [restoreMenuVisible, setRestoreMenuVisible] = React.useState(false);

  const openTimePicker = React.useCallback(() => {
    const [h, m] = notificationTime.split(':').map(Number);
    setPickerHours(h ?? 20);
    setPickerMinutes(m ?? 0);
    setPickerFocused('hours');
    setTimePickerVisible(true);
  }, [notificationTime]);

  const onDismissTimePicker = React.useCallback(() => {
    setTimePickerVisible(false);
  }, [setTimePickerVisible]);

  const onConfirmTimePicker = React.useCallback(
    ({ hours, minutes }: { hours: number; minutes: number }) => {
      setTimePickerVisible(false);
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      setNotificationTime(formattedTime);

      if (notificationsEnabled) {
        NotificationService.cancelAllNotifications();
        NotificationService.scheduleDailyReminder(
          hours,
          minutes,
          t('notificationDailyTitle') || "Don't forget your finances!",
          t('notificationDailyBody') ||
            'Track your daily expenses to stay on budget.',
        );
        NotificationService.scheduleWeeklyReminder(
          1,
          hours,
          minutes,
          t('notificationWeeklyTitle') || 'Weekly Financial Review',
          t('notificationWeeklyBody') ||
            "It's time to review your week's spending and income.",
        );
      }
    },
    [notificationsEnabled, t, setNotificationTime],
  );

  const handleTimePickerChange = React.useCallback(
    (params: {
      hours: number;
      minutes: number;
      focused?: 'hours' | 'minutes';
    }) => {
      setPickerHours(params.hours);
      setPickerMinutes(params.minutes);
      if (params.focused) {
        setPickerFocused(params.focused);
      }
    },
    [],
  );

  const SETTINGS_LINKS = [
    {
      name: t('manageAccounts'),
      icon: 'wallet-outline',
      screen: '/accounts',
      color: featureColors.accounts,
    },
    {
      name: t('manageCategories'),
      icon: 'pricetags-outline',
      screen: '/categories',
      color: featureColors.categories,
    },
    {
      name: t('manageBudgets'),
      icon: 'pie-chart-outline',
      screen: '/budgets',
      color: featureColors.budgets,
    },
    {
      name: t('calendar'),
      icon: 'calendar-outline',
      screen: '/calendar',
      color: featureColors.calendar,
    },
  ];

  const LANGUAGES = [
    { code: 'en', name: t('english'), label: 'EN' },
    { code: 'es', name: t('spanish'), label: 'ES' },
  ];

  const styles = defaultStyles(theme);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: spacing.md,
          paddingBottom: (insets.bottom || 0) + 120,
          paddingHorizontal: spacing.md,
        }}
      >
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('financeEssentials')}
          </Text>
          <View style={styles.card}>
            {SETTINGS_LINKS.map((item, index) => {
              const itemColor = item.color;
              return (
                <View key={item.screen}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.rowItem}
                    onPress={() => {
                      router.push(item.screen as any);
                    }}
                  >
                    <View
                      style={[
                        styles.iconBox,
                        {
                          backgroundColor: addAlpha(itemColor, 0.07),
                          borderColor: addAlpha(itemColor, 0.17),
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={itemColor}
                      />
                    </View>
                    <View style={styles.rowText}>
                      <Text
                        style={[
                          styles.rowTitle,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        {item.name}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                  {index < SETTINGS_LINKS.length - 1 && (
                    <Divider style={styles.divider} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('appCustomization')}
          </Text>
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setLanguageMenuVisible(true);
              }}
              style={styles.rowItem}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(featureColors.budgets, 0.07),
                    borderColor: addAlpha(featureColors.budgets, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="earth-outline"
                  size={20}
                  color={featureColors.budgets}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('language')}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('changeLanguageDesc') || 'Switch the app language'}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {LANGUAGES.find((l) => l.code === language)?.label}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            </TouchableOpacity>

            <Divider style={styles.divider} />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setCurrencyMenuVisible(true);
              }}
              style={styles.rowItem}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(featureColors.accounts, 0.07),
                    borderColor: addAlpha(featureColors.accounts, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={featureColors.accounts}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('currency') || 'Currency'}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('detectedCurrency')}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {CURRENCIES.find((c) => c.code === currency)?.symbol || '$'}{' '}
                    {currency}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            </TouchableOpacity>

            <Divider style={styles.divider} />

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                setCycleStartDayMenuVisible(true);
              }}
              style={styles.rowItem}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(featureColors.analytics, 0.07),
                    borderColor: addAlpha(featureColors.analytics, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={featureColors.analytics}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('cycleStartDay')}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('cycleStartDayDesc')}
                </Text>
              </View>
              <View style={styles.rowRight}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {t('cycleStartDayFormat').replace(
                      '{day}',
                      String(cycleStartDay),
                    )}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            </TouchableOpacity>

            <Divider style={styles.divider} />

            <View style={styles.rowItem}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(theme.colors.primary, 0.07),
                    borderColor: addAlpha(theme.colors.primary, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="moon-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('darkMode')}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('darkModeDesc')}
                </Text>
              </View>
              <Switch
                value={themePreference === 'dark'}
                onValueChange={(val) => {
                  setThemePreference(val ? 'dark' : 'light');
                }}
                color={theme.colors.primary}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.rowItem}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(theme.colors.primary, 0.07),
                    borderColor: addAlpha(theme.colors.primary, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('appLock')}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('appLockDesc')}
                </Text>
              </View>
              <Switch
                value={appLockEnabled}
                onValueChange={handleAppLockToggle}
                color={theme.colors.primary}
              />
            </View>

            <Divider style={styles.divider} />

            <View style={styles.rowItem}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(featureColors.budgets, 0.07),
                    borderColor: addAlpha(featureColors.budgets, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={featureColors.budgets}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('notifications') || 'Reminders'}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('notificationsDesc') ||
                    'Daily and weekly budgets checking alerts'}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                color={theme.colors.primary}
              />
            </View>

            <Animated.View style={animatedReminderStyle}>
              <Divider style={styles.divider} />
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.rowItem, { paddingLeft: 32 }]}
                onPress={openTimePicker}
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: addAlpha(theme.colors.primary, 0.07),
                      borderColor: addAlpha(theme.colors.primary, 0.17),
                    },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text
                    style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                  >
                    {t('notificationTime') || 'Reminder Time'}
                  </Text>
                  <Text
                    style={[
                      styles.rowSub,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {formatDisplayTime(notificationTime)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('dataManagement')}
          </Text>
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.rowItem}
              onPress={() => {
                router.push('/export-data' as any);
              }}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(featureColors.export, 0.07),
                    borderColor: addAlpha(featureColors.export, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="cloud-download-outline"
                  size={20}
                  color={featureColors.export}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('exportData')}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('exportDataDesc')}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <Divider style={styles.divider} />

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.rowItem}
              onPress={handleBackupJSON}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(featureColors.backup, 0.07),
                    borderColor: addAlpha(featureColors.backup, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="save-outline"
                  size={20}
                  color={featureColors.backup}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('backupData')}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('backupDataDesc')}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <Divider style={styles.divider} />

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.rowItem}
              onPress={handleRestoreJSON}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(featureColors.restore, 0.07),
                    borderColor: addAlpha(featureColors.restore, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="refresh-circle-outline"
                  size={20}
                  color={featureColors.restore}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('restoreData')}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('restoreDataDesc')}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>
            {'Danger Zone'}
          </Text>
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.rowItem}
              onPress={() => {
                Alert.alert(
                  t('resetDataConfirmTitle' as any),
                  t('resetDataConfirmMessage' as any),
                  [
                    { text: t('cancel'), style: 'cancel' },
                    {
                      text: t('resetData' as any),
                      style: 'destructive',
                      onPress: () => {
                        try {
                          resetData();
                          Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Success,
                          ).catch(() => {});
                          Alert.alert(
                            t('success'),
                            t('resetDataSuccess' as any),
                          );
                        } catch {
                          Haptics.notificationAsync(
                            Haptics.NotificationFeedbackType.Error,
                          ).catch(() => {});
                        }
                      },
                    },
                  ],
                );
              }}
              accessibilityRole="button"
              accessibilityLabel={t('resetData' as any)}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(featureColors.feedback, 0.07),
                    borderColor: addAlpha(featureColors.feedback, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={theme.colors.error}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: theme.colors.error }]}>
                  {t('resetData' as any)}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('resetDataDesc' as any)}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.error}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('feedback')}
          </Text>
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.rowItem}
              onPress={handleOpenEmail}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(featureColors.feedback, 0.07),
                    borderColor: addAlpha(featureColors.feedback, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={featureColors.feedback}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('sendFeedback')}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('feedbackDesc')}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <Divider style={styles.divider} />

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.rowItem}
              onPress={() => {
                ReviewManager.requestReviewManually().catch(() => {});
              }}
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(featureColors.rateApp, 0.07),
                    borderColor: addAlpha(featureColors.rateApp, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="star-outline"
                  size={20}
                  color={featureColors.rateApp}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('rateApp' as any)}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('rateAppDesc' as any)}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <Divider style={styles.divider} />

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.rowItem}
              onPress={handleDonate}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(featureColors.donate, 0.07),
                    borderColor: addAlpha(featureColors.donate, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="heart-outline"
                  size={20}
                  color={featureColors.donate}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('buyMeACoffee')}
                </Text>
                <Text
                  style={[
                    styles.rowSub,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {t('donateDesc')}
                </Text>
              </View>
              <Ionicons
                name="open-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('aboutApp')}
          </Text>
          <View style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.rowItem}
              onPress={() => {
                router.push('/about');
              }}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(theme.colors.primary, 0.07),
                    borderColor: addAlpha(theme.colors.primary, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('aboutApp')}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            <Divider style={styles.divider} />

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.rowItem}
              onPress={() => {
                router.push('/privacy-policy');
              }}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: addAlpha(theme.colors.primary, 0.07),
                    borderColor: addAlpha(theme.colors.primary, 0.17),
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.rowText}>
                <Text
                  style={[styles.rowTitle, { color: theme.colors.onSurface }]}
                >
                  {t('privacyPolicy')}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.adContainer}>
        <BannerAdComponent />
      </View>

      <BottomSheet
        visible={timePickerVisible}
        onClose={onDismissTimePicker}
        title={t('notificationTime') || 'Reminder Time'}
      >
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
          }}
        >
          <TimePicker
            locale={language}
            inputType="picker"
            use24HourClock={is24Hour}
            hours={pickerHours}
            minutes={pickerMinutes}
            focused={pickerFocused}
            onFocusInput={setPickerFocused}
            onChange={handleTimePickerChange}
          />
          <View
            style={{
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-between',
              marginTop: spacing.lg,
              gap: spacing.sm,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onDismissTimePicker}
              style={[
                styles.themeButton,
                {
                  borderColor: theme.colors.outlineVariant,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Text
                style={{
                  ...theme.fonts.labelLarge,
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                {t('cancel') || 'Cancel'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                onConfirmTimePicker({
                  hours: pickerHours,
                  minutes: pickerMinutes,
                });
              }}
              style={[
                styles.themeButton,
                {
                  borderColor: 'transparent',
                  backgroundColor: theme.colors.primary,
                },
              ]}
            >
              <Text
                style={{
                  ...theme.fonts.labelLarge,
                  color: theme.colors.onPrimary,
                }}
              >
                {t('save') || 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>

      <BottomSheet
        visible={languageMenuVisible}
        onClose={() => setLanguageMenuVisible(false)}
        title={t('language') || 'Language'}
      >
        {LANGUAGES.map((item) => {
          const isSelected = language === item.code;
          return (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.modalListItem,
                { borderColor: theme.colors.outlineVariant },
                isSelected && {
                  backgroundColor: theme.dark
                    ? addAlpha(theme.colors.primary, 0.16)
                    : addAlpha(theme.colors.primary, 0.08),
                },
              ]}
              onPress={() => {
                setLanguage(item.code as any);
                setLanguageMenuVisible(false);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={{
                  ...theme.fonts.titleMedium,
                  color: theme.colors.onSurface,
                }}
              >
                {item.name}
              </Text>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.outlineVariant,
                  },
                ]}
              >
                {isSelected && (
                  <View
                    style={[
                      styles.radioInner,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </BottomSheet>

      <BottomSheet
        visible={currencyMenuVisible}
        onClose={() => setCurrencyMenuVisible(false)}
        title={t('currency') || 'Currency'}
      >
        <ScrollView
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={false}
        >
          {CURRENCIES.map((curr) => {
            const isSelected = currency === curr.code;
            return (
              <TouchableOpacity
                key={curr.code}
                style={[
                  styles.modalListItem,
                  { borderColor: theme.colors.outlineVariant },
                  isSelected && {
                    backgroundColor: theme.dark
                      ? addAlpha(theme.colors.primary, 0.16)
                      : addAlpha(theme.colors.primary, 0.08),
                  },
                ]}
                onPress={() => {
                  setCurrency(curr.code);
                  setCurrencyMenuVisible(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter-Medium',
                    fontWeight: '500',
                    color: theme.colors.onSurface,
                  }}
                >
                  {t(curr.tKey as any)} ({curr.code})
                </Text>
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={cycleStartDayMenuVisible}
        onClose={() => setCycleStartDayMenuVisible(false)}
        title={t('selectCycleStartDay')}
      >
        <ScrollView
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={false}
        >
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
            const isSelected = cycleStartDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.modalListItem,
                  { borderColor: theme.colors.outlineVariant },
                  isSelected && {
                    backgroundColor: theme.dark
                      ? addAlpha(theme.colors.primary, 0.16)
                      : addAlpha(theme.colors.primary, 0.08),
                  },
                ]}
                onPress={() => {
                  setCycleStartDay(day);
                  setCycleStartDayMenuVisible(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter-Medium',
                    fontWeight: '500',
                    color: theme.colors.onSurface,
                  }}
                >
                  {t('cycleStartDayFormat').replace('{day}', String(day))}
                </Text>
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.outlineVariant,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={restoreMenuVisible}
        onClose={() => setRestoreMenuVisible(false)}
        title={t('restoreData')}
      >
        <Text
          style={{
            ...theme.fonts.bodySmall,
            fontSize: fontScale(13),
            color: theme.colors.onSurfaceVariant,
            marginBottom: spacing.md,
            lineHeight: 18,
          }}
        >
          {t('restoreBackupPrompt')}
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.modalListItem,
            {
              borderColor: theme.colors.outlineVariant,
              marginBottom: spacing.sm,
            },
          ]}
          onPress={async () => {
            setRestoreMenuVisible(false);
            try {
              await backupToJSON();
              await restoreFromJSON(loadData, t);
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              ).catch(() => {});
            } catch {
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
              ).catch(() => {});
            }
          }}
          accessibilityRole="button"
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text
              style={{
                ...theme.fonts.titleMedium,
                fontSize: fontScale(14),
                color: featureColors.accounts,
                marginBottom: spacing.xs,
              }}
            >
              {t('backupAndRestore')}
            </Text>
            <Text
              style={{
                ...theme.fonts.bodySmall,
                fontSize: fontScale(11),
                color: theme.colors.onSurfaceVariant,
                lineHeight: 14,
              }}
            >
              {t('backupAndRestoreDesc')}
            </Text>
          </View>
          <Ionicons
            name="shield-checkmark-outline"
            size={24}
            color={featureColors.accounts}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.modalListItem,
            {
              borderColor: theme.colors.outlineVariant,
              marginBottom: spacing.md,
            },
          ]}
          onPress={async () => {
            setRestoreMenuVisible(false);
            Alert.alert(t('restoreData'), t('restoreConfirm'), [
              { text: t('cancel'), style: 'cancel' },
              {
                text: t('restoreData'),
                style: 'destructive',
                onPress: async () => {
                  try {
                    await restoreFromJSON(loadData, t);
                    await Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success,
                    ).catch(() => {});
                  } catch {
                    await Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Error,
                    ).catch(() => {});
                  }
                },
              },
            ]);
          }}
          accessibilityRole="button"
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text
              style={{
                ...theme.fonts.titleMedium,
                fontSize: fontScale(14),
                color: theme.colors.error,
                marginBottom: spacing.xs,
              }}
            >
              {t('restoreDirectly')}
            </Text>
            <Text
              style={{
                ...theme.fonts.bodySmall,
                fontSize: fontScale(11),
                color: theme.colors.onSurfaceVariant,
                lineHeight: 14,
              }}
            >
              {t('restoreDirectlyDesc')}
            </Text>
          </View>
          <Ionicons
            name="warning-outline"
            size={24}
            color={theme.colors.error}
          />
        </TouchableOpacity>
      </BottomSheet>
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    profileCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    profileStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    profileChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    profileChipText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    section: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...theme.fonts.labelSmall,
      fontSize: fontScale(10),
      textTransform: 'uppercase',
      marginBottom: spacing.sm,
      marginLeft: spacing.sm,
      letterSpacing: 1,
    },
    card: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      elevation: 0,
    },
    rowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    rowText: {
      flex: 1,
      justifyContent: 'center',
    },
    rowTitle: {
      ...theme.fonts.titleMedium,
      fontSize: fontScale(14),
    },
    rowSub: {
      ...theme.fonts.bodySmall,
      fontSize: fontScale(11),
      marginTop: spacing.xs,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    badge: {
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      marginRight: spacing.sm,
    },
    badgeText: {
      ...theme.fonts.labelMedium,
      fontSize: fontScale(11),
    },
    divider: {
      backgroundColor: theme.colors.outlineVariant,
      marginLeft: 44 + spacing.md + spacing.md,
    },
    themeSelectorContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    themeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: spacing.xs,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.dark ? 0.2 : 0.02,
      shadowRadius: 6,
      elevation: 1,
    },
    themeButtonText: {
      ...theme.fonts.bodyMedium,
      fontSize: fontScale(13),
      textTransform: 'capitalize',
    },
    modalListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.xl,
      borderWidth: 1,
      marginBottom: spacing.sm,
    },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    adContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
    },
  });
