import { Linking } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { ReviewManager } from '../ReviewManager';
import { getDb } from '../../db/schema';

jest.mock('../../db/schema', () => ({
  getDb: jest.fn(),
}));

describe('ReviewManager', () => {
  let settingsStore: Map<string, string>;

  const mockDb = {
    getFirstSync: jest.fn((query: string, params?: any[]) => {
      const key = params?.[0];
      if (settingsStore.has(key)) {
        return { val: settingsStore.get(key) };
      }
      return null;
    }),
    runSync: jest.fn((query: string, params?: any[]) => {
      if (params && params.length >= 2) {
        settingsStore.set(params[0], params[1]);
      }
    }),
  };

  beforeEach(() => {
    settingsStore = new Map<string, string>();
    mockDb.getFirstSync.mockReset();
    mockDb.runSync.mockReset();
    mockDb.getFirstSync.mockImplementation((query: string, params?: any[]) => {
      const key = params?.[0];
      if (settingsStore.has(key)) {
        return { val: settingsStore.get(key) };
      }
      return null;
    });
    mockDb.runSync.mockImplementation((query: string, params?: any[]) => {
      if (params && params.length >= 2) {
        settingsStore.set(params[0], params[1]);
      }
    });
    (getDb as jest.Mock).mockReturnValue(mockDb);
    ReviewManager.setOnPrePromptListener(null);
  });

  afterEach(() => {
    ReviewManager.setOnPrePromptListener(null);
  });

  describe('recordAppOpen', () => {
    it('initializes firstLaunchDate on first launch and increments count', async () => {
      await ReviewManager.recordAppOpen();
      expect(settingsStore.get('review_firstLaunchDate')).toBeDefined();
      expect(settingsStore.get('review_appOpenCount')).toBe('1');

      await ReviewManager.recordAppOpen();
      expect(settingsStore.get('review_appOpenCount')).toBe('2');
    });

    it('handles database write errors gracefully', async () => {
      mockDb.runSync.mockImplementationOnce(() => {
        throw new Error('DB Write Error');
      });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      await ReviewManager.recordAppOpen();
      expect(warnSpy).toHaveBeenCalledWith(
        'ReviewManager: failed to write setting',
        expect.any(String),
        expect.any(Error),
      );
      warnSpy.mockRestore();
    });
  });

  describe('getReviewStats', () => {
    it('returns parsed stats from DB', async () => {
      settingsStore.set('review_firstLaunchDate', '2026-01-01T00:00:00.000Z');
      settingsStore.set('review_appOpenCount', '5');
      settingsStore.set('review_lastPromptDate', '2026-02-01T00:00:00.000Z');
      settingsStore.set('review_promptCount', '2');
      settingsStore.set('review_hasCompletedReview', 'true');

      const stats = await ReviewManager.getReviewStats();
      expect(stats.firstLaunchDate).toBe('2026-01-01T00:00:00.000Z');
      expect(stats.appOpenCount).toBe(5);
      expect(stats.lastPromptDate).toBe('2026-02-01T00:00:00.000Z');
      expect(stats.promptCount).toBe(2);
      expect(stats.hasCompletedReview).toBe(true);
    });

    it('returns default fallback stats when DB read fails', async () => {
      mockDb.getFirstSync.mockImplementationOnce(() => {
        throw new Error('DB Error');
      });
      const stats = await ReviewManager.getReviewStats();
      expect(stats.appOpenCount).toBe(0);
      expect(stats.hasCompletedReview).toBe(false);
    });
  });

  describe('canShowAutoPrompt', () => {
    it('returns false if user already completed review', async () => {
      settingsStore.set('review_hasCompletedReview', 'true');
      settingsStore.set('review_appOpenCount', '10');
      expect(await ReviewManager.canShowAutoPrompt()).toBe(false);
    });

    it('returns false if app opens are less than MIN_APP_OPENS (3)', async () => {
      settingsStore.set('review_appOpenCount', '2');
      expect(await ReviewManager.canShowAutoPrompt()).toBe(false);
    });

    it('returns false if promptCount reached MAX_PROMPTS_LIFETIME (3)', async () => {
      settingsStore.set('review_appOpenCount', '10');
      settingsStore.set('review_promptCount', '3');
      expect(await ReviewManager.canShowAutoPrompt()).toBe(false);
    });

    it('returns false if within COOLDOWN_DAYS (60 days)', async () => {
      settingsStore.set('review_appOpenCount', '10');
      settingsStore.set('review_promptCount', '1');
      // Prompted 10 days ago
      const recentDate = new Date(
        Date.now() - 10 * 24 * 60 * 60 * 1000,
      ).toISOString();
      settingsStore.set('review_lastPromptDate', recentDate);

      expect(await ReviewManager.canShowAutoPrompt()).toBe(false);
    });

    it('returns true when all conditions are met', async () => {
      settingsStore.set('review_appOpenCount', '5');
      settingsStore.set('review_promptCount', '1');
      // Prompted 70 days ago
      const oldDate = new Date(
        Date.now() - 70 * 24 * 60 * 60 * 1000,
      ).toISOString();
      settingsStore.set('review_lastPromptDate', oldDate);

      expect(await ReviewManager.canShowAutoPrompt()).toBe(true);
    });

    it('returns false and logs warning if an unexpected error occurs', async () => {
      mockDb.getFirstSync.mockImplementation(() => {
        throw new Error('Fatal');
      });
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      expect(await ReviewManager.canShowAutoPrompt()).toBe(false);
      warnSpy.mockRestore();
    });
  });

  describe('trigger gates', () => {
    beforeEach(() => {
      settingsStore.set('review_appOpenCount', '5');
      settingsStore.set('review_promptCount', '0');
    });

    it('onGoalCompleted notifies listener when eligible', async () => {
      const listener = jest.fn();
      ReviewManager.setOnPrePromptListener(listener);

      const triggered = await ReviewManager.onGoalCompleted();
      expect(triggered).toBe(true);
      expect(listener).toHaveBeenCalledWith(true);
    });

    it('onGoalCompleted returns false if no listener is registered', async () => {
      ReviewManager.setOnPrePromptListener(null);
      const triggered = await ReviewManager.onGoalCompleted();
      expect(triggered).toBe(false);
    });

    it('onBudgetMonthSuccess triggers pre-prompt gate', async () => {
      const listener = jest.fn();
      ReviewManager.setOnPrePromptListener(listener);

      const triggered = await ReviewManager.onBudgetMonthSuccess();
      expect(triggered).toBe(true);
      expect(listener).toHaveBeenCalledWith(true);
    });

    it('onStreakReached requires streakCount >= 7', async () => {
      const listener = jest.fn();
      ReviewManager.setOnPrePromptListener(listener);

      expect(await ReviewManager.onStreakReached(5)).toBe(false);
      expect(await ReviewManager.onStreakReached(7)).toBe(true);
      expect(listener).toHaveBeenCalledWith(true);
    });
  });

  describe('handleUserFeedback and handleUserDismiss', () => {
    it('handles positive feedback (enjoying: true) by requesting store review', async () => {
      const listener = jest.fn();
      ReviewManager.setOnPrePromptListener(listener);

      await ReviewManager.handleUserFeedback(true);

      expect(listener).toHaveBeenCalledWith(false);
      expect(settingsStore.get('review_hasCompletedReview')).toBe('true');
      expect(settingsStore.get('review_promptCount')).toBe('1');
    });

    it('handles negative feedback (enjoying: false) by opening email link', async () => {
      const listener = jest.fn();
      ReviewManager.setOnPrePromptListener(listener);
      const openSpy = jest
        .spyOn(Linking, 'openURL')
        .mockResolvedValue(undefined as any);

      await ReviewManager.handleUserFeedback(false);

      expect(listener).toHaveBeenCalledWith(false);
      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('mailto:nmena.garzon@gmail.com'),
      );
      openSpy.mockRestore();
    });

    it('handles user dismiss', async () => {
      const listener = jest.fn();
      ReviewManager.setOnPrePromptListener(listener);

      await ReviewManager.handleUserDismiss();
      expect(listener).toHaveBeenCalledWith(false);
    });

    it('allows manual review request', async () => {
      await ReviewManager.requestReviewManually();
      expect(settingsStore.get('review_hasCompletedReview')).toBe('true');
    });

    it('can be instantiated as a class', () => {
      expect(new ReviewManager()).toBeInstanceOf(ReviewManager);
    });

    it('handles StoreReview failure and falls back to opening store URL on iOS and Android', async () => {
      (StoreReview.hasAction as jest.Mock).mockRejectedValueOnce(
        new Error('Native error'),
      );
      const openSpy = jest
        .spyOn(Linking, 'openURL')
        .mockRejectedValueOnce(new Error('Market app not found'))
        .mockResolvedValueOnce(undefined as any);

      await ReviewManager.requestReviewManually();
      expect(openSpy).toHaveBeenCalled();
      openSpy.mockRestore();
    });
  });
});
