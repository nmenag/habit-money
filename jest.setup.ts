/* eslint-env jest */

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US' }],
}));

jest.mock(
  'expo-asset',
  () => ({
    Asset: { fromModule: jest.fn() },
  }),
  { virtual: true },
);

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getAllSync: jest.fn(() => []),
    getFirstSync: jest.fn(() => null),
    prepareSync: jest.fn(() => ({
      executeSync: jest.fn(),
      finalizeSync: jest.fn(),
    })),
    withTransactionSync: jest.fn((cb) => cb()),
    getAllAsync: jest.fn(async () => []),
    getFirstAsync: jest.fn(async () => null),
  })),
}));

jest.mock('react-native-google-mobile-ads', () => ({
  AdEventType: {
    LOADED: 'loaded',
    ERROR: 'error',
    CLOSED: 'closed',
    OPENED: 'opened',
    CLICKED: 'clicked',
  },
  InterstitialAd: {
    createForAdRequest: jest.fn(() => ({
      load: jest.fn(),
      show: jest.fn(),
      addAdEventListener: jest.fn(() => () => {}),
    })),
  },
  BannerAd: () => null,
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'BANNER' },
  TestIds: { BANNER: 'test-banner', INTERSTITIAL: 'test-interstitial' },
}));

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///data/user/0/com.finhabit/files/',
  EncodingType: { UTF8: 'utf8' },
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue(''),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest
    .fn()
    .mockResolvedValue({ canceled: true, assets: null }),
}));

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn((key: string) =>
      Promise.resolve(store.get(key) || null),
    ),
    setItemAsync: jest.fn((key: string, val: string) => {
      store.set(key, val);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    __store: store,
  };
});

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('expo-store-review', () => ({
  hasAction: jest.fn().mockResolvedValue(true),
  requestReview: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn().mockResolvedValue(undefined),
  setAnalyticsCollectionEnabled: jest.fn().mockResolvedValue(undefined),
  setUserProperty: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-firebase/crashlytics', () => ({
  getCrashlytics: jest.fn(() => ({})),
  setCrashlyticsCollectionEnabled: jest.fn().mockResolvedValue(undefined),
  log: jest.fn(),
  recordError: jest.fn(),
  setAttributes: jest.fn(),
  setAttribute: jest.fn(),
}));

jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock('expo-application', () => ({
  applicationId: 'com.finhabit',
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationPriority: { HIGH: 'high' },
  getPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted', granted: true }),
  requestPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted', granted: true }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id-1'),
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
}));
