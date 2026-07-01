import { getDb } from '../../../db/schema';
import { Language } from '../../../i18n/translations';
import { DateRange, getPreviousPeriodRange } from '../../../utils/dateFilters';
import { AnalyticsService } from './AnalyticsService';
import { InsightEngine } from './InsightEngine';
import { AnalyticsReport } from './types';

export class AnalyticsManager {
  static async generateFullReport(
    language: Language,
    range: DateRange,
  ): Promise<AnalyticsReport> {
    const currentMonth = await AnalyticsService.getMonthlyMetrics(range);
    const categoryExpenses = await AnalyticsService.getCategoryExpenses(range);
    const spendingDays = await AnalyticsService.getSpendingDays(range);
    const budgets = await AnalyticsService.getBudgetAdherence(range);

    let previousMonth = {
      month: '',
      income: 0,
      expenses: 0,
      adjustments: 0,
      savings: 0,
      savingsRate: 0,
    };
    let previousCategoryExpenses: any[] = [];

    const prevRange = getPreviousPeriodRange(range);
    if (prevRange) {
      previousCategoryExpenses =
        await AnalyticsService.getCategoryExpenses(prevRange);

      if (range.type === 'month') {
        const start = new Date(range.startDate);
        const fullPrevRange: DateRange = {
          type: 'custom',
          startDate: new Date(
            start.getFullYear(),
            start.getMonth() - 1,
            1,
            0,
            0,
            0,
            0,
          ),
          endDate: new Date(
            start.getFullYear(),
            start.getMonth(),
            0,
            23,
            59,
            59,
            999,
          ),
        };
        previousMonth = await AnalyticsService.getMonthlyMetrics(fullPrevRange);
      } else {
        previousMonth = await AnalyticsService.getMonthlyMetrics(prevRange);
      }
    }

    const start = new Date(range.startDate);
    const now = new Date();

    let currentCalendarRange: DateRange;
    let previousCalendarRange: DateRange;

    const isCurrentMonthOrRolling =
      range.type === 'month' ||
      range.type === 'last30Days' ||
      (start.getFullYear() === now.getFullYear() &&
        start.getMonth() === now.getMonth());

    if (isCurrentMonthOrRolling) {
      currentCalendarRange = {
        type: 'custom',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        endDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        ),
      };
      previousCalendarRange = {
        type: 'custom',
        startDate: new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
          0,
          0,
          0,
          0,
        ),
        endDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
          999,
        ),
      };
    } else {
      currentCalendarRange = {
        type: 'custom',
        startDate: new Date(
          start.getFullYear(),
          start.getMonth(),
          1,
          0,
          0,
          0,
          0,
        ),
        endDate: new Date(
          start.getFullYear(),
          start.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        ),
      };
      previousCalendarRange = {
        type: 'custom',
        startDate: new Date(
          start.getFullYear(),
          start.getMonth() - 1,
          1,
          0,
          0,
          0,
          0,
        ),
        endDate: new Date(
          start.getFullYear(),
          start.getMonth(),
          0,
          23,
          59,
          59,
          999,
        ),
      };
    }

    const currentCalendarMonth =
      await AnalyticsService.getMonthlyMetrics(currentCalendarRange);
    const previousCalendarMonth = await AnalyticsService.getMonthlyMetrics(
      previousCalendarRange,
    );

    const db = getDb();
    const oldestTx = await db.getFirstAsync<{ date: string }>(
      'SELECT date FROM transactions ORDER BY date ASC LIMIT 1',
    );
    let hasEnoughHistory = false;
    if (oldestTx && oldestTx.date) {
      const firstDate = new Date(oldestTx.date);
      const daysSinceFirst = Math.floor(
        (now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      hasEnoughHistory = daysSinceFirst >= 60;
    }

    let expenseGrowth = 0;
    let comparisonMode: 'percentage' | 'absolute' | 'none' = 'absolute';
    let absoluteDifference =
      currentCalendarMonth.expenses - previousCalendarMonth.expenses;

    if (
      previousCalendarMonth.expenses === 0 &&
      currentCalendarMonth.expenses === 0
    ) {
      comparisonMode = 'none';
    }

    const hasComparisonData =
      (currentCalendarMonth.expenses > 0 || currentCalendarMonth.income > 0) &&
      (previousCalendarMonth.expenses > 0 || previousCalendarMonth.income > 0);

    const report: AnalyticsReport = {
      currentMonth,
      previousMonth,
      currentCalendarMonth,
      previousCalendarMonth,
      categoryExpenses,
      previousCategoryExpenses,
      budgets,
      spendingDays,
      expenseGrowth,
      hasEnoughHistory,
      hasComparisonData,
      comparisonMode,
      absoluteDifference,
      insights: [],
    };

    report.insights = InsightEngine.generateInsights(report, language);

    return report;
  }
}
