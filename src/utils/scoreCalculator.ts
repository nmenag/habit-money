import {
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { Transaction } from '../store/useStore';
import { translations } from '../i18n/translations';

export interface Insight {
  key: keyof typeof translations.en;
  params?: Record<string, string | number>;
}

export interface ScoreData {
  score: number;
  status: 'healthy' | 'warning' | 'overspending';
  savingsRate: number;
  expenseGrowth: number;
  spendingDays: number;
  spentMoreThanEarned: boolean;
  streak: number;
  insights: Insight[];
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

  transactions.forEach((t) => {
    const txDate = parseISO(t.date);
    const amount = t.amount;

    if (txDate >= currentMonthStart && txDate <= currentMonthEnd) {
      if (t.type === 'income') {
        currentIncome += amount;
      } else {
        currentExpense += amount;
        spendingDates.add(format(txDate, 'yyyy-MM-dd'));
      }
    }

    if (txDate >= lastMonthStart && txDate <= lastMonthEnd) {
      if (t.type === 'income') {
        lastIncome += amount;
      } else {
        lastExpense += amount;
      }
    }
  });

  const savingsRate =
    currentIncome > 0
      ? Math.max(0, (currentIncome - currentExpense) / currentIncome)
      : 0;

  const expenseGrowth =
    lastExpense > 0 ? ((currentExpense - lastExpense) / lastExpense) * 100 : 0;

  const spendingDays = spendingDates.size;
  const spentMoreThanEarned = currentExpense > currentIncome;

  let score = 50;
  if (savingsRate >= 0.2) score += 30;
  else if (savingsRate >= 0.1) score += 20;
  else if (savingsRate > 0) score += 10;

  if (expenseGrowth < 0) score += 20;
  else if (expenseGrowth > 10) score -= 15;

  if (spendingDays > 20) score -= 15;
  else if (spendingDays > 10) score -= 5;

  if (spentMoreThanEarned) score -= 30;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let status: ScoreData['status'] = 'healthy';
  if (score < 40) status = 'overspending';
  else if (score < 70) status = 'warning';

  let streak = 0;
  let evalDate = subMonths(now, 1);

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

    if (monthExpense <= monthIncome && (monthIncome > 0 || monthExpense > 0)) {
      streak++;
      evalDate = subMonths(evalDate, 1);
    } else {
      break;
    }
  }

  const insights: Insight[] = [];
  if (expenseGrowth > 0 && lastExpense > 0) {
    insights.push({
      key: 'insightExpenseGrew',
      params: { percentage: expenseGrowth.toFixed(1) },
    });
  } else if (expenseGrowth < 0) {
    insights.push({
      key: 'insightExpenseLess',
      params: { percentage: Math.abs(expenseGrowth).toFixed(1) },
    });
  }

  if (spendingDays > 25) {
    insights.push({
      key: 'insightNoSpendChallenge',
      params: { days: spendingDays },
    });
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
