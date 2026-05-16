import { StateCreator } from 'zustand';
import { getDb } from '../../db/schema';
import { Budget, Goal, Transaction, TransactionType } from '../types';
import type { AppStore } from '../useStore';

export interface TransactionsSlice {
  transactions: Transaction[];
  loadTransactions: (limit?: number) => void;
  loadFullData: () => void;
  addTransaction: (transaction: Transaction) => void;
  editTransaction: (transaction: Transaction) => void;
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
    const goals = db.getAllSync<Goal>(
      'SELECT id, name, targetAmount, currentAmount, color, icon, deadline, status, displayOrder FROM goals ORDER BY displayOrder ASC, name ASC',
    );
    const budgets = db.getAllSync<Budget>(
      'SELECT id, name, amount, color, categoryId, displayOrder FROM budgets ORDER BY displayOrder ASC, id ASC',
    );
    set({ transactions, goals, budgets });
    get().refreshAnalytics();
  },

  addTransaction: (transaction) => {
    const db = getDb();
    const isIncome = transaction.type === 'income';
    const amountModifier = isIncome ? transaction.amount : -transaction.amount;

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

    // Update account balances
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

    set((state) => {
      const updatedAccounts = state.accounts.map((acc) => {
        if (transaction.type === 'transfer' && transaction.toAccountId) {
          if (acc.id === transaction.accountId) {
            return {
              ...acc,
              currentBalance: acc.currentBalance - transaction.amount,
            };
          }
          if (acc.id === transaction.toAccountId) {
            return {
              ...acc,
              currentBalance: acc.currentBalance + transaction.amount,
            };
          }
        } else if (acc.id === transaction.accountId) {
          return {
            ...acc,
            currentBalance: acc.currentBalance + amountModifier,
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

    try {
      // Revert old transaction amount
      if (oldTransaction.type === 'transfer' && oldTransaction.toAccountId) {
        db.runSync(
          'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
          [oldTransaction.amount ?? 0, oldTransaction.accountId ?? ''],
        );
        db.runSync(
          'UPDATE accounts SET currentBalance = currentBalance - ? WHERE id = ?',
          [oldTransaction.amount ?? 0, oldTransaction.toAccountId ?? ''],
        );
      } else {
        const oldModifier =
          oldTransaction.type === 'income'
            ? -oldTransaction.amount
            : oldTransaction.amount;
        db.runSync(
          'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
          [oldModifier ?? 0, oldTransaction.accountId ?? ''],
        );
      }

      // Apply new transaction amount
      if (transaction.type === 'transfer' && transaction.toAccountId) {
        db.runSync(
          'UPDATE accounts SET currentBalance = currentBalance - ? WHERE id = ?',
          [transaction.amount ?? 0, transaction.accountId ?? ''],
        );
        db.runSync(
          'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
          [transaction.amount ?? 0, transaction.toAccountId ?? ''],
        );
      } else {
        const newModifier =
          transaction.type === 'income'
            ? transaction.amount
            : -transaction.amount;
        db.runSync(
          'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
          [newModifier ?? 0, transaction.accountId ?? ''],
        );
      }

      db.runSync(
        'UPDATE transactions SET type = ?, amount = ?, categoryId = ?, accountId = ?, budgetId = ?, date = ?, note = ?, toAccountId = ? WHERE id = ?',
        [
          transaction.type ?? '',
          transaction.amount ?? 0,
          transaction.categoryId ?? null,
          transaction.accountId ?? '',
          transaction.budgetId ?? null,
          transaction.date ?? '',
          transaction.note ?? null,
          transaction.toAccountId ?? null,
          transaction.id ?? '',
        ],
      );

      get().loadData();
      get().refreshAnalytics();
    } catch (error) {
      console.error('editTransaction Error:', error);
      throw error;
    }
  },

  deleteTransaction: (id, accountId, amount, type) => {
    const db = getDb();
    const isIncome = type === 'income';
    const amountModifier = isIncome ? -amount : amount;

    db.runSync('DELETE FROM transactions WHERE id = ?', [id ?? null]);

    const oldTransaction = get().transactions.find((t) => t.id === id);
    if (oldTransaction?.type === 'transfer' && oldTransaction.toAccountId) {
      db.runSync(
        'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
        [amount ?? 0, accountId ?? null],
      );
      db.runSync(
        'UPDATE accounts SET currentBalance = currentBalance - ? WHERE id = ?',
        [amount ?? 0, oldTransaction.toAccountId ?? null],
      );
    } else {
      db.runSync(
        'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
        [amountModifier ?? 0, accountId ?? null],
      );
    }

    set((state) => {
      const updatedAccounts = state.accounts.map((acc) => {
        if (oldTransaction?.type === 'transfer' && oldTransaction.toAccountId) {
          if (acc.id === accountId) {
            return {
              ...acc,
              currentBalance: acc.currentBalance + amount,
            };
          }
          if (acc.id === oldTransaction.toAccountId) {
            return {
              ...acc,
              currentBalance: acc.currentBalance - amount,
            };
          }
        } else if (acc.id === accountId) {
          return {
            ...acc,
            currentBalance: acc.currentBalance + amountModifier,
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
