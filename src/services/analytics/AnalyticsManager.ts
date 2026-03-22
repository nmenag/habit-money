import { Language } from '../../i18n/translations';
import { AnalyticsService } from './AnalyticsService';
import { InsightEngine } from './InsightEngine';
import { AnalyticsReport } from './types';

export class AnalyticsManager {
  static async generateFullReport(
    language: Language,
  ): Promise<AnalyticsReport> {
    const currentMonth = await AnalyticsService.getMonthlyMetrics(0);
    const previousMonth = await AnalyticsService.getMonthlyMetrics(1);
    const categoryExpenses = await AnalyticsService.getCategoryExpenses(0);
    const previousCategoryExpenses =
      await AnalyticsService.getCategoryExpenses(1);
    const spendingDays = await AnalyticsService.getSpendingDays(0);
    const budgets = await AnalyticsService.getBudgetAdherence();

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
      insights: [],
    };

    report.insights = InsightEngine.generateInsights(report, language);

    return report;
  }
}
