import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
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
      delayLongPress={180}
      disabled={isActive}
      accessibilityLabel={`${translateName(account.name)}, ${t(account.type)}, ${formatCurrency(account.currentBalance, account.currency)}`}
      accessibilityRole="button"
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          {/* Reorder drag handle indicator */}
          {onLongPress && (
            <View style={styles.dragHandle} pointerEvents="none">
              <Ionicons
                name="reorder-two-outline"
                size={18}
                color={theme.colors.outline}
                style={{ opacity: 0.35 }}
              />
            </View>
          )}

          {/* Account Icon Badge with premium desaturated border */}
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

          {/* Details & Hierarchy */}
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

          {/* Large, beautiful balance display */}
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
      marginRight: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    textContainer: {
      flex: 1.2,
      justifyContent: 'center',
    },
    name: {
      fontSize: fontScale(14),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      letterSpacing: -0.1,
    },
    badgeRow: {
      flexDirection: 'row',
      marginTop: 4,
    },
    typeText: {
      fontSize: fontScale(8),
      fontFamily: 'Inter-Medium',
      fontWeight: '500',
      letterSpacing: 1,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      overflow: 'hidden',
    },
    balanceContainer: {
      alignItems: 'flex-end',
      justifyContent: 'center',
      flex: 1,
      marginRight: 4,
    },
    balanceText: {
      fontSize: fontScale(15),
      fontFamily: 'Inter-SemiBold',
      fontWeight: '600',
      letterSpacing: -0.2,
    },
  });
