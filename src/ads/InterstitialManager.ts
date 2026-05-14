import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS, DEV_AD_UNIT_IDS } from './AdService';
import { getDb } from '../db/schema';

const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes between ads
const MAX_PER_DAY = 3; // Maximum ads per day

class InterstitialManager {
  private interstitial: InterstitialAd | null = null;
  private adUnitId: string;
  private loaded: boolean = false;
  private lastRequestTime: number = 0;

  constructor() {
    this.adUnitId = __DEV__
      ? DEV_AD_UNIT_IDS.INTERSTITIAL
      : AD_UNIT_IDS.INTERSTITIAL;
  }

  /**
   * Initializes the ad service and starts preloading the first ad.
   */
  public init() {
    if (this.interstitial) return;

    try {
      this.interstitial = InterstitialAd.createForAdRequest(this.adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      });

      this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
        this.loaded = true;
      });

      this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        this.loaded = false;
        this.load(); // Preload next ad immediately
      });

      this.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        if (__DEV__) console.warn('Interstitial Ad Error: ', error);
        this.loaded = false;
        // Retry loading after a delay if it fails
        setTimeout(() => this.load(), 30000);
      });

      this.load();
    } catch (error) {
      console.error('Failed to initialize InterstitialAd:', error);
    }
  }

  /**
   * Preloads an ad in the background.
   */
  public load() {
    if (this.interstitial && !this.loaded) {
      this.interstitial.load();
    }
  }

  /**
   * Shows an interstitial ad if it meets all frequency and placement rules.
   * This method is non-blocking and handles its own errors.
   */
  public async show() {
    try {
      const db = getDb();
      if (!db) return;

      const now = Date.now();

      // 1. Minimum cooldown check (in-memory fast check)
      if (now - this.lastRequestTime < COOLDOWN_MS) return;

      // 2. Load persisted stats from DB
      const stats = this.getStats(db);
      const todayDate = new Date().toISOString().split('T')[0];

      let dailyCount = stats.dailyCount;
      if (stats.lastDate !== todayDate) {
        dailyCount = 0; // Reset for a new day
      }

      // 3. Frequency & Cooldown checks (persisted)
      if (now - stats.lastTime < COOLDOWN_MS) return;
      if (dailyCount >= MAX_PER_DAY) return;

      // 4. Show the ad if loaded
      if (this.loaded && this.interstitial) {
        this.lastRequestTime = now;
        await this.interstitial.show();

        // Update persisted stats
        this.updateStats(db, now, todayDate, dailyCount + 1);
      } else {
        this.load(); // Try to load for next time
      }
    } catch (error) {
      console.error('InterstitialManager show() Error:', error);
    }
  }

  private getStats(db: any) {
    const lastTimeStr = db.getFirstSync<{ val: string }>(
      'SELECT val FROM settings WHERE id = ?',
      ['last_interstitial_time'],
    )?.val;
    const dailyCountStr = db.getFirstSync<{ val: string }>(
      'SELECT val FROM settings WHERE id = ?',
      ['daily_interstitial_count'],
    )?.val;
    const lastDateStr = db.getFirstSync<{ val: string }>(
      'SELECT val FROM settings WHERE id = ?',
      ['last_interstitial_date'],
    )?.val;

    return {
      lastTime: lastTimeStr ? parseInt(lastTimeStr, 10) : 0,
      dailyCount: dailyCountStr ? parseInt(dailyCountStr, 10) : 0,
      lastDate: lastDateStr || '',
    };
  }

  private updateStats(db: any, time: number, date: string, count: number) {
    db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
      'last_interstitial_time',
      time.toString(),
    ]);
    db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
      'last_interstitial_date',
      date,
    ]);
    db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
      'daily_interstitial_count',
      count.toString(),
    ]);
  }
}

export const interstitialManager = new InterstitialManager();
