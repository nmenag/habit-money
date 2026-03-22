import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { interstitialManager } from './src/ads/InterstitialManager';
import { initDb } from './src/db/schema';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useStore } from './src/store/useStore';

import { adaptNavigationTheme, PaperProvider } from 'react-native-paper';
import {
  en as paperDatesEn,
  es as paperDatesEs,
  registerTranslation,
} from 'react-native-paper-dates';
import { darkTheme, lightTheme } from './src/theme/theme';

registerTranslation('en', paperDatesEn);
registerTranslation('es', paperDatesEs);

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = {
  ...LightTheme,
  ...lightTheme,
  colors: {
    ...LightTheme.colors,
    ...lightTheme.colors,
  },
  fonts: lightTheme.fonts,
};
const CombinedDarkTheme = {
  ...DarkTheme,
  ...darkTheme,
  colors: {
    ...DarkTheme.colors,
    ...darkTheme.colors,
  },
  fonts: darkTheme.fonts,
};

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const { loadData, isLoaded } = useStore();
  const colorScheme = useColorScheme();

  const isDarkTheme = colorScheme === 'dark';
  const theme = isDarkTheme ? CombinedDarkTheme : CombinedDefaultTheme;

  useEffect(() => {
    const setup = async () => {
      try {
        await mobileAds().initialize();
        interstitialManager.init();
        initDb();
        setDbInitialized(true);
      } catch (e) {
        console.error('Failed to initialize local DB or Ads', e);
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
