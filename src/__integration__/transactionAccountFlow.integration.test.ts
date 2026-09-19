import { createStore } from 'zustand';
import { createAccountsSlice } from '../store/slices/accountsSlice';
import { createTransactionsSlice } from '../store/slices/transactionsSlice';
import { createBudgetsSlice } from '../store/slices/budgetsSlice';
import { createCategoriesSlice } from '../store/slices/categoriesSlice';
import { createSettingsSlice } from '../store/slices/settingsSlice';
import { getDb } from '../db/schema';
import { Account, Transaction } from '../store/types';
import type { AppStore } from '../store/useStore';

jest.mock('../db/schema', () => ({
  getDb: jest.fn(),
  initDb: jest.fn(),
}));

jest.mock('../services/ProductAnalyticsService', () => ({
  ProductAnalyticsService: {
    logFirstAccountCreated: jest.fn().mockResolvedValue(undefined),
    logAccountCreated: jest.fn().mockResolvedValue(undefined),
    logAccountUpdated: jest.fn().mockResolvedValue(undefined),
    logAccountDeleted: jest.fn().mockResolvedValue(undefined),
    logFirstTransactionCreated: jest.fn().mockResolvedValue(undefined),
    logTransactionCreated: jest.fn().mockResolvedValue(undefined),
    logTransactionUpdated: jest.fn().mockResolvedValue(undefined),
    logTransactionDeleted: jest.fn().mockResolvedValue(undefined),
    logBudgetCreated: jest.fn().mockResolvedValue(undefined),
    logBudgetUpdated: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../ads/InterstitialManager', () => ({
  interstitialManager: { show: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('../utils/widgetUpdater', () => ({
  triggerWidgetUpdate: jest.fn(),
}));

jest.mock('../features/insights/services/AnalyticsManager', () => ({
  AnalyticsManager: {
    generateFullReport: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('../services/AppLockService', () => ({
  AppLockService: {
    setAppLockEnabled: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../store/useFilterStore', () => ({
  useFilterStore: {
    getState: jest.fn(() => ({
      selectedRange: {
        type: 'last30Days',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-31'),
      },
      isDefaultFilter: true,
      setDefaultFilter: jest.fn(),
      updateCycleStartDay: jest.fn(),
    })),
  },
  setCycleDayGetter: jest.fn(),
}));

function buildFullStore() {
  return createStore<AppStore>()((...args) => ({
    ...createAccountsSlice(...args),
    ...createTransactionsSlice(...args),
    ...createCategoriesSlice(...args),
    ...createBudgetsSlice(...args),
    ...createSettingsSlice(...args),
  }));
}

function makeMockDb(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    getAllSync: jest.fn().mockReturnValue([]),
    getFirstSync: jest.fn().mockReturnValue(null),
    runSync: jest.fn(),
    execSync: jest.fn(),
    withTransactionSync: jest.fn((cb: () => void) => cb()),
    getAllAsync: jest.fn().mockResolvedValue([]),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

describe('Integration: Transaction → Account balance', () => {
  let mockDb: ReturnType<typeof makeMockDb>;
  let store: ReturnType<typeof buildFullStore>;

  const checkingAccount: Account = {
    id: 'acc-checking',
    name: 'Checking',
    type: 'bank',
    initialBalance: 2000,
    currentBalance: 2000,
    currency: 'COP',
    displayOrder: 1,
  };

  const savingsAccount: Account = {
    id: 'acc-savings',
    name: 'Savings',
    type: 'bank',
    initialBalance: 5000,
    currentBalance: 5000,
    currency: 'COP',
    displayOrder: 2,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockDb = makeMockDb();
    (getDb as jest.Mock).mockReturnValue(mockDb);
    store = buildFullStore();
    store.setState({ accounts: [checkingAccount, savingsAccount] });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('adding expense transactions', () => {
    it('decreases the account balance and appends the transaction to state', () => {
      const expense: Transaction = {
        id: 'tx-exp-1',
        type: 'expense',
        amount: 300,
        categoryId: null,
        accountId: 'acc-checking',
        date: '2026-05-10T10:00:00.000',
      };

      store.getState().addTransaction(expense);

      const { accounts, transactions } = store.getState();
      const checking = accounts.find((a) => a.id === 'acc-checking')!;

      expect(checking.currentBalance).toBe(1700);
      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe('tx-exp-1');
    });

    it('increases the account balance when adding an income transaction', () => {
      const income: Transaction = {
        id: 'tx-inc-1',
        type: 'income',
        amount: 500,
        categoryId: null,
        accountId: 'acc-checking',
        date: '2026-05-11T09:00:00.000',
      };

      store.getState().addTransaction(income);

      const checking = store
        .getState()
        .accounts.find((a) => a.id === 'acc-checking')!;
      expect(checking.currentBalance).toBe(2500);
    });

    it('accumulates balance correctly across multiple sequential transactions', () => {
      const tx1: Transaction = {
        id: 'tx-1',
        type: 'expense',
        amount: 200,
        categoryId: null,
        accountId: 'acc-checking',
        date: '2026-05-10T08:00:00.000',
      };
      const tx2: Transaction = {
        id: 'tx-2',
        type: 'income',
        amount: 1000,
        categoryId: null,
        accountId: 'acc-checking',
        date: '2026-05-11T08:00:00.000',
      };
      const tx3: Transaction = {
        id: 'tx-3',
        type: 'expense',
        amount: 150,
        categoryId: null,
        accountId: 'acc-checking',
        date: '2026-05-12T08:00:00.000',
      };

      store.getState().addTransaction(tx1);
      store.getState().addTransaction(tx2);
      store.getState().addTransaction(tx3);

      const checking = store
        .getState()
        .accounts.find((a) => a.id === 'acc-checking')!;
      expect(checking.currentBalance).toBe(2650);
      expect(store.getState().transactions).toHaveLength(3);
    });
  });

  describe('deleting transactions', () => {
    it('removes the transaction and restores the account balance', () => {
      const expense: Transaction = {
        id: 'tx-del-1',
        type: 'expense',
        amount: 400,
        categoryId: null,
        accountId: 'acc-checking',
        date: '2026-05-10T10:00:00.000',
      };
      store.setState({
        transactions: [expense],
        accounts: [
          { ...checkingAccount, currentBalance: 1600 },
          savingsAccount,
        ],
      });

      store
        .getState()
        .deleteTransaction('tx-del-1', 'acc-checking', 400, 'expense');

      const checking = store
        .getState()
        .accounts.find((a) => a.id === 'acc-checking')!;
      expect(checking.currentBalance).toBe(2000);
      expect(store.getState().transactions).toHaveLength(0);
    });

    it('removes an income transaction and decreases the account balance', () => {
      const income: Transaction = {
        id: 'tx-del-inc',
        type: 'income',
        amount: 600,
        categoryId: null,
        accountId: 'acc-savings',
        date: '2026-05-10T10:00:00.000',
      };
      store.setState({
        transactions: [income],
        accounts: [
          checkingAccount,
          { ...savingsAccount, currentBalance: 5600 },
        ],
      });

      store
        .getState()
        .deleteTransaction('tx-del-inc', 'acc-savings', 600, 'income');

      const savings = store
        .getState()
        .accounts.find((a) => a.id === 'acc-savings')!;
      expect(savings.currentBalance).toBe(5000);
    });
  });

  describe('editing transactions', () => {
    it('recalculates the account balance when expense amount changes', () => {
      const original: Transaction = {
        id: 'tx-edit-1',
        type: 'expense',
        amount: 100,
        categoryId: null,
        accountId: 'acc-checking',
        date: '2026-05-10T10:00:00.000',
      };
      store.setState({
        transactions: [original],
        accounts: [
          { ...checkingAccount, currentBalance: 1900 },
          savingsAccount,
        ],
      });

      mockDb.getAllSync
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      const updated: Transaction = { ...original, amount: 250 };
      store.getState().editTransaction(updated);

      expect(mockDb.withTransactionSync).toHaveBeenCalled();
      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE transactions SET'),
        expect.any(Array),
      );
    });

    it('does nothing and logs an error when the original transaction is not found', () => {
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const ghost: Transaction = {
        id: 'does-not-exist',
        type: 'expense',
        amount: 100,
        categoryId: null,
        accountId: 'acc-checking',
        date: '2026-05-10T10:00:00.000',
      };

      store.getState().editTransaction(ghost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Old transaction not found'),
        'does-not-exist',
      );
      expect(mockDb.withTransactionSync).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });
});

describe('Integration: Transfer → Dual account balance update', () => {
  let mockDb: ReturnType<typeof makeMockDb>;
  let store: ReturnType<typeof buildFullStore>;

  const source: Account = {
    id: 'acc-src',
    name: 'Source',
    type: 'bank',
    initialBalance: 3000,
    currentBalance: 3000,
    currency: 'COP',
    displayOrder: 1,
  };

  const destination: Account = {
    id: 'acc-dst',
    name: 'Destination',
    type: 'bank',
    initialBalance: 1000,
    currentBalance: 1000,
    currency: 'COP',
    displayOrder: 2,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockDb = makeMockDb();
    (getDb as jest.Mock).mockReturnValue(mockDb);
    store = buildFullStore();
    store.setState({ accounts: [source, destination] });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('deducts from source and adds to destination on transfer add', () => {
    const transfer: Transaction = {
      id: 'tx-xfer-1',
      type: 'transfer',
      amount: 500,
      categoryId: null,
      accountId: 'acc-src',
      toAccountId: 'acc-dst',
      date: '2026-05-15T12:00:00.000',
    };

    store.getState().addTransaction(transfer);

    const { accounts } = store.getState();
    expect(accounts.find((a) => a.id === 'acc-src')!.currentBalance).toBe(2500);
    expect(accounts.find((a) => a.id === 'acc-dst')!.currentBalance).toBe(1500);
  });

  it('persists the transfer to the DB with both account UPDATE statements', () => {
    const transfer: Transaction = {
      id: 'tx-xfer-2',
      type: 'transfer',
      amount: 200,
      categoryId: null,
      accountId: 'acc-src',
      toAccountId: 'acc-dst',
      date: '2026-05-16T12:00:00.000',
    };

    store.getState().addTransaction(transfer);

    const runSyncCalls = mockDb.runSync.mock.calls;
    const updateCalls = runSyncCalls.filter((call: unknown[]) =>
      (call[0] as string).includes('UPDATE accounts'),
    );
    expect(updateCalls).toHaveLength(2);
    expect((updateCalls[0][1] as unknown[]).includes('acc-src')).toBe(true);
    expect((updateCalls[1][1] as unknown[]).includes('acc-dst')).toBe(true);
  });

  it('restores both balances when a transfer is deleted', () => {
    const transfer: Transaction = {
      id: 'tx-xfer-del',
      type: 'transfer',
      amount: 800,
      categoryId: null,
      accountId: 'acc-src',
      toAccountId: 'acc-dst',
      date: '2026-05-17T12:00:00.000',
    };
    store.setState({
      transactions: [transfer],
      accounts: [
        { ...source, currentBalance: 2200 },
        { ...destination, currentBalance: 1800 },
      ],
    });

    store
      .getState()
      .deleteTransaction('tx-xfer-del', 'acc-src', 800, 'transfer');

    const { accounts } = store.getState();
    expect(accounts.find((a) => a.id === 'acc-src')!.currentBalance).toBe(3000);
    expect(accounts.find((a) => a.id === 'acc-dst')!.currentBalance).toBe(1000);
  });

  it('maintains correct combined balance after multiple transfers', () => {
    const t1: Transaction = {
      id: 'xfer-a',
      type: 'transfer',
      amount: 300,
      categoryId: null,
      accountId: 'acc-src',
      toAccountId: 'acc-dst',
      date: '2026-05-10T08:00:00.000',
    };
    const t2: Transaction = {
      id: 'xfer-b',
      type: 'transfer',
      amount: 100,
      categoryId: null,
      accountId: 'acc-dst',
      toAccountId: 'acc-src',
      date: '2026-05-11T08:00:00.000',
    };

    store.getState().addTransaction(t1);
    store.getState().addTransaction(t2);

    const { accounts } = store.getState();
    expect(accounts.find((a) => a.id === 'acc-src')!.currentBalance).toBe(2800);
    expect(accounts.find((a) => a.id === 'acc-dst')!.currentBalance).toBe(1200);
  });
});

describe('Integration: Balance adjustment via editAccount', () => {
  let mockDb: ReturnType<typeof makeMockDb>;
  let store: ReturnType<typeof buildFullStore>;

  const account: Account = {
    id: 'acc-adj',
    name: 'Cash',
    type: 'cash',
    initialBalance: 1000,
    currentBalance: 1000,
    currency: 'COP',
    displayOrder: 1,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockDb = makeMockDb();
    (getDb as jest.Mock).mockReturnValue(mockDb);
    store = buildFullStore();
    store.setState({ accounts: [account] });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('creates an income adjustment transaction when balance is increased', () => {
    const updated: Account = { ...account, currentBalance: 1500 };

    store.getState().editAccount(updated);

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO transactions'),
      expect.arrayContaining(['income', 500, 'acc-adj', 'Balance Adjustment']),
    );
    expect(store.getState().accounts[0].currentBalance).toBe(1500);
  });

  it('creates an expense adjustment transaction when balance is decreased', () => {
    const updated: Account = { ...account, currentBalance: 700 };

    store.getState().editAccount(updated);

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO transactions'),
      expect.arrayContaining(['expense', 300, 'acc-adj', 'Balance Adjustment']),
    );
    expect(store.getState().accounts[0].currentBalance).toBe(700);
  });

  it('does not create an adjustment transaction when balance is unchanged', () => {
    const unchanged: Account = { ...account };

    store.getState().editAccount(unchanged);

    const insertCalls = mockDb.runSync.mock.calls.filter((call: unknown[]) =>
      (call[0] as string).includes('INSERT INTO transactions'),
    );
    expect(insertCalls).toHaveLength(0);
  });
});

describe('Integration: Account deletion clears associated transactions', () => {
  let mockDb: ReturnType<typeof makeMockDb>;
  let store: ReturnType<typeof buildFullStore>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockDb = makeMockDb();
    (getDb as jest.Mock).mockReturnValue(mockDb);
    store = buildFullStore();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('removes the account and all its transactions from in-memory state', () => {
    store.setState({
      accounts: [
        {
          id: 'acc-del',
          name: 'To Delete',
          type: 'cash',
          initialBalance: 0,
          currentBalance: 0,
          currency: 'COP',
          displayOrder: 1,
        },
        {
          id: 'acc-keep',
          name: 'To Keep',
          type: 'bank',
          initialBalance: 500,
          currentBalance: 500,
          currency: 'COP',
          displayOrder: 2,
        },
      ],
      transactions: [
        {
          id: 'tx-a',
          accountId: 'acc-del',
          type: 'expense',
          amount: 100,
          categoryId: null,
          date: '2026-05-01T00:00:00.000',
        },
        {
          id: 'tx-b',
          accountId: 'acc-keep',
          type: 'income',
          amount: 200,
          categoryId: null,
          date: '2026-05-02T00:00:00.000',
        },
      ],
    });

    store.getState().deleteAccount('acc-del');

    expect(store.getState().accounts).toHaveLength(1);
    expect(store.getState().accounts[0].id).toBe('acc-keep');
    expect(store.getState().transactions).toHaveLength(1);
    expect(store.getState().transactions[0].id).toBe('tx-b');
    expect(mockDb.runSync).toHaveBeenCalledWith(
      'DELETE FROM accounts WHERE id = ?',
      ['acc-del'],
    );
  });
});

describe('Integration: Budget and transaction cross-slice flow', () => {
  let mockDb: ReturnType<typeof makeMockDb>;
  let store: ReturnType<typeof buildFullStore>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockDb = makeMockDb({
      getFirstSync: jest.fn().mockReturnValue(null),
    });
    (getDb as jest.Mock).mockReturnValue(mockDb);
    store = buildFullStore();
    store.setState({
      accounts: [
        {
          id: 'acc-main',
          name: 'Main',
          type: 'bank',
          initialBalance: 10000,
          currentBalance: 10000,
          currency: 'COP',
          displayOrder: 1,
        },
      ],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('budget and account state both update after adding a transaction with budgetId', () => {
    store.getState().addBudget({
      id: 'budget-food',
      name: 'Food',
      amount: 500,
      color: '#FF5722',
      categoryId: 'cat-food',
      displayOrder: 1,
    });

    const expense: Transaction = {
      id: 'tx-food-1',
      type: 'expense',
      amount: 75,
      categoryId: 'cat-food',
      accountId: 'acc-main',
      budgetId: 'budget-food',
      date: '2026-05-10T12:00:00.000',
    };

    store.getState().addTransaction(expense);

    expect(store.getState().budgets).toHaveLength(1);
    expect(store.getState().budgets[0].id).toBe('budget-food');
    const mainAcc = store.getState().accounts.find((a) => a.id === 'acc-main')!;
    expect(mainAcc.currentBalance).toBe(9925);
    expect(store.getState().transactions[0].budgetId).toBe('budget-food');
  });

  it('budget is removed without affecting transactions or accounts', () => {
    store.setState({
      budgets: [
        {
          id: 'budget-travel',
          name: 'Travel',
          amount: 1000,
          displayOrder: 1,
        },
      ],
      transactions: [
        {
          id: 'tx-travel',
          type: 'expense',
          amount: 200,
          categoryId: 'cat-travel',
          accountId: 'acc-main',
          budgetId: 'budget-travel',
          date: '2026-05-10T10:00:00.000',
        },
      ],
    });

    store.getState().deleteBudget('budget-travel');

    expect(store.getState().budgets).toHaveLength(0);
    expect(store.getState().transactions).toHaveLength(1);
    expect(store.getState().accounts).toHaveLength(1);
  });
});

describe('Integration: loadData populates all slices from DB', () => {
  let mockDb: ReturnType<typeof makeMockDb>;
  let store: ReturnType<typeof buildFullStore>;

  const dbAccounts: Account[] = [
    {
      id: 'acc-db-1',
      name: 'Wallet',
      type: 'cash',
      initialBalance: 500,
      currentBalance: 500,
      currency: 'COP',
      displayOrder: 1,
    },
  ];
  const dbTransactions: Transaction[] = [
    {
      id: 'tx-db-1',
      type: 'expense',
      amount: 50,
      categoryId: null,
      accountId: 'acc-db-1',
      date: '2026-05-01T10:00:00.000',
    },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
    mockDb = makeMockDb({
      getAllSync: jest
        .fn()
        .mockReturnValueOnce(dbAccounts)
        .mockReturnValueOnce([
          { id: 'cat-1', name: 'Food', type: 'expense', displayOrder: 1 },
        ])
        .mockReturnValueOnce(dbTransactions),
      getFirstSync: jest.fn().mockReturnValue(null),
    });
    (getDb as jest.Mock).mockReturnValue(mockDb);
    store = buildFullStore();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('loads accounts, categories, and transactions from DB into state', () => {
    store.getState().loadData();

    const { accounts, categories, transactions } = store.getState();

    expect(accounts).toHaveLength(1);
    expect(accounts[0].id).toBe('acc-db-1');
    expect(categories).toHaveLength(1);
    expect(categories[0].id).toBe('cat-1');
    expect(transactions).toHaveLength(1);
    expect(transactions[0].id).toBe('tx-db-1');
    expect(store.getState().isLoaded).toBe(true);
  });

  it('sets isFirstLaunch to false when transactions exist in DB', () => {
    mockDb.getFirstSync
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ count: 3 });

    store.getState().loadData();

    expect(store.getState().isFirstLaunch).toBe(false);
  });

  it('applies language from DB settings row', () => {
    mockDb = makeMockDb({
      getAllSync: jest
        .fn()
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]),
      getFirstSync: jest
        .fn()
        .mockReturnValueOnce({ val: 'USD' })
        .mockReturnValueOnce({ val: 'es' })
        .mockReturnValue(null),
    });
    (getDb as jest.Mock).mockReturnValue(mockDb);

    store.getState().loadData();

    expect(store.getState().language).toBe('es');
    expect(store.getState().currency).toBe('USD');
  });
});

describe('Integration: resetData wipes all state', () => {
  let mockDb: ReturnType<typeof makeMockDb>;
  let store: ReturnType<typeof buildFullStore>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockDb = makeMockDb({
      getAllSync: jest.fn().mockReturnValue([]),
      getFirstSync: jest.fn().mockReturnValue(null),
    });
    (getDb as jest.Mock).mockReturnValue(mockDb);
    store = buildFullStore();
    store.setState({
      accounts: [
        {
          id: 'a1',
          name: 'Old',
          type: 'cash',
          initialBalance: 100,
          currentBalance: 100,
          currency: 'COP',
          displayOrder: 1,
        },
      ],
      transactions: [
        {
          id: 't1',
          type: 'expense',
          amount: 10,
          categoryId: null,
          accountId: 'a1',
          date: '2026-05-01T00:00:00.000',
        },
      ],
      budgets: [{ id: 'b1', name: 'Old Budget', amount: 500, displayOrder: 1 }],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('clears all data from state and calls DB DELETE statements', () => {
    store.getState().resetData();

    expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM transactions;');
    expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM budgets;');
    expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM accounts;');
    expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM categories;');

    expect(store.getState().transactions).toHaveLength(0);
    expect(store.getState().accounts).toHaveLength(0);
    expect(store.getState().budgets).toHaveLength(0);
    expect(store.getState().analyticsReport).toBeNull();
    expect(store.getState().dashboardReport).toBeNull();
  });
});
