import * as Localization from 'expo-localization';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import {
  Card,
  Divider,
  List,
  Menu,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import { TimePickerModal } from 'react-native-paper-dates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../components/BannerAdComponent';
import { NotificationService } from '../services/NotificationService';
import { useStore, useTranslation } from '../store/useStore';
import { backupToJSON, restoreFromJSON } from '../utils/dataBackup';
import { CURRENCIES } from '../constants';

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

  const { t, language } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const handleOpenEmail = () => {
    const subject = `Habit Money Feedback (${language})`;
    Linking.openURL(`mailto:nmena.garzon@gmail.com?subject=${subject}`);
  };

  const handleDonate = () => {
    Linking.openURL('https://ko-fi.com/nmenag');
  };

  const handleBackupJSON = async () => {
    await backupToJSON();
    await checkAndShowAd();
  };

  const handleRestoreJSON = () => {
    Alert.alert(t('restoreData'), t('restoreConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('restoreData'),
        style: 'destructive',
        onPress: async () => {
          await restoreFromJSON(loadData, t);
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

  const SETTINGS_LINKS = [
    { name: t('manageAccounts'), icon: 'wallet-outline', screen: '/accounts' },
    {
      name: t('manageCategories'),
      icon: 'tag-multiple-outline',
      screen: '/categories',
    },
    { name: t('manageBudgets'), icon: 'chart-pie', screen: '/budgets' },
    { name: t('manageGoals'), icon: 'flag-outline', screen: '/goals' },
    {
      name: t('calendar'),
      icon: 'calendar-blank-outline',
      screen: '/calendar',
    },
  ];

  const LANGUAGES = [
    { code: 'en', name: t('english'), label: 'EN' },
    { code: 'es', name: t('spanish'), label: 'ES' },
  ];

  const THEMES = [
    { code: 'system', name: t('system'), icon: 'monitor' },
    { code: 'light', name: t('light'), icon: 'white-balance-sunny' },
    { code: 'dark', name: t('dark'), icon: 'weather-night' },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top > 0 ? 0 : 16,
          paddingBottom: (insets.bottom || 0) + 100,
        }}
      >
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            {t('preferences')}
          </Text>
          <Card style={styles.card} mode="contained">
            {SETTINGS_LINKS.map((item, index) => (
              <View key={item.screen}>
                <List.Item
                  title={item.name}
                  left={(props) => <List.Icon {...props} icon={item.icon} />}
                  right={(props) => (
                    <List.Icon {...props} icon="chevron-right" />
                  )}
                  onPress={() => router.push(item.screen as any)}
                />
                {index < SETTINGS_LINKS.length - 1 && <Divider />}
              </View>
            ))}
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            {t('dataManagement')}
          </Text>
          <Card style={styles.card} mode="contained">
            <List.Item
              title={t('exportData')}
              description={t('exportDataDesc')}
              left={(props) => (
                <List.Icon {...props} icon="file-delimited-outline" />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/export-data' as any)}
            />
            <Divider />
            <List.Item
              title={t('backupData')}
              description={t('backupDataDesc')}
              left={(props) => (
                <List.Icon {...props} icon="database-export-outline" />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleBackupJSON}
            />
            <Divider />
            <List.Item
              title={t('restoreData')}
              description={t('restoreDataDesc')}
              left={(props) => (
                <List.Icon {...props} icon="database-import-outline" />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleRestoreJSON}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            {t('language')}
          </Text>
          <Card style={styles.card} mode="contained">
            <Menu
              visible={languageMenuVisible}
              onDismiss={() => setLanguageMenuVisible(false)}
              anchor={
                <List.Item
                  title={LANGUAGES.find((l) => l.code === language)?.name}
                  description={t('changeLanguageDesc')}
                  left={(props) => (
                    <View style={styles.textIconContainer}>
                      <Text
                        variant="titleMedium"
                        style={{
                          fontWeight: 'bold',
                          color: theme.colors.primary,
                        }}
                      >
                        {LANGUAGES.find((l) => l.code === language)?.label}
                      </Text>
                    </View>
                  )}
                  right={(props) => (
                    <List.Icon {...props} icon="chevron-down" />
                  )}
                  onPress={() => setLanguageMenuVisible(true)}
                />
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
                    leadingIcon={isSelected ? 'check' : 'translate-variant'}
                    titleStyle={{
                      color: isSelected
                        ? theme.colors.primary
                        : theme.colors.onSurface,
                      fontWeight: isSelected ? 'bold' : 'normal',
                      fontSize: 16,
                    }}
                    style={{ minWidth: 220 }}
                  />
                );
              })}
            </Menu>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            {t('detectedCurrency')}
          </Text>
          <Card style={styles.card} mode="contained">
            <Menu
              visible={currencyMenuVisible}
              onDismiss={() => setCurrencyMenuVisible(false)}
              anchor={
                <List.Item
                  title={t(
                    CURRENCIES.find((c) => c.code === currency)?.tKey as any,
                  )}
                  left={(props) => (
                    <View style={styles.textIconContainer}>
                      <Text
                        variant="titleMedium"
                        style={{
                          fontWeight: 'bold',
                          color: theme.colors.primary,
                        }}
                      >
                        {CURRENCIES.find((c) => c.code === currency)?.symbol ||
                          '$'}
                      </Text>
                    </View>
                  )}
                  right={(props) => (
                    <List.Icon {...props} icon="chevron-down" />
                  )}
                  onPress={() => setCurrencyMenuVisible(true)}
                />
              }
              contentStyle={{ backgroundColor: theme.colors.elevation.level3 }}
            >
              <ScrollView style={{ maxHeight: 300 }}>
                {CURRENCIES.map((item) => {
                  const isSelected = currency === item.code;
                  return (
                    <Menu.Item
                      key={item.code}
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
                        fontSize: 16,
                      }}
                      style={{ minWidth: 220 }}
                    />
                  );
                })}
              </ScrollView>
            </Menu>
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            {t('theme')}
          </Text>
          <Card style={styles.card} mode="contained">
            {THEMES.map((item, index) => (
              <View key={item.code}>
                <List.Item
                  title={item.name}
                  left={(props) => <List.Icon {...props} icon={item.icon} />}
                  right={(props) =>
                    themePreference === item.code ? (
                      <List.Icon
                        {...props}
                        icon="check-circle"
                        color={theme.colors.primary}
                      />
                    ) : null
                  }
                  onPress={() => setThemePreference(item.code as any)}
                  style={
                    themePreference === item.code
                      ? { backgroundColor: theme.colors.primaryContainer }
                      : undefined
                  }
                />
                {index < THEMES.length - 1 && <Divider />}
              </View>
            ))}
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            {t('notifications') || 'Notifications'}
          </Text>
          <Card style={styles.card} mode="contained">
            <List.Item
              title={t('notifications') || 'Notifications'}
              description={
                t('notificationsDesc') || 'Enable daily and weekly reminders.'
              }
              left={(props) => <List.Icon {...props} icon="bell-outline" />}
              right={(props) => (
                <View style={{ justifyContent: 'center' }}>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={toggleNotifications}
                  />
                </View>
              )}
            />
            {notificationsEnabled && (
              <View>
                <Divider />
                <List.Item
                  title={t('notificationTime') || 'Reminder Time'}
                  description={formatDisplayTime(notificationTime)}
                  left={(props) => (
                    <List.Icon {...props} icon="clock-outline" />
                  )}
                  right={(props) => (
                    <List.Icon {...props} icon="chevron-right" />
                  )}
                  onPress={() => setTimePickerVisible(true)}
                />
              </View>
            )}
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            {t('feedback')}
          </Text>
          <Card style={styles.card} mode="contained">
            <List.Item
              title={t('sendFeedback')}
              description={t('feedbackDesc')}
              left={(props) => <List.Icon {...props} icon="message-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleOpenEmail}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            {t('donate')}
          </Text>
          <Card style={styles.card} mode="contained">
            <List.Item
              title={t('buyMeACoffee')}
              description={t('donateDesc')}
              left={(props) => (
                <List.Icon {...props} icon="coffee" color="#FF5E5B" />
              )}
              right={(props) => <List.Icon {...props} icon="open-in-new" />}
              onPress={handleDonate}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            {t('app') || 'App'}
          </Text>
          <Card style={styles.card} mode="contained">
            <List.Item
              title={t('aboutApp')}
              left={(props) => (
                <List.Icon {...props} icon="information-outline" />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/about')}
            />
            <Divider />
            <List.Item
              title={t('privacyPolicy')}
              left={(props) => (
                <List.Icon {...props} icon="shield-check-outline" />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/privacy-policy')}
            />
          </Card>
        </View>
      </ScrollView>
      <BannerAdComponent />
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
    section: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontWeight: '900',
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      marginBottom: 12,
      marginLeft: 8,
      letterSpacing: 1.5,
    },
    card: {
      borderRadius: 16,
      overflow: 'hidden',
    },
    textIconContainer: {
      width: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionInfoText: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
      paddingHorizontal: 8,
    },
  });
