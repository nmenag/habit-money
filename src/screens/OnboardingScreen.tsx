import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Text,
  Button,
  Surface,
  useTheme,
  IconButton,
  Menu,
} from 'react-native-paper';
import * as Localization from 'expo-localization';
import { useRouter } from 'expo-router';
import { useStore, useTranslation } from '../store/useStore';
import { Language } from '../i18n/translations';
import { getDb } from '../db/schema';

const ONBOARDING_KEY = 'isFirstLaunch';

export const OnboardingScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { setLanguage, loadData } = useStore();
  const { t } = useTranslation();

  const [detectedLang, setDetectedLang] = useState<Language>('en');
  const [detectedCurrency, setDetectedCurrency] = useState('USD');
  const [langMenuVisible, setLangMenuVisible] = useState(false);
  const [currencyMenuVisible, setCurrencyMenuVisible] = useState(false);

  useEffect(() => {
    const locales = Localization.getLocales();
    const lang = locales[0]?.languageCode?.startsWith('es') ? 'es' : 'en';
    setDetectedLang(lang);
    setLanguage(lang);
    setDetectedCurrency(lang === 'es' ? 'COP' : 'USD');
  }, [setLanguage]);

  const handleContinue = async () => {
    // 1. Set language in store (saves to DB settings)
    setLanguage(detectedLang);

    // 2. Set settings including first launch status and currency
    const db = getDb();
    db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
      'currency',
      detectedCurrency,
    ]);
    db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
      'isFirstLaunch',
      'false',
    ]);
    db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
      'onboarding_date',
      new Date().toISOString().split('T')[0],
    ]);

    // 3. Reload data to ensure everything is fresh
    loadData();

    // 4. Navigate to dashboard using replace
    router.replace('/(tabs)');
  };

  const selectLanguage = (lang: Language) => {
    setDetectedLang(lang);
    setLanguage(lang);
    // Auto-switch currency when language changes for better UX
    setDetectedCurrency(lang === 'es' ? 'COP' : 'USD');
    setLangMenuVisible(false);
  };

  const selectCurrency = (curr: string) => {
    setDetectedCurrency(curr);
    setCurrencyMenuVisible(false);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <Surface style={styles.imageContainer} elevation={0}>
          <View
            style={[
              styles.logoCircle,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <IconButton
              icon="wallet-outline"
              size={60}
              iconColor={theme.colors.primary}
            />
          </View>
        </Surface>

        <Text variant="headlineLarge" style={styles.title}>
          {t('onboardingWelcome')}
        </Text>

        <Text variant="bodyLarge" style={styles.description}>
          {t('onboardingDesc')}
        </Text>

        <Surface style={styles.settingsCard} elevation={1}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.secondary }}
              >
                {t('detectedLanguage')}
              </Text>
              <Text variant="titleMedium">
                {detectedLang === 'es' ? t('spanish') : t('english')}
              </Text>
            </View>
            <Menu
              visible={langMenuVisible}
              onDismiss={() => setLangMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setLangMenuVisible(true)}
                  compact
                >
                  {detectedLang === 'es' ? t('spanish') : t('english')}
                </Button>
              }
            >
              <Menu.Item
                onPress={() => selectLanguage('en')}
                title={t('english')}
              />
              <Menu.Item
                onPress={() => selectLanguage('es')}
                title={t('spanish')}
              />
            </Menu>
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text
                variant="labelLarge"
                style={{ color: theme.colors.secondary }}
              >
                {t('detectedCurrency')}
              </Text>
              <Text variant="titleMedium">{detectedCurrency}</Text>
            </View>
            <Menu
              visible={currencyMenuVisible}
              onDismiss={() => setCurrencyMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setCurrencyMenuVisible(true)}
                  compact
                >
                  {detectedCurrency}
                </Button>
              }
            >
              <Menu.Item onPress={() => selectCurrency('COP')} title="COP" />
              <Menu.Item onPress={() => selectCurrency('USD')} title="USD" />
              <Menu.Item onPress={() => selectCurrency('EUR')} title="EUR" />
            </Menu>
          </View>
        </Surface>
      </View>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
        >
          {t('getStarted')}
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  settingsCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    gap: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footer: {
    padding: 24,
    paddingBottom: 48,
  },
  button: {
    borderRadius: 12,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
