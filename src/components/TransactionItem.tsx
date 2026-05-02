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

    const isAdjustment =
      transaction.note &&
      translateName(transaction.note) === t('balanceAdjustment');

    const LeftContent = (props: any) => {
      if (transaction.type === 'transfer') {
        return (
          <Avatar.Icon
            {...props}
            size={40}
            icon="swap-horizontal"
            style={[styles.avatar, { backgroundColor: theme.colors.tertiary }]}
            color="#fff"
          />
        );
      }

      if (isAdjustment) {
        return (
          <Avatar.Icon
            {...props}
            size={40}
            icon="scale-balance"
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
            color={theme.colors.onSurfaceVariant}
          />
        );
      }

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

    const RightContent = () => {
      const isTransfer = transaction.type === 'transfer';
      return (
        <View style={styles.rightContainer}>
          <Text
            variant="titleMedium"
            style={[
              styles.amount,
              {
                color: isTransfer
                  ? theme.colors.onSurface
                  : isIncome
                    ? '#16A34A'
                    : theme.colors.error,
              },
            ]}
          >
            {isTransfer ? '' : isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount, accountCurrency)}
          </Text>
        </View>
      );
    };

    const displayTitle = () => {
      if (transaction.type === 'transfer') return t('transfer');
      if (isAdjustment) return t('balanceAdjustment');
      if (category?.name) return translateName(category.name);
      return t('uncategorized');
    };

    return (
      <List.Item
        title={displayTitle()}
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
    paddingHorizontal: 16,
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
