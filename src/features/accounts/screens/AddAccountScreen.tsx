import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAdComponent } from '../../../shared/components/BannerAdComponent';
import { BottomSheet } from '../../../shared/components/BottomSheet';
import { COLORS } from '../../../constants';
import {
  Account,
  AccountType,
  useStore,
  useTranslation,
} from '../../../store/useStore';
import { AppTheme } from '../../../theme/theme';
import { getLocalISOString } from '../../../utils/dateUtils';
import { formatNumber } from '../../../utils/formatters';

export const AddAccountScreen = () => {
  const params = useLocalSearchParams<{ account?: string }>();

  const editingAccount = useMemo(() => {
    if (params.account) {
      try {
        return JSON.parse(params.account) as Account;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [params.account]);

  const isEditing = !!editingAccount;

  const {
    addAccount,
    editAccount,
    deleteAccount,
    addTransaction,
    currency,
    accounts,
  } = useStore();
  const { t, language, translateName } = useTranslation();
  const theme = useTheme<AppTheme>();
  const styles = defaultStyles(theme);
  const insets = useSafeAreaInsets();

  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState(
    editingAccount ? translateName(editingAccount.name) : '',
  );
  const [type, setType] = useState<AccountType>(editingAccount?.type || 'cash');
  const [displayBalance, setDisplayBalance] = useState(
    editingAccount ? formatNumber(editingAccount.currentBalance, language) : '',
  );
  const [balance, setBalance] = useState(editingAccount?.currentBalance || 0);
  const [color, setColor] = useState(editingAccount?.color || COLORS[0]);

  const isNameValid = name.trim().length >= 2;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('enterAccountName'));
      return;
    }

    const finalBalance = balance;

    if (isEditing) {
      editAccount({
        ...editingAccount,
        name: name.trim(),
        type: type,
        color: color,
        currency: currency,
        currentBalance: editingAccount.currentBalance,
      });

      if (finalBalance !== editingAccount.currentBalance) {
        const difference = finalBalance - editingAccount.currentBalance;
        const txType = difference > 0 ? 'income' : 'expense';

        addTransaction({
          id: Date.now().toString(),
          type: txType,
          amount: Math.abs(difference),
          categoryId: null,
          accountId: editingAccount.id,
          date: getLocalISOString(),
          note: t('balanceAdjustment'),
        });
      }
    } else {
      addAccount({
        id: Date.now().toString(),
        name: name.trim(),
        type: type,
        initialBalance: finalBalance,
        currentBalance: finalBalance,
        color: color,
        currency: currency,
        displayOrder: 0,
      });
    }

    router.back();
  };

  const handleBalanceChange = (text: string) => {
    const onlyDigits = text.replace(/\D/g, '');
    if (onlyDigits === '') {
      setDisplayBalance('');
      setBalance(0);
      return;
    }
    const num = parseInt(onlyDigits, 10);
    setBalance(num);
    const separator = language === 'es' ? '.' : ',';
    setDisplayBalance(onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, separator));
  };

  const handleDelete = () => {
    if (!editingAccount) return;
    if (accounts.length <= 1) {
      Alert.alert(t('error'), t('cannotDeleteLastAccount'));
      return;
    }

    Alert.alert(
      t('deleteAccount'),
      t('deleteAccountConfirm', { name: translateName(editingAccount.name) }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            deleteAccount(editingAccount.id);
            router.replace('/accounts');
          },
        },
      ],
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{
          title: isEditing ? t('editAccount') : t('addAccount'),
          headerRight: () =>
            isEditing ? (
              <TouchableOpacity
                onPress={() => setMenuOpen(true)}
                style={{ padding: 8, marginRight: -8 }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={22}
                  color={theme.colors.onSurface}
                />
              </TouchableOpacity>
            ) : null,
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {t('accountName')}
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.inputField}
              placeholder={t('accountNamePlaceholder')}
              outlineColor={theme.dark ? '#11221D' : '#E2E8F0'}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              placeholderTextColor={theme.colors.outline}
            />
            {name.length > 0 && !isNameValid && (
              <Text
                style={{
                  color: theme.colors.error,
                  fontSize: 11,
                  marginTop: 4,
                  fontWeight: '600',
                }}
              >
                {t('nameMinLengthError')}
              </Text>
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {t('type') || 'ACCOUNT TYPE'}
            </Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.typeCard,
                  type === 'cash' && styles.typeCardActive,
                  {
                    backgroundColor: theme.dark ? '#0A110F' : '#FFFFFF',
                    borderColor:
                      type === 'cash'
                        ? theme.colors.primary
                        : theme.dark
                          ? '#11221D'
                          : '#E2E8F0',
                  },
                ]}
                onPress={() => setType('cash')}
              >
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={
                    type === 'cash'
                      ? theme.colors.primary
                      : theme.colors.outline
                  }
                />
                <Text
                  style={[
                    styles.typeText,
                    type === 'cash' && {
                      color: theme.colors.primary,
                      fontWeight: '800',
                    },
                  ]}
                >
                  {t('cash')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.typeCard,
                  type === 'bank' && styles.typeCardActive,
                  {
                    backgroundColor: theme.dark ? '#0A110F' : '#FFFFFF',
                    borderColor:
                      type === 'bank'
                        ? theme.colors.primary
                        : theme.dark
                          ? '#11221D'
                          : '#E2E8F0',
                  },
                ]}
                onPress={() => setType('bank')}
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={
                    type === 'bank'
                      ? theme.colors.primary
                      : theme.colors.outline
                  }
                />
                <Text
                  style={[
                    styles.typeText,
                    type === 'bank' && {
                      color: theme.colors.primary,
                      fontWeight: '800',
                    },
                  ]}
                >
                  {t('bank')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.typeCard,
                  type === 'credit' && styles.typeCardActive,
                  {
                    backgroundColor: theme.dark ? '#0A110F' : '#FFFFFF',
                    borderColor:
                      type === 'credit'
                        ? theme.colors.primary
                        : theme.dark
                          ? '#11221D'
                          : '#E2E8F0',
                  },
                ]}
                onPress={() => setType('credit')}
              >
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={
                    type === 'credit'
                      ? theme.colors.primary
                      : theme.colors.outline
                  }
                />
                <Text
                  style={[
                    styles.typeText,
                    type === 'credit' && {
                      color: theme.colors.primary,
                      fontWeight: '800',
                    },
                  ]}
                >
                  {t('credit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {isEditing
                ? t('currentBalanceLabel' as any) || 'CURRENT BALANCE'
                : t('initialBalance' as any) || 'STARTING BALANCE'}
            </Text>
            <TextInput
              value={displayBalance}
              onChangeText={handleBalanceChange}
              mode="outlined"
              keyboardType="numeric"
              style={styles.inputField}
              outlineColor={theme.dark ? '#11221D' : '#E2E8F0'}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              placeholder="0"
              placeholderTextColor={theme.colors.outline}
              left={<TextInput.Affix text={`${currency} `} />}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={[styles.fieldLabel, { color: theme.colors.outline }]}>
              {t('color')}
            </Text>
            <View style={styles.colorPaletteRow}>
              {COLORS.map((c) => {
                const isActiveColor = color === c;
                return (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={0.8}
                    style={[
                      styles.colorCircle,
                      {
                        backgroundColor: c,
                        borderColor: isActiveColor
                          ? theme.colors.primary
                          : 'transparent',
                        borderWidth: isActiveColor ? 3.5 : 0,
                      },
                    ]}
                    onPress={() => setColor(c)}
                  >
                    {isActiveColor && (
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!isNameValid}
          style={[
            styles.saveBtn,
            {
              backgroundColor: isNameValid
                ? color
                : theme.colors.outlineVariant,
            },
          ]}
          contentStyle={styles.btnContent}
          labelStyle={styles.btnLabel}
        >
          {isEditing ? t('updateAccount') : t('saveAccount')}
        </Button>
      </ScrollView>

      <BannerAdComponent />

      <BottomSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('accountOptions')}
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuOpen(false);
              handleDelete();
            }}
            accessibilityRole="button"
            accessibilityLabel={t('delete') || 'Delete account'}
          >
            <Ionicons
              name="trash-outline"
              size={22}
              color={theme.colors.error}
              style={{ marginRight: 16 }}
            />
            <Text style={[styles.menuItemText, { color: theme.colors.error }]}>
              {t('delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
};

const defaultStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark ? '#11221D' : '#E2E8F0',
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    content: {
      padding: 16,
    },
    formSection: {
      gap: 20,
      marginBottom: 28,
    },
    fieldContainer: {
      gap: 8,
    },
    fieldLabel: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.5,
      paddingLeft: 4,
    },
    inputField: {
      fontSize: 15,
      fontWeight: '700',
      backgroundColor: 'transparent',
    },
    typeSelectorRow: {
      flexDirection: 'row',
      gap: 10,
    },
    typeCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1.5,
      gap: 8,
    },
    typeCardActive: {
      borderWidth: 2.2,
    },
    typeText: {
      fontSize: 13,
      fontWeight: '600',
    },
    colorPaletteRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingTop: 4,
    },
    colorCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveBtn: {
      borderRadius: 16,
      marginTop: 8,
    },
    btnContent: {
      height: 52,
    },
    btnLabel: {
      fontSize: 15,
      fontWeight: '800',
      color: '#fff',
    },
    menuContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 24,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderRadius: 16,
      marginVertical: 2,
    },
    menuItemText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });
