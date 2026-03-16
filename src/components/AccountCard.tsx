import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';
import { Account, useStore, useTranslation } from '../store/useStore';

interface Props {
  account: Account;
  onDelete?: () => void;
}

export const AccountCard: React.FC<Props> = ({ account, onDelete }) => {
  const { formatCurrency } = useStore();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);

  const handleDelete = () => {
    if (onDelete) {
      Alert.alert(
        t('deleteAccount'),
        t('deleteAccountConfirm', { name: account.name }),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: t('delete'), style: 'destructive', onPress: onDelete },
        ],
      );
    }
  };

  return (
    <Card
      style={[
        styles.card,
        { borderLeftColor: account.color || theme.colors.primary },
      ]}
      mode="elevated"
    >
      <Card.Content style={styles.cardContent}>
        <View style={styles.content}>
          <Text variant="labelMedium" style={styles.type}>
            {t(account.type).toUpperCase()}
          </Text>
          <Text variant="titleLarge" style={styles.name}>
            {account.name}
          </Text>
          <Text variant="headlineSmall" style={styles.balance}>
            {formatCurrency(account.currentBalance, account.currency)}
          </Text>
        </View>
        {onDelete && (
          <IconButton
            icon="trash-can-outline"
            iconColor={theme.colors.error}
            size={24}
            onPress={handleDelete}
            style={styles.deleteButton}
          />
        )}
      </Card.Content>
    </Card>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      marginVertical: 8,
      marginHorizontal: 16,
      borderLeftWidth: 6,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
    },
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
    },
    content: {
      flex: 1,
    },
    name: {
      fontWeight: '900',
      color: theme.colors.onSurface,
      marginVertical: 2,
    },
    type: {
      letterSpacing: 1,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '700',
    },
    balance: {
      fontWeight: '900',
      marginTop: 8,
      color: theme.colors.onSurface,
    },
    deleteButton: {
      margin: 0,
    },
  });
