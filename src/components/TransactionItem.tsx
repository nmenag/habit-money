import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
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

export const TransactionItem: React.FC<Props> = memo(
  ({ transaction, category }) => {
    const accounts = useStore((state) => state.accounts);
    const formatCurrency = useStore((state) => state.formatCurrency);
    const { t, language, translateName } = useTranslation();
    const theme = useTheme();

    const isIncome = transaction.type === 'income';
    const account = accounts.find((a) => a.id === transaction.accountId);
    const accountCurrency = account?.currency || 'COP';
    const dateLocale = language === 'es' ? es : enUS;

    const LeftContent = (props: any) => {
      const displayName = category?.name ? translateName(category.name) : '?';
      const firstLetter =
        displayName && displayName.length > 0
          ? displayName[0].toUpperCase()
          : '?';

      return (
        <Avatar.Text
          {...props}
          size={40}
          label={firstLetter}
          style={[
            styles.avatar,
            { backgroundColor: category?.color || theme.colors.surfaceVariant },
          ]}
          labelStyle={{ color: '#fff' }}
        />
      );
    };

    const RightContent = () => (
      <View style={styles.rightContainer}>
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
      </View>
    );

    return (
      <List.Item
        title={
          category?.name ? translateName(category.name) : t('uncategorized')
        }
        description={`${format(parseISO(transaction.date), 'MMM d, yyyy', {
          locale: dateLocale,
        })}${transaction.note ? ` • ${transaction.note}` : ''}`}
        left={LeftContent}
        right={RightContent}
        style={styles.listItem}
        titleStyle={styles.capitalize}
      />
    );
  },
);

TransactionItem.displayName = 'TransactionItem';

const styles = StyleSheet.create({
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rightContainer: {
    justifyContent: 'center',
    paddingRight: 8,
  },
  avatar: {
    borderRadius: 12,
  },
  amount: {
    fontWeight: '700',
  },
  capitalize: {
    textTransform: 'capitalize',
    fontWeight: '700',
  },
});
