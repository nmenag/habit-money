import * as Localization from 'expo-localization';
import { router } from 'expo-router';
import React from 'react';
import {
  Alert,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Divider, Menu, Switch, Text, useTheme } from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
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
import { useStore, useTranslation } from '../../../store/useStore';
import { backupToJSON, restoreFromJSON } from '../../../utils/dataBackup';
import { CURRENCIES } from '../../../constants';

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
  } = useStore();

  const { t, language } = useTranslation();
  const theme = useTheme();
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

  const handleRestoreJSON = async () => {
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
  const [languageMenuVisible, setLanguageMenuVisible] = React.useState(false);
  const [currencyMenuVisible, setCurrencyMenuVisible] = React.useState(false);

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

  // Modern finance cards metadata
  const SETTINGS_LINKS = [
    {
      name: t('manageAccounts'),
      icon: 'wallet-outline',
      screen: '/accounts',
      color: '#10B981',
      bgColor: theme.dark ? '#052E16' : '#DCFCE7',
    },
    {
      name: t('manageCategories'),
      icon: 'pricetags-outline',
      screen: '/categories',
      color: '#8B5CF6',
      bgColor: theme.dark ? '#2E1065' : '#F3E8FF',
    },
    {
      name: t('manageBudgets'),
      icon: 'pie-chart-outline',
      screen: '/budgets',
      color: '#3B82F6',
      bgColor: theme.dark ? '#172554' : '#DBEAFE',
    },
    {
      name: t('manageGoals'),
      icon: 'flag-outline',
      screen: '/goals',
      color: '#F59E0B',
      bgColor: theme.dark ? '#451A03' : '#FEF3C7',
    },
    {
      name: t('calendar'),
      icon: 'calendar-outline',
      screen: '/calendar',
      color: '#EC4899',
      bgColor: theme.dark ? '#4C0519' : '#FCE7F3',
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
          paddingTop: insets.top > 0 ? insets.top + 8 : 24,
          paddingBottom: (insets.bottom || 0) + 120,
          paddingHorizontal: 16,
        }}
      >
        {/* Brand Header */}
        <View style={styles.header}>
          <Text
            style={[styles.headerTitle, { color: theme.colors.onBackground }]}
          >
            {t('preferences') || 'Settings'}
          </Text>
        </View>

        {/* Section 1: Finance Essentials */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('financeEssentials')}
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.dark ? '#0A110F' : '#FFFFFF',
                borderColor: theme.dark ? '#11221D' : '#E2E8F0',
              },
            ]}
          >
            {SETTINGS_LINKS.map((item, index) => (
              <View key={item.screen}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.rowItem}
                  onPress={() => {
                    router.push(item.screen as any);
                  }}
                >
                  <View
                    style={[styles.iconBox, { backgroundColor: item.bgColor }]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.color}
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
                    size={18}
                    color={theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
                {index < SETTINGS_LINKS.length - 1 && (
                  <Divider style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Section 2: App Customization */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('appCustomization')}
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.dark ? '#0A110F' : '#FFFFFF',
                borderColor: theme.dark ? '#11221D' : '#E2E8F0',
              },
            ]}
          >
            {/* Inline Language Menu Selector */}
            <Menu
              visible={languageMenuVisible}
              onDismiss={() => setLanguageMenuVisible(false)}
              anchor={
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
                      { backgroundColor: theme.dark ? '#172554' : '#DBEAFE' },
                    ]}
                  >
                    <Ionicons name="earth-outline" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.rowText}>
                    <Text
                      style={[
                        styles.rowTitle,
                        { color: theme.colors.onSurface },
                      ]}
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
                        { backgroundColor: theme.colors.primaryContainer },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {LANGUAGES.find((l) => l.code === language)?.label}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </View>
                </TouchableOpacity>
              }
              contentStyle={{ backgroundColor: theme.colors.elevation.level3 }}
            >
              {LANGUAGES.map((item) => {
                const isSelected = language === item.code;
                return (
                  <Menu.Item
                    key={item.code}
                    onPress={() => {
                      setLanguage(item.code as any);
                      setLanguageMenuVisible(false);
                    }}
                    title={item.name}
                    leadingIcon={isSelected ? 'check' : 'translate'}
                    titleStyle={{
                      color: isSelected
                        ? theme.colors.primary
                        : theme.colors.onSurface,
                      fontWeight: isSelected ? 'bold' : 'normal',
                    }}
                  />
                );
              })}
            </Menu>

            <Divider style={styles.divider} />

            {/* Inline Currency Menu Selector */}
            <Menu
              visible={currencyMenuVisible}
              onDismiss={() => setCurrencyMenuVisible(false)}
              anchor={
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
                      { backgroundColor: theme.dark ? '#052E16' : '#DCFCE7' },
                    ]}
                  >
                    <Ionicons name="cash-outline" size={20} color="#10B981" />
                  </View>
                  <View style={styles.rowText}>
                    <Text
                      style={[
                        styles.rowTitle,
                        { color: theme.colors.onSurface },
                      ]}
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
                        { backgroundColor: theme.colors.primaryContainer },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        {CURRENCIES.find((c) => c.code === currency)?.symbol ||
                          '$'}{' '}
                        {currency}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </View>
                </TouchableOpacity>
              }
              contentStyle={{ backgroundColor: theme.colors.elevation.level3 }}
            >
              <View style={{ maxHeight: 300, minWidth: 200 }}>
                <FlatList
                  data={CURRENCIES}
                  keyExtractor={(item) => item.code}
                  initialNumToRender={10}
                  renderItem={({ item }) => {
                    const isSelected = currency === item.code;
                    return (
                      <Menu.Item
                        onPress={() => {
                          setCurrency(item.code);
                          setCurrencyMenuVisible(false);
                        }}
                        title={`${t(item.tKey as any)} (${item.code})`}
                        leadingIcon={isSelected ? 'check' : 'cash-multiple'}
                        titleStyle={{
                          color: isSelected
                            ? theme.colors.primary
                            : theme.colors.onSurface,
                          fontWeight: isSelected ? 'bold' : 'normal',
                        }}
                      />
                    );
                  }}
                />
              </View>
            </Menu>

            <Divider style={styles.divider} />

            {/* Dark Mode Toggle Switch Row */}
            <View style={styles.rowItem}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: theme.dark ? '#11221D' : '#E6F4EA' },
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

            {/* Notification Switch Row */}
            <View style={styles.rowItem}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: theme.dark ? '#451A03' : '#FEF3C7' },
                ]}
              >
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color="#F59E0B"
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

            {/* Animated Slide-down Reminder Time Selection */}
            <Animated.View style={animatedReminderStyle}>
              <Divider style={styles.divider} />
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.rowItem, { paddingLeft: 32 }]}
                onPress={() => {
                  setTimePickerVisible(true);
                }}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: theme.dark ? '#0F172A' : '#F1F5F9' },
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
                  size={18}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Section 4: Data & Safety */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('dataManagement')}
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.dark ? '#0A110F' : '#FFFFFF',
                borderColor: theme.dark ? '#11221D' : '#E2E8F0',
              },
            ]}
          >
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
                  { backgroundColor: theme.dark ? '#1E1B4B' : '#E0E7FF' },
                ]}
              >
                <Ionicons
                  name="cloud-download-outline"
                  size={20}
                  color="#6366F1"
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
                size={18}
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
                  { backgroundColor: theme.dark ? '#312E81' : '#EEF2FF' },
                ]}
              >
                <Ionicons name="save-outline" size={20} color="#4F46E5" />
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
                size={18}
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
                  { backgroundColor: theme.dark ? '#581C87' : '#F3E8FF' },
                ]}
              >
                <Ionicons
                  name="refresh-circle-outline"
                  size={20}
                  color="#A855F7"
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
                size={18}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 5: Support & Coffee */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('feedback')}
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.dark ? '#0A110F' : '#FFFFFF',
                borderColor: theme.dark ? '#11221D' : '#E2E8F0',
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.rowItem}
              onPress={handleOpenEmail}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: theme.dark ? '#1E293B' : '#F1F5F9' },
                ]}
              >
                <Ionicons name="mail-outline" size={20} color="#64748B" />
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
                size={18}
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
                  { backgroundColor: theme.dark ? '#451A03' : '#FEF3C7' },
                ]}
              >
                <Ionicons name="heart-outline" size={20} color="#F59E0B" />
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
                size={18}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 6: About & Legal */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('aboutApp')}
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.dark ? '#0A110F' : '#FFFFFF',
                borderColor: theme.dark ? '#11221D' : '#E2E8F0',
              },
            ]}
          >
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
                  { backgroundColor: theme.dark ? '#0F172A' : '#F8FAFC' },
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
                size={18}
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
                  { backgroundColor: theme.dark ? '#0F172A' : '#F8FAFC' },
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
                size={18}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Static Footer Ad banner */}
      <View style={styles.adContainer}>
        <BannerAdComponent />
      </View>

      {/* Date-picker Modal for daily notifications */}
      <TimePickerModal
        visible={timePickerVisible}
        onDismiss={onDismissTimePicker}
        onConfirm={onConfirmTimePicker}
        hours={parseInt(notificationTime.split(':')[0], 10)}
        minutes={parseInt(notificationTime.split(':')[1], 10)}
        use24HourClock={is24Hour}
      />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.5,
      marginBottom: 6,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      marginBottom: 10,
      marginLeft: 8,
      letterSpacing: 1.2,
    },
    card: {
      borderRadius: 20,
      borderWidth: 1,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.dark ? 0.3 : 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
    rowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    iconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    rowText: {
      flex: 1,
      justifyContent: 'center',
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '700',
    },
    rowSub: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    badge: {
      borderRadius: 100,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginRight: 8,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '800',
    },
    divider: {
      backgroundColor: theme.dark ? '#11221D' : '#F1F5F9',
      marginLeft: 70,
    },
    themeSelectorContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    themeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      gap: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.dark ? 0.2 : 0.02,
      shadowRadius: 6,
      elevation: 1,
    },
    themeButtonText: {
      fontSize: 13,
      textTransform: 'capitalize',
    },
    adContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'transparent',
    },
  });
