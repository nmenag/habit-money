import { Transaction, TransactionType } from '../store/types';

export const LEGACY_ADJUSTMENT_NOTES = [
  'Balance Adjustment',
  'Ajuste de Saldo',
];

export interface ConvertAdjustmentInput {
  id: string;
  targetType: 'income' | 'expense';
  categoryId: string | null;
  date?: string;
  note?: string | null;
  budgetId?: string | null;
}

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

export const getAllowedConversionType = (tx: {
  type: string;
  amount: number;
  note?: string | null;
}): 'income' | 'expense' | null => {
  if (!isAdjustmentTransaction(tx)) {
    return null;
  }
  const signedAmount = getAdjustmentSignedAmount(tx);
  if (signedAmount > 0) {
    return 'income';
  }
  if (signedAmount < 0) {
    return 'expense';
  }
  return null;
};

export const canConvertAdjustmentTo = (
  tx: {
    type: string;
    amount: number;
    note?: string | null;
  },
  targetType: 'income' | 'expense',
): boolean => {
  return getAllowedConversionType(tx) === targetType;
};

export const sanitizeConvertedNote = (note?: string | null): string | null => {
  if (!note) {
    return null;
  }
  const trimmed = note.trim();
  if (!trimmed || LEGACY_ADJUSTMENT_NOTES.includes(trimmed)) {
    return null;
  }
  return trimmed;
};

export const buildConvertedAdjustmentTransaction = (
  tx: Transaction,
  input: ConvertAdjustmentInput,
): Transaction => {
  if (!isAdjustmentTransaction(tx)) {
    throw new Error('Transaction is not an adjustment');
  }
  if (!canConvertAdjustmentTo(tx, input.targetType)) {
    throw new Error(
      `Invalid conversion: cannot convert adjustment with signed amount ${getAdjustmentSignedAmount(tx)} to ${input.targetType}`,
    );
  }

  const preservedAmount = Math.abs(getAdjustmentSignedAmount(tx));
  const resolvedNote =
    input.note !== undefined
      ? sanitizeConvertedNote(input.note)
      : sanitizeConvertedNote(tx.note);

  return {
    id: tx.id,
    type: input.targetType,
    amount: preservedAmount,
    categoryId: input.categoryId ?? null,
    accountId: tx.accountId,
    budgetId: input.targetType === 'expense' ? (input.budgetId ?? null) : null,
    date: input.date || tx.date,
    note: resolvedNote,
    toAccountId: null,
  };
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
