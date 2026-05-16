// Combined Zustand store — composed from feature slices.
// Consumers should import useStore and useTranslation from this file as before.
// Entity types are imported from ./types to avoid circular dependencies.

import { create } from 'zustand';
import { getTranslatedName, translations } from '../i18n/translations';
import { createAccountsSlice, AccountsSlice } from './slices/accountsSlice';
import { createBudgetsSlice, BudgetsSlice } from './slices/budgetsSlice';
import {
  createCategoriesSlice,
  CategoriesSlice,
} from './slices/categoriesSlice';
import { createGoalsSlice, GoalsSlice } from './slices/goalsSlice';
import { createSettingsSlice, SettingsSlice } from './slices/settingsSlice';
import {
  createTransactionsSlice,
  TransactionsSlice,
} from './slices/transactionsSlice';

// Re-export all types so existing import paths keep working
export type {
  Account,
  AccountType,
  Budget,
  Category,
  Goal,
  Transaction,
  TransactionType,
} from './types';
export type { AnalyticsReport } from './types';

// The combined store type — used internally by slice StateCreator generics
export type AppStore = AccountsSlice &
  TransactionsSlice &
  CategoriesSlice &
  BudgetsSlice &
  GoalsSlice &
  SettingsSlice;

export const useStore = create<AppStore>()((...args) => ({
  ...createAccountsSlice(...args),
  ...createTransactionsSlice(...args),
  ...createCategoriesSlice(...args),
  ...createBudgetsSlice(...args),
  ...createGoalsSlice(...args),
  ...createSettingsSlice(...args),
}));

// ---------------------------------------------------------------------------
// useTranslation — unchanged public API, kept here so all imports still work
// ---------------------------------------------------------------------------
export const useTranslation = () => {
  const language = useStore((state) => state.language);

  const t = (
    key: keyof typeof translations.en,
    params?: Record<string, string | number>,
  ) => {
    const langSet = translations[language] || translations.en;
    let text = langSet[key] || translations.en[key] || String(key);

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, String(v));
      });
    }

    return text;
  };

  const translateName = (name: string) => {
    return getTranslatedName(name, language);
  };

  return { t, language, translateName };
};
