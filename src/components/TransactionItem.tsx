import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Avatar, List, Text, useTheme } from 'react-native-paper';
import {
  Category,
  Transaction,
  useStore,
  useTranslation,
} from '../store/useStore';

interface Props {
  transaction: Transaction;
  category?: Category;
}

export const TransactionItem: React.FC<Props> = ({ transaction, category }) => {
  const { accounts, formatCurrency } = useStore();
  const { t, language } = useTranslation();
  const theme = useTheme();
  const isIncome = transaction.type === 'income';

  const account = accounts.find((a) => a.id === transaction.accountId);
  const accountCurrency = account?.currency || 'COP';

  const dateLocale = language === 'es' ? es : enUS;

  const LeftContent = (props: any) => (
    <Avatar.Text
      {...props}
      size={40}
      label={category?.name ? category.name[0].toUpperCase() : '?'}
      style={[
        styles.avatar,
        { backgroundColor: category?.color || theme.colors.surfaceVariant },
      ]}
      labelStyle={{ color: '#fff' }}
    />
  );

  const RightContent = () => (
    <Text
      variant="titleMedium"
      style={[
        styles.amount,
        { color: isIncome ? '#4caf50' : theme.colors.error },
      ]}
    >
      {isIncome ? '+' : '-'}
      {formatCurrency(transaction.amount, accountCurrency)}
    </Text>
  );

  return (
    <List.Item
      title={category?.name || t('uncategorized')}
      description={`${format(parseISO(transaction.date), 'MMM d, yyyy', {
        locale: dateLocale,
      })}${transaction.note ? ` • ${transaction.note}` : ''}`}
      left={LeftContent}
      right={RightContent}
      style={styles.listItem}
      titleStyle={styles.capitalize}
    />
  );
};

const styles = StyleSheet.create({
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  avatar: {
    borderRadius: 12,
  },
  amount: {
    alignSelf: 'center',
    fontWeight: '700',
  },
  capitalize: {
    textTransform: 'capitalize',
    fontWeight: '700',
  },
});
