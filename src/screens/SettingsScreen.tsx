import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Divider, List, Text, useTheme } from 'react-native-paper';
import { BannerAdComponent } from '../components/BannerAdComponent';
import { useStore, useTranslation } from '../store/useStore';
import { exportTransactionsToCSV } from '../utils/csvExport';

export const SettingsScreen = ({ navigation }: any) => {
  const {
    setLanguage,
    transactions,
    accounts,
    categories,
    incrementActionCounter,
    checkAndShowAd,
  } = useStore();
  const { t, language } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);

  const handleExport = async () => {
    await exportTransactionsToCSV(transactions, accounts, categories);
    incrementActionCounter();
    checkAndShowAd();
  };

  const SETTINGS_LINKS = [
    { name: t('manageAccounts'), icon: 'wallet-outline', screen: 'Accounts' },
    {
      name: t('manageCategories'),
      icon: 'tag-multiple-outline',
      screen: 'Categories',
    },
    { name: t('manageBudgets'), icon: 'chart-pie', screen: 'Budgets' },
    { name: t('manageGoals'), icon: 'flag-outline', screen: 'Goals' },
    { name: t('calendar'), icon: 'calendar-blank-outline', screen: 'Calendar' },
  ];

  const LANGUAGES = [
    { code: 'en', name: t('english'), label: 'EN' },
    { code: 'es', name: t('spanish'), label: 'ES' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
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
                onPress={() => navigation.navigate(item.screen)}
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
            left={(props) => <List.Icon {...props} icon="download-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={handleExport}
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
