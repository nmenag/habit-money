import { calculateFinancialScore } from '../scoreCalculator';
import { Transaction } from '../../store/useStore';

describe('scoreCalculator', () => {
  beforeEach(() => {
    // Fix system time to May 15, 2026
    jest.useFakeTimers().setSystemTime(new Date(2026, 4, 15, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createTx = (
    id: string,
    type: 'income' | 'expense' | 'transfer',
    amount: number,
    date: string,
  ): Transaction => ({
    id,
    type,
    amount,
    date,
    accountId: 'acc1',
    categoryId: 'cat1',
  });

  it('calculates default score for empty transactions list', () => {
    const result = calculateFinancialScore([]);
    expect(result.score).toBe(50);
    expect(result.status).toBe('warning');
    expect(result.savingsRate).toBe(0);
    expect(result.expenseGrowth).toBe(0);
    expect(result.spendingDays).toBe(0);
    expect(result.spentMoreThanEarned).toBe(false);
    expect(result.streak).toBe(0);
    expect(result.insights).toEqual([]);
  });

  it('awards score bonus for high savings rate (>= 20%) and negative expense growth', () => {
    const txs: Transaction[] = [
      // Current month: income 5000, expense 1000 -> savings rate 80% (>= 0.2) -> +30
      createTx('1', 'income', 5000, '2026-05-02T10:00:00'),
      createTx('2', 'expense', 1000, '2026-05-03T10:00:00'),
      // Last month: expense 2000 -> expenseGrowth = (1000 - 2000) / 2000 * 100 = -50% (< 0) -> +20
      createTx('3', 'expense', 2000, '2026-04-10T10:00:00'),
    ];
    // Base 50 + 30 (savings) + 20 (growth) = 100
    const result = calculateFinancialScore(txs);
    expect(result.score).toBe(100);
    expect(result.status).toBe('healthy');
    expect(result.insights).toEqual([
      {
        key: 'insightSpentLessThanLastMonth',
        params: { percentage: '50.0' },
      },
    ]);
  });

  it('handles moderate savings rate (10% to 20%) and expense growth penalty (> 10%)', () => {
    const txs: Transaction[] = [
      // Current month: income 1000, expense 850 -> savings rate 15% (>= 0.1) -> +20
      createTx('1', 'income', 1000, '2026-05-02T10:00:00'),
      createTx('2', 'expense', 850, '2026-05-03T10:00:00'),
      // Last month: expense 500 -> expenseGrowth = (850 - 500) / 500 * 100 = 70% (> 10%) -> -15
      createTx('3', 'expense', 500, '2026-04-10T10:00:00'),
    ];
    // Base 50 + 20 (savings) - 15 (growth) = 55
    const result = calculateFinancialScore(txs);
    expect(result.score).toBe(55);
    expect(result.status).toBe('warning');
    expect(result.insights).toEqual([
      {
        key: 'insightSpentMoreThanLastMonth',
        params: { percentage: '70.0' },
      },
    ]);
  });

  it('handles low savings rate (0% to 10%)', () => {
    const txs: Transaction[] = [
      // Current month: income 1000, expense 950 -> savings rate 5% (> 0) -> +10
      createTx('1', 'income', 1000, '2026-05-02T10:00:00'),
      createTx('2', 'expense', 950, '2026-05-03T10:00:00'),
    ];
    // Base 50 + 10 = 60
    const result = calculateFinancialScore(txs);
    expect(result.score).toBe(60);
    expect(result.status).toBe('warning');
  });

  it('penalizes overspending when expenses exceed income', () => {
    const txs: Transaction[] = [
      // Current month: income 1000, expense 1500 -> spentMoreThanEarned -> -30
      createTx('1', 'income', 1000, '2026-05-02T10:00:00'),
      createTx('2', 'expense', 1500, '2026-05-03T10:00:00'),
    ];
    // Base 50 - 30 = 20
    const result = calculateFinancialScore(txs);
    expect(result.score).toBe(20);
    expect(result.status).toBe('overspending');
    expect(result.spentMoreThanEarned).toBe(true);
  });

  it('applies spending days penalty when days > 10 and days > 20 and adds insight for > 25 days', () => {
    const txs: Transaction[] = [
      createTx('inc', 'income', 50000, '2026-05-01T00:00:00'),
    ];
    // Create expenses on 26 distinct days
    for (let day = 1; day <= 26; day++) {
      const padDay = String(day).padStart(2, '0');
      txs.push(
        createTx(`exp_${day}`, 'expense', 10, `2026-05-${padDay}T10:00:00`),
      );
    }

    const result = calculateFinancialScore(txs);
    expect(result.spendingDays).toBe(26);
    expect(
      result.insights.some((i) => i.key === 'insightNoSpendChallenge'),
    ).toBe(true);
  });

  it('applies spending days penalty for 11 to 20 days', () => {
    const txs: Transaction[] = [
      createTx('inc', 'income', 50000, '2026-05-01T00:00:00'),
    ];
    for (let day = 1; day <= 12; day++) {
      const padDay = String(day).padStart(2, '0');
      txs.push(
        createTx(`exp_${day}`, 'expense', 10, `2026-05-${padDay}T10:00:00`),
      );
    }

    const result = calculateFinancialScore(txs);
    expect(result.spendingDays).toBe(12);
  });

  it('calculates historical streak accurately across prior consecutive months', () => {
    const txs: Transaction[] = [
      // 1 month ago (April 2026): Income 2000, Expense 1000 (Success)
      createTx('apr_inc', 'income', 2000, '2026-04-05T10:00:00'),
      createTx('apr_exp', 'expense', 1000, '2026-04-10T10:00:00'),
      // 2 months ago (March 2026): Income 1500, Expense 1500 (Success)
      createTx('mar_inc', 'income', 1500, '2026-03-05T10:00:00'),
      createTx('mar_exp', 'expense', 1500, '2026-03-10T10:00:00'),
      // 3 months ago (February 2026): Income 1000, Expense 2000 (Failure - breaks streak)
      createTx('feb_inc', 'income', 1000, '2026-02-05T10:00:00'),
      createTx('feb_exp', 'expense', 2000, '2026-02-10T10:00:00'),
      // 4 months ago (January 2026): Income 3000, Expense 1000 (Should not count due to break)
      createTx('jan_inc', 'income', 3000, '2026-01-05T10:00:00'),
      createTx('jan_exp', 'expense', 1000, '2026-01-10T10:00:00'),
    ];

    const result = calculateFinancialScore(txs);
    expect(result.streak).toBe(2);
  });
});
