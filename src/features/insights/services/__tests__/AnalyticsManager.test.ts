import { getDb } from '../../../../db/schema';
import { DateRange } from '../../../../utils/dateFilters';
import { AnalyticsManager } from '../AnalyticsManager';
import { AnalyticsService } from '../AnalyticsService';
import { InsightEngine } from '../InsightEngine';

jest.mock('../../../../db/schema', () => ({
  getDb: jest.fn(),
}));

jest.mock('../AnalyticsService');
jest.mock('../InsightEngine');

describe('AnalyticsManager', () => {
  let mockDb: any;
  const mockDateRange: DateRange = {
    type: 'month',
    startDate: new Date(2026, 2, 1),
    endDate: new Date(2026, 2, 31),
  };

  const dummyMetrics = {
    month: '2026-03',
    income: 2000,
    expenses: 1000,
    adjustments: 0,
    savings: 1000,
    savingsRate: 0.5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getFirstAsync: jest.fn(),
    };
    (getDb as jest.Mock).mockReturnValue(mockDb);

    (AnalyticsService.getMonthlyMetrics as jest.Mock).mockResolvedValue(dummyMetrics);
    (AnalyticsService.getCategoryExpenses as jest.Mock).mockResolvedValue([
      { categoryId: 'c1', categoryName: 'Food', amount: 500, color: '#000', percentage: 50 },
    ]);
    (AnalyticsService.getSpendingDays as jest.Mock).mockResolvedValue(12);
    (AnalyticsService.getBudgetAdherence as jest.Mock).mockResolvedValue([]);
    (InsightEngine.generateInsights as jest.Mock).mockReturnValue([
      { id: '1', title: 'Great saving' },
    ]);
  });

  it('generates full analytics report for current month range', async () => {
    // 90 days of history
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 90);
    mockDb.getFirstAsync.mockResolvedValueOnce({
      date: pastDate.toISOString(),
    });

    const report = await AnalyticsManager.generateFullReport('en', mockDateRange, 1);

    expect(report.currentMonth).toEqual(dummyMetrics);
    expect(report.spendingDays).toBe(12);
    expect(report.hasEnoughHistory).toBe(true);
    expect(report.hasComparisonData).toBe(true);
    expect(report.comparisonMode).toBe('absolute');
    expect(report.insights).toHaveLength(1);
    expect(InsightEngine.generateInsights).toHaveBeenCalledWith(
      expect.anything(),
      'en',
    );
  });

  it('sets hasEnoughHistory to false if transactional history is under 60 days', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 20);
    mockDb.getFirstAsync.mockResolvedValueOnce({
      date: pastDate.toISOString(),
    });

    const report = await AnalyticsManager.generateFullReport('es', mockDateRange, 1);

    expect(report.hasEnoughHistory).toBe(false);
  });

  it('sets comparisonMode to none if both current and previous calendar expenses are 0', async () => {
    (AnalyticsService.getMonthlyMetrics as jest.Mock).mockResolvedValue({
      ...dummyMetrics,
      expenses: 0,
      income: 0,
    });
    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    const report = await AnalyticsManager.generateFullReport('en', mockDateRange, 1);

    expect(report.comparisonMode).toBe('none');
    expect(report.hasComparisonData).toBe(false);
  });

  it('handles custom historical date range that is not rolling or current month', async () => {
    const historicalRange: DateRange = {
      type: 'custom',
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2025, 0, 31),
    };

    mockDb.getFirstAsync.mockResolvedValueOnce(null);

    const report = await AnalyticsManager.generateFullReport('en', historicalRange, 1);

    expect(report).toBeDefined();
    expect(AnalyticsService.getMonthlyMetrics).toHaveBeenCalled();
  });
});

