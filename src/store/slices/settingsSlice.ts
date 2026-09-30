import * as Localization from 'expo-localization';
import { StateCreator } from 'zustand';
import { interstitialManager } from '../../ads/InterstitialManager';
import { getDb, initDb } from '../../db/schema';
import { Language } from '../../i18n/translations';
import { AnalyticsManager } from '../../features/insights/services/AnalyticsManager';
import { AnalyticsReport } from '../../features/insights/services/types';
import { getLocalDateString } from '../../utils/dateUtils';
import { getLast30DaysRange, getMonthRange } from '../../utils/dateFilters';
import { formatCurrency as formatCurrencyUtil } from '../../utils/formatters';
import { Account, Category, Transaction } from '../types';
import { useFilterStore } from '../useFilterStore';
import type { AppStore } from '../useStore';
import { triggerWidgetUpdate } from '../../utils/widgetUpdater';
import { AppLockService } from '../../services/AppLockService';

let analyticsDebounceTimer: any = null;

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  MXN: '$',
  COP: '$',
  PEN: 'S/',
  CLP: '$',
  CAD: '$',
  AUD: '$',
  NZD: '$',
  ARS: '$',
  BOB: 'Bs.',
  CRC: '₡',
  CUP: '$',
  DOP: 'RD$',
  GTQ: 'Q',
  HNL: 'L',
  NIO: 'C$',
  PYG: '₲',
  UYU: '$U',
  VES: 'Bs.S',
  XAF: 'FCFA',
  INR: '₹',
  ZAR: 'R',
  SGD: 'S$',
  PHP: '₱',
  NGN: '₦',
  PKR: '₨',
  JMD: 'J$',
  BSD: 'B$',
  TTD: 'TT$',
  BZD: 'BZ$',
  BBD: 'Bds$',
  KES: 'KSh',
  GHS: '₵',
};

export interface SettingsSlice {
  language: Language;
  currency: string;
  currencySymbol: string;
  themePreference: 'light' | 'dark' | 'system';
  cycleStartDay: number;
  isLoaded: boolean;
  isFirstLaunch: boolean;
  isPremiumUser: boolean;
  analyticsReport: AnalyticsReport | null;
  dashboardReport: AnalyticsReport | null;
  notificationsEnabled: boolean;
  notificationTime: string;
  appLockEnabled: boolean;

  loadData: () => void;
  setLanguage: (lang: Language) => void;
  setThemePreference: (theme: 'light' | 'dark' | 'system') => void;
  setCycleStartDay: (day: number) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationTime: (time: string) => void;
  setCurrency: (currency: string) => void;
  setPremium: (isPremium: boolean) => void;
  setAppLockEnabled: (enabled: boolean) => Promise<void>;
  completeOnboarding: (lang: Language, currency: string) => void;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  checkAndShowAd: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  resetData: () => void;
}

export const createSettingsSlice: StateCreator<
  AppStore,
  [],
  [],
  SettingsSlice
