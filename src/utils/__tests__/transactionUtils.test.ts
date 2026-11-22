import {
  calculateAdjustmentDifference,
  getAdjustmentSignedAmount,
  getTransactionBalanceModifier,
  isAdjustmentTransaction,
  isLegacyAdjustment,
  normalizeLegacyAdjustmentTransaction,
  roundCurrency,
} from '../transactionUtils';

describe('transactionUtils', () => {
  describe('roundCurrency & calculateAdjustmentDifference', () => {
    it('calculates positive adjustment difference (newBalance - currentBalance)', () => {
      expect(calculateAdjustmentDifference(1500, 1000)).toBe(500);
    });

    it('calculates negative adjustment difference (newBalance - currentBalance)', () => {
      expect(calculateAdjustmentDifference(750, 1000)).toBe(-250);
    });

    it('returns 0 when newBalance equals currentBalance', () => {
      expect(calculateAdjustmentDifference(1000, 1000)).toBe(0);
    });

    it('avoids floating-point inaccuracy on decimal values', () => {
      expect(calculateAdjustmentDifference(1250.55, 1000.1)).toBe(250.45);
      expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
    });
  });

  describe('isLegacyAdjustment & isAdjustmentTransaction', () => {
    it('identifies dedicated adjustment transaction type', () => {
      expect(
        isAdjustmentTransaction({
          type: 'adjustment',
          note: 'Custom reconciliation note',
        }),
      ).toBe(true);
      expect(
        isLegacyAdjustment({
          type: 'adjustment',
          note: 'Balance Adjustment',
        }),
      ).toBe(false);
    });

    it('identifies legacy English and Spanish balance adjustments for backward compatibility', () => {
      expect(
        isAdjustmentTransaction({
          type: 'income',
          note: 'Balance Adjustment',
        }),
      ).toBe(true);
      expect(
        isAdjustmentTransaction({
          type: 'expense',
          note: 'Ajuste de Saldo',
        }),
      ).toBe(true);
      expect(
        isLegacyAdjustment({
          type: 'income',
          note: 'Balance Adjustment',
        }),
      ).toBe(true);
    });

    it('returns false for standard income, expense, and transfer transactions', () => {
      expect(
        isAdjustmentTransaction({
          type: 'income',
          note: 'Monthly Salary',
        }),
      ).toBe(false);
      expect(
        isAdjustmentTransaction({
          type: 'expense',
          note: 'Groceries',
        }),
      ).toBe(false);
      expect(
        isAdjustmentTransaction({
          type: 'transfer',
          note: null,
        }),
      ).toBe(false);
    });
  });

  describe('getAdjustmentSignedAmount & getTransactionBalanceModifier', () => {
    it('returns signed amount directly for dedicated adjustment type', () => {
      expect(
        getAdjustmentSignedAmount({ type: 'adjustment', amount: 400 }),
      ).toBe(400);
      expect(
        getAdjustmentSignedAmount({ type: 'adjustment', amount: -250 }),
      ).toBe(-250);
    });

    it('returns signed amount for legacy income and expense adjustments', () => {
      expect(
        getAdjustmentSignedAmount({
          type: 'income',
          amount: 400,
          note: 'Balance Adjustment',
        }),
      ).toBe(400);
      expect(
        getAdjustmentSignedAmount({
          type: 'expense',
          amount: 250,
          note: 'Ajuste de Saldo',
        }),
      ).toBe(-250);
    });

    it('computes balance modifier for income, expense, adjustment, and transfer', () => {
      expect(getTransactionBalanceModifier('income', 500)).toBe(500);
      expect(getTransactionBalanceModifier('expense', 300)).toBe(-300);
      expect(getTransactionBalanceModifier('adjustment', 450)).toBe(450);
      expect(getTransactionBalanceModifier('adjustment', -150)).toBe(-150);
      expect(getTransactionBalanceModifier('transfer', 200)).toBe(0);
    });
  });

  describe('normalizeLegacyAdjustmentTransaction', () => {
    it('normalizes legacy income and expense adjustments to type adjustment', () => {
      const legacyInc = normalizeLegacyAdjustmentTransaction({
        id: '1',
        type: 'income',
        amount: 300,
        categoryId: null,
        accountId: 'acc-1',
        date: '2026-05-01T00:00:00.000',
        note: 'Balance Adjustment',
      });
      expect(legacyInc.type).toBe('adjustment');
      expect(legacyInc.amount).toBe(300);

      const legacyExp = normalizeLegacyAdjustmentTransaction({
        id: '2',
        type: 'expense',
        amount: 120,
        categoryId: null,
        accountId: 'acc-1',
        date: '2026-05-01T00:00:00.000',
        note: 'Ajuste de Saldo',
      });
      expect(legacyExp.type).toBe('adjustment');
      expect(legacyExp.amount).toBe(-120);
    });

    it('leaves non-legacy transactions untouched', () => {
      const standard = {
        id: '3',
        type: 'expense' as const,
        amount: 50,
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2026-05-01T00:00:00.000',
        note: 'Coffee',
      };
      expect(normalizeLegacyAdjustmentTransaction(standard)).toEqual(standard);
    });
  });
});
