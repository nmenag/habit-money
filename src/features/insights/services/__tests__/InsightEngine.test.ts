import { InsightEngine } from '../InsightEngine';
import { AnalyticsReport } from '../types';

describe('InsightEngine', () => {
  beforeEach(() => {
    // Set system date to May 15, 2026 (day 15 >= 7)
    jest.useFakeTimers().setSystemTime(new Date(2026, 4, 15, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createBaseReport = (): AnalyticsReport => ({
    currentMonth: {
      month: '2026-05',
      income: 0,
      expenses: 0,
      adjustments: 0,
      savings: 0,
      savingsRate: 0,
    },
    previousMonth: {
      month: '2026-04',
      income: 0,
      expenses: 0,
      adjustments: 0,
      savings: 0,
      savingsRate: 0,
    },
    currentCalendarMonth: {
      month: '2026-05',
      income: 0,
      expenses: 0,
      adjustments: 0,
      savings: 0,
      savingsRate: 0,
    },
    previousCalendarMonth: {
      month: '2026-04',
      income: 0,
      expenses: 0,
      adjustments: 0,
      savings: 0,
      savingsRate: 0,
    },
    categoryExpenses: [],
    previousCategoryExpenses: [],
    budgets: [],
    spendingDays: 0,
    expenseGrowth: 0,
    hasEnoughHistory: true,
    hasComparisonData: false,
    comparisonMode: 'none',
    absoluteDifference: 0,
    insights: [],
  });

  it('can be instantiated as a class', () => {
    expect(new InsightEngine()).toBeInstanceOf(InsightEngine);
  });

  it('generates "no-data" fallback insight when report is empty and falls back to translations.en', () => {
    const report = createBaseReport();
    const insights = InsightEngine.generateInsights(report, 'fr' as any);

    expect(insights).toHaveLength(1);
    expect(insights[0].id).toBe('no-data');
    expect(insights[0].category).toBe('general');
  });

  describe('comparison mode: percentage', () => {
    it('generates warning insight when growth > 10%', () => {
      const report = createBaseReport();
      report.hasComparisonData = true;
      report.comparisonMode = 'percentage';
      report.expenseGrowth = 25;

      const insights = InsightEngine.generateInsights(report, 'en');
      const warning = insights.find(
        (i) => i.id === 'monthly-comparison-warning',
      );
      expect(warning).toBeDefined();
      expect(warning?.level).toBe('warning');
      expect(warning?.message).toContain('25%');
    });

    it('generates positive insight when growth < 0%', () => {
      const report = createBaseReport();
      report.hasComparisonData = true;
      report.comparisonMode = 'percentage';
      report.expenseGrowth = -15;

      const insights = InsightEngine.generateInsights(report, 'en');
      const positive = insights.find(
        (i) => i.id === 'monthly-comparison-positive',
      );
      expect(positive).toBeDefined();
      expect(positive?.level).toBe('positive');
      expect(positive?.message).toContain('15%');
    });
  });

  describe('comparison mode: absolute', () => {
    it('generates warning insight when absolute difference > 0', () => {
      const report = createBaseReport();
      report.hasComparisonData = true;
      report.comparisonMode = 'absolute';
      report.absoluteDifference = 50000;

      const insights = InsightEngine.generateInsights(report, 'es');
      const warning = insights.find(
        (i) => i.id === 'monthly-comparison-warning-abs',
      );
      expect(warning).toBeDefined();
      expect(warning?.level).toBe('warning');
    });

    it('generates positive insight when absolute difference < 0', () => {
      const report = createBaseReport();
      report.hasComparisonData = true;
      report.comparisonMode = 'absolute';
      report.absoluteDifference = -50000;

      const insights = InsightEngine.generateInsights(report, 'es');
      const positive = insights.find(
        (i) => i.id === 'monthly-comparison-positive-abs',
      );
      expect(positive).toBeDefined();
      expect(positive?.level).toBe('positive');
    });
  });

  describe('top category spending', () => {
    it('generates top category insight', () => {
      const report = createBaseReport();
      report.categoryExpenses = [
        {
          categoryId: '1',
          categoryName: 'Food',
          amount: 4000,
          color: '#f44336',
          percentage: 60,
        },
      ];

      const insights = InsightEngine.generateInsights(report, 'en');
      const topCat = insights.find((i) => i.id === 'top-category');
      expect(topCat).toBeDefined();
      expect(topCat?.level).toBe('info');
      expect(topCat?.message).toContain('60%');
      expect(topCat?.message).toContain('Food');
    });
  });

  describe('category growth spike', () => {
    it('generates category growth warning when increase > 15%', () => {
      const report = createBaseReport();
      report.categoryExpenses = [
        {
          categoryId: '1',
          categoryName: 'Transport',
          amount: 100000,
          color: '#2196f3',
          percentage: 40,
        },
      ];
      report.previousCategoryExpenses = [
        {
          categoryId: '1',
          categoryName: 'Transport',
          amount: 50000,
          color: '#2196f3',
          percentage: 30,
        },
      ];

      const insights = InsightEngine.generateInsights(report, 'en');
      const growthInsight = insights.find((i) => i.id === 'category-growth');
      expect(growthInsight).toBeDefined();
      expect(growthInsight?.level).toBe('warning');
    });

    it('handles categories in current month that are not present in previous month', () => {
      const report = createBaseReport();
      report.categoryExpenses = [
        {
          categoryId: 'cat_new',
          categoryName: 'Shopping',
          amount: 50000,
          color: '#ff4081',
          percentage: 50,
        },
      ];
      report.previousCategoryExpenses = [
        {
          categoryId: 'cat_old',
          categoryName: 'Transport',
          amount: 50000,
          color: '#2196f3',
          percentage: 50,
        },
      ];

      const insights = InsightEngine.generateInsights(report, 'en');
      expect(insights).toBeDefined();
    });
  });

  describe('balance positive and negative', () => {
    it('generates balance-positive insight when income > expenses', () => {
      const report = createBaseReport();
      report.currentCalendarMonth.income = 5000;
      report.currentCalendarMonth.expenses = 2000;

      const insights = InsightEngine.generateInsights(report, 'en');
      expect(insights.some((i) => i.id === 'balance-positive')).toBe(true);
    });

    it('generates balance-negative insight when expenses > income', () => {
      const report = createBaseReport();
      report.currentCalendarMonth.income = 2000;
      report.currentCalendarMonth.expenses = 5000;

      const insights = InsightEngine.generateInsights(report, 'en');
      expect(insights.some((i) => i.id === 'balance-negative')).toBe(true);
    });
  });

  describe('spending projection', () => {
    it('generates projection insight with previous month historical blend', () => {
      const report = createBaseReport();
      report.currentCalendarMonth.expenses = 3000;
      report.previousCalendarMonth.expenses = 6000;

      const insights = InsightEngine.generateInsights(report, 'en');
      const projection = insights.find((i) => i.id === 'spending-projection');
      expect(projection).toBeDefined();
      expect(projection?.level).toBe('info');
    });

    it('generates projection insight without previous month data (current only)', () => {
      const report = createBaseReport();
      report.currentCalendarMonth.expenses = 3000;
      report.previousCalendarMonth.expenses = 0;

      const insights = InsightEngine.generateInsights(report, 'en');
      const projection = insights.find((i) => i.id === 'spending-projection');
      expect(projection).toBeDefined();
    });

    it('does not generate projection when currentDay < 7 and no previous data', () => {
      // Set date to 3rd day of the month
      jest.useFakeTimers().setSystemTime(new Date(2026, 4, 3, 12, 0, 0));
      const report = createBaseReport();
      report.currentCalendarMonth.expenses = 500;
      report.previousCalendarMonth.expenses = 0;

      const insights = InsightEngine.generateInsights(report, 'en');
      expect(insights.some((i) => i.id === 'spending-projection')).toBe(false);
    });
  });

  it('limits returned insights to at most 5', () => {
    const report = createBaseReport();
    report.hasComparisonData = true;
    report.comparisonMode = 'percentage';
    report.expenseGrowth = 30;
    report.categoryExpenses = [
      {
        categoryId: '1',
        categoryName: 'Food',
        amount: 500000,
        color: '#f44336',
        percentage: 70,
      },
    ];
    report.previousCategoryExpenses = [
      {
        categoryId: '1',
        categoryName: 'Food',
        amount: 200000,
        color: '#f44336',
        percentage: 50,
      },
    ];
    report.currentCalendarMonth.income = 1000000;
    report.currentCalendarMonth.expenses = 500000;
    report.previousCalendarMonth.expenses = 400000;

    const insights = InsightEngine.generateInsights(report, 'en');
    expect(insights.length).toBeLessThanOrEqual(5);
  });
});
