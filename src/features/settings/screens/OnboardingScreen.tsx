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
import { Button, Text, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { getDb } from '../../../db/schema';
import { Language } from '../../../i18n/translations';
import { useStore, useTranslation } from '../../../store/useStore';
import { CURRENCIES } from '../../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '../../../shared/components/BottomSheet';

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
    if (locales && locales.length > 0) {
      const languageCode = locales[0].languageCode;
      const detected = languageCode === 'es' ? 'es' : 'en';
      setDetectedLang(detected);
      setLanguage(detected);

      const currencyCode = locales[0].currencyCode;
      if (currencyCode) {
        const matchesCode = CURRENCIES.some((c) => c.code === currencyCode);
        if (matchesCode) {
          setDetectedCurrency(currencyCode);
        }
      }
    }
  }, [setLanguage]);

  const selectLanguage = (lang: Language) => {
    setDetectedLang(lang);
    setLanguage(lang);
  };

  const selectCurrency = (curr: string) => {
    setDetectedCurrency(curr);
  };

  const handleStart = async () => {
    try {
      setLanguage(detectedLang);
      setCurrency(detectedCurrency);

      const db = await getDb();
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)',
        ['isFirstLaunch', 'false'],
      );
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)',
        ['language', detectedLang],
      );
      await db.runAsync(
        'INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)',
        ['currency', detectedCurrency],
      );

      await loadData();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to save onboarding settings:', error);
      router.replace('/(tabs)');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: Math.max(insets.top, 20),
        },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { flexGrow: 1, justifyContent: 'space-between' },
        ]}
      >
        <View style={styles.mainContent}>
          <View style={styles.header}>
            <Image
              source={require('../../../../assets/images/icon.png')}
              style={styles.logo}
              priority="high"
            />
            <Text
              style={[styles.title, { color: theme.colors.onBackground }]}
              variant="headlineLarge"
            >
              Habit Money
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
              variant="bodyLarge"
            >
              {t('onboardingDesc')}
            </Text>
          </View>

          <View style={styles.content}>
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
                styles.settingsCard,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
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
              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.outlineVariant },
                ]}
              />
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
            </View>
          </View>
        </View>

        <View
          style={[
            styles.footer,
            {
              borderTopWidth: 1,
              borderTopColor: theme.colors.outlineVariant,
              paddingBottom: Math.max(insets.bottom, 24),
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
            </Text>
          </Text>
          <Button
            mode="contained"
            onPress={handleStart}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {t('startOnboarding')}
          </Button>
        </View>
      </ScrollView>

      <BottomSheet
        visible={langMenuVisible}
        onClose={() => setLangMenuVisible(false)}
        title={t('detectedLanguage') || 'Select Language'}
      >
        <TouchableOpacity
          style={[
            styles.modalListItem,
            { borderColor: theme.colors.outlineVariant },
            detectedLang === 'en' && {
              backgroundColor: theme.dark
                ? addAlpha(theme.colors.primary, 0.16)
                : addAlpha(theme.colors.primary, 0.08),
            },
          ]}
          onPress={() => {
            selectLanguage('en');
            setLangMenuVisible(false);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: detectedLang === 'en' }}
        >
          <Text
            style={{
              fontFamily: 'Inter-Medium',
              fontWeight: '500',
              color: theme.colors.onSurface,
            }}
          >
            {t('english')}
          </Text>
          <View
            style={[
              styles.radioOuter,
              {
                borderColor:
                  detectedLang === 'en'
                    ? theme.colors.primary
                    : theme.colors.outlineVariant,
              },
            ]}
          >
            {detectedLang === 'en' && (
              <View
                style={[
                  styles.radioInner,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modalListItem,
            { borderColor: theme.colors.outlineVariant },
            detectedLang === 'es' && {
              backgroundColor: theme.dark
                ? addAlpha(theme.colors.primary, 0.16)
                : addAlpha(theme.colors.primary, 0.08),
            },
          ]}
          onPress={() => {
            selectLanguage('es');
            setLangMenuVisible(false);
          }}
          accessibilityRole="button"
          accessibilityState={{ selected: detectedLang === 'es' }}
        >
          <Text
            style={{
              fontFamily: 'Inter-Medium',
              fontWeight: '500',
              color: theme.colors.onSurface,
            }}
          >
            {t('spanish')}
          </Text>
          <View
            style={[
              styles.radioOuter,
              {
                borderColor:
                  detectedLang === 'es'
                    ? theme.colors.primary
                    : theme.colors.outlineVariant,
              },
            ]}
          >
            {detectedLang === 'es' && (
              <View
                style={[
                  styles.radioInner,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            )}
          </View>
        </TouchableOpacity>
      </BottomSheet>

      <BottomSheet
        visible={currencyMenuVisible}
        onClose={() => setCurrencyMenuVisible(false)}
        title={t('detectedCurrency') || 'Select Currency'}
      >
        <ScrollView
          style={{ maxHeight: 400 }}
          showsVerticalScrollIndicator={false}
        >
          {CURRENCIES.map((curr) => {
            const isSelected = detectedCurrency === curr.code;
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
                  selectCurrency(curr.code);
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  mainContent: {
    padding: 24,
    paddingBottom: 16,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 22,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    fontSize: 28,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontWeight: '400',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  content: {
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
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
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
});
