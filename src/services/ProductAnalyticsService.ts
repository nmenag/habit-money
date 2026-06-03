import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserProperty,
} from '@react-native-firebase/analytics';
import {
  getCrashlytics,
  setCrashlyticsCollectionEnabled,
  log,
  recordError,
  setAttributes,
  setAttribute,
} from '@react-native-firebase/crashlytics';
import { getApp } from '@react-native-firebase/app';
import * as Application from 'expo-application';

export class ProductAnalyticsService {
  private static isInitialized = false;

  private static get analytics() {
    return getAnalytics();
  }

  private static get crashlytics() {
    return getCrashlytics();
  }

  public static isSdkInitialized(): boolean {
    if (!this.isInitialized) {
      return false;
    }
    try {
      const app = getApp();
      return !!app;
    } catch {
      return false;
    }
  }

  public static async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Promise.all([
        setAnalyticsCollectionEnabled(this.analytics, true),
        setCrashlyticsCollectionEnabled(this.crashlytics, true),
      ]);

      const appId = Application.applicationId;
      let appVariant = 'production';
      let userType = 'real';

      if (__DEV__) {
        appVariant = 'development';
        userType = 'internal';
      } else if (appId === 'com.habitmoney.dev') {
        appVariant = 'development';
        userType = 'internal';
      } else if (appId === 'com.habitmoney.preview') {
        appVariant = 'preview';
        userType = 'internal';
      }

      await Promise.all([
        setUserProperty(this.analytics, 'app_variant', appVariant),
        setUserProperty(this.analytics, 'user_type', userType),
      ]);

      setAttributes(this.crashlytics, {
        app_variant: appVariant,
        user_type: userType,
      });

      this.isInitialized = true;
      console.log(
        `[ProductAnalyticsService] Initialized successfully. Variant: ${appVariant}, UserType: ${userType}`,
      );

      if (__DEV__) {
        console.log(
          '[ProductAnalyticsService] ℹ️ To view events in real-time in the Firebase Console DebugView, run:',
        );
        console.log(
          `   Android: adb shell setprop debug.firebase.analytics.app ${appId || 'com.habitmoney.dev'}`,
        );
        console.log(
          "   iOS: Add the '-FIRDebugEnabled' launch argument in Xcode (Product > Scheme > Edit Scheme > Run > Arguments).",
        );
      }

      await this.logAppOpen();
    } catch (error) {
      console.warn('[ProductAnalyticsService] Initialization warning:', error);
      if (error instanceof Error) {
        this.recordError(error, 'Initialization');
      }
    }
  }

  public static async logEvent(
    eventName: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<void> {
    try {
      const sanitizedParams = this.sanitizeParams(eventName, params);
      await logEvent(this.analytics, eventName, sanitizedParams);
    } catch (error) {
      console.warn(
        `[ProductAnalyticsService] Failed to log event '${eventName}':`,
        error,
      );
    }
  }

  private static sanitizeParams(
    eventName: string,
    params?: Record<string, string | number | boolean>,
  ): Record<string, string | number | boolean> | undefined {
    if (!params) return undefined;

    const sanitized: Record<string, string | number | boolean> = {};
    const blockedKeywords = [
      'amount',
      'balance',
      'description',
      'note',
      'notes',
      'name',
      'category',
      'categoryname',
      'accountname',
      'title',
      'value',
    ];

    for (const [key, value] of Object.entries(params)) {
      const lowerKey = key.toLowerCase();
      const isBlocked = blockedKeywords.some((blocked) =>
        lowerKey.includes(blocked),
      );

      if (isBlocked) {
        console.warn(
          `[ProductAnalyticsService] Privacy Filter: Blocked key '${key}' from event '${eventName}' to avoid leaking financial/PII data.`,
        );
        continue;
      }

      sanitized[key] = value;
    }

    return sanitized;
  }

  public static async logAppOpen(): Promise<void> {
    await this.logEvent('app_open');
  }

  public static async logAppBackground(): Promise<void> {
    await this.logEvent('app_background');
  }

  public static async logAppForeground(): Promise<void> {
    await this.logEvent('app_foreground');
  }

  public static async logFirstAccountCreated(): Promise<void> {
    await this.logEvent('first_account_created');
  }

  public static async logFirstTransactionCreated(): Promise<void> {
    await this.logEvent('first_transaction_created');
  }

  public static async logTransactionCreated(
    type: 'expense' | 'income' | 'transfer',
  ): Promise<void> {
    await this.logEvent('transaction_created', { transaction_type: type });
  }

  public static async logTransactionUpdated(
    type: 'expense' | 'income' | 'transfer',
  ): Promise<void> {
    await this.logEvent('transaction_updated', { transaction_type: type });
  }

  public static async logTransactionDeleted(
    type: 'expense' | 'income' | 'transfer',
  ): Promise<void> {
    await this.logEvent('transaction_deleted', { transaction_type: type });
  }

  public static async logAccountCreated(type: string): Promise<void> {
    await this.logEvent('account_created', { account_type: type });
  }

  public static async logAccountUpdated(type: string): Promise<void> {
    await this.logEvent('account_updated', { account_type: type });
  }

  public static async logAccountDeleted(type: string): Promise<void> {
    await this.logEvent('account_deleted', { account_type: type });
  }

  public static async logBudgetCreated(): Promise<void> {
    await this.logEvent('budget_created');
  }

  public static async logBudgetUpdated(): Promise<void> {
    await this.logEvent('budget_updated');
  }

  public static async logGoalCreated(): Promise<void> {
    await this.logEvent('goal_created');
  }

  public static async logGoalUpdated(): Promise<void> {
    await this.logEvent('goal_updated');
  }

  public static async logInsightsViewed(): Promise<void> {
    await this.logEvent('insights_viewed');
  }

  public static async logSettingsViewed(): Promise<void> {
    await this.logEvent('settings_viewed');
  }

  public static async logDashboardViewed(): Promise<void> {
    await this.logEvent('dashboard_viewed');
  }

  public static async logAccountsViewed(): Promise<void> {
    await this.logEvent('accounts_viewed');
  }

  public static async logTransactionsViewed(): Promise<void> {
    await this.logEvent('transactions_viewed');
  }

  public static async logBudgetsViewed(): Promise<void> {
    await this.logEvent('budgets_viewed');
  }

  public static async logGoalsViewed(): Promise<void> {
    await this.logEvent('goals_viewed');
  }

  public static async logInsightsScreenViewed(): Promise<void> {
    await this.logEvent('insights_screen_viewed');
  }

  public static logCrash(message: string): void {
    log(this.crashlytics, message);
  }

  public static recordError(error: Error, context?: string): void {
    if (context) {
      setAttribute(this.crashlytics, 'error_context', context);
    }
    recordError(this.crashlytics, error);
  }
}
