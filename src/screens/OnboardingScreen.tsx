import * as Localization from 'expo-localization';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { Button, Menu, Surface, Text, useTheme } from 'react-native-paper';
import { getDb } from '../db/schema';
import { Language } from '../i18n/translations';
import { useStore, useTranslation } from '../store/useStore';
import { getLocalDateString } from '../utils/dateUtils';

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
    setLanguage(detectedLang);

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
      getLocalDateString(),
    ]);
    loadData();

    router.replace('/(tabs)');
  };

  const selectLanguage = (lang: Language) => {
    setDetectedLang(lang);
    setLanguage(lang);
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
        <View style={styles.header}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
          />
          <Text variant="headlineLarge" style={styles.title}>
            {t('onboardingWelcome')}
          </Text>
          <Text variant="bodyLarge" style={styles.description}>
            {t('onboardingDesc')}
          </Text>
        </View>

        <View style={styles.settingsSection}>
          <View style={styles.settingItem}>
            <Text variant="labelLarge" style={styles.settingLabel}>
              {t('detectedLanguage')}
            </Text>
            <Menu
              visible={langMenuVisible}
              onDismiss={() => setLangMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setLangMenuVisible(true)}
                  style={styles.pickerButton}
                  contentStyle={styles.pickerButtonContent}
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

          <View style={styles.settingItem}>
            <Text variant="labelLarge" style={styles.settingLabel}>
              {t('detectedCurrency')}
            </Text>
            <Menu
              visible={currencyMenuVisible}
              onDismiss={() => setCurrencyMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setCurrencyMenuVisible(true)}
                  style={styles.pickerButton}
                  contentStyle={styles.pickerButtonContent}
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
        </View>
      </View>

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.termsText}>
          {t('agreeToTermsPrefix')}
          <Text
            style={styles.link}
            onPress={() =>
              Linking.openURL('https://nmenag.github.io/fin-habit/privacy.html')
            }
          >
            {t('privacyPolicy')}
          </Text>
          {t('agreeToTermsAnd')}
          <Text
            style={styles.link}
            onPress={() =>
              Linking.openURL('https://nmenag.github.io/fin-habit/terms.html')
            }
          >
            {t('termsOfUse')}
          </Text>
        </Text>
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
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24,
  },
  settingsSection: {
    gap: 24,
  },
  settingItem: {
    gap: 8,
  },
  settingLabel: {
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  pickerButton: {
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerButtonContent: {
    height: 56,
    justifyContent: 'flex-start',
  },
  footer: {
    padding: 24,
    paddingBottom: 48,
  },
  termsText: {
    textAlign: 'center',
    opacity: 0.5,
    marginBottom: 20,
    lineHeight: 18,
  },
  link: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  button: {
    borderRadius: 16,
    elevation: 0,
  },
  buttonContent: {
    height: 64,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
