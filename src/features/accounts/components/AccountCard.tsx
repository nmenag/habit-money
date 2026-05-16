import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';
import { Account, useStore, useTranslation } from '../../../store/useStore';
import { AppTheme } from '../../../theme/theme';

interface Props {
  account: Account;
  onDelete?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
  isActive?: boolean;
}

export const AccountCard: React.FC<Props> = ({
  account,
  onDelete,
  onPress,
  onLongPress,
  isActive,
}) => {
  const { formatCurrency } = useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);

  const handleDelete = () => {
    if (onDelete) {
      Alert.alert(
        t('deleteAccount'),
        t('deleteAccountConfirm', { name: translateName(account.name) }),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('delete'), style: 'destructive', onPress: onDelete },
        ],
      );
    }
  };

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

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: isActive
            ? theme.colors.elevation.level3
            : theme.colors.surface,
        },
      ]}
      mode="elevated"
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={isActive}
      accessibilityLabel={`${translateName(account.name)}, ${t(account.type)}, ${formatCurrency(account.currentBalance, account.currency)}`}
      accessibilityRole="button"
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: account.color || theme.colors.primary },
            ]}
          >
            <Ionicons
              name={getAccountIcon(account.type) as any}
              size={24}
              color={theme.colors.onPrimary}
            />
          </View>
          <View style={styles.textContainer}>
            <Text variant="titleMedium" style={styles.name}>
              {translateName(account.name)}
            </Text>
            <Text
              variant="labelMedium"
              style={[styles.typeText, { color: theme.colors.outline }]}
            >
              {t(account.type).toUpperCase()}
            </Text>
          </View>
          <View style={styles.balanceContainer}>
            <Text
              variant="titleMedium"
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
          {onDelete && (
            <IconButton
              icon="trash-can-outline"
              iconColor={theme.colors.error}
              size={20}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              style={styles.deleteButton}
            />
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      marginBottom: 16,
      borderRadius: 16,
      overflow: 'hidden',
    },
    cardContent: {
      padding: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
      elevation: 2,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    textContainer: {
      flex: 1,
    },
    name: {
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    typeText: {
      marginTop: 2,
      fontWeight: '500',
    },
    balanceContainer: {
      alignItems: 'flex-end',
      marginRight: 8,
      flexShrink: 1,
    },
    balanceText: {
      fontWeight: '800',
    },
    deleteButton: {
      margin: 0,
    },
  });
