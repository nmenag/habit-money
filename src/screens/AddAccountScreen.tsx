import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Account, AccountType, useStore, useTranslation } from '../store/useStore';

const COLORS = [
  '#f44336',
  '#e91e63',
  '#9c27b0',
  '#673ab7',
  '#3f51b5',
  '#2196f3',
  '#00bcd4',
  '#009688',
  '#4caf50',
  '#ff9800',
  '#795548',
  '#607d8b',
];

export const AddAccountScreen = ({ route, navigation }: any) => {
  const editingAccount = route.params?.account as Account | undefined;
  const isEditing = !!editingAccount;

  const { addAccount, editAccount, addTransaction, currency } = useStore();
  const { t, language } = useTranslation();

  const [name, setName] = useState(editingAccount?.name || '');
  const [type, setType] = useState<AccountType>(editingAccount?.type || 'cash');
  const [balance, setBalance] = useState(
    editingAccount ? editingAccount.currentBalance.toString() : '',
  );
  const [color, setColor] = useState(editingAccount?.color || COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('enterAccountName'));
      return;
    }

    const balanceNum = parseFloat(balance);
    if (balance !== '' && isNaN(balanceNum)) {
      Alert.alert(t('error'), t('enterValidBalance'));
      return;
    }

    const finalBalance = isNaN(balanceNum) ? 0 : balanceNum;

    if (isEditing) {
      editAccount({
        ...editingAccount,
        name: name.trim(),
        type: type,
        color: color,
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
          date: new Date().toISOString(),
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
      });
    }

    navigation.goBack();
  };

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 20) },
      ]}
    >
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('accountName')}</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Checking Wallet"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('accountType')}</Text>
        <View style={styles.typeSelector}>
          {(['cash', 'bank', 'credit'] as const).map((at) => (
            <TouchableOpacity
              key={at}
              style={[styles.typeBtn, type === at && styles.activeTypeBtn]}
              onPress={() => setType(at)}
            >
              <Text
                style={[styles.typeText, type === at && styles.activeTypeText]}
              >
                {t(at)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          {isEditing
            ? `${t('currentBalanceLabel')} (${currency})`
            : `${t('initialBalanceLabel')} (${currency})`}
        </Text>
        <TextInput
          style={styles.textInput}
          placeholder="0.00"
          value={balance}
          onChangeText={setBalance}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('color')}</Text>
        <View style={styles.colorContainer}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorCircle,
                { backgroundColor: c },
                color === c && styles.activeColorCircle,
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>
          {isEditing ? t('updateAccount') : t('saveAccount')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTypeBtn: {
    backgroundColor: '#2196f3',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  activeTypeText: {
    color: '#fff',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeColorCircle: {
    borderColor: '#333',
  },
  saveBtn: {
    backgroundColor: '#2196f3',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
