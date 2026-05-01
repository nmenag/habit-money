import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  Chip,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Account,
  AccountType,
  useStore,
  useTranslation,
} from '../store/useStore';
import { CURRENCIES, COLORS } from '../constants';
import { formatNumber } from '../utils/formatters';
import { getLocalISOString } from '../utils/dateUtils';

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

  const { addAccount, editAccount, addTransaction } = useStore();
  const { t, language } = useTranslation();
  const theme = useTheme();

  const [name, setName] = useState(editingAccount?.name || '');
  const [type, setType] = useState<AccountType>(editingAccount?.type || 'cash');
  const [displayBalance, setDisplayBalance] = useState(
    editingAccount ? formatNumber(editingAccount.currentBalance, language) : '',
  );
  const [balance, setBalance] = useState(editingAccount?.currentBalance || 0);
  const [color, setColor] = useState(editingAccount?.color || COLORS[0]);
  const [selectedCurrency, setSelectedCurrency] = useState(
    editingAccount?.currency || 'COP',
  );

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
        currency: selectedCurrency,
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
        currency: selectedCurrency,
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

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 20) + 40 },
        ]}
      >
        <View style={styles.inputGroup}>
          <TextInput
            label={t('accountName')}
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            placeholder={t('accountNamePlaceholder')}
          />

          <View style={styles.segmentedContainer}>
            <SegmentedButtons
              value={type}
              onValueChange={(v) => setType(v as AccountType)}
              buttons={[
                { value: 'cash', label: t('cash') },
                { value: 'bank', label: t('bank') },
                { value: 'credit', label: t('credit') },
              ]}
            />
          </View>

          <TextInput
            label={
              isEditing ? t('currentBalanceLabel') : t('initialBalanceLabel')
            }
            value={displayBalance}
            onChangeText={handleBalanceChange}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            left={<TextInput.Affix text={selectedCurrency + ' '} />}
          />
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('currency')}
          </Text>
          <View style={styles.chipsContainer}>
            {CURRENCIES.map((c) => (
              <Chip
                key={c.code}
                selected={selectedCurrency === c.code}
                onPress={() => setSelectedCurrency(c.code)}
                style={styles.chip}
                showSelectedOverlay
                mode="flat"
              >
                {c.code}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('color')}
          </Text>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c },
                  color === c && {
                    borderColor: theme.colors.primary,
                    borderWidth: 3,
                  },
                ]}
                onPress={() => setColor(c)}
              >
                {color === c && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
          labelStyle={styles.saveBtnLabel}
        >
          {isEditing ? t('updateAccount') : t('saveAccount')}
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  inputOutline: {
    borderRadius: 16,
  },
  segmentedContainer: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 12,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    margin: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtn: {
    borderRadius: 20,
    marginTop: 32,
    elevation: 2,
  },
  saveBtnContent: {
    height: 56,
  },
  saveBtnLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});
