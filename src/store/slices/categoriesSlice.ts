import { StateCreator } from 'zustand';
import { getDb } from '../../db/schema';
import { Category } from '../types';
import type { AppStore } from '../useStore';

export interface CategoriesSlice {
  categories: Category[];
  addCategory: (category: Category) => void;
  editCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  updateCategoriesOrder: (categories: Category[]) => void;
}

export const createCategoriesSlice: StateCreator<
  AppStore,
  [],
  [],
  CategoriesSlice
> = (set) => ({
  categories: [],

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
});
