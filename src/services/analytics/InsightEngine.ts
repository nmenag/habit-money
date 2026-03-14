import { AnalyticsReport, Insight, MonthlyMetrics, CategoryExpense } from './types';

export class InsightEngine {
  static generateInsights(report: AnalyticsReport): Insight[] {
    const insights: Insight[] = [];
    const { currentMonth, previousMonth, categoryExpenses } = report;

    // Rule 1: Overspending
    if (currentMonth.expenses > currentMonth.income && currentMonth.income > 0) {
      insights.push({
        id: 'rule-overspending',
        title: 'Overspending Alert',
        message: 'You spent more than you earned this month. Consider reviewing your variable expenses.',
        level: 'warning',
        category: 'budget',
        timestamp: new Date().toISOString()
      });
    }

    // Rule 2: Category Increase > 20%
    categoryExpenses.forEach(cat => {
      // Note: We'd need previous month category data for a full comparison.
      // For simplicity in V1, let's assume we have it or use a simplified check.
    });

    // Rule 3: Good Savings
    if (currentMonth.savingsRate >= 0.2) {
      insights.push({
        id: 'rule-high-savings',
        title: 'High Savings Rate',
        message: `Great job! You saved ${(currentMonth.savingsRate * 100).toFixed(0)}% of your income this month.`,
        level: 'positive',
        category: 'savings',
        timestamp: new Date().toISOString()
      });
    }

    // Rule 4: Top Category
    if (currentMonth.topCategory) {
      insights.push({
        id: 'rule-top-category',
        title: 'Top Spending Category',
        message: `Your biggest spending category is ${currentMonth.topCategory.name}, totaling $${currentMonth.topCategory.amount.toFixed(2)}.`,
        level: 'info',
        category: 'spending',
        timestamp: new Date().toISOString()
      });
    }

    // Comparison with Previous Month
    if (previousMonth.expenses > 0) {
      const growth = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100;
      if (growth > 10) {
        insights.push({
          id: 'rule-expense-growth',
          title: 'Expense Growth',
          message: `Your total expenses increased by ${growth.toFixed(1)}% compared to last month.`,
          level: 'warning',
          category: 'spending',
          timestamp: new Date().toISOString()
        });
      } else if (growth < -5) {
        insights.push({
          id: 'rule-expense-reduction',
          title: 'Spending Reduction',
          message: `Excellent! You spent ${Math.abs(growth).toFixed(1)}% less than last month.`,
          level: 'positive',
          category: 'spending',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Low Income/No Activity check
    if (currentMonth.income === 0 && currentMonth.expenses > 0) {
      insights.push({
        id: 'rule-no-income',
        title: 'No Income Recorded',
        message: 'You have recorded expenses but no income yet this month.',
        level: 'info',
        category: 'earnings',
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }
}
