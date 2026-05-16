import { StateCreator } from 'zustand';
import { getDb } from '../../db/schema';
import { Goal } from '../types';
import type { AppStore } from '../useStore';

export interface GoalsSlice {
  goals: Goal[];
  loadGoals: () => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  editGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;
  updateGoalsOrder: (goals: Goal[]) => void;
}

export const createGoalsSlice: StateCreator<AppStore, [], [], GoalsSlice> = (
  set,
  get,
) => ({
  goals: [],

  loadGoals: () => {
    const db = getDb();
    const goals = db.getAllSync<Goal>(
      'SELECT id, name, targetAmount, currentAmount, color, icon, deadline, status, displayOrder FROM goals ORDER BY displayOrder ASC',
    );
    set({ goals });
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

      if (newStatus === 'completed') {
        get().checkAndShowAd();
      }
    }
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
});
