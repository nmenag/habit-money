import React from 'react';
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

export const useTranslation = () => {
  const language = useStore((state) => state.language);

  return React.useMemo(() => {
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
  }, [language]);
};
