'use no memo';

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { formatCurrency } from '../utils/formatters';

interface HabitMoneyWidgetProps {
  income: number;
  expenses: number;
  currency: string;
  language: 'en' | 'es';
  theme: 'light' | 'dark';
}

export function HabitMoneyWidget({
  income,
  expenses,
  currency,
  language,
  theme,
}: HabitMoneyWidgetProps) {
  const isDark = theme === 'dark';

  const colors = {
    background: isDark ? '#040908' : '#F8FAFC',
    textPrimary: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#94A3B8' : '#64748B',
    income: isDark ? '#4ADE80' : '#16A34A',
    expense: isDark ? '#F87171' : '#DC2626',
    buttonBg: '#22C55E',
    buttonText: '#FFFFFF',
    cardBg: isDark ? '#0F172A' : '#FFFFFF',
    border: isDark ? '#1E293B' : '#E2E8F0',
  } as const;

  const t = {
    title: 'Habit Money',
    subtitle: language === 'es' ? 'Este Mes' : 'This Month',
    incomeLabel: language === 'es' ? 'Ingresos' : 'Income',
    expenseLabel: language === 'es' ? 'Gastos' : 'Expenses',
    addButton: language === 'es' ? '+ Transacción' : '+ Transaction',
  };

  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: 12,
        width: 'match_parent',
        height: 'match_parent',
        justifyContent: 'space-between',
      }}
    >
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <TextWidget
          text={t.title}
          style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: colors.textPrimary,
            fontFamily: 'sans-serif-medium',
          }}
        />
        <TextWidget
          text={t.subtitle}
          style={{
            fontSize: 10,
            color: colors.textSecondary,
            fontFamily: 'sans-serif',
          }}
        />
      </FlexWidget>

      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          width: 'match_parent',
          marginVertical: 4,
        }}
      >
        <FlexWidget
          style={{
            flexDirection: 'column',
            backgroundColor: colors.cardBg,
            borderRadius: 10,
            padding: 8,
            flex: 1,
            marginRight: 4,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <TextWidget
            text={t.incomeLabel}
            style={{
              fontSize: 9,
              color: colors.textSecondary,
              fontFamily: 'sans-serif',
              marginBottom: 2,
            }}
          />
          <TextWidget
            text={formatCurrency(income, currency, language)}
            style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: colors.income,
              fontFamily: 'sans-serif-medium',
            }}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            flexDirection: 'column',
            backgroundColor: colors.cardBg,
            borderRadius: 10,
            padding: 8,
            flex: 1,
            marginLeft: 4,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <TextWidget
            text={t.expenseLabel}
            style={{
              fontSize: 9,
              color: colors.textSecondary,
              fontFamily: 'sans-serif',
              marginBottom: 2,
            }}
          />
          <TextWidget
            text={formatCurrency(expenses, currency, language)}
            style={{
              fontSize: 12,
              fontWeight: 'bold',
              color: colors.expense,
              fontFamily: 'sans-serif-medium',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      <FlexWidget
        clickAction="OPEN_URI"
        clickActionData={{ uri: 'habitmoney://add-transaction' }}
        style={{
          flexDirection: 'row',
          backgroundColor: colors.buttonBg,
          borderRadius: 10,
          paddingVertical: 8,
          width: 'match_parent',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text={t.addButton}
          style={{
            fontSize: 11,
            fontWeight: 'bold',
            color: colors.buttonText,
            fontFamily: 'sans-serif-medium',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
