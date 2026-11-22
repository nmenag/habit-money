import { StateCreator } from 'zustand';
import { getDb } from '../../db/schema';
import { Budget, Transaction, TransactionType } from '../types';
import type { AppStore } from '../useStore';
import { ProductAnalyticsService } from '../../services/ProductAnalyticsService';
import {
  buildConvertedAdjustmentTransaction,
  canConvertAdjustmentTo,
  ConvertAdjustmentInput,
  getTransactionBalanceModifier,
  isAdjustmentTransaction,
  roundCurrency,
  sanitizeConvertedNote,
} from '../../utils/transactionUtils';

export interface TransactionsSlice {
  transactions: Transaction[];
  loadTransactions: (limit?: number) => void;
  loadFullData: () => void;
  addTransaction: (transaction: Transaction) => void;
  editTransaction: (transaction: Transaction) => void;
  convertAdjustmentTransaction: (
    input: ConvertAdjustmentInput,
  ) => Transaction | null;
  deleteTransaction: (
    id: string,
    accountId: string,
    amount: number,
    type: TransactionType,
  ) => void;
}

export const createTransactionsSlice: StateCreator<
  AppStore,
  [],
  [],
  TransactionsSlice
> = (set, get) => ({
  transactions: [],

  loadTransactions: (limit = 1000) => {
    const db = getDb();
    const transactions = db.getAllSync<Transaction>(
      `SELECT id, type, amount, categoryId, accountId, budgetId, date, note, toAccountId FROM transactions ORDER BY date DESC LIMIT ${limit}`,
    );
    set({ transactions });
  },

  loadFullData: () => {
    const db = getDb();
    const transactions = db.getAllSync<Transaction>(
      'SELECT id, type, amount, categoryId, accountId, budgetId, date, note, toAccountId FROM transactions ORDER BY date DESC',
    );
    const budgets = db.getAllSync<Budget>(
      'SELECT id, name, amount, color, categoryId, displayOrder FROM budgets ORDER BY displayOrder ASC, id ASC',
    );
    set({ transactions, budgets });
    get().refreshAnalytics();
  },

  addTransaction: (transaction) => {
    const db = getDb();
    const amountModifier = getTransactionBalanceModifier(
      transaction.type,
      transaction.amount,
    );

    const isFirstTransaction = get().transactions.length === 0;
    if (isFirstTransaction) {
      ProductAnalyticsService.logFirstTransactionCreated().catch(() => {});
    }
    ProductAnalyticsService.logTransactionCreated(
      transaction.type || 'expense',
    ).catch(() => {});

    db.withTransactionSync(() => {
      db.runSync(
        'INSERT INTO transactions (id, type, amount, categoryId, accountId, budgetId, date, note, toAccountId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          transaction.id ?? '',
          transaction.type ?? '',
          transaction.amount ?? 0,
          transaction.categoryId ?? null,
          transaction.accountId ?? '',
          transaction.budgetId ?? null,
          transaction.date ?? '',
          transaction.note ?? null,
          transaction.toAccountId ?? null,
        ],
      );

      if (transaction.type === 'transfer' && transaction.toAccountId) {
        db.runSync(
          'UPDATE accounts SET currentBalance = currentBalance - ? WHERE id = ?',
          [transaction.amount ?? 0, transaction.accountId ?? null],
        );
        db.runSync(
          'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
          [transaction.amount ?? 0, transaction.toAccountId ?? null],
        );
      } else {
        db.runSync(
          'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
          [amountModifier ?? 0, transaction.accountId ?? null],
        );
      }
    });

    set((state) => {
      const updatedAccounts = state.accounts.map((acc) => {
        if (transaction.type === 'transfer' && transaction.toAccountId) {
          if (acc.id === transaction.accountId) {
            return {
              ...acc,
              currentBalance: roundCurrency(
                acc.currentBalance - transaction.amount,
              ),
            };
          }
          if (acc.id === transaction.toAccountId) {
            return {
              ...acc,
              currentBalance: roundCurrency(
                acc.currentBalance + transaction.amount,
              ),
            };
          }
        } else if (acc.id === transaction.accountId) {
          return {
            ...acc,
            currentBalance: roundCurrency(acc.currentBalance + amountModifier),
          };
        }
        return acc;
      });
      return {
        transactions: [transaction, ...state.transactions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
        accounts: updatedAccounts,
      };
    });

    get().refreshAnalytics();
  },

  editTransaction: (transaction) => {
    const db = getDb();
    const oldTransaction = get().transactions.find(
      (t) => t.id === transaction.id,
    );
    if (!oldTransaction) {
      console.error(
        'editTransaction: Old transaction not found',
        transaction.id,
      );
      return;
    }

    const isConvertingFromAdjustment =
      isAdjustmentTransaction(oldTransaction) &&
      (transaction.type === 'income' || transaction.type === 'expense') &&
      !isAdjustmentTransaction(transaction);

    if (
      isConvertingFromAdjustment &&
      (transaction.type === 'income' || transaction.type === 'expense')
    ) {
      if (!canConvertAdjustmentTo(oldTransaction, transaction.type)) {
        console.error(
          'editTransaction: Invalid adjustment conversion direction',
          oldTransaction.id,
        );
        return;
      }
    }

    const normalizedTransaction: Transaction = isConvertingFromAdjustment
      ? {
          ...transaction,
          accountId: oldTransaction.accountId,
          amount: Math.abs(oldTransaction.amount),
          note: sanitizeConvertedNote(transaction.note),
          toAccountId: null,
        }
      : transaction;

    ProductAnalyticsService.logTransactionUpdated(
      normalizedTransaction.type || 'expense',
    ).catch(() => {});

    try {
      const oldModifier = -getTransactionBalanceModifier(
        oldTransaction.type,
        oldTransaction.amount,
      );
      const newModifier = getTransactionBalanceModifier(
        normalizedTransaction.type,
        normalizedTransaction.amount,
      );

      db.withTransactionSync(() => {
        if (!isConvertingFromAdjustment) {
          if (
            oldTransaction.type === 'transfer' &&
            oldTransaction.toAccountId
          ) {
            db.runSync(
              'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
              [oldTransaction.amount ?? 0, oldTransaction.accountId ?? ''],
            );
            db.runSync(
              'UPDATE accounts SET currentBalance = currentBalance - ? WHERE id = ?',
              [oldTransaction.amount ?? 0, oldTransaction.toAccountId ?? ''],
            );
          } else {
            db.runSync(
              'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
              [oldModifier ?? 0, oldTransaction.accountId ?? ''],
            );
          }

          if (
            normalizedTransaction.type === 'transfer' &&
            normalizedTransaction.toAccountId
          ) {
            db.runSync(
              'UPDATE accounts SET currentBalance = currentBalance - ? WHERE id = ?',
              [
                normalizedTransaction.amount ?? 0,
                normalizedTransaction.accountId ?? '',
              ],
            );
            db.runSync(
              'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
              [
                normalizedTransaction.amount ?? 0,
                normalizedTransaction.toAccountId ?? '',
              ],
            );
          } else {
            db.runSync(
              'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
              [newModifier ?? 0, normalizedTransaction.accountId ?? ''],
            );
          }
        }

        db.runSync(
          'UPDATE transactions SET type = ?, amount = ?, categoryId = ?, accountId = ?, budgetId = ?, date = ?, note = ?, toAccountId = ? WHERE id = ?',
          [
            normalizedTransaction.type ?? '',
            normalizedTransaction.amount ?? 0,
            normalizedTransaction.categoryId ?? null,
            normalizedTransaction.accountId ?? '',
            normalizedTransaction.budgetId ?? null,
            normalizedTransaction.date ?? '',
            normalizedTransaction.note ?? null,
            normalizedTransaction.toAccountId ?? null,
            normalizedTransaction.id ?? '',
          ],
        );
      });

      const prevAccounts = get().accounts;
      const prevTransactions = get().transactions;

      get().loadData();

      set((state) => {
        const baseAccounts =
          state.accounts.length > 0 ? state.accounts : prevAccounts;
        const baseTransactions =
          state.transactions.length > 0 ? state.transactions : prevTransactions;

        let updatedAccounts = baseAccounts;
        if (!isConvertingFromAdjustment) {
          const revertedAccounts = baseAccounts.map((acc) => {
            if (
              oldTransaction.type === 'transfer' &&
              oldTransaction.toAccountId
            ) {
              if (acc.id === oldTransaction.accountId) {
                return {
                  ...acc,
                  currentBalance: roundCurrency(
                    acc.currentBalance + oldTransaction.amount,
                  ),
                };
              }
              if (acc.id === oldTransaction.toAccountId) {
                return {
                  ...acc,
                  currentBalance: roundCurrency(
                    acc.currentBalance - oldTransaction.amount,
                  ),
                };
              }
            } else if (acc.id === oldTransaction.accountId) {
              return {
                ...acc,
                currentBalance: roundCurrency(acc.currentBalance + oldModifier),
              };
            }
            return acc;
          });

          updatedAccounts = revertedAccounts.map((acc) => {
            if (
              normalizedTransaction.type === 'transfer' &&
              normalizedTransaction.toAccountId
            ) {
              if (acc.id === normalizedTransaction.accountId) {
                return {
                  ...acc,
                  currentBalance: roundCurrency(
                    acc.currentBalance - normalizedTransaction.amount,
                  ),
                };
              }
              if (acc.id === normalizedTransaction.toAccountId) {
                return {
                  ...acc,
                  currentBalance: roundCurrency(
                    acc.currentBalance + normalizedTransaction.amount,
                  ),
                };
              }
            } else if (acc.id === normalizedTransaction.accountId) {
              return {
                ...acc,
                currentBalance: roundCurrency(acc.currentBalance + newModifier),
              };
            }
            return acc;
          });
        }

        const updatedTransactions = baseTransactions
          .map((t) =>
            t.id === normalizedTransaction.id ? normalizedTransaction : t,
          )
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );

        return {
          accounts: updatedAccounts,
          transactions: updatedTransactions,
        };
      });

      get().refreshAnalytics();
    } catch (error) {
      console.error('editTransaction Error:', error);
      throw error;
    }
  },

  convertAdjustmentTransaction: (input) => {
    const db = getDb();
    const existingTx = get().transactions.find((t) => t.id === input.id);
    if (!existingTx) {
      console.error(
        'convertAdjustmentTransaction: Transaction not found',
        input.id,
      );
      return null;
    }

    if (!isAdjustmentTransaction(existingTx)) {
      console.error(
        'convertAdjustmentTransaction: Transaction is not an adjustment',
        input.id,
      );
      return null;
    }

    if (!canConvertAdjustmentTo(existingTx, input.targetType)) {
      console.error(
        'convertAdjustmentTransaction: Invalid conversion target type',
        input.targetType,
      );
      return null;
    }

    const convertedTx = buildConvertedAdjustmentTransaction(existingTx, input);

    ProductAnalyticsService.logTransactionUpdated(convertedTx.type).catch(
      () => {},
    );

    db.withTransactionSync(() => {
      db.runSync(
        'UPDATE transactions SET type = ?, amount = ?, categoryId = ?, accountId = ?, budgetId = ?, date = ?, note = ?, toAccountId = ? WHERE id = ?',
        [
          convertedTx.type,
          convertedTx.amount,
          convertedTx.categoryId ?? null,
          convertedTx.accountId,
          convertedTx.budgetId ?? null,
          convertedTx.date,
          convertedTx.note ?? null,
          null,
          convertedTx.id,
        ],
      );
    });

    set((state) => ({
      transactions: state.transactions
        .map((t) => (t.id === convertedTx.id ? convertedTx : t))
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    }));

    get().refreshAnalytics();
    return convertedTx;
  },

  deleteTransaction: (id, accountId, amount, type) => {
    const db = getDb();
    const oldTransaction = get().transactions.find((t) => t.id === id);
    const effectiveType = oldTransaction?.type || type;
    const effectiveAmount = oldTransaction?.amount ?? amount;
    const amountModifier = -getTransactionBalanceModifier(
      effectiveType,
      effectiveAmount,
    );

    ProductAnalyticsService.logTransactionDeleted(
      effectiveType || 'expense',
    ).catch(() => {});

    db.withTransactionSync(() => {
      db.runSync('DELETE FROM transactions WHERE id = ?', [id ?? null]);

      if (oldTransaction?.type === 'transfer' && oldTransaction.toAccountId) {
        db.runSync(
          'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
          [effectiveAmount ?? 0, accountId ?? null],
        );
        db.runSync(
          'UPDATE accounts SET currentBalance = currentBalance - ? WHERE id = ?',
          [effectiveAmount ?? 0, oldTransaction.toAccountId ?? null],
        );
      } else {
        db.runSync(
          'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
          [amountModifier ?? 0, accountId ?? null],
        );
      }
    });

    set((state) => {
      const updatedAccounts = state.accounts.map((acc) => {
        if (oldTransaction?.type === 'transfer' && oldTransaction.toAccountId) {
          if (acc.id === accountId) {
            return {
              ...acc,
              currentBalance: roundCurrency(
                acc.currentBalance + effectiveAmount,
              ),
            };
          }
          if (acc.id === oldTransaction.toAccountId) {
            return {
              ...acc,
              currentBalance: roundCurrency(
                acc.currentBalance - effectiveAmount,
              ),
            };
          }
        } else if (acc.id === accountId) {
          return {
            ...acc,
            currentBalance: roundCurrency(acc.currentBalance + amountModifier),
          };
        }
        return acc;
      });
      return {
        transactions: state.transactions.filter((t) => t.id !== id),
        accounts: updatedAccounts,
      };
    });

    get().refreshAnalytics();
  },
});
