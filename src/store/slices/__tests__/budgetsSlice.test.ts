import { createStore } from 'zustand';
import { createBudgetsSlice, BudgetsSlice } from '../budgetsSlice';
import { getDb } from '../../../db/schema';
import { ProductAnalyticsService } from '../../../services/ProductAnalyticsService';
import { Budget } from '../../types';

jest.mock('../../../db/schema', () => ({
  getDb: jest.fn(),
}));

jest.mock('../../../services/ProductAnalyticsService', () => ({
  ProductAnalyticsService: {
    logBudgetCreated: jest.fn().mockResolvedValue(undefined),
    logBudgetUpdated: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('budgetsSlice', () => {
  let mockDb: any;
  let store: any;

  beforeEach(() => {
    mockDb = {
      getAllSync: jest.fn(),
      getFirstSync: jest.fn(),
      runSync: jest.fn(),
      withTransactionSync: jest.fn((cb) => cb()),
    };
    (getDb as jest.Mock).mockReturnValue(mockDb);

    store = createStore<BudgetsSlice>()((set, get, api) => ({
      ...createBudgetsSlice(set as any, get as any, api as any),
    }));
  });

  it('loads budgets from sqlite database', () => {
    const mockBudgets: Budget[] = [
      {
        id: 'b1',
        name: 'Groceries',
        amount: 500,
        color: '#ff0000',
        categoryId: 'c1',
        displayOrder: 1,
      },
    ];
    mockDb.getAllSync.mockReturnValueOnce(mockBudgets);

    store.getState().loadBudgets();

    expect(mockDb.getAllSync).toHaveBeenCalledWith(
      expect.stringContaining('SELECT id, name, amount'),
    );
    expect(store.getState().budgets).toEqual(mockBudgets);
  });

  it('adds a budget and increments displayOrder from maxOrder', () => {
    mockDb.getFirstSync.mockReturnValueOnce({ maxOrder: 3 });

    const newBudget: Budget = {
      id: 'b2',
      name: 'Dining',
      amount: 300,
      color: '#00ff00',
      categoryId: 'c2',
      displayOrder: 1,
    };

    store.getState().addBudget(newBudget);

    expect(ProductAnalyticsService.logBudgetCreated).toHaveBeenCalled();
    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO budgets'),
      ['b2', 'Dining', 300, '#00ff00', 'c2', 4],
    );
    expect(store.getState().budgets).toHaveLength(1);
    expect(store.getState().budgets[0].displayOrder).toBe(4);
  });

  it('handles null maxOrder when adding first budget', () => {
    mockDb.getFirstSync.mockReturnValueOnce(null);

    const newBudget: any = {
      id: 'b1',
    };

    store.getState().addBudget(newBudget);
    expect(store.getState().budgets[0].displayOrder).toBe(1);
  });

  it('edits an existing budget while preserving non-matching budgets', () => {
    const b1: Budget = {
      id: 'b1',
      name: 'Old',
      amount: 100,
      color: '#000',
      categoryId: 'c1',
      displayOrder: 1,
    };
    const b2: Budget = {
      id: 'b2',
      name: 'Other',
      amount: 200,
      color: '#111',
      categoryId: 'c2',
      displayOrder: 2,
    };
    store.setState({ budgets: [b1, b2] });

    const updatedBudget: any = {
      id: 'b1',
      name: null,
      amount: null,
      color: null,
      categoryId: null,
    };

    store.getState().editBudget(updatedBudget);

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE budgets SET'),
      ['', 0, null, null, 'b1'],
    );
    expect(store.getState().budgets[0].id).toBe('b1');
    expect(store.getState().budgets[1].id).toBe('b2');
  });

  it('deletes a budget by id', () => {
    store.setState({
      budgets: [
        { id: 'b1', name: 'B1', amount: 100, displayOrder: 1 } as any,
        { id: 'b2', name: 'B2', amount: 200, displayOrder: 2 } as any,
      ],
    });

    store.getState().deleteBudget('b1');

    expect(mockDb.runSync).toHaveBeenCalledWith(
      'DELETE FROM budgets WHERE id = ?',
      ['b1'],
    );
    expect(store.getState().budgets).toHaveLength(1);
    expect(store.getState().budgets[0].id).toBe('b2');
  });

  it('updates budgets displayOrder in a transaction', () => {
    const list: Budget[] = [
      { id: 'b1', name: 'B1', amount: 100, categoryId: 'c1', displayOrder: 0 },
      { id: 'b2', name: 'B2', amount: 200, categoryId: 'c2', displayOrder: 1 },
    ];
    store.setState({ budgets: list });

    store.getState().updateBudgetsOrder(list);

    expect(mockDb.withTransactionSync).toHaveBeenCalled();
    expect(mockDb.runSync).toHaveBeenCalledWith(
      'UPDATE budgets SET displayOrder = ? WHERE id = ?',
      [0, 'b1'],
    );
    expect(mockDb.runSync).toHaveBeenCalledWith(
      'UPDATE budgets SET displayOrder = ? WHERE id = ?',
      [1, 'b2'],
    );
    expect(list[0].displayOrder).toBe(0);
    expect(list[1].displayOrder).toBe(1);
  });
});
