import { createStore } from 'zustand';
import { createCategoriesSlice, CategoriesSlice } from '../categoriesSlice';
import { getDb } from '../../../db/schema';
import { Category } from '../../types';

jest.mock('../../../db/schema', () => ({
  getDb: jest.fn(),
}));

describe('categoriesSlice', () => {
  let mockDb: any;
  let store: any;

  beforeEach(() => {
    mockDb = {
      getFirstSync: jest.fn(),
      runSync: jest.fn(),
      withTransactionSync: jest.fn((cb) => cb()),
    };
    (getDb as jest.Mock).mockReturnValue(mockDb);

    store = createStore<CategoriesSlice>()((set, get, api) => ({
      ...createCategoriesSlice(set as any, get as any, api as any),
    }));
  });

  it('adds a category and increments displayOrder from maxOrder', () => {
    mockDb.getFirstSync.mockReturnValueOnce({ maxOrder: 2 });

    const newCategory: Category = {
      id: 'cat_food',
      name: 'Food',
      type: 'expense',
      icon: 'food',
      color: '#f44336',
      displayOrder: 1,
    };

    store.getState().addCategory(newCategory);

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO categories'),
      ['cat_food', 'Food', 'expense', 'food', '#f44336', 3],
    );

    const categories = store.getState().categories;
    expect(categories).toHaveLength(1);
    expect(categories[0].displayOrder).toBe(3);
  });

  it('handles null maxOrder when adding first category', () => {
    mockDb.getFirstSync.mockReturnValueOnce(null);

    const newCategory: any = {
      id: 'cat_other',
    };

    store.getState().addCategory(newCategory);
    expect(store.getState().categories[0].displayOrder).toBe(1);
  });

  it('edits an existing category while preserving non-matching categories', () => {
    const cat1: Category = {
      id: 'cat_1',
      name: 'Old Name',
      type: 'expense',
      icon: 'tag',
      color: '#000',
      displayOrder: 1,
    };
    const cat2: Category = {
      id: 'cat_2',
      name: 'Other',
      type: 'expense',
      icon: 'star',
      color: '#222',
      displayOrder: 2,
    };
    store.setState({ categories: [cat1, cat2] });

    const updatedCat: any = {
      id: 'cat_1',
      name: null,
      type: null,
      icon: null,
      color: null,
    };

    store.getState().editCategory(updatedCat);

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE categories SET'),
      [null, null, null, null, 'cat_1'],
    );
    expect(store.getState().categories[0].id).toBe('cat_1');
    expect(store.getState().categories[1].id).toBe('cat_2');
  });

  it('deletes a category by id', () => {
    store.setState({
      categories: [
        { id: '1', name: 'Cat 1', type: 'expense', displayOrder: 1 },
        { id: '2', name: 'Cat 2', type: 'expense', displayOrder: 2 },
      ],
    });

    store.getState().deleteCategory('1');

    expect(mockDb.runSync).toHaveBeenCalledWith(
      'DELETE FROM categories WHERE id = ?',
      ['1'],
    );
    expect(store.getState().categories).toHaveLength(1);
    expect(store.getState().categories[0].id).toBe('2');
  });

  it('updates categories displayOrder in a transaction', () => {
    const list: Category[] = [
      { id: '1', name: 'Cat 1', type: 'expense', displayOrder: 0 },
      { id: '2', name: 'Cat 2', type: 'expense', displayOrder: 1 },
    ];
    store.setState({ categories: list });

    store.getState().updateCategoriesOrder(list);

    expect(mockDb.withTransactionSync).toHaveBeenCalled();
    expect(mockDb.runSync).toHaveBeenCalledWith(
      'UPDATE categories SET displayOrder = ? WHERE id = ?',
      [0, '1'],
    );
    expect(mockDb.runSync).toHaveBeenCalledWith(
      'UPDATE categories SET displayOrder = ? WHERE id = ?',
      [1, '2'],
    );
    expect(list[0].displayOrder).toBe(0);
    expect(list[1].displayOrder).toBe(1);
  });
});
