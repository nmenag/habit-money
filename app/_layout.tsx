import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { AppState, AppStateStatus, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import mobileAds from 'react-native-google-mobile-ads';
import { adaptNavigationTheme, PaperProvider } from 'react-native-paper';
import { en, es, registerTranslation } from 'react-native-paper-dates';

import { interstitialManager } from '../src/ads/InterstitialManager';
import { initDb } from '../src/db/schema';
import { NotificationService } from '../src/services/NotificationService';
import { ProductAnalyticsService } from '../src/services/ProductAnalyticsService';
import { ReviewManager } from '../src/services/ReviewManager';
import { AppLockService } from '../src/services/AppLockService';
import { ReviewPrePromptDialog } from '../src/shared/components/ReviewPrePromptDialog';
import { AppLockScreen } from '../src/shared/components/AppLockScreen';
import { SplashScreen } from '../src/shared/components/SplashScreen';
import { useStore, useTranslation } from '../src/store/useStore';
import { darkTheme, lightTheme } from '../src/theme/theme';
import { checkBackupReminder } from '../src/utils/dataBackup';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

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
  const { loadData, isLoaded, setAppLockEnabled } = useStore();
  const appLockEnabled = useStore((state) => state.appLockEnabled);
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const themePreference = useStore((state) => state.themePreference);
  const pathname = usePathname();

  const [isLocked, setIsLocked] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(true);
  const prevAppState = useRef<AppStateStatus>('active');

  const isDarkTheme =
    themePreference === 'dark' ||
    (themePreference === 'system' && colorScheme === 'dark');
  const theme = isDarkTheme ? CombinedDarkTheme : CombinedDefaultTheme;

  useEffect(() => {
    if (!__DEV__) {
      const noop = () => {};
      ['log', 'info', 'warn', 'error'].forEach((key) => {
        (console as any)[key] = noop;
      });
    }

    const globalAny = global as any;
    if (globalAny.ErrorUtils) {
      const originalHandler = globalAny.ErrorUtils.getGlobalHandler();
      globalAny.ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
        ProductAnalyticsService.recordError(
          error instanceof Error ? error : new Error(String(error)),
          `Fatal_${isFatal}`,
        );
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    const setup = async () => {
      try {
        initDb();
        await ProductAnalyticsService.init();
        await mobileAds().initialize();
        interstitialManager.init();
        await NotificationService.setupChannel();
        await ReviewManager.recordAppOpen();

        const [lockEnabled, support] = await Promise.all([
          AppLockService.getAppLockEnabled(),
          AppLockService.checkHardwareSupport(),
        ]);

        setAppLockEnabled(lockEnabled);
        setIsEnrolled(support.isEnrolled);

        if (lockEnabled) {
          const result = await AppLockService.authenticate();
          setIsLocked(!result.success);
        }

        setDbInitialized(true);
      } catch (e) {
        console.error('Failed to initialize local DB or Ads', e);
        if (e instanceof Error) {
          ProductAnalyticsService.recordError(e, 'InitializationError');
        }
      }
    };
    setup();
  }, [setAppLockEnabled]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        prevAppState.current === 'background' &&
        nextAppState === 'active' &&
        appLockEnabled
      ) {
        const support = await AppLockService.checkHardwareSupport();
        setIsEnrolled(support.isEnrolled);
        setIsLocked(true);
        const result = await AppLockService.authenticate();
        setIsLocked(!result.success);
      }

      if (nextAppState === 'background') {
        ProductAnalyticsService.logAppBackground().catch(() => {});
      } else if (nextAppState === 'active') {
        ProductAnalyticsService.logAppForeground().catch(() => {});
      }

      prevAppState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => {
      subscription.remove();
    };
  }, [appLockEnabled]);

  useEffect(() => {
    if (dbInitialized && !isLoaded) {
      loadData();
    }
    if (dbInitialized && isLoaded) {
      ExpoSplashScreen.hideAsync().catch(() => {});
      if (pathname !== '/onboarding' && pathname !== '/') {
        checkBackupReminder(t);
      }
    }
  }, [dbInitialized, isLoaded, loadData, pathname, t]);

  const handleUnlock = useCallback(async () => {
    const result = await AppLockService.authenticate();
    if (result.success) {
      setIsLocked(false);
    }
  }, []);

  if (!dbInitialized || !isLoaded) {
    return <SplashScreen />;
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
              name="accounts"
              options={{
                headerShown: true,
                title: t('accounts'),
              }}
            />
            <Stack.Screen
              name="account-detail"
              options={{
                headerShown: true,
                title: t('accountDetails'),
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
              name="budget-detail"
              options={{
                headerShown: true,
                title: t('budgetDetails'),
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
              name="emergency-fund"
              options={{
                headerShown: true,
                title: t('emergencyFund'),
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
          <ReviewPrePromptDialog />
          {isLocked && appLockEnabled && (
            <AppLockScreen isEnrolled={isEnrolled} onUnlock={handleUnlock} />
          )}
        </ThemeProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
