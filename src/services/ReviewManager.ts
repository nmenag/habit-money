import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';
import { getDb } from '../db/schema';

export interface ReviewStats {
  firstLaunchDate: string | null;
  appOpenCount: number;
  lastPromptDate: string | null;
  promptCount: number;
  hasCompletedReview: boolean;
}

const REVIEW_KEYS = {
  firstLaunchDate: 'review_firstLaunchDate',
  appOpenCount: 'review_appOpenCount',
  lastPromptDate: 'review_lastPromptDate',
  promptCount: 'review_promptCount',
  hasCompletedReview: 'review_hasCompletedReview',
} as const;

const ANDROID_PACKAGE = 'com.finhabit';
const IOS_APP_ID = '';

const MIN_APP_OPENS = 3;
const COOLDOWN_DAYS = 60;
const MAX_PROMPTS_LIFETIME = 3;

const PLAY_STORE_URL = `market://details?id=${ANDROID_PACKAGE}`;
const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
const APP_STORE_URL = IOS_APP_ID
  ? `itms-apps://itunes.apple.com/app/id${IOS_APP_ID}?action=write-review`
  : 'https://apps.apple.com/us/search?term=habit+money';

type PrePromptListener = (visible: boolean) => void;

function readSetting(key: string): string | null {
  try {
    const db = getDb();
    const row = db.getFirstSync<{ val: string }>(
      'SELECT val FROM settings WHERE id = ?',
      [key],
    );
    return row?.val ?? null;
  } catch {
    return null;
  }
}

function writeSetting(key: string, value: string): void {
  try {
    const db = getDb();
    db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
      key,
      value,
    ]);
  } catch (e) {
    console.warn('ReviewManager: failed to write setting', key, e);
  }
}

function daysBetween(dateStr: string): number {
  const then = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

async function openStoreFallback(): Promise<void> {
  const primaryUrl = Platform.OS === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
  const webUrl =
    Platform.OS === 'android'
      ? PLAY_STORE_WEB_URL
      : 'https://apps.apple.com/us/search?term=habit+money';

  try {
    await Linking.openURL(primaryUrl);
  } catch {
    try {
      await Linking.openURL(webUrl);
    } catch (err) {
      console.warn('ReviewManager: failed to open store fallback URL', err);
    }
  }
}

async function triggerNativeReview(): Promise<void> {
  try {
    const hasAction = await StoreReview.hasAction();
    if (hasAction && !__DEV__) {
      await StoreReview.requestReview();
      return;
    }
  } catch (e) {
    console.warn('ReviewManager: StoreReview.requestReview error', e);
  }
  await openStoreFallback();
}

export class ReviewManager {
  private static prePromptListener: PrePromptListener | null = null;

  static setOnPrePromptListener(listener: PrePromptListener | null): void {
    ReviewManager.prePromptListener = listener;
  }

  static async recordAppOpen(): Promise<void> {
    try {
      const firstLaunch = readSetting(REVIEW_KEYS.firstLaunchDate);
      if (!firstLaunch) {
        writeSetting(REVIEW_KEYS.firstLaunchDate, new Date().toISOString());
      }

      const countStr = readSetting(REVIEW_KEYS.appOpenCount);
      const currentOpens = parseInt(countStr ?? '0', 10);
      writeSetting(REVIEW_KEYS.appOpenCount, String(currentOpens + 1));
    } catch (error) {
      console.warn('ReviewManager: failed to record app open', error);
    }
  }

  static async getReviewStats(): Promise<ReviewStats> {
    try {
      const firstLaunchDate = readSetting(REVIEW_KEYS.firstLaunchDate);
      const appOpenCountStr = readSetting(REVIEW_KEYS.appOpenCount);
      const lastPromptDate = readSetting(REVIEW_KEYS.lastPromptDate);
      const promptCountStr = readSetting(REVIEW_KEYS.promptCount);
      const hasCompletedReviewStr = readSetting(REVIEW_KEYS.hasCompletedReview);

      return {
        firstLaunchDate,
        appOpenCount: parseInt(appOpenCountStr ?? '0', 10),
        lastPromptDate,
        promptCount: parseInt(promptCountStr ?? '0', 10),
        hasCompletedReview: hasCompletedReviewStr === 'true',
      };
    } catch (error) {
      console.warn('ReviewManager: failed to get stats', error);
      return {
        firstLaunchDate: null,
        appOpenCount: 0,
        lastPromptDate: null,
        promptCount: 0,
        hasCompletedReview: false,
      };
    }
  }

  static async canShowAutoPrompt(): Promise<boolean> {
    try {
      const stats = await ReviewManager.getReviewStats();

      if (stats.hasCompletedReview) {
        return false;
      }

      if (stats.appOpenCount < MIN_APP_OPENS) {
        return false;
      }

      if (stats.promptCount >= MAX_PROMPTS_LIFETIME) {
        return false;
      }

      if (stats.lastPromptDate) {
        const elapsedDays = daysBetween(stats.lastPromptDate);
        if (elapsedDays < COOLDOWN_DAYS) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.warn('ReviewManager: canShowAutoPrompt check failed', error);
      return false;
    }
  }

  private static async triggerPrePromptGate(): Promise<boolean> {
    const canPrompt = await ReviewManager.canShowAutoPrompt();
    if (!canPrompt) {
      return false;
    }

    if (ReviewManager.prePromptListener) {
      ReviewManager.prePromptListener(true);
      return true;
    }

    return false;
  }

  static async onGoalCompleted(): Promise<boolean> {
    return ReviewManager.triggerPrePromptGate();
  }

  static async onBudgetMonthSuccess(): Promise<boolean> {
    return ReviewManager.triggerPrePromptGate();
  }

  static async onStreakReached(streakCount: number = 7): Promise<boolean> {
    if (streakCount < 7) {
      return false;
    }
    return ReviewManager.triggerPrePromptGate();
  }

  static async handleUserFeedback(enjoying: boolean): Promise<void> {
    try {
      if (ReviewManager.prePromptListener) {
        ReviewManager.prePromptListener(false);
      }

      const stats = await ReviewManager.getReviewStats();
      const newPromptCount = stats.promptCount + 1;
      const nowIso = new Date().toISOString();

      writeSetting(REVIEW_KEYS.lastPromptDate, nowIso);
      writeSetting(REVIEW_KEYS.promptCount, String(newPromptCount));

      if (enjoying) {
        writeSetting(REVIEW_KEYS.hasCompletedReview, 'true');
        await triggerNativeReview();
      } else {
        const subject = encodeURIComponent('Habit Money Feedback');
        const emailUrl = `mailto:nmena.garzon@gmail.com?subject=${subject}`;
        try {
          await Linking.openURL(emailUrl);
        } catch (err) {
          console.warn('ReviewManager: failed to open feedback email', err);
        }
      }
    } catch (error) {
      console.warn('ReviewManager: error handling user feedback', error);
    }
  }

  static async handleUserDismiss(): Promise<void> {
    try {
      if (ReviewManager.prePromptListener) {
        ReviewManager.prePromptListener(false);
      }
    } catch (error) {
      console.warn('ReviewManager: error handling user dismiss', error);
    }
  }

  static async requestReviewManually(): Promise<void> {
    try {
      const nowIso = new Date().toISOString();
      writeSetting(REVIEW_KEYS.lastPromptDate, nowIso);
      writeSetting(REVIEW_KEYS.hasCompletedReview, 'true');
      await triggerNativeReview();
    } catch (error) {
      console.warn('ReviewManager: requestReviewManually failed', error);
      await openStoreFallback();
    }
  }
}
