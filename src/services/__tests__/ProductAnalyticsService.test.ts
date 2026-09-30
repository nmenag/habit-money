import * as analytics from '@react-native-firebase/analytics';
import * as crashlytics from '@react-native-firebase/crashlytics';
import * as app from '@react-native-firebase/app';
import { ProductAnalyticsService } from '../ProductAnalyticsService';

describe('ProductAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset private isInitialized
    (ProductAnalyticsService as any).isInitialized = false;
  });

  it('reports isSdkInitialized status correctly', () => {
    expect(ProductAnalyticsService.isSdkInitialized()).toBe(false);

    (ProductAnalyticsService as any).isInitialized = true;
    expect(ProductAnalyticsService.isSdkInitialized()).toBe(true);

    (app.getApp as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Firebase app not ready');
    });
    expect(ProductAnalyticsService.isSdkInitialized()).toBe(false);
  });

  describe('init', () => {
    it('initializes Firebase analytics and crashlytics in development/test mode', async () => {
      await ProductAnalyticsService.init();

      expect(analytics.setAnalyticsCollectionEnabled).toHaveBeenCalled();
      expect(crashlytics.setCrashlyticsCollectionEnabled).toHaveBeenCalled();
      expect(analytics.setUserProperty).toHaveBeenCalledWith(
        expect.anything(),
        'app_variant',
        expect.any(String),
      );
      expect((ProductAnalyticsService as any).isInitialized).toBe(true);

      // Subsequent call does nothing (early return)
      await ProductAnalyticsService.init();
      expect(analytics.setAnalyticsCollectionEnabled).toHaveBeenCalledTimes(1);
    });

    it('handles initialization errors gracefully', async () => {
      (
        analytics.setAnalyticsCollectionEnabled as jest.Mock
      ).mockRejectedValueOnce(new Error('Firebase init error'));
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await ProductAnalyticsService.init();

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Initialization warning'),
        expect.any(Error),
      );
      warnSpy.mockRestore();
    });
  });

  describe('privacy filter and sanitizeParams', () => {
    it('filters out sensitive financial and PII parameter keys', async () => {
      await ProductAnalyticsService.logEvent('user_action', {
        safe_param: 'valid',
        amount: 500,
        balance: 1000,
        note: 'secret',
        categoryName: 'Food',
        accountName: 'Bank',
        title: 'Transaction',
        value: 123,
      });

      expect(analytics.logEvent).toHaveBeenCalledWith(
        expect.anything(),
        'user_action',
        {
          safe_param: 'valid',
        },
      );
    });

    it('logs event without params when params are undefined', async () => {
      await ProductAnalyticsService.logEvent('simple_event');
      expect(analytics.logEvent).toHaveBeenCalledWith(
        expect.anything(),
        'simple_event',
        undefined,
      );
    });

    it('catches and logs error when analytics.logEvent throws', async () => {
      (analytics.logEvent as jest.Mock).mockRejectedValueOnce(
        new Error('Network error'),
      );
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      await ProductAnalyticsService.logEvent('failed_event');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to log event 'failed_event'"),
        expect.any(Error),
      );
      warnSpy.mockRestore();
    });
  });

  describe('event logging convenience methods', () => {
    it('logs lifecycle and navigation events', async () => {
      await ProductAnalyticsService.logAppOpen();
      await ProductAnalyticsService.logAppBackground();
      await ProductAnalyticsService.logAppForeground();
      await ProductAnalyticsService.logInsightsViewed();
      await ProductAnalyticsService.logSettingsViewed();
      await ProductAnalyticsService.logDashboardViewed();
      await ProductAnalyticsService.logAccountsViewed();
      await ProductAnalyticsService.logTransactionsViewed();
      await ProductAnalyticsService.logBudgetsViewed();
      await ProductAnalyticsService.logGoalsViewed();
      await ProductAnalyticsService.logInsightsScreenViewed();

      expect(analytics.logEvent).toHaveBeenCalledWith(
        expect.anything(),
        'app_open',
        undefined,
      );
      expect(analytics.logEvent).toHaveBeenCalledWith(
        expect.anything(),
        'dashboard_viewed',
        undefined,
      );
    });

    it('logs transaction events with transaction type', async () => {
      await ProductAnalyticsService.logFirstTransactionCreated();
      await ProductAnalyticsService.logTransactionCreated('expense');
      await ProductAnalyticsService.logTransactionUpdated('income');
      await ProductAnalyticsService.logTransactionDeleted('transfer');

      expect(analytics.logEvent).toHaveBeenCalledWith(
        expect.anything(),
        'transaction_created',
        { transaction_type: 'expense' },
      );
      expect(analytics.logEvent).toHaveBeenCalledWith(
        expect.anything(),
        'transaction_updated',
        { transaction_type: 'income' },
      );
    });

    it('logs account, budget, and goal events', async () => {
      await ProductAnalyticsService.logFirstAccountCreated();
      await ProductAnalyticsService.logAccountCreated('bank');
      await ProductAnalyticsService.logAccountUpdated('cash');
      await ProductAnalyticsService.logAccountDeleted('credit');
      await ProductAnalyticsService.logBudgetCreated();
      await ProductAnalyticsService.logBudgetUpdated();
      await ProductAnalyticsService.logGoalCreated();
      await ProductAnalyticsService.logGoalUpdated();

      expect(analytics.logEvent).toHaveBeenCalledWith(
        expect.anything(),
        'account_created',
        { account_type: 'bank' },
      );
      expect(analytics.logEvent).toHaveBeenCalledWith(
        expect.anything(),
        'budget_created',
        undefined,
      );
    });
  });

  describe('crash reporting', () => {
    it('logs breadcrumb message to Crashlytics', () => {
      ProductAnalyticsService.logCrash('Something happened');
      expect(crashlytics.log).toHaveBeenCalledWith(
        expect.anything(),
        'Something happened',
      );
    });

    it('records errors with and without context attribute', () => {
      const error = new Error('Test crash');
      ProductAnalyticsService.recordError(error);
      expect(crashlytics.recordError).toHaveBeenCalledWith(
        expect.anything(),
        error,
      );

      ProductAnalyticsService.recordError(error, 'UserFlow');
      expect(crashlytics.setAttribute).toHaveBeenCalledWith(
        expect.anything(),
        'error_context',
        'UserFlow',
      );
    });

    it('can be instantiated as a class', () => {
      expect(new ProductAnalyticsService()).toBeInstanceOf(
        ProductAnalyticsService,
      );
    });
  });
});
