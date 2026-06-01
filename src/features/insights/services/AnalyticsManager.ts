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
      previousMonth = await AnalyticsService.getMonthlyMetrics(prevRange);
      previousCategoryExpenses =
        await AnalyticsService.getCategoryExpenses(prevRange);
    }

    const db = getDb();
    const oldestTx = await db.getFirstAsync<{ date: string }>(
      'SELECT date FROM transactions ORDER BY date ASC LIMIT 1',
    );
    let hasEnoughHistory = false;
    if (oldestTx && oldestTx.date) {
      const firstDate = new Date(oldestTx.date);
      const now = new Date();
      const daysSinceFirst = Math.floor(
        (now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      hasEnoughHistory = daysSinceFirst >= 60;
    }

    let expenseGrowth = 0;
    if (previousMonth.expenses > 0) {
      expenseGrowth =
        ((currentMonth.expenses - previousMonth.expenses) /
          previousMonth.expenses) *
        100;
    }

    const report: AnalyticsReport = {
      currentMonth,
      previousMonth,
      categoryExpenses,
      previousCategoryExpenses,
      budgets,
      spendingDays,
      expenseGrowth,
      hasEnoughHistory,
      insights: [],
    };

    report.insights = InsightEngine.generateInsights(report, language);

    return report;
  }
}
