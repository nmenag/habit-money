import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Button,
  HelperText,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, useTranslation } from '../store/useStore';
import { formatNumber } from '../utils/formatters';

const COLORS = [
  '#4caf50',
  '#2196f3',
  '#ff9800',
  '#f44336',
  '#9c27b0',
  '#e91e63',
  '#00bcd4',
  '#607d8b',
];

const ICONS = [
  'trophy',
  'car',
  'home',
  'airplane',
  'cart',
  'gift',
  'school',
  'medkit',
  'star',
  'heart',
  'sunny',
  'umbrella',
];

export const AddGoalScreen = ({ route, navigation }: any) => {
  const editingGoal = route.params?.goal;
  const isEditing = !!editingGoal;

  const { addGoal, editGoal, formatCurrency } = useStore();
  const { t, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [name, setName] = useState(editingGoal?.name || '');
  const [targetAmount, setTargetAmount] = useState(
    editingGoal?.targetAmount || 0,
  );
  const [displayTargetAmount, setDisplayTargetAmount] = useState(
    editingGoal ? formatNumber(editingGoal.targetAmount, language) : '',
  );
  const [color, setColor] = useState(editingGoal?.color || COLORS[0]);
  const [icon, setIcon] = useState(editingGoal?.icon || ICONS[0]);
  const [deadline, setDeadline] = useState(editingGoal?.deadline || '');

  const handleSave = () => {
    if (!name.trim()) return;
    if (targetAmount <= 0) return;

    const goalData = {
      name,
      targetAmount,
      currentAmount: editingGoal?.currentAmount || 0,
      color,
      icon,
      deadline,
      status: ((editingGoal?.currentAmount || 0) >= targetAmount
        ? 'completed'
        : 'active') as 'active' | 'completed',
    };

    if (isEditing) {
      editGoal({ ...goalData, id: editingGoal.id });
    } else {
      addGoal(goalData);
    }
    navigation.goBack();
  };

  const handleAmountChange = (text: string) => {
    const onlyDigits = text.replace(/\D/g, '');
    if (onlyDigits === '') {
      setDisplayTargetAmount('');
      setTargetAmount(0);
      return;
    }
    const val = parseInt(onlyDigits);
    setTargetAmount(val);
    setDisplayTargetAmount(formatNumber(val, language));
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inputGroup}>
          <TextInput
            label={t('goalName')}
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            placeholder={t('goalNamePlaceholder')}
            outlineStyle={styles.inputOutline}
          />

          <TextInput
            label={t('targetAmount')}
            value={displayTargetAmount}
            onChangeText={handleAmountChange}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            left={
              <TextInput.Affix text={formatCurrency(0).replace(/[0.,]/g, '')} />
            }
            outlineStyle={styles.inputOutline}
          />

          <TextInput
            label={t('deadline') + ' (YYYY-MM-DD)'}
            value={deadline}
            onChangeText={setDeadline}
            mode="outlined"
            style={styles.input}
            placeholder="2026-12-31"
            outlineStyle={styles.inputOutline}
            right={<TextInput.Icon icon="calendar" />}
          />
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          {t('selectIcon')}
        </Text>
        <View style={styles.iconGrid}>
          {ICONS.map((i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.iconItem,
                icon === i && { backgroundColor: color, borderColor: color },
                {
                  backgroundColor:
                    icon === i ? color : theme.colors.surfaceVariant,
                },
              ]}
              onPress={() => setIcon(i)}
            >
              <Ionicons
                name={i as any}
                size={24}
                color={icon === i ? '#fff' : theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          {t('selectColor')}
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

        <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveBtn}
          contentStyle={styles.saveBtnContent}
          labelStyle={styles.saveBtnLabel}
        >
          {isEditing ? t('updateGoal') : t('saveGoal')}
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
          labelStyle={styles.cancelBtnLabel}
        >
          {t('cancel')}
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
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  inputOutline: {
    borderRadius: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '800',
    marginLeft: 4,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  iconItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
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
  cancelBtn: {
    marginTop: 8,
  },
  cancelBtnLabel: {
    fontWeight: '600',
  },
});
