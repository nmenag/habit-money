import { Stack, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { initializeAds } from '../src/ads/AdInitializer';
import { PaperProvider, adaptNavigationTheme } from 'react-native-paper';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { registerTranslation, en, es } from 'react-native-paper-dates';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initDb } from '../src/db/schema';
import { useStore, useTranslation } from '../src/store/useStore';
import { darkTheme, lightTheme } from '../src/theme/theme';
import { interstitialManager } from '../src/ads/InterstitialManager';
import { checkBackupReminder } from '../src/utils/dataBackup';
import { NotificationService } from '../src/services/NotificationService';

// Register locales for the date picker
registerTranslation('en', en);
registerTranslation('es', es);

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

export default function RootLayout() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const { loadData, isLoaded } = useStore();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const themePreference = useStore((state) => state.themePreference);
  const pathname = usePathname();

  const isDarkTheme =
    themePreference === 'dark' ||
    (themePreference === 'system' && colorScheme === 'dark');
  const theme = isDarkTheme ? CombinedDarkTheme : CombinedDefaultTheme;

  useEffect(() => {
    const setup = async () => {
      try {
        await initializeAds();
        interstitialManager.init();
        initDb();
        await NotificationService.setupChannel();
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
    if (
      dbInitialized &&
      isLoaded &&
      pathname !== '/onboarding' &&
      pathname !== '/'
    ) {
      checkBackupReminder(t);
    }
  }, [dbInitialized, isLoaded, loadData, pathname, t]);

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={theme}>
        <ThemeProvider value={theme as any}>
          <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="add-transaction"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: t('addTransaction'),
              }}
            />
            <Stack.Screen
              name="add-account"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: t('addAccount'),
              }}
            />
            <Stack.Screen
              name="add-category"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: t('addCategory'),
              }}
            />
            <Stack.Screen
              name="add-budget"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: t('addBudget'),
              }}
            />
            <Stack.Screen
              name="add-goal"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: t('addGoal'),
              }}
            />
            <Stack.Screen
              name="accounts"
              options={{
                headerShown: true,
                title: t('accounts'),
              }}
            />
            <Stack.Screen
              name="categories"
              options={{
                headerShown: true,
                title: t('categories'),
              }}
            />
            <Stack.Screen
              name="budgets"
              options={{
                headerShown: true,
                title: t('budgets'),
              }}
            />
            <Stack.Screen
              name="goals"
              options={{
                headerShown: true,
                title: t('goals'),
              }}
            />
            <Stack.Screen
              name="calendar"
              options={{
                headerShown: true,
                title: t('calendar'),
              }}
            />
            <Stack.Screen
              name="goal-detail"
              options={{
                headerShown: true,
                title: t('goalDetail'),
              }}
            />
            <Stack.Screen
              name="about"
              options={{
                headerShown: true,
                title: t('aboutApp'),
              }}
            />
            <Stack.Screen
              name="privacy-policy"
              options={{
                headerShown: true,
                title: t('privacyPolicy'),
              }}
            />
            <Stack.Screen
              name="export-data"
              options={{
                headerShown: true,
                title: t('exportData'),
              }}
            />
          </Stack>
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
