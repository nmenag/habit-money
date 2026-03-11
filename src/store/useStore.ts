import { create } from 'zustand';
import { getDb } from '../database/schema';

export type AccountType = 'cash' | 'bank' | 'credit';
export type TransactionType = 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  color?: string | null;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string | null;
  color?: string | null;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  accountId: string;
  date: string;
  note?: string | null;
}

interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  isLoaded: boolean;

  loadData: () => void;
  addAccount: (account: Account) => void;
  editAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;

  addTransaction: (transaction: Transaction) => void;
  editTransaction: (transaction: Transaction) => void;
  deleteTransaction: (
    id: string,
    accountId: string,
    amount: number,
    type: TransactionType,
  ) => void;

  addCategory: (category: Category) => void;
  editCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  accounts: [],
  transactions: [],
  categories: [],
  isLoaded: false,

  loadData: () => {
    const db = getDb();
    const accounts = db.getAllSync<Account>('SELECT * FROM accounts');
    const transactions = db.getAllSync<Transaction>(
      'SELECT * FROM transactions ORDER BY date DESC',
    );
    const categories = db.getAllSync<Category>('SELECT * FROM categories');

    set({ accounts, transactions, categories, isLoaded: true });
  },

  addAccount: (account) => {
    const db = getDb();
    db.runSync(
      'INSERT INTO accounts (id, name, type, initialBalance, currentBalance, color) VALUES (?, ?, ?, ?, ?, ?)',
      [
        account.id ?? null,
        account.name ?? null,
        account.type ?? null,
        account.initialBalance ?? 0,
        account.currentBalance ?? 0,
        account.color ?? null,
      ],
    );
    set((state) => ({ accounts: [...state.accounts, account] }));
  },

  editAccount: (account) => {
    const db = getDb();
    db.runSync(
      'UPDATE accounts SET name = ?, type = ?, initialBalance = ?, currentBalance = ?, color = ? WHERE id = ?',
      [
        account.name ?? null,
        account.type ?? null,
        account.initialBalance ?? 0,
        account.currentBalance ?? 0,
        account.color ?? null,
        account.id ?? null,
      ],
    );
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === account.id ? account : a)),
    }));
  },

  deleteAccount: (id) => {
    const db = getDb();
    db.runSync('DELETE FROM accounts WHERE id = ?', [id ?? null]);
    // Associated transactions are cascade deleted via SQLite FK Constraints if enabled
    // But manual cleanup might be needed if PRAGMA foreign_keys = ON is not guaranteed, however we just reload data next time.
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      transactions: state.transactions.filter((t) => t.accountId !== id),
    }));
  },

  addTransaction: (transaction) => {
    const db = getDb();
    const isIncome = transaction.type === 'income';
    const amountModifier = isIncome ? transaction.amount : -transaction.amount;

    db.runSync(
      'INSERT INTO transactions (id, type, amount, categoryId, accountId, date, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        transaction.id ?? null,
        transaction.type ?? null,
        transaction.amount ?? 0,
        transaction.categoryId ?? null,
        transaction.accountId ?? null,
        transaction.date ?? null,
        transaction.note ?? null,
      ],
    );

    // Update account balance
    db.runSync(
      'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
      [amountModifier ?? 0, transaction.accountId ?? null],
    );

    // Quick reload directly via getting the state is faster,
    // but we can manually update local state for UI responsiveness
    set((state) => {
      const updatedAccounts = state.accounts.map((acc) => {
        if (acc.id === transaction.accountId) {
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
  },

  editTransaction: (transaction) => {
    const db = getDb();
    const oldTransaction = get().transactions.find(
      (t) => t.id === transaction.id,
    );
    if (!oldTransaction) return;

    // Revert old transaction amount
    const oldModifier =
      oldTransaction.type === 'income'
        ? -oldTransaction.amount
        : oldTransaction.amount;
    db.runSync(
      'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
      [oldModifier ?? 0, oldTransaction.accountId ?? null],
    );

    // Apply new transaction amount
    const newModifier =
      transaction.type === 'income' ? transaction.amount : -transaction.amount;
    db.runSync(
      'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
      [newModifier ?? 0, transaction.accountId ?? null],
    );

    db.runSync(
      'UPDATE transactions SET type = ?, amount = ?, categoryId = ?, accountId = ?, date = ?, note = ? WHERE id = ?',
      [
        transaction.type ?? null,
        transaction.amount ?? 0,
        transaction.categoryId ?? null,
        transaction.accountId ?? null,
        transaction.date ?? null,
        transaction.note ?? null,
        transaction.id ?? null,
      ],
    );

    get().loadData(); // Instead of manual state diffing, reload data when editing to ensure balance consistency
  },

  deleteTransaction: (id, accountId, amount, type) => {
    const db = getDb();
    const isIncome = type === 'income';
    const amountModifier = isIncome ? -amount : amount;

    db.runSync('DELETE FROM transactions WHERE id = ?', [id ?? null]);
    db.runSync(
      'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
      [amountModifier ?? 0, accountId ?? null],
    );

    set((state) => {
      const updatedAccounts = state.accounts.map((acc) => {
        if (acc.id === accountId) {
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
  },

  addCategory: (category) => {
    const db = getDb();
    db.runSync(
      'INSERT INTO categories (id, name, type, icon, color) VALUES (?, ?, ?, ?, ?)',
      [
        category.id ?? null,
        category.name ?? null,
        category.type ?? null,
        category.icon ?? null,
        category.color ?? null,
      ],
    );
    set((state) => ({ categories: [...state.categories, category] }));
  },

  editCategory: (category) => {
    const db = getDb();
    db.runSync(
      'UPDATE categories SET name = ?, type = ?, icon = ?, color = ? WHERE id = ?',
      [
        category.name ?? null,
        category.type ?? null,
        category.icon ?? null,
        category.color ?? null,
        category.id ?? null,
      ],
    );
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === category.id ? category : c,
      ),
    }));
  },

  deleteCategory: (id) => {
    const db = getDb();
    db.runSync('DELETE FROM categories WHERE id = ?', [id ?? null]);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },
}));
