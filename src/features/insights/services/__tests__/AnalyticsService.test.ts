import { getDb } from '../../../../db/schema';
import { DateRange } from '../../../../utils/dateFilters';
import { AnalyticsService } from '../AnalyticsService';

jest.mock('../../../../db/schema', () => ({
  getDb: jest.fn(),
}));

describe('AnalyticsService', () => {
  let mockDb: any;
  const mockRange: DateRange = {
    type: 'month',
    startDate: new Date(2026, 2, 1, 0, 0, 0),
    endDate: new Date(2026, 2, 31, 23, 59, 59),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      getAllAsync: jest.fn(),
      getFirstAsync: jest.fn(),
    };
    (getDb as jest.Mock).mockReturnValue(mockDb);
  });

  describe('getMonthlyMetrics', () => {
    it('aggregates income, expenses, adjustments, and calculates savings rate', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        { type: 'income', amount: 5000, note: 'Salary' },
        { type: 'expense', amount: 1200, note: 'Groceries' },
        { type: 'income', amount: 200, note: 'Balance Adjustment' },
        { type: 'expense', amount: 50, note: 'Ajuste de Saldo' },
      ]);
      mockDb.getFirstAsync.mockResolvedValueOnce({
        id: 'cat-groceries',
        name: 'Groceries',
        amount: 1200,
      });

      const metrics = await AnalyticsService.getMonthlyMetrics(mockRange);

      expect(metrics.income).toBe(5000);
      expect(metrics.expenses).toBe(1200);
      // adjustments = +200 - 50 = +150
      expect(metrics.adjustments).toBe(150);
      // savings = income - expenses + adjustments = 5000 - 1200 + 150 = 3950
      expect(metrics.savings).toBe(3950);
      // savingsRate = (5000 - 1200) / 5000 = 0.76
      expect(metrics.savingsRate).toBeCloseTo(0.76);
      expect(metrics.topCategory).toEqual({
        id: 'cat-groceries',
        name: 'Groceries',
        amount: 1200,
      });
      expect(metrics.month).toBe('2026-03');
    });

    it('handles zero income safely with 0 savings rate and undefined topCategory', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      const metrics = await AnalyticsService.getMonthlyMetrics(mockRange);

      expect(metrics.income).toBe(0);
      expect(metrics.expenses).toBe(0);
      expect(metrics.savingsRate).toBe(0);
      expect(metrics.topCategory).toBeUndefined();
    });
  });

  describe('getCategoryExpenses', () => {
    it('returns categories with correctly calculated percentage of total expenses', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          categoryId: 'cat-1',
          categoryName: 'Food',
          amount: 300,
          color: '#22C55E',
        },
        {
          categoryId: 'cat-2',
          categoryName: 'Transport',
          amount: 100,
          color: '#3B82F6',
        },
      ]);

      const result = await AnalyticsService.getCategoryExpenses(mockRange);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        categoryId: 'cat-1',
        categoryName: 'Food',
        amount: 300,
        color: '#22C55E',
        percentage: 75,
      });
      expect(result[1]).toEqual({
        categoryId: 'cat-2',
        categoryName: 'Transport',
        amount: 100,
        color: '#3B82F6',
        percentage: 25,
      });
    });

    it('handles empty results and returns percentage 0 when total is 0', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([]);

      const result = await AnalyticsService.getCategoryExpenses(mockRange);
      expect(result).toEqual([]);
    });
  });

  describe('getSpendingDays', () => {
    it('returns count of unique spending days', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce({ count: 14 });

      const count = await AnalyticsService.getSpendingDays(mockRange);
      expect(count).toBe(14);
    });

    it('returns 0 if database returns null', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      const count = await AnalyticsService.getSpendingDays(mockRange);
      expect(count).toBe(0);
    });
  });

  describe('getBudgetAdherence', () => {
    it('returns budget adherence with exceeded flag calculation', async () => {
      mockDb.getAllAsync.mockResolvedValueOnce([
        {
          categoryId: 'cat-1',
          categoryName: 'Food',
          amount: 500,
          spent: 600,
        },
        {
          categoryId: 'cat-2',
          categoryName: 'Fun',
          amount: 300,
          spent: 200,
        },
      ]);

      const result = await AnalyticsService.getBudgetAdherence(mockRange);

      expect(result).toEqual([
        {
          categoryId: 'cat-1',
          categoryName: 'Food',
          amount: 500,
          spent: 600,
          exceeded: true,
        },
        {
          categoryId: 'cat-2',
          categoryName: 'Fun',
          amount: 300,
          spent: 200,
          exceeded: false,
        },
      ]);
    });
  });
});

