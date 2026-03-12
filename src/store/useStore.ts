import * as Localization from 'expo-localization';
import { create } from 'zustand';
import { interstitialManager } from '../ads/InterstitialManager';
import { getDb } from '../database/schema';
import { Language, translations } from '../i18n/translations';

export type AccountType = 'cash' | 'bank' | 'credit';
export type TransactionType = 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  color?: string | null;
  currency: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string | null;
  color?: string | null;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  color?: string | null;
  categoryId?: string | null;
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
}

interface AppState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  language: Language;
  isLoaded: boolean;
  isPremiumUser: boolean;
  actionCounter: number;

  loadData: () => void;
  setLanguage: (lang: Language) => void;
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

  incrementActionCounter: () => void;
  checkAndShowAd: () => Promise<void>;
  formatCurrency: (amount: number, currencyCode?: string) => string;
}

export const useStore = create<AppState>((set, get) => ({
  accounts: [],
  transactions: [],
  categories: [],
  budgets: [],
  language: 'en',
  isLoaded: false,
  isPremiumUser: false,
  actionCounter: 0,

  loadData: () => {
    const db = getDb();
    const accounts = db.getAllSync<Account>('SELECT * FROM accounts');
    const transactions = db.getAllSync<Transaction>(
      'SELECT * FROM transactions ORDER BY date DESC',
    );
    const categories = db.getAllSync<Category>('SELECT * FROM categories');
    const budgets = db.getAllSync<Budget>('SELECT * FROM budgets');
    let currencySetting;
    let languageSetting;
    let premiumSetting;
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
    } catch (e) {
      console.warn('Could not load settings from DB:', e);
    }

    // Detect default language
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
      } catch (e) {
        console.warn('Localization native module not found, defaulting to en');
      }
    }

    set({
      accounts,
      transactions,
      categories,
      budgets,
      language: finalLanguage,
      isPremiumUser: premiumSetting?.val === 'true',
      isLoaded: true,
    });
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
  },

  addAccount: (account) => {
    const db = getDb();
    db.runSync(
      'INSERT INTO accounts (id, name, type, initialBalance, currentBalance, color, currency) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        account.id ?? null,
        account.name ?? null,
        account.type ?? null,
        account.initialBalance ?? 0,
        account.currentBalance ?? 0,
        account.color ?? null,
        account.currency ?? 'COP',
      ],
    );
    set((state) => ({ accounts: [...state.accounts, account] }));
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
      'INSERT INTO transactions (id, type, amount, categoryId, accountId, budgetId, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        transaction.id ?? '',
        transaction.type ?? '',
        transaction.amount ?? 0,
        transaction.categoryId ?? null,
        transaction.accountId ?? '',
        transaction.budgetId ?? null,
        transaction.date ?? '',
        transaction.note ?? null,
      ],
    );

    // Update account balance
    db.runSync(
      'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
      [amountModifier ?? 0, transaction.accountId ?? null],
    );

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

    get().incrementActionCounter();
    get().checkAndShowAd();
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
      const oldModifier =
        oldTransaction.type === 'income'
          ? -oldTransaction.amount
          : oldTransaction.amount;
      db.runSync(
        'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
        [oldModifier ?? 0, oldTransaction.accountId ?? ''],
      );

      // Apply new transaction amount
      const newModifier =
        transaction.type === 'income'
          ? transaction.amount
          : -transaction.amount;
      db.runSync(
        'UPDATE accounts SET currentBalance = currentBalance + ? WHERE id = ?',
        [newModifier ?? 0, transaction.accountId ?? ''],
      );

      db.runSync(
        'UPDATE transactions SET type = ?, amount = ?, categoryId = ?, accountId = ?, budgetId = ?, date = ?, note = ? WHERE id = ?',
        [
          transaction.type ?? '',
          transaction.amount ?? 0,
          transaction.categoryId ?? null,
          transaction.accountId ?? '',
          transaction.budgetId ?? null,
          transaction.date ?? '',
          transaction.note ?? null,
          transaction.id ?? '',
        ],
      );

      get().loadData();
      get().incrementActionCounter();
      get().checkAndShowAd();
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

    get().incrementActionCounter();
    get().checkAndShowAd();
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

  addBudget: (budget) => {
    const db = getDb();
    db.runSync(
      'INSERT INTO budgets (id, name, amount, color, categoryId) VALUES (?, ?, ?, ?, ?)',
      [
        budget.id ?? '',
        budget.name ?? '',
        budget.amount ?? 0,
        budget.color ?? null,
        budget.categoryId ?? null,
      ],
    );
    set((state) => ({ budgets: [...state.budgets, budget] }));
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

  formatCurrency: (amount: number, currencyCode?: string) => {
    const currency = currencyCode || 'COP';
    const symbols: { [key: string]: string } = {
      USD: '$',
      COP: '$',
      MXN: '$',
      EUR: '€',
    };
    const symbol = symbols[currency] || '$';

    if (currency === 'COP') {
      return `${symbol}${Math.round(amount)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
    }

    return `${symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
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
  return { t, language };
};
