import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Avatar, Card, IconButton, Text, useTheme } from 'react-native-paper';
import { Account, useStore, useTranslation } from '../store/useStore';
import { spacing, lightTheme, darkTheme } from '../theme/theme';

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
  const theme = useTheme();
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
        return 'cash';
      case 'bank':
        return 'bank';
      case 'credit':
        return 'credit-card-outline';
      default:
        return 'wallet';
    }
  };

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: isActive
            ? theme.colors.elevation.level3
            : account.color 
              ? `${account.color}0A` // Subtle background tint for structural grouping
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
        <Avatar.Icon
          size={44}
          icon={getAccountIcon(account.type)}
          style={[
            styles.avatar,
            { backgroundColor: account.color || theme.colors.primaryContainer },
          ]}
          color={theme.colors.onPrimary}
        />
        <View style={styles.content}>
          <Text variant="labelMedium" style={styles.type}>
            {t(account.type).toUpperCase()}
          </Text>
          <Text variant="titleMedium" style={styles.name}>
            {translateName(account.name)}
          </Text>
        </View>
        <View style={styles.rightSection}>
          <Text 
            variant="titleLarge" 
            style={[
              styles.balance, 
              { color: account.currentBalance < 0 ? theme.colors.error : theme.colors.onSurface }
            ]}
          >
            {formatCurrency(account.currentBalance, account.currency)}
          </Text>
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

const defaultStyles = (theme: typeof lightTheme | typeof darkTheme) =>
  StyleSheet.create({
    card: {
      marginVertical: spacing.xs,
      marginHorizontal: spacing.md,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md, // Increased for better rhythm
      paddingHorizontal: spacing.md,
    },
    avatar: {
      marginRight: spacing.md,
    },
    content: {
      flex: 1,
    },
    name: {
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginVertical: 2,
    },
    type: {
      letterSpacing: 1.2,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '800',
      fontSize: 12,
    },
    rightSection: {
      alignItems: 'flex-end',
    },
    balance: {
      fontWeight: '900',
    },
    deleteButton: {
      margin: 0,
    },
  });
