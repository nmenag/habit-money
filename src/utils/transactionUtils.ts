import { Transaction, TransactionType } from '../store/types';

export const LEGACY_ADJUSTMENT_NOTES = [
  'Balance Adjustment',
  'Ajuste de Saldo',
];

export const roundCurrency = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const calculateAdjustmentDifference = (
  newBalance: number,
  currentBalance: number,
): number => {
  return roundCurrency(newBalance - currentBalance);
};

export const isLegacyAdjustment = (tx: {
  type: string;
  note?: string | null;
}): boolean => {
  return (
    (tx.type === 'income' || tx.type === 'expense') &&
    Boolean(tx.note && LEGACY_ADJUSTMENT_NOTES.includes(tx.note))
  );
};

export const isAdjustmentTransaction = (tx: {
  type: string;
  note?: string | null;
}): boolean => {
  return tx.type === 'adjustment' || isLegacyAdjustment(tx);
};

export const getAdjustmentSignedAmount = (tx: {
  type: string;
  amount: number;
  note?: string | null;
}): number => {
  if (tx.type === 'adjustment') {
    return tx.amount;
  }
  if (tx.type === 'expense') {
    return -Math.abs(tx.amount);
  }
  return Math.abs(tx.amount);
};

export const getTransactionBalanceModifier = (
  type: TransactionType,
  amount: number,
): number => {
  if (type === 'income') {
    return amount;
  }
  if (type === 'adjustment') {
    return amount;
  }
  if (type === 'expense') {
    return -amount;
  }
  return 0;
};

export const normalizeLegacyAdjustmentTransaction = (
  tx: Transaction,
): Transaction => {
  if (isLegacyAdjustment(tx)) {
    return {
      ...tx,
      type: 'adjustment',
      amount:
        tx.type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount),
    };
  }
  return tx;
};
