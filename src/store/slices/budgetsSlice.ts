import { StateCreator } from 'zustand';
import { getDb } from '../../db/schema';
import { Budget } from '../types';
import type { AppStore } from '../useStore';

export interface BudgetsSlice {
  budgets: Budget[];
  loadBudgets: () => void;
  addBudget: (budget: Budget) => void;
  editBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  updateBudgetsOrder: (budgets: Budget[]) => void;
}

export const createBudgetsSlice: StateCreator<
  AppStore,
  [],
  [],
  BudgetsSlice
> = (set) => ({
  budgets: [],

  loadBudgets: () => {
    const db = getDb();
    const budgets = db.getAllSync<Budget>(
      'SELECT id, name, amount, color, categoryId, displayOrder FROM budgets ORDER BY displayOrder ASC',
    );
    set({ budgets });
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
});
