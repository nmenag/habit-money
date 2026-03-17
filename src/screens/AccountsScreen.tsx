import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FAB, IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountCard } from '../components/AccountCard';
import { useStore, useTranslation } from '../store/useStore';

export const AccountsScreen = ({ navigation }: any) => {
  const { accounts, deleteAccount } = useStore();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = defaultStyles(theme);

  const handleAddAccount = () => {
    navigation.navigate('AddAccount');
  };

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AddAccount', { account: item })}
          >
            <AccountCard
              account={item}
              onDelete={
                accounts.length > 1 ? () => deleteAccount(item.id) : undefined
              }
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text
              variant="bodyLarge"
              style={[styles.emptyText, { color: theme.colors.outline }]}
            >
              {t('noAccounts')}
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: (insets.bottom || 0) + 80 }]}
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
      borderRadius: 20,
      elevation: 4,
    },
  });
