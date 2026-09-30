import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { useStore, useTranslation } from '../useStore';

describe('useStore and useTranslation', () => {
  beforeEach(() => {
    act(() => {
      useStore.setState({
        language: 'en',
        currency: 'COP',
        accounts: [],
        categories: [],
        budgets: [],
        transactions: [],
      });
    });
  });

  it('initializes unified store with all slices', () => {
    const state = useStore.getState();
    expect(state.accounts).toBeDefined();
    expect(state.transactions).toBeDefined();
    expect(state.categories).toBeDefined();
    expect(state.budgets).toBeDefined();
    expect(state.language).toBe('en');
    expect(typeof state.addAccount).toBe('function');
    expect(typeof state.addTransaction).toBe('function');
    expect(typeof state.addCategory).toBe('function');
    expect(typeof state.addBudget).toBe('function');
    expect(typeof state.loadData).toBe('function');
  });

  describe('useTranslation hook', () => {
    let currentTranslation: any;

    const TestComponent = () => {
      currentTranslation = useTranslation();
      return null;
    };

    it('translates keys with and without parameter replacement', () => {
      act(() => {
        ReactTestRenderer.create(React.createElement(TestComponent));
      });

      const { t, translateName, language } = currentTranslation;

      expect(language).toBe('en');
      expect(t('dashboard')).toBe('Dashboard');

      const parameterized = t('insightSpentMoreThanLastMonth', {
        percentage: '25',
      });
      expect(parameterized).toContain('25%');

      expect(translateName('Food')).toBe('Food');
    });

    it('falls back to key string when translation key is unknown', () => {
      act(() => {
        ReactTestRenderer.create(React.createElement(TestComponent));
      });

      const { t } = currentTranslation;
      expect(t('non_existent_key' as any)).toBe('non_existent_key');
    });

    it('translates to Spanish when language is changed to es', () => {
      act(() => {
        useStore.setState({ language: 'es' });
      });

      act(() => {
        ReactTestRenderer.create(React.createElement(TestComponent));
      });

      const { t, translateName, language } = currentTranslation;
      expect(language).toBe('es');
      expect(t('dashboard')).toBe('Inicio');
      expect(translateName('Food')).toBe('Alimentación');
    });

    it('falls back to English when language is unsupported', () => {
      act(() => {
        useStore.setState({ language: 'fr' as any });
      });

      act(() => {
        ReactTestRenderer.create(React.createElement(TestComponent));
      });

      const { t } = currentTranslation;
      expect(t('dashboard')).toBe('Dashboard');
    });
  });
});
