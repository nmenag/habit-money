import {
  getTranslatedName,
  Language,
  translations,
} from '../../../i18n/translations';
import { AnalyticsReport, Insight } from './types';
import { formatCurrency } from '../../../utils/formatters';
import { getLocalISOString } from '../../../utils/dateUtils';

export class InsightEngine {
  static generateInsights(
    report: AnalyticsReport,
    language: Language,
  ): Insight[] {
    const insights: Insight[] = [];
    const {
      currentMonth,
      previousMonth,
      categoryExpenses,
      previousCategoryExpenses,
    } = report;
    const t = translations[language] || translations.en;

    // A. Monthly Comparison
    if (previousMonth.expenses > 0) {
      const growth =
        ((currentMonth.expenses - previousMonth.expenses) /
          previousMonth.expenses) *
        100;

      if (growth > 10) {
        insights.push({
          id: 'monthly-comparison-warning',
          title: t.insightMonthlyComparisonTitle,
          message: t.insightSpentMoreThanLastMonth.replace(
            '{{percentage}}',
            growth.toFixed(0),
          ),
          level: 'warning',
          category: 'comparison',
          timestamp: getLocalISOString(),
        });
      } else if (growth < 0) {
        insights.push({
          id: 'monthly-comparison-positive',
          title: t.insightMonthlyComparisonTitle,
          message: t.insightSpentLessThanLastMonth.replace(
            '{{percentage}}',
            Math.abs(growth).toFixed(0),
          ),
          level: 'positive',
          category: 'comparison',
          timestamp: getLocalISOString(),
        });
      }
    }

    // B. Top Category
    if (categoryExpenses.length > 0) {
      const topCat = categoryExpenses[0]; // Sorted by amount in service
      const translatedName = getTranslatedName(topCat.categoryName, language);
      insights.push({
        id: 'top-category',
        title: t.insightTopCategoryTitle,
        message: t.insightTopCategoryMessage
          .replace('{{percentage}}', topCat.percentage.toFixed(0))
          .replace('{{category}}', translatedName),
        level: 'info',
        category: 'spending',
        timestamp: getLocalISOString(),
      });
    }

    // C. Category Growth
    if (previousCategoryExpenses.length > 0) {
      let maxIncrease = 0;
      let targetCat: (typeof categoryExpenses)[0] | null = null;

      categoryExpenses.forEach((cat) => {
        const prev = previousCategoryExpenses.find(
          (p) => p.categoryId === cat.categoryId,
        );
        if (prev && prev.amount > 0) {
          const inc = ((cat.amount - prev.amount) / prev.amount) * 100;
          if (inc > maxIncrease) {
            maxIncrease = inc;
            targetCat = cat;
          }
        }
      });

      if (targetCat && maxIncrease > 15) {
        const translatedName = getTranslatedName(
          (targetCat as any).categoryName,
          language,
        );
        insights.push({
          id: 'category-growth',
          title: t.insightCategoryGrowthTitle,
          message: t.insightCategoryGrowthMessage
            .replace('{{category}}', translatedName)
            .replace('{{percentage}}', maxIncrease.toFixed(0)),
          level: 'warning',
          category: 'comparison',
          timestamp: getLocalISOString(),
        });
      }
    }

    // D. Balance Insight
    if (currentMonth.income > 0 || currentMonth.expenses > 0) {
      if (currentMonth.income > currentMonth.expenses) {
        insights.push({
          id: 'balance-positive',
          title: t.insightBalancePositiveTitle,
          message: t.insightBalancePositiveMessage,
          level: 'positive',
          category: 'balance',
          timestamp: getLocalISOString(),
        });
      } else if (currentMonth.expenses > currentMonth.income) {
        insights.push({
          id: 'balance-negative',
          title: t.insightBalanceNegativeTitle,
          message: t.insightBalanceNegativeMessage,
          level: 'warning',
          category: 'balance',
          timestamp: getLocalISOString(),
        });
      }
    }

    // E. Spending Projection
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();

    if (currentMonth.expenses > 0 && currentDay > 3) {
      const projection = (currentMonth.expenses / currentDay) * daysInMonth;
      insights.push({
        id: 'spending-projection',
        title: t.insightProjectionTitle,
        message: t.insightProjectionMessage.replace(
          '{{amount}}',
          formatCurrency(projection),
        ),
        level: 'info',
        category: 'projection',
        timestamp: getLocalISOString(),
      });
    }

    // Default if few insights
    if (insights.length === 0) {
      insights.push({
        id: 'no-data',
        title: t.insightNoDataTitle,
        message: t.insightNoDataMessage,
        level: 'info',
        category: 'general',
        timestamp: getLocalISOString(),
      });
    }

    return insights.slice(0, 5); // Max 5 insights
  }
}
