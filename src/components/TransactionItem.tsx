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
            size={44}
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
            size={44}
            icon="scale-balance"
            style={[
              styles.avatar,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
            color={theme.colors.onSurfaceVariant}
          />
        );
      }

      return (
        <Avatar.Icon
          {...props}
          size={44}
          icon={category?.icon || 'tag'}
          style={[
            styles.avatar,
            { backgroundColor: category?.color || theme.colors.primary },
          ]}
          color="#fff"
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
                    ? theme.colors.primary
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
        descriptionStyle={styles.description}
      />
    );
  },
);

TransactionItem.displayName = 'TransactionItem';

const styles = StyleSheet.create({
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rightContainer: {
    justifyContent: 'center',
    paddingRight: 4,
  },
  avatar: {
    borderRadius: 14,
  },
  amount: {
    fontWeight: '800',
    fontSize: 17,
  },
  capitalize: {
    textTransform: 'capitalize',
    fontWeight: '800',
    fontSize: 16,
  },
  description: {
    fontSize: 13,
    opacity: 0.6,
  },
});
