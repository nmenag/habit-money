import {
  buildConvertedAdjustmentTransaction,
  calculateAdjustmentDifference,
  canConvertAdjustmentTo,
  getAdjustmentSignedAmount,
  getAllowedConversionType,
  getTransactionBalanceModifier,
  isAdjustmentTransaction,
  isLegacyAdjustment,
  normalizeLegacyAdjustmentTransaction,
  roundCurrency,
  sanitizeConvertedNote,
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

  describe('conversion helpers', () => {
    it('allows converting negative adjustments only to expense and positive adjustments only to income', () => {
      const negAdj = { type: 'adjustment', amount: -300 };
      const posAdj = { type: 'adjustment', amount: 500 };
      const normalExp = { type: 'expense', amount: 100 };

      expect(getAllowedConversionType(negAdj)).toBe('expense');
      expect(canConvertAdjustmentTo(negAdj, 'expense')).toBe(true);
      expect(canConvertAdjustmentTo(negAdj, 'income')).toBe(false);

      expect(getAllowedConversionType(posAdj)).toBe('income');
      expect(canConvertAdjustmentTo(posAdj, 'income')).toBe(true);
      expect(canConvertAdjustmentTo(posAdj, 'expense')).toBe(false);

      expect(getAllowedConversionType(normalExp)).toBeNull();
      expect(canConvertAdjustmentTo(normalExp, 'expense')).toBe(false);
    });

    it('sanitizes legacy adjustment notes when converting so converted transactions are not excluded from stats', () => {
      expect(sanitizeConvertedNote('Balance Adjustment')).toBeNull();
      expect(sanitizeConvertedNote('Ajuste de Saldo')).toBeNull();
      expect(sanitizeConvertedNote('   ')).toBeNull();
      expect(sanitizeConvertedNote('Supermarket')).toBe('Supermarket');
    });

    it('builds converted transaction preserving id, accountId, and magnitude of amount', () => {
      const negAdj = {
        id: 'tx-adj-neg',
        type: 'adjustment' as const,
        amount: -250,
        categoryId: null,
        accountId: 'acc-1',
        date: '2026-05-10T10:00:00.000',
        note: 'Balance Adjustment',
      };

      const converted = buildConvertedAdjustmentTransaction(negAdj, {
        id: 'tx-adj-neg',
        targetType: 'expense',
        categoryId: 'cat-food',
        budgetId: 'bud-food',
        date: '2026-05-11T10:00:00.000',
        note: 'Dinner with friends',
      });

      expect(converted).toEqual({
        id: 'tx-adj-neg',
        type: 'expense',
        amount: 250,
        categoryId: 'cat-food',
        accountId: 'acc-1',
        budgetId: 'bud-food',
        date: '2026-05-11T10:00:00.000',
        note: 'Dinner with friends',
        toAccountId: null,
      });
      expect(isAdjustmentTransaction(converted)).toBe(false);
    });

    it('throws error when attempting an invalid conversion direction or converting a non-adjustment', () => {
      const negAdj = {
        id: 'tx-adj-neg',
        type: 'adjustment' as const,
        amount: -250,
        categoryId: null,
        accountId: 'acc-1',
        date: '2026-05-10T10:00:00.000',
      };
      const normalTx = {
        id: 'tx-exp',
        type: 'expense' as const,
        amount: 100,
        categoryId: 'cat-1',
        accountId: 'acc-1',
        date: '2026-05-10T10:00:00.000',
      };

      expect(() =>
        buildConvertedAdjustmentTransaction(negAdj, {
          id: 'tx-adj-neg',
          targetType: 'income',
          categoryId: 'cat-salary',
        }),
      ).toThrow('Invalid conversion');

      expect(() =>
        buildConvertedAdjustmentTransaction(normalTx, {
          id: 'tx-exp',
          targetType: 'expense',
          categoryId: 'cat-1',
        }),
      ).toThrow('Transaction is not an adjustment');
    });
  });
});
