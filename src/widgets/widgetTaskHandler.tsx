import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { HabitMoneyWidget } from './HabitMoneyWidget';
import { format } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import { translations } from '../i18n/translations';
import { getDb, initDb } from '../db/schema';
import { getLast30DaysRange, getMonthRange } from '../utils/dateFilters';
import { getLocalISOString } from '../utils/dateUtils';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetAction, renderWidget } = props;

  if (widgetAction === 'WIDGET_DELETED') {
    return;
  }

  let income = 0;
  let expenses = 0;
  let currency = 'COP';
  let language: 'en' | 'es' = 'en';
  let subtitle = '';

  try {
    initDb();
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

    const now = new Date();
    const locale = language === 'es' ? esLocale : enUS;
    const formattedMonth = format(now, 'MMMM yyyy', { locale });
    const capitalizedMonth =
      formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1);

    const langSet = translations[language] || translations.en;
    subtitle = hasCalData ? capitalizedMonth : langSet.filterLast30Days;
  } catch (error) {
    console.error('Error fetching data for Android Widget:', error);
    const langSet = translations[language] || translations.en;
    subtitle = langSet.filterLast30Days;
  }

  renderWidget({
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
  });
}
