import { getDb } from '../../../db/schema';
import { CategoryExpense, MonthlyMetrics } from './types';

export class AnalyticsService {
  private static getMonthDateRange(offset: number = 0) {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - offset,
      1,
      0,
      0,
      0,
      0,
    );
    const end = new Date(
      now.getFullYear(),
      now.getMonth() - offset + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;

    return {
      start: formatLocal(start),
      end: formatLocal(end),
      month: `${start.getFullYear()}-${pad(start.getMonth() + 1)}`,
    };
  }

  static async getMonthlyMetrics(offset: number = 0): Promise<MonthlyMetrics> {
    const db = getDb();
    const { start, end, month } = this.getMonthDateRange(offset);

    const transactions = await db.getAllAsync<{
      type: string;
      amount: number;
      note: string;
    }>(
      `
      SELECT type, amount, note
      FROM transactions
      WHERE date >= ? AND date <= ?
    `,
      [start, end],
    );

    let income = 0;
    let expenses = 0;
    let adjustments = 0;

    const adjustmentNotes = ['Balance Adjustment', 'Ajuste de Saldo'];

    transactions.forEach((t) => {
      const isAdjustment = t.note && adjustmentNotes.includes(t.note);
      if (isAdjustment) {
        adjustments += t.type === 'income' ? t.amount : -t.amount;
      } else if (t.type === 'income') {
        income += t.amount;
      } else if (t.type === 'expense') {
        expenses += t.amount;
      }
    });

    const topCategory = await db.getFirstAsync<{
      id: string;
      name: string;
      amount: number;
    }>(
      `
      SELECT c.id, c.name, SUM(t.amount) as amount
      FROM transactions t
      JOIN categories c ON t.categoryId = c.id
      WHERE t.type = 'expense'
        AND t.note NOT IN ('Balance Adjustment', 'Ajuste de Saldo')
        AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY amount DESC
      LIMIT 1
    `,
      [start, end],
    );

    const savings = income - expenses + adjustments;
    const savingsRate = income > 0 ? (income - expenses) / income : 0;

    return {
      month,
      income,
      expenses,
      adjustments,
      savings,
      savingsRate,
      topCategory: topCategory || undefined,
    };
  }

  static async getCategoryExpenses(
    offset: number = 0,
  ): Promise<CategoryExpense[]> {
    const db = getDb();
    const { start, end } = this.getMonthDateRange(offset);

    const rows = await db.getAllAsync<{
      categoryId: string;
      categoryName: string;
      amount: number;
      color: string;
    }>(
      `
      SELECT
        c.id as categoryId,
        c.name as categoryName,
        SUM(t.amount) as amount,
        MAX(c.color) as color
      FROM transactions t
      JOIN categories c ON t.categoryId = c.id
      WHERE t.type = 'expense'
        AND t.note NOT IN ('Balance Adjustment', 'Ajuste de Saldo')
        AND t.date >= ? AND t.date <= ?
      GROUP BY c.id
      ORDER BY amount DESC
    `,
      [start, end],
    );

    const totalExpense = rows.reduce((sum, row) => sum + row.amount, 0);

    return rows.map((row) => ({
      ...row,
      percentage: totalExpense > 0 ? (row.amount / totalExpense) * 100 : 0,
    }));
  }

  static async getSpendingDays(offset: number = 0): Promise<number> {
    const db = getDb();
    const { start, end } = this.getMonthDateRange(offset);

    const result = await db.getFirstAsync<{ count: number }>(
      `
      SELECT COUNT(DISTINCT substr(date, 1, 10)) as count
      FROM transactions
      WHERE type = 'expense'
        AND note NOT IN ('Balance Adjustment', 'Ajuste de Saldo')
        AND date >= ? AND date <= ?
    `,
      [start, end],
    );

    return result?.count || 0;
  }

  static async getBudgetAdherence() {
    const db = getDb();
    const { start, end } = this.getMonthDateRange(0);

    const rows = await db.getAllAsync<{
      categoryId: string;
      categoryName: string;
      amount: number;
      spent: number;
    }>(
      `
      SELECT
        b.categoryId,
        c.name as categoryName,
        b.amount,
        COALESCE(SUM(t.amount), 0) as spent
      FROM budgets b
      JOIN categories c ON b.categoryId = c.id
      LEFT JOIN transactions t ON t.categoryId = b.categoryId
        AND t.type = 'expense'
        AND t.date >= ? AND t.date <= ?
      GROUP BY b.categoryId
    `,
      [start, end],
    );

    return rows.map((r) => ({
      ...r,
      exceeded: r.spent > r.amount,
    }));
  }
}
