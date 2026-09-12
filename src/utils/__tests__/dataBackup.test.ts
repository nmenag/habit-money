import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getDb } from '../../db/schema';
import { getLocalDateString } from '../dateUtils';
import { backupToJSON, restoreFromJSON } from '../dataBackup';

jest.mock('../../db/schema', () => ({
  getDb: jest.fn(),
}));

jest.spyOn(Alert, 'alert');
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('dataBackup', () => {
  let mockDb: any;
  let mockPreparedStatement: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPreparedStatement = {
      executeSync: jest.fn(),
      finalizeSync: jest.fn(),
    };

    mockDb = {
      getAllSync: jest.fn().mockImplementation((query: string) => {
        if (query.includes('accounts')) return [{ id: 'acc-1', name: 'Cash' }];
        if (query.includes('transactions'))
          return [{ id: 'tx-1', amount: 100 }];
        if (query.includes('categories'))
          return [{ id: 'cat-1', name: 'Food' }];
        if (query.includes('budgets')) return [{ id: 'b-1', amount: 500 }];
        if (query.includes('settings')) return [{ id: 'currency', val: 'USD' }];
        return [];
      }),
      getFirstSync: jest.fn(),
      execSync: jest.fn(),
      runSync: jest.fn(),
      prepareSync: jest.fn().mockReturnValue(mockPreparedStatement),
    };

    (getDb as jest.Mock).mockReturnValue(mockDb);
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);
  });

  describe('backupToJSON', () => {
    it('creates a backup file and shares it if sharing is available', async () => {
      await backupToJSON();

      expect(mockDb.getAllSync).toHaveBeenCalledWith('SELECT * FROM accounts');
      expect(mockDb.getAllSync).toHaveBeenCalledWith(
        'SELECT * FROM transactions',
      );
      expect(mockDb.getAllSync).toHaveBeenCalledWith(
        'SELECT * FROM categories',
      );
      expect(mockDb.getAllSync).toHaveBeenCalledWith('SELECT * FROM budgets');
      expect(mockDb.getAllSync).toHaveBeenCalledWith('SELECT * FROM settings');

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('habitmoney_backup_'),
        expect.stringContaining('"version": 1'),
        expect.objectContaining({ encoding: FileSystem.EncodingType.UTF8 }),
      );
      expect(Sharing.shareAsync).toHaveBeenCalled();
    });

    it('does not share if Sharing.isAvailableAsync is false', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      await backupToJSON();

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });

    it('handles backup errors gracefully and alerts user', async () => {
      mockDb.getAllSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      await backupToJSON();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to create backup',
      );
    });
  });

  describe('restoreFromJSON', () => {
    const mockT = (key: string) => key;
    const onSuccess = jest.fn();

    it('does nothing if user cancels document picker', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: null,
      });

      await restoreFromJSON(onSuccess, mockT);

      expect(FileSystem.readAsStringAsync).not.toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('shows error if backup content is invalid JSON', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://invalid.json' }],
      });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        'invalid json',
      );

      await restoreFromJSON(onSuccess, mockT);

      expect(Alert.alert).toHaveBeenCalledWith('error', 'restoreError');
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('shows error if backup structure is missing accounts', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://empty.json' }],
      });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({ data: {} }),
      );

      await restoreFromJSON(onSuccess, mockT);

      expect(Alert.alert).toHaveBeenCalledWith('error', 'restoreError');
      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('restores database records from valid backup JSON and invokes onSuccess', async () => {
      const validBackup = {
        version: 1,
        data: {
          accounts: [
            {
              id: 'a1',
              name: 'Cash',
              type: 'cash',
              initialBalance: 0,
              currentBalance: 100,
              color: '#000',
            },
          ],
          categories: [
            {
              id: 'c1',
              name: 'Food',
              type: 'expense',
              icon: 'food',
              color: '#fff',
            },
          ],
          transactions: [
            {
              id: 't1',
              type: 'expense',
              amount: 20,
              categoryId: 'c1',
              accountId: 'a1',
              budgetId: 'b1',
              date: '2026-03-01T12:00:00.000',
              note: 'Lunch',
              toAccountId: null,
            },
          ],
          budgets: [
            {
              id: 'b1',
              name: 'Food Budget',
              amount: 200,
              color: '#fff',
              categoryId: 'c1',
            },
          ],
          settings: [{ id: 'currency', val: 'COP' }],
        },
      };

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://valid.json' }],
      });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(validBackup),
      );

      await restoreFromJSON(onSuccess, mockT);

      expect(mockDb.execSync).toHaveBeenCalledWith(
        'PRAGMA foreign_keys = OFF;',
      );
      expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM transactions;');
      expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM accounts;');
      expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM categories;');
      expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM budgets;');
      expect(mockDb.execSync).toHaveBeenCalledWith('DELETE FROM settings;');
      expect(mockDb.execSync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');

      expect(mockPreparedStatement.executeSync).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('success', 'restoreSuccess');
    });

    it('handles unexpected exceptions during restore and alerts', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Permission denied'),
      );

      await restoreFromJSON(onSuccess, mockT);

      expect(Alert.alert).toHaveBeenCalledWith('error', 'restoreError');
    });
  });

  describe('checkBackupReminder', () => {
    const mockT = (key: string) => key;
    let checkReminderFn: any;

    beforeEach(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('../dataBackup');
        checkReminderFn = mod.checkBackupReminder;
      });
    });

    it('does not trigger if transaction count is 0', async () => {
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      await checkReminderFn(mockT);

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('does not trigger if onboarding was completed today', async () => {
      const today = getLocalDateString();
      mockDb.getFirstSync
        .mockReturnValueOnce({ count: 5 }) // txCount
        .mockReturnValueOnce({ val: today }); // onboarding_date matches today

      await checkReminderFn(mockT);

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('does not prompt if reminder was already shown today', async () => {
      const today = getLocalDateString();
      mockDb.getFirstSync
        .mockReturnValueOnce({ count: 5 }) // txCount
        .mockReturnValueOnce({ val: '2020-01-01' }) // onboarding_date in past
        .mockReturnValueOnce({ val: today }); // last_backup_reminder_date is today

      await checkReminderFn(mockT);

      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('prompts user when criteria are met and handles backupLater and backupNow', async () => {
      mockDb.getFirstSync
        .mockReturnValueOnce({ count: 5 })
        .mockReturnValueOnce({ val: '2020-01-01' })
        .mockReturnValueOnce({ val: '2020-01-02' }); // last reminder was in past

      await checkReminderFn(mockT);

      expect(Alert.alert).toHaveBeenCalledWith(
        'backupReminder',
        'backupReminderDesc',
        expect.any(Array),
      );

      const alertButtons = (Alert.alert as jest.Mock).mock.calls[0][2];
      const laterBtn = alertButtons.find((b: any) => b.text === 'backupLater');
      const nowBtn = alertButtons.find((b: any) => b.text === 'backupNow');

      laterBtn.onPress();
      expect(mockDb.runSync).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO settings (id, val) VALUES (?, ?)',
        ['last_backup_reminder_date', getLocalDateString()],
      );

      await nowBtn.onPress();
      expect(mockDb.runSync).toHaveBeenCalled();
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });
  });
});
