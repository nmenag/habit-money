import * as Localization from 'expo-localization';
import { create } from 'zustand';
import { interstitialManager } from '../ads/InterstitialManager';
import { getDb } from '../db/schema';
import {
  getTranslatedName,
  Language,
  translations,
} from '../i18n/translations';
import { AnalyticsManager } from '../services/analytics/AnalyticsManager';
import { AnalyticsReport } from '../services/analytics/types';
import { DateRange, FilterType, getRangeForType } from '../utils/dateFilters';
import { getLocalDateString } from '../utils/dateUtils';
import { formatCurrency as formatCurrencyUtil } from '../utils/formatters';

export type AccountType = 'cash' | 'bank' | 'credit';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  color?: string | null;
  currency: string;
  displayOrder: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string | null;
  color?: string | null;
  displayOrder: number;
}

export interface Budget {
  id: string;
  name?: string;
  amount: number;
  color?: string | null;
  categoryId?: string | null;
  displayOrder: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string | null;
  accountId: string;
  budgetId?: string | null;
  date: string;
  note?: string | null;
  toAccountId?: string | null;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color?: string | null;
  icon?: string | null;
  deadline?: string | null;
  status: 'active' | 'completed';
  displayOrder: number;
}

interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  language: Language;
  currency: string;
  currencySymbol: string;
  themePreference: 'light' | 'dark' | 'system';
  isLoaded: boolean;
  isPremiumUser: boolean;
  actionCounter: number;
  analyticsReport: AnalyticsReport | null;
  selectedRange: DateRange;

  notificationsEnabled: boolean;
  notificationTime: string;

  loadData: () => void;
  loadFullData: () => void;
  loadTransactions: (limit?: number) => void;
  loadGoals: () => void;
  loadBudgets: () => void;
  setLanguage: (lang: Language) => void;
  setThemePreference: (theme: 'light' | 'dark' | 'system') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationTime: (time: string) => void;
  addAccount: (account: Account) => void;
  editAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  setPremium: (isPremium: boolean) => void;

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

  addBudget: (budget: Budget) => void;
  editBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id'>) => void;
  editGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;

  incrementActionCounter: () => void;
  checkAndShowAd: () => Promise<void>;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  refreshAnalytics: () => Promise<void>;
  updateAccountsOrder: (accounts: Account[]) => void;
  updateCategoriesOrder: (categories: Category[]) => void;
  updateBudgetsOrder: (budgets: Budget[]) => void;
  updateGoalsOrder: (goals: Goal[]) => void;
  setSelectedRange: (range: DateRange) => void;
  setFilterType: (type: FilterType) => void;
  clearFilter: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  accounts: [],
  transactions: [],
  categories: [],
  budgets: [],
  language: 'en',
  currency: 'COP',
  currencySymbol: '$',
  themePreference: 'system',
  isLoaded: false,
  isPremiumUser: false,
  actionCounter: 0,
  analyticsReport: null,
  notificationsEnabled: false,
  notificationTime: '20:00',
  goals: [],
  selectedRange: getRangeForType('month'),

  loadData: () => {
    const db = getDb();

    // 1. Fetch only essential settings and core entities for dashboard
    const accounts = db.getAllSync<Account>(
      'SELECT id, name, type, initialBalance, currentBalance, color, currency, displayOrder FROM accounts ORDER BY displayOrder ASC, name ASC',
    );
    const categories = db.getAllSync<Category>(
      'SELECT id, name, type, icon, color, displayOrder FROM categories ORDER BY displayOrder ASC, name ASC',
    );

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const dateLimit = getLocalDateString(twoMonthsAgo);

    const transactions = db.getAllSync<Transaction>(
      `SELECT id, type, amount, categoryId, accountId, budgetId, date, note, toAccountId
       FROM transactions
       WHERE date >= ?
       ORDER BY date DESC LIMIT 300`,
      [dateLimit],
    );

    let currencySetting;
    let languageSetting;
    let premiumSetting;
    let themeSetting;
    let notifEnabledSetting;
    let notifTimeSetting;
    let filterTypeSetting;
    let customStartSetting;
    let customEndSetting;
    try {
      currencySetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'currency'",
      );
      languageSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'language'",
      );
      premiumSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'premium'",
      );
      themeSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'themePreference'",
      );
      notifEnabledSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'notificationsEnabled'",
      );
      notifTimeSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'notificationTime'",
      );
      filterTypeSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'selectedFilterType'",
      );
      customStartSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'customStartDate'",
      );
      customEndSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'customEndDate'",
      );
    } catch (e) {
      console.warn('Could not load settings from DB:', e);
    }

    let finalLanguage: Language = 'en';
    if (languageSetting?.val) {
      finalLanguage = languageSetting.val as Language;
    } else {
      try {
        if (Localization && typeof Localization.getLocales === 'function') {
          const locales = Localization.getLocales();
          if (locales && locales.length > 0) {
            finalLanguage = locales[0].languageCode?.startsWith('es')
              ? 'es'
              : 'en';
          }
        }
      } catch {
        console.warn('Localization native module not found, defaulting to en');
      }
    }

    set({
      accounts,
      transactions,
      categories,
      language: finalLanguage,
      currency: currencySetting?.val || 'COP',
      currencySymbol: currencySetting?.val === 'EUR' ? '€' : '$',
      themePreference:
        (themeSetting?.val as 'light' | 'dark' | 'system') || 'system',
      isPremiumUser: premiumSetting?.val === 'true',
      notificationsEnabled: notifEnabledSetting?.val === 'true',
      notificationTime: notifTimeSetting?.val || '20:00',
      selectedRange: getRangeForType(
        (filterTypeSetting?.val as FilterType) || 'month',
        customStartSetting?.val ? new Date(customStartSetting.val) : undefined,
        customEndSetting?.val ? new Date(customEndSetting.val) : undefined,
      ),
      isLoaded: true,
    });

    // Defer loading of non-critical data
    setTimeout(() => {
      get().loadBudgets();
      get().loadGoals();
    }, 100);
  },

  loadTransactions: (limit = 1000) => {
    const db = getDb();
    const transactions = db.getAllSync<Transaction>(
      `SELECT id, type, amount, categoryId, accountId, budgetId, date, note, toAccountId FROM transactions ORDER BY date DESC LIMIT ${limit}`,
    );
    set({ transactions });
  },

  loadGoals: () => {
    const db = getDb();
    const goals = db.getAllSync<Goal>(
      'SELECT id, name, targetAmount, currentAmount, color, icon, deadline, status, displayOrder FROM goals ORDER BY displayOrder ASC',
    );
    set({ goals });
  },

  loadBudgets: () => {
    const db = getDb();
    const budgets = db.getAllSync<Budget>(
      'SELECT id, name, amount, color, categoryId, displayOrder FROM budgets ORDER BY displayOrder ASC',
    );
    set({ budgets });
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

  setLanguage: (lang: Language) => {
    set({ language: lang });
    try {
      const db = getDb();
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'language',
        lang,
      ]);
    } catch (error) {
      console.error('setLanguage DB Error:', error);
    }
    get().refreshAnalytics();
  },

  setThemePreference: (theme: 'light' | 'dark' | 'system') => {
    set({ themePreference: theme });
    try {
      const db = getDb();
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'themePreference',
        theme,
      ]);
    } catch (error) {
      console.error('setThemePreference DB Error:', error);
    }
  },

  setNotificationsEnabled: (enabled: boolean) => {
    set({ notificationsEnabled: enabled });
    try {
      const db = getDb();
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'notificationsEnabled',
        String(enabled),
      ]);
    } catch (error) {
      console.error('setNotificationsEnabled DB Error:', error);
    }
  },

  setNotificationTime: (time: string) => {
    set({ notificationTime: time });
    try {
      const db = getDb();
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'notificationTime',
        time,
      ]);
    } catch (error) {
      console.error('setNotificationTime DB Error:', error);
    }
  },

  addAccount: (account) => {
    const db = getDb();
    const maxOrder = db.getFirstSync<{ maxOrder: number }>(
      'SELECT MAX(displayOrder) as maxOrder FROM accounts',
    );
    const displayOrder = (maxOrder?.maxOrder || 0) + 1;

    db.runSync(
      'INSERT INTO accounts (id, name, type, initialBalance, currentBalance, color, currency, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        account.id ?? null,
        account.name ?? null,
        account.type ?? null,
        account.initialBalance ?? 0,
        account.currentBalance ?? 0,
        account.color ?? null,
        account.currency ?? 'COP',
        displayOrder,
      ],
    );
    set((state) => ({
      accounts: [...state.accounts, { ...account, displayOrder }],
    }));
  },

  editAccount: (account) => {
    const db = getDb();
    db.runSync(
      'UPDATE accounts SET name = ?, type = ?, initialBalance = ?, currentBalance = ?, color = ?, currency = ? WHERE id = ?',
      [
        account.name ?? null,
        account.type ?? null,
        account.initialBalance ?? 0,
        account.currentBalance ?? 0,
        account.color ?? null,
        account.currency ?? 'COP',
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
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      transactions: state.transactions.filter((t) => t.accountId !== id),
    }));
  },

  setPremium: (isPremium) => {
    set({ isPremiumUser: isPremium });
    try {
      const db = getDb();
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'premium',
        String(isPremium),
      ]);
    } catch (error) {
      console.error('setPremium DB Error:', error);
    }
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

    get().incrementActionCounter();
    get().checkAndShowAd();
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

      set((state) => {
        const updatedAccounts = state.accounts.map((acc) => {
          let balance = acc.currentBalance;

          if (
            oldTransaction.type === 'transfer' &&
            oldTransaction.toAccountId
          ) {
            if (acc.id === oldTransaction.accountId)
              balance += oldTransaction.amount;
            if (acc.id === oldTransaction.toAccountId)
              balance -= oldTransaction.amount;
          } else if (acc.id === oldTransaction.accountId) {
            const oldModifier =
              oldTransaction.type === 'income'
                ? -oldTransaction.amount
                : oldTransaction.amount;
            balance += oldModifier;
          }

          if (transaction.type === 'transfer' && transaction.toAccountId) {
            if (acc.id === transaction.accountId) balance -= transaction.amount;
            if (acc.id === transaction.toAccountId)
              balance += transaction.amount;
          } else if (acc.id === transaction.accountId) {
            const newModifier =
              transaction.type === 'income'
                ? transaction.amount
                : -transaction.amount;
            balance += newModifier;
          }

          return { ...acc, currentBalance: balance };
        });

        // 2. Update transactions state
        const updatedTransactions = state.transactions
          .map((t) => (t.id === transaction.id ? transaction : t))
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );

        return {
          accounts: updatedAccounts,
          transactions: updatedTransactions,
        };
      });

      get().incrementActionCounter();
      get().checkAndShowAd();
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

    get().incrementActionCounter();
    get().checkAndShowAd();
    get().refreshAnalytics();
  },

  addCategory: (category) => {
    const db = getDb();
    const maxOrder = db.getFirstSync<{ maxOrder: number }>(
      'SELECT MAX(displayOrder) as maxOrder FROM categories',
    );
    const displayOrder = (maxOrder?.maxOrder || 0) + 1;

    db.runSync(
      'INSERT INTO categories (id, name, type, icon, color, displayOrder) VALUES (?, ?, ?, ?, ?, ?)',
      [
        category.id ?? null,
        category.name ?? null,
        category.type ?? null,
        category.icon ?? null,
        category.color ?? null,
        displayOrder,
      ],
    );
    set((state) => ({
      categories: [...state.categories, { ...category, displayOrder }],
    }));
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

  addBudget: (budget) => {
    const db = getDb();
    const maxOrder = db.getFirstSync<{ maxOrder: number }>(
      'SELECT MAX(displayOrder) as maxOrder FROM budgets',
    );
    const displayOrder = (maxOrder?.maxOrder || 0) + 1;

    db.runSync(
      'INSERT INTO budgets (id, name, amount, color, categoryId, displayOrder) VALUES (?, ?, ?, ?, ?, ?)',
      [
        budget.id ?? '',
        budget.name ?? '',
        budget.amount ?? 0,
        budget.color ?? null,
        budget.categoryId ?? null,
        displayOrder,
      ],
    );
    set((state) => ({
      budgets: [...state.budgets, { ...budget, displayOrder }],
    }));
  },

  editBudget: (budget) => {
    const db = getDb();
    db.runSync(
      'UPDATE budgets SET name = ?, amount = ?, color = ?, categoryId = ? WHERE id = ?',
      [
        budget.name ?? '',
        budget.amount ?? 0,
        budget.color ?? null,
        budget.categoryId ?? null,
        budget.id ?? '',
      ],
    );
    set((state) => ({
      budgets: state.budgets.map((b) => (b.id === budget.id ? budget : b)),
    }));
  },

  deleteBudget: (id) => {
    const db = getDb();
    db.runSync('DELETE FROM budgets WHERE id = ?', [id ?? null]);
    set((state) => ({
      budgets: state.budgets.filter((b) => b.id !== id),
    }));
  },

  addGoal: (goalData) => {
    const db = getDb();
    const id = Math.random().toString(36).substring(2, 9);
    const maxOrder = db.getFirstSync<{ maxOrder: number }>(
      'SELECT MAX(displayOrder) as maxOrder FROM goals',
    );
    const displayOrder = (maxOrder?.maxOrder || 0) + 1;
    const goal: Goal = { ...goalData, id, displayOrder };

    db.runSync(
      'INSERT INTO goals (id, name, targetAmount, currentAmount, color, icon, deadline, status, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        goal.id,
        goal.name,
        goal.targetAmount,
        goal.currentAmount,
        goal.color ?? null,
        goal.icon ?? null,
        goal.deadline ?? null,
        goal.status,
        displayOrder,
      ],
    );
    set((state) => ({ goals: [...state.goals, goal] }));
  },

  editGoal: (goal) => {
    const db = getDb();
    db.runSync(
      'UPDATE goals SET name = ?, targetAmount = ?, currentAmount = ?, color = ?, icon = ?, deadline = ?, status = ? WHERE id = ?',
      [
        goal.name,
        goal.targetAmount,
        goal.currentAmount,
        goal.color ?? null,
        goal.icon ?? null,
        goal.deadline ?? null,
        goal.status,
        goal.id,
      ],
    );
    set((state) => ({
      goals: state.goals.map((g) => (g.id === goal.id ? goal : g)),
    }));
  },

  deleteGoal: (id) => {
    const db = getDb();
    db.runSync('DELETE FROM goals WHERE id = ?', [id]);
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    }));
  },

  contributeToGoal: (id, amount) => {
    const db = getDb();
    const goals = get().goals;
    const goal = goals.find((g) => g.id === id);
    if (goal) {
      const newAmount = goal.currentAmount + amount;
      const newStatus = newAmount >= goal.targetAmount ? 'completed' : 'active';
      db.runSync(
        'UPDATE goals SET currentAmount = ?, status = ? WHERE id = ?',
        [newAmount, newStatus, id],
      );
      set((state) => ({
        goals: state.goals.map((g) =>
          g.id === id
            ? { ...g, currentAmount: newAmount, status: newStatus }
            : g,
        ),
      }));
    }
  },

  formatCurrency: (amount: number, currencyCode?: string) => {
    const { language, currency: defaultCurrency } = get();
    return formatCurrencyUtil(
      amount,
      currencyCode || defaultCurrency,
      language,
    );
  },

  incrementActionCounter: () => {
    set((state) => ({ actionCounter: state.actionCounter + 1 }));
  },

  checkAndShowAd: async () => {
    const { actionCounter, isPremiumUser } = get();
    if (isPremiumUser) return;

    if (actionCounter >= 3) {
      await interstitialManager.show();
      set({ actionCounter: 0 });
    }
  },

  refreshAnalytics: async () => {
    try {
      const { language } = get();
      const report = await AnalyticsManager.generateFullReport(language);
      set({ analyticsReport: report });
    } catch (error) {
      console.error('refreshAnalytics Error:', error);
    }
  },

  updateAccountsOrder: (accounts) => {
    const db = getDb();
    db.withTransactionSync(() => {
      accounts.forEach((acc, index) => {
        db.runSync('UPDATE accounts SET displayOrder = ? WHERE id = ?', [
          index,
          acc.id,
        ]);
        acc.displayOrder = index;
      });
    });
    set({ accounts });
  },

  updateCategoriesOrder: (categories) => {
    const db = getDb();
    db.withTransactionSync(() => {
      categories.forEach((cat, index) => {
        db.runSync('UPDATE categories SET displayOrder = ? WHERE id = ?', [
          index,
          cat.id,
        ]);
        cat.displayOrder = index;
      });
    });
    set({ categories });
  },

  updateBudgetsOrder: (budgets) => {
    const db = getDb();
    db.withTransactionSync(() => {
      budgets.forEach((bud, index) => {
        db.runSync('UPDATE budgets SET displayOrder = ? WHERE id = ?', [
          index,
          bud.id,
        ]);
        bud.displayOrder = index;
      });
    });
    set({ budgets });
  },

  updateGoalsOrder: (goals) => {
    const db = getDb();
    db.withTransactionSync(() => {
      goals.forEach((goal, index) => {
        db.runSync('UPDATE goals SET displayOrder = ? WHERE id = ?', [
          index,
          goal.id,
        ]);
        goal.displayOrder = index;
      });
    });
    set({ goals });
  },

  setSelectedRange: (range: DateRange) => {
    set({ selectedRange: range });
    try {
      const db = getDb();
      db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
        'selectedFilterType',
        range.type,
      ]);
      if (range.type === 'custom') {
        db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
          'customStartDate',
          range.startDate.toISOString(),
        ]);
        db.runSync('INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)', [
          'customEndDate',
          range.endDate.toISOString(),
        ]);
      }
    } catch (error) {
      console.error('setSelectedRange DB Error:', error);
    }
  },

  setFilterType: (type: FilterType) => {
    const range = getRangeForType(type);
    get().setSelectedRange(range);
  },

  clearFilter: () => {
    get().setFilterType('allTime');
  },
}));

export const useTranslation = () => {
  const language = useStore((state) => state.language);
  const t = (
    key: keyof typeof translations.en,
    params?: Record<string, string | number>,
  ) => {
    const langSet = translations[language] || translations.en;
    let text = langSet[key] || translations.en[key] || String(key);

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, String(v));
      });
    }

    return text;
  };

  const translateName = (name: string) => {
    return getTranslatedName(name, language);
  };

  return { t, language, translateName };
};
