import {
  InterstitialManager,
  interstitialManager,
} from '../InterstitialManager';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import * as schema from '../../db/schema';

describe('InterstitialManager', () => {
  let listeners: Record<string, () => void> = {};
  let mockAdInstance: any;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    listeners = {};

    mockAdInstance = {
      load: jest.fn(),
      show: jest.fn().mockResolvedValue(undefined),
      addAdEventListener: jest.fn((event: string, handler: () => void) => {
        listeners[event] = handler;
        return () => {};
      }),
      removeAllListeners: jest.fn(),
    };

    (InterstitialAd.createForAdRequest as jest.Mock).mockReturnValue(
      mockAdInstance,
    );

    mockDb = {
      getFirstSync: jest.fn(),
      runSync: jest.fn(),
    };

    jest.spyOn(schema, 'getDb').mockReturnValue(mockDb as any);
  });

  it('exports a default singleton instance', () => {
    expect(interstitialManager).toBeInstanceOf(InterstitialManager);
  });

  it('initializes and registers event listeners', () => {
    const manager = new InterstitialManager();
    manager.init();

    expect(InterstitialAd.createForAdRequest).toHaveBeenCalled();
    expect(mockAdInstance.addAdEventListener).toHaveBeenCalledWith(
      AdEventType.LOADED,
      expect.any(Function),
    );
    expect(mockAdInstance.addAdEventListener).toHaveBeenCalledWith(
      AdEventType.CLOSED,
      expect.any(Function),
    );
    expect(mockAdInstance.addAdEventListener).toHaveBeenCalledWith(
      AdEventType.ERROR,
      expect.any(Function),
    );
    expect(mockAdInstance.load).toHaveBeenCalledTimes(1);

    // Re-init clears listeners
    manager.init();
    expect(mockAdInstance.removeAllListeners).toHaveBeenCalled();
  });

  it('handles LOADED, CLOSED, and ERROR events', () => {
    jest.useFakeTimers();
    const manager = new InterstitialManager();
    manager.init();

    listeners[AdEventType.LOADED]?.();

    listeners[AdEventType.CLOSED]?.();
    expect(mockAdInstance.load).toHaveBeenCalledTimes(2);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    listeners[AdEventType.ERROR]?.();
    warnSpy.mockRestore();

    jest.advanceTimersByTime(30000);
    expect(mockAdInstance.load).toHaveBeenCalledTimes(3);

    jest.useRealTimers();
  });

  it('handles initialization exceptions gracefully', () => {
    (InterstitialAd.createForAdRequest as jest.Mock).mockImplementationOnce(
      () => {
        throw new Error('Native ad request failure');
      },
    );

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const manager = new InterstitialManager();
    expect(() => manager.init()).not.toThrow();
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to initialize InterstitialAd:',
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });

  describe('show()', () => {
    it('does nothing if database is unavailable', async () => {
      jest.spyOn(schema, 'getDb').mockReturnValue(null as any);
      const manager = new InterstitialManager();
      manager.init();

      await manager.show();
      expect(mockAdInstance.show).not.toHaveBeenCalled();
    });

    it('loads ad instead of showing if ad is not loaded', async () => {
      mockDb.getFirstSync.mockReturnValue(null);
      const manager = new InterstitialManager();
      manager.init();

      await manager.show();
      expect(mockAdInstance.show).not.toHaveBeenCalled();
      expect(mockAdInstance.load).toHaveBeenCalled();
    });

    it('shows ad and updates DB stats when eligible and loaded', async () => {
      mockDb.getFirstSync.mockReturnValue(null);
      const manager = new InterstitialManager();
      manager.init();
      listeners[AdEventType.LOADED]?.();

      await manager.show();

      expect(mockAdInstance.show).toHaveBeenCalledTimes(1);
      expect(mockDb.runSync).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)',
        ['last_interstitial_time', expect.any(String)],
      );
      expect(mockDb.runSync).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)',
        ['last_interstitial_date', expect.any(String)],
      );
      expect(mockDb.runSync).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)',
        ['daily_interstitial_count', '1'],
      );
    });

    it('enforces in-memory cooldown between consecutive calls', async () => {
      mockDb.getFirstSync.mockReturnValue(null);
      const manager = new InterstitialManager();
      manager.init();
      listeners[AdEventType.LOADED]?.();

      await manager.show();
      expect(mockAdInstance.show).toHaveBeenCalledTimes(1);

      // Immediately calling again should be throttled by in-memory lastRequestTime
      await manager.show();
      expect(mockAdInstance.show).toHaveBeenCalledTimes(1);
    });

    it('enforces database cooldown when last ad was shown recently', async () => {
      const now = Date.now();
      mockDb.getFirstSync.mockImplementation(
        (_sql: string, params: string[]) => {
          if (params[0] === 'last_interstitial_time') {
            return { val: (now - 60000).toString() }; // 1 min ago (< 5 min)
          }
          return null;
        },
      );

      const manager = new InterstitialManager();
      manager.init();
      listeners[AdEventType.LOADED]?.();

      await manager.show();
      expect(mockAdInstance.show).not.toHaveBeenCalled();
    });

    it('enforces daily cap of 3 ads per day', async () => {
      const todayDate = new Date().toISOString().split('T')[0];
      mockDb.getFirstSync.mockImplementation(
        (_sql: string, params: string[]) => {
          if (params[0] === 'last_interstitial_time') {
            return { val: (Date.now() - 600000).toString() }; // 10 mins ago (passed cooldown)
          }
          if (params[0] === 'daily_interstitial_count') {
            return { val: '3' }; // Reached max per day
          }
          if (params[0] === 'last_interstitial_date') {
            return { val: todayDate };
          }
          return null;
        },
      );

      const manager = new InterstitialManager();
      manager.init();
      listeners[AdEventType.LOADED]?.();

      await manager.show();
      expect(mockAdInstance.show).not.toHaveBeenCalled();
    });

    it('resets daily count when date has rolled over', async () => {
      const yesterday = '2020-01-01';
      mockDb.getFirstSync.mockImplementation(
        (_sql: string, params: string[]) => {
          if (params[0] === 'last_interstitial_time') {
            return { val: (Date.now() - 600000).toString() };
          }
          if (params[0] === 'daily_interstitial_count') {
            return { val: '3' };
          }
          if (params[0] === 'last_interstitial_date') {
            return { val: yesterday };
          }
          return null;
        },
      );

      const manager = new InterstitialManager();
      manager.init();
      listeners[AdEventType.LOADED]?.();

      await manager.show();
      expect(mockAdInstance.show).toHaveBeenCalledTimes(1);
      expect(mockDb.runSync).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)',
        ['daily_interstitial_count', '1'],
      );
    });

    it('catches and logs errors during show() gracefully', async () => {
      mockDb.getFirstSync.mockImplementation(() => {
        throw new Error('Database locked');
      });

      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const manager = new InterstitialManager();
      manager.init();

      await expect(manager.show()).resolves.not.toThrow();
      expect(errorSpy).toHaveBeenCalledWith(
        'InterstitialManager show() Error:',
        expect.any(Error),
      );
      errorSpy.mockRestore();
    });
  });
});
