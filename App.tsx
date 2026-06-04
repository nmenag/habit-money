import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
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
import { checkBackupReminder } from './src/utils/dataBackup';
import { ProductAnalyticsService } from './src/services/ProductAnalyticsService';

import {
  en as paperDatesEn,
  es as paperDatesEs,
  registerTranslation,
} from 'react-native-paper-dates';
import { CombinedDarkTheme, CombinedDefaultTheme } from './src/theme/theme';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { SplashScreen } from './src/shared/components/SplashScreen';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

registerTranslation('en', paperDatesEn);
registerTranslation('es', paperDatesEs);

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const { loadData, isLoaded, themePreference } = useStore();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();

  const navigationRef = React.useRef<any>(null);
  const routeNameRef = React.useRef<string | undefined>(undefined);

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
        setDbInitialized(true);

        await ProductAnalyticsService.init();

        const { InteractionManager } = require('react-native');
        InteractionManager.runAfterInteractions(async () => {
          try {
            await mobileAds().initialize();
            interstitialManager.init();
          } catch (e) {}
        });
      } catch (e) {
        console.error('Failed to initialize local DB', e);
        if (e instanceof Error) {
          ProductAnalyticsService.recordError(e, 'DatabaseInitialization');
        }
      }
    };
    setup();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        ProductAnalyticsService.logAppBackground().catch(() => {});
      } else if (nextAppState === 'active') {
        ProductAnalyticsService.logAppForeground().catch(() => {});
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (dbInitialized && !isLoaded) {
      loadData();
    }
  }, [dbInitialized, isLoaded, loadData]);

  useEffect(() => {
    if (dbInitialized && isLoaded) {
      const hideSplash = async () => {
        try {
          await ExpoSplashScreen.hideAsync();
        } catch (e) {}
      };
      hideSplash();

      checkBackupReminder(t);
    }
  }, [dbInitialized, isLoaded, t]);

  if (!dbInitialized || !isLoaded) {
    return <SplashScreen />;
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDarkTheme ? 'light' : 'dark'} />
      <NavigationContainer
        ref={navigationRef}
        theme={theme as any}
        onReady={() => {
          routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
        }}
        onStateChange={() => {
          const previousRouteName = routeNameRef.current;
          const currentRouteName =
            navigationRef.current?.getCurrentRoute()?.name;

          if (previousRouteName !== currentRouteName && currentRouteName) {
            switch (currentRouteName) {
              case 'Dashboard':
                ProductAnalyticsService.logDashboardViewed().catch(() => {});
                break;
              case 'Transactions':
                ProductAnalyticsService.logTransactionsViewed().catch(() => {});
                break;
              case 'Insights':
                ProductAnalyticsService.logInsightsScreenViewed().catch(
                  () => {},
                );
                ProductAnalyticsService.logInsightsViewed().catch(() => {});
                break;
              case 'Settings':
                ProductAnalyticsService.logSettingsViewed().catch(() => {});
                break;
              case 'Accounts':
                ProductAnalyticsService.logAccountsViewed().catch(() => {});
                break;
              case 'Budgets':
                ProductAnalyticsService.logBudgetsViewed().catch(() => {});
                break;
              case 'Goals':
                ProductAnalyticsService.logGoalsViewed().catch(() => {});
                break;
            }
          }
          routeNameRef.current = currentRouteName;
        }}
      >
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
