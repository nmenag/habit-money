import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { FAB, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { AccountCard } from '../components/AccountCard';
import { Account, useStore, useTranslation } from '../../../store/useStore';

export const AccountsScreen = () => {
  const accounts = useStore((s) => s.accounts);
  const deleteAccount = useStore((s) => s.deleteAccount);
  const updateAccountsOrder = useStore((s) => s.updateAccountsOrder);

  const { t } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const handleAddAccount = useCallback(() => {
    router.push('/add-account');
  }, []);

  const handleAccountPress = useCallback((id: string) => {
    router.push({
      pathname: '/account-detail',
      params: { accountId: id },
    });
  }, []);

  const handleDeleteAccount = useCallback(
    (id: string) => {
      deleteAccount(id);
    },
    [deleteAccount],
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Account>) => (
      <ScaleDecorator>
        <AccountCard
          account={item}
          onDelete={
            accounts.length > 1 ? () => handleDeleteAccount(item.id) : undefined
          }
          onPress={() => handleAccountPress(item.id)}
          onLongPress={drag}
          isActive={isActive}
        />
      </ScaleDecorator>
    ),
    [accounts.length, handleDeleteAccount, handleAccountPress],
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <DraggableFlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => updateAccountsOrder(data)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 140 },
        ]}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="wallet-outline"
              size={64}
              color={theme.colors.outlineVariant}
            />
            <Text
              variant="bodyLarge"
              style={[styles.emptyText, { color: theme.colors.outline }]}
            >
              {t('noAccounts')}
            </Text>
          </View>
        }
      />

      <BannerAdComponent />

      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            bottom: (insets.bottom || 0) + 120,
            backgroundColor: theme.colors.primary,
          },
        ]}
        color="#fff"
        onPress={handleAddAccount}
      />
    </View>
  );
};

const defaultStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listContent: {
      padding: 16,
    },
    empty: {
      padding: 40,
      alignItems: 'center',
      marginTop: 80,
    },
    emptyText: {
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    fab: {
      position: 'absolute',
      right: 16,
      borderRadius: 16,
      elevation: 6,
    },
  });
