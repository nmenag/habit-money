import { getDb } from '../../database/schema';
import { MonthlyMetrics, CategoryExpense } from './types';

export class AnalyticsService {
  private static getMonthDateRange(offset: number = 0) {
    const date = new Date();
    date.setMonth(date.getMonth() - offset);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const start = `${year}-${month}-01T00:00:00.000Z`;
    // Last day of month
    const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
    const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;
    
    return { start, end, month: `${year}-${month}` };
  }

  static async getMonthlyMetrics(offset: number = 0): Promise<MonthlyMetrics> {
    const db = getDb();
    const { start, end, month } = this.getMonthDateRange(offset);

    const totals = db.getFirstSync<{ income: number; expenses: number }>(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM transactions
      WHERE date >= ? AND date <= ?
    `, [start, end]) || { income: 0, expenses: 0 };

    const topCategory = db.getFirstSync<{ id: string; name: string; amount: number }>(`
      SELECT c.id, c.name, SUM(t.amount) as amount
      FROM transactions t
      JOIN categories c ON t.categoryId = c.id
      WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY amount DESC
      LIMIT 1
    `, [start, end]);

    const income = totals.income || 0;
    const expenses = totals.expenses || 0;
    const savings = income - expenses;
    const savingsRate = income > 0 ? savings / income : 0;

    return {
      month,
      income,
      expenses,
      savings,
      savingsRate,
      topCategory: topCategory || undefined
    };
  }

  static async getCategoryExpenses(offset: number = 0): Promise<CategoryExpense[]> {
    const db = getDb();
    const { start, end } = this.getMonthDateRange(offset);

    const rows = db.getAllSync<{ categoryId: string; categoryName: string; amount: number }>(`
      SELECT 
        c.id as categoryId, 
        c.name as categoryName, 
        SUM(t.amount) as amount
      FROM transactions t
      JOIN categories c ON t.categoryId = c.id
      WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY amount DESC
    `, [start, end]);

    const totalExpense = rows.reduce((sum, row) => sum + row.amount, 0);

    return rows.map(row => ({
      ...row,
      percentage: totalExpense > 0 ? (row.amount / totalExpense) * 100 : 0
    }));
  }

  static async getSpendingDays(offset: number = 0): Promise<number> {
    const db = getDb();
    const { start, end } = this.getMonthDateRange(offset);

    const result = db.getFirstSync<{ count: number }>(`
      SELECT COUNT(DISTINCT substr(date, 1, 10)) as count
      FROM transactions
      WHERE type = 'expense' AND date >= ? AND date <= ?
    `, [start, end]);

    return result?.count || 0;
  }
}
