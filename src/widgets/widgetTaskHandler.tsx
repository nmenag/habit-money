'use no memo';

import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { HabitMoneyWidget } from './HabitMoneyWidget';
import { getDb, initDb } from '../db/schema';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, renderWidget } = props;

  if (widgetAction === 'WIDGET_DELETED') {
    return;
  }

  let income = 0;
  let expenses = 0;
  let currency = 'COP';
  let language: 'en' | 'es' = 'en';

  try {
    initDb();
    const db = getDb();

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const pad = (n: number) => String(n).padStart(2, '0');
    const formatLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3, '0')}`;

    const startStr = formatLocal(startOfMonth);
    const endStr = formatLocal(endOfMonth);

    const transactions = db.getAllSync<{
      type: string;
      amount: number;
      note: string;
    }>(
      'SELECT type, amount, note FROM transactions WHERE date >= ? AND date <= ?',
      [startStr, endStr],
    );

    const adjustmentNotes = ['Balance Adjustment', 'Ajuste de Saldo'];

    transactions.forEach((t) => {
      const isAdjustment = t.note && adjustmentNotes.includes(t.note);
      if (!isAdjustment) {
        if (t.type === 'income') {
          income += t.amount;
        } else if (t.type === 'expense') {
          expenses += t.amount;
        }
      }
    });

    const currencySetting = db.getFirstSync<{ val: string }>(
      "SELECT val FROM settings WHERE id = 'currency'",
    );
    if (currencySetting && currencySetting.val) {
      currency = currencySetting.val;
    }

    const languageSetting = db.getFirstSync<{ val: string }>(
      "SELECT val FROM settings WHERE id = 'language'",
    );
    if (languageSetting && languageSetting.val) {
      language = languageSetting.val as 'en' | 'es';
    }
  } catch (error) {
    console.error('Error fetching data for Android Widget:', error);
  }

  renderWidget({
    light: (
      <HabitMoneyWidget
        income={income}
        expenses={expenses}
        currency={currency}
        language={language}
        theme="light"
      />
    ),
    dark: (
      <HabitMoneyWidget
        income={income}
        expenses={expenses}
        currency={currency}
        language={language}
        theme="dark"
      />
    ),
  });
}
