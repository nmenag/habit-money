import { getDb } from '../../../db/schema';
import { Language } from '../../../i18n/translations';
import {
  DateRange,
  getLastMonthRange,
  getMonthRange,
  getPreviousPeriodRange,
} from '../../../utils/dateFilters';
import { AnalyticsService } from './AnalyticsService';
import { InsightEngine } from './InsightEngine';
import { AnalyticsReport } from './types';

export class AnalyticsManager {
  static async generateFullReport(
    language: Language,
    range: DateRange,
    cycleStartDay: number = 1,
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

    const prevRange = getPreviousPeriodRange(range, cycleStartDay);
    if (prevRange) {
      previousMonth = await AnalyticsService.getMonthlyMetrics(prevRange);
      previousCategoryExpenses =
        await AnalyticsService.getCategoryExpenses(prevRange);
    }

    const start = new Date(range.startDate);
    const now = new Date();

    let currentCalendarRange: DateRange;
    let previousCalendarRange: DateRange;

    const isCurrentMonthOrRolling =
      range.type === 'month' ||
      range.type === 'last30Days' ||
      (start.getTime() <= now.getTime() &&
        new Date(range.endDate).getTime() >= now.getTime());

    if (isCurrentMonthOrRolling) {
      const currCycle = getMonthRange(cycleStartDay, now);
      const prevCycle = getLastMonthRange(cycleStartDay, now);
      currentCalendarRange = {
        type: 'custom',
        startDate: currCycle.startDate,
        endDate: now,
      };
      previousCalendarRange = {
        type: 'custom',
        startDate: prevCycle.startDate,
        endDate: prevCycle.endDate,
      };
    } else {
      const targetCycle = getMonthRange(cycleStartDay, start);
      const prevCycle = getLastMonthRange(cycleStartDay, start);
      currentCalendarRange = {
        type: 'custom',
        startDate: targetCycle.startDate,
        endDate: targetCycle.endDate,
      };
      previousCalendarRange = {
        type: 'custom',
        startDate: prevCycle.startDate,
        endDate: prevCycle.endDate,
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
      previousCalendarMonth.expenses > 0 || previousCalendarMonth.income > 0;

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
