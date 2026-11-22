import { createStore } from 'zustand';
import { createAccountsSlice, AccountsSlice } from '../accountsSlice';
import { getDb } from '../../../db/schema';
import { ProductAnalyticsService } from '../../../services/ProductAnalyticsService';
import { Account } from '../../types';

jest.mock('../../../db/schema', () => ({
  getDb: jest.fn(),
}));

jest.mock('../../../services/ProductAnalyticsService', () => ({
  ProductAnalyticsService: {
    logFirstAccountCreated: jest.fn().mockResolvedValue(undefined),
    logAccountCreated: jest.fn().mockResolvedValue(undefined),
    logAccountUpdated: jest.fn().mockResolvedValue(undefined),
    logAccountDeleted: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('accountsSlice', () => {
  let mockDb: any;
  let store: any;

  beforeEach(() => {
    mockDb = {
      getFirstSync: jest.fn(),
      runSync: jest.fn(),
      withTransactionSync: jest.fn((cb) => cb()),
    };
    (getDb as jest.Mock).mockReturnValue(mockDb);

    store = createStore<AccountsSlice>()((set, get, api) => ({
      transactions: [] as any[],
      ...createAccountsSlice(set as any, get as any, api as any),
    }));
  });

  describe('addAccount', () => {
    it('adds first account, logs first account creation analytics, and sets displayOrder 1', () => {
      mockDb.getFirstSync.mockReturnValueOnce(null);

      const newAccount: Account = {
        id: 'acc1',
        name: 'Main Bank',
        type: 'bank',
        initialBalance: 1000,
        currentBalance: 1000,
        color: '#2196f3',
        currency: 'USD',
        displayOrder: 1,
      };

      store.getState().addAccount(newAccount);

      expect(ProductAnalyticsService.logFirstAccountCreated).toHaveBeenCalled();
      expect(ProductAnalyticsService.logAccountCreated).toHaveBeenCalledWith(
        'bank',
      );
      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO accounts'),
        ['acc1', 'Main Bank', 'bank', 1000, 1000, '#2196f3', 'USD', 1],
      );

      const accounts = store.getState().accounts;
      expect(accounts).toHaveLength(1);
      expect(accounts[0].displayOrder).toBe(1);
    });

    it('adds subsequent account with maxOrder + 1 and default currency COP', () => {
      mockDb.getFirstSync.mockReturnValueOnce({ maxOrder: 5 });
      store.setState({ accounts: [{ id: 'acc1', name: 'Existing' } as any] });

      const newAccount: any = {
        id: 'acc2',
        name: 'Savings',
      };

      store.getState().addAccount(newAccount);

      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO accounts'),
        ['acc2', 'Savings', null, 0, 0, null, 'COP', 6],
      );
      expect(store.getState().accounts).toHaveLength(2);
    });
  });

  describe('editAccount', () => {
    it('edits account without balance change and without adjustment transaction', () => {
      const oldAcc: Account = {
        id: 'acc1',
        name: 'Old Name',
        type: 'bank',
        initialBalance: 1000,
        currentBalance: 1000,
        currency: 'USD',
        displayOrder: 1,
      };
      store.setState({ accounts: [oldAcc] });

      const updatedAcc: Account = {
        ...oldAcc,
        name: 'New Name',
      };

      store.getState().editAccount(updatedAcc);

      expect(ProductAnalyticsService.logAccountUpdated).toHaveBeenCalledWith(
        'bank',
      );
      expect(mockDb.withTransactionSync).toHaveBeenCalled();
      expect(mockDb.runSync).toHaveBeenCalledTimes(1);
      expect(store.getState().accounts[0].name).toBe('New Name');
    });

    it('creates positive balance adjustment transaction when balance increases', () => {
      const oldAcc: Account = {
        id: 'acc1',
        name: 'Bank',
        type: 'bank',
        initialBalance: 1000,
        currentBalance: 1000,
        currency: 'USD',
        displayOrder: 1,
      };
      store.setState({ accounts: [oldAcc] });

      const updatedAcc: Account = {
        ...oldAcc,
        currentBalance: 1500, // +500 adjustment
      };

      store.getState().editAccount(updatedAcc);

      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transactions'),
        expect.arrayContaining([
          'adjustment',
          500,
          'acc1',
          'Balance Adjustment',
        ]),
      );
      expect(store.getState().accounts[0].currentBalance).toBe(1500);
    });

    it('creates negative balance adjustment transaction when balance decreases', () => {
      const oldAcc: Account = {
        id: 'acc1',
        name: 'Bank',
        type: 'bank',
        initialBalance: 1000,
        currentBalance: 1000,
        currency: 'USD',
        displayOrder: 1,
      };
      store.setState({ accounts: [oldAcc] });

      const updatedAcc: Account = {
        ...oldAcc,
        currentBalance: 800, // -200 adjustment
      };

      store.getState().editAccount(updatedAcc);

      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transactions'),
        expect.arrayContaining([
          'adjustment',
          -200,
          'acc1',
          'Balance Adjustment',
        ]),
      );
      expect(store.getState().accounts[0].currentBalance).toBe(800);
    });
  });

  describe('adjustAccountBalance', () => {
    let mockAddTransaction: jest.Mock;

    beforeEach(() => {
      mockAddTransaction = jest.fn();
      store = createStore<AccountsSlice>()((set, get, api) => ({
        transactions: [] as any[],
        addTransaction: mockAddTransaction,
        ...createAccountsSlice(set as any, get as any, api as any),
      }));
      store.setState({
        accounts: [
          {
            id: 'acc1',
            name: 'Checking',
            type: 'bank',
            initialBalance: 1000,
            currentBalance: 1000,
            currency: 'COP',
            displayOrder: 1,
          },
        ],
      });
    });

    it('creates a positive adjustment transaction when newBalance > currentBalance', () => {
      const tx = store
        .getState()
        .adjustAccountBalance('acc1', 1450, 'Reconcile wallet');

      expect(tx).not.toBeNull();
      expect(tx?.type).toBe('adjustment');
      expect(tx?.amount).toBe(450);
      expect(tx?.accountId).toBe('acc1');
      expect(tx?.note).toBe('Reconcile wallet');
      expect(mockAddTransaction).toHaveBeenCalledWith(tx);
    });

    it('creates a negative adjustment transaction when newBalance < currentBalance', () => {
      const tx = store.getState().adjustAccountBalance('acc1', 600);

      expect(tx).not.toBeNull();
      expect(tx?.type).toBe('adjustment');
      expect(tx?.amount).toBe(-400);
      expect(tx?.note).toBe('Balance Adjustment');
      expect(mockAddTransaction).toHaveBeenCalledWith(tx);
    });

    it('returns null and does not add transaction when newBalance equals currentBalance or account is missing', () => {
      expect(store.getState().adjustAccountBalance('acc1', 1000)).toBeNull();
      expect(store.getState().adjustAccountBalance('missing', 500)).toBeNull();
      expect(mockAddTransaction).not.toHaveBeenCalled();
    });
  });

  describe('deleteAccount', () => {
    it('deletes account and removes associated transactions from memory', () => {
      store.setState({
        accounts: [
          { id: 'acc1', name: 'A1', type: 'cash' },
          { id: 'acc2', name: 'A2', type: 'bank' },
        ],
        transactions: [
          { id: 't1', accountId: 'acc1', amount: 50 },
          { id: 't2', accountId: 'acc2', amount: 100 },
        ],
      });

      store.getState().deleteAccount('acc1');

      expect(ProductAnalyticsService.logAccountDeleted).toHaveBeenCalledWith(
        'cash',
      );
      expect(mockDb.runSync).toHaveBeenCalledWith(
        'DELETE FROM accounts WHERE id = ?',
        ['acc1'],
      );
      expect(store.getState().accounts).toHaveLength(1);
      expect(store.getState().accounts[0].id).toBe('acc2');
      expect(store.getState().transactions).toHaveLength(1);
      expect(store.getState().transactions[0].id).toBe('t2');
    });
  });

  describe('updateAccountsOrder', () => {
    it('updates accounts displayOrder in a transaction', () => {
      const list: Account[] = [
        { id: 'acc1', name: 'A1' } as any,
        { id: 'acc2', name: 'A2' } as any,
      ];
      store.setState({ accounts: list });

      store.getState().updateAccountsOrder(list);

      expect(mockDb.withTransactionSync).toHaveBeenCalled();
      expect(mockDb.runSync).toHaveBeenCalledWith(
        'UPDATE accounts SET displayOrder = ? WHERE id = ?',
        [0, 'acc1'],
      );
      expect(mockDb.runSync).toHaveBeenCalledWith(
        'UPDATE accounts SET displayOrder = ? WHERE id = ?',
        [1, 'acc2'],
      );
      expect(list[0].displayOrder).toBe(0);
      expect(list[1].displayOrder).toBe(1);
    });
  });
});
