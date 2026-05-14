import { Platform } from 'react-native';
import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { getDb } from '../db/schema';

export const AD_UNIT_IDS = {
  BANNER: Platform.select({
    ios: 'ca-app-pub-xxxxxxxx/banner-ios',
    android: 'ca-app-pub-8163282310843834/2047068664',
    default: TestIds.BANNER,
  }),
  INTERSTITIAL: Platform.select({
    ios: 'ca-app-pub-xxxxxxxx/interstitial-ios',
    android: 'ca-app-pub-8163282310843834/5794741989',
    default: TestIds.INTERSTITIAL,
  }),
};

export const DEV_AD_UNIT_IDS = {
  BANNER: TestIds.BANNER,
  INTERSTITIAL: TestIds.INTERSTITIAL,
};

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const MAX_PER_DAY = 3;

let interstitial: InterstitialAd | null = null;
let isLoaded = false;

const createInterstitial = () => {
  const adUnitId = __DEV__
    ? DEV_AD_UNIT_IDS.INTERSTITIAL
    : AD_UNIT_IDS.INTERSTITIAL;
  if (!adUnitId) return;

  interstitial = InterstitialAd.createForAdRequest(adUnitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    isLoaded = true;
  });

  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    isLoaded = false;
    interstitial?.load(); // Preload next one
  });

  interstitial.load();
};

export const AdService = {
  init: () => {
    if (!interstitial) {
      createInterstitial();
    }
  },

  getBannerId: () => (__DEV__ ? DEV_AD_UNIT_IDS.BANNER : AD_UNIT_IDS.BANNER),

  showInterstitial: async () => {
    try {
      const db = getDb();
      if (!db) return;

      // Check frequency limits
      const now = Date.now();
      const lastAdTimeStr = db.getFirstSync<{ val: string }>(
        'SELECT val FROM settings WHERE id = ?',
        ['last_interstitial_time'],
      )?.val;
      const dailyCountStr = db.getFirstSync<{ val: string }>(
        'SELECT val FROM settings WHERE id = ?',
        ['daily_interstitial_count'],
      )?.val;
      const lastAdDateStr = db.getFirstSync<{ val: string }>(
        'SELECT val FROM settings WHERE id = ?',
        ['last_interstitial_date'],
      )?.val;

      const lastAdTime = lastAdTimeStr ? parseInt(lastAdTimeStr, 10) : 0;
      const lastAdDate = lastAdDateStr || '';
      const todayDate = new Date().toISOString().split('T')[0];
      let dailyCount = dailyCountStr ? parseInt(dailyCountStr, 10) : 0;

      // Reset count if it's a new day
      if (lastAdDate !== todayDate) {
        dailyCount = 0;
      }

      // Frequency Checks
      if (now - lastAdTime < COOLDOWN_MS) return;
      if (dailyCount >= MAX_PER_DAY) return;

      // Show Ad
      if (interstitial && isLoaded) {
        interstitial.show();

        // Update persisted stats
        db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
          'last_interstitial_time',
          now.toString(),
        ]);
        db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
          'last_interstitial_date',
          todayDate,
        ]);
        db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
          'daily_interstitial_count',
          (dailyCount + 1).toString(),
        ]);
      } else {
        // If not loaded, try to load it for next time
        interstitial?.load();
      }
    } catch (error) {
      console.error('AdService Error:', error);
    }
  },
};
