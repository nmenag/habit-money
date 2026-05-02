import {
  documentDirectory,
  EncodingType,
  writeAsStringAsync,
} from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Account, Category, Transaction } from '../store/useStore';
import { getLocalDateString } from './dateUtils';

export const exportTransactionsToCSV = async (
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  t: any,
  translateName: (name: string) => string,
) => {
  const header = `${t('date')},${t('type')},${t('amount')},${t('currency')},${t('accounts')},${t('categories')},${t('note')}\n`;
  const rows = transactions
    .map((tX) => {
      const account = accounts.find((a) => a.id === tX.accountId);
      const toAccount = tX.toAccountId
        ? accounts.find((a) => a.id === tX.toAccountId)
        : null;
      const category = categories.find((c) => c.id === tX.categoryId);

      const date = tX.date.split('T')[0];
      let type = '';
      if (tX.type === 'income') type = t('income');
      else if (tX.type === 'expense') type = t('expense');
      else if (tX.type === 'transfer') type = t('transfer');

      const amount = tX.amount;
      const currency = account?.currency || 'COP';

      const accountName = account?.name
        ? translateName(account.name)
        : t('unknown') || 'Unknown';

      let destinationName = '';
      if (tX.type === 'transfer' && toAccount) {
        destinationName = translateName(toAccount.name);
      } else if (category) {
        destinationName = translateName(category.name);
      } else {
        destinationName = t('uncategorized');
      }

      const note = tX.note ? `"${tX.note.replace(/"/g, '""')}"` : '';

      return `${date},${type},${amount},${currency},"${accountName}","${destinationName}",${note}`;
    })
    .join('\n');

  const csvContent = '\uFEFF' + header + rows;
  const fileName = `finhabit_transactions_${getLocalDateString()}.csv`;
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
