import * as Localization from 'expo-localization';
import { StateCreator } from 'zustand';
import { interstitialManager } from '../../ads/InterstitialManager';
import { getDb } from '../../db/schema';
import { Language } from '../../i18n/translations';
import { AnalyticsManager } from '../../features/insights/services/AnalyticsManager';
import { AnalyticsReport } from '../../features/insights/services/types';
import { getLocalDateString } from '../../utils/dateUtils';
import { formatCurrency as formatCurrencyUtil } from '../../utils/formatters';
import { Account, Category, Transaction } from '../types';
import type { AppStore } from '../useStore';

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
};

export interface SettingsSlice {
  language: Language;
  currency: string;
  currencySymbol: string;
  themePreference: 'light' | 'dark' | 'system';
  isLoaded: boolean;
  isPremiumUser: boolean;
  analyticsReport: AnalyticsReport | null;
  notificationsEnabled: boolean;
  notificationTime: string;

  loadData: () => void;
  setLanguage: (lang: Language) => void;
  setThemePreference: (theme: 'light' | 'dark' | 'system') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationTime: (time: string) => void;
  setCurrency: (currency: string) => void;
  setPremium: (isPremium: boolean) => void;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  checkAndShowAd: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
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
  isLoaded: false,
  isPremiumUser: false,
  analyticsReport: null,
  notificationsEnabled: false,
  notificationTime: '20:00',

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
    let notifEnabledSetting;
    let notifTimeSetting;
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
      notifEnabledSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'notificationsEnabled'",
      );
      notifTimeSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'notificationTime'",
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

    set({
      accounts,
      transactions,
      categories,
      language: finalLanguage,
      currency: currencySetting?.val || 'COP',
      currencySymbol: CURRENCY_SYMBOLS[currencySetting?.val || 'COP'] || '$',
      themePreference:
        (themeSetting?.val as 'light' | 'dark' | 'system') || 'system',
      isPremiumUser: premiumSetting?.val === 'true',
      notificationsEnabled: notifEnabledSetting?.val === 'true',
      notificationTime: notifTimeSetting?.val || '20:00',
      isLoaded: true,
    });

    // Defer loading of non-critical data
    setTimeout(() => {
      get().loadBudgets();
      get().loadGoals();
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

  formatCurrency: (amount, currencyCode) => {
    const { language, currency: defaultCurrency } = get();
    return formatCurrencyUtil(
      amount,
      currencyCode || defaultCurrency,
      language,
    );
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
        const { language } = get();
        const report = await AnalyticsManager.generateFullReport(language);
        set({ analyticsReport: report });
        analyticsDebounceTimer = null;
      } catch (error) {
        console.error('refreshAnalytics Error:', error);
        analyticsDebounceTimer = null;
      }
    }, 300);
  },
});
