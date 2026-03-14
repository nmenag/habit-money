import { Language, translations } from '../../i18n/translations';
import { AnalyticsReport, Insight } from './types';

export class InsightEngine {
  static generateInsights(
    report: AnalyticsReport,
    language: Language,
  ): Insight[] {
    const insights: Insight[] = [];
    const { currentMonth, previousMonth, categoryExpenses } = report;
    const t = translations[language] || translations.en;

    // Rule 1: Overspending
    if (
      currentMonth.expenses > currentMonth.income &&
      currentMonth.income > 0
    ) {
      insights.push({
        id: 'rule-overspending',
        title: t.insightOverspendingTitle,
        message: t.insightOverspendingMessage,
        level: 'warning',
        category: 'budget',
        timestamp: new Date().toISOString(),
      });
    }

    categoryExpenses.forEach((cat) => {
      // Note: We'd need previous month category data for a full comparison.
      // For simplicity in V1, let's assume we have it or use a simplified check.
    });

    if (currentMonth.savingsRate >= 0.2) {
      insights.push({
        id: 'rule-high-savings',
        title: t.insightHighSavingsTitle,
        message: t.insightHighSavingsMessage.replace(
          '{{percentage}}',
          (currentMonth.savingsRate * 100).toFixed(0),
        ),
        level: 'positive',
        category: 'savings',
        timestamp: new Date().toISOString(),
      });
    }

    if (currentMonth.topCategory) {
      insights.push({
        id: 'rule-top-category',
        title: t.insightTopCategoryTitle,
        message: t.insightTopCategoryMessage
          .replace('{{category}}', currentMonth.topCategory.name)
          .replace(
            '{{amount}}',
            currentMonth.topCategory.amount.toFixed(2).toString(),
          ),
        level: 'info',
        category: 'spending',
        timestamp: new Date().toISOString(),
      });
    }

    if (previousMonth.expenses > 0) {
      const growth =
        ((currentMonth.expenses - previousMonth.expenses) /
          previousMonth.expenses) *
        100;
      if (growth > 10) {
        insights.push({
          id: 'rule-expense-growth',
          title: t.insightExpenseGrowthTitle,
          message: t.insightExpenseGrowthMessage.replace(
            '{{percentage}}',
            growth.toFixed(1),
          ),
          level: 'warning',
          category: 'spending',
          timestamp: new Date().toISOString(),
        });
      } else if (growth < -5) {
        insights.push({
          id: 'rule-expense-reduction',
          title: t.insightExpenseReductionTitle,
          message: t.insightExpenseReductionMessage.replace(
            '{{percentage}}',
            Math.abs(growth).toFixed(1),
          ),
          level: 'positive',
          category: 'spending',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Low Income/No Activity check
    if (currentMonth.income === 0 && currentMonth.expenses > 0) {
      insights.push({
        id: 'rule-no-income',
        title: t.insightNoIncomeTitle,
        message: t.insightNoIncomeMessage,
        level: 'info',
        category: 'earnings',
        timestamp: new Date().toISOString(),
      });
    }

    return insights;
  }
}