> = (set, get) => ({
  language: 'en',
  currency: 'COP',
  currencySymbol: '$',
  themePreference: 'system',
  cycleStartDay: 1,
  isLoaded: false,
  isFirstLaunch: true,
  isPremiumUser: false,
  analyticsReport: null,
  dashboardReport: null,
  notificationsEnabled: false,
  notificationTime: '20:00',
  appLockEnabled: false,

  loadData: () => {
    const db = getDb();

    const accounts = db.getAllSync<Account>(
      'SELECT id, name, type, initialBalance, currentBalance, color, currency, displayOrder FROM accounts ORDER BY displayOrder ASC, name ASC',
    );
    const categories = db.getAllSync<Category>(
      'SELECT id, name, type, icon, color, displayOrder FROM categories ORDER BY displayOrder ASC, name ASC',
    );

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const dateLimit = getLocalDateString(twoMonthsAgo);

    const transactions = db.getAllSync<Transaction>(
      `SELECT id, type, amount, categoryId, accountId, budgetId, date, note, toAccountId
       FROM transactions
       WHERE date >= ?
       ORDER BY date DESC LIMIT 300`,
      [dateLimit],
    );

    let currencySetting;
    let languageSetting;
    let premiumSetting;
    let themeSetting;
    let cycleStartDaySetting;
    let notifEnabledSetting;
    let notifTimeSetting;
    let firstLaunchSetting;
    let txCountSetting;
    try {
      currencySetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'currency'",
      );
      languageSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'language'",
      );
      premiumSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'premium'",
      );
      themeSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'themePreference'",
      );
      cycleStartDaySetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'cycleStartDay'",
      );
      notifEnabledSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'notificationsEnabled'",
      );
      notifTimeSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'notificationTime'",
      );
      firstLaunchSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'isFirstLaunch'",
      );
      txCountSetting = db.getFirstSync<{ count: number }>(
        'SELECT COUNT(*) as count FROM transactions',
      );
    } catch (e) {
      console.warn('Could not load settings from DB:', e);
    }

    let finalLanguage: Language = 'en';
    if (languageSetting?.val) {
      finalLanguage = languageSetting.val as Language;
    } else {
      try {
        if (Localization && typeof Localization.getLocales === 'function') {
          const locales = Localization.getLocales();
          if (locales && locales.length > 0) {
            finalLanguage = locales[0].languageCode?.startsWith('es')
              ? 'es'
              : 'en';
          }
        }
      } catch {
        console.warn('Localization native module not found, defaulting to en');
      }
    }

    const isFirstLaunch = !(
      firstLaunchSetting?.val === 'false' ||
      (txCountSetting && txCountSetting.count > 0)
    );

    const parsedCycleDay = cycleStartDaySetting?.val
      ? parseInt(cycleStartDaySetting.val, 10)
      : 1;
    const cycleStartDay = Math.max(
      1,
      Math.min(31, isNaN(parsedCycleDay) ? 1 : parsedCycleDay),
    );

    set({
      accounts,
      transactions,
      categories,
      language: finalLanguage,
      currency: currencySetting?.val || 'COP',
      currencySymbol: CURRENCY_SYMBOLS[currencySetting?.val || 'COP'] || '$',
      themePreference:
        (themeSetting?.val as 'light' | 'dark' | 'system') || 'system',
      cycleStartDay,
      isPremiumUser: premiumSetting?.val === 'true',
      notificationsEnabled: notifEnabledSetting?.val === 'true',
      notificationTime: notifTimeSetting?.val || '20:00',
      isFirstLaunch,
      isLoaded: true,
    });

    setTimeout(() => {
      get().loadBudgets();
      get().refreshAnalytics();
    }, 100);
  },

  setLanguage: (lang) => {
    set({ language: lang });
    setTimeout(() => {
      try {
        const db = getDb();
        db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
          'language',
          lang,
        ]);
        get().refreshAnalytics();
      } catch (error) {
        console.error('setLanguage DB Error:', error);
      }
    }, 0);
  },

  setThemePreference: (theme) => {
    set({ themePreference: theme });
    try {
      const db = getDb();
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'themePreference',
        theme,
      ]);
    } catch (error) {
      console.error('setThemePreference DB Error:', error);
    }
  },

  setCycleStartDay: (day) => {
    const clampedDay = Math.max(1, Math.min(31, day));
    set({ cycleStartDay: clampedDay });
    setTimeout(() => {
      try {
        const db = getDb();
        db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
          'cycleStartDay',
          String(clampedDay),
        ]);
        useFilterStore.getState().updateCycleStartDay(clampedDay);
        get().refreshAnalytics();
      } catch (error) {
        console.error('setCycleStartDay DB Error:', error);
      }
    }, 0);
  },

  setNotificationsEnabled: (enabled) => {
    set({ notificationsEnabled: enabled });
    try {
      const db = getDb();
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'notificationsEnabled',
        String(enabled),
      ]);
    } catch (error) {
      console.error('setNotificationsEnabled DB Error:', error);
    }
  },

  setNotificationTime: (time) => {
    set({ notificationTime: time });
    try {
      const db = getDb();
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'notificationTime',
        time,
      ]);
    } catch (error) {
      console.error('setNotificationTime DB Error:', error);
    }
  },

  setCurrency: (currency) => {
    const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';
    set({ currency, currencySymbol });

    setTimeout(() => {
      try {
        const db = getDb();
        db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
          'currency',
          currency,
        ]);
        db.runSync('UPDATE accounts SET currency = ?', [currency]);
        get().loadData();
      } catch (error) {
        console.error('setCurrency DB Error:', error);
      }
    }, 0);
  },

  setPremium: (isPremium) => {
    set({ isPremiumUser: isPremium });
    try {
      const db = getDb();
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'premium',
        String(isPremium),
      ]);
    } catch (error) {
      console.error('setPremium DB Error:', error);
    }
  },

  setAppLockEnabled: async (enabled) => {
    await AppLockService.setAppLockEnabled(enabled);
    set({ appLockEnabled: enabled });
  },

  completeOnboarding: (lang, currency) => {
    try {
      const db = getDb();
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'isFirstLaunch',
        'false',
      ]);
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'language',
        lang,
      ]);
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'currency',
        currency,
      ]);

      const currencySymbol = CURRENCY_SYMBOLS[currency] || '$';
      set({ language: lang, currency, currencySymbol, isFirstLaunch: false });

      db.runSync('UPDATE accounts SET currency = ?', [currency]);
      get().loadData();
    } catch (error) {
      console.error('completeOnboarding DB Error:', error);
      throw error;
    }
  },

  formatCurrency: (amount, currencyCode) => {
    const { language, currency: defaultCurrency } = get();
    return formatCurrencyUtil(
      amount,
      currencyCode || defaultCurrency,
      language,
    );
  },

  resetData: () => {
    try {
      const db = getDb();
      db.execSync('DELETE FROM transactions;');
      db.execSync('DELETE FROM budgets;');
      db.execSync('DELETE FROM accounts;');
      db.execSync('DELETE FROM categories;');
      initDb();
      set({
        transactions: [],
        budgets: [],
        accounts: [],
        categories: [],
        analyticsReport: null,
        dashboardReport: null,
      });
      setTimeout(() => {
        get().loadData();
      }, 0);
    } catch (error) {
      console.error('resetData DB Error:', error);
      throw error;
    }
  },

  checkAndShowAd: async () => {
    const { isPremiumUser } = get();
    if (isPremiumUser) return;
    await interstitialManager.show();
  },

  refreshAnalytics: async () => {
    if (analyticsDebounceTimer) {
      clearTimeout(analyticsDebounceTimer);
    }

    analyticsDebounceTimer = setTimeout(async () => {
      try {
        const { language, cycleStartDay } = get();

        const now = new Date();
        const currentMonthStart = getLocalDateString(
          getMonthRange(cycleStartDay, now).startDate,
        );
        const hasCurrentMonthData = get().transactions.some(
          (t) => t.date >= currentMonthStart && t.type !== 'transfer',
        );

        let activeRange = useFilterStore.getState().selectedRange;
        const isDefault = useFilterStore.getState().isDefaultFilter;
        if (
          isDefault &&
          (activeRange.type === 'month' || activeRange.type === 'last30Days')
        ) {
          const targetType = hasCurrentMonthData ? 'month' : 'last30Days';
          if (activeRange.type !== targetType) {
            useFilterStore
              .getState()
              .setDefaultFilter(targetType, cycleStartDay);
            activeRange = useFilterStore.getState().selectedRange;
          } else if (activeRange.type === 'month') {
            useFilterStore.getState().updateCycleStartDay(cycleStartDay);
            activeRange = useFilterStore.getState().selectedRange;
          }
        }

        const report = await AnalyticsManager.generateFullReport(
          language,
          activeRange,
          cycleStartDay,
        );
        const dReport = await AnalyticsManager.generateFullReport(
          language,
          getLast30DaysRange(),
          cycleStartDay,
        );
        set({ analyticsReport: report, dashboardReport: dReport });
        analyticsDebounceTimer = null;
        triggerWidgetUpdate();
      } catch (error) {
        console.error('refreshAnalytics Error:', error);
        analyticsDebounceTimer = null;
      }
    }, 300);
  },
});
