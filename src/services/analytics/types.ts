export type InsightLevel = 'info' | 'positive' | 'warning' | 'critical';

export interface Insight {
  id: string;
  title: string;
  message: string;
  level: InsightLevel;
  category: string;
  suggestedAction?: string;
  timestamp: string;
}

export interface MonthlyMetrics {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  topCategory?: {
    id: string;
    name: string;
    amount: number;
  };
}

export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface AnalyticsReport {
  currentMonth: MonthlyMetrics;
  previousMonth: MonthlyMetrics;
  categoryExpenses: CategoryExpense[];
  spendingDays: number;
  expenseGrowth: number;
  insights: Insight[];
}
