import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { format } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import { translations } from '../i18n/translations';
import { HabitMoneyWidget } from '../widgets/HabitMoneyWidget';
import { getDb } from '../db/schema';
import { getLast30DaysRange, getMonthRange } from './dateFilters';
import { getLocalISOString } from './dateUtils';

export function triggerWidgetUpdate() {
  if (Platform.OS !== 'android') return;

  try {
    let income = 0;
    let expenses = 0;
    let currency = 'COP';
    let language: 'en' | 'es' = 'en';
    let subtitle = '';

    try {
      const db = getDb();

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

      const cycleSetting = db.getFirstSync<{ val: string }>(
        "SELECT val FROM settings WHERE id = 'cycleStartDay'",
      );
      const cycleStartDay = cycleSetting?.val
        ? parseInt(cycleSetting.val, 10) || 1
        : 1;

      const calRange = getMonthRange(cycleStartDay);
      const calStartStr = getLocalISOString(calRange.startDate);
      const calEndStr = getLocalISOString(calRange.endDate);

      const calTransactions = db.getAllSync<{
        type: string;
        amount: number;
        note: string;
      }>(
        'SELECT type, amount, note FROM transactions WHERE date >= ? AND date <= ?',
        [calStartStr, calEndStr],
      );

      const adjustmentNotes = [
        translations.en.balanceAdjustment,
        translations.es.balanceAdjustment,
      ];

      let hasCalData = false;
      calTransactions.forEach((t) => {
        const isAdjustment = t.note && adjustmentNotes.includes(t.note);
        if (!isAdjustment && t.amount > 0) {
          hasCalData = true;
        }
      });

      const range = hasCalData ? calRange : getLast30DaysRange();
      const startStr = getLocalISOString(range.startDate);
      const endStr = getLocalISOString(range.endDate);

      const transactions = hasCalData
        ? calTransactions
        : db.getAllSync<{
            type: string;
            amount: number;
            note: string;
          }>(
            'SELECT type, amount, note FROM transactions WHERE date >= ? AND date <= ?',
            [startStr, endStr],
          );

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

      const now = new Date();
      const locale = language === 'es' ? esLocale : enUS;
      const formattedMonth = format(now, 'MMMM yyyy', { locale });
      const capitalizedMonth =
        formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

      const langSet = translations[language] || translations.en;
      subtitle = hasCalData ? capitalizedMonth : langSet.filterLast30Days;
    } catch (e) {
      console.error('Error querying DB for widget updater:', e);
      const langSet = translations[language] || translations.en;
      subtitle = langSet.filterLast30Days;
    }

    requestWidgetUpdate({
      widgetName: 'HabitMoneyWidget',
      renderWidget: () => ({
        light: (
          <HabitMoneyWidget
            income={income}
            expenses={expenses}
            currency={currency}
            language={language}
            subtitle={subtitle}
            theme="light"
          />
        ),
        dark: (
          <HabitMoneyWidget
            income={income}
            expenses={expenses}
            currency={currency}
            language={language}
            subtitle={subtitle}
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
