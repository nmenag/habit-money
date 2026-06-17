import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { FinHabitWidget } from '../widgets/FinHabitWidget';
import { getDb } from '../db/schema';

export function triggerWidgetUpdate() {
  if (Platform.OS !== 'android') return;

  try {
    let income = 0;
    let expenses = 0;
    let currency = 'COP';
    let language: 'en' | 'es' = 'en';

    try {
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

      transactions.forEach(
        (t: { type: string; amount: number; note: string }) => {
          const isAdjustment = t.note && adjustmentNotes.includes(t.note);
          if (!isAdjustment) {
            if (t.type === 'income') {
              income += t.amount;
            } else if (t.type === 'expense') {
              expenses += t.amount;
            }
          }
        },
      );

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
    } catch (e) {
      console.error('Error querying DB for widget updater:', e);
    }

    requestWidgetUpdate({
      widgetName: 'FinHabitWidget',
      renderWidget: () => ({
        light: (
          <FinHabitWidget
            income={income}
            expenses={expenses}
            currency={currency}
            language={language}
            theme="light"
          />
        ),
        dark: (
          <FinHabitWidget
            income={income}
            expenses={expenses}
            currency={currency}
            language={language}
            theme="dark"
          />
        ),
      }),
    }).catch((err: any) => {
      console.warn(
        'Failed to update Android widget (native module may not be linked):',
        err,
      );
    });
  } catch (error) {
    console.error('Error updating Android widget:', error);
  }
}
