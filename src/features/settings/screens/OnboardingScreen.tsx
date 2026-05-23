import { Image } from 'expo-image';
import * as Localization from 'expo-localization';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import { Button, Menu, Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../../../db/schema';
import { Language } from '../../../i18n/translations';
import { useStore, useTranslation } from '../../../store/useStore';
import { getLocalDateString } from '../../../utils/dateUtils';
import { CURRENCIES } from '../../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export const OnboardingScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setLanguage, setCurrency, loadData } = useStore();
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
    setCurrency(detectedCurrency);
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../../../assets/images/icon.png')}
              style={[
                styles.logoImage,
                { borderColor: theme.colors.outlineVariant, borderWidth: 1 },
              ]}
              contentFit="contain"
              transition={300}
            />
            <View
              style={[
                styles.glowEffect,
                { backgroundColor: theme.colors.primary },
              ]}
            />
          </View>

          <Text style={[styles.title, { color: theme.colors.onBackground }]}>
            {t('onboardingWelcome')}
          </Text>

          <Text
            style={[
              styles.description,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('onboardingDesc')}
          </Text>
        </View>

        <View style={styles.preferencesSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {t('preferences') || 'Preferences'}
          </Text>

          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <Menu
              visible={langMenuVisible}
              onDismiss={() => setLangMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.settingRow}
                  activeOpacity={0.7}
                  onPress={() => setLangMenuVisible(true)}
                >
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: addAlpha(theme.colors.primary, 0.08),
                        borderColor: addAlpha(theme.colors.primary, 0.17),
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="earth"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text
                      style={[
                        styles.settingLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {t('detectedLanguage')}
                    </Text>
                    <Text
                      style={[
                        styles.settingValue,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {detectedLang === 'es' ? t('spanish') : t('english')}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
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
            <View
              style={[
                styles.divider,
                { backgroundColor: theme.colors.outlineVariant },
              ]}
            />
            <Menu
              visible={currencyMenuVisible}
              onDismiss={() => setCurrencyMenuVisible(false)}
              anchor={
                <TouchableOpacity
                  style={styles.settingRow}
                  activeOpacity={0.7}
                  onPress={() => setCurrencyMenuVisible(true)}
                >
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: addAlpha(theme.colors.primary, 0.08),
                        borderColor: addAlpha(theme.colors.primary, 0.17),
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                  <View style={styles.settingTextContainer}>
                    <Text
                      style={[
                        styles.settingLabel,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {t('detectedCurrency')}
                    </Text>
                    <Text
                      style={[
                        styles.settingValue,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {t(
                        CURRENCIES.find((c) => c.code === detectedCurrency)
                          ?.tKey as any,
                      )}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
              }
              contentStyle={{ backgroundColor: theme.colors.elevation.level3 }}
            >
              <ScrollView style={{ maxHeight: 300 }}>
                {CURRENCIES.map((curr) => (
                  <Menu.Item
                    key={curr.code}
                    onPress={() => selectCurrency(curr.code)}
                    title={`${t(curr.tKey as any)} (${curr.code})`}
                  />
                ))}
              </ScrollView>
            </Menu>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.background,
            paddingBottom: Math.max(insets.bottom + 24, 48),
          },
        ]}
      >
        <Text
          style={[styles.termsText, { color: theme.colors.onSurfaceVariant }]}
        >
          {t('agreeToTermsPrefix')}{' '}
          <Text
            style={[styles.termsLink, { color: theme.colors.primary }]}
            onPress={() =>
              Linking.openURL(
                'https://nmenag.github.io/habit-money/privacy.html',
              )
            }
          >
            {t('privacyPolicy')}
          </Text>{' '}
          {t('agreeToTermsAnd')}{' '}
          <Text
            style={[styles.termsLink, { color: theme.colors.primary }]}
            onPress={() =>
              Linking.openURL('https://nmenag.github.io/habit-money/terms.html')
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 32,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 32,
    zIndex: 2,
  },
  glowEffect: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: -10,
    bottom: -10,
    borderRadius: 60,
    opacity: 0.15,
    zIndex: 1,
    transform: [{ scale: 1.1 }],
    filter: 'blur(10px)',
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
    lineHeight: 38,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  preferencesSection: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 8,
  },
  settingsCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 20,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  settingLabel: {
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    fontSize: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  settingValue: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginLeft: 72,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  termsText: {
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  button: {
    borderRadius: 100,
    elevation: 0,
  },
  buttonContent: {
    height: 60,
  },
  buttonLabel: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
