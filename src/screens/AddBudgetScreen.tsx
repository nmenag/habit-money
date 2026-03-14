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
import { Budget, useStore, useTranslation } from '../store/useStore';

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

export const AddBudgetScreen = ({ route, navigation }: any) => {
  const editingBudget = route.params?.budget as Budget | undefined;
  const isEditing = !!editingBudget;

  const { addBudget, editBudget, categories } = useStore();
  const { t, language } = useTranslation();

  const [name, setName] = useState(editingBudget?.name || '');
  const [amount, setAmount] = useState(
    editingBudget ? editingBudget.amount.toString() : '',
  );
  const [color, setColor] = useState(editingBudget?.color || COLORS[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    editingBudget?.categoryId || null,
  );

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t('error'), t('enterBudgetName'));
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }

    if (isEditing && editingBudget) {
      editBudget({
        ...editingBudget,
        name: name.trim(),
        amount: amountNum,
        color: color,
        categoryId: selectedCategoryId,
      });
    } else {
      addBudget({
        id: Date.now().toString(),
        name: name.trim(),
        amount: amountNum,
        color: color,
        categoryId: selectedCategoryId,
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
        <Text style={styles.label}>{t('budgetName')}</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Monthly Groceries"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('monthlyLimit')} (USD)</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          {t('associatedCategory')} ({t('optional')})
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.categoryContainer}>
            <TouchableOpacity
              style={[
                styles.categoryChip,
                !selectedCategoryId && styles.activeCategoryChip,
              ]}
              onPress={() => setSelectedCategoryId(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  !selectedCategoryId && styles.activeCategoryChipText,
                ]}
              >
                {t('none')}
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategoryId === cat.id && styles.activeCategoryChip,
                ]}
                onPress={() => setSelectedCategoryId(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategoryId === cat.id &&
                      styles.activeCategoryChipText,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
          {isEditing ? t('updateBudget') : t('saveBudget')}
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
  amountInput: {
    fontSize: 32,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#2196f3',
    paddingVertical: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  activeCategoryChip: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  activeCategoryChipText: {
    color: '#fff',
    fontWeight: 'bold',
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
