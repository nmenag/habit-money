import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Text as RNText,
  useColorScheme,
  View,
} from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { PaperProvider } from 'react-native-paper';
import { interstitialManager } from './src/ads/InterstitialManager';
import { initDb } from './src/db/schema';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useStore, useTranslation } from './src/store/useStore';

import {
  en as paperDatesEn,
  es as paperDatesEs,
  registerTranslation,
} from 'react-native-paper-dates';
import { CombinedDarkTheme, CombinedDefaultTheme } from './src/theme/theme';

registerTranslation('en', paperDatesEn);
registerTranslation('es', paperDatesEs);

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const { loadData, isLoaded, themePreference } = useStore();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();

  const isDarkTheme =
    themePreference === 'dark' ||
    (themePreference === 'system' && colorScheme === 'dark');
  const theme = isDarkTheme ? CombinedDarkTheme : CombinedDefaultTheme;

  useEffect(() => {
    // Disable console logs in production more efficiently
    if (!__DEV__) {
      const noop = () => {};
      ['log', 'info', 'warn', 'error'].forEach((key) => {
        (console as any)[key] = noop;
      });
    }

    const setup = async () => {
      try {
        // Run DB init
        initDb();
        setDbInitialized(true);

        // Defer ads and other non-critical heavy init
        const { InteractionManager } = require('react-native');
        InteractionManager.runAfterInteractions(async () => {
          try {
            await mobileAds().initialize();
            interstitialManager.init();
          } catch (e) {
            // Silently fail ads in production
          }
        });
      } catch (e) {
        console.error('Failed to initialize local DB', e);
      }
    };
    setup();
  }, []);

  useEffect(() => {
    if (dbInitialized && !isLoaded) {
      loadData();
    }
  }, [dbInitialized, isLoaded, loadData]);

  if (!dbInitialized || !isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <RNText
          style={{
            marginTop: 16,
            color: theme.colors.onSurfaceVariant,
            fontWeight: '600',
            fontSize: 16,
          }}
        >
          {t('loadingApp')}
        </RNText>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
      <NavigationContainer theme={theme as any}>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
