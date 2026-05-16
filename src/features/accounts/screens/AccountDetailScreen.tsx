import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Avatar,
  Card,
  Divider,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { TransactionItem } from '../../transactions/components/TransactionItem';
import { useStore, useTranslation } from '../../../store/useStore';

export const AccountDetailScreen = () => {
  const params = useLocalSearchParams<{ accountId: string }>();
  const { accountId } = params;
  const { accounts, transactions, categories, formatCurrency } = useStore();
  const { t, translateName } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const account = accounts.find((a) => a.id === accountId);

  const accountTransactions = useMemo(() => {
    return transactions
      .filter(
        (tx) => tx.accountId === accountId || tx.toAccountId === accountId,
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, accountId]);

  if (!account) {
    return (
      <View style={styles.container}>
        <Text>{t('accountNotFound' as any) || 'Account not found'}</Text>
      </View>
    );
  }

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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
        }}
      >
        <Card style={styles.headerCard} mode="contained">
          <Card.Content style={styles.headerContent}>
            <Avatar.Icon
              size={64}
              icon={getAccountIcon(account.type)}
              style={{
                backgroundColor: account.color || theme.colors.primary,
                marginBottom: 12,
              }}
              color="#fff"
            />
            <Text variant="headlineSmall" style={styles.accountName}>
              {translateName(account.name)}
            </Text>
            <Text variant="labelMedium" style={styles.accountType}>
              {t(account.type).toUpperCase()}
            </Text>
            <Text variant="displaySmall" style={styles.accountBalance}>
              {formatCurrency(account.currentBalance, account.currency)}
            </Text>

            <View style={styles.headerActions}>
              <IconButton
                icon="pencil"
                mode="contained"
                onPress={() =>
                  router.push({
                    pathname: '/add-account',
                    params: { account: JSON.stringify(account) },
                  })
                }
              />
              <IconButton
                icon="plus"
                mode="contained"
                containerColor={theme.colors.primary}
                iconColor="#fff"
                onPress={() =>
                  router.push({
                    pathname: '/add-transaction',
                    params: { accountId: account.id },
                  })
                }
              />
            </View>
          </Card.Content>
        </Card>

        <View style={styles.sectionTransactions}>
          <Text variant="titleMedium" style={styles.sectionTitleTransactions}>
            {t('recentTransactions')}
          </Text>
          {accountTransactions.length > 0 ? (
            accountTransactions.map((tx, index) => {
              const category = categories.find((c) => c.id === tx.categoryId);
              return (
                <View key={tx.id}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/add-transaction',
                        params: {
                          transaction: JSON.stringify(tx),
                          isEditing: 'true',
                        },
                      })
                    }
                  >
                    <TransactionItem transaction={tx} category={category} />
                  </TouchableOpacity>
                  {index < accountTransactions.length - 1 && <Divider />}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyTransactions}>
              <Ionicons
                name="receipt-outline"
                size={48}
                color={theme.colors.outlineVariant}
              />
              <Text variant="bodyMedium" style={{ marginTop: 8 }}>
                {t('noTransactions')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <BannerAdComponent />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerCard: {
      margin: 16,
      marginTop: 24,
      borderRadius: 24,
      backgroundColor: theme.colors.surfaceVariant,
      paddingVertical: 24,
    },
    headerContent: {
      alignItems: 'center',
    },
    accountName: {
      fontWeight: '800',
    },
    accountType: {
      letterSpacing: 1.5,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    },
    accountBalance: {
      fontWeight: '900',
      marginTop: 8,
    },
    headerActions: {
      flexDirection: 'row',
      marginTop: 16,
      gap: 8,
    },
    sectionTransactions: {
      marginTop: 32,
      paddingHorizontal: 16,
    },
    sectionTitleTransactions: {
      fontWeight: '800',
      marginBottom: 16,
      marginLeft: 16,
    },
    emptyTransactions: {
      alignItems: 'center',
      padding: 40,
    },
  });
