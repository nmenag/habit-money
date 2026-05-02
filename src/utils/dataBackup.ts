import * as DocumentPicker from 'expo-document-picker';
import {
  documentDirectory,
  EncodingType,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { getDb } from '../db/schema';
import { getLocalDateString, getLocalISOString } from './dateUtils';

let isBackupInProgress = false;
let isRestoreInProgress = false;

export const backupToJSON = async () => {
  if (isBackupInProgress) return;
  isBackupInProgress = true;
  const db = getDb();
  try {
    const accounts = db.getAllSync('SELECT * FROM accounts');
    const transactions = db.getAllSync('SELECT * FROM transactions');
    const categories = db.getAllSync('SELECT * FROM categories');
    const budgets = db.getAllSync('SELECT * FROM budgets');
    const goals = db.getAllSync('SELECT * FROM goals');
    const settings = db.getAllSync('SELECT * FROM settings');

    const backupData = {
      version: 1,
      timestamp: getLocalISOString(),
      data: {
        accounts,
        transactions,
        categories,
        budgets,
        goals,
        settings,
      },
    };

    const fileName = `habitmoney_backup_${getLocalDateString()}.json`;
    const fileUri = `${documentDirectory}${fileName}`;

    await writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2), {
      encoding: EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    }
  } catch (error) {
    console.error('Backup error:', error);
    Alert.alert('Error', 'Failed to create backup');
  } finally {
    isBackupInProgress = false;
  }
};

export const restoreFromJSON = async (
  onSuccess: () => void,
  t: (key: any) => string,
) => {
  if (isRestoreInProgress) return;
  isRestoreInProgress = true;
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const fileUri = result.assets[0].uri;
    const content = await readAsStringAsync(fileUri);
    let backup;
    try {
      backup = JSON.parse(content);
    } catch {
      Alert.alert(t('error'), t('restoreError'));
      return;
    }

    if (!backup.data || !backup.data.accounts) {
      Alert.alert(t('error'), t('restoreError'));
      return;
    }

    const { accounts, transactions, categories, budgets, goals, settings } =
      backup.data;

    const db = getDb();

    db.execSync('PRAGMA foreign_keys = OFF;');
    db.execSync('DELETE FROM transactions;');
    db.execSync('DELETE FROM accounts;');
    db.execSync('DELETE FROM categories;');
    db.execSync('DELETE FROM budgets;');
    db.execSync('DELETE FROM goals;');
    db.execSync('DELETE FROM settings;');

    const insertAccount = db.prepareSync(
      'INSERT INTO accounts (id, name, type, initialBalance, currentBalance, color, currency, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    );
    try {
      accounts.forEach((a: any) =>
        insertAccount.executeSync([
          a.id,
          a.name,
          a.type,
          a.initialBalance,
          a.currentBalance,
          a.color,
          a.currency || 'COP',
          a.displayOrder || 0,
        ]),
      );
    } finally {
      insertAccount.finalizeSync();
    }

    const insertCategory = db.prepareSync(
      'INSERT INTO categories (id, name, type, icon, color, displayOrder) VALUES (?, ?, ?, ?, ?, ?)',
    );
    try {
      categories.forEach((c: any) =>
        insertCategory.executeSync([
          c.id,
          c.name,
          c.type,
          c.icon,
          c.color,
          c.displayOrder || 0,
        ]),
      );
    } finally {
      insertCategory.finalizeSync();
    }

    const insertTransaction = db.prepareSync(
      'INSERT INTO transactions (id, type, amount, categoryId, accountId, budgetId, date, note, toAccountId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    try {
      transactions.forEach((t: any) =>
        insertTransaction.executeSync([
          t.id,
          t.type,
          t.amount,
          t.categoryId,
          t.accountId,
          t.budgetId,
          t.date,
          t.note,
          t.toAccountId || null,
        ]),
      );
    } finally {
      insertTransaction.finalizeSync();
    }

    const insertBudget = db.prepareSync(
      'INSERT INTO budgets (id, name, amount, color, categoryId, displayOrder) VALUES (?, ?, ?, ?, ?, ?)',
    );
    try {
      budgets.forEach((b: any) =>
        insertBudget.executeSync([
          b.id,
          b.name || '',
          b.amount,
          b.color,
          b.categoryId,
          b.displayOrder || 0,
        ]),
      );
    } finally {
      insertBudget.finalizeSync();
    }

    // Goals
    const insertGoal = db.prepareSync(
      'INSERT INTO goals (id, name, targetAmount, currentAmount, color, icon, deadline, status, displayOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );
    try {
      goals.forEach((g: any) =>
        insertGoal.executeSync([
          g.id,
          g.name,
          g.targetAmount,
          g.currentAmount,
          g.color,
          g.icon,
          g.deadline,
          g.status,
          g.displayOrder || 0,
        ]),
      );
    } finally {
      insertGoal.finalizeSync();
    }

    const insertSetting = db.prepareSync(
      'INSERT INTO settings (id, val) VALUES (?, ?)',
    );
    try {
      settings.forEach((s: any) => insertSetting.executeSync([s.id, s.val]));
    } finally {
      insertSetting.finalizeSync();
    }

    db.execSync('PRAGMA foreign_keys = ON;');

    onSuccess();
    Alert.alert(t('success'), t('restoreSuccess'));
  } catch (error) {
    console.error('Restore error:', error);
    Alert.alert(t('error'), t('restoreError'));
  } finally {
    isRestoreInProgress = false;
  }
};

export const checkBackupReminder = async (t: (key: any) => string) => {
  const db = getDb();
  const today = getLocalDateString();

  const txCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM transactions',
  );
  if (!txCount || txCount.count === 0) return;

  let onboardingDateRow;
  try {
    onboardingDateRow = db.getFirstSync<{ val: string }>(
      "SELECT val FROM settings WHERE id = 'onboarding_date'",
    );
  } catch {}

  if (onboardingDateRow?.val === today) return;

  let lastReminderRow;
  try {
    lastReminderRow = db.getFirstSync<{ val: string }>(
      "SELECT val FROM settings WHERE id = 'last_backup_reminder_date'",
    );
  } catch {}

  const lastReminderDate = lastReminderRow?.val || '';

  if (lastReminderDate !== today) {
    Alert.alert(t('backupReminder'), t('backupReminderDesc'), [
      {
        text: t('backupLater'),
        style: 'cancel',
        onPress: () => {
          try {
            db.runSync(
              'INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)',
              ['last_backup_reminder_date', today],
            );
          } catch (e) {
            console.error('Failed to save reminder date', e);
          }
        },
      },
      {
        text: t('backupNow'),
        onPress: async () => {
          try {
            db.runSync(
              'INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)',
              ['last_backup_reminder_date', today],
            );
          } catch (e) {
            console.error('Failed to save reminder date', e);
          }
          await backupToJSON();
        },
      },
    ]);
  }
};
