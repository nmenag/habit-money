import { StateCreator } from 'zustand';
import { getDb } from '../../db/schema';
import { Account } from '../types';
import type { AppStore } from '../useStore';
import { ProductAnalyticsService } from '../../services/ProductAnalyticsService';

export interface AccountsSlice {
  accounts: Account[];
  addAccount: (account: Account) => void;
  editAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  updateAccountsOrder: (accounts: Account[]) => void;
}

export const createAccountsSlice: StateCreator<
  AppStore,
  [],
  [],
  AccountsSlice
> = (set, get) => ({
  accounts: [],

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

    const isFirstAccount = get().accounts.length === 0;
    if (isFirstAccount) {
      ProductAnalyticsService.logFirstAccountCreated().catch(() => {});
    }
    ProductAnalyticsService.logAccountCreated(account.type || 'unknown').catch(
      () => {},
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

    ProductAnalyticsService.logAccountUpdated(account.type || 'unknown').catch(
      () => {},
    );

    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === account.id ? account : a)),
    }));
  },

  deleteAccount: (id) => {
    const db = getDb();
    const account = get().accounts.find((a) => a.id === id);
    const accountType = account?.type || 'unknown';

    db.runSync('DELETE FROM accounts WHERE id = ?', [id ?? null]);

    ProductAnalyticsService.logAccountDeleted(accountType).catch(() => {});

    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      transactions: state.transactions.filter((t) => t.accountId !== id),
    }));
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
});
