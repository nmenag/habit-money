import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { exportTransactionsToCSV } from '../csvExport';
import { Account, Category, Transaction } from '../../store/useStore';

describe('exportTransactionsToCSV', () => {
  const mockTranslate = (key: string) => `trans_${key}`;
  const mockTranslateName = (name: string) => `name_${name}`;

  const mockAccounts: Account[] = [
    {
      id: 'acc1',
      name: 'Main Bank',
      type: 'bank',
      initialBalance: 1000,
      currentBalance: 2000,
      currency: 'USD',
      displayOrder: 1,
    },
    {
      id: 'acc2',
      name: 'Cash',
      type: 'cash',
      initialBalance: 50,
      currentBalance: 150,
      currency: 'COP',
      displayOrder: 2,
    },
    {
      id: 'acc3',
      name: '',
      type: 'bank',
      initialBalance: 0,
      currentBalance: 0,
      currency: '',
      displayOrder: 3,
    },
  ];

  const mockCategories: Category[] = [
    { id: 'cat1', name: 'Groceries', type: 'expense', displayOrder: 1 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
  });

  it('exports CSV formatted correctly with income, expense, transfer, and notes with quotes', async () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'income',
        amount: 500,
        date: '2026-05-15T10:00:00.000',
        accountId: 'acc1',
        categoryId: 'cat1',
        note: 'Salary "bonus"',
      },
      {
        id: '2',
        type: 'expense',
        amount: 50,
        date: '2026-05-16T12:00:00.000',
        accountId: 'acc2',
        categoryId: 'cat1',
      },
      {
        id: '3',
        type: 'transfer',
        amount: 100,
        date: '2026-05-17T14:00:00.000',
        accountId: 'acc1',
        toAccountId: 'acc2',
        categoryId: null,
      },
      {
        id: '4',
        type: 'other' as any,
        amount: 10,
        date: '2026-05-18T16:00:00.000',
        accountId: 'non_existent_account',
        categoryId: null,
      },
      {
        id: '5',
        type: 'transfer',
        amount: 20,
        date: '2026-05-19T18:00:00.000',
        accountId: 'acc3',
        toAccountId: 'missing_acc',
        categoryId: null,
      },
    ];

    await exportTransactionsToCSV(
      transactions,
      mockAccounts,
      mockCategories,
      mockTranslate,
      mockTranslateName,
    );

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledTimes(1);
    const [fileUri, csvContent] = (FileSystem.writeAsStringAsync as jest.Mock)
      .mock.calls[0];

    expect(fileUri).toContain('habitmoney_transactions_');
    expect(csvContent).toContain('trans_date,trans_type,trans_amount');
    expect(csvContent).toContain('Salary ""bonus""');
    expect(csvContent).toContain('trans_unknown');
    expect(csvContent).toContain('trans_uncategorized');
    expect(Sharing.shareAsync).toHaveBeenCalledWith(fileUri);
  });

  it('falls back to "Unknown" when t("unknown") returns empty string', async () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        type: 'income',
        amount: 50,
        date: '2026-05-15T10:00:00.000',
        accountId: 'non_existent',
        categoryId: null,
      },
    ];

    const emptyT = (key: string) => (key === 'unknown' ? '' : `t_${key}`);

    await exportTransactionsToCSV(
      transactions,
      mockAccounts,
      mockCategories,
      emptyT,
      mockTranslateName,
    );

    const [, csvContent] = (
      FileSystem.writeAsStringAsync as jest.Mock
    ).mock.calls.pop();
    expect(csvContent).toContain('"Unknown"');
  });

  it('handles case when Sharing is not available', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await exportTransactionsToCSV(
      [],
      mockAccounts,
      mockCategories,
      mockTranslate,
      mockTranslateName,
    );

    expect(consoleSpy).toHaveBeenCalledWith('Sharing is not available');
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles and logs file write error', async () => {
    (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValue(
      new Error('Disk full'),
    );
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await exportTransactionsToCSV(
      [],
      mockAccounts,
      mockCategories,
      mockTranslate,
      mockTranslateName,
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error exporting CSV:',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });
});
