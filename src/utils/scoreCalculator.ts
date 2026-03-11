import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { Transaction } from '../store/useStore';

export interface ScoreData {
  score: number;
  status: 'healthy' | 'warning' | 'overspending';
  savingsRate: number;
  expenseGrowth: number;
  spendingDays: number;
  spentMoreThanEarned: boolean;
  streak: number;
  insights: string[];
}

export const calculateFinancialScore = (
  transactions: Transaction[],
): ScoreData => {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  let currentIncome = 0;
  let currentExpense = 0;
  let spendingDates = new Set<string>();

  let lastIncome = 0;
  let lastExpense = 0;

  const currentCategoryExpense: Record<string, number> = {};
  const lastCategoryExpense: Record<string, number> = {};

  transactions.forEach((t) => {
    const txDate = parseISO(t.date);
    const amount = t.amount;

    // Check if it's the current month
    if (txDate >= currentMonthStart && txDate <= currentMonthEnd) {
      if (t.type === 'income') {
        currentIncome += amount;
      } else {
        currentExpense += amount;
        spendingDates.add(format(txDate, 'yyyy-MM-dd'));

        if (t.categoryId) {
          currentCategoryExpense[t.categoryId] =
            (currentCategoryExpense[t.categoryId] || 0) + amount;
        }
      }
    }

    // Check if it's the last month
    if (txDate >= lastMonthStart && txDate <= lastMonthEnd) {
      if (t.type === 'income') {
        lastIncome += amount;
      } else {
        lastExpense += amount;

        if (t.categoryId) {
          lastCategoryExpense[t.categoryId] =
            (lastCategoryExpense[t.categoryId] || 0) + amount;
        }
      }
    }
  });

  // 1. Savings Rate
  // Let's protect against division by zero
  const savingsRate =
    currentIncome > 0
      ? Math.max(0, (currentIncome - currentExpense) / currentIncome)
      : 0;

  // 2. Expense Growth
  const expenseGrowth =
    lastExpense > 0 ? ((currentExpense - lastExpense) / lastExpense) * 100 : 0;

  // 3. Spending Days
  const spendingDays = spendingDates.size;

  // 4. Overspent Check
  const spentMoreThanEarned = currentExpense > currentIncome;

  // Score Calculation (0 - 100)
  // Baseline score 50. Modifiers based on good/bad behaviors.
  let score = 50;

  // Modify score based on savings rate (+0 to +30)
  if (savingsRate >= 0.2) score += 30;
  else if (savingsRate >= 0.1) score += 20;
  else if (savingsRate > 0) score += 10;

  // Modifiers for Expense Growth (-20 to +20)
  if (expenseGrowth < 0)
    score += 20; // Good! Spent less than last month
  else if (expenseGrowth > 10) score -= 15; // Bad, spent a lot more

  // Daily spending habits (-15 to 0)
  // Assuming 30 days in a month. If user spent on mostly every day, might be an impulsive spender.
  if (spendingDays > 20) score -= 15;
  else if (spendingDays > 10) score -= 5;

  // Overspending trap! (-30)
  if (spentMoreThanEarned) {
    score -= 30;
  }

  // Cap Score 0 to 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Determine status
  let status: ScoreData['status'] = 'healthy';
  if (score < 40) status = 'overspending';
  else if (score < 70) status = 'warning';

  // Calculate Streak
  let streak = 0;
  let evalDate = subMonths(now, 1);

  // A simple while loop to count previous positive months
  while (true) {
    const monthStart = startOfMonth(evalDate);
    const monthEnd = endOfMonth(evalDate);

    let monthIncome = 0;
    let monthExpense = 0;

    transactions.forEach((t) => {
      const d = parseISO(t.date);
      if (d >= monthStart && d <= monthEnd) {
        if (t.type === 'income') monthIncome += t.amount;
        else monthExpense += t.amount;
      }
    });

    // Check streak condition (Expenses <= Income) and must have some income or expense to be active
    if (monthExpense <= monthIncome && (monthIncome > 0 || monthExpense > 0)) {
      streak++;
      evalDate = subMonths(evalDate, 1);
    } else {
      break;
    }
  }

  // Monthly Insights
  const insights: string[] = [];
  if (expenseGrowth > 0 && lastExpense > 0) {
    insights.push(
      `Your overall expenses grew by ${expenseGrowth.toFixed(1)}% compared to last month.`,
    );
  } else if (expenseGrowth < 0) {
    insights.push(
      `Great job! You spent ${Math.abs(expenseGrowth).toFixed(1)}% less than last month.`,
    );
  }

  if (spendingDays > 25) {
    insights.push(
      `You spent money on ${spendingDays} days this month. Try a "no-spend" day challenge!`,
    );
  }

  return {
    score,
    status,
    savingsRate,
    expenseGrowth,
    spendingDays,
    spentMoreThanEarned,
    streak,
    insights,
  };
};
