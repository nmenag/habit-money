import { createStore } from 'zustand';
import {
  createTransactionsSlice,
  TransactionsSlice,
} from '../transactionsSlice';
import { getDb } from '../../../db/schema';
import { ProductAnalyticsService } from '../../../services/ProductAnalyticsService';
import { Transaction } from '../../types';

jest.mock('../../../db/schema', () => ({
  getDb: jest.fn(),
}));

jest.mock('../../../services/ProductAnalyticsService', () => ({
  ProductAnalyticsService: {
    logFirstTransactionCreated: jest.fn().mockResolvedValue(undefined),
    logTransactionCreated: jest.fn().mockResolvedValue(undefined),
    logTransactionUpdated: jest.fn().mockResolvedValue(undefined),
    logTransactionDeleted: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('transactionsSlice', () => {
  let mockDb: any;
  let store: any;
  let mockRefreshAnalytics: jest.Mock;
  let mockLoadData: jest.Mock;

  beforeEach(() => {
    mockRefreshAnalytics = jest.fn();
    mockLoadData = jest.fn();

    mockDb = {
      getAllSync: jest.fn(),
      runSync: jest.fn(),
      withTransactionSync: jest.fn((cb) => cb()),
    };
    (getDb as jest.Mock).mockReturnValue(mockDb);

    store = createStore<TransactionsSlice>()((set, get, api) => ({
      accounts: [
        { id: 'acc1', name: 'Checking', currentBalance: 1000 } as any,
        { id: 'acc2', name: 'Savings', currentBalance: 500 } as any,
      ],
      budgets: [] as any[],
      refreshAnalytics: mockRefreshAnalytics,
      loadData: mockLoadData,
      ...createTransactionsSlice(set as any, get as any, api as any),
    }));
  });

  it('loads transactions with default and custom limit', () => {
    mockDb.getAllSync.mockReturnValueOnce([{ id: 't1' }]);

    store.getState().loadTransactions();
    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT 1000'),
    );
    expect(store.getState().transactions).toHaveLength(1);

    store.getState().loadTransactions(50);
    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT 50'),
    );
  });

  it('loads full transactions and budgets data and refreshes analytics', () => {
    mockDb.getAllSync
      .mockReturnValueOnce([{ id: 'tx1' }])
      .mockReturnValueOnce([{ id: 'b1' }]);

    store.getState().loadFullData();

    expect(store.getState().transactions).toHaveLength(1);
    expect(store.getState().budgets).toHaveLength(1);
    expect(mockRefreshAnalytics).toHaveBeenCalled();
  });

  describe('addTransaction', () => {
    it('adds expense transaction, reduces account balance, and updates state', () => {
      const newTx: any = {
        id: 'tx1',
        type: 'expense',
        amount: 200,
        accountId: 'acc1',
        date: '2026-05-15T12:00:00.000',
      };

      store.getState().addTransaction(newTx);

      expect(
        ProductAnalyticsService.logTransactionCreated,
      ).toHaveBeenCalledWith('expense');
      expect(mockDb.withTransactionSync).toHaveBeenCalled();
      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transactions'),
        expect.any(Array),
      );
      // Balance decreased by 200: 1000 - 200 = 800
      expect(store.getState().accounts[0].currentBalance).toBe(800);
      expect(store.getState().transactions).toHaveLength(1);
      expect(mockRefreshAnalytics).toHaveBeenCalled();
    });

    it('adds income transaction and increases account balance', () => {
      store.setState({ transactions: [{ id: 'existing' } as any] });

      const tx: Transaction = {
        id: 'tx_inc',
        type: 'income',
        amount: 300,
        categoryId: 'c1',
        accountId: 'acc1',
        date: '2026-05-16T12:00:00.000',
      };

      store.getState().addTransaction(tx);

      // Balance increased by 300: 1000 + 300 = 1300
      expect(store.getState().accounts[0].currentBalance).toBe(1300);
    });

    it('adds transfer transaction updating both source and destination accounts', () => {
      const tx: Transaction = {
        id: 'tx_trans',
        type: 'transfer',
        amount: 150,
        categoryId: null,
        accountId: 'acc1',
        toAccountId: 'acc2',
        date: '2026-05-17T12:00:00.000',
      };

      store.getState().addTransaction(tx);

      // acc1: 1000 - 150 = 850, acc2: 500 + 150 = 650
      expect(store.getState().accounts[0].currentBalance).toBe(850);
      expect(store.getState().accounts[1].currentBalance).toBe(650);
    });
  });

  describe('editTransaction', () => {
    it('returns early with error if transaction does not exist', () => {
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      store.getState().editTransaction({ id: 'missing' } as any);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Old transaction not found'),
        'missing',
      );
      errorSpy.mockRestore();
    });

    it('edits standard expense transaction and updates balances', () => {
      const oldTx: Transaction = {
        id: 'tx1',
        type: 'expense',
        amount: 100,
        categoryId: 'c1',
        accountId: 'acc1',
        date: '2026-05-10T00:00:00.000',
      };
      store.setState({ transactions: [oldTx] });

      const updatedTx: Transaction = {
        ...oldTx,
        amount: 150, // increased expense by 50
      };

      store.getState().editTransaction(updatedTx);

      expect(
        ProductAnalyticsService.logTransactionUpdated,
      ).toHaveBeenCalledWith('expense');
      expect(mockDb.withTransactionSync).toHaveBeenCalled();
      expect(mockLoadData).toHaveBeenCalled();
      expect(mockRefreshAnalytics).toHaveBeenCalled();
    });

    it('edits transfer transaction and updates balances across both accounts', () => {
      const oldTx: Transaction = {
        id: 'tx_trans',
        type: 'transfer',
        amount: 100,
        categoryId: null,
        accountId: 'acc1',
        toAccountId: 'acc2',
        date: '2026-05-10T00:00:00.000',
      };
      store.setState({ transactions: [oldTx] });

      const updatedTx: Transaction = {
        ...oldTx,
        amount: 200,
      };

      store.getState().editTransaction(updatedTx);
      expect(mockDb.runSync).toHaveBeenCalled();
    });

    it('edits income transaction and updates balance accordingly', () => {
      const oldTx: Transaction = {
        id: 'tx_inc',
        type: 'income',
        amount: 200,
        categoryId: 'c1',
        accountId: 'acc1',
        date: '2026-05-10T00:00:00.000',
      };
      store.setState({ transactions: [oldTx] });

      const updatedTx: Transaction = {
        ...oldTx,
        amount: 300,
      };

      store.getState().editTransaction(updatedTx);
      expect(mockDb.runSync).toHaveBeenCalled();
    });

    it('throws error and logs when database transaction fails during edit', () => {
      const tx: Transaction = {
        id: 'tx1',
        type: 'expense',
        amount: 100,
        categoryId: 'c1',
        accountId: 'acc1',
        date: '2026-05-10T00:00:00.000',
      };
      store.setState({ transactions: [tx] });
      mockDb.withTransactionSync.mockImplementationOnce(() => {
        throw new Error('Lock timeout');
      });

      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      expect(() => store.getState().editTransaction(tx)).toThrow(
        'Lock timeout',
      );
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('deleteTransaction', () => {
    it('deletes expense transaction and rolls back account balance', () => {
      const tx: Transaction = {
        id: 'tx1',
        type: 'expense',
        amount: 200,
        categoryId: 'c1',
        accountId: 'acc1',
        date: '2026-05-10T00:00:00.000',
      };
      store.setState({ transactions: [tx] });

      store.getState().deleteTransaction('tx1', 'acc1', 200, 'expense');

      expect(
        ProductAnalyticsService.logTransactionDeleted,
      ).toHaveBeenCalledWith('expense');
      expect(mockDb.runSync).toHaveBeenCalledWith(
        'DELETE FROM transactions WHERE id = ?',
        ['tx1'],
      );
      // Balance rolled back: 1000 + 200 = 1200
      expect(store.getState().accounts[0].currentBalance).toBe(1200);
      expect(store.getState().transactions).toHaveLength(0);
      expect(mockRefreshAnalytics).toHaveBeenCalled();
    });

    it('deletes transfer transaction and restores balances on both accounts', () => {
      const tx: Transaction = {
        id: 'tx_trans',
        type: 'transfer',
        amount: 300,
        categoryId: null,
        accountId: 'acc1',
        toAccountId: 'acc2',
        date: '2026-05-10T00:00:00.000',
      };
      store.setState({ transactions: [tx] });

      store.getState().deleteTransaction('tx_trans', 'acc1', 300, 'transfer');

      // acc1: 1000 + 300 = 1300, acc2: 500 - 300 = 200
      expect(store.getState().accounts[0].currentBalance).toBe(1300);
      expect(store.getState().accounts[1].currentBalance).toBe(200);
    });
  });
});
