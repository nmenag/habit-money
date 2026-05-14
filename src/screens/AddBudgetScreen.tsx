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
import { Button, Chip, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Budget, useStore, useTranslation } from '../store/useStore';
import { COLORS } from '../constants';
import { formatNumber } from '../utils/formatters';
import { BannerAdComponent } from '../components/BannerAdComponent';

export const AddBudgetScreen = () => {
  const params = useLocalSearchParams<{ budget?: string }>();

  const editingBudget = useMemo(() => {
    if (params.budget) {
      try {
        return JSON.parse(params.budget) as Budget;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }, [params.budget]);

  const isEditing = !!editingBudget;

  const { addBudget, editBudget, categories, currency } = useStore();
  const { t, language, translateName } = useTranslation();
  const theme = useTheme();

  const [displayAmount, setDisplayAmount] = useState(
    editingBudget ? formatNumber(editingBudget.amount, language) : '',
  );
  const [amount, setAmount] = useState(editingBudget?.amount || 0);
  const [color, setColor] = useState(editingBudget?.color || COLORS[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    editingBudget?.categoryId || null,
  );

  const handleSave = () => {
    const amountNum = amount;
    if (amountNum <= 0) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }

    if (isEditing && editingBudget) {
      editBudget({
        ...editingBudget,
        amount: amountNum,
        color: color,
        categoryId: selectedCategoryId,
      });
    } else {
      addBudget({
        id: Date.now().toString(),
        amount: amountNum,
        color: color,
        categoryId: selectedCategoryId,
        displayOrder: 0,
      });
    }

    router.back();
  };

  const handleAmountChange = (text: string) => {
    const onlyDigits = text.replace(/\D/g, '');
    if (onlyDigits === '') {
      setDisplayAmount('');
      setAmount(0);
      return;
    }
    const num = parseInt(onlyDigits, 10);
    setAmount(num);
    const separator = language === 'es' ? '.' : ',';
    setDisplayAmount(onlyDigits.replace(/\B(?=(\d{3})+(?!\d))/g, separator));
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
        <TextInput
          label={t('monthlyLimit')}
          value={displayAmount}
          onChangeText={handleAmountChange}
          mode="outlined"
          keyboardType="numeric"
          style={styles.amountInput}
          outlineStyle={styles.inputOutline}
          left={<TextInput.Affix text={currency + ' '} />}
        />

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {t('associatedCategory')} ({t('optional')})
          </Text>
          <View style={styles.chipsRow}>
            <Chip
              selected={!selectedCategoryId}
              onPress={() => setSelectedCategoryId(null)}
              style={styles.chip}
              mode="flat"
              showSelectedOverlay
            >
              {t('none')}
            </Chip>
            {categories.map((cat) => (
              <Chip
                key={cat.id}
                selected={selectedCategoryId === cat.id}
                onPress={() => setSelectedCategoryId(cat.id)}
                style={styles.chip}
                mode="flat"
                selectedColor={cat.color || theme.colors.primary}
                showSelectedOverlay
              >
                {translateName(cat.name)}
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
          {isEditing ? t('updateBudget') : t('saveBudget')}
        </Button>
      </ScrollView>
      <BannerAdComponent />
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
  amountInput: {
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  inputOutline: {
    borderRadius: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '800',
    marginBottom: 16,
    marginLeft: 4,
  },
  chipsRow: {
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
