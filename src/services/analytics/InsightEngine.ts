import {
  getTranslatedName,
  Language,
  translations,
} from '../../i18n/translations';
import { AnalyticsReport, Insight } from './types';
import { formatCurrency } from '../../utils/formatters';

export class InsightEngine {
  static generateInsights(
    report: AnalyticsReport,
    language: Language,
  ): Insight[] {
    const insights: Insight[] = [];
    const { currentMonth, previousMonth, categoryExpenses } = report;
    const t = translations[language] || translations.en;

    // Rule 1: High spending category (> 30% of total)
    categoryExpenses.forEach((cat) => {
      const translatedCatName = getTranslatedName(cat.categoryName, language);
      if (cat.percentage > 30) {
        insights.push({
          id: `high-spending-${cat.categoryId}`,
          title: t.insightHighSpendingCategoryTitle.replace(
            '{{category}}',
            translatedCatName,
          ),
          message: t.insightHighSpendingCategoryMessage
            .replace('{{category}}', translatedCatName)
            .replace('{{percentage}}', cat.percentage.toFixed(0)),
          recommendation: t.insightHighSpendingCategoryRec,
          level: 'warning',
          category: 'spending',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Rule 2: Spending Increase (> 20%)
    if (previousMonth.expenses > 0) {
      const growth =
        ((currentMonth.expenses - previousMonth.expenses) /
          previousMonth.expenses) *
        100;
      if (growth > 20) {
        insights.push({
          id: 'rule-spending-increase',
          title: t.insightExpenseGrowthTitle,
          message: t.insightExpenseGrowthMessage.replace(
            '{{percentage}}',
            growth.toFixed(1),
          ),
          recommendation: t.insightExpenseGrowthRec,
          level: 'warning',
          category: 'spending',
          timestamp: new Date().toISOString(),
        });
      } else if (growth < -10) {
        insights.push({
          id: 'rule-spending-decrease',
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

    // Rule 3: Budget Exceeded
    report.budgets.forEach((budget) => {
      const translatedCatName = getTranslatedName(budget.categoryName, language);
      if (budget.exceeded) {
        insights.push({
          id: `budget-exceeded-${budget.categoryId}`,
          title: t.insightBudgetExceededTitle,
          message: t.insightBudgetExceededMessage.replace(
            '{{category}}',
            translatedCatName,
          ),
          recommendation: t.insightBudgetExceededRec,
          level: 'warning',
          category: 'budget',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Rule 4: Savings Opportunity (Income > Expenses)
    if (currentMonth.income > currentMonth.expenses && currentMonth.expenses > 0) {
      insights.push({
        id: 'rule-savings-opportunity',
        title: t.insightSavingsOpportunityTitle,
        message: t.insightSavingsOpportunityMessage.replace(
          '{{amount}}',
          formatCurrency(currentMonth.savings),
        ),
        recommendation: t.insightSavingsOpportunityRec,
        level: 'positive',
        category: 'savings',
        timestamp: new Date().toISOString(),
      });
    }

    // Additional check: Low income
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
