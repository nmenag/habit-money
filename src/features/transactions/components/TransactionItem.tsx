import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import React, { useCallback, memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, List, Text, useTheme } from 'react-native-paper';
import {
  Category,
  Transaction,
  useStore,
  useTranslation,
} from '../../../store/useStore';
import { spacing, AppTheme } from '../../../theme/theme';
import { getValidCategoryIcon } from '../../../constants';

interface Props {
  transaction: Transaction;
  category?: Category;
}

// Hex/RGB transparency utility for desaturated accent overlays with bulletproof fallbacks
const addAlpha = (
  color: string | undefined,
  opacity: number,
  fallbackHex: string,
) => {
  let resolvedColor = color || fallbackHex;

  if (typeof resolvedColor !== 'string') {
    resolvedColor = fallbackHex;
  }

  if (resolvedColor.startsWith('rgb')) {
    const match = resolvedColor.match(/\d+/g);
    if (match && match.length >= 3) {
      return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${opacity})`;
    }
  }

  if (!resolvedColor.startsWith('#')) {
    resolvedColor = fallbackHex;
  }

  const hex = resolvedColor.replace('#', '');
  const alpha = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${hex}${alpha}`;
};

export const TransactionItem: React.FC<Props> = memo(
  ({ transaction, category }) => {
    const accountCurrency = useStore(
      (state) =>
        state.accounts.find((a) => a.id === transaction.accountId)?.currency ||
        'COP',
    );
    const formatCurrency = useStore((state) => state.formatCurrency);
    const language = useStore((state) => state.language);

    const { t, translateName } = useTranslation();
    const theme = useTheme<AppTheme>();
    const styles = defaultStyles(theme);

    const isIncome = transaction.type === 'income';
    const dateLocale = useMemo(
      () => (language === 'es' ? es : enUS),
      [language],
    );

    const isAdjustment = useMemo(
      () =>
        transaction.note &&
        translateName(transaction.note) === t('balanceAdjustment'),
      [transaction.note, translateName, t],
    );

    const isTransfer = transaction.type === 'transfer';

    const LeftContent = useCallback(
      (props: any) => {
        if (isTransfer) {
          const accentColor = theme.dark ? '#60A5FA' : '#3B82F6';
          return (
            <Avatar.Icon
              {...props}
              size={40}
              icon="swap-horizontal"
              style={[
                styles.avatar,
                {
                  backgroundColor: addAlpha(accentColor, 0.08, '#3B82F6'),
                  borderColor: addAlpha(accentColor, 0.17, '#3B82F6'),
                  borderWidth: 1,
                },
              ]}
              color={accentColor}
            />
          );
        }

        if (isAdjustment) {
          const accentColor = theme.colors.onSurfaceVariant;
          return (
            <Avatar.Icon
              {...props}
              size={40}
              icon="scale-balance"
              style={[
                styles.avatar,
                {
                  backgroundColor: addAlpha(accentColor, 0.08, '#64748B'),
                  borderColor: addAlpha(accentColor, 0.17, '#64748B'),
                  borderWidth: 1,
                },
              ]}
              color={accentColor}
            />
          );
        }

        const accentColor = category?.color || theme.colors.primary;
        const iconName =
          getValidCategoryIcon(category?.icon) || (isIncome ? 'plus' : 'minus');

        return (
          <Avatar.Icon
            {...props}
            size={40}
            icon={iconName}
            style={[
              styles.avatar,
              {
                backgroundColor: addAlpha(accentColor, 0.08, '#22C55E'),
                borderColor: addAlpha(accentColor, 0.17, '#22C55E'),
                borderWidth: 1,
              },
            ]}
            color={accentColor}
          />
        );
      },
      [isTransfer, isAdjustment, isIncome, category, theme, styles],
    );

    const RightContent = useCallback(() => {
      return (
        <View style={styles.rightContainer}>
          <Text
            style={[
              styles.amount,
              {
                color: isTransfer
                  ? theme.colors.onSurface
                  : isIncome
                    ? theme.colors.income
                    : theme.colors.error,
                fontFamily: 'Inter-Medium',
                fontWeight: '500',
                fontSize: 14,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {isTransfer ? '' : isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount, accountCurrency)}
          </Text>
        </View>
      );
    }, [
      isTransfer,
      isIncome,
      transaction.amount,
      accountCurrency,
      formatCurrency,
      theme,
      styles,
    ]);

    const displayTitle = useMemo(() => {
      if (isTransfer) return t('transfer');
      if (isAdjustment) return t('balanceAdjustment');
      if (category?.name) return translateName(category.name);
      return t('uncategorized');
    }, [isTransfer, isAdjustment, category, translateName, t]);

    const formattedDate = useMemo(
      () =>
        format(parseISO(transaction.date), 'MMM d, yyyy', {
          locale: dateLocale,
        }),
      [transaction.date, dateLocale],
    );

    return (
      <List.Item
        title={displayTitle}
        description={`${formattedDate}${transaction.note ? ` • ${transaction.note}` : ''}`}
        left={LeftContent}
        right={RightContent}
        style={styles.listItem}
        titleStyle={styles.title}
        descriptionStyle={{
          fontFamily: 'Inter-Regular',
          fontWeight: '400',
          fontSize: 12,
          color: theme.colors.onSurfaceVariant,
        }}
        accessibilityLabel={`${displayTitle}, ${isTransfer ? t('transfer') : formatCurrency(transaction.amount, accountCurrency)}, ${formattedDate}`}
        accessibilityRole="button"
      />
    );
  },
);

TransactionItem.displayName = 'TransactionItem';

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    listItem: {
      height: 72,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      justifyContent: 'center',
    },
    rightContainer: {
      justifyContent: 'center',
      paddingRight: spacing.sm,
      flexShrink: 1,
      marginLeft: spacing.sm,
    },
    avatar: {
      borderRadius: 12,
    },
    amount: {
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
    title: {
      textTransform: 'capitalize',
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
    },
  });
