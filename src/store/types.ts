// Shared domain entity types used across features and store slices.
// Import from here — never from individual slice files — to avoid circular deps.

import { AnalyticsReport } from '../features/insights/services/types';
export type { AnalyticsReport };

export type AccountType = 'cash' | 'bank' | 'credit';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  currentBalance: number;
  color?: string | null;
  currency: string;
  displayOrder: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string | null;
  color?: string | null;
  displayOrder: number;
}

export interface Budget {
  id: string;
  name?: string;
  amount: number;
  color?: string | null;
  categoryId?: string | null;
  displayOrder: number;
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
  toAccountId?: string | null;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color?: string | null;
  icon?: string | null;
  deadline?: string | null;
  status: 'active' | 'completed';
  displayOrder: number;
}
