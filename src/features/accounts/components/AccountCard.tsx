import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

import { Account, useStore, useTranslation } from '../../../store/useStore';
import { AppTheme } from '../../../theme/theme';
import { fontScale } from '../../../utils/responsive';

interface Props {
  account: Account;
  onPress?: () => void;
  onLongPress?: () => void;
  isActive?: boolean;
}

export const AccountCard: React.FC<Props> = ({
  account,
  onPress,
  onLongPress,
  isActive,
}) => {
  const { formatCurrency } = useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return 'cash-outline';
      case 'bank':
        return 'business-outline';
      case 'credit':
        return 'card-outline';
      default:
        return 'wallet-outline';
    }
  };

  const accountColor = account.color || theme.colors.primary;

  const cardBackground = isActive
    ? theme.colors.elevation.level3
    : `${accountColor}12`;

  const cardBorder = isActive ? theme.colors.primary : `${accountColor}2B`;

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: cardBackground,
          borderColor: cardBorder,
        },
      ]}
      mode="contained"
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={200}
      disabled={isActive}
      accessibilityLabel={`${translateName(account.name)}, ${t(account.type)}, ${formatCurrency(account.currentBalance, account.currency)}`}
      accessibilityRole="button"
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          {onLongPress && (
            <TouchableOpacity
              onLongPress={onLongPress}
              delayLongPress={150}
              style={styles.dragHandle}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={t('holdAndDragToReorder')}
              hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
            >
              <Ionicons
                name="reorder-two-outline"
                size={20}
                color={isActive ? theme.colors.primary : theme.colors.outline}
                style={{ opacity: isActive ? 1 : 0.6 }}
              />
            </TouchableOpacity>
          )}

          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: `${accountColor}12`,
                borderColor: `${accountColor}2B`,
              },
            ]}
          >
            <Ionicons
              name={getAccountIcon(account.type) as any}
              size={20}
              color={accountColor}
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.name, { color: theme.colors.onSurface }]}>
              {translateName(account.name)}
            </Text>
            <View style={styles.badgeRow}>
              <Text
                style={[
                  styles.typeText,
                  {
                    color: accountColor,
                    backgroundColor: `${accountColor}12`,
                  },
                ]}
              >
                {t(account.type).toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.balanceContainer}>
            <Text
              style={[
                styles.balanceText,
                {
                  color:
                    account.currentBalance < 0
                      ? theme.colors.error
                      : theme.colors.onSurface,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(account.currentBalance, account.currency)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      marginBottom: 12,
      borderRadius: theme.roundness || 12,
      borderWidth: 1,
      overflow: 'hidden',
    },
    cardContent: {
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dragHandle: {
      width: 36,
      height: 44,
      marginRight: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
      marginRight: 8,
    },
    name: {
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      fontSize: fontScale(15),
      marginBottom: 4,
    },
    badgeRow: {
      flexDirection: 'row',
    },
    typeText: {
      fontSize: fontScale(11),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      letterSpacing: 0.5,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      overflow: 'hidden',
    },
    balanceContainer: {
      alignItems: 'flex-end',
    },
    balanceText: {
      fontSize: fontScale(15),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
    },
  });
