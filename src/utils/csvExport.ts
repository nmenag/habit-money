// @ts-ignore
import {
  writeAsStringAsync,
  documentDirectory,
  EncodingType,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Transaction, Account, Category } from '../store/useStore';

export const exportTransactionsToCSV = async (
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
) => {
  const header = 'Date,Type,Amount,Currency,Account,Category,Note\n';
  const rows = transactions
    .map((t) => {
      const account = accounts.find((a) => a.id === t.accountId);
      const category = categories.find((c) => c.id === t.categoryId);

      const date = t.date.split('T')[0];
      const type = t.type;
      const amount = t.amount;
      const currency = account?.currency || 'COP';
      const accountName = account?.name || 'Unknown';
      const categoryName = category?.name || 'Uncategorized';
      const note = t.note ? `"${t.note.replace(/"/g, '""')}"` : '';

      return `${date},${type},${amount},${currency},"${accountName}","${categoryName}",${note}`;
    })
    .join('\n');

  const csvContent = header + rows;
  const fileName = `finhabit_transactions_${new Date().toISOString().split('T')[0]}.csv`;
  const fileUri = `${documentDirectory}${fileName}`;

  try {
    await writeAsStringAsync(fileUri, csvContent, {
      encoding: EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      console.error('Sharing is not available');
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
  }
};
