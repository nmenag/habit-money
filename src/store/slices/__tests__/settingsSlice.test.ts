import { createStore } from 'zustand';
import { createSettingsSlice, SettingsSlice } from '../settingsSlice';
import { getDb, initDb } from '../../../db/schema';
import { AppLockService } from '../../../services/AppLockService';
import { interstitialManager } from '../../../ads/InterstitialManager';
import { triggerWidgetUpdate } from '../../../utils/widgetUpdater';
import { AnalyticsManager } from '../../../features/insights/services/AnalyticsManager';

jest.mock('../../useFilterStore', () => ({
  useFilterStore: {
    getState: jest.fn(() => ({
      selectedRange: {
        type: 'month',
        startDate: new Date(),
        endDate: new Date(),
      },
      isDefaultFilter: true,
      setDefaultFilter: jest.fn(),
      updateCycleStartDay: jest.fn(),
    })),
  },
}));

jest.mock('../../../db/schema', () => ({
  getDb: jest.fn(),
  initDb: jest.fn(),
}));

jest.mock('../../../services/AppLockService', () => ({
  AppLockService: {
    setAppLockEnabled: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../ads/InterstitialManager', () => ({
  interstitialManager: {
    show: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../utils/widgetUpdater', () => ({
  triggerWidgetUpdate: jest.fn(),
}));

jest.mock('../../../features/insights/services/AnalyticsManager', () => ({
  AnalyticsManager: {
    generateFullReport: jest.fn().mockResolvedValue({
      currentMonth: { income: 0, expenses: 0 },
      insights: [],
    }),
  },
}));

describe('settingsSlice', () => {
  let mockDb: any;
  let store: any;
  let mockLoadBudgets: jest.Mock;

  let settingsMap: Map<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadBudgets = jest.fn();
    settingsMap = new Map<string, string>();
    settingsMap.set('currency', 'USD');
    settingsMap.set('language', 'en');
    settingsMap.set('premium', 'true');
    settingsMap.set('themePreference', 'dark');
    settingsMap.set('cycleStartDay', '15');
    settingsMap.set('notificationsEnabled', 'true');
    settingsMap.set('notificationTime', '21:00');
    settingsMap.set('isFirstLaunch', 'false');

    mockDb = {
      getAllSync: jest.fn(() => []),
      getFirstSync: jest.fn((query: string, params?: any[]) => {
        if (query.includes('COUNT(*)')) return { count: 10 };
        for (const [key, val] of settingsMap.entries()) {
          if (query.includes(`'${key}'`)) {
            return { val };
          }
        }
        return null;
      }),
      runSync: jest.fn((query: string, params?: any[]) => {
        if (query.includes('INSERT OR REPLACE INTO settings') && params) {
          settingsMap.set(params[0], params[1]);
        }
      }),
      execSync: jest.fn(),
    };
    (getDb as jest.Mock).mockReturnValue(mockDb);

    store = createStore<SettingsSlice>()((set, get, api) => ({
      transactions: [] as any[],
      accounts: [] as any[],
      categories: [] as any[],
      budgets: [] as any[],
      loadBudgets: mockLoadBudgets,
      ...createSettingsSlice(set as any, get as any, api as any),
    }));
  });

  describe('loadData', () => {
    it('loads settings and transactional data from SQLite database', () => {
      store.getState().loadData();

      const state = store.getState();
      expect(state.isLoaded).toBe(true);
      expect(state.currency).toBe('USD');
      expect(state.currencySymbol).toBe('$');
      expect(state.language).toBe('en');
      expect(state.themePreference).toBe('dark');
      expect(state.cycleStartDay).toBe(15);
      expect(state.isPremiumUser).toBe(true);
      expect(state.notificationsEnabled).toBe(true);
      expect(state.notificationTime).toBe('21:00');
      expect(state.isFirstLaunch).toBe(false);
    });

    it('handles database read exceptions and uses defaults', () => {
      mockDb.getFirstSync.mockImplementation(() => {
        throw new Error('Corrupt DB');
      });

      store.getState().loadData();

      const state = store.getState();
      expect(state.isLoaded).toBe(true);
      expect(state.currency).toBe('COP');
      expect(state.currencySymbol).toBe('$');
      expect(state.cycleStartDay).toBe(1);
    });
  });

  describe('setters', () => {
    it('setLanguage updates state and persists to database', (done) => {
      store.getState().setLanguage('es');
      expect(store.getState().language).toBe('es');

      setTimeout(() => {
        expect(mockDb.runSync).toHaveBeenCalledWith(
          expect.stringContaining('settings'),
          ['language', 'es'],
        );
        done();
      }, 50);
    });

    it('setThemePreference updates state and persists to database', () => {
      store.getState().setThemePreference('light');
      expect(store.getState().themePreference).toBe('light');
      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining('settings'),
        ['themePreference', 'light'],
      );
    });

    it('setCycleStartDay clamps between 1 and 31 and persists', (done) => {
      store.getState().setCycleStartDay(35);
      expect(store.getState().cycleStartDay).toBe(31);

      setTimeout(() => {
        expect(mockDb.runSync).toHaveBeenCalledWith(
          expect.stringContaining('settings'),
          ['cycleStartDay', '31'],
        );
        done();
      }, 50);
    });

    it('setNotificationsEnabled updates state and database', () => {
      store.getState().setNotificationsEnabled(false);
      expect(store.getState().notificationsEnabled).toBe(false);
      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining('settings'),
        ['notificationsEnabled', 'false'],
      );
    });

    it('setNotificationTime updates state and database', () => {
      store.getState().setNotificationTime('08:00');
      expect(store.getState().notificationTime).toBe('08:00');
      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining('settings'),
        ['notificationTime', '08:00'],
      );
    });

    it('setCurrency updates state, symbol, and updates accounts currency in DB', (done) => {
      store.getState().setCurrency('EUR');
      expect(store.getState().currency).toBe('EUR');
      expect(store.getState().currencySymbol).toBe('€');

      setTimeout(() => {
        expect(mockDb.runSync).toHaveBeenCalledWith(
          'UPDATE accounts SET currency = ?',
          ['EUR'],
        );
        done();
      }, 50);
    });

    it('setPremium updates state and persists', () => {
      store.getState().setPremium(false);
      expect(store.getState().isPremiumUser).toBe(false);
      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining('settings'),
        ['premium', 'false'],
      );
    });

    it('setAppLockEnabled delegates to AppLockService', async () => {
      await store.getState().setAppLockEnabled(true);
      expect(AppLockService.setAppLockEnabled).toHaveBeenCalledWith(true);
      expect(store.getState().appLockEnabled).toBe(true);
    });
  });

  describe('completeOnboarding', () => {
    it('sets first launch to false, configures currency and language', () => {
      store.getState().completeOnboarding('es', 'COP');

      expect(store.getState().isFirstLaunch).toBe(false);
      expect(store.getState().language).toBe('es');
      expect(store.getState().currency).toBe('COP');
      expect(mockDb.runSync).toHaveBeenCalledWith(
        'UPDATE accounts SET currency = ?',
        ['COP'],
      );
    });
  });

  describe('formatCurrency helper', () => {
    it('formats amount using store settings and currency overrides', () => {
      store.setState({ currency: 'COP', language: 'en' });
      expect(store.getState().formatCurrency(1000)).toBe('$ 1,000');
      expect(store.getState().formatCurrency(50, 'USD')).toBe('$ 50.00');
    });
  });

  describe('checkAndShowAd', () => {
    it('does nothing if user is premium', async () => {
      store.setState({ isPremiumUser: true });
      await store.getState().checkAndShowAd();
      expect(interstitialManager.show).not.toHaveBeenCalled();
    });

    it('shows interstitial ad if user is not premium', async () => {
      store.setState({ isPremiumUser: false });
      await store.getState().checkAndShowAd();
      expect(interstitialManager.show).toHaveBeenCalled();
    });
  });

  describe('resetData', () => {
    it('executes delete queries and calls initDb', (done) => {
      store.getState().resetData();

      expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM transactions;');
      expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM budgets;');
      expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM accounts;');
      expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM categories;');
      expect(initDb).toHaveBeenCalled();

      setTimeout(() => {
        done();
      }, 50);
    });
  });

  describe('refreshAnalytics', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('debounces and generates reports, updating state and widget', async () => {
      store.getState().refreshAnalytics();

      await jest.advanceTimersByTimeAsync(500);

      expect(AnalyticsManager.generateFullReport).toHaveBeenCalled();
      expect(triggerWidgetUpdate).toHaveBeenCalled();
    });
  });
});
