import { createStore } from 'zustand';
import * as Localization from 'expo-localization';
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
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

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
      getFirstSync: jest.fn((query: string) => {
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

    it('infers spanish language when language setting is missing and device locale is spanish', () => {
      settingsMap.delete('language');
      const getLocalesSpy = jest
        .spyOn(Localization, 'getLocales')
        .mockReturnValue([{ languageCode: 'es', languageTag: 'es-CO' }] as any);

      store.getState().loadData();

      expect(store.getState().language).toBe('es');
      getLocalesSpy.mockRestore();
    });

    it('falls back to en and warns when Localization module fails', () => {
      settingsMap.delete('language');
      const getLocalesSpy = jest
        .spyOn(Localization, 'getLocales')
        .mockImplementation(() => {
          throw new Error('Native module missing');
        });

      store.getState().loadData();

      expect(store.getState().language).toBe('en');
      expect(console.warn).toHaveBeenCalledWith(
        'Localization native module not found, defaulting to en',
      );
      getLocalesSpy.mockRestore();
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

    it('handles setLanguage DB error gracefully', (done) => {
      mockDb.runSync.mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      store.getState().setLanguage('es');

      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith(
          'setLanguage DB Error:',
          expect.any(Error),
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

    it('handles setThemePreference DB error gracefully', () => {
      mockDb.runSync.mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      store.getState().setThemePreference('light');

      expect(console.error).toHaveBeenCalledWith(
        'setThemePreference DB Error:',
        expect.any(Error),
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

    it('handles setCycleStartDay DB error gracefully', (done) => {
      mockDb.runSync.mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      store.getState().setCycleStartDay(10);

      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith(
          'setCycleStartDay DB Error:',
          expect.any(Error),
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

    it('handles setNotificationsEnabled DB error gracefully', () => {
      mockDb.runSync.mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      store.getState().setNotificationsEnabled(false);

      expect(console.error).toHaveBeenCalledWith(
        'setNotificationsEnabled DB Error:',
        expect.any(Error),
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

    it('handles setNotificationTime DB error gracefully', () => {
      mockDb.runSync.mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      store.getState().setNotificationTime('08:00');

      expect(console.error).toHaveBeenCalledWith(
        'setNotificationTime DB Error:',
        expect.any(Error),
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

    it('handles setCurrency DB error gracefully', (done) => {
      mockDb.runSync.mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      store.getState().setCurrency('EUR');

      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith(
          'setCurrency DB Error:',
          expect.any(Error),
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

    it('handles setPremium DB error gracefully', () => {
      mockDb.runSync.mockImplementationOnce(() => {
        throw new Error('Write error');
      });

      store.getState().setPremium(false);

      expect(console.error).toHaveBeenCalledWith(
        'setPremium DB Error:',
        expect.any(Error),
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

    it('throws and logs error on DB failure', () => {
      mockDb.runSync.mockImplementationOnce(() => {
        throw new Error('DB Error');
      });

      expect(() => {
        store.getState().completeOnboarding('es', 'COP');
      }).toThrow('DB Error');
      expect(console.error).toHaveBeenCalledWith(
        'completeOnboarding DB Error:',
        expect.any(Error),
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

    it('throws and logs error on DB failure', () => {
      mockDb.execSync.mockImplementationOnce(() => {
        throw new Error('Delete failure');
      });

      expect(() => {
        store.getState().resetData();
      }).toThrow('Delete failure');
      expect(console.error).toHaveBeenCalledWith(
        'resetData DB Error:',
        expect.any(Error),
      );
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

    it('handles refreshAnalytics error gracefully', async () => {
      (AnalyticsManager.generateFullReport as jest.Mock).mockRejectedValueOnce(
        new Error('Analytics failure'),
      );

      store.getState().refreshAnalytics();

      await jest.advanceTimersByTimeAsync(500);

      expect(console.error).toHaveBeenCalledWith(
        'refreshAnalytics Error:',
        expect.any(Error),
      );
    });
  });
});
