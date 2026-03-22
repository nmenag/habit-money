import { router } from 'expo-router';
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Card, Divider, List, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../components/BannerAdComponent';
import { useStore, useTranslation } from '../store/useStore';
import { backupToJSON, restoreFromJSON } from '../utils/dataBackup';

export const SettingsScreen = () => {
  const {
    setLanguage,
    transactions,
    accounts,
    categories,
    loadData,
    incrementActionCounter,
    checkAndShowAd,
  } = useStore();
  const { t, language, translateName } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const handleOpenEmail = () => {
    const subject = `FinHabit Feedback (${language})`;
    Linking.openURL(`mailto:nmena.garzon@gmail.com?subject=${subject}`);
  };

  const handleDonate = () => {
    Linking.openURL('https://ko-fi.com/nmenag');
  };

  const handleBackupJSON = async () => {
    await backupToJSON();
    incrementActionCounter();
    checkAndShowAd();
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top > 0 ? 0 : 16,
        paddingBottom: (insets.bottom || 0) + 40,
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
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push(item.screen as any)}
              />
              {index < SETTINGS_LINKS.length - 1 && <Divider />}
            </View>
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <Text variant="labelLarge" style={styles.sectionTitle}>
          {t('settings')}
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
          {LANGUAGES.map((item, index) => (
            <View key={item.code}>
              <List.Item
                title={item.name}
                left={(props) => (
                  <View style={styles.languageIndicator}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                      {item.label}
                    </Text>
                  </View>
                )}
                right={(props) =>
                  language === item.code ? (
                    <List.Icon
                      {...props}
                      icon="check-circle"
                      color={theme.colors.primary}
                    />
                  ) : null
                }
                onPress={() => setLanguage(item.code as any)}
                style={
                  language === item.code
                    ? { backgroundColor: theme.colors.primaryContainer }
                    : undefined
                }
              />
              {index < LANGUAGES.length - 1 && <Divider />}
            </View>
          ))}
        </Card>
        <Text variant="bodySmall" style={styles.sectionInfoText}>
          {t('changeLanguageDesc')}
        </Text>
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

      <View style={{ height: 40 }} />
      <BannerAdComponent />
    </ScrollView>
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
    languageIndicator: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    sectionInfoText: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
      paddingHorizontal: 8,
    },
  });
